<template>
  <div class="info-card">
    <div class="info-card__header">
      <div>
        <p class="info-card__id">{{ request.id }}</p>
        <h2 class="info-card__title">{{ request.type }}</h2>
      </div>
      <StatusBadge :status="request.status" />
    </div>

    <div class="info-card__meta">
      <div class="info-card__meta-item">
        <span class="label">Estudiante</span>
        <span class="value">{{ request.studentName }}</span>
      </div>
      <div class="info-card__meta-item">
        <span class="label">Fecha Solicitud</span>
        <span class="value">{{ formatDate(request.requestDate) }}</span>
      </div>
      <div class="info-card__meta-item">
        <span class="label">Última Actualización</span>
        <span class="value">{{ formatDate(request.lastUpdateDate) }}</span>
      </div>
    </div>

    <div class="info-card__observations">
      <span class="label">Observación del Estudiante</span>
      <p class="blockquote">
        {{ request.observations }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Request } from '@/types/requestTypes'
import StatusBadge from './StatusBadge.vue'

defineProps<{
  request: Request
}>()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-CL')
}
</script>

<style scoped>
.info-card {
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfc 100%);
  border-radius: 20px;
  padding: 32px;
  box-shadow:
    0 20px 45px rgba(18, 46, 38, 0.08),
    0 8px 18px rgba(18, 46, 38, 0.05);
  border: 1px solid rgba(23, 82, 53, 0.08);
}

.info-card__header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.info-card__id {
  font-size: 14px;
  font-weight: 600;
  color: #1e5a3d;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.info-card__title {
  font-size: 28px;
  line-height: 1.3;
  font-weight: 700;
  color: #123025;
  margin-top: 4px;
}

.info-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.info-card__meta-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: #6a7c72;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #123025;
}

.info-card__observations {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.blockquote {
  background: rgba(30, 90, 61, 0.07);
  border-left: 4px solid #1e5a3d;
  padding: 16px 20px;
  border-radius: 12px;
  color: #1f4134;
  font-style: italic;
  line-height: 1.5;
}
</style>
