<template>
  <div>
    <!-- Título y subtítulo (tomado de tus capturas) -->
    <h1 class="text-h4 font-weight-bold">Informes para ANID</h1>
    <p class="mt-2 text-medium-emphasis">
      Gestión de informes de ejecución y seguimiento del programa de doctorado.
    </p>

    <!-- La Tabla de Informes -->
    <v-card class="rounded-lg mt-6" variant="outlined" color="#e0e0e0">
      <v-data-table
        :headers="headers"
        :items="informes"
        class="rounded-lg"
        items-per-page="10"
      >
        <!-- Plantilla para la columna de ESTADO -->
        <template v-slot:[`item.estado`]="{ value }">
          <v-chip
            :color="getStatusColor(value)"
            :prepend-icon="getStatusIcon(value)"
            size="small"
            label
          >
            {{ value }}
          </v-chip>
        </template>

        <!-- Plantilla para la columna de ACCIONES (Descarga) -->
        <template v-slot:[`item.actions`]="{ item }">
          <!-- Si el item es 'descargable' -->
          <v-btn
            v-if="item.descargable"
            color="primary"
            variant="text"
            prepend-icon="mdi-download"
            density="compact"
          >
            Descargar
          </v-btn>
          <!-- Si no, mostramos "No disponible" -->
          <span v-else class="text-disabled text-caption d-flex align-center">
            <v-icon start size="small">mdi-close-circle-outline</v-icon>
            No disponible
          </span>
        </template>

        <!-- Mensaje cuando no hay datos -->
        <template v-slot:no-data>
          <p class="pa-4 text-center">No hay informes para gestionar.</p>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VDataTable } from 'vuetify/components'

// --- Cabeceras de la tabla ---
const headers = ref<VDataTable['$props']['headers']>([
  { title: 'NOMBRE DEL INFORME', key: 'nombre', width: '40%' },
  { title: 'AÑO', key: 'ano' },
  { title: 'ESTADO', key: 'estado' },
  { title: 'ÚLTIMA ACTUALIZACIÓN', key: 'actualizacion' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
])

// --- Datos de simulación (Mock data) ---
const informes = ref([
  {
    nombre: 'Informe Anual de Actividades 2023',
    ano: 2023,
    estado: 'Completado',
    actualizacion: '14-01-2024',
    descargable: true,
  },
  {
    nombre: 'Informe de Medio Término 2024',
    ano: 2024,
    estado: 'En Progreso',
    actualizacion: '29-06-2024',
    descargable: false,
  },
  {
    nombre: 'Proyección de Cohorte 2025',
    ano: 2024,
    estado: 'Pendiente',
    actualizacion: '19-07-2024',
    descargable: false,
  },
])

// --- Lógica para los chips de estado ---
const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'Completado':
      return 'success'
    case 'En Progreso':
      return 'info'
    case 'Pendiente':
      return 'warning'
    default:
      return 'grey'
  }
}
const getStatusIcon = (estado: string) => {
  switch (estado) {
    case 'Completado':
      return 'mdi-check-circle'
    case 'En Progreso':
      return 'mdi-clock-outline'
    case 'Pendiente':
      return 'mdi-alert-circle'
    default:
      return 'mdi-help-circle'
  }
}
</script>
