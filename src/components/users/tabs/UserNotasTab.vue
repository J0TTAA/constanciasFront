<template>
  <div class="user-notas-tab">
    <!-- Estadísticas -->
    <div class="stats-section">
      <v-card class="stat-card" elevation="1">
        <v-card-text class="text-center">
          <div class="stat-value text-h4 font-weight-bold" style="color: #d4af37">
            {{ promedioPonderado }}
          </div>
          <div class="stat-label text-caption text-medium-emphasis">
            PROMEDIO PONDERADO
          </div>
        </v-card-text>
      </v-card>
      <v-card class="stat-card" elevation="1">
        <v-card-text class="text-center">
          <div class="stat-value text-h4 font-weight-bold" style="color: #4caf50">
            {{ notaMasAlta }}
          </div>
          <div class="stat-label text-caption text-medium-emphasis">
            NOTA MÁS ALTA
          </div>
        </v-card-text>
      </v-card>
      <v-card class="stat-card" elevation="1">
        <v-card-text class="text-center">
          <div class="stat-value text-h4 font-weight-bold" style="color: #f44336">
            {{ notaMasBaja }}
          </div>
          <div class="stat-label text-caption text-medium-emphasis">
            NOTA MÁS BAJA
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Búsqueda y filtros -->
    <div class="search-section">
      <v-text-field
        v-model="searchQuery"
        placeholder="Buscar evaluación..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        class="search-field"
      ></v-text-field>
      <v-select
        v-model="selectedAsignatura"
        :items="asignaturasOptions"
        variant="outlined"
        density="comfortable"
        hide-details
        class="filter-select"
      ></v-select>
      <v-btn
        color="#1e5a3d"
        prepend-icon="mdi-plus"
        class="add-btn"
        @click="showAddDialog = true"
      >
        + Agregar Nota
      </v-btn>
    </div>

    <!-- Tabla de notas -->
    <v-card class="table-card" elevation="1">
      <v-alert v-if="error" type="error" variant="tonal" class="ma-4">
        {{ error }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="filteredNotas"
        :loading="isLoading"
        hide-default-footer
        class="notas-table"
      >
        <template v-slot:item.tipo="{ item }">
          <v-chip
            color="#4caf50"
            size="small"
            variant="flat"
          >
            {{ item.tipo }}
          </v-chip>
        </template>

        <template v-slot:item.nota="{ item }">
          <v-chip
            :color="getNotaColor(item.nota)"
            size="small"
            variant="flat"
          >
            {{ item.nota }}
          </v-chip>
        </template>

        <template v-slot:item.acciones="{ item }">
          <div class="actions-cell">
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="grey-darken-1"
              @click="handleEditNota(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              @click="handleDeleteNota(item)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>

      <div class="table-footer">
        <span class="text-caption text-medium-emphasis">
          {{ filteredNotas.length }} evaluaciones registradas
        </span>
      </div>
    </v-card>

    <!-- Dialog para agregar nota -->
    <v-dialog v-model="showAddDialog" max-width="600" @update:model-value="(val) => { if (!val) { error = null } else { fetchAvailableAsignaturas() } }">
      <v-card>
        <v-card-title>Agregar Nota</v-card-title>
        <v-card-text>
          <v-alert v-if="error && showAddDialog" type="error" variant="tonal" class="mb-4" closable @click:close="error = null">
            {{ error }}
          </v-alert>
          <v-select
            v-model="newNota.codAsignatura"
            :items="availableAsignaturas"
            item-title="nombreAsignatura"
            item-value="codAsignatura"
            label="Asignatura"
            variant="outlined"
            class="mb-4"
            @update:model-value="() => { newNota.semestreCursada = 1 }"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item
                v-bind="itemProps"
                :title="item.raw.nombreAsignatura"
                :subtitle="item.raw.codAsignatura"
              />
            </template>
            <template #selection="{ item }">
              <span v-if="item.raw">
                {{ item.raw.codAsignatura }} - {{ item.raw.nombreAsignatura }}
              </span>
            </template>
          </v-select>
          <v-text-field
            v-model.number="newNota.anhoCursada"
            label="Año Cursada"
            type="number"
            variant="outlined"
            class="mb-4"
            @update:model-value="() => { newNota.semestreCursada = 1 }"
          ></v-text-field>
          <v-select
            v-model.number="newNota.semestreCursada"
            :items="semestresDisponibles"
            item-title="title"
            item-value="value"
            label="Semestre"
            variant="outlined"
            class="mb-4"
            :disabled="!newNota.codAsignatura || !newNota.anhoCursada"
            hint="Solo se muestran semestres que no tienen nota para esta asignatura y año"
            persistent-hint
            @update:model-value="handleSemestreUpdate"
          ></v-select>
          <v-text-field
            v-model.number="newNota.nota"
            label="Nota *"
            type="number"
            step="0.1"
            min="1"
            max="7"
            variant="outlined"
            required
            :rules="[
              (v) => !!v || 'La nota es obligatoria',
              (v) => (v >= 1 && v <= 7) || 'La nota debe estar entre 1.0 y 7.0'
            ]"
            hint="Debes ingresar un valor entre 1.0 y 7.0"
            persistent-hint
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showAddDialog = false">Cancelar</v-btn>
          <v-btn color="#1e5a3d" @click="handleAddNota">Agregar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para editar nota -->
    <v-dialog v-model="showEditDialog" max-width="600">
      <v-card v-if="editingNota">
        <v-card-title>Editar Nota</v-card-title>
        <v-card-text>
          <v-select
            v-model="editingNota.codAsignatura"
            :items="availableAsignaturas"
            item-title="nombreAsignatura"
            item-value="codAsignatura"
            label="Asignatura"
            variant="outlined"
            class="mb-4"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item
                v-bind="itemProps"
                :title="item.raw.nombreAsignatura"
                :subtitle="item.raw.codAsignatura"
              />
            </template>
            <template #selection="{ item }">
              <span v-if="item.raw">
                {{ item.raw.codAsignatura }} - {{ item.raw.nombreAsignatura }}
              </span>
            </template>
          </v-select>
          <v-text-field
            v-model.number="editingNota.anhoCursada"
            label="Año Cursada"
            type="number"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-select
            v-model.number="editingNota.semestreCursada"
            :items="[1, 2]"
            label="Semestre"
            variant="outlined"
            class="mb-4"
          ></v-select>
          <v-text-field
            v-model.number="editingNota.nota"
            label="Nota"
            type="number"
            step="0.1"
            min="1"
            max="7"
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showEditDialog = false">Cancelar</v-btn>
          <v-btn color="#1e5a3d" @click="handleUpdateNota">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal de confirmación para eliminar nota -->
    <ConfirmDeleteDialog
      v-model="showDeleteDialog"
      :message="deleteMessage"
      :loading="isDeleting"
      @confirm="confirmDeleteNota"
      @cancel="cancelDeleteNota"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getApiBaseUrl } from '@/config/api'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'

