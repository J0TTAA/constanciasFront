<template>
  <div class="user-examenes-tab">
    <!-- Estadísticas -->
    <div class="stats-section">
      <v-card class="stat-card" elevation="1">
        <v-card-text class="text-center">
          <div class="stat-value text-h4 font-weight-bold" style="color: #d4af37">
            {{ pendientes }}
          </div>
          <div class="stat-label text-caption text-medium-emphasis">
            PENDIENTES
          </div>
        </v-card-text>
      </v-card>
      <v-card class="stat-card" elevation="1">
        <v-card-text class="text-center">
          <div class="stat-value text-h4 font-weight-bold" style="color: #4caf50">
            {{ rendidos }}
          </div>
          <div class="stat-label text-caption text-medium-emphasis">
            RENDIDOS
          </div>
        </v-card-text>
      </v-card>
      <v-card class="stat-card" elevation="1">
        <v-card-text class="text-center">
          <div class="stat-value text-h4 font-weight-bold" style="color: #f44336">
            {{ ausentes }}
          </div>
          <div class="stat-label text-caption text-medium-emphasis">
            AUSENTES
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Búsqueda y filtros -->
    <div class="search-section">
      <v-text-field
        v-model="searchQuery"
        placeholder="Buscar examen..."
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
        @click="showAddDialog = true"
      >
        + Programar Examen
      </v-btn>
    </div>

    <!-- Tabla de exámenes -->
    <v-card class="table-card" elevation="1">
      <v-alert v-if="error" type="error" variant="tonal" class="ma-4">
        {{ error }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="filteredExamenes"
        :loading="isLoading"
        hide-default-footer
        class="examenes-table"
      >
        <template v-slot:item.tipo="{ item }">
          <v-chip
            :color="getTipoColor(item.tipo)"
            size="small"
            variant="flat"
          >
            {{ item.tipo }}
          </v-chip>
        </template>

        <template v-slot:item.fechaHora="{ item }">
          <div class="fecha-hora-cell">
            <div class="d-flex align-center gap-2 mb-1">
              <v-icon size="small" color="grey-darken-1">mdi-calendar</v-icon>
              <span>{{ item.fecha }}</span>
            </div>
            <div class="d-flex align-center gap-2">
              <v-icon size="small" color="grey-darken-1">mdi-clock</v-icon>
              <span>{{ item.hora }}</span>
            </div>
          </div>
        </template>

        <template v-slot:item.estado="{ item }">
          <v-chip
            :color="getEstadoColor(item.estado)"
            size="small"
            variant="flat"
          >
            {{ item.estado }}
          </v-chip>
        </template>

        <template v-slot:item.nota="{ item }">
          <span v-if="item.nota" :style="{ color: item.nota >= 4.0 ? '#4caf50' : '#f44336' }">
            {{ item.nota }}
          </span>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <template v-slot:item.acciones="{ item }">
          <div class="actions-cell">
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="grey-darken-1"
              @click="handleEditExamen(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              @click="handleDeleteExamen(item)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>

      <div class="table-footer">
        <span class="text-caption text-medium-emphasis">
          {{ filteredExamenes.length }} exámenes registrados
        </span>
      </div>
    </v-card>

    <!-- Dialog para agregar examen -->
    <v-dialog v-model="showAddDialog" max-width="600">
      <v-card>
        <v-card-title>Programar Examen</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newExamen.fechaExamen"
            label="Fecha y Hora del Examen"
            type="datetime-local"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-text-field
            v-model.number="newExamen.notaExamen"
            label="Nota (opcional)"
            type="number"
            step="0.1"
            min="1"
            max="7"
            variant="outlined"
            hint="Dejar vacío si el examen aún no se ha rendido"
            persistent-hint
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showAddDialog = false">Cancelar</v-btn>
          <v-btn color="#1e5a3d" @click="handleAddExamen">Programar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para editar examen -->
    <v-dialog v-model="showEditDialog" max-width="600">
      <v-card v-if="editingExamen">
        <v-card-title>Editar Examen</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingExamen.fechaExamen"
            label="Fecha y Hora del Examen"
            type="datetime-local"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-text-field
            v-model.number="editingExamen.nota"
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
          <v-btn color="#1e5a3d" @click="handleUpdateExamen">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal de confirmación para eliminar examen -->
    <ConfirmDeleteDialog
      v-model="showDeleteDialog"
      :message="deleteMessage"
      :loading="isDeleting"
      @confirm="confirmDeleteExamen"
      @cancel="cancelDeleteExamen"
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
}>()

const auth = useAuthStore()
const searchQuery = ref('')
const selectedFilter = ref('Todos')
const filterOptions = ['Todos', 'Pendientes', 'Rendidos', 'Ausentes']
const examenes = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingExamen = ref<any>(null)
const showDeleteDialog = ref(false)
const examenToDelete = ref<any>(null)
const deleteMessage = ref('')
const isDeleting = ref(false)
const newExamen = ref({
  fechaExamen: '',
  notaExamen: null as number | null,
})

