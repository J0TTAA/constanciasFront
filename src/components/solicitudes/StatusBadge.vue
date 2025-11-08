<template>
  <span :class="badgeClass" class="px-3 py-1 text-xs font-bold uppercase rounded-full">
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RequestStatus } from '@/types/requestTypes'; // Ajusta la ruta si es necesario

const props = defineProps<{
  status: RequestStatus;
}>();

const badgeClass = computed(() => {
  switch (props.status) {
    case RequestStatus.REQUESTED:
      return 'bg-blue-100 text-blue-800';
    case RequestStatus.IN_REVIEW:
      return 'bg-yellow-100 text-yellow-800';
    case RequestStatus.AWAITING_SIGNATURE:
      return 'bg-orange-100 text-orange-800';
    case RequestStatus.SIGNED:
      return 'bg-green-100 text-green-800';
    case RequestStatus.REJECTED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
});
</script>
