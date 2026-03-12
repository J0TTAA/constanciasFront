<template>
  <v-card class="secretary-panel" elevation="8">
    <div class="panel-header">
      <div class="panel-badge">Gestión de Solicitud</div>
      <p class="panel-title">Acciones de Secretaría</p>
      <p class="panel-subtitle">Actualiza el estado o deja una observación en esta solicitud.</p>
    </div>

    <div class="panel-body">
      <v-select
        label="Cambiar estado"
        :items="statusOptions"
        v-model="newStatus"
        item-title="label"
        item-value="value"
        density="comfortable"
        variant="outlined"
        :disabled="isUpdating"
      />

      <v-textarea
        v-model="detalle"
        label="Detalle / Observación para el director (opcional)"
        rows="3"
        density="comfortable"
        variant="outlined"
        auto-grow
        hint="Este detalle será visible para el director"
        persistent-hint
        :disabled="isUpdating"
      />
    </div>

    <v-alert v-if="updateError" type="error" variant="tonal" density="comfortable">
      {{ updateError }}
    </v-alert>

    <v-alert v-if="updateSuccess" type="success" variant="tonal" density="comfortable">
      {{ updateSuccess }}
    </v-alert>

    <v-btn
      v-if="canSign"
      class="panel-action"
      color="success"
      :loading="isSigning"
      :disabled="isSigning"
      @click="handleSignDocument"
      prepend-icon="mdi-draw-pen"
    >
      Firmar documento
    </v-btn>

    <v-btn
      class="panel-action"
      color="primary"
      :loading="isUpdating"
      :disabled="isUpdating || newStatus === currentStatus"
      @click="handleUpdateStatus"
      prepend-icon="mdi-send"
    >
      Actualizar estado
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getApiBaseUrl } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import { RequestStatus } from '@/types/requestTypes'
import type { Request } from '@/types/requestTypes'

const props = defineProps<{
  request: Request
}>()

// El componente padre (RequestDetail.vue) escuchará este evento "update"
const emit = defineEmits<{
  (e: 'update', id: string, newStatus: RequestStatus, observation: string): void
}>()

// El estado local se maneja con ref() en Vue
const detalle = ref('')
const newStatus = ref<string>('SOLICITADA')
const isSigning = ref(false)
const isUpdating = ref(false)
const updateError = ref<string | null>(null)
const updateSuccess = ref<string | null>(null)
const signError = ref<string | null>(null)

const auth = useAuthStore()

// Función para mapear el estado del request al formato del backend
const mapStatusToBackend = (status: any): string => {
  if (!status) return 'SOLICITADA'
  
  // Si ya está en el formato del backend
  if (status === 'SOLICITADA' || status === 'EN_REVISION' || status === 'FIRMADA') {
    return status
  }
  
  // Mapear estados del frontend a estados del backend
  if (status === 'Solicitada' || status === RequestStatus.REQUESTED) {
    return 'SOLICITADA'
  }
  if (status === 'En Revisión' || status === RequestStatus.IN_REVIEW) {
    return 'EN_REVISION'
  }
  if (status === 'Firmada' || status === RequestStatus.SIGNED) {
    return 'FIRMADA'
  }
  
  return 'SOLICITADA' // Por defecto
}

// Mapear el estado actual del request al formato del backend
const currentStatus = computed(() => {
  const status = (props.request as any).estadoActual || props.request.status
  return mapStatusToBackend(status)
})

// Inicializar el estado seleccionado cuando el componente se monta o cambia el request
onMounted(() => {
  newStatus.value = currentStatus.value
})

// Actualizar el estado seleccionado cuando cambia el request
watch(() => props.request, () => {
  newStatus.value = currentStatus.value
}, { immediate: true, deep: true })

const canSign = computed(() =>
  [RequestStatus.REQUESTED, RequestStatus.IN_REVIEW, RequestStatus.AWAITING_SIGNATURE].includes(
    props.request.status,
  ),
)
const documentIdToUse = computed(() => props.request.documentId || props.request.id)

// Opciones de estado según el endpoint del backend
const statusOptions = [
  { label: 'Solicitada', value: 'SOLICITADA' },
  { label: 'En Revisión', value: 'EN_REVISION' },
  { label: 'Firmada', value: 'FIRMADA' },
]

