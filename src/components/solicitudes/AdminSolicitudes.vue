<template>
  <div class="solicitudes-wrapper">
    <template v-if="!selectedRequest">
      <div class="d-flex align-center gap-2 mb-5">
        <!-- Botón para recargar solicitudes -->
        <v-btn
          color="secondary"
          variant="outlined"
          size="small"
          prepend-icon="mdi-refresh"
          :loading="isLoadingRequests"
          :disabled="isLoadingRequests || !auth.token"
          @click="fetchRequests"
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
              <p v-else>No hay solicitudes pendientes.</p>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <request-detail
      v-else-if="selectedRequest"
      :request="selectedRequest"
      :user="currentUser"
      @back="handleBack"
      @update="handleRequestUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { VDataTable } from 'vuetify/components'
import { useAuthStore } from '@/stores/auth'
import RequestDetail from './RequestDetail.vue'
import { RequestStatus, UserRole } from '@/types/requestTypes'
import type { Request, User } from '@/types/requestTypes'

const auth = useAuthStore()

const requests = ref<Request[]>([])
const isLoadingRequests = ref(false)
const requestsError = ref<string | null>(null)
const selectedRequestId = ref<string | null>(null)

const headers = ref<VDataTable['$props']['headers']>([
  { title: 'ID SOLICITUD', key: 'id' },
  { title: 'ESTUDIANTE', key: 'estudiante' },
  { title: 'TIPO CONSTANCIA', key: 'tipo' },
  { title: 'FECHA SOLICITUD', key: 'fecha' },
  { title: 'ESTADO', key: 'estado' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
])

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('es-CL')

const tableItems = computed(() =>
  requests.value.map((request) => ({
    id: request.id,
    estudiante: request.studentName,
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

const roleMap: Record<string, UserRole> = {
  Secretaria: UserRole.SECRETARY,
  Director: UserRole.DIRECTOR,
  Administrador: UserRole.ADMIN,
}

const currentUser = computed<User>(() => ({
  id: auth.user?.email ?? 'usuario@ufro.cl',
  name: auth.user?.name ?? 'Equipo Programa',
  email: auth.user?.email ?? 'usuario@ufro.cl',
  role: roleMap[auth.user?.role ?? ''] ?? UserRole.SECRETARY,
}))

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

const appendHistory = (
  request: Request,
  status: RequestStatus,
  observation: string,
) => {
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
    case RequestStatus.REJECTED:
      return 'error'
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
    case RequestStatus.REJECTED:
      return 'mdi-close-circle'
    default:
      return 'mdi-help-circle'
  }
}

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
    'RECHAZADO': RequestStatus.REJECTED,
    'DESCONOCIDO': RequestStatus.REQUESTED, // Manejar estado desconocido como solicitado
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
const fetchRequests = async () => {
  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  
  if (!tokenFromStore) {
    console.error('❌ No hay token disponible para obtener las solicitudes')
    requestsError.value = 'No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.'
    return
  }

  isLoadingRequests.value = true
  requestsError.value = null

  try {
    // Usar variable de entorno para la URL del backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3020'
    const isDevelopment = import.meta.env.DEV
    
    // 📋 Logs de configuración del backend API
    console.log('🔌 [Admin Solicitudes] Configuración del Backend API:')
    console.log('   - VITE_API_URL:', apiUrl)
    console.log('   - Modo:', isDevelopment ? 'Desarrollo (con proxy)' : 'Producción (URL completa)')
    
    // En desarrollo, usar proxy de Vite. En producción, usar la URL completa desde variable de entorno
    const endpoint = isDevelopment
      ? '/api/v1/constancias/todas/estado'
      : `${apiUrl}/api/v1/constancias/todas/estado`
    
    console.log('   - Endpoint relativo:', '/api/v1/constancias/todas/estado')
    console.log('   - Endpoint completo:', endpoint)
    console.log('   - URL final que se usará:', isDevelopment ? `http://localhost:3000${endpoint} (proxy → ${apiUrl}${endpoint})` : endpoint)
    
    console.log('📥 [Admin Solicitudes] Obteniendo todas las solicitudes del backend...')
    console.log('   Endpoint:', endpoint)

    // Limpiar el token de espacios
    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
    })

    console.log('📥 [Admin Solicitudes] Respuesta recibida:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   OK:', response.ok)

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

      console.error('❌ [Admin Solicitudes] Error al obtener las solicitudes:')
      console.error('   Status:', response.status)
      console.error('   Error:', JSON.stringify(errorData, null, 2))

      const errorMessage = errorData.message || errorData.msg || `Error ${response.status}: ${response.statusText}`
      requestsError.value = `Error al cargar las solicitudes: ${errorMessage}`
      return
    }

    // Leer la respuesta exitosa
    const responseData = await response.json()
    console.log('✅ [Admin Solicitudes] Solicitudes obtenidas exitosamente:')
    console.log('   Respuesta completa:', JSON.stringify(responseData, null, 2))
    
    // Mostrar la primera solicitud completa para ver todos los campos disponibles
    if (Array.isArray(responseData) && responseData.length > 0) {
      console.log('📋 [Admin Solicitudes] Primera solicitud completa (todos los campos):')
      console.log(JSON.stringify(responseData[0], null, 2))
      console.log('📋 [Admin Solicitudes] Campos disponibles en la primera solicitud:')
      console.log(Object.keys(responseData[0]))
    } else if (responseData && typeof responseData === 'object') {
      const firstItem = responseData.data?.[0] || responseData.solicitudes?.[0]
      if (firstItem) {
        console.log('📋 [Admin Solicitudes] Primera solicitud completa (todos los campos):')
        console.log(JSON.stringify(firstItem, null, 2))
        console.log('📋 [Admin Solicitudes] Campos disponibles en la primera solicitud:')
        console.log(Object.keys(firstItem))
      }
    }

    // Mapear la respuesta del backend al formato Request
    // El backend devuelve un array directamente con: { idSolicitud, tipoConstancia, fechaSolicitud, estadoActual, nombreUsuario, rutAlumno }
    const backendRequests = Array.isArray(responseData) 
      ? responseData 
      : (responseData.data || responseData.solicitudes || [])

    console.log('📋 [Admin Solicitudes] Mapeando solicitudes del backend:')
    console.log('   Total de solicitudes:', backendRequests.length)
    if (backendRequests.length > 0) {
      console.log('   Primera solicitud (ejemplo):', JSON.stringify(backendRequests[0], null, 2))
      console.log('   Campos disponibles en la primera solicitud:', Object.keys(backendRequests[0]))
    }

    const mappedRequests: Request[] = backendRequests.map((item: any, index: number) => {
      // Mapear los campos del backend al formato Request
      // El backend ahora incluye nombreUsuario (nombre formateado del usuario) y rutAlumno
      const nombreUsuario = item.nombreUsuario || item.nombreEstudiante || item.estudiante || item.nombre || null
      const documentIdCandidate =
        item.codigoDocumento ??
        item.idDocumento ??
        item.id_documento ??
        item.idConstancia ??
        item.documentoId ??
        item.documentId ??
        null
      
      console.log(`   Solicitud ${index + 1}:`)
      console.log(`     - idSolicitud: ${item.idSolicitud}`)
      console.log(`     - nombreUsuario (raw): ${item.nombreUsuario}`)
      console.log(`     - nombreEstudiante (raw): ${item.nombreEstudiante}`)
      console.log(`     - estudiante (raw): ${item.estudiante}`)
      console.log(`     - nombre (raw): ${item.nombre}`)
      console.log(`     - nombreUsuario final: ${nombreUsuario}`)
      
      const request: Request = {
        id: item.idSolicitud?.toString() || `RRNN-${index + 1}`,
        documentId: documentIdCandidate ? documentIdCandidate.toString() : undefined,
        type: item.tipoConstancia || 'N/A',
        studentName: nombreUsuario || 'Estudiante',
        studentId: item.rutAlumno || item.rut || 'N/A',
        requestDate: item.fechaSolicitud || new Date().toISOString(),
        lastUpdateDate: item.fechaActualizacion || item.fechaSolicitud || new Date().toISOString(),
        status: mapBackendStatusToRequestStatus(item.estadoActual || 'SOLICITADA'),
        observations: item.observacionAlumno || item.observaciones || '',
        history: [
          {
            id: `${item.idSolicitud || index}-1`,
            date: item.fechaSolicitud || new Date().toISOString(),
            user: nombreUsuario || 'Estudiante',
            status: mapBackendStatusToRequestStatus(item.estadoActual || 'SOLICITADA'),
            observation: item.observacionAlumno || item.observaciones || 'Solicitud creada.',
          },
        ],
        fileUrl: item.urlArchivo || item.fileUrl || item.documentoUrl || undefined,
      }

      return request
    })
    
    console.log('✅ [Admin Solicitudes] Solicitudes mapeadas:')
    mappedRequests.forEach((req, idx) => {
      console.log(`   ${idx + 1}. ID: ${req.id}, Estudiante: ${req.studentName}`)
    })

    requests.value = mappedRequests
    console.log(`✅ [Admin Solicitudes] ${mappedRequests.length} solicitudes cargadas`)

  } catch (error) {
    console.error('❌ [Admin Solicitudes] Error al obtener las solicitudes:', error)
    requestsError.value = `Error al cargar las solicitudes: ${error instanceof Error ? error.message : 'Error desconocido'}`
  } finally {
    isLoadingRequests.value = false
  }
}

// Cargar las solicitudes cuando el componente se monte
onMounted(async () => {
  await fetchRequests()
})

// Recargar las solicitudes cuando el usuario cambie
watch(
  () => auth.user?.email,
  async (newEmail) => {
    if (newEmail) {
      await fetchRequests()
    }
  },
  { immediate: false },
)
</script>

<style scoped>
.solicitudes-wrapper {
  padding-left: 12px;
}
</style>
