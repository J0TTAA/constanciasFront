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
    host: '127.0.0.1', // Usar IPv4 explícitamente para evitar problemas con ::1 (IPv6)
    port: 3000, // Cambiado a 3000 para evitar problemas de permisos en Windows
    proxy: {
      // Proxy para todas las rutas de la API (puerto 3020)
      '/api/v1': {
        target: 'http://127.0.0.1:3020', // Usar IPv4 explícitamente
        changeOrigin: true,
        secure: false,
        // Reescribir la URL para mantener el path completo
        rewrite: (path) => path,
        // Configuración adicional para mejorar la conexión
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('⚠️ [Vite Proxy] Error de conexión con el backend:', err.message)
            console.log('💡 Asegúrate de que el backend esté corriendo en http://127.0.0.1:3020')
            // No enviar respuesta si ya se envió
            if (!res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'application/json',
              })
              res.end(
                JSON.stringify({
                  error: 'Backend no disponible',
                  message: 'El servidor backend no está corriendo. Por favor, inicia el backend en el puerto 3020.',
                })
              )
            }
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`🔄 [Vite Proxy] ${req.method} ${req.url} → http://127.0.0.1:3020${req.url}`)
          })
        },
      },
    },
  },
})
