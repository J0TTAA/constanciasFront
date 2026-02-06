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
        <RequestHistory :history="request.history" />
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
import { computed } from 'vue'
import { RequestStatus, UserRole } from '@/types/requestTypes'
import type { Request, User } from '@/types/requestTypes'

// Importa los componentes
import RequestInfoCard from './RequestInfoCard.vue'
import RequestHistory from './RequestHistory.vue'
import ActionPanelStudent from './ActionPanelStudent.vue'
import ActionPanelSecretary from './ActionPanelSecretary.vue'
import ActionPanelDirector from './ActionPanelDirector.vue'

// 1. Define los Props que el componente recibe
const props = defineProps<{
  request: Request
  user: User
}>()

const request = computed(() => props.request)
const user = computed(() => props.user)

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
