<template>
  <v-dialog v-model="dialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center text-error">
        <v-icon color="error" class="mr-3" size="large">mdi-alert-circle</v-icon>
        <span>Confirmar Eliminación</span>
      </v-card-title>
      <v-card-text>
        <p class="text-body-1 mb-2">
          {{ message || '¿Estás seguro de que deseas eliminar este elemento?' }}
        </p>
        <p class="text-caption text-medium-emphasis">
          Esta acción no se puede deshacer.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="handleCancel"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          @click="handleConfirm"
          :loading="loading"
        >
          Eliminar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  message?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: '¿Estás seguro de que deseas eliminar este elemento?',
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const dialog = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
})

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  dialog.value = false
  emit('cancel')
}
</script>

<style scoped>
.v-card-title {
  padding: 20px 24px 16px;
}

.v-card-text {
  padding: 0 24px 16px;
}

.v-card-actions {
  padding: 8px 24px 20px;
}
</style>

