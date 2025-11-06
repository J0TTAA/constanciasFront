// src/main.ts

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Importa el plugin de Vuetify que creamos
import vuetify from './plugins/vuetify'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify) // <--- ¡Añade esta línea!

app.mount('#app')
