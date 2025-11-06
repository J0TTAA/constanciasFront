<template>
  <!--
    v-dialog es el componente modal de Vuetify.
    Usamos 'v-model' para controlar su visibilidad (abrir/cerrar).
  -->
  <v-dialog :model-value="modelValue" @update:model-value="close" max-width="600px">
    <v-card class="rounded-lg">
      <v-card-title class="pa-4">
        <h2 class="text-h5 font-weight-bold" style="color: #1e5a3d">
          Generar Nueva Solicitud
        </h2>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Complete el formulario para solicitar su constancia.
        </p>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-form ref="form" @submit.prevent="submitForm">
          <!--
            v-select para el Tipo de Constancia
            (Opciones tomadas de tu captura image_ed0b1e.png)
          -->
          <v-label class="font-weight-medium mb-1">Tipo de Constancia</v-label>
          <v-select
            v-model="tipoConstancia"
            :items="tiposDeConstancia"
            variant="outlined"
            placeholder="Seleccione un tipo"
            :rules="[rules.required]"
          ></v-select>

          <!--
            v-textarea para las Observaciones
          -->
          <v-label class="font-weight-medium mb-1 mt-3">Observaciones</v-label>
          <v-textarea
            v-model="observaciones"
            variant="outlined"
            placeholder="Ej: Necesito esta constancia para postular a una beca. Por favor, indicar el semestre actual."
            rows="4"
            hint="Este campo es requerido. Sea claro/a con su necesidad."
            persistent-hint
            :rules="[rules.required]"
          ></v-textarea>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <!-- Botón para cerrar el modal -->
        <v-btn variant="text" @click="close">
          Cancelar
        </v-btn>
        <!-- Botón para enviar (usa el color 'primary' de tu tema) -->
        <v-btn
          color="primary"
          variant="flat"
          @click="submitForm"
          :loading="isLoading"
        >
          Enviar Solicitud
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// --- Props y Emits para el v-model ---
// Esto permite que el componente padre controle si el modal está visible
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue', 'submit'])

// --- Estado Interno del Formulario ---
const form = ref<any>(null) // Referencia al v-form
const tipoConstancia = ref<string | null>(null)
const observaciones = ref('')
const isLoading = ref(false)

// Opciones del v-select
const tiposDeConstancia = [
  'Alumno Regular',
  'Notas',
  'Rendición de Examen de Calificación',
  'Asignaturas Inscritas',
]

// Reglas de validación
const rules = {
  required: (value: string) => !!value || 'Este campo es requerido.',
}

// --- Acciones ---
const close = () => {
  emit('update:modelValue', false)
}

const submitForm = async () => {
  // 1. Validar el formulario
  const { valid } = await form.value.validate()
  if (!valid) return

  isLoading.value = true

  // 2. Simular envío (aquí iría la llamada a la API)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 3. Emitir el evento 'submit' con los datos
  emit('submit', {
    tipo: tipoConstancia.value,
    observaciones: observaciones.value,
  })

  // 4. Limpiar y cerrar
  isLoading.value = false
  tipoConstancia.value = null
  observaciones.value = ''
  close()
}
</script>
