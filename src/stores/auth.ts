import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
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
  // --- STATE ---
  const user = ref<User>({
    name: null,
    email: null,
    role: null,
  })
  const token = ref<string | null>(null)
  // const router = useRouter() // <-- LO QUITAMOS. La navegación la hacen los componentes.

  // --- GETTERS ---
  //
  // --- 2. ARREGLO DEL BUG DEL LOGIN ---
  // Comprobamos el 'role' del usuario, no solo el objeto 'user'
  const isLoggedIn = computed(() => !!token.value && !!user.value.role)

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

  // --- 3. ARREGLO DE LA ACCIÓN LOGIN ---
  // La convertimos en 'async' y devolvemos un 'boolean'
  // para que LoginPage.vue sepa si debe navegar o no.
  async function login(email: string, password: string): Promise<boolean> {
    // Para que la advertencia 'password' desaparezca (opcional)
    console.log('Intentando login con:', email, 'y pass:', password ? '...' : 'vacío')

    // Simulamos una llamada a la API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // --- SIMULACIÓN ---
    if (email.includes('admin')) {
      user.value = { name: 'Admin', email: email, role: 'Administrador' }
    } else if (email.includes('secretaria')) {
      user.value = { name: 'Mariela Gonzalez', email: email, role: 'Secretaria' }
    } else if (email.includes('director')) {
      user.value = { name: 'Francisco Matus', email: email, role: 'Director' }
    } else if (email.includes('estudiante')) {
      user.value = { name: 'Ana Contreras', email: email, role: 'Estudiante' }
    } else {
      // Si el correo no coincide con nada, fallamos el login
      return false
    }

    token.value = 'fake-token-123'
    console.log('Login simulado con:', user.value.role) // Log para depurar
    return true // Devolvemos 'true' si el login fue exitoso
    // --- FIN SIMULACIÓN ---
  }

  // --- 4. ARREGLO DE LA ACCIÓN LOGOUT ---
  // Quitamos el 'router.push()'. El componente se encarga de eso.
  function logout() {
    user.value = { name: null, email: null, role: null }
    token.value = null
    // El DashboardLayout.vue se encargará de redirigir
  }

  return {
    user,
    token,
    isLoggedIn,
    sidebarLinks,
    login,
    logout,
  }
})
