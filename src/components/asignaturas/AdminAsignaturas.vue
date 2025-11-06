<template>
  <div>
    <!-- Título y subtítulo para Admin/Secretaria/Director -->
    <h1 class="text-h4 font-weight-bold">Malla Curricular del Programa</h1>
    <p class="mt-2 text-medium-emphasis">
      Listado de todas las asignaturas ofrecidas en el programa de doctorado.
    </p>

    <!-- La Tabla de la Malla -->
    <v-card class="rounded-lg mt-6" variant="outlined" color="#e0e0e0">
      <v-data-table
        :headers="headers"
        :items="asignaturas"
        class="rounded-lg"
        items-per-page="20"
      >
        <!-- Mensaje cuando no hay datos -->
        <template v-slot:no-data>
          <p class="pa-4 text-center">No hay asignaturas en la malla.</p>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VDataTable } from 'vuetify/components'

// --- Cabeceras de la tabla (Vista Admin/Malla) ---
const headers = ref<VDataTable['$props']['headers']>([
  { title: 'CÓDIGO', key: 'codigo' },
  { title: 'NOMBRE ASIGNATURA', key: 'nombre' },
  { title: 'CRÉDITOS', key: 'creditos', align: 'end' },
  { title: 'SEMESTRE', key: 'semestre' },
])

// --- Datos de simulación (Mock data) ---
const asignaturas = ref([
  { codigo: 'PCN104', nombre: 'Gestión de Tecnologías Emergentes', creditos: 3, semestre: 'Electivo' },
  { codigo: 'PCN119', nombre: 'Nanotecnología Ambiental', creditos: 4, semestre: 'Electivo' },
  { codigo: 'PCN204', nombre: 'Seminario Bibliográfico I', creditos: 5, semestre: 'I Semestre' },
  { codigo: 'PCN208', nombre: 'Seminario Bibliográfico II', creditos: 5, semestre: 'II Semestre' },
  { codigo: 'PCN209', nombre: 'Unidad de Investigación', creditos: 10, semestre: 'Anual' },
  { codigo: 'PCN210', nombre: 'Examen de Calificación', creditos: 15, semestre: 'Anual' },
  { codigo: 'PCN211', nombre: 'Seminario de Avance Doctoral I', creditos: 5, semestre: 'III Semestre' },
  { codigo: 'PCN212', nombre: 'Seminario de Avance Doctoral II', creditos: 5, semestre: 'IV Semestre' },
  { codigo: 'PCN213', nombre: 'Seminario de Avance Doctoral III', creditos: 5, semestre: 'V Semestre' },
  { codigo: 'PCN214', nombre: 'Seminario de Avance Doctoral IV', creditos: 5, semestre: 'VI Semestre' },
  { codigo: 'PCN216', nombre: 'Examen de Grado Doctoral', creditos: 20, semestre: 'Anual' },
  { codigo: 'PCN215', nombre: 'Tesis Doctoral', creditos: 50, semestre: 'Anual' },
  { codigo: 'PCN217', nombre: 'Manejo Integrado de Recursos Naturales', creditos: 4, semestre: 'Electivo' },
  { codigo: 'PCN221', nombre: 'Manejo Integrado de Recursos Naturales', creditos: 4, semestre: 'Electivo' },
])
</script>
