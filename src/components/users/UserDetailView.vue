<template>
  <div class="user-detail-view">
    <!-- Header con información del usuario -->
    <div class="user-detail-header">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        @click="$emit('back')"
        class="back-btn"
      >
        Volver
      </v-btn>
      <div class="user-header-info">
        <v-avatar
          :color="getAvatarColor(user.nombre)"
          size="56"
          class="user-avatar-large"
        >
          <span class="text-white font-weight-bold text-h6">
            {{ getInitials(user.nombre) }}
          </span>
        </v-avatar>
        <div class="user-header-text">
          <div class="user-name-row">
            <h1 class="text-h5 font-weight-bold">{{ user.nombre }}</h1>
            <v-chip
              :color="getRoleColor(user.rol)"
              size="small"
              variant="flat"
              class="role-chip-header"
            >
              {{ user.rol }}
            </v-chip>
            <div class="status-indicator">
              <v-icon
                :color="user.estado === 'Activo' ? 'success' : 'grey'"
                size="small"
              >
                mdi-circle
              </v-icon>
              <span class="status-text">{{ user.estado }}</span>
            </div>
          </div>
          <div class="user-contact-info">
            <div class="contact-item">
              <v-icon size="small" color="grey-darken-1">mdi-email</v-icon>
              <span>{{ user.email }}</span>
            </div>
            <div class="contact-item">
              <span class="hash">#</span>
              <span>{{ user.rut }}</span>
            </div>
            <div class="contact-item" v-if="user.fechaIngreso">
              <v-icon size="small" color="grey-darken-1">mdi-calendar</v-icon>
              <span>Ingreso: {{ formatDate(user.fechaIngreso) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navbar interno -->
    <UserDetailNavbar v-model="activeTab" />

    <!-- Contenido de las pestañas -->
    <div class="user-detail-content">
      <v-window v-model="activeTab">
        <!-- Pestaña Información -->
        <v-window-item value="informacion">
          <UserInfoTab :user="user" @update="handleUpdate" />
        </v-window-item>

        <!-- Pestaña Asignaturas -->
        <v-window-item value="asignaturas">
          <UserAsignaturasTab :userId="user.id" :userUuid="user.uuid || user.id" :userRut="user.rut" />
        </v-window-item>

        <!-- Pestaña Notas -->
        <v-window-item value="notas">
          <UserNotasTab :userId="user.id" :userRut="user.rut" :userMatricula="user.matricula" />
        </v-window-item>

        <!-- Pestaña Exámenes -->
        <v-window-item value="examenes">
          <UserExamenesTab :userId="user.id" :userRut="user.rut" />
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserDetailNavbar from './UserDetailNavbar.vue'
import UserInfoTab from './tabs/UserInfoTab.vue'
import UserAsignaturasTab from './tabs/UserAsignaturasTab.vue'
import UserNotasTab from './tabs/UserNotasTab.vue'
import UserExamenesTab from './tabs/UserExamenesTab.vue'

interface User {
  id: string
  uuid?: string
  nombre: string
  email: string
  rut: string
  matricula?: string
  rol: string
  estado: string
  fechaIngreso?: string
}

const props = defineProps<{
  user: User
}>()

const emit = defineEmits<{
  back: []
  update: [user: User]
}>()

const activeTab = ref('informacion')

const getInitials = (name: string): string => {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getAvatarColor = (name: string): string => {
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#00bcd4']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

const getRoleColor = (rol: string): string => {
  const roleColors: Record<string, string> = {
    'Estudiante': '#4caf50',
    'Profesor': '#d4af37',
    'Secretaria': '#2196f3',
    'Director': '#9c27b0',
    'Administrador': '#f44336',
  }
  return roleColors[rol] || '#757575'
}

const formatDate = (date: string): string => {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

const handleUpdate = (updatedUser: User) => {
  emit('update', updatedUser)
}
</script>

<style scoped>
.user-detail-view {
  width: 100%;
  background: white;
}

.user-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn {
  margin-top: 4px;
  text-transform: none;
}

.user-header-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.user-avatar-large {
  flex-shrink: 0;
}

.user-header-text {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.user-name-row h1 {
  color: #212121;
  margin: 0;
}

.role-chip-header {
  font-weight: 500;
  color: white;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-text {
  color: #212121;
  font-size: 14px;
}

.user-contact-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #757575;
  font-size: 14px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hash {
  color: #757575;
}

.user-detail-content {
  padding: 24px;
  background: #f5f5f5;
  min-height: 400px;
}

/* Responsive */
@media (max-width: 960px) {
  .user-detail-header {
    flex-direction: column;
  }

  .user-header-info {
    width: 100%;
  }

  .user-name-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-contact-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>

