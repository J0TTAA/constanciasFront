<template>
  <div>
    <h1 class="text-h4">Panel de Administración</h1>
    <p class="mt-2">Gestión completa de las entidades del sistema.</p>

    <!--
      El 'router' (en index.ts) ya hizo el trabajo de
      proteger esta página.

      Si estás viendo esto, es porque tu rol es 'Administrador'.
    -->
    <v-alert
      type="success"
      variant="tonal"
      class="mt-6"
      border="start"
      elevation="2"
      icon="mdi-shield-check"
    >
      Estás viendo esta página porque tu rol es
      <strong>'Administrador'</strong>. El "Guardia de Ruta" (Route Guard) ha
      funcionado correctamente.
    </v-alert>

    <!-- Aquí puedes agregar la lógica para gestionar usuarios, etc. -->
  </div>
</template>

<script setup lang="ts">
// No necesitas lógica extra aquí, el router ya hizo la protección.
// Puedes importar tu store si necesitas datos, ej:
// import { useAuthStore } from '@/stores/auth'
// const auth = useAuthStore()
</script>
