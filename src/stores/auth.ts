import { defineStore } from 'pinia'

interface SidebarLink {
  title: string
  icon: string
  to: string
}

interface User {
  name?: string | null
  email?: string | null
  role?: 'Estudiante' | 'Secretaria' | 'Director' | 'Administrador' | null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    isLoggedIn: false,
    initialized: false, // ← CLAVE PARA EVITAR EL PARPADEO
    errorMessage: null as string | null,
  }),

  getters: {
    sidebarLinks(): SidebarLink[] {
      const links: SidebarLink[] = []
      const role = this.user?.role

      if (!role) return []

      // Links para Estudiante (y todos los roles superiores)
      if (['Estudiante', 'Secretaria', 'Director', 'Administrador'].includes(role)) {
        links.push({
          title: 'Solicitudes',
          icon: 'mdi-file-document-outline',
          to: '/dashboard/solicitudes',
        })
        links.push({
          title: 'Asignaturas',
          icon: 'mdi-book-open-variant',
          to: '/dashboard/asignaturas',
        })
      }

      // Links para Secretaria, Director y Admin
      if (['Secretaria', 'Director', 'Administrador'].includes(role)) {
        links.push({
          title: 'Informes ANID',
          icon: 'mdi-chart-bar',
          to: '/dashboard/informes',
        })
      }

      // Link solo para Administrador
      if (role === 'Administrador') {
        links.push({
          title: 'Administración',
          icon: 'mdi-cog',
          to: '/dashboard/admin',
        })
      }

      return links
    },
  },

  actions: {
    async loadFromStorage() {
      const data = localStorage.getItem('auth')

      if (data) {
        const parsed = JSON.parse(data)
        this.user = parsed.user
        this.token = parsed.token
        this.isLoggedIn = parsed.isLoggedIn
      }

      this.initialized = true // ← Indica que ya cargó
    },

    login(user: User) {
      this.user = user
      this.isLoggedIn = true
      localStorage.setItem('auth', JSON.stringify({ user, isLoggedIn: true }))
    },

    extractRoleFromAuth0Claims(auth0User: Record<string, unknown>): User['role'] {
      const claimKey = import.meta.env.VITE_AUTH0_ROLE_CLAIM

      if (!claimKey) return null

      const claimValue = auth0User?.[claimKey]

      const normalizedClaim = Array.isArray(claimValue) ? claimValue[0] : claimValue

      if (typeof normalizedClaim !== 'string') return null

      const allowedRoles: User['role'][] = ['Estudiante', 'Secretaria', 'Director', 'Administrador']

      return allowedRoles.includes(normalizedClaim as User['role'])
        ? (normalizedClaim as User['role'])
        : null
    },

    setSessionFromAuth0(
      auth0User: Record<string, unknown> | null | undefined,
      rawToken?: string | null,
    ) {
      if (!auth0User) {
        this.clearSession()
        return
      }

      this.user = {
        name: (auth0User.name as string | undefined) ?? null,
        email: (auth0User.email as string | undefined) ?? null,
        role: this.extractRoleFromAuth0Claims(auth0User),
      }

      const resolvedToken =
        rawToken ??
        (typeof auth0User.sub === 'string' ? (auth0User.sub as string) : null) ??
        'auth0-session'

      this.token = resolvedToken
      this.isLoggedIn = true
      this.errorMessage = null

      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: this.user,
          token: this.token,
          isLoggedIn: true,
        }),
      )
    },

    clearSession() {
      this.user = null
      this.token = null
      this.isLoggedIn = false
      this.errorMessage = null
      localStorage.removeItem('auth')
    },

    captureError(err: unknown) {
      console.error(err)
      this.errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
    },

    clearError() {
      this.errorMessage = null
    },

    async logout(auth0Instance?: {
      logout: (options: { logoutParams: { returnTo: string } }) => Promise<void>
    }) {
      try {
        if (auth0Instance) {
          const logoutUrl = import.meta.env.VITE_AUTH0_LOGOUT_URL ?? window.location.origin

          await auth0Instance.logout({
            logoutParams: {
              returnTo: logoutUrl,
            },
          })
        }
      } catch (error) {
        console.error('Error al cerrar sesión con Auth0:', error)
      } finally {
        this.clearSession()
      }
    },
  },
})
