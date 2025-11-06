// src/plugins/vuetify.ts

// Importa los estilos de Vuetify
import 'vuetify/styles'

// Importa el set de íconos (MDI en este caso)
import '@mdi/font/css/materialdesignicons.css'

// Importa las funciones de Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// TEMA PERSONALIZADO BASADO EN TU CSS
const miTemaProfesional = {
  dark: false,
  colors: {
    background: '#FFFFFF', // Blanco
    surface: '#FFFFFF', // Blanco
    primary: '#1e5a3d', // Tu verde principal
    'primary-darken-1': '#164d32', // Tu verde más oscuro
    secondary: '#424242',
    // ... otros colores si los necesitas
  }
}

// Configura y crea la instancia de Vuetify
const vuetify = createVuetify({
  components,
  directives,
  // Configura tu tema
  theme: {
    defaultTheme: 'miTemaProfesional',
    themes: {
      miTemaProfesional,
    },
  },
  // Configuración de íconos
  icons: {
    defaultSet: 'mdi', // Usa Material Design Icons
  },
})

export default vuetify