// Cargar exámenes del alumno
const fetchExamenes = async () => {
  if (!props.userRut || !auth.token) return

  isLoading.value = true
  error.value = null

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${props.userRut}/examenes`
      : `${apiUrl}/api/v1/alumnos/${props.userRut}/examenes`

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
    
    // Mapear datos del backend
    examenes.value = data.map((examen: any) => {
      const fecha = new Date(examen.fechaExamen)
      const fechaStr = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      
      return {
        id: examen.idExamen,
        tipo: 'Examen', // Tipo genérico
        fecha: fechaStr,
        hora: `${horaStr} hrs`,
        estado: examen.notaExamen ? 'Rendido' : 'Pendiente',
        nota: examen.notaExamen,
        fechaExamen: examen.fechaExamen,
      }
    })
  } catch (err) {
    console.error('Error al cargar exámenes:', err)
    error.value = 'Error al cargar exámenes'
  } finally {
    isLoading.value = false
  }
}

// Agregar examen
const handleAddExamen = async () => {
  if (!newExamen.value.fechaExamen || !props.userRut || !auth.token) return

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${props.userRut}/examenes`
      : `${apiUrl}/api/v1/alumnos/${props.userRut}/examenes`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token.trim()}`,
      },
      body: JSON.stringify({
        fechaExamen: newExamen.value.fechaExamen,
        notaExamen: newExamen.value.notaExamen || undefined,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error ${response.status}: ${errorText}`)
    }

    await fetchExamenes()
    showAddDialog.value = false
    newExamen.value = {
      fechaExamen: '',
      notaExamen: null,
    }
  } catch (err) {
    console.error('Error al agregar examen:', err)
    error.value = 'Error al agregar examen'
  }
}

// Editar examen
const handleEditExamen = (examen: any) => {
  editingExamen.value = { ...examen }
  showEditDialog.value = true
}

const handleUpdateExamen = async () => {
  if (!editingExamen.value || !props.userRut || !auth.token) return

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${props.userRut}/examenes/${editingExamen.value.id}`
      : `${apiUrl}/api/v1/alumnos/${props.userRut}/examenes/${editingExamen.value.id}`

    const updateData: any = {}
    if (editingExamen.value.fechaExamen) updateData.fechaExamen = editingExamen.value.fechaExamen
    if (editingExamen.value.nota !== null && editingExamen.value.nota !== undefined) {
      updateData.notaExamen = editingExamen.value.nota
    }

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

    await fetchExamenes()
    showEditDialog.value = false
    editingExamen.value = null
  } catch (err) {
    console.error('Error al actualizar examen:', err)
    error.value = 'Error al actualizar examen'
  }
}

// Eliminar examen
const handleDeleteExamen = (examen: any) => {
  if (!examen.id || !props.userRut || !auth.token) return
  examenToDelete.value = examen
  deleteMessage.value = `¿Estás seguro de eliminar el examen del ${examen.fecha} a las ${examen.hora}?`
  showDeleteDialog.value = true
}

const confirmDeleteExamen = async () => {
  if (!examenToDelete.value || !props.userRut || !auth.token) return

  isDeleting.value = true
  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${props.userRut}/examenes/${examenToDelete.value.id}`
      : `${apiUrl}/api/v1/alumnos/${props.userRut}/examenes/${examenToDelete.value.id}`

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

    await fetchExamenes()
    showDeleteDialog.value = false
    examenToDelete.value = null
  } catch (err) {
    console.error('Error al eliminar examen:', err)
    error.value = 'Error al eliminar examen'
  } finally {
    isDeleting.value = false
  }
}

const cancelDeleteExamen = () => {
  examenToDelete.value = null
  deleteMessage.value = ''
}

onMounted(() => {
  fetchExamenes()
})

watch(() => props.userRut, () => {
  if (props.userRut) {
    fetchExamenes()
  }
})

const headers = [
  { title: 'TIPO', key: 'tipo', sortable: true },
  { title: 'FECHA Y HORA', key: 'fechaHora', sortable: true },
  { title: 'ESTADO', key: 'estado', sortable: true },
  { title: 'NOTA', key: 'nota', sortable: true },
  { title: 'ACCIONES', key: 'acciones', sortable: false, align: 'end' },
]

const filteredExamenes = computed(() => {
  let filtered = examenes.value
  if (selectedFilter.value !== 'Todos') {
    filtered = filtered.filter(e => {
      if (selectedFilter.value === 'Pendientes') return e.estado === 'Pendiente'
      if (selectedFilter.value === 'Rendidos') return e.estado === 'Rendido'
      if (selectedFilter.value === 'Ausentes') return e.estado === 'Ausente'
      return true
    })
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(e => 
      e.tipo.toLowerCase().includes(query) ||
      e.fecha.toLowerCase().includes(query)
    )
  }
  return filtered
})

const pendientes = computed(() => examenes.value.filter(e => e.estado === 'Pendiente').length)
const rendidos = computed(() => examenes.value.filter(e => e.estado === 'Rendido').length)
const ausentes = computed(() => examenes.value.filter(e => e.estado === 'Ausente').length)

const getTipoColor = (tipo: string): string => {
  const colors: Record<string, string> = {
    'Parcial': '#4caf50',
    'Final': '#4caf50',
    'Control': '#d4af37',
    'Recuperativo': '#d4af37',
  }
  return colors[tipo] || '#757575'
}

const getEstadoColor = (estado: string): string => {
  const colors: Record<string, string> = {
    'Rendido': '#4caf50',
    'Pendiente': '#d4af37',
    'Ausente': '#f44336',
  }
  return colors[estado] || '#757575'
}
</script>

<style scoped>
.user-examenes-tab {
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

.fecha-hora-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.actions-cell {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
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

