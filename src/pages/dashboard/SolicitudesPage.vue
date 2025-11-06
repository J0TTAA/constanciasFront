<template>
  <div>
    <!-- Título y subtítulo que son comunes a todos -->
    <h1 class="text-h4 font-weight-bold">Panel de Solicitudes</h1>
    <p class="mt-2 text-medium-emphasis">
      {{
        auth.user.role === 'Estudiante'
          ? 'Bienvenido. Aquí puede ver sus solicitudes de constancias.'
          : 'Bienvenido. Aquí están las solicitudes pendientes de revisión.'
      }}
    </p>

    <!--
      AQUÍ ESTÁ LA MAGIA:
      Le decimos a Vue: "Si el rol es 'Estudiante', muestra el componente
      de Estudiante. Si no, muestra el componente de Admin."
    -->
    <estudiante-solicitudes
      v-if="auth.user.role === 'Estudiante'"
      class="mt-6"
    />
    <admin-solicitudes v-else class="mt-6" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import EstudianteSolicitudes from '@/components/solicitudes/EstudianteSolicitudes.vue'
import AdminSolicitudes from '@/components/solicitudes/AdminSolicitudes.vue'

const auth = useAuthStore()
</script>
