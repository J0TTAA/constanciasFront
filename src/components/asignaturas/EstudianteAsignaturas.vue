<template>
  <div>
    <!-- Título y subtítulo para el Estudiante -->
    <h1 class="text-h4 font-weight-bold">Mis Asignaturas y Calificaciones</h1>
    <p class="mt-2 text-medium-emphasis">
      Aquí se listan las asignaturas que has cursado, junto con sus calificaciones y estado.
    </p>

    <!-- Barra de búsqueda y filtros -->
    <div class="search-filters-section mt-4">
      <v-text-field
        v-model="searchQuery"
        placeholder="Buscar por código o nombre..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        class="search-field"
      ></v-text-field>
      <v-select
        v-model="selectedEstado"
        :items="estadoOptions"
        label="Estado"
        variant="outlined"
        density="comfortable"
        hide-details
        class="filter-select"
      ></v-select>
      <v-select
        v-model="selectedSemestre"
        :items="semestreOptions"
        label="Semestre"
        variant="outlined"
        density="comfortable"
        hide-details
        class="filter-select"
      ></v-select>
    </div>

    <!-- La Tabla del Estudiante -->
    <v-card class="rounded-lg mt-6" variant="outlined" color="#e0e0e0">
      <v-alert v-if="error" type="warning" variant="tonal" class="ma-4">
        {{ error }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="filteredAsignaturas"
        :loading="isLoading"
        class="rounded-lg"
      >
        <!-- Plantilla para la columna de ESTADO -->
        <template v-slot:[`item.estado`]="{ value }">
          <v-chip
            :color="getStatusColor(value)"
            :prepend-icon="getStatusIcon(value)"
            size="small"
            label
          >
            {{ value }}
          </v-chip>
        </template>

        <!-- Plantilla para la columna de CALIFICACIÓN -->
        <template v-slot:[`item.calificacion`]="{ value }">
          <span :style="{ color: value === 'Sin notas' ? '#757575' : parseFloat(value) >= 4.0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }">
            {{ value }}
          </span>
        </template>

        <!-- Mensaje cuando no hay datos -->
        <template v-slot:no-data>
          <p class="pa-4 text-center">No tienes asignaturas registradas.</p>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getApiBaseUrl } from '@/config/api'
import type { VDataTable } from 'vuetify/components'

const auth = useAuthStore()

// --- Cabeceras de la tabla (Vista Estudiante) ---
const headers = ref<VDataTable['$props']['headers']>([
  { title: 'CÓDIGO', key: 'codigo', sortable: true },
  { title: 'NOMBRE ASIGNATURA', key: 'nombre', sortable: true },
  { title: 'AÑO', key: 'anho', sortable: true },
  { title: 'SEMESTRE', key: 'semestre', sortable: true },
  { title: 'CALIFICACIÓN', key: 'calificacion', align: 'end', sortable: true },
  { title: 'ESTADO', key: 'estado', sortable: true },
])

// --- Datos de asignaturas desde el backend ---
const notas = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// --- Filtros ---
const searchQuery = ref('')
const selectedEstado = ref('Todos')
const selectedSemestre = ref('Todos')

const estadoOptions = ['Todos', 'Aprobada', 'En Curso', 'Reprobada']
const semestreOptions = computed(() => {
  const semestres = new Set<string>()
  asignaturas.value.forEach((asig) => {
    if (asig.semestre && asig.semestre !== 'N/A') {
      semestres.add(asig.semestre)
    }
  })
  return ['Todos', ...Array.from(semestres).sort()]
})

// Asignaturas filtradas
const filteredAsignaturas = computed(() => {
  let filtered = asignaturas.value

  // Filtro por búsqueda (código o nombre)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(
      (asig) =>
        asig.codigo?.toLowerCase().includes(query) ||
        asig.nombre?.toLowerCase().includes(query),
    )
  }

  // Filtro por estado
  if (selectedEstado.value !== 'Todos') {
    filtered = filtered.filter((asig) => asig.estado === selectedEstado.value)
  }

  // Filtro por semestre
  if (selectedSemestre.value !== 'Todos') {
    filtered = filtered.filter((asig) => asig.semestre === selectedSemestre.value)
  }

  return filtered
})