const props = defineProps<{
  userId: string
  userRut?: string
  userMatricula?: string
}>()

const auth = useAuthStore()
const searchQuery = ref('')
const selectedAsignatura = ref('Todas las asignaturas')
const notas = ref<any[]>([])
const asignaturasOptions = ref<string[]>(['Todas las asignaturas'])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingNota = ref<any>(null)
const showDeleteDialog = ref(false)
const notaToDelete = ref<any>(null)
const deleteMessage = ref('')
const isDeleting = ref(false)
const newNota = ref({
  codAsignatura: '',
  anhoCursada: new Date().getFullYear(),
  semestreCursada: 1,
  nota: null as number | null,
})
const availableAsignaturas = ref<any[]>([])

// Cargar notas del alumno
const fetchNotas = async () => {
  if (!props.userRut || !auth.token) return

  isLoading.value = true
  error.value = null

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${props.userRut}/notas`
      : `${apiUrl}/api/v1/alumnos/${props.userRut}/notas`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token.trim()}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    const data = await response.json()
    
    // Mapear datos del backend y filtrar solo las notas que tienen valor numérico
    // Las asignaturas sin nota (nota = null) NO deben aparecer en la tabla
    notas.value = data
      .filter((nota: any) => nota.nota !== null && nota.nota !== undefined && typeof nota.nota === 'number')
      .map((nota: any) => ({
        id: nota.idNota,
        asignatura: nota.asignatura?.nombreAsignatura || nota.codAsignatura,
        codAsignatura: nota.codAsignatura,
        tipo: 'Nota', // Tipo genérico, se puede personalizar
        descripcion: `${nota.asignatura?.nombreAsignatura || ''} - ${nota.anhoCursada}-${nota.semestreCursada}`,
        nota: nota.nota,
        ponderacion: '100%', // No viene en el endpoint
        fecha: nota.anhoCursada ? `${nota.semestreCursada}-${nota.anhoCursada}` : '',
        anhoCursada: nota.anhoCursada,
        semestreCursada: nota.semestreCursada,
      }))

    // Actualizar lista de asignaturas para el filtro
    const asignaturasUnicas = [...new Set(notas.value.map(n => n.asignatura))]
    asignaturasOptions.value = ['Todas las asignaturas', ...asignaturasUnicas]
  } catch (err) {
    console.error('Error al cargar notas:', err)
    error.value = 'Error al cargar notas'
  } finally {
    isLoading.value = false
  }
}

// Cargar asignaturas disponibles para el alumno (solo las del estudiante actual)
const fetchAvailableAsignaturas = async () => {
  if (!props.userRut || !auth.token) return

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    // Usar el endpoint de asignaturas del alumno: GET /api/v1/alumnos/:rut/asignaturas
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${props.userRut}/asignaturas`
      : `${apiUrl}/api/v1/alumnos/${props.userRut}/asignaturas`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token.trim()}`,
      },
    })

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = 'No se pudo leer el error'
      }
      throw new Error(`Error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const dataArray: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
    // El endpoint devuelve asignaturas del alumno; mapear a codAsignatura / nombreAsignatura
    availableAsignaturas.value = dataArray.map((asig: any) => ({
      codAsignatura: asig.codAsignatura || asig.codigo,
      nombreAsignatura: asig.nombreAsignatura || asig.nombre,
      nivel: asig.nivel,
      ...asig,
    }))
  } catch (err) {
    console.error('Error al cargar asignaturas del alumno:', err)
  }
}

