<template>
  <div class="request-detail">
    <div class="request-header">
      <v-btn
        variant="text"
        color="primary"
        prepend-icon="mdi-arrow-left"
        class="request-back"
        @click="onBack"
      >
        Volver al Panel
      </v-btn>
    </div>

    <div class="request-grid">
      <div class="request-main">
        <RequestInfoCard :request="request" />
        <div v-if="isLoadingHistory" class="pa-4 text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2 text-medium-emphasis">Cargando historial...</p>
        </div>
        <v-alert v-else-if="historyError" type="error" variant="tonal" class="ma-4">
          {{ historyError }}
        </v-alert>
        <RequestHistoryComponent v-else :history="fullHistory" />
      </div>
      <div class="request-actions">
        <ActionPanelStudent
          v-if="user.role === UserRole.STUDENT"
          :request="request"
          class="wide-card"
        />
        <ActionPanelSecretary
          v-if="
            user.role === UserRole.SECRETARY &&
            [RequestStatus.REQUESTED, RequestStatus.IN_REVIEW, RequestStatus.AWAITING_SIGNATURE].includes(request.status)
          "
          :request="request"
          @update="handleUpdate"
        />
        <ActionPanelDirector
          v-if="
            user.role === UserRole.DIRECTOR && request.status === RequestStatus.AWAITING_SIGNATURE
          "
          :request="request"
          @sign="handleSign"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Importa los tipos y enums
import { computed, ref, onMounted } from 'vue'
import { RequestStatus, UserRole } from '@/types/requestTypes'
import type { Request, User, RequestHistory } from '@/types/requestTypes'
import { getApiBaseUrl } from '@/config/api'
import { useAuthStore } from '@/stores/auth'

// Importa los componentes
import RequestInfoCard from './RequestInfoCard.vue'
import RequestHistoryComponent from './RequestHistory.vue'
import ActionPanelStudent from './ActionPanelStudent.vue'
import ActionPanelSecretary from './ActionPanelSecretary.vue'
import ActionPanelDirector from './ActionPanelDirector.vue'

// 1. Define los Props que el componente recibe
const props = defineProps<{
  request: Request
  user: User
}>()

const auth = useAuthStore()
const request = computed(() => props.request)
const user = computed(() => props.user)
const fullHistory = ref<RequestHistory[]>(props.request.history)
const isLoadingHistory = ref(false)
const historyError = ref<string | null>(null)

// Función para mapear el estado del backend al RequestStatus del frontend
const mapBackendStatusToRequestStatus = (backendStatus: string): RequestStatus => {
  const normalizedStatus = backendStatus.toUpperCase().trim()
  
  const statusMap: Record<string, RequestStatus> = {
    'SOLICITADA': RequestStatus.REQUESTED,
    'EN REVISIÓN': RequestStatus.IN_REVIEW,
    'EN REVISION': RequestStatus.IN_REVIEW,
    'PARA FIRMA': RequestStatus.AWAITING_SIGNATURE,
    'FIRMADO Y DISPONIBLE': RequestStatus.SIGNED,
    'FIRMADO': RequestStatus.SIGNED,
    'FIRMADA': RequestStatus.SIGNED,
    'RECHAZADO': RequestStatus.REJECTED,
    'Solicitado': RequestStatus.REQUESTED,
    'Solicitada': RequestStatus.REQUESTED,
    'En Revisión': RequestStatus.IN_REVIEW,
    'En Revision': RequestStatus.IN_REVIEW,
    'Para Firma': RequestStatus.AWAITING_SIGNATURE,
    'Firmado y Disponible': RequestStatus.SIGNED,
    'Firmado': RequestStatus.SIGNED,
    'Rechazado': RequestStatus.REJECTED,
    'REQUESTED': RequestStatus.REQUESTED,
    'IN_REVIEW': RequestStatus.IN_REVIEW,
    'AWAITING_SIGNATURE': RequestStatus.AWAITING_SIGNATURE,
    'SIGNED': RequestStatus.SIGNED,
    'REJECTED': RequestStatus.REJECTED,
  }
  
  return statusMap[normalizedStatus] || RequestStatus.REQUESTED
}

