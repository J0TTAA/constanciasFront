import { createRouter, createWebHistory } from 'vue-router'
import type { RouteMeta } from 'vue-router' // 1. IMPORTAMOS RouteMeta
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
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/pages/AuthCallback.vue'),
      meta: { requiresAuth: false },
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
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Guardamos los valores en variables para más claridad
  const isLoggedIn = auth.isLoggedIn
  const userRole = auth.user.role // Esto es 'string | null'
  const targetRoles = to.meta.roles // Esto es 'string[] | undefined'

  // --- 1. ¿La ruta requiere autenticación? ---
  if (to.meta.requiresAuth && !isLoggedIn) {
    // Si la requiere Y NO está logueado, lo mandamos al login
    return next({ name: 'login' })
  }

  if (to.name === 'login' && isLoggedIn) {
    return next({ name: 'dashboard-solicitudes' })
  }

  // --- 2. ¿La ruta requiere roles? ---
  // Si la ruta define 'roles' Y el usuario TIENE un 'rol'
  if (targetRoles && userRole) {
    // TypeScript ahora sabe que userRole NO es null aquí
    if (!targetRoles.includes(userRole)) {
      // Si el usuario tiene un rol, pero NO es el correcto...
      // lo mandamos a la página principal del dashboard
      return next({ name: 'dashboard-solicitudes' })
    }
  }

  // --- 3. Si todo está bien, dejamos que continúe ---
  next()
})

export default router
