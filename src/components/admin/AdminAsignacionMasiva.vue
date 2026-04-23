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
        <v-btn
          variant="outlined"
          prepend-icon="mdi-check-decagram"
          :loading="isPrevalidating"
          :disabled="isPrevalidating || selectedStudents.length === 0 || isLoadingAsignaturas"
          @click="handlePrevalidateClick"
        >
          Prevalidar selección
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <v-alert v-if="success" type="success" variant="tonal" class="mb-4">
      {{ success }}
    </v-alert>
    <v-alert v-if="prevalidationInfo" type="info" variant="tonal" class="mb-4">
      {{ prevalidationInfo }}
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
            :loading="isLoadingAsignaturas || isPrevalidating"
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
const prevalidationInfo = ref<string | null>(null)

const studentSearch = ref('')
const asigSearch = ref('')

const asignaturas = ref<AsignaturaItem[]>([])
const isLoadingAsignaturas = ref(false)

const selectedStudents = ref<StudentItem[]>([])
const selectedAsignaturas = ref<AsignaturaItem[]>([])
const anhoCursada = ref<number | null>(null)
const semestreCursada = ref<number | null>(null)
const isPrevalidating = ref(false)
const prevalidationByCode = ref<Record<string, { assignable: number; blocked: number; total: number }>>({})

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

type ValidationEntry = { codAsignatura: string; puedeAsignar: boolean }
const collectValidationEntries = (node: unknown, acc: ValidationEntry[]) => {
  if (Array.isArray(node)) {
    for (const item of node) collectValidationEntries(item, acc)
    return
  }
  if (!node || typeof node !== 'object') return

  const obj = node as Record<string, unknown>
  const cod = typeof obj.codAsignatura === 'string' ? obj.codAsignatura : null
  const puede = typeof obj.puedeAsignar === 'boolean' ? obj.puedeAsignar : null
  if (cod && puede !== null) acc.push({ codAsignatura: cod, puedeAsignar: puede })

  for (const key of Object.keys(obj)) {
    collectValidationEntries(obj[key], acc)
  }
}

const runPrevalidation = async (onlyCodes?: string[]) => {
  error.value = null
  prevalidationInfo.value = null

  // Blindaje extra: si por cualquier razón llega un estudiante inválido, lo excluimos automáticamente
  selectedStudents.value = selectedStudents.value.filter(
    (s) => typeof s.auth0UserId === 'string' && s.auth0UserId.trim().length > 0,
  )

  if (selectedStudents.value.length === 0) {
    prevalidationByCode.value = {}
    return null
  }

  const auth0UserIds = selectedStudents.value
    .map((s) => s.auth0UserId?.trim())
    .filter((id): id is string => !!id && id.length > 0)
  if (auth0UserIds.length !== selectedStudents.value.length) {
    error.value = 'Hay estudiantes sin auth0UserId. Refresca la lista o excluye esos usuarios.'
    return null
  }

  const codes = (onlyCodes && onlyCodes.length > 0
    ? onlyCodes
    : asignaturas.value.map((a) => a.codAsignatura)
  ).filter(Boolean)

  if (codes.length === 0) {
    prevalidationByCode.value = {}
    return null
  }

  isPrevalidating.value = true
  try {
    const token = await ensureToken()
    const apiUrl = getApiBaseUrl()
    const endpoint = isDev.value
      ? '/api/v1/alumnos/usuarios/asignaturas/prevalidar-masivo'
      : `${apiUrl}/api/v1/alumnos/usuarios/asignaturas/prevalidar-masivo`

    const body = {
      auth0UserIds,
      asignaturas: buildAsignaturasPayload(codes),
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(t || `Error ${res.status}`)
    }

    const payload = await res.json().catch(() => ({}))
    const entries: ValidationEntry[] = []
    collectValidationEntries(payload?.resultados ?? payload, entries)

    const byCode: Record<string, { assignable: number; blocked: number; total: number }> = {}
    for (const cod of codes) {
      byCode[cod] = { assignable: 0, blocked: 0, total: selectedStudents.value.length }
    }
    for (const entry of entries) {
      const stat = byCode[entry.codAsignatura]
      if (!stat) continue
      if (entry.puedeAsignar) stat.assignable += 1
      else stat.blocked += 1
    }

    prevalidationByCode.value = byCode
    const resumen = payload?.resumen
    if (resumen) {
      prevalidationInfo.value =
        `Prevalidación: asignables ${resumen.asignables ?? 0}, ` +
        `ya asignadas con nota ${resumen.yaAsignadasConNota ?? 0}, ` +
        `asignadas sin nota ${resumen.asignadasSinNota ?? 0}.`
    } else {
      prevalidationInfo.value = 'Prevalidación completada.'
    }

    return payload
  } finally {
    isPrevalidating.value = false
  }
}

const handlePrevalidateClick = async () => {
  try {
    await runPrevalidation()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al prevalidar selección'
  }
}

const availabilityLabel = (codAsignatura: string) => {
  const total = selectedStudents.value.length
  if (total === 0) return 'Selecciona estudiantes'
  const stat = prevalidationByCode.value[codAsignatura]
  if (!stat) return 'Pendiente de prevalidación'
  if (stat.blocked === 0) return `Asignable para ${stat.assignable}/${total}`
  if (stat.assignable === 0) return `No asignable (${stat.blocked}/${total})`
  return `Parcial: ${stat.assignable}/${total} asignables`
}

const isAsignaturaDisabled = (codAsignatura: string) => {
  if (selectedStudents.value.length === 0) return true
  const stat = prevalidationByCode.value[codAsignatura]
  if (!stat) return true
  // Regla estricta: si alguna combinación no es asignable, no se permite selección masiva.
  return stat.blocked > 0
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
  () => [
    selectedStudents.value.map((s) => s.uuid).join('|'),
    asignaturas.value.length,
    anhoCursada.value ?? '',
    semestreCursada.value ?? '',
  ].join('|'),
  async () => {
    success.value = null
    error.value = null
    prevalidationInfo.value = null

    if (selectedStudents.value.length === 0) {
      selectedAsignaturas.value = []
      prevalidationByCode.value = {}
      return
    }

    try {
      await runPrevalidation()
      selectedAsignaturas.value = selectedAsignaturas.value.filter(
        (a) => !isAsignaturaDisabled(a.codAsignatura),
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al prevalidar asignaturas'
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

    const selectedCodes = selectedAsignaturas.value.map((a) => a.codAsignatura).filter(Boolean)
    await runPrevalidation(selectedCodes)
    const preErrors = selectedCodes.filter((cod) => {
      const stat = prevalidationByCode.value[cod]
      return !stat || stat.blocked > 0
    })
    if (preErrors.length > 0) {
      throw new Error(
        `Hay asignaturas no asignables según prevalidación: ${preErrors.join(', ')}. Ajusta la selección.`,
      )
    }

    const asignaturasPayload = buildAsignaturasPayload(selectedCodes)

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
