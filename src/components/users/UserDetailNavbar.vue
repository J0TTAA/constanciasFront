<template>
  <div class="user-detail-navbar">
    <v-tabs
      v-model="activeTab"
      color="#1e5a3d"
      align-tabs="start"
      class="user-tabs"
    >
      <v-tab
        value="informacion"
        prepend-icon="mdi-account"
        class="tab-item"
      >
        Información
      </v-tab>
      <v-tab
        value="asignaturas"
        prepend-icon="mdi-book-open-variant"
        class="tab-item"
      >
        Asignaturas
      </v-tab>
      <v-tab
        value="notas"
        prepend-icon="mdi-clipboard-text"
        class="tab-item"
      >
        Notas
      </v-tab>
      <v-tab
        value="examenes"
        prepend-icon="mdi-checkbox-marked-circle"
        class="tab-item"
      >
        Exámenes
      </v-tab>
    </v-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeTab = ref(props.modelValue)

watch(activeTab, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(() => props.modelValue, (newValue) => {
  activeTab.value = newValue
})
</script>

<style scoped>
.user-detail-navbar {
  border-bottom: 1px solid #e0e0e0;
  background: white;
}

.user-tabs {
  background: white;
}

.tab-item {
  text-transform: none;
  font-weight: 500;
}
</style>

