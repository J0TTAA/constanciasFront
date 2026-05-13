<template>
  <v-card elevation="1" class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
      <div>
        <h2 class="text-h6 font-weight-bold mb-1">Asignación masiva de asignaturas</h2>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Selecciona estudiantes y asignaturas. El backend resolverá creadas, actualizadas y omitidas.
        </p>
      </div>
      <v-btn
        color="#1e5a3d"
        prepend-icon="mdi-send"
        :loading="isSubmitting"
        :disabled="isSubmitting || selectedStudents.length === 0 || selectedAsignaturas.length === 0"
        @click="submit"
      >
        Asignar seleccionadas
      </v-btn>
    </div>

    <v-row dense class="mb-2">
      <v-col cols="12" md="3">
        <v-text-field
          v-model.number="anhoCursada"
          label="Año cursada (opcional)"
          type="number"
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="semestreCursada"
          :items="[
            { title: 'Sin semestre', value: null },
            { title: 'Semestre 1', value: 1 },
            { title: 'Semestre 2', value: 2 }
          ]"
          label="Semestre (opcional)"
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-center">
        <span class="text-caption text-medium-emphasis">
          Sin prevalidación: la API procesa directamente y devuelve creadas/actualizadas/omitidas.
        </span>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <v-alert v-if="success" type="success" variant="tonal" class="mb-4">
      {{ success }}
    </v-alert>
    <v-expansion-panels v-if="assignmentErrors.length > 0" class="mb-4">
      <v-expansion-panel>
        <v-expansion-panel-title>
          Ver detalle de errores ({{ assignmentErrors.length }})
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list density="compact">
            <v-list-item
              v-for="(err, idx) in assignmentErrors"
              :key="`${err.auth0UserId || 'sin-id'}-${err.codAsignatura || 'sin-cod'}-${idx}`"
            >
              <v-list-item-title>
                {{ err.codAsignatura || 'Sin asignatura' }} - {{ err.mensaje || 'Sin detalle' }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="err.auth0UserId">
                Usuario: {{ err.auth0UserId }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-row dense>
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="pa-4">
          <div class="d-flex align-center justify-space-between gap-3 mb-3">
            <div class="text-subtitle-2 font-weight-bold">Estudiantes</div>
            <v-text-field
              v-model="studentSearch"
              placeholder="Buscar por nombre, email o RUT..."
              prepend-inner-icon="mdi-magnify"
              hide-details
              density="comfortable"
              variant="outlined"
              style="max-width: 320px"
            />
          </div>

          <v-data-table
            v-model="selectedStudents"
            :headers="studentHeaders"
            :items="filteredStudents"
            item-value="auth0UserId"
            return-object
            show-select
            :loading="isLoadingStudents"
            density="comfortable"
            :items-per-page="8"
          >
            <template v-slot:item.nombre="{ item }">
              <div class="d-flex flex-column">
                <span class="font-weight-medium">{{ item.nombre }}</span>
                <span class="text-caption text-medium-emphasis">{{ item.email }}</span>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined" class="pa-4">
          <div class="d-flex align-center justify-space-between gap-3 mb-3">
            <div class="text-subtitle-2 font-weight-bold">Asignaturas</div>
            <v-text-field
              v-model="asigSearch"
              placeholder="Buscar por código o nombre..."
              prepend-inner-icon="mdi-magnify"
              hide-details
              density="comfortable"
              variant="outlined"
              style="max-width: 320px"
            />
          </div>

          <v-data-table
            v-model="selectedAsignaturas"
            :headers="asigHeaders"
            :items="filteredAsignaturas"
            item-value="codAsignatura"
            return-object
            show-select
            :loading="isLoadingAsignaturas"
            density="comfortable"
            :items-per-page="8"
          >
            <template v-slot:item.codAsignatura="{ item }">
              <span class="font-weight-medium">{{ item.codAsignatura }}</span>
            </template>

            <template v-slot:item.disponible="{ item }">
              <span class="text-caption">
                {{ availabilityLabel() }}
              </span>
            </template>

            <template v-slot:item.data-table-select="{ item, internalItem, isSelected, toggleSelect }">
              <v-checkbox-btn
                :model-value="isSelected(internalItem)"
                :disabled="selectedStudents.length === 0"
                @update:model-value="() => toggleSelect(internalItem)"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { VDataTable } from 'vuetify/components'
import { getApiBaseUrl } from '@/config/api'
import { useAuthStore } from '@/stores/auth'

type StudentItem = {
  uuid: string
  auth0UserId?: string
  rut?: string
  nombre: string
  email: string
}

type AsignaturaItem = {
  codAsignatura: string
  nombreAsignatura: string
  nivel?: string
}

const props = defineProps<{
  students: StudentItem[]
  isLoadingStudents?: boolean
}>()

const auth = useAuthStore()
const isDev = computed(() => import.meta.env.DEV || false)

const error = ref<string | null>(null)
const success = ref<string | null>(null)
const assignmentErrors = ref<Array<{ auth0UserId?: string; codAsignatura?: string; mensaje?: string }>>(
  [],
)

const studentSearch = ref('')
const asigSearch = ref('')

const asignaturas = ref<AsignaturaItem[]>([])
const isLoadingAsignaturas = ref(false)

const selectedStudents = ref<StudentItem[]>([])
const selectedAsignaturas = ref<AsignaturaItem[]>([])
const anhoCursada = ref<number | null>(null)
const semestreCursada = ref<number | null>(null)

const studentHeaders: VDataTable['$props']['headers'] = [
  { title: 'NOMBRE', key: 'nombre', sortable: true },
  { title: 'RUT', key: 'rut', sortable: true },
]

const asigHeaders: VDataTable['$props']['headers'] = [
  { title: 'CÓDIGO', key: 'codAsignatura', sortable: true },
  { title: 'ASIGNATURA', key: 'nombreAsignatura', sortable: true },
  { title: 'DISPONIBILIDAD', key: 'disponible', sortable: false },
]

const filteredStudents = computed(() => {
  const validStudents = props.students.filter(
    (s) => typeof s.auth0UserId === 'string' && s.auth0UserId.trim().length > 0,
  )
  const q = studentSearch.value.trim().toLowerCase()
  if (!q) return validStudents
  return validStudents.filter((s) =>
    [s.nombre, s.email, s.rut].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
})

const filteredAsignaturas = computed(() => {
  const q = asigSearch.value.trim().toLowerCase()
  if (!q) return asignaturas.value
  return asignaturas.value.filter((a) =>
    [a.codAsignatura, a.nombreAsignatura, a.nivel].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
})

const ensureToken = async () => {
  if (!auth.initialized) await auth.loadFromStorage()
  const token = auth.token?.trim().replace(/\s+/g, '')
  if (!token) throw new Error('No hay token de autenticación disponible.')
  return token
}

const fetchAsignaturas = async () => {
  error.value = null
  try {
    const token = await ensureToken()
    const apiUrl = getApiBaseUrl()
    const endpoint = isDev.value ? '/api/v1/asignaturas' : `${apiUrl}/api/v1/asignaturas`

    isLoadingAsignaturas.value = true
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(t || `Error ${res.status}`)
    }

    const payload = await res.json()
    const dataArray: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : []

    asignaturas.value = dataArray
      .map((a: any) => ({
        codAsignatura: a.codAsignatura,
        nombreAsignatura: a.nombreAsignatura,
        nivel: a.nivel,
      }))
      .filter((a: AsignaturaItem) => !!a.codAsignatura && !!a.nombreAsignatura)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar asignaturas'
  } finally {
    isLoadingAsignaturas.value = false
  }
}

const buildAsignaturasPayload = (codes: string[]) =>
  codes.map((codAsignatura) => {
    const row: Record<string, unknown> = { codAsignatura }
    if (anhoCursada.value) row.anhoCursada = anhoCursada.value
    if (semestreCursada.value) row.semestreCursada = semestreCursada.value
    row.nota = null
    return row
  })

const availabilityLabel = () => {
  if (selectedStudents.value.length === 0) return 'Selecciona estudiantes'
  return `Se enviará a ${selectedStudents.value.length} estudiante(s)`
}

watch(
  () => props.students,
  () => {
    // Si cambia la lista desde el padre, limpiar selecciones inválidas
    selectedStudents.value = selectedStudents.value.filter(
      (s) => typeof s.auth0UserId === 'string' && s.auth0UserId.trim().length > 0,
    )
  },
  { deep: true },
)

watch(
  () => selectedStudents.value.map((s) => s.auth0UserId).join('|'),
  () => {
    success.value = null
    error.value = null
    assignmentErrors.value = []
    if (selectedStudents.value.length === 0) {
      selectedAsignaturas.value = []
    }
  },
)

const isSubmitting = ref(false)
const submit = async () => {
  error.value = null
  success.value = null
  assignmentErrors.value = []

  if (selectedStudents.value.length === 0 || selectedAsignaturas.value.length === 0) {
    error.value = 'Selecciona estudiantes y asignaturas.'
    return
  }

  isSubmitting.value = true
  try {
    const token = await ensureToken()
    const apiUrl = getApiBaseUrl()

    const auth0UserIds = selectedStudents.value
      .map((s) => s.auth0UserId)
      .filter(Boolean) as string[]

    if (auth0UserIds.length !== selectedStudents.value.length) {
      throw new Error('Faltan auth0UserId en uno o más estudiantes. No se puede asignar masivamente por usuario.')
    }

    const endpoint = isDev.value
      ? '/api/v1/alumnos/usuarios/asignaturas/asignar-masivo'
      : `${apiUrl}/api/v1/alumnos/usuarios/asignaturas/asignar-masivo`
    const selectedCodes = selectedAsignaturas.value.map((a) => a.codAsignatura).filter(Boolean)
    const asignaturasPayload = buildAsignaturasPayload(selectedCodes)

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        auth0UserIds,
        asignaturas: asignaturasPayload,
      }),
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(t || `Error ${res.status}`)
    }

    const payload = await res.json().catch(() => ({}))
    const creadas = payload?.creadas ?? 0
    const actualizadas = payload?.actualizadas ?? 0
    const omitidas = payload?.omitidas ?? 0
    const errores = Array.isArray(payload?.errores) ? payload.errores.length : 0
    assignmentErrors.value = Array.isArray(payload?.errores) ? payload.errores : []

    success.value =
      `Asignación masiva finalizada. Creadas: ${creadas}, ` +
      `Actualizadas: ${actualizadas}, Omitidas: ${omitidas}, Errores: ${errores}.`
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al asignar masivamente'
  } finally {
    isSubmitting.value = false
  }
}

fetchAsignaturas()
</script>
