<template>
  <div class="solicitudes-wrapper">
    <template v-if="!selectedRequest">
      <v-card class="rounded-lg" variant="outlined" color="#e0e0e0">
        <v-data-table
          :headers="headers"
          :items="tableItems"
          class="rounded-lg"
        >
          <template v-slot:[`item.estado`]="{ value }">
            <v-chip
              :color="getStatusColor(value)"
              :prepend-icon="getStatusIcon(value)"
              size="small"
            >
              {{ value }}
            </v-chip>
          </template>

          <template v-slot:[`item.actions`]="{ item }">
            <v-btn
              variant="text"
              color="primary"
              append-icon="mdi-chevron-right"
              density="compact"
              @click="handleSlotItemOpen(item)"
            >
              Ver Detalles
            </v-btn>
          </template>

          <template #no-data>
            <p class="pa-4 text-center">No hay solicitudes pendientes.</p>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <request-detail
      v-else-if="selectedRequest"
      :request="selectedRequest"
      :user="currentUser"
      @back="handleBack"
      @update="handleRequestUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { VDataTable } from 'vuetify/components'
import { useAuthStore } from '@/stores/auth'
import RequestDetail from './RequestDetail.vue'
import { RequestStatus, UserRole } from '@/types/requestTypes'
import type { Request, User } from '@/types/requestTypes'
import { mockRequests } from '@/mocks/requests'

const auth = useAuthStore()

const cloneRequest = (request: Request): Request => ({
  ...request,
  history: request.history.map((entry) => ({ ...entry })),
})

const requests = ref<Request[]>(mockRequests.map(cloneRequest))
const selectedRequestId = ref<string | null>(null)

const headers = ref<VDataTable['$props']['headers']>([
  { title: 'ID SOLICITUD', key: 'id' },
  { title: 'ESTUDIANTE', key: 'estudiante' },
  { title: 'TIPO CONSTANCIA', key: 'tipo' },
  { title: 'FECHA SOLICITUD', key: 'fecha' },
  { title: 'ESTADO', key: 'estado' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
])

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('es-CL')

const tableItems = computed(() =>
  requests.value.map((request) => ({
    id: request.id,
    estudiante: request.studentName,
    tipo: request.type,
    fecha: formatDate(request.requestDate),
    estado: request.status,
    raw: request,
  })),
)

const selectedRequest = computed<Request | null>(() => {
  if (!selectedRequestId.value) return null
  return requests.value.find((request) => request.id === selectedRequestId.value) ?? null
})

const roleMap: Record<string, UserRole> = {
  Secretaria: UserRole.SECRETARY,
  Director: UserRole.DIRECTOR,
  Administrador: UserRole.ADMIN,
}

const currentUser = computed<User>(() => ({
  id: auth.user.email ?? 'usuario@ufro.cl',
  name: auth.user.name ?? 'Equipo Programa',
  email: auth.user.email ?? 'usuario@ufro.cl',
  role: roleMap[auth.user.role ?? ''] ?? UserRole.SECRETARY,
}))

const handleSlotItemOpen = (slotItem: unknown) => {
  const casted = slotItem as { raw?: { id?: string | null } }
  const idCandidate = casted?.raw?.id ?? null
  openDetails(idCandidate)
}

const openDetails = (id: string | null | undefined) => {
  if (!id) return
  selectedRequestId.value = id
}

const handleBack = () => {
  selectedRequestId.value = null
}

const appendHistory = (
  request: Request,
  status: RequestStatus,
  observation: string,
) => {
  request.history = [
    ...request.history,
    {
      id: `${request.id}-${request.history.length + 1}`,
      date: new Date().toISOString(),
      user: currentUser.value.name,
      status,
      observation,
    },
  ]

  request.lastUpdateDate = new Date().toISOString()
}

const handleRequestUpdate = (
  id: string,
  newStatus: RequestStatus,
  observation: string,
  fileUrl?: string,
) => {
  const request = requests.value.find((item) => item.id === id)
  if (!request) return

  request.status = newStatus
  if (fileUrl) {
    request.fileUrl = fileUrl
  }

  appendHistory(request, newStatus, observation)
}

const getStatusColor = (estado: string) => {
  switch (estado) {
    case RequestStatus.SIGNED:
      return 'success'
    case RequestStatus.IN_REVIEW:
      return 'warning'
    case RequestStatus.AWAITING_SIGNATURE:
      return 'info'
    case RequestStatus.REQUESTED:
      return 'blue'
    case RequestStatus.REJECTED:
      return 'error'
    default:
      return 'grey'
  }
}

const getStatusIcon = (estado: string) => {
  switch (estado) {
    case RequestStatus.SIGNED:
      return 'mdi-check-circle'
    case RequestStatus.IN_REVIEW:
      return 'mdi-clock-outline'
    case RequestStatus.AWAITING_SIGNATURE:
      return 'mdi-draw-pen'
    case RequestStatus.REQUESTED:
      return 'mdi-file-document'
    case RequestStatus.REJECTED:
      return 'mdi-close-circle'
    default:
      return 'mdi-help-circle'
  }
}
</script>

<style scoped>
.solicitudes-wrapper {
  padding-left: 12px;
}
</style>
