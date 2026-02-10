<template>
  <div class="solicitudes-wrapper">
    <template v-if="!selectedRequest">
      <div class="d-flex align-center gap-2 mb-5">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        size="large"
        @click="showModal = true"
      >
        Nueva Solicitud
      </v-btn>
        
        <!-- Botón para recargar solicitudes -->
        <v-btn
          color="secondary"
          variant="outlined"
          size="small"
          prepend-icon="mdi-refresh"
          :loading="isLoadingRequests"
          :disabled="isLoadingRequests || !auth.token"
          @click="fetchRequests({ showFeedback: true })"
        >
          Actualizar
        </v-btn>
      </div>

      <v-card class="rounded-lg" variant="outlined" color="#e0e0e0">
        <v-data-table 
          :headers="headers" 
          :items="tableItems" 
          :loading="isLoadingRequests"
          class="rounded-lg"
        >
          <template v-slot:[`item.estado`]="{ value }">
            <v-chip
              :color="getStatusColor(value)"
              :prepend-icon="getStatusIcon(value)"
              size="small"
            >
              {{ value }}
            </v-chip>
          </template>

          <template v-slot:[`item.actions`]="{ item }">
            <v-btn
              variant="text"
              color="primary"
              append-icon="mdi-chevron-right"
              density="compact"
              @click="handleSlotItemOpen(item)"
            >
              Ver Detalles
            </v-btn>
          </template>

          <template #no-data>
            <div class="pa-4 text-center">
              <p v-if="isLoadingRequests">Cargando solicitudes...</p>
              <p v-else-if="requestsError">{{ requestsError }}</p>
              <p v-else>No tienes ninguna solicitud creada.</p>
            </div>
          </template>
        </v-data-table>
      </v-card>

      <modal-nueva-solicitud v-model="showModal" @submit="handleNuevaSolicitud" />
    </template>

    <request-detail
      v-else-if="selectedRequest"
      :request="selectedRequest"
      :user="currentUser"
      @back="handleBack"
      @update="handleRequestUpdate"
    />

    <v-snackbar
      v-model="snackbarOpen"
      :color="snackbarColor"
      :timeout="2500"
      location="bottom"
    >
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { VDataTable } from 'vuetify/components'
import { getApiBaseUrl } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import RequestDetail from './RequestDetail.vue'
import ModalNuevaSolicitud from './ModalNuevaSolicitud.vue'
import { RequestStatus, UserRole } from '@/types/requestTypes'
import type { Request, User } from '@/types/requestTypes'

type BackendRequestItem = {
  idSolicitud?: string | number
  codigoDocumento?: string | number
  idDocumento?: string | number
  id_documento?: string | number
  idConstancia?: string | number
  documentoId?: string | number
  documentId?: string | number
  tipoConstancia?: { nombre?: string } | string
  fechaSolicitud?: string
  fechaActualizacion?: string
  estadoActual?: string
  historiales?: Array<{ estado?: { nombreEstado?: string } }>
  observacionAlumno?: string
  observaciones?: string
  urlArchivo?: string
  fileUrl?: string
  documentoUrl?: string
}

type BackendResponseList = BackendRequestItem[] | { data?: BackendRequestItem[]; solicitudes?: BackendRequestItem[] }

type NuevaSolicitudBody = {
  nombreTipoConstancia: string
  observacionAlumno?: string
  [key: string]: unknown
}

const readErrorField = (obj: Record<string, unknown> | null, key: string): string | undefined =>
  obj && typeof obj[key] === 'string' ? (obj[key] as string) : undefined

const auth = useAuthStore()

const requests = ref<Request[]>([])
const isLoadingRequests = ref(false)
const requestsError = ref<string | null>(null)

const selectedRequestId = ref<string | null>(null)

const showModal = ref(false)

const snackbarOpen = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error' | 'info'>('info')

