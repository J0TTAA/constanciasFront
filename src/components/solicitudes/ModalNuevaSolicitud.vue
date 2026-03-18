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
            Denominación (Hombre / Mujer) para rellenar automáticamente los títulos
          -->
          <template v-if="tipoConstancia">
            <v-label class="font-weight-medium mb-1 mt-3">Denominación</v-label>
            <v-select
              v-model="genero"
              :items="generoOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              placeholder="Seleccione hombre o mujer"
              :rules="[rules.required]"
              class="mb-4"
            ></v-select>
          </template>

          <!-- Campos específicos para "Inscripción Asignaturas" -->
          <template v-if="tipoConstancia === 'Inscripción Asignaturas'">
            <v-label class="font-weight-medium mb-1">Semestre</v-label>
            <v-text-field
              v-model="semestre"
              variant="outlined"
              placeholder="Ej: Primer Semestre de 2025"
              hint="Ejemplo: Primer Semestre de 2025"
              persistent-hint
              class="mb-3"
            ></v-text-field>

            <v-label class="font-weight-medium mb-1">Propósito</v-label>
            <v-text-field
              v-model="proposito"
              variant="outlined"
              placeholder="Ej: gestionar la renovación de su Beca Doctorado Nacional de ANID"
              hint="Motivo de la solicitud de la constancia"
              persistent-hint
              class="mb-3"
            ></v-text-field>
          </template>

          <v-label class="font-weight-medium mb-1 mt-3">Observaciones</v-label>
          <v-textarea
            v-model="observaciones"
            variant="outlined"
            placeholder="Ej: Necesito esta constancia para postular a una beca. Por favor, indicar el semestre actual."
            rows="4"
            hint="Este campo es opcional. Sea claro/a con su necesidad."
            persistent-hint
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
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

// --- Props y Emits para el v-model ---
// Esto permite que el componente padre controle si el modal está visible
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue', 'submit'])

const auth = useAuthStore()

// --- Estado Interno del Formulario ---
type Genero = 'Masculino' | 'Femenino'

type VuetifyForm = {
  validate: () => Promise<{ valid: boolean }>
}

const form = ref<VuetifyForm | null>(null) // Referencia al v-form
const tipoConstancia = ref<string | null>(null)
const genero = ref<Genero | null>(null)
const observaciones = ref('')
const semestre = ref('')
const proposito = ref('')
const isLoading = ref(false)

// Opciones del v-select
const tiposDeConstancia = [
  'Alumno Regular',
  'Examen',
  'Inscripción Asignaturas',
  'Certificado de Notas',
]

const generoOptions: Array<{ label: string; value: Genero }> = [
  { label: 'Hombre', value: 'Masculino' },
  { label: 'Mujer', value: 'Femenino' },
]

// Configuración de bodies según las especificaciones del backend
type BaseConstanciaBody = {
  nombreTipoConstancia: string
  semestre?: string
  proposito?: string
}

const constanciaBodies: Record<'Alumno Regular' | 'Examen' | 'Inscripción Asignaturas' | 'Certificado de Notas', { base: BaseConstanciaBody }> = {
  'Alumno Regular': {
    base: {
      nombreTipoConstancia: 'Alumno Regular',
      semestre: 'Primer Semestre 2026',
      proposito: 'trámites universitarios',
    },
  },
  Examen: {
    base: {
      nombreTipoConstancia: 'Examen',
      proposito: 'postular a la Beca Doctorado Nacional ANID',
    },
  },
  'Inscripción Asignaturas': {
    base: {
      nombreTipoConstancia: 'Inscripción Asignaturas',
      semestre: 'Primer Semestre de 2025',
      proposito: 'gestionar la renovación de su Beca Doctorado Nacional de ANID',
    },
  },
  'Certificado de Notas': {
    base: {
      nombreTipoConstancia: 'Certificado de Notas',
    },
  },
}

type Titulos = Partial<{
  titulo1: string
  titulo2: string
  titulo3: string
  titulo4: string
  titulo5: string
  titulo7: string
}>

