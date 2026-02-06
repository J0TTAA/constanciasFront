import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // ⚠️ PROXY SOLO PARA DESARROLLO - NO ES LA SOLUCIÓN DEFINITIVA
  // Esto evita CORS en desarrollo, pero en producción el backend DEBE tener CORS configurado
  server: {
    host: 'localhost', // Usar localhost para consistencia con el backend
    port: 3000, // Cambiado a 3000 para evitar problemas de permisos en Windows
    proxy: {
      // Proxy para el backend de constancias (puerto 3020)
      '/api/v1/constancias': {
        target: 'http://localhost:3020',
        changeOrigin: true,
        secure: false,
        // Reescribir la URL para mantener el path completo
        rewrite: (path) => path,
      },
      // Proxy para el backend de usuarios (creación de usuarios por admin)
      '/api/v1/usuarios': {
        target: 'http://localhost:3020',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
})
