<template>
  <div class="user-asignaturas-tab">
    <!-- Estadísticas -->
    <div class="stats-section">
      <v-card class="stat-card" elevation="1">
        <v-card-text class="text-center">
          <div class="stat-value text-h4 font-weight-bold" style="color: #4caf50">
            {{ totalAsignaturas }}
          </div>
          <div class="stat-label text-caption text-medium-emphasis">
            TOTAL ASIGNATURAS
          </div>
        </v-card-text>
      </v-card>
      <v-card class="stat-card" elevation="1">
        <v-card-text class="text-center">
          <div class="stat-value text-h4 font-weight-bold" style="color: #4caf50">
            {{ aprobadas }}
          </div>
          <div class="stat-label text-caption text-medium-emphasis">
            APROBADAS
          </div>
        </v-card-text>
      </v-card>
      <v-card class="stat-card" elevation="1">
        <v-card-text class="text-center">
          <div class="stat-value text-h4 font-weight-bold" style="color: #4caf50">
            {{ cursando }}
          </div>
          <div class="stat-label text-caption text-medium-emphasis">
            CURSANDO
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Búsqueda y filtros -->
    <div class="search-section">
      <v-text-field
        v-model="searchQuery"
        placeholder="Buscar asignatura..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        class="search-field"
      ></v-text-field>
      <v-select
        v-model="selectedFilter"
        :items="filterOptions"
        variant="outlined"
        density="comfortable"
        hide-details
        class="filter-select"
      ></v-select>
      <v-btn
        color="#1e5a3d"
        prepend-icon="mdi-plus"
        class="add-btn"
        @click="handleOpenAssignDialog"
      >
        + Asignar Asignatura
      </v-btn>
    </div>

    <!-- Tabla de asignaturas -->
    <v-card class="table-card" elevation="1">
      <v-alert v-if="error" type="error" variant="tonal" class="ma-4">
        {{ error }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="asignaturas"
        :loading="isLoading"
        hide-default-footer
        class="asignaturas-table"
      >
        <template v-slot:item.estado="{ item }">
          <v-chip
            :color="getEstadoColor(item.estado)"
            size="small"
            variant="flat"
          >
            {{ item.estado }}
          </v-chip>
        </template>

        <template v-slot:item.acciones="{ item }">
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            @click="handleDelete(item)"
          ></v-btn>
        </template>
      </v-data-table>

      <div class="table-footer">
        <span class="text-caption text-medium-emphasis">
          {{ asignaturas.length }} asignaturas - {{ totalCreditos }} créditos totales
        </span>
      </div>
    </v-card>

    <!-- Dialog para asignar asignatura -->
    <v-dialog v-model="showAssignDialog" max-width="600">
      <v-card>
        <v-card-title>Asignar Asignatura</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedAsignatura"
            :items="availableAsignaturas"
            item-title="nombreAsignatura"
            item-value="codAsignatura"
            label="Asignatura *"
            variant="outlined"
            return-object
            :rules="[v => !!v || 'La asignatura es requerida']"
            :loading="isLoading"
            :disabled="availableAsignaturas.length === 0"
            class="mb-4"
            required
            @update:model-value="(value) => {
              console.log('🔍 [UserAsignaturasTab] Asignatura seleccionada:', value)
              selectedAsignatura.value = value
            }"
          >
            <template v-slot:item="{ props: itemProps, item }">
              <v-list-item
                v-bind="itemProps"
                :title="item.raw.nombreAsignatura"
                :subtitle="`${item.raw.codAsignatura} - ${item.raw.nivel || 'N/A'}`"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-book-open-variant</v-icon>
                </template>
              </v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <span v-if="item.raw">{{ item.raw.codAsignatura }} - {{ item.raw.nombreAsignatura }}</span>
            </template>
            <template v-slot:no-data>
              <div class="pa-4 text-center">
                <p v-if="availableAsignaturas.length === 0 && !isLoading">
                  No hay asignaturas disponibles. Verifica tu conexión.
                </p>
                <p v-else>Cargando asignaturas...</p>
              </div>
            </template>
          </v-select>
          <v-text-field
            v-model.number="anhoCursada"
            label="Año Cursada (Opcional)"
            type="number"
            variant="outlined"
            hint="Si no se especifica, se usará el año actual"
            persistent-hint
            class="mb-4"
          ></v-text-field>
          <v-select
            v-model.number="semestreCursada"
            :items="[
              { title: 'Semestre 1 (Enero-Junio)', value: 1 },
              { title: 'Semestre 2 (Julio-Diciembre)', value: 2 }
            ]"
            label="Semestre (Opcional)"
            variant="outlined"
            hint="Si no se especifica, se calculará según el mes actual"
            persistent-hint
            class="mb-4"
          ></v-select>
          <v-text-field
            v-model.number="nota"
            label="Nota (Opcional)"
            type="number"
            step="0.1"
            min="1"
            max="7"
            variant="outlined"
            hint="Si no se especifica, se usará 1.0 (se puede actualizar después)"
            persistent-hint
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showAssignDialog = false">Cancelar</v-btn>
          <v-btn color="#1e5a3d" @click="handleAssignAsignatura">Asignar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { VDataTable } from 'vuetify/components'
