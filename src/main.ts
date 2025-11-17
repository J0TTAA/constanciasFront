import { createApp } from "vue"
import { createPinia } from "pinia"
import { createAuth0 } from "@auth0/auth0-vue"
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
app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    },
    cacheLocation: "localstorage",
    useRefreshTokens: true,
  })
)

app.mount("#app")