// Cargar notas del estudiante desde el backend
const fetchNotas = async () => {
  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  
  if (!tokenFromStore) {
    error.value = 'No hay token de autenticación disponible'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    
    // Limpiar el token de espacios
    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')

    // Intentar obtener el RUT del estudiante desde el token JWT
    // El RUT puede estar en user_metadata o app_metadata
    let studentRut: string | null = null
    
    try {
      const jwtDecode = (await import('jwt-decode')).default
      const decodedToken: any = jwtDecode(cleanToken)
      
      // Buscar RUT en diferentes ubicaciones del metadata
      if (decodedToken.user_metadata?.rut) {
        studentRut = decodedToken.user_metadata.rut
      } else if (decodedToken.app_metadata?.rut) {
        studentRut = decodedToken.app_metadata.rut
      } else if (decodedToken.rut) {
        studentRut = decodedToken.rut
      }
    } catch (e) {
      console.warn('No se pudo decodificar el token para obtener el RUT:', e)
    }

    // Si no encontramos el RUT en el token, intentar obtenerlo desde /auth/me
    if (!studentRut) {
      try {
        const meEndpoint = isDevelopment
          ? '/api/v1/auth/me'
          : `${apiUrl}/api/v1/auth/me`
        
        const meResponse = await fetch(meEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanToken}`,
          },
        })

        if (meResponse.ok) {
          const meData = await meResponse.json()
          studentRut = meData.rut || meData.alumno?.rut || null
        }
      } catch (e) {
        console.warn('No se pudo obtener el RUT desde /auth/me:', e)
      }
    }

    if (!studentRut) {
      error.value = 'No se pudo obtener el RUT del estudiante. Por favor, contacta al administrador.'
      isLoading.value = false
      return
    }

    // Obtener las notas del estudiante usando su RUT
    const notasEndpoint = isDevelopment
      ? `/api/v1/alumnos/${studentRut}/notas`
      : `${apiUrl}/api/v1/alumnos/${studentRut}/notas`

    const response = await fetch(notasEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
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

      throw new Error(`Error ${response.status}: ${errorData.message || errorText}`)
    }

    const data = await response.json()
    notas.value = data
    
  } catch (err) {
    console.error('Error al cargar notas:', err)
    error.value = err instanceof Error ? err.message : 'Error al cargar las notas del estudiante'
  } finally {
    isLoading.value = false
  }
}

// Mapear notas a asignaturas para la tabla
const asignaturas = computed(() => {
  return notas.value.map((nota: any) => {
    const notaNum = nota.nota
    let estado = 'En Curso'
    let calificacion = 'Sin notas'
    
    if (notaNum !== null && notaNum !== undefined) {
      calificacion = notaNum.toFixed(1)
      if (notaNum >= 4.0) {
        estado = 'Aprobada'
      } else {
        estado = 'Reprobada'
      }
    }
    
    return {
      codigo: nota.codAsignatura,
      nombre: nota.asignatura?.nombreAsignatura || nota.codAsignatura,
      anho: nota.anhoCursada || 'N/A',
      semestre: nota.semestreCursada === 1 ? 'I Semestre' : nota.semestreCursada === 2 ? 'II Semestre' : 'N/A',
      calificacion: calificacion,
      estado: estado,
    }
  })
})

// --- Lógica para los chips de estado ---
const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'Aprobada': return 'success'
    case 'En Curso': return 'info'
    case 'Reprobada': return 'error'
    default: return 'grey'
  }
}
const getStatusIcon = (estado: string) => {
  switch (estado) {
    case 'Aprobada': return 'mdi-check-circle'
    case 'En Curso': return 'mdi-clock-outline'
    case 'Reprobada': return 'mdi-alert-circle'
    default: return 'mdi-help-circle'
  }
}

onMounted(() => {
  fetchNotas()
})
</script>

<style scoped>
.search-filters-section {
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

@media (max-width: 960px) {
  .search-filters-section {
    flex-direction: column;
  }

  .search-field,
  .filter-select {
    width: 100%;
    max-width: 100%;
  }
}
</style>
