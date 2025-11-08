<template>
  <div class="history-card">
    <div class="history-card__title">
      <h3>Historial de la Solicitud</h3>
    </div>
    <div class="history-card__timeline">
      <div v-for="(entry, index) in reversedHistory" :key="entry.id" class="timeline-item">
        <div class="timeline-item__indicator">
          <div class="timeline-dot" />
          <div v-if="index !== reversedHistory.length - 1" class="timeline-line" />
        </div>

        <div class="timeline-item__content">
          <div class="timeline-item__header">
            <h4>{{ entry.status }}</h4>
            <span v-if="index === 0" class="badge">Actual</span>
          </div>

          <time>{{ formatDate(entry.date) }} · {{ entry.user }}</time>

          <p v-if="entry.observation">{{ entry.observation }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RequestHistory } from '@/types/requestTypes' // Ajusta la ruta

const props = defineProps<{
  history: RequestHistory[]
}>()

// En Vue, es mejor usar una 'computed property' que mutar el prop con .slice().reverse()
const reversedHistory = computed(() => {
  // Creamos una copia y la revertimos para no mutar el prop original
  return [...props.history].reverse()
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-CL')
}
</script>

<style scoped>
.history-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px 28px;
  margin-top: 24px;
  box-shadow:
    0 16px 38px rgba(18, 46, 38, 0.08),
    0 6px 14px rgba(18, 46, 38, 0.05);
  border: 1px solid rgba(23, 82, 53, 0.07);
}

.history-card__title h3 {
  font-size: 20px;
  font-weight: 700;
  color: #123025;
  margin-bottom: 12px;
}

.history-card__timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
}

.timeline-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: start;
}

.timeline-item__indicator {
  position: relative;
  width: 20px;
  display: flex;
  justify-content: center;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1e5a3d;
  border: 3px solid rgba(30, 90, 61, 0.2);
  margin-top: 4px;
}

.timeline-line {
  position: absolute;
  top: 22px;
  width: 2px;
  height: calc(100% - 18px);
  background: linear-gradient(180deg, rgba(30, 90, 61, 0.35), rgba(30, 90, 61, 0));
}

.timeline-item__content {
  background: rgba(30, 90, 61, 0.05);
  border-radius: 16px;
  padding: 16px 20px;
  border: 1px solid rgba(30, 90, 61, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeline-item__header h4 {
  font-size: 16px;
  font-weight: 700;
  color: #123025;
  margin: 0;
}

.badge {
  font-size: 12px;
  font-weight: 600;
  color: #1e5a3d;
  background: rgba(30, 90, 61, 0.16);
  padding: 4px 12px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

time {
  font-size: 13px;
  font-weight: 500;
  color: #4f6b5d;
}

p {
  font-size: 14px;
  color: #1f4134;
  line-height: 1.5;
  margin: 0;
}
</style>