// Validar si ya existe una nota para esta combinación
const notaExiste = (codAsignatura: string, anhoCursada: number, semestreCursada: number): boolean => {
  return notas.value.some(
    (nota) =>
      nota.codAsignatura === codAsignatura &&
      nota.anhoCursada === anhoCursada &&
      nota.semestreCursada === semestreCursada
  )
}

// Handler para actualizar semestre cuando cambia la asignatura o año
const handleSemestreUpdate = () => {
  const disponibles = semestresDisponibles.value
  if (disponibles.length > 0 && !disponibles.find((s: any) => s.value === newNota.value.semestreCursada)) {
    newNota.value.semestreCursada = (disponibles[0] as any)?.value || 1
  }
}

// Agregar nota
// Nota: El backend ahora maneja automáticamente el caso de asignaturas sin nota (nota = null)
// Si existe un registro con nota = null, el backend lo actualiza automáticamente
const handleAddNota = async () => {
  if (!newNota.value.codAsignatura || !props.userRut || !auth.token) {
    error.value = 'Por favor, completa todos los campos requeridos (Asignatura, Año y Semestre)'
    return
  }

  // Validar que la nota sea obligatoria y tenga un valor válido
  if (!newNota.value.nota || newNota.value.nota === null || newNota.value.nota === undefined) {
    error.value = 'Debes ingresar una nota. El campo de nota es obligatorio.'
    return
  }

  if (newNota.value.nota < 1 || newNota.value.nota > 7) {
    error.value = 'La nota debe estar entre 1.0 y 7.0'
    return
  }

  // Verificar si ya existe una nota CON VALOR para esta combinación
  // Si existe, el backend lanzará error, pero mejor validar antes para mejor UX
  if (notaExiste(newNota.value.codAsignatura, newNota.value.anhoCursada, newNota.value.semestreCursada)) {
    error.value = 'Ya existe una nota para esta asignatura, año y semestre. Por favor, edita la nota existente o elige otra combinación.'
    return
  }

  // Si no hay nota para agregar y no existe registro previo, permitir crear sin nota
  // El backend manejará automáticamente si existe un registro con nota = null

  if (!props.userMatricula) {
    error.value = 'No se pudo obtener la matrícula del estudiante. Por favor, verifica los datos del usuario.'
    return
  }

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${props.userRut}/notas`
      : `${apiUrl}/api/v1/alumnos/${props.userRut}/notas`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token.trim()}`,
      },
      body: JSON.stringify({
        codAsignatura: newNota.value.codAsignatura,
        anhoCursada: newNota.value.anhoCursada,
        semestreCursada: newNota.value.semestreCursada,
        nota: newNota.value.nota || null,
        nroMatricula: props.userMatricula,
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Error al agregar nota'
      try {
        const errorText = await response.text()
        let errorData: any = null
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }

        // Extraer el mensaje del error del backend
        if (errorData.message) {
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ')
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message
          }
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch (e) {
        console.error('Error al parsear respuesta de error:', e)
      }
      throw new Error(errorMessage)
    }

    // El backend ahora maneja automáticamente:
    // - Si existe un registro con nota = null, lo actualiza con la nueva nota
    // - Si no existe, crea un nuevo registro
    // Recargar notas y asignaturas disponibles para reflejar los cambios
    await fetchNotas()
    await fetchAvailableAsignaturas()
    error.value = null // Limpiar error si todo salió bien
    showAddDialog.value = false
    newNota.value = {
      codAsignatura: '',
      anhoCursada: new Date().getFullYear(),
      semestreCursada: 1,
      nota: null,
    }
  } catch (err) {
    console.error('Error al agregar nota:', err)
    error.value = err instanceof Error ? err.message : 'Error al agregar nota'
  }
}

