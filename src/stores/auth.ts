import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuth0 } from '@auth0/auth0-vue'
// import { useRouter } from 'vue-router' // <-- ¡NO LO IMPORTAMOS AQUÍ! Es mala práctica.

// --- 1. ARREGLO DEL ERROR DE TYPESCRIPT ---
// Permitimos que name y email también sean 'null'
interface SidebarLink {
  title: string
  icon: string
  to: string
}

interface User {
  name: string | null // <-- ARREGLO
  email: string | null // <-- ARREGLO
  role: 'Estudiante' | 'Secretaria' | 'Director' | 'Administrador' | null
}

export const useAuthStore = defineStore('auth', () => {
  const auth0 = useAuth0()

  // --- STATE ---
  const user = ref<User>({
    name: null,
    email: null,
    role: null,
  })
  const token = ref<string | null>(null)
  const errorMessage = ref<string | null>(null)
  // const router = useRouter() // <-- LO QUITAMOS. La navegación la hacen los componentes.

  // --- GETTERS ---
  //
  // --- 2. ARREGLO DEL BUG DEL LOGIN ---
  // Comprobamos el 'role' del usuario, no solo el objeto 'user'
  const isLoggedIn = computed(() => !!token.value)

  const sidebarLinks = computed(() => {
    const links: SidebarLink[] = []
    const role = user.value.role

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
  })

  // --- ACTIONS ---

  function extractRoleFromAuth0Claims(auth0User: Record<string, unknown>): User['role'] {
    const claimKey = import.meta.env.VITE_AUTH0_ROLE_CLAIM

    if (!claimKey) return null

    const claimValue = auth0User?.[claimKey]

    const normalizedClaim = Array.isArray(claimValue) ? claimValue[0] : claimValue

    if (typeof normalizedClaim !== 'string') return null

    const allowedRoles: User['role'][] = ['Estudiante', 'Secretaria', 'Director', 'Administrador']

    return allowedRoles.includes(normalizedClaim as User['role']) ? (normalizedClaim as User['role']) : null
  }

  function setSessionFromAuth0(
    auth0User: Record<string, unknown> | null | undefined,
    rawToken?: string | null
  ) {
    if (!auth0User) {
      clearSession()
      return
    }

    user.value = {
      name: (auth0User.name as string | undefined) ?? null,
      email: (auth0User.email as string | undefined) ?? null,
      role: extractRoleFromAuth0Claims(auth0User),
    }

    const resolvedToken =
      rawToken ??
      (typeof auth0User.sub === 'string' ? (auth0User.sub as string) : null) ??
      'auth0-session'

    token.value = resolvedToken
    errorMessage.value = null
  }

  function clearSession() {
    user.value = { name: null, email: null, role: null }
    token.value = null
    errorMessage.value = null
    // El DashboardLayout.vue se encargará de redirigir
  }

  function captureError(err: unknown) {
    console.error(err)
    errorMessage.value = err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
  }

  function clearError() {
    errorMessage.value = null
  }

  async function logout() {
    try {
      const logoutUrl =
        import.meta.env.VITE_AUTH0_LOGOUT_URL ?? window.location.origin

      await auth0.logout({
        logoutParams: {
          returnTo: logoutUrl,
        },
      })
    } finally {
      clearSession()
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    errorMessage,
    sidebarLinks,
    setSessionFromAuth0,
    clearSession,
    captureError,
    clearError,
    logout,
  }
})
