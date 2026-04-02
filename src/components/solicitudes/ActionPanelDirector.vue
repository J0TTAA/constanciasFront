<template>
  <v-card class="director-panel" elevation="8">
    <div class="panel-header">
      <div class="panel-badge">Revisión del Director</div>
      <p class="panel-title">Revisar constancia y actualizar estado</p>
      <p class="panel-subtitle">
        Revisa el detalle enviado por secretaría y marca el estado correspondiente.
      </p>
    </div>

    <div class="panel-body">
      <v-textarea
        :model-value="secretaryNoteToShow"
        label="Detalle enviado por secretaría"
        rows="3"
        auto-grow
        variant="outlined"
        density="comfortable"
        readonly
      />

      <v-select
        label="Cambiar estado"
        :items="statusOptions"
        v-model="newStatus"
        item-title="label"
        item-value="value"
        density="comfortable"
        variant="outlined"
        :disabled="isUpdating || isStatusLocked"
      >
        <template #item="{ props, item }">
          <v-list-item
            v-bind="props"
            :title="item.raw.label"
            :prepend-icon="item.raw.icon"
          />
        </template>

        <template #selection="{ item }">
          <div class="d-flex align-center gap-2">
            <v-icon v-if="item.raw.icon" size="small" :icon="item.raw.icon" />
            <span>{{ item.raw.label }}</span>
          </div>
        </template>
      </v-select>
    </div>

    <v-alert v-if="signError" type="error" variant="tonal" density="comfortable">
      {{ signError }}
    </v-alert>

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
      :disabled="isUpdating || isStatusLocked || newStatus === currentStatus"
      @click="handleUpdateStatus"
      prepend-icon="mdi-check-decagram"
    >
      Actualizar estado
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { getApiBaseUrl } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import { RequestStatus } from '@/types/requestTypes'
import type { Request } from '@/types/requestTypes'

const props = defineProps<{
  request: Request
  // Nota que dejó secretaría al cambiar el estado (solo lectura para el director)
  secretaryNote?: string
}>()

// Evento que se emite al componente padre (RequestDetail.vue)
const emit = defineEmits<{
  (e: 'update', id: string, newStatus: RequestStatus, observation: string): void
}>()

const auth = useAuthStore()

const newStatus = ref<string>('SOLICITADA')
const isSigning = ref(false)
const isUpdating = ref(false)
const updateError = ref<string | null>(null)
const updateSuccess = ref<string | null>(null)
const signError = ref<string | null>(null)

// Texto que ve el director (solo lectura)
const secretaryNoteToShow = computed(
  () => props.secretaryNote || 'Sin nota de secretaría para esta solicitud.',
)

// Función para mapear el estado del request al formato del backend
const mapStatusToBackend = (status: any): string => {
  if (!status) return 'SOLICITADA'

  if (
    status === 'SOLICITADA' ||
    status === 'EN_REVISION' ||
    status === 'FIRMADA' ||
    status === 'RECHAZADA'
  ) {
    return status
  }

  if (status === 'Solicitada' || status === RequestStatus.REQUESTED) {
    return 'SOLICITADA'
  }
  if (status === 'En Revisión' || status === RequestStatus.IN_REVIEW) {
    return 'EN_REVISION'
  }
  if (status === 'Firmada' || status === RequestStatus.SIGNED) {
    return 'FIRMADA'
  }

  if (status === 'Rechazada' || status === 'Rechazado' || status === RequestStatus.REJECTED) {
    return 'RECHAZADA'
  }

  return 'SOLICITADA'
}

// Estado actual según el request
const currentStatus = computed(() => {
  const status = (props.request as any).estadoActual || props.request.status
  return mapStatusToBackend(status)
})

const isStatusLocked = computed(() => currentStatus.value === 'FIRMADA')

// Opciones de estado para el director
const statusOptions = [
  { label: 'Solicitada', value: 'SOLICITADA' },
  { label: 'En Revisión', value: 'EN_REVISION' },
  { label: 'Rechazada', value: 'RECHAZADA', icon: 'mdi-close-circle' },
]

// ID de documento a usar al firmar (si existe), si no la solicitud
const documentIdToUse = computed(() => props.request.documentId || props.request.id)

// Puede firmar mientras no esté ya firmada o rechazada (según estado backend)
const canSign = computed(() => {
  const status = currentStatus.value
  return status === 'SOLICITADA' || status === 'EN_REVISION'
})

// Inicializar el estado seleccionado cuando el componente se monta o cambia el request
onMounted(() => {
  newStatus.value = currentStatus.value
})

watch(
  () => props.request,
  () => {
    newStatus.value = currentStatus.value
  },
  { immediate: true, deep: true },
)

// Actualizar el estado usando el endpoint del backend (sin dejar nota)
const handleUpdateStatus = async () => {
  updateError.value = null
  updateSuccess.value = null

  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  if (!tokenFromStore) {
    updateError.value =
      'No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.'
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

    const body = {
      nombreEstado: newStatus.value,
      // Director NO envía detalle, solo cambia el estado
    }

    console.log('📝 [ActionPanelDirector] Actualizando estado:', {
      endpoint,
      body,
      solicitudId: props.request.id,
    })

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ [ActionPanelDirector] El servidor devolvió HTML:', text.substring(0, 200))
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
    console.log('✅ [ActionPanelDirector] Estado actualizado exitosamente:', responseData)

    updateSuccess.value = `Estado actualizado a "${
      statusOptions.find((s) => s.value === newStatus.value)?.label || newStatus.value
    }" exitosamente.`

    // Emitir evento para que el padre actualice su modelo / historial
    emit('update', props.request.id, newStatus.value as any, secretaryNoteToShow.value || '')
  } catch (error) {
    console.error('❌ [ActionPanelDirector] Error al actualizar estado:', error)
    updateError.value = `Error al actualizar el estado: ${
      error instanceof Error ? error.message : 'Error desconocido'
    }`
  } finally {
    isUpdating.value = false
  }
}

// Firmar documento (similar a secretaría, sin nota propia)
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
      message: 'Documento firmado correctamente por el director',
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
    // Notificar al padre que la solicitud quedó firmada
    emit('update', props.request.id, RequestStatus.SIGNED, finalMessage)
  } catch (error) {
    console.error('❌ [ActionPanelDirector] Error al firmar documento:', error)
    signError.value = `Error al firmar el documento: ${
      error instanceof Error ? error.message : 'Error desconocido'
    }`
  } finally {
    isSigning.value = false
  }
}
</script>

<style scoped>
.director-panel {
  padding: 24px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #f4f8ff 100%);
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
  background: rgba(18, 83, 210, 0.12);
  color: #1353d2;
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