// Editar nota
const handleEditNota = (nota: any) => {
  editingNota.value = { ...nota }
  showEditDialog.value = true
}

const handleUpdateNota = async () => {
  if (!editingNota.value || !props.userRut || !auth.token) return

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${props.userRut}/notas/${editingNota.value.id}`
      : `${apiUrl}/api/v1/alumnos/${props.userRut}/notas/${editingNota.value.id}`

    const updateData: any = {}
    if (editingNota.value.codAsignatura) updateData.codAsignatura = editingNota.value.codAsignatura
    if (editingNota.value.anhoCursada) updateData.anhoCursada = editingNota.value.anhoCursada
    if (editingNota.value.semestreCursada) updateData.semestreCursada = editingNota.value.semestreCursada
    if (editingNota.value.nota !== null) updateData.nota = editingNota.value.nota

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token.trim()}`,
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error ${response.status}: ${errorText}`)
    }

    // Recargar notas y asignaturas disponibles
    await fetchNotas()
    await fetchAvailableAsignaturas()
    showEditDialog.value = false
    editingNota.value = null
  } catch (err) {
    console.error('Error al actualizar nota:', err)
    error.value = 'Error al actualizar nota'
  }
}

// Eliminar nota
const handleDeleteNota = (nota: any) => {
  if (!nota.id || !props.userRut || !auth.token) return
  notaToDelete.value = nota
  deleteMessage.value = `¿Estás seguro de eliminar la nota de ${nota.asignatura} (${nota.fecha})?`
  showDeleteDialog.value = true
}

const confirmDeleteNota = async () => {
  if (!notaToDelete.value || !props.userRut || !auth.token) return

  isDeleting.value = true
  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${props.userRut}/notas/${notaToDelete.value.id}`
      : `${apiUrl}/api/v1/alumnos/${props.userRut}/notas/${notaToDelete.value.id}`

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token.trim()}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }

    // Recargar notas y asignaturas disponibles
    await fetchNotas()
    await fetchAvailableAsignaturas()
    showDeleteDialog.value = false
    notaToDelete.value = null
  } catch (err) {
    console.error('Error al eliminar nota:', err)
    error.value = 'Error al eliminar nota'
  } finally {
    isDeleting.value = false
  }
}

