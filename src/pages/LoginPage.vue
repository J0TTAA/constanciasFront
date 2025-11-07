<template>
  <v-app>
    <!--
      Usamos v-main para centrar todo.
      El gradiente ahora se aplica con una clase de CSS para más control.
    -->
    <v-main class="d-flex align-center justify-center pa-4 gradient-background">
      <v-responsive max-width="448">
        <!--
          Vuetify usa v-card, que es equivalente a tu Card de React.
          Usamos 'elevation-12' para una sombra pronunciada y 'rounded-xl'
        -->
        <v-card class="rounded-xl" elevation="12">
          <!--
            v-card-title y v-card-subtitle equivalen a tu CardHeader y CardDescription
          -->
          <v-card-title class="pa-6 pb-2 text-center" style="line-height: 1.4">
            <!-- Logo -->
            <div class="d-flex justify-center mb-5">
              <v-img
                src="/logoufro.png"
                alt="Logo Sistema de Gestión de Constancias"
                width="72"
                height="72"
                class="login-logo"
                contain
              ></v-img>
            </div>

            <!-- Título -->
            <h1
              class="text-h6 text-wrap font-weight-bold"
              style="color: #1e5a3d; font-family: 'Merriweather', serif"
            >
              Sistema de Gestión de Constancias
            </h1>
          </v-card-title>

          <v-card-subtitle
            class="text-center text-wrap"
            style="color: #1e5a3d; font-family: 'Merriweather', serif"
          >
            Doctorado en Ciencias de Recursos Naturales
          </v-card-subtitle>

          <!--
            v-card-text equivale a CardContent.
            Usamos v-form para manejar el submit.
          -->
          <v-card-text class="pa-6">
            <!--
              v-form nos da validación y un evento @submit.prevent
              que es el equivalente a onSubmit de React.
            -->
            <v-form @submit.prevent="handleSubmit">
              <!-- Campo de Email -->
              <v-text-field
                v-model="email"
                label="Correo Electrónico"
                type="email"
                prepend-inner-icon="mdi-email-outline"
                variant="outlined"
                :rules="[rules.required, rules.email]"
                required
              ></v-text-field>

              <!-- Campo de Contraseña -->
              <v-text-field
                v-model="password"
                label="Contraseña"
                type="password"
                prepend-inner-icon="mdi-lock-outline"
                variant="outlined"
                :rules="[rules.required]"
                required
                class="mt-3"
              ></v-text-field>

              <!-- Alerta de Error -->
              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                class="mt-2 mb-3 text-caption"
                density="compact"
              >
                {{ error }}
              </v-alert>

              <!-- Botón de Ingreso -->
              <v-btn
                :loading="isLoading"
                :disabled="isLoading"
                type="submit"
                color="primary"
                size="large"
                block
                class="mt-4"
                style="font-family: 'Merriweather', serif; text-transform: none"
              >
                Ingresar
              </v-btn>
            </v-form>

            <p
              class="text-center text-caption text-disabled mt-6"
              style="font-family: 'Merriweather', serif"
            >
              © 2025 Universidad de La Frontera. Prototipo.
            </p>
          </v-card-text>
        </v-card>
      </v-responsive>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router' // <-- IMPORTAMOS el router
import { useAuthStore } from '@/stores/auth' // Importamos el store

// --- LÓGICA (Reemplaza a useState) ---
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null) // Para mostrar errores de login

// --- OBTENER INSTANCIAS ---
const router = useRouter() // Obtenemos el router para navegar
const auth = useAuthStore() // Obtenemos el store

// --- MANEJADOR DE SUBMIT (Formulario) ---
const handleSubmit = async () => {
  isLoading.value = true
  error.value = null

  try {
    // Llamamos a la acción del store, que ahora es asíncrona
    const loginExitoso = await auth.login(email.value, password.value)

    if (loginExitoso) {
      // --- NAVEGACIÓN ---
      // Si el login fue exitoso, el *componente* nos redirige.
      // Redirigimos a la primera página de nuestro dashboard.
      await router.push('/dashboard/solicitudes')
    } else {
      // Si el store devuelve false, mostramos un error
      error.value = 'Correo electrónico o contraseña incorrectos.'
    }
  } catch (err) {
    // Si la API falla (simulado o real), mostramos un error
    console.error(err)
    error.value = 'Ocurrió un error inesperado. Intente de nuevo.'
  } finally {
    // Esto se ejecuta siempre, al éxito o al error
    isLoading.value = false
  }
}

// --- Reglas de Validación de Vuetify ---
const rules = {
  required: (value: string) => !!value || 'Este campo es requerido.',
  email: (value: string) => {
    const pattern = /.+@.+\..+/
    return pattern.test(value) || 'Debe ser un correo válido.'
  },
}
</script>

<style scoped>
/* Estilo para el fondo degradado,
  idéntico al que tenías en React.
*/
.gradient-background {
  background: linear-gradient(to bottom, #1e5a3d, #164d32);
}

.login-logo {
  border-radius: 16px;

  padding: 8px;
}
</style>
