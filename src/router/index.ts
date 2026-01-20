import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DashboardLayout from '@/components/layouts/DashboardLayout.vue'

// --- ARREGLO DEL ERROR DE TYPESCRIPT ---
// Aquí le "enseñamos" a TypeScript cómo es nuestro 'meta'
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[] // 2. Le decimos que 'roles' es un array de strings
  }
}
// --- FIN DEL ARREGLO ---

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // --- RUTA DE LOGIN ---
      path: '/',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { requiresAuth: false }, // No requiere auth para ver el login
    },
    {
      // --- RUTA PADRE "DASHBOARD" ---
      path: '/dashboard',
      component: DashboardLayout, // Carga el "cascarón"
      meta: { requiresAuth: true }, // REQUIERE auth para TODAS las rutas hijas
      children: [
        // Redirección por defecto
        {
          path: '', // /dashboard -> /dashboard/solicitudes
          redirect: '/dashboard/solicitudes',
        },
        // --- RUTAS HIJAS ---
        {
          path: 'solicitudes',
          name: 'dashboard-solicitudes',
          component: () => import('@/pages/dashboard/SolicitudesPage.vue'),
        },
        {
          path: 'asignaturas',
          name: 'dashboard-asignaturas',
          component: () => import('@/pages/dashboard/AsignaturasPage.vue'),
        },
        {
          path: 'informes',
          name: 'dashboard-informes',
          component: () => import('@/pages/dashboard/InformesPage.vue'),
        },
        {
          path: 'admin',
          name: 'dashboard-admin',
          component: () => import('@/pages/dashboard/AdminPage.vue'),
          // Meta-campo para proteger la ruta por ROL
          meta: { roles: ['Administrador'] }, // Solo Admin puede ver esto
        },
      ],
    },
  ],
})

// --- GUARDIA DE NAVEGACIÓN (VERSIÓN CORREGIDA) ---
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // 🔵 Garantiza que el store haya terminado de cargar
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const isLoggedIn = auth.isLoggedIn
  const userRole = auth.user?.role || null
  const targetRoles = to.meta.roles

  // --- 1. Rutas que requieren login ---
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'login' })
  }

  // --- 2. Usuario ya logueado intentando ir al login ---
  if (to.name === 'login' && isLoggedIn) {
    return next({ name: 'dashboard-solicitudes' })
  }

  // --- 3. Validación de roles ---
  if (targetRoles && userRole) {
    if (!targetRoles.includes(userRole)) {
      return next({ name: 'dashboard-solicitudes' })
    }
  }

  next()
})

export default router
