<template>
  <div class="solicitudes-wrapper">
    <template v-if="!selectedRequest">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        size="large"
        class="mb-5"
        @click="showModal = true"
      >
        Nueva Solicitud
      </v-btn>

      <v-card class="rounded-lg" variant="outlined" color="#e0e0e0">
        <v-data-table :headers="headers" :items="tableItems" class="rounded-lg">
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
            <p class="pa-4 text-center">No tienes ninguna solicitud creada.</p>
          </template>
        </v-data-table>
      </v-card>

      <modal-nueva-solicitud v-model="showModal" @submit="handleNuevaSolicitud" />
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
import { computed, ref, watch } from 'vue'
import type { VDataTable } from 'vuetify/components'
import { useAuthStore } from '@/stores/auth'
import RequestDetail from './RequestDetail.vue'
import ModalNuevaSolicitud from './ModalNuevaSolicitud.vue'
import { RequestStatus, UserRole } from '@/types/requestTypes'
import type { Request, User } from '@/types/requestTypes'
import { mockRequests } from '@/mocks/requests'

const auth = useAuthStore()

const cloneRequest = (request: Request): Request => ({
  ...request,
  history: request.history.map((entry) => ({ ...entry })),
})

const DEFAULT_STUDENT_NAME = 'Ana Contreras'

const buildInitialRequests = () =>
  mockRequests
    .filter((request) => request.studentName === DEFAULT_STUDENT_NAME)
    .map((request) => {
      const cloned = cloneRequest(request)
      cloned.studentName = auth.user?.name ?? DEFAULT_STUDENT_NAME
      return cloned
    })

const requests = ref<Request[]>(buildInitialRequests())

const selectedRequestId = ref<string | null>(null)

const showModal = ref(false)

const headers = ref<VDataTable['$props']['headers']>([
  { title: 'ID SOLICITUD', key: 'id' },
  { title: 'TIPO CONSTANCIA', key: 'tipo' },
  { title: 'FECHA SOLICITUD', key: 'fecha' },
  { title: 'ESTADO', key: 'estado' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
])

const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('es-CL')

const tableItems = computed(() =>
  requests.value.map((request) => ({
    id: request.id,
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

const currentUser = computed<User>(() => ({
  id: auth.user?.email ?? 'estudiante@ufro.cl',
  name: auth.user?.name ?? 'Estudiante UFRO',
  email: auth.user?.email ?? 'estudiante@ufro.cl',
  role: UserRole.STUDENT,
}))

watch(
  () => auth.user?.name,
  (newName) => {
    if (!newName) return

    requests.value = requests.value.map((request) => ({
      ...request,
      studentName: newName,
    }))
  },
  { immediate: false },
)

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

const appendHistory = (request: Request, status: RequestStatus, observation: string) => {
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
    default:
      return 'mdi-help-circle'
  }
}

const handleNuevaSolicitud = (formData: { tipo: string; observaciones: string }) => {
  const newId = `RRNN-${Math.floor(Math.random() * 90000 + 10000)}`

  const newRequest: Request = {
    id: newId,
    type: formData.tipo,
    studentName: currentUser.value.name,
    studentId: '20.123.456-7',
    requestDate: new Date().toISOString(),
    lastUpdateDate: new Date().toISOString(),
    status: RequestStatus.REQUESTED,
    observations: formData.observaciones,
    history: [
      {
        id: `${newId}-1`,
        date: new Date().toISOString(),
        user: currentUser.value.name,
        status: RequestStatus.REQUESTED,
        observation: formData.observaciones || 'Solicitud creada.',
      },
    ],
  }

  requests.value = [newRequest, ...requests.value]
  showModal.value = false
}
</script>

<style scoped>
.solicitudes-wrapper {
  padding-left: 12px;
}
</style>
