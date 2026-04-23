<template>
  <v-card elevation="1" class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
      <div>
        <h2 class="text-h6 font-weight-bold mb-1">Asignación masiva de asignaturas</h2>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Selecciona estudiantes y asignaturas. Solo se podrán asignar a quienes <strong>no</strong> la tengan.
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

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <v-alert v-if="success" type="success" variant="tonal" class="mb-4">
      {{ success }}
    </v-alert>

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
            item-value="uuid"
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
            show-select
            :loading="isLoadingAsignaturas || isComputingExisting"
            density="comfortable"
            :items-per-page="8"
          >
            <template v-slot:item.codAsignatura="{ item }">
              <span class="font-weight-medium">{{ item.codAsignatura }}</span>
            </template>

            <template v-slot:item.disponible="{ item }">
              <span class="text-caption">
                {{ availabilityLabel(item.codAsignatura) }}
              </span>
            </template>

            <template v-slot:item.data-table-select="{ item, internalItem, isSelected, toggleSelect }">
              <v-checkbox-btn
                :model-value="isSelected(internalItem)"
                :disabled="isAsignaturaDisabled(item.codAsignatura)"
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

const studentSearch = ref('')
const asigSearch = ref('')

const asignaturas = ref<AsignaturaItem[]>([])
const isLoadingAsignaturas = ref(false)

const selectedStudents = ref<StudentItem[]>([])
const selectedAsignaturas = ref<AsignaturaItem[]>([])

// Cache: uuid -> Set(codAsignatura) existentes
const existingByStudent = ref<Record<string, Set<string>>>({})
const isComputingExisting = ref(false)

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
  const q = studentSearch.value.trim().toLowerCase()
  if (!q) return props.students
  return props.students.filter((s) =>
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

const fetchExistingForStudent = async (student: StudentItem) => {
  if (!student?.uuid) return
  if (existingByStudent.value[student.uuid]) return

  const token = await ensureToken()
  const apiUrl = getApiBaseUrl()
  const endpoint = isDev.value
    ? `/api/v1/alumnos/usuario/${student.uuid}/asignaturas`
    : `${apiUrl}/api/v1/alumnos/usuario/${student.uuid}/asignaturas`

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

  const set = new Set<string>()
  for (const it of dataArray) {
    if (it?.codAsignatura) set.add(String(it.codAsignatura))
  }
  existingByStudent.value = { ...existingByStudent.value, [student.uuid]: set }
}

const existingCountByAsig = computed(() => {
  const counts: Record<string, number> = {}
  const selected = selectedStudents.value
  if (selected.length === 0) return counts

  for (const s of selected) {
    const set = existingByStudent.value[s.uuid]
    if (!set) continue
    for (const cod of set) {
      counts[cod] = (counts[cod] || 0) + 1
    }
  }
  return counts
})

const availabilityLabel = (codAsignatura: string) => {
  const total = selectedStudents.value.length
  if (total === 0) return 'Selecciona estudiantes'
  const have = existingCountByAsig.value[codAsignatura] || 0
  if (have === 0) return `Disponible para ${total}/${total}`
  if (have === total) return `Ya la tienen ${total}/${total}`
  return `Disponible para ${total - have}/${total} (ya la tienen ${have})`
}

const isAsignaturaDisabled = (codAsignatura: string) => {
  const total = selectedStudents.value.length
  if (total === 0) return true
  const have = existingCountByAsig.value[codAsignatura] || 0
  // Si TODOS los estudiantes seleccionados ya la tienen, no se puede seleccionar
  return have >= total
}

watch(
  () => selectedStudents.value.map((s) => s.uuid).join('|'),
  async () => {
    success.value = null
    error.value = null

    // Cuando cambian estudiantes, recalcular cache de existentes para los nuevos
    const newlySelected = selectedStudents.value
    if (newlySelected.length === 0) {
      selectedAsignaturas.value = []
      return
    }

    isComputingExisting.value = true
    try {
      for (const s of newlySelected) {
        await fetchExistingForStudent(s)
      }
      // Si alguna asignatura seleccionada quedó inválida (todos ya la tienen), la quitamos
      selectedAsignaturas.value = selectedAsignaturas.value.filter(
        (a) => !isAsignaturaDisabled(a.codAsignatura),
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar asignaturas existentes del alumno'
    } finally {
      isComputingExisting.value = false
    }
  },
)

const isSubmitting = ref(false)
const submit = async () => {
  error.value = null
  success.value = null

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

    const asignaturasPayload = selectedAsignaturas.value
      .map((a) => a.codAsignatura)
      .filter(Boolean)
      .map((codAsignatura) => ({ codAsignatura, nota: null }))

    const endpoint = isDev.value
      ? '/api/v1/alumnos/usuarios/asignaturas/asignar-masivo'
      : `${apiUrl}/api/v1/alumnos/usuarios/asignaturas/asignar-masivo`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ auth0UserIds, asignaturas: asignaturasPayload }),
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(t || `Error ${res.status}`)
    }

    const payload = await res.json().catch(() => ({}))
    const creadas = payload?.creadas ?? '-'
    const actualizadas = payload?.actualizadas ?? '-'
    const omitidas = payload?.omitidas ?? '-'
    const errores = Array.isArray(payload?.errores) ? payload.errores.length : 0

    success.value = `Asignación masiva finalizada. Creadas: ${creadas}, Actualizadas: ${actualizadas}, Omitidas: ${omitidas}, Errores: ${errores}.`
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al asignar masivamente'
  } finally {
    isSubmitting.value = false
  }
}

fetchAsignaturas()
</script>
