import { createApp } from "vue"
import { createPinia } from "pinia"
import vuetify from "./plugins/vuetify"
import App from "./App.vue"
import router from "./router"
import { useAuthStore } from "@/stores/auth"

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Inicializar la aplicación de forma asíncrona
async function initApp() {
  try {
    console.log('🔍 [main.ts] Inicializando aplicación...')
    
    // 📋 Mostrar configuración de variables de entorno
    console.log('📋 [Configuración] Variables de entorno:')
    console.log('   - Modo:', import.meta.env.MODE)
    console.log('   - Desarrollo:', import.meta.env.DEV ? '✅ SÍ' : '❌ NO')
    console.log('   - Producción:', import.meta.env.PROD ? '✅ SÍ' : '❌ NO')
    console.log('   - VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || '(no definida)')
    console.log('   - VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ No definida')
    console.log('   - VITE_API_URL:', import.meta.env.VITE_API_URL || '(no definida)')
    console.log('   - VITE_ANON_KEY:', import.meta.env.VITE_ANON_KEY ? '✅ Definida' : '❌ No definida')
    
    // Validar configuración crítica
    if (!import.meta.env.VITE_SUPABASE_URL) {
      console.warn('⚠️ [Configuración] VITE_SUPABASE_URL no está definida')
    }
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ [Configuración] VITE_SUPABASE_ANON_KEY no está definida')
    }
    if (!import.meta.env.VITE_API_URL) {
      console.warn('⚠️ [Configuración] VITE_API_URL no está definida - se usará http://localhost:3020 por defecto')
    }
    
    const auth = useAuthStore()
    
    // 🔵 Cargar datos del usuario ANTES de iniciar el router
    await auth.loadFromStorage()
    console.log('✅ [main.ts] Store de autenticación cargado')
    
    app.use(router)
    app.use(vuetify)
    
    app.mount("#app")
    console.log('✅ [main.ts] Aplicación montada correctamente')
  } catch (error) {
    console.error('❌ [main.ts] Error al inicializar la aplicación:', error)
    // Montar la app de todas formas para que al menos se muestre algo
    app.use(router)
    app.use(vuetify)
    app.mount("#app")
  }
}

initApp()