const headers = ref<VDataTable['$props']['headers']>([
  { title: 'TIPO CONSTANCIA', key: 'tipo' },
  { title: 'FECHA SOLICITUD', key: 'fecha' },
  { title: 'ESTADO', key: 'estado' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
])

const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('es-CL')

const tableItems = computed(() =>
  requests.value.map((request) => ({
    id: request.id,
    tipo: request.type,
    fecha: formatDate(request.requestDate),
    estado: request.status,
    raw: request,
  })),
)

const selectedRequest = computed<Request | null>(() => {
  if (!selectedRequestId.value) return null
  return requests.value.find((request) => request.id === selectedRequestId.value) ?? null
})

const currentUser = computed<User>(() => ({
  id: auth.user?.email ?? 'estudiante@ufro.cl',
  name: auth.user?.name ?? 'Estudiante UFRO',
  email: auth.user?.email ?? 'estudiante@ufro.cl',
  role: UserRole.STUDENT,
}))

// Función para mapear el estado del backend al RequestStatus del frontend
const mapBackendStatusToRequestStatus = (backendStatus: string): RequestStatus => {
  // Normalizar el estado a mayúsculas para comparación
  const normalizedStatus = backendStatus.toUpperCase().trim()
  
  const statusMap: Record<string, RequestStatus> = {
    // Estados en mayúsculas (formato del backend)
    'SOLICITADA': RequestStatus.REQUESTED,
    'EN REVISIÓN': RequestStatus.IN_REVIEW,
    'EN REVISION': RequestStatus.IN_REVIEW,
    'PARA FIRMA': RequestStatus.AWAITING_SIGNATURE,
    'FIRMADO Y DISPONIBLE': RequestStatus.SIGNED,
    'FIRMADO': RequestStatus.SIGNED,
    'FIRMADA': RequestStatus.SIGNED,
    'RECHAZADO': RequestStatus.REJECTED,
    // Estados en formato normal (por si acaso)
    'Solicitado': RequestStatus.REQUESTED,
    'Solicitada': RequestStatus.REQUESTED,
    'En Revisión': RequestStatus.IN_REVIEW,
    'En Revision': RequestStatus.IN_REVIEW,
    'Para Firma': RequestStatus.AWAITING_SIGNATURE,
    'Firmado y Disponible': RequestStatus.SIGNED,
    'Firmado': RequestStatus.SIGNED,
    'Rechazado': RequestStatus.REJECTED,
    // También manejar posibles valores en inglés o otros formatos
    'REQUESTED': RequestStatus.REQUESTED,
    'IN_REVIEW': RequestStatus.IN_REVIEW,
    'AWAITING_SIGNATURE': RequestStatus.AWAITING_SIGNATURE,
    'SIGNED': RequestStatus.SIGNED,
    'REJECTED': RequestStatus.REJECTED,
  }
  
  return statusMap[normalizedStatus] || RequestStatus.REQUESTED
}

// Función para obtener las solicitudes del backend
const fetchRequests = async (opts?: { showFeedback?: boolean }) => {
  const showFeedback = opts?.showFeedback === true

  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  
  if (!tokenFromStore) {
    console.error('❌ No hay token disponible para obtener las solicitudes')
    requestsError.value = 'No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.'
    if (showFeedback) {
      snackbarColor.value = 'error'
      snackbarText.value = 'No hay sesión activa. Inicia sesión nuevamente.'
      snackbarOpen.value = true
    }
    return
  }

  isLoadingRequests.value = true
  requestsError.value = null

  try {
    // Usar URL base normalizada (sin /api/v1 duplicado)
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV
    
    // 📋 Logs de configuración del backend API
    console.log('🔌 [Solicitudes] Configuración del Backend API:')
    console.log('   - Base URL (normalizada):', apiUrl)
    console.log('   - Modo:', isDevelopment ? 'Desarrollo (con proxy)' : 'Producción (URL completa)')
    console.log('   - URL base del backend:', apiUrl)
    
    // En desarrollo, usar proxy de Vite. En producción, usar la URL completa
    const endpoint = isDevelopment
      ? '/api/v1/constancias/mis'
      : `${apiUrl}/api/v1/constancias/mis`
    
    console.log('📥 [Solicitudes] Obteniendo solicitudes del backend...')
    console.log('   - Endpoint relativo:', '/api/v1/constancias/mis')
    console.log('   - Endpoint completo:', endpoint)
    console.log('   - URL final que se usará:', isDevelopment ? `http://localhost:3000${endpoint} (proxy → ${apiUrl}${endpoint})` : endpoint)

    // Limpiar el token de espacios
    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
    })

    console.log('📥 [Solicitudes] Respuesta recibida:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   OK:', response.ok)

    if (!response.ok) {
      let errorText = ''
      let errorData: Record<string, unknown> | null = null
      
      try {
        errorText = await response.text()
        try {
          const parsed = JSON.parse(errorText) as unknown
          errorData =
            typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : { message: String(parsed) }
        } catch {
          errorData = { message: errorText }
        }
      } catch {
        errorText = 'No se pudo leer el cuerpo de la respuesta'
        errorData = { message: errorText }
      }

      console.error('❌ [Solicitudes] Error al obtener las solicitudes:')
      console.error('   Status:', response.status)
      console.error('   Error:', JSON.stringify(errorData, null, 2))

      const errorMessage =
        readErrorField(errorData, 'message') ||
        readErrorField(errorData, 'msg') ||
        `Error ${response.status}: ${response.statusText}`
      requestsError.value = `Error al cargar las solicitudes: ${errorMessage}`
      if (showFeedback) {
        snackbarColor.value = 'error'
        snackbarText.value = 'No se pudieron actualizar los datos.'
        snackbarOpen.value = true
      }
      return
    }

    // Leer la respuesta exitosa
    const responseData = await response.json()
    console.log('✅ [Solicitudes] Solicitudes obtenidas exitosamente:')
    console.log('   Respuesta:', JSON.stringify(responseData, null, 2))

    // Mapear la respuesta del backend al formato Request
    // El backend devuelve un array directamente
    const backendRequests: BackendRequestItem[] = Array.isArray(responseData as BackendResponseList)
      ? (responseData as BackendRequestItem[])
      : ((responseData as { data?: BackendRequestItem[]; solicitudes?: BackendRequestItem[] }).data ||
          (responseData as { data?: BackendRequestItem[]; solicitudes?: BackendRequestItem[] }).solicitudes ||
          [])

    const mappedRequests: Request[] = backendRequests.map((item, index: number) => {
      // Mapear los campos del backend al formato Request según la estructura real:
      // { idSolicitud, tipoConstancia, fechaSolicitud, estadoActual, historiales }
      const documentIdCandidate =
        item.codigoDocumento ??
        item.idDocumento ??
        item.id_documento ??
        item.idConstancia ??
        item.documentoId ??
        item.documentId ??
        null

      // Opción 1 (recomendada): usar estadoActual
      // Opción 2: si estadoActual no está, usar el primer historial
      const estadoBackend = item.estadoActual || 
        item.historiales?.[0]?.estado?.nombreEstado || 
        'SOLICITADA'

      // Extraer el nombre del tipo de constancia (puede venir como objeto o string)
      const tipoConstanciaNombre = typeof item.tipoConstancia === 'object' && item.tipoConstancia !== null
        ? item.tipoConstancia.nombre
        : item.tipoConstancia

      const request: Request = {
        id: item.idSolicitud?.toString() || `RRNN-${index + 1}`,
        documentId: documentIdCandidate ? documentIdCandidate.toString() : undefined,
        type: tipoConstanciaNombre || 'N/A',
        studentName: auth.user?.name || 'Estudiante',
        studentId: auth.user?.email || 'N/A',
        requestDate: item.fechaSolicitud || new Date().toISOString(),
        lastUpdateDate: item.fechaActualizacion || item.fechaSolicitud || new Date().toISOString(),
        status: mapBackendStatusToRequestStatus(estadoBackend),
        observations: item.observacionAlumno || item.observaciones || '',
        history: [
          {
            id: `${item.idSolicitud || index}-1`,
            date: item.fechaSolicitud || new Date().toISOString(),
            user: auth.user?.name || 'Estudiante',
            status: mapBackendStatusToRequestStatus(estadoBackend),
            observation: item.observacionAlumno || item.observaciones || 'Solicitud creada.',
          },
        ],
        fileUrl: item.urlArchivo || item.fileUrl || item.documentoUrl || undefined,
      }

      return request
    })

    requests.value = mappedRequests
    console.log(`✅ [Solicitudes] ${mappedRequests.length} solicitudes cargadas`)
    if (showFeedback) {
      snackbarColor.value = 'success'
      snackbarText.value = 'Datos actualizados.'
      snackbarOpen.value = true
    }

  } catch (error) {
    console.error('❌ [Solicitudes] Error al obtener las solicitudes:', error)
    requestsError.value = `Error al cargar las solicitudes: ${error instanceof Error ? error.message : 'Error desconocido'}`
    if (showFeedback) {
      snackbarColor.value = 'error'
      snackbarText.value = 'Error al actualizar los datos.'
      snackbarOpen.value = true
    }
  } finally {
    isLoadingRequests.value = false
  }
}

