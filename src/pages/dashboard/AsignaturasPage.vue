<template>
  <div>
    <!--
      AQUÍ ESTÁ LA MAGIA:
      Le decimos a Vue: "Si el rol es 'Estudiante', muestra el componente
      de Estudiante. Si no, muestra el componente de Admin (Malla Curricular)."
    -->
    <estudiante-asignaturas v-if="auth.user?.role === 'Estudiante'" />
    <admin-asignaturas v-else />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import EstudianteAsignaturas from '@/components/asignaturas/EstudianteAsignaturas.vue'
import AdminAsignaturas from '@/components/asignaturas/AdminAsignaturas.vue'

const auth = useAuthStore()
</script>