const cancelDeleteNota = () => {
  notaToDelete.value = null
  deleteMessage.value = ''
}

onMounted(() => {
  fetchNotas()
  fetchAvailableAsignaturas()
})

watch(() => props.userRut, () => {
  if (props.userRut) {
    fetchNotas()
  }
})

const headers = [
  { title: 'ASIGNATURA', key: 'asignatura', sortable: true },
  { title: 'EVALUACIÓN', key: 'tipo', sortable: true },
  { title: 'DESCRIPCIÓN', key: 'descripcion', sortable: true },
  { title: 'NOTA', key: 'nota', sortable: true },
  { title: 'PONDERACIÓN', key: 'ponderacion', sortable: true },
  { title: 'FECHA', key: 'fecha', sortable: true },
  { title: 'ACCIONES', key: 'acciones', sortable: false, align: 'end' },
]

const filteredNotas = computed(() => {
  let filtered = notas.value
  if (selectedAsignatura.value !== 'Todas las asignaturas') {
    filtered = filtered.filter(n => n.asignatura === selectedAsignatura.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(n => 
      n.asignatura.toLowerCase().includes(query) ||
      n.descripcion.toLowerCase().includes(query) ||
      n.tipo.toLowerCase().includes(query)
    )
  }
  return filtered
})

const promedioPonderado = computed(() => {
  if (filteredNotas.value.length === 0) return '0.0'
  const total = filteredNotas.value.reduce((sum, n) => sum + n.nota, 0)
  return (total / filteredNotas.value.length).toFixed(1)
})

const notaMasAlta = computed(() => {
  if (filteredNotas.value.length === 0) return '0.0'
  return Math.max(...filteredNotas.value.map(n => n.nota)).toFixed(1)
})

const notaMasBaja = computed(() => {
  if (filteredNotas.value.length === 0) return '0.0'
  return Math.min(...filteredNotas.value.map(n => n.nota)).toFixed(1)
})

const getNotaColor = (nota: number): string => {
  if (nota >= 5.5) return '#4caf50'
  if (nota >= 4.0) return '#757575'
  return '#f44336'
}

// Computed para semestres disponibles (solo los que NO tienen nota para la asignatura y año seleccionados)
const semestresDisponibles = computed(() => {
  if (!newNota.value.codAsignatura || !newNota.value.anhoCursada) {
    return [
      { title: 'Semestre 1', value: 1 },
      { title: 'Semestre 2', value: 2 },
    ]
  }

  const todosLosSemestres = [1, 2]
  const semestresConNota = notas.value
    .filter(
      (nota) =>
        nota.codAsignatura === newNota.value.codAsignatura &&
        nota.anhoCursada === newNota.value.anhoCursada
    )
    .map((nota) => nota.semestreCursada)

  // Filtrar semestres que ya tienen nota
  const semestresDisponibles = todosLosSemestres.filter(
    (sem) => !semestresConNota.includes(sem)
  )

  // Si no hay semestres disponibles, mostrar ambos deshabilitados para que el usuario vea que ya tiene notas en ambos
  if (semestresDisponibles.length === 0) {
    return todosLosSemestres.map((sem) => ({
      title: `Semestre ${sem} (Ya tiene nota)`,
      value: sem,
      disabled: true,
    }))
  }

  return semestresDisponibles.map((sem) => ({
    title: `Semestre ${sem}`,
    value: sem,
  }))
})
</script>

<style scoped>
.user-notas-tab {
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
  min-width: 200px;
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

.actions-cell {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
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

