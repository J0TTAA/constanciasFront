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
            <div class="d-flex flex-column gap-3">
              <v-btn
                :loading="isLoading"
                :disabled="isLoading"
                color="primary"
                size="large"
                block
                class="mt-2"
                style="font-family: 'Merriweather', serif; text-transform: none"
                @click="login"
              >
                Ingresar con Auth0
              </v-btn>

              <v-btn
                variant="outlined"
                size="large"
                block
                style="font-family: 'Merriweather', serif; text-transform: none"
                @click="register"
              >
                Crear cuenta
              </v-btn>
            </div>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mt-4 text-caption"
              density="compact"
            >
              {{ error }}
            </v-alert>

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
import { computed } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useAuthStore } from '@/stores/auth'

const auth0 = useAuth0()
const auth = useAuthStore()

const isLoading = computed(() => auth0.isLoading.value)
const error = computed(() => auth.errorMessage)

const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI

const login = async () => {
  auth.clearError()

  try {
    await auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: redirectUri,
      },
    })
  } catch (err) {
    auth.captureError(err)
  }
}

const register = async () => {
  auth.clearError()

  try {
    await auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: redirectUri,
        screen_hint: 'signup',
      },
    })
  } catch (err) {
    auth.captureError(err)
  }
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
