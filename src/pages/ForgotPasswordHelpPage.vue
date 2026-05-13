<template>
  <v-app class="login-app">
    <v-main class="login-main gradient-background">
      <div class="login-container">
        <div class="login-center">
          <v-responsive max-width="448">
            <div class="login-logo-container">
              <v-img
                src="/images/barra-izq.png"
                alt="Barra izquierda"
                class="login-logo-above"
                contain
              />
            </div>

            <v-card class="rounded-xl" elevation="12">
              <v-card-title class="pa-6 pb-2 text-center" style="line-height: 1.4">
                <h1 class="text-h6 text-wrap font-weight-bold" style="color: #1e5a3d">
                  Ayuda de acceso
                </h1>
              </v-card-title>

              <v-card-subtitle class="text-center text-wrap pb-4" style="color: #1e5a3d">
                Recuperación de contraseña
              </v-card-subtitle>

              <v-card-text class="pa-6">
                <div class="text-center">
                  <p class="text-body-2 text-medium-emphasis mb-1">
                    Para ayuda contactar
                  </p>
                  <p class="text-body-1 font-weight-bold" style="color: #1e5a3d">
                    {{ secretariaEmail }}
                  </p>
                </div>

                <v-btn
                  color="#1e5a3d"
                  size="large"
                  block
                  class="mt-6"
                  style="text-transform: none; color: white"
                  @click="goBack"
                >
                  Volver al login
                </v-btn>

                <p class="text-center text-caption text-disabled mt-6" style="color: #1e5a3d">
                  © 2025 Universidad de La Frontera. Prototipo.
                </p>
              </v-card-text>
            </v-card>

            <div class="login-logo-container login-logo-below">
              <v-img
                src="/images/barra-der.png"
                alt="Barra derecha"
                class="login-logo-above"
                contain
              />
            </div>
          </v-responsive>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// Correo estático de secretaría (según requerimiento)
const secretariaEmail = 'secretaria@ufro.cl'

const goBack = () => {
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* Reutilizamos el look del login */
.gradient-background {
  background: #1e5a3d;
  min-height: 100vh;
}

.login-main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
}

.login-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.login-logo-below {
  margin-top: 12px;
  margin-bottom: 0;
}

.login-logo-above {
  max-width: 320px;
  width: 100%;
}
</style>

