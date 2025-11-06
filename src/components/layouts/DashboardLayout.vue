<template>
  <v-app>
    <!-- === SIDEBAR (Navigation Drawer) === -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      color="#1e5a3d"
      theme="dark"
      app
    >
      <v-list-item class="pa-4">
        <!-- Aquí puedes poner el logo que se ve en tus capturas -->
        <v-list-item-title class="text-h6 font-weight-bold">
          Mi Aplicación
        </v-list-item-title>
      </v-list-item>

      <v-divider></v-divider>

      <!-- === LINKS DINÁMICOS DEL SIDEBAR === -->
      <!--
        Aquí está la magia: iteramos sobre el getter 'sidebarLinks'
        de nuestro store. El store decide qué links mostrar.
      -->
      <v-list density="compact" nav>
        <v-list-item
          v-for="link in auth.sidebarLinks"
          :key="link.to"
          :to="link.to"
          :title="link.title"
          :prepend-icon="link.icon"
          rounded="lg"
          class="mx-2 my-1"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <!-- === PERFIL DE USUARIO === -->
        <div class="pa-4">
          <v-card class="rounded-lg" color="rgba(255, 255, 255, 0.1)" variant="flat">
            <v-card-text>
              <div class="font-weight-bold">{{ auth.user.name }}</div>
              <div class="text-caption">{{ auth.user.role }}</div>
            </v-card-text>
          </v-card>

          <v-btn
            @click="auth.logout"
            variant="text"
            prepend-icon="mdi-logout"
            block
            class="mt-2"
          >
            Cerrar Sesión
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- === BARRA SUPERIOR (App Bar) === -->
    <!-- Esto solo es visible en móviles para abrir el sidebar -->
    <v-app-bar app color="white" elevation="1" v-if="isMobile">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Sistema de Gestión</v-toolbar-title>
    </v-app-bar>

    <!-- === CONTENIDO PRINCIPAL === -->
    <v-main style="background-color: #f4f7f6">
      <!--
        Aquí es donde Vue Router inyectará las páginas
        (SolicitudesPage, AdminPage, etc.)
      -->
      <router-view v-slot="{ Component }">
        <v-container fluid class="pa-6">
          <!-- Transición opcional entre páginas -->
          <v-fade-transition mode="out-in">
            <component :is="Component" />
          </v-fade-transition>
        </v-container>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDisplay } from 'vuetify'

const auth = useAuthStore()
const { name } = useDisplay()

// Control del sidebar en móviles
const drawer = ref(true)
const isMobile = computed(() => name.value === 'xs' || name.value === 'sm')

// En móvil, el sidebar empieza cerrado
if (isMobile.value) {
  drawer.value = false
}
</script>

<style scoped>
/* Estilos para que el link activo se vea bien */
.v-list-item--active {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}
</style>