import { useAuthStore } from '@/stores/auth'
import { getApiBaseUrl } from '@/config/api'

const props = defineProps<{
  userId: string
  userUuid?: string
  userRut?: string
}>()

const auth = useAuthStore()
const searchQuery = ref('')
const selectedFilter = ref('Todos')
const filterOptions = ['Todos', 'Aprobadas', 'Cursando', 'Pendientes', 'Reprobadas']
const asignaturas = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showAssignDialog = ref(false)
const availableAsignaturas = ref<any[]>([])
const selectedAsignatura = ref<any>(null)
const anhoCursada = ref(new Date().getFullYear())
const semestreCursada = ref(1)
const nota = ref<number | null>(null)

// Cargar asignaturas del alumno
const fetchAsignaturas = async () => {
  if (!auth.token) return

  // Usar UUID si está disponible, sino usar RUT como fallback
  const userUuid = props.userUuid || props.userId
  if (!userUuid && !props.userRut) {
    error.value = 'No se pudo obtener el identificador del usuario'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    
    // Usar UUID si está disponible, sino usar RUT
    let endpoint: string
    if (userUuid) {
      // Usar endpoint con UUID: /alumnos/usuario/{uuid}/asignaturas
      endpoint = isDevelopment
        ? `/api/v1/alumnos/usuario/${userUuid}/asignaturas`
        : `${apiUrl}/api/v1/alumnos/usuario/${userUuid}/asignaturas`
      console.log('📚 [UserAsignaturasTab] Cargando asignaturas usando UUID:', userUuid)
    } else {
      // Fallback a RUT si no hay UUID
      endpoint = isDevelopment
        ? `/api/v1/alumnos/${props.userRut}/asignaturas`
        : `${apiUrl}/api/v1/alumnos/${props.userRut}/asignaturas`
      console.log('📚 [UserAsignaturasTab] Cargando asignaturas usando RUT:', props.userRut)
    }

    console.log('📡 [UserAsignaturasTab] Haciendo petición a:', endpoint)

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token.trim()}`,
      },
    })

    console.log('📥 [UserAsignaturasTab] Respuesta recibida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get('Content-Type')
    })

    // Verificar el Content-Type antes de intentar parsear JSON
    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ [UserAsignaturasTab] El servidor devolvió HTML en lugar de JSON:', text.substring(0, 200))
      throw new Error(`El servidor devolvió HTML en lugar de JSON. Esto puede indicar un problema con el proxy o el endpoint. Status: ${response.status}`)
    }

    if (!response.ok) {
      let errorText = ''
      let errorData: any = null
      
      try {
        errorText = await response.text()
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
      } catch (e) {
        errorText = 'No se pudo leer el cuerpo de la respuesta'
        errorData = { message: errorText }
      }

      throw new Error(`Error ${response.status}: ${errorData.message || errorText}`)
    }

    const payload = await response.json()
    console.log('📚 [UserAsignaturasTab] Asignaturas recibidas (payload):', payload)
    
    const dataArray: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : []
    
    // Mapear datos del backend al formato esperado
    // El backend devuelve un array de asignaturas con codAsignatura y nombreAsignatura
    asignaturas.value = dataArray.map((asig: any) => ({
      codigo: asig.codAsignatura || asig.codigo,
      nombre: asig.nombreAsignatura || asig.nombre,
      creditos: asig.creditos || 0,
      semestre: asig.semestre || 'N/A',
      profesor: asig.profesor || asig.nombreProfesor || 'N/A',
      estado: asig.estado || 'Cursando',
      // Mantener datos originales para referencia
      codAsignatura: asig.codAsignatura || asig.codigo,
      nombreAsignatura: asig.nombreAsignatura || asig.nombre,
    }))
  } catch (err) {
    console.error('Error al cargar asignaturas:', err)
    error.value = 'Error al cargar asignaturas'
  } finally {
    isLoading.value = false
  }
}

// Cargar asignaturas disponibles para asignar
const fetchAvailableAsignaturas = async () => {
  if (!auth.token) {
    console.warn('⚠️ [UserAsignaturasTab] No hay token para cargar asignaturas disponibles')
    return
  }

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? '/api/v1/asignaturas'
      : `${apiUrl}/api/v1/asignaturas`

    console.log('📚 [UserAsignaturasTab] Cargando asignaturas disponibles desde:', endpoint)

    console.log('📡 [UserAsignaturasTab] Cargando asignaturas disponibles desde:', endpoint)

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token.trim()}`,
      },
    })

    console.log('📥 [UserAsignaturasTab] Respuesta de asignaturas disponibles:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get('Content-Type')
    })

    // Verificar el Content-Type antes de intentar parsear JSON
    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ [UserAsignaturasTab] El servidor devolvió HTML en lugar de JSON:', text.substring(0, 200))
      throw new Error(`El servidor devolvió HTML en lugar de JSON. Esto puede indicar un problema con el proxy o el endpoint. Status: ${response.status}`)
    }

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = 'No se pudo leer el error'
      }
      throw new Error(`Error ${response.status}: ${errorText}`)
    }

    const payload = await response.json()
    console.log('✅ [UserAsignaturasTab] Asignaturas disponibles recibidas:', payload)
    
    const dataArray: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : []
    
    availableAsignaturas.value = dataArray.map((asig: any) => ({
      codAsignatura: asig.codAsignatura,
      nombreAsignatura: asig.nombreAsignatura,
      nivel: asig.nivel || 'N/A',
      // Mantener todos los campos originales por si acaso
      ...asig,
    }))
    console.log('📋 [UserAsignaturasTab] Asignaturas mapeadas:', availableAsignaturas.value)
  } catch (err) {
    console.error('❌ [UserAsignaturasTab] Error al cargar asignaturas disponibles:', err)
    error.value = err instanceof Error ? err.message : 'Error al cargar asignaturas disponibles'
    availableAsignaturas.value = []
  }
}