// Actualizar el estado usando el endpoint del backend
const handleUpdateStatus = async () => {
  updateError.value = null
  updateSuccess.value = null

  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  if (!tokenFromStore) {
    updateError.value = 'No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.'
    return
  }

  isUpdating.value = true

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/constancias/solicitud/${props.request.id}/estado`
      : `${apiUrl}/api/v1/constancias/solicitud/${props.request.id}/estado`

    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')

    // Construir el body según el formato del backend
    const body: any = {
      nombreEstado: newStatus.value,
    }

    // Agregar detalle solo si tiene valor
    if (detalle.value && detalle.value.trim()) {
      body.detalle = detalle.value.trim()
    }

    console.log('📝 [ActionPanelSecretary] Actualizando estado:', {
      endpoint,
      body,
      solicitudId: props.request.id
    })

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
      body: JSON.stringify(body),
    })

    // Verificar Content-Type antes de parsear
    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ [ActionPanelSecretary] El servidor devolvió HTML:', text.substring(0, 200))
      throw new Error(`El servidor devolvió HTML en lugar de JSON. Status: ${response.status}`)
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
      } catch {
        errorData = { message: 'No se pudo leer el cuerpo de la respuesta' }
      }

      const errorMessage =
        errorData?.message || errorData?.msg || `Error ${response.status}: ${response.statusText}`
      updateError.value = `Error al actualizar el estado: ${errorMessage}`
      return
    }

    const responseData = await response.json()
    console.log('✅ [ActionPanelSecretary] Estado actualizado exitosamente:', responseData)

    updateSuccess.value = `Estado actualizado a "${statusOptions.find(s => s.value === newStatus.value)?.label || newStatus.value}" exitosamente.`
    
    // Emitir evento para actualizar el componente padre
    emit('update', props.request.id, newStatus.value as any, detalle.value || '')
    
    // Limpiar el detalle después de un breve delay
    setTimeout(() => {
      detalle.value = ''
      updateSuccess.value = null
    }, 3000)
  } catch (error) {
    console.error('❌ [ActionPanelSecretary] Error al actualizar estado:', error)
    updateError.value = `Error al actualizar el estado: ${error instanceof Error ? error.message : 'Error desconocido'}`
  } finally {
    isUpdating.value = false
  }
}

const handleSignDocument = async () => {
  signError.value = null

  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  if (!tokenFromStore) {
    signError.value = 'No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.'
    return
  }

  isSigning.value = true

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV

    const hasDocumentId = !!props.request.documentId
    const endpoint = isDevelopment
      ? hasDocumentId
        ? `/api/v1/constancias/documento/${documentIdToUse.value}/firmar`
        : `/api/v1/constancias/solicitud/${props.request.id}/firmar`
      : hasDocumentId
        ? `${apiUrl}/api/v1/constancias/documento/${documentIdToUse.value}/firmar`
        : `${apiUrl}/api/v1/constancias/solicitud/${props.request.id}/firmar`

    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')
    const parsedId = Number(documentIdToUse.value)

    const payload = {
      success: true,
      message: 'Documento firmado correctamente',
      idDocumento: Number.isNaN(parsedId) ? documentIdToUse.value : parsedId,
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
      body: JSON.stringify(payload),
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
      } catch {
        errorData = { message: 'No se pudo leer el cuerpo de la respuesta' }
      }

      const errorMessage =
        errorData?.message || errorData?.msg || `Error ${response.status}: ${response.statusText}`
      signError.value = `Error al firmar el documento: ${errorMessage}`
      return
    }

    let responseData: any = null
    try {
      responseData = await response.json()
    } catch {
      responseData = null
    }

    const finalMessage = responseData?.message || payload.message
    emit('update', props.request.id, RequestStatus.SIGNED, finalMessage)
  } catch (error) {
    signError.value = `Error al firmar el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`
  } finally {
    isSigning.value = false
  }
}
</script>

<style scoped>
.secretary-panel {
  padding: 24px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #f6faf7 100%);
  border: 1px solid rgba(30, 90, 61, 0.08);
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-badge {
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(30, 90, 61, 0.12);
  color: #1e5a3d;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #123025;
  margin: 0;
}

.panel-subtitle {
  margin: 0;
  color: #4f6b5d;
  font-size: 14px;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-action {
  align-self: flex-end;
  text-transform: none;
  font-weight: 600;
  padding-inline: 24px;
}
</style>
