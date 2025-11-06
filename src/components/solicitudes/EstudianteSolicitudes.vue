<template>
  <div>
    <!-- 1. Botón "Nueva Solicitud" -->
    <v-btn
      color="primary"
      prepend-icon="mdi-plus"
      size="large"
      class="mb-5"
      @click="showModal = true"
    >
      Nueva Solicitud
    </v-btn>

    <!-- 2. La Tabla del Estudiante -->
    <v-card class="rounded-lg" variant="outlined" color="#e0e0e0">
      <v-data-table
        :headers="headers"
        :items="solicitudes"
        class="rounded-lg"
      >
        <!--
          !!! --- CORRECCIÓN DE SINTAXIS V-SLOT --- !!!
          La sintaxis para slots dinámicos usa corchetes [ ]
        -->
        <template v-slot:[`item.estado`]="{ value }">
          <v-chip
            :color="getStatusColor(value)"
            :prepend-icon="getStatusIcon(value)"
            size="small"
          >
            {{ value }}
          </v-chip>
        </template>

        <!--
          !!! --- CORRECCIÓN DE SINTAXIS V-SLOT --- !!!
        -->
        <template v-slot:[`item.actions`]>
          <v-btn
            variant="text"
            color="primary"
            append-icon="mdi-chevron-right"
            density="compact"
          >
            Ver Detalles
          </v-btn>
        </template>

        <!-- Mensaje cuando no hay datos -->
        <template v-slot:no-data>
          <p class="pa-4 text-center">No tienes ninguna solicitud creada.</p>
        </template>
      </v-data-table>
      <!-- <-- FIN DE V-DATA-TABLE -->
    </v-card>

    <!--
      Agregamos el componente modal.
      Usamos 'v-model' para conectar 'showModal'
      a la visibilidad del modal.
    -->
    <modal-nueva-solicitud
      v-model="showModal"
      @submit="handleNuevaSolicitud"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// Importamos el nuevo modal
import ModalNuevaSolicitud from './ModalNuevaSolicitud.vue'

// --- ARREGLO DE TYPESCRIPT: Importamos el tipo de VDataTable ---
import type { VDataTable } from 'vuetify/components'

// ref para controlar la visibilidad del modal
const showModal = ref(false)

// --- Cabeceras de la tabla (Vista Estudiante) ---
// !!! --- ARREGLO DE TYPESCRIPT: Tipado explícito para 'headers' --- !!!
const headers = ref<VDataTable['$props']['headers']>([
  { title: 'ID SOLICJUD', key: 'id' },
  { title: 'TIPO CONSTANCIA', key: 'tipo' },
  { title: 'FECHA SOLICITUD', key: 'fecha' },
  { title: 'ESTADO', key: 'estado' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
])
// ... existing code ... -->
const solicitudes = ref([
  {
    id: 'RRNN-24001',
    tipo: 'Alumno Regular',
    fecha: '15-07-2024',
    estado: 'Firmado y Disponible',
  },
  {
    id: 'RRNN-24003',
    tipo: 'Asignaturas Inscritas',
    fecha: '20-07-2024',
    estado: 'En Revisión',
  },
])
// ... existing code ... -->
// (Esta función ahora SÍ se usará)
const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'Firmado y Disponible':
      return 'success'
    case 'En Revisión':
      return 'warning'
    case 'Para Firma':
      return 'info'
    case 'Solicitado':
      return 'blue'
    default:
      return 'grey'
  }
}

// (Esta función ahora SÍ se usará)
const getStatusIcon = (estado: string) => {
  switch (estado) {
    case 'Firmado y Disponible':
      return 'mdi-check-circle'
    case 'En Revisión':
      return 'mdi-clock-outline'
    case 'Para Firma':
      return 'mdi-draw-pen'
    case 'Solicitado':
      return 'mdi-file-document'
    default:
      return 'mdi-help-circle'
  }
}

// Función para manejar el 'submit' del modal
const handleNuevaSolicitud = (formData: {
  tipo: string
  observaciones: string
}) => {
  console.log('Nueva solicitud recibida:', formData)
  // Aquí puedes agregar la nueva solicitud a la tabla (mock data)
  const nuevaId = `RRNN-2400${solicitudes.value.length + 4}`
  solicitudes.value.unshift({
    // 'unshift' lo agrega al inicio
    id: nuevaId,
    tipo: formData.tipo,
    fecha: new Date().toLocaleDateString('es-CL'), // Fecha de hoy
    estado: 'Solicitado',
  })
}
</script>