// Abrir el diálogo de asignar asignatura y cargar las asignaturas disponibles
const handleOpenAssignDialog = async () => {
  showAssignDialog.value = true
  // Cargar asignaturas disponibles cuando se abre el modal
  if (availableAsignaturas.value.length === 0) {
    await fetchAvailableAsignaturas()
  }
}

// Asignar asignatura (crear nota)
const handleAssignAsignatura = async () => {
  // Validar que se haya seleccionado una asignatura (mínimo requerido)
  if (!selectedAsignatura.value || !auth.token) {
    error.value = 'Por favor, selecciona una asignatura'
    return
  }

  // Validar que tengamos el UUID del usuario
  const userUuid = props.userUuid || props.userId
  if (!userUuid) {
    error.value = 'No se pudo obtener el UUID del usuario. Por favor, recarga la página.'
    console.error('❌ [UserAsignaturasTab] No hay UUID del usuario disponible')
    return
  }

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    // Usar el endpoint correcto con UUID: /alumnos/usuario/{uuid}/asignaturas/asignar
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/usuario/${userUuid}/asignaturas/asignar`
      : `${apiUrl}/api/v1/alumnos/usuario/${userUuid}/asignaturas/asignar`
    
    console.log('📝 [UserAsignaturasTab] Asignando asignatura al usuario UUID:', userUuid)

    // Construir el body: codAsignatura es requerido, los demás son opcionales
    const body: any = {
      codAsignatura: selectedAsignatura.value.codAsignatura,
    }

    // Agregar campos opcionales solo si tienen valores
    if (anhoCursada.value) {
      body.anhoCursada = anhoCursada.value
    }
    if (semestreCursada.value) {
      body.semestreCursada = semestreCursada.value
    }
    if (nota.value !== null && nota.value !== undefined) {
      body.nota = nota.value
    }

    console.log('📝 [UserAsignaturasTab] Asignando asignatura:', body)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token.trim()}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errorText = ''
      let errorData: any = null
      
      try {
        errorText = await response.text()
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
      } catch (e) {
        errorText = 'No se pudo leer el cuerpo de la respuesta'
        errorData = { message: errorText }
      }

      const errorMessage = errorData.message || errorData.error || errorText
      throw new Error(`Error ${response.status}: ${errorMessage}`)
    }

    const data = await response.json()
    console.log('✅ [UserAsignaturasTab] Asignatura asignada exitosamente:', data)

    // Recargar asignaturas para mostrar la nueva asignatura
    await fetchAsignaturas()
    
    // Cerrar el diálogo y limpiar los campos
    showAssignDialog.value = false
    selectedAsignatura.value = null
    anhoCursada.value = new Date().getFullYear()
    semestreCursada.value = 1
    nota.value = null
    error.value = null
  } catch (err) {
    console.error('❌ [UserAsignaturasTab] Error al asignar asignatura:', err)
    error.value = err instanceof Error ? err.message : 'Error al asignar asignatura'
  }
}

onMounted(() => {
  fetchAsignaturas()
  // Cargar asignaturas disponibles al montar el componente
  fetchAvailableAsignaturas()
})

watch(() => props.userRut, () => {
  if (props.userRut) {
    fetchAsignaturas()
  }
})

const headers: VDataTable['$props']['headers'] = [
  { title: 'CÓDIGO', key: 'codigo', sortable: true },
  { title: 'ASIGNATURA', key: 'nombre', sortable: true },
  { title: 'CRÉDITOS', key: 'creditos', sortable: true },
  { title: 'SEMESTRE', key: 'semestre', sortable: true },
  { title: 'PROFESOR', key: 'profesor', sortable: true },
  { title: 'ESTADO', key: 'estado', sortable: true },
  { title: 'ACCIONES', key: 'acciones', sortable: false, align: 'end' },
]

const totalAsignaturas = computed(() => asignaturas.value.length)
const aprobadas = computed(() => asignaturas.value.filter(a => a.estado === 'Aprobada').length)
const cursando = computed(() => asignaturas.value.filter(a => a.estado === 'Cursando').length)
const totalCreditos = computed(() => asignaturas.value.reduce((sum, a) => sum + a.creditos, 0))

const getEstadoColor = (estado: string): string => {
  const colors: Record<string, string> = {
    'Aprobada': '#4caf50',
    'Cursando': '#4caf50',
    'Pendiente': '#d4af37',
    'Reprobada': '#f44336',
  }
  return colors[estado] || '#757575'
}

const handleDelete = (item: any) => {
  // TODO: Implementar eliminación
  console.log('Eliminar:', item)
}
</script>

<style scoped>
.user-asignaturas-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
}

.stat-value {
  margin-bottom: 4px;
}

.stat-label {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-section {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-field {
  flex: 1;
  max-width: 400px;
}

.filter-select {
  min-width: 150px;
}

.add-btn {
  text-transform: none;
  color: white;
}

.table-card {
  background: white;
}

.table-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

/* Responsive */
@media (max-width: 960px) {
  .stats-section {
    grid-template-columns: 1fr;
  }

  .search-section {
    flex-direction: column;
  }

  .search-field,
  .filter-select {
    width: 100%;
  }
}
</style>

