<template>
  <!--
    v-app es el componente raíz OBLIGATORIO de Vuetify.
    Sin esto, nada de Vuetify funciona (colores, layout, etc.)
  -->
  <v-app>
    <!--
      router-view es el "portal" donde Vue Router
      inyectará la página que corresponda a la ruta actual.
      En tu caso, en la ruta '/', aquí se renderizará
      tu componente LoginPage.vue
    -->
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
// No necesitamos lógica aquí
</script>

<style>
:root {
  --app-font-body: 'Lexend', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --app-font-title: 'Montserrat', 'Lexend', 'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif;
  /* Vuetify usa esta variable como fuente base de la app */
  --v-font-family: var(--app-font-body);
}

html,
body,
#app {
  height: 100%;
  margin: 0;
  font-family: var(--app-font-body);
}

/* Títulos (HTML + utilidades de Vuetify) */
h1,
h2,
h3,
h4,
h5,
h6,
.text-h1,
.text-h2,
.text-h3,
.text-h4,
.text-h5,
.text-h6 {
  font-family: var(--app-font-title);
}
</style>