// Cargar las solicitudes cuando el componente se monte
onMounted(async () => {
  await fetchRequests({ showFeedback: false })
})

// Recargar las solicitudes cuando el usuario cambie
watch(
  () => auth.user?.email,
  async (newEmail) => {
    if (newEmail) {
      await fetchRequests({ showFeedback: false })
    }
  },
  { immediate: false },
)

const handleSlotItemOpen = (slotItem: unknown) => {
  const casted = slotItem as { raw?: { id?: string | null } }
  const idCandidate = casted?.raw?.id ?? null
  openDetails(idCandidate)
}

const openDetails = (id: string | null | undefined) => {
  if (!id) return
  selectedRequestId.value = id
}

const handleBack = () => {
  selectedRequestId.value = null
}

const appendHistory = (request: Request, status: RequestStatus, observation: string) => {
  request.history = [
    ...request.history,
    {
      id: `${request.id}-${request.history.length + 1}`,
      date: new Date().toISOString(),
      user: currentUser.value.name,
      status,
      observation,
    },
  ]
  request.lastUpdateDate = new Date().toISOString()
}

const handleRequestUpdate = (
  id: string,
  newStatus: RequestStatus,
  observation: string,
  fileUrl?: string,
) => {
  const request = requests.value.find((item) => item.id === id)
  if (!request) return

  request.status = newStatus
  if (fileUrl) {
    request.fileUrl = fileUrl
  }

  appendHistory(request, newStatus, observation)
}

