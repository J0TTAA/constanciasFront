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
      />

      <v-textarea
        v-model="observation"
        label="Observación (opcional)"
        rows="3"
        density="comfortable"
        variant="outlined"
        auto-grow
      />
    </div>

    <v-alert v-if="signError" type="error" variant="tonal" density="comfortable">
      {{ signError }}
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
      :disabled="newStatus === request.status"
      @click="handleUpdate"
      prepend-icon="mdi-send"
    >
      Actualizar solicitud
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
const observation = ref('')
const newStatus = ref<RequestStatus>(props.request.status)
const isSigning = ref(false)
const signError = ref<string | null>(null)

const auth = useAuthStore()

const canSign = computed(() =>
  [RequestStatus.REQUESTED, RequestStatus.IN_REVIEW, RequestStatus.AWAITING_SIGNATURE].includes(
    props.request.status,
  ),
)
const documentIdToUse = computed(() => props.request.documentId || props.request.id)

const statusOptions = [
  { label: 'En Revisión', value: RequestStatus.IN_REVIEW },
  { label: 'Para Firma', value: RequestStatus.AWAITING_SIGNATURE },
  { label: 'Rechazar', value: RequestStatus.REJECTED },
]

const handleUpdate = () => {
  // Solo emite el evento si el estado ha cambiado
  if (newStatus.value !== props.request.status) {
    emit('update', props.request.id, newStatus.value, observation.value || 'Sin observaciones.')
    observation.value = '' // Resetea el estado local
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3020'
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