// Cargar el historial completo desde el endpoint
const loadFullHistory = async () => {
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  if (!tokenFromStore) {
    console.warn('⚠️ No hay token disponible para cargar el historial')
    return
  }

  isLoadingHistory.value = true
  historyError.value = null

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV
    
    const endpoint = isDevelopment
      ? `/api/v1/constancias/${props.request.id}/historial`
      : `${apiUrl}/api/v1/constancias/${props.request.id}/historial`

    console.log('📋 [Historial] Cargando historial completo...')
    console.log('   Endpoint:', endpoint)

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
        errorData = { message: 'No se pudo leer el cuerpo de la respuesta' }
      }

      console.error('❌ [Historial] Error al obtener el historial:')
      console.error('   Status:', response.status)
      console.error('   Error:', JSON.stringify(errorData, null, 2))

      const errorMessage = errorData.message || errorData.msg || `Error ${response.status}: ${response.statusText}`
      historyError.value = `Error al cargar el historial: ${errorMessage}`
      return
    }

    const responseData = await response.json()
    console.log('✅ [Historial] Historial obtenido exitosamente:')
    console.log('   Respuesta:', JSON.stringify(responseData, null, 2))

    // Mapear el historial del backend al formato RequestHistory
    // El historial ya viene ordenado DESC (del más reciente al más antiguo)
    const historialArray = responseData.historial || []
    
    const mappedHistory: RequestHistory[] = historialArray.map((item: any, index: number) => {
      // Extraer el nombre del usuario (puede venir como objeto o string)
      let userName = 'Usuario desconocido'
      if (item.usuario) {
        if (typeof item.usuario === 'object' && item.usuario !== null) {
          userName = item.usuario.nombre || item.usuario.name || item.usuario.email || 'Usuario desconocido'
        } else {
          userName = item.usuario
        }
      }

      return {
        id: `hist-${index}`,
        date: item.fechaCambio || new Date().toISOString(),
        user: userName,
        status: mapBackendStatusToRequestStatus(item.estado || 'SOLICITADA'),
        observation: item.detalle || 'Sin detalle',
      }
    })

    fullHistory.value = mappedHistory
    console.log(`✅ [Historial] ${mappedHistory.length} entradas de historial cargadas`)

  } catch (error) {
    console.error('❌ [Historial] Error al cargar el historial:', error)
    historyError.value = `Error al cargar el historial: ${error instanceof Error ? error.message : 'Error desconocido'}`
  } finally {
    isLoadingHistory.value = false
  }
}

// Cargar el historial cuando se monta el componente
onMounted(() => {
  loadFullHistory()
})

// 2. Define los Eventos que el componente emite
const emit = defineEmits<{
  (e: 'back'): void // Evento para volver atrás
  (e: 'update', id: string, newStatus: RequestStatus, observation: string, fileUrl?: string): void // Evento de actualización
}>()

// 3. Define los "manejadores" (handlers) que llaman a los emits
const onBack = () => {
  emit('back')
}

const handleUpdate = (id: string, newStatus: RequestStatus, observation: string) => {
  // Este evento viene del ActionPanelSecretary
  emit('update', id, newStatus, observation)
}

const handleSign = (id: string, observation: string, fileUrl: string) => {
  // Este evento viene del ActionPanelDirector
  emit('update', id, RequestStatus.SIGNED, observation, fileUrl)
}
</script>

<style scoped>
.request-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-left: 12px;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-back {
  font-weight: 600;
  text-transform: none;
}

.request-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.request-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.request-actions {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wide-card {
  width: 100%;
}

@media (min-width: 1280px) {
  .request-grid {
    grid-template-columns: 2fr 1fr;
    align-items: start;
  }
}
</style>
