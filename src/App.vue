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
/* Estilos globales si los necesitas.
  Por ejemplo, si quieres que 'Merriweather' sea la fuente
  por defecto en TODA la app, lo pones aquí.
*/
html,
body,
#app {
  font-family: 'Merriweather', serif;
}
</style>
