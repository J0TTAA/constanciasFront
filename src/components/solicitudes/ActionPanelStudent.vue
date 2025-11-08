<template>
  <v-card v-if="request.status === RequestStatus.SIGNED" class="student-panel" elevation="8">
    <div class="panel-icon">
      <v-icon color="white" size="32">mdi-cloud-download</v-icon>
    </div>

    <div class="panel-content">
      <p class="panel-title">Documento Disponible</p>
      <p class="panel-subtitle">Tu constancia firmada está lista para descargar.</p>

      <v-btn color="white" class="panel-button" prepend-icon="mdi-download" @click="onDownload">
        Descargar Documento
      </v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { RequestStatus } from '@/types/requestTypes'
import type { Request } from '@/types/requestTypes'

const props = defineProps<{
  request: Request
}>()

const onDownload = () => {
  alert(`Simulando descarga de: ${props.request.fileUrl}`)
}
</script>

<style scoped>
.student-panel {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #1e5a3d, #123025);
  border-radius: 20px;
  color: white;
}

.panel-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-title {
  font-weight: 700;
  font-size: 18px;
  margin: 0;
}

.panel-subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.85;
}

.panel-button {
  align-self: flex-start;
  margin-top: 8px;
  text-transform: none;
  font-weight: 600;
  color: #1e5a3d;
}
</style>