// Helper para construir títulos según tipo de constancia y género (mapeo oficial)
const buildTitulos = (tipo: string, generoSeleccionado: Genero | null): Titulos | null => {
  if (!generoSeleccionado) return null

  const esMujer = generoSeleccionado === 'Femenino'

  if (tipo === 'Alumno Regular') {
    return {
      titulo1: esMujer ? 'la Srta.' : 'el Sr.',
      titulo2: '',
      titulo3: esMujer ? 'alumna' : 'alumno',
      titulo4: esMujer ? 'de la' : 'del',
      titulo5: esMujer ? 'interesada' : 'interesado',
    }
  }

  if (tipo === 'Examen') {
    return {
      titulo1: esMujer ? 'la Srta.' : 'el Sr.',
      titulo2: '',
      titulo3: esMujer ? 'alumna' : 'alumno',
      titulo4: esMujer ? 'de la' : 'del',
      titulo5: 'estudiante',
    }
  }

  if (tipo === 'Inscripción Asignaturas') {
    return {
      titulo1: esMujer ? 'la' : 'el',
      titulo2: esMujer ? 'alumna' : 'alumno',
      titulo3: esMujer ? 'alumna' : 'alumno',
      titulo4: esMujer ? 'de la' : 'del',
      titulo5: esMujer ? 'interesada' : 'interesado',
    }
  }

  if (tipo === 'Certificado de Notas') {
    return {
      titulo1: esMujer ? 'La' : 'El',
      titulo3: esMujer ? 'alumna' : 'alumno',
      titulo4: esMujer ? 'de la' : 'del',
      titulo5: esMujer ? 'interesada' : 'interesado',
      // Pronombre usado en el template (solo definido para femenino en tu tabla)
      titulo7: esMujer ? 'ella' : 'él',
    }
  }

  return null
}

const solicitudBody = computed(() => {
  if (!tipoConstancia.value) return null

  const baseBody = constanciaBodies[tipoConstancia.value as keyof typeof constanciaBodies].base

  // Para "Certificado de Notas", se necesitan títulos (según template) + opcional observación
  if (tipoConstancia.value === 'Certificado de Notas') {
    const titulos = buildTitulos(tipoConstancia.value, genero.value as Genero | null)
    if (!titulos) return null

    const finalBody: Record<string, any> = {
      nombreTipoConstancia: baseBody.nombreTipoConstancia,
      ...titulos,
    }

    if (observaciones.value.trim()) finalBody.observacionAlumno = observaciones.value.trim()
    return finalBody
  }

  // Para las otras constancias, se requieren los campos de título
  const titulos = buildTitulos(tipoConstancia.value, genero.value as Genero | null)
  if (!titulos) return null

  // Construir el body según las especificaciones del backend
  const finalBody: Record<string, any> = {
    nombreTipoConstancia: baseBody.nombreTipoConstancia,
    ...titulos,
  }

  // El backend valida esquemas distintos por tipo.
  // Aseguramos que propiedades exclusivas de "Certificado de Notas"
  // (como `titulo7`) NO se envíen en otros tipos.
  if (tipoConstancia.value !== 'Certificado de Notas' && 'titulo7' in finalBody) {
    delete finalBody.titulo7
  }

  // Agregar observacionAlumno si el usuario la proporcionó
  if (observaciones.value.trim()) {
    finalBody.observacionAlumno = observaciones.value.trim()
  }

  // Agregar campos base que no son específicos de género (como semestre y proposito para Inscripción Asignaturas)
  if (baseBody.semestre) {
    finalBody.semestre = baseBody.semestre
  }
  if (baseBody.proposito) {
    finalBody.proposito = baseBody.proposito
  }

  // Si el usuario ingresó valores personalizados para "Inscripción Asignaturas", usar esos
  if (tipoConstancia.value === 'Inscripción Asignaturas') {
    if (semestre.value.trim()) {
      finalBody.semestre = semestre.value.trim()
    }
    if (proposito.value.trim()) {
      finalBody.proposito = proposito.value.trim()
    }
  }

  return finalBody
})


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
  if (!form.value) {
    console.error('❌ [Modal] El formulario no está inicializado')
    return
  }

  // Para "Certificado de Notas", solo validar que se haya seleccionado el tipo
  if (tipoConstancia.value === 'Certificado de Notas') {
    if (!solicitudBody.value) {
      console.error('❌ [Modal] No se pudo generar el body de la solicitud')
      return
    }
    emit('submit', solicitudBody.value)
    tipoConstancia.value = null
    observaciones.value = ''
    return
  }

  // Para las otras constancias, validar todos los campos
  const { valid } = await form.value.validate()
  if (!valid) return

  if (!solicitudBody.value) {
    console.error('❌ [Modal] No se pudo generar el body de la solicitud')
    return
  }

  // 2. Emitir el evento 'submit' con los datos (la llamada a la API se hace en el componente padre)
  emit('submit', solicitudBody.value)

  // 3. Limpiar campos (el modal se cerrará desde el componente padre después de la respuesta)
  tipoConstancia.value = null
  genero.value = null
  observaciones.value = ''
  semestre.value = ''
  proposito.value = ''
}

watch(tipoConstancia, () => {
  genero.value = null
})
</script>
