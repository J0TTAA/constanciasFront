import { defineStore } from 'pinia'

interface User {
  name?: string | null
  email?: string | null
  role?: 'Estudiante' | 'Secretaria' | 'Director' | 'Administrador' | null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false,
    initialized: false, // ← CLAVE PARA EVITAR EL PARPADEO
  }),

  actions: {
    async loadFromStorage() {
      const data = localStorage.getItem('auth')

      if (data) {
        const parsed = JSON.parse(data)
        this.user = parsed.user
        this.isLoggedIn = parsed.isLoggedIn
      }

      this.initialized = true // ← Indica que ya cargó
    },

    login(user: User) {
      this.user = user
      this.isLoggedIn = true
      localStorage.setItem('auth', JSON.stringify({ user, isLoggedIn: true }))
    },

    logout() {
      this.user = null
      this.isLoggedIn = false
      localStorage.removeItem('auth')
    },
  },
})
