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

    login(user: User, token: string) {
      this.user = user
      this.token = token
      this.isLoggedIn = true
      this.errorMessage = null
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user,
          token,
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

    async logout() {
      try {
        // TODO: Implementar logout con Supabase
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
      } finally {
        this.clearSession()
      }
    },
  },
})
