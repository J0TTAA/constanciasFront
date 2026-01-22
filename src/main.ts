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
