import { createApp } from "vue"
import { createPinia } from "pinia"
import vuetify from "./plugins/vuetify"
import App from "./App.vue"
import router from "./router"
import { useAuthStore } from "@/stores/auth"

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const auth = useAuthStore()

// 🔵 Cargar datos del usuario ANTES de iniciar el router
await auth.loadFromStorage()

app.use(router)
app.use(vuetify)

app.mount("#app")
