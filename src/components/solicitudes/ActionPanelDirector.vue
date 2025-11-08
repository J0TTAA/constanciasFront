<template>
  <v-card class="director-panel" elevation="8">
    <div class="panel-header">
      <div class="panel-badge">Firma del Director</div>
      <p class="panel-title">Completar Firma y Adjuntar Documento</p>
      <p class="panel-subtitle">
        Sube el documento firmado y deja una observación para cerrar la solicitud.
      </p>
    </div>

    <div class="panel-body">
      <v-textarea
        v-model="observation"
        label="Observación final (opcional)"
        rows="2"
        auto-grow
        variant="outlined"
        density="comfortable"
      />

      <label class="upload-area" for="file-upload">
        <input
          id="file-upload"
          type="file"
          class="upload-input"
          accept=".pdf"
          @change="handleFileChange"
        />
        <div class="upload-content" :class="{ 'has-file': !!fileName }">
          <v-icon color="primary" size="32">mdi-file-upload</v-icon>
          <div>
            <p class="upload-title">
              {{
                fileName ? `Archivo seleccionado: ${fileName}` : 'Adjuntar documento firmado (PDF)'
              }}
            </p>
            <p class="upload-hint">
              Arrastra y suelta tu archivo o haz clic para seleccionarlo. Tamaño máximo: 10MB.
            </p>
          </div>
        </div>
      </label>
    </div>

    <v-btn
      class="panel-action"
      color="primary"
      :disabled="!fileName"
      @click="handleSign"
      prepend-icon="mdi-check-decagram"
    >
      Confirmar firma y adjuntar
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Request } from '@/types/requestTypes'

const props = defineProps<{
  request: Request
}>()

// Evento que se emite al componente padre (RequestDetail.vue)
const emit = defineEmits<{
  (e: 'sign', id: string, observation: string, fileUrl: string): void
}>()

// Estado local para este componente
const observation = ref('')
const fileName = ref('')
const file = ref<File | null>(null) // Para guardar el archivo real, aunque aquí no se usa (solo se simula)

// Esta función se activa cuando el usuario selecciona un archivo
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) {
    file.value = null
    fileName.value = ''
    return
  }

  const selectedFile = files.item(0)

  if (!selectedFile) {
    file.value = null
    fileName.value = ''
    return
  }

  file.value = selectedFile
  fileName.value = selectedFile.name
}

// Esta función se activa con el clic del botón
const handleSign = () => {
  if (!file.value || !fileName.value) {
    alert('Por favor, adjunte un documento para marcar como firmado.')
    return
  }
  // En una app real, aquí se subiría el archivo (file.value) y obtendría una URL
  const simulatedFileUrl = `/docs/${props.request.id}-${fileName.value}`

  // Emite el evento "sign" al componente padre
  emit(
    'sign',
    props.request.id,
    observation.value || 'Documento firmado y adjuntado.',
    simulatedFileUrl,
  )

  // Resetea estado local
  observation.value = ''
  fileName.value = ''
  file.value = null
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

.upload-area {
  border: 2px dashed rgba(30, 90, 61, 0.2);
  border-radius: 16px;
  padding: 24px;
  background: rgba(30, 90, 61, 0.05);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: rgba(30, 90, 61, 0.4);
  background: rgba(30, 90, 61, 0.08);
}

.upload-input {
  display: none;
}

.upload-content {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #4f6b5d;
}

.upload-content.has-file {
  color: #123025;
}

.upload-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.upload-hint {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.8;
}

.panel-action {
  align-self: flex-end;
  text-transform: none;
  font-weight: 600;
  padding-inline: 24px;
}
</style>
