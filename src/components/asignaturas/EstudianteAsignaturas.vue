<template>
  <div>
    <!-- Título y subtítulo para el Estudiante -->
    <h1 class="text-h4 font-weight-bold">Mis Asignaturas y Calificaciones</h1>
    <p class="mt-2 text-medium-emphasis">
      Aquí se listan las asignaturas que has cursado, junto con sus calificaciones y estado.
    </p>

    <!-- La Tabla del Estudiante -->
    <v-card class="rounded-lg mt-6" variant="outlined" color="#e0e0e0">
      <v-data-table
        :headers="headers"
        :items="asignaturas"
        class="rounded-lg"
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

        <!-- Mensaje cuando no hay datos -->
        <template v-slot:no-data>
          <p class="pa-4 text-center">No tienes asignaturas registradas.</p>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VDataTable } from 'vuetify/components'

// --- Cabeceras de la tabla (Vista Estudiante) ---
const headers = ref<VDataTable['$props']['headers']>([
  { title: 'CÓDIGO', key: 'codigo' },
  { title: 'NOMBRE ASIGNATURA', key: 'nombre' },
  { title: 'CRÉDITOS', key: 'creditos', align: 'end' },
  { title: 'SEMESTRE', key: 'semestre' },
  { title: 'CALIFICACIÓN', key: 'calificacion', align: 'end' },
  { title: 'ESTADO', key: 'estado' },
])

// --- Datos de simulación (Mock data) ---
const asignaturas = ref([
  { codigo: 'PCN204', nombre: 'Seminario Bibliográfico I', creditos: 5, semestre: 'I Semestre', calificacion: '6.5', estado: 'Aprobada' },
  { codigo: 'PCN119', nombre: 'Nanotecnología Ambiental', creditos: 4, semestre: 'Electivo', calificacion: '5.0', estado: 'Aprobada' },
  { codigo: 'PCN803', nombre: 'Bioestadística', creditos: 4, semestre: 'Electivo', calificacion: 'Sin notas', estado: 'En Curso' },
  { codigo: 'PCN208', nombre: 'Seminario Bibliográfico II', creditos: 5, semestre: 'II Semestre', calificacion: '3.5', estado: 'Reprobada' },
])

// --- Lógica para los chips de estado ---
const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'Aprobada': return 'success'
    case 'En Curso': return 'info'
    case 'Reprobada': return 'error'
    default: return 'grey'
  }
}
const getStatusIcon = (estado: string) => {
  switch (estado) {
    case 'Aprobada': return 'mdi-check-circle'
    case 'En Curso': return 'mdi-clock-outline'
    case 'Reprobada': return 'mdi-alert-circle'
    default: return 'mdi-help-circle'
  }
}
</script>
