<template>
  <v-app class="dashboard-app">
    <!-- === SIDEBAR (Navigation Drawer) === -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      color="#1e5a3d"
      theme="dark"
      app
      class="sidebar-drawer"
      :elevation="12"
      :width="drawerWidth"
      :class="{ 'sidebar-fixed': !isMobile }"
    >
      <v-list-item class="pa-4 d-flex justify-center">
        <v-img
          src="/unnamed.jpg"
          alt="Logo Sistema de Gestión de Constancias"
          class="sidebar-logo"
          width="140"
          contain
        ></v-img>
      </v-list-item>

      <v-divider></v-divider>

      <!-- === LINKS DINÁMICOS DEL SIDEBAR === -->
      <!--
        Aquí está la magia: iteramos sobre el getter 'sidebarLinks'
        de nuestro store. El store decide qué links mostrar.
      -->
      <v-list density="compact" nav class="sidebar-links">
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
        <div class="pa-4 sidebar-footer">
          <v-card class="rounded-lg" color="rgba(255, 255, 255, 0.1)" variant="flat">
            <v-card-text>
              <div class="font-weight-bold">{{ auth.user.name }}</div>
              <div class="text-caption">{{ auth.user.role }}</div>
            </v-card-text>
          </v-card>

          <v-btn @click="handleLogout" variant="text" prepend-icon="mdi-logout" block class="mt-2">
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
    <v-main class="dashboard-main" :style="mainStyle">
      <!--
        Aquí es donde Vue Router inyectará las páginas
        (SolicitudesPage, AdminPage, etc.)
      -->
      <router-view v-slot="{ Component }">
        <div class="dashboard-container">
          <!-- Transición opcional entre páginas -->
          <v-fade-transition mode="out-in">
            <component :is="Component" />
          </v-fade-transition>
        </div>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const { name } = useDisplay()
const router = useRouter()

// Control del sidebar en móviles
const drawer = ref(true)
const isMobile = computed(() => name.value === 'xs' || name.value === 'sm')
const drawerWidth = computed(() => (isMobile.value ? 220 : 256))
const mainStyle = computed(() =>
  isMobile.value
    ? {}
    : {
        marginLeft: `${drawerWidth.value}px`,
        width: `calc(100% - ${drawerWidth.value}px)`,
        maxWidth: 'none',
        marginRight: '0',
        display: 'flex',
        justifyContent: 'flex-start',
      },
)

// En móvil, el sidebar empieza cerrado
if (isMobile.value) {
  drawer.value = false
}

watchEffect(() => {
  if (!isMobile.value) {
    drawer.value = true
  }
})

const handleLogout = async () => {
  await auth.logout()
  router.push('/')
}
</script>

<style scoped>
/* Estilos para que el link activo se vea bien */
.v-list-item--active {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.sidebar-logo {
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

.sidebar-drawer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
}

.sidebar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 10;
}

.sidebar-links {
  flex: 1 1 auto;
  overflow-y: auto;
  padding-bottom: 8px;
}

.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.dashboard-app {
  min-height: 100vh;
  display: flex;
  background-color: #eef2f0;
  overflow: hidden;
}

.dashboard-main {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(180deg, #f4f7f6 0%, #eef2f0 100%);
  display: flex;
  align-items: flex-start;
  padding: 0;
}

.dashboard-container {
  padding: 8px 12px;
  min-height: 100%;
  width: 100%;
}
</style>