const getStatusColor = (estado: string) => {
  switch (estado) {
    case RequestStatus.SIGNED:
      return 'success'
    case RequestStatus.IN_REVIEW:
      return 'warning'
    case RequestStatus.AWAITING_SIGNATURE:
      return 'info'
    case RequestStatus.REQUESTED:
      return 'blue'
    default:
      return 'grey'
  }
}

const getStatusIcon = (estado: string) => {
  switch (estado) {
    case RequestStatus.SIGNED:
      return 'mdi-check-circle'
    case RequestStatus.IN_REVIEW:
      return 'mdi-clock-outline'
    case RequestStatus.AWAITING_SIGNATURE:
      return 'mdi-draw-pen'
    case RequestStatus.REQUESTED:
      return 'mdi-file-document'
    default:
      return 'mdi-help-circle'
  }
}

const handleNuevaSolicitud = async (solicitudBody: NuevaSolicitudBody) => {
  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  // Obtener el token del store
  const tokenFromStore = auth.token
  
  if (!tokenFromStore) {
    console.error('❌ No hay token disponible en el store')
    alert('Error: No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.')
    return
  }

  // Limpiar el token de espacios y caracteres extra
  const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')
  
  if (!cleanToken || !cleanToken.startsWith('eyJ')) {
    console.error('❌ Token vacío o inválido')
    alert('Error: Token de autenticación inválido. Por favor, inicia sesión nuevamente.')
    return
  }

  try {
    // Usar URL base normalizada (sin /api/v1 duplicado)
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    
    // En desarrollo, usar proxy de Vite. En producción, usar la URL completa
    let endpoint: string
    if (isDevelopment) {
      endpoint = '/api/v1/constancias/solicitar'
    } else {
      if (!apiUrl || apiUrl.trim() === '') {
        throw new Error('VITE_API_URL no está configurada. Por favor, configura la variable de entorno VITE_API_URL en el servidor.')
      }
      endpoint = `${apiUrl}/api/v1/constancias/solicitar`
    }
    
    // Validar que el endpoint sea válido
    if (!endpoint || endpoint.trim() === '') {
      throw new Error('No se pudo determinar la URL del endpoint del backend. Verifica la configuración de VITE_API_URL.')
    }
    
    console.log('📤 [Nueva Solicitud] Enviando solicitud al backend...')
    console.log('   Tipo de constancia:', solicitudBody.nombreTipoConstancia)
    console.log('   Endpoint:', endpoint)
    console.log('   Body:', JSON.stringify(solicitudBody, null, 2))

    // Headers con el token
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cleanToken}`,
    }

    // Hacer la petición
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(solicitudBody),
    })

    console.log('📥 [Nueva Solicitud] Respuesta recibida:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   OK:', response.ok)

    if (!response.ok) {
      // Intentar leer el error
      let errorText = ''
      let errorData: Record<string, unknown> | null = null
      
      try {
        errorText = await response.text()
        try {
          const parsed = JSON.parse(errorText) as unknown
          errorData =
            typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : { message: String(parsed) }
        } catch {
          errorData = { message: errorText }
        }
      } catch {
        errorText = 'No se pudo leer el cuerpo de la respuesta'
        errorData = { message: errorText }
      }

      console.error('❌ [Nueva Solicitud] Error en la respuesta:')
      console.error('   Status:', response.status)
      console.error('   Error:', JSON.stringify(errorData, null, 2))

      const errorMessage =
        readErrorField(errorData, 'message') ||
        readErrorField(errorData, 'msg') ||
        `Error ${response.status}: ${response.statusText}`
      alert(`Error al crear la solicitud:\n\n${errorMessage}`)
      return
    }

    // Leer la respuesta exitosa
    const responseData = await response.json()
    console.log('✅ [Nueva Solicitud] Solicitud creada exitosamente:')
    console.log('   Respuesta:', JSON.stringify(responseData, null, 2))

    // Recargar las solicitudes desde el backend para obtener la versión actualizada
    await fetchRequests()
    
    // Cerrar el modal después de éxito
    showModal.value = false

    // Mostrar mensaje de éxito (opcional, puedes usar un snackbar en lugar de alert)
    console.log('✅ Solicitud creada exitosamente')

  } catch (error) {
    console.error('❌ [Nueva Solicitud] Error al hacer la petición:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Error desconocido'
    
    // Si el error menciona apiUrl, dar un mensaje más claro
    if (errorMessage.includes('apiUrl') || errorMessage.includes('is not defined')) {
      console.error('   🔴 Error de configuración: VITE_API_URL no está definida o es inválida')
      console.error('   Verifica que la variable de entorno VITE_API_URL esté configurada correctamente')
      console.error('   Valor actual de VITE_API_URL:', import.meta.env.VITE_API_URL || '(no definida)')
      alert(`Error de configuración:\n\nLa URL del backend no está configurada correctamente.\n\nVerifica que la variable VITE_API_URL esté definida en el archivo .env o en las variables de entorno del servidor.\n\nValor actual: ${import.meta.env.VITE_API_URL || '(no definida)'}`)
    } else {
      alert(`Error al crear la solicitud:\n\n${errorMessage}`)
    }
  }
}
</script>

<style scoped>
.solicitudes-wrapper {
  padding-left: 12px;
}
</style>
