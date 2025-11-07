<template>
  <div>
    <!--
      Nota: Esta vista no tiene el botón de "Nueva Solicitud"
    -->

    <!-- 1. La Tabla de Administración -->
    <v-card class="rounded-lg" variant="outlined" color="#e0e0e0">
      <v-data-table
        :headers="headers"
        :items="solicitudes"
        class="rounded-lg"
      >
        <!-- Plantilla para la columna de ESTADO -->
        <template v-slot:item.estado="{ value }">
          <v-chip :color="getStatusColor(value)" :prepend-icon="getStatusIcon(value)" size="small">
            {{ value }}
          </v-chip>
        </template>

        <!-- Plantilla para la columna de ACCIONES -->
        <template v-slot:item.actions>
          <v-btn variant="text" color="primary" append-icon="mdi-chevron-right" density="compact">
            Ver Detalles
          </v-btn>
        </template>

        <!-- Mensaje cuando no hay datos -->
        <template v-slot:no-data>
          <p class="pa-4 text-center">No hay solicitudes pendientes.</p>
        </template>

      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// --- Cabeceras de la tabla (Vista Admin/Secretaria/Director) ---
// ¡Nota la columna extra 'estudiante'!
const headers = ref([
  { title: 'ID SOLICITUD', key: 'id' },
  { title: 'ESTUDIANTE', key: 'estudiante' }, // <-- La columna clave
  { title: 'TIPO CONSTANCIA', key: 'tipo' },
  { title: 'FECHA SOLICITUD', key: 'fecha' },
  { title: 'ESTADO', key: 'estado' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]as const)

// --- Datos de simulación (Mock data) ---
const solicitudes = ref([
  { id: 'RRNN-24001', estudiante: 'Ana Contreras', tipo: 'Alumno Regular', fecha: '15-07-2024', estado: 'Firmado y Disponible' },
  { id: 'RRNN-24002', estudiante: 'Carlos Díaz', tipo: 'Notas', fecha: '18-07-2024', estado: 'Para Firma' },
  { id: 'RRNN-24003', estudiante: 'Ana Contreras', tipo: 'Asignaturas Inscritas', fecha: '20-07-2024', estado: 'En Revisión' },
  { id: 'RRNN-24004', estudiante: 'Carlos Díaz', tipo: 'Rendición de Examen de Calificación', fecha: '22-07-2024', estado: 'Solicitado' },
])

// --- Lógica para los chips de estado ---
const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'Firmado y Disponible': return 'success'
    case 'En Revisión': return 'warning'
    case 'Para Firma': return 'info'
    case 'Solicitado': return 'blue'
    default: return 'grey'
  }
}
const getStatusIcon = (estado: string) => {
  switch (estado) {
    case 'Firmado y Disponible': return 'mdi-check-circle'
    case 'En Revisión': return 'mdi-clock-outline'
    case 'Para Firma': return 'mdi-draw-pen'
    case 'Solicitado': return 'mdi-file-document'
    default: return 'mdi-help-circle'
  }
}
</script>
