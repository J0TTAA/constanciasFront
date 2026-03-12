<template>
  <div>
    <!-- Título y subtítulo para Admin/Secretaria/Director -->
    <h1 class="text-h4 font-weight-bold">Malla Curricular del Programa</h1>
    <p class="mt-2 text-medium-emphasis">
      Listado de todas las asignaturas ofrecidas en el programa de doctorado.
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
        v-model="selectedNivel"
        :items="nivelOptions"
        label="Nivel"
        variant="outlined"
        density="comfortable"
        hide-details
        class="filter-select"
      ></v-select>
    </div>

    <!-- La Tabla de la Malla -->
    <v-card class="rounded-lg mt-6" variant="outlined" color="#e0e0e0">
      <v-alert v-if="error" type="error" variant="tonal" class="ma-4">
        {{ error }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="filteredAsignaturas"
        :loading="isLoading"
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
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getApiBaseUrl } from '@/config/api'
import type { VDataTable } from 'vuetify/components'

const auth = useAuthStore()

// --- Cabeceras de la tabla (Vista Admin/Malla) ---
const headers = ref<VDataTable['$props']['headers']>([
  { title: 'CÓDIGO', key: 'codigo', sortable: true },
  { title: 'NOMBRE ASIGNATURA', key: 'nombre', sortable: true },
  { title: 'NIVEL', key: 'nivel', sortable: true },
])

// --- Datos de asignaturas desde el backend ---
const asignaturas = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// --- Filtros ---
const searchQuery = ref('')
const selectedNivel = ref('Todos')

// Opciones de nivel (se generan dinámicamente desde los datos)
const nivelOptions = computed(() => {
  const niveles = new Set<string>()
  asignaturas.value.forEach((asig) => {
    if (asig.nivel && asig.nivel !== 'N/A') {
      niveles.add(asig.nivel)
    }
  })
  return ['Todos', ...Array.from(niveles).sort()]
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

  // Filtro por nivel
  if (selectedNivel.value !== 'Todos') {
    filtered = filtered.filter((asig) => asig.nivel === selectedNivel.value)
  }

  return filtered
})

// Cargar asignaturas desde el backend
const fetchAsignaturas = async () => {
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
    const endpoint = isDevelopment
      ? '/api/v1/asignaturas'
      : `${apiUrl}/api/v1/asignaturas`

    // Limpiar el token de espacios
    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')

    const response = await fetch(endpoint, {
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
    
    // Mapear los datos del backend al formato esperado por la tabla
    asignaturas.value = data.map((asig: any) => ({
      codigo: asig.codAsignatura,
      nombre: asig.nombreAsignatura,
      nivel: asig.nivel || 'N/A',
      // Campos adicionales del backend
      codAsignatura: asig.codAsignatura,
      nombreAsignatura: asig.nombreAsignatura,
    }))
  } catch (err) {
    console.error('Error al cargar asignaturas:', err)
    error.value = err instanceof Error ? err.message : 'Error al cargar asignaturas'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAsignaturas()
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
  min-width: 180px;
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
