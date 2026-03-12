<template>
  <v-card class="user-info-card" elevation="1">
    <v-card-text class="pa-6">
      <v-form>
        <!-- Sección: Datos de acceso -->
        <section class="form-section">
          <div class="section-title text-caption text-medium-emphasis mb-3">
            DATOS DE ACCESO
          </div>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="localUser.email"
                label="Correo Electrónico"
                type="email"
                density="comfortable"
                variant="outlined"
                required
                :rules="[rules.required, rules.email]"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="newPassword"
                label="Nueva Contraseña"
                type="password"
                density="comfortable"
                variant="outlined"
                placeholder="Dejar vacío para no cambiar"
                hint="Dejar vacío para no cambiar"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="localUser.rut"
                label="RUT"
                density="comfortable"
                variant="outlined"
                required
                :rules="[rules.required]"
              />
            </v-col>
          </v-row>
        </section>

        <!-- Sección: Información personal -->
        <section class="form-section">
          <div class="section-title text-caption text-medium-emphasis mb-3">
            INFORMACIÓN PERSONAL
          </div>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="localUser.primerNombre"
                label="Primer Nombre"
                density="comfortable"
                variant="outlined"
                required
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="localUser.segundoNombre"
                label="Segundo Nombre"
                density="comfortable"
                variant="outlined"
                hint="Opcional"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="localUser.apellidoPaterno"
                label="Apellido Paterno"
                density="comfortable"
                variant="outlined"
                required
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="localUser.apellidoMaterno"
                label="Apellido Materno"
                density="comfortable"
                variant="outlined"
                hint="Opcional"
                persistent-hint
              />
            </v-col>
          </v-row>
        </section>

        <!-- Sección: Datos académicos -->
        <section class="form-section">
          <div class="section-title text-caption text-medium-emphasis mb-3">
            DATOS ACADÉMICOS
          </div>
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="localUser.matricula"
                label="Nro Matrícula"
                density="comfortable"
                variant="outlined"
                required
                hint="Número de matrícula del estudiante"
                persistent-hint
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="localUser.fechaIngreso"
                label="Fecha Ingreso"
                type="date"
                density="comfortable"
                variant="outlined"
                required
                hint="Fecha de ingreso del estudiante"
                persistent-hint
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="localUser.fechaTermino"
                label="Fecha Término"
                type="date"
                density="comfortable"
                variant="outlined"
                hint="Opcional - Fecha de término del estudiante"
                persistent-hint
              />
            </v-col>
          </v-row>
        </section>

        <!-- Sección: Rol y estado -->
        <section class="form-section">
          <div class="section-title text-caption text-medium-emphasis mb-3">
            ROL Y ESTADO
          </div>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="localUser.rol"
                :items="roleOptions"
                label="Rol de Usuario"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-switch
                v-model="localUser.activo"
                color="success"
                inset
                class="ml-md-4"
                :label="localUser.activo ? 'Usuario Activo' : 'Usuario Inactivo'"
              />
            </v-col>
          </v-row>
        </section>

        <!-- Botón guardar -->
        <div class="form-actions">
          <v-btn
            color="#1e5a3d"
            prepend-icon="mdi-content-save"
            :loading="isSaving"
            @click="handleSave"
            class="save-btn"
          >
            Guardar Cambios
          </v-btn>
        </div>

        <!-- Mensajes -->
        <v-alert
          v-if="saveSuccess"
          type="success"
          variant="tonal"
          class="mt-4"
        >
          {{ saveSuccess }}
        </v-alert>

        <v-alert
          v-if="saveError"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          {{ saveError }}
        </v-alert>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface User {
  id: string
  nombre: string
  email: string
  rut: string
  matricula?: string
  rol: string
  estado: string
  fechaIngreso?: string
  fechaTermino?: string
  primerNombre?: string
  segundoNombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  activo?: boolean
}

const props = defineProps<{
  user: User
}>()

const emit = defineEmits<{
  update: [user: User]
}>()

const localUser = ref<User>({ ...props.user })
const newPassword = ref('')
const isSaving = ref(false)
const saveSuccess = ref<string | null>(null)
const saveError = ref<string | null>(null)

const roleOptions = ['Estudiante', 'Profesor', 'Secretaria', 'Director', 'Administrador']

const rules = {
  required: (value: any) => !!value || 'Este campo es requerido',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Email inválido'
  },
}

watch(() => props.user, (newUser) => {
  localUser.value = {
    ...newUser,
    primerNombre: newUser.primerNombre || newUser.nombre?.split(' ')[0] || '',
    segundoNombre: newUser.segundoNombre || newUser.nombre?.split(' ')[1] || '',
    apellidoPaterno: newUser.apellidoPaterno || newUser.nombre?.split(' ')[2] || '',
    apellidoMaterno: newUser.apellidoMaterno || newUser.nombre?.split(' ')[3] || '',
    activo: newUser.activo !== undefined ? newUser.activo : newUser.estado === 'Activo',
  }
}, { deep: true, immediate: true })

const handleSave = async () => {
  saveError.value = null
  saveSuccess.value = null
  isSaving.value = true

  try {
    // Obtener token de autenticación
    const authStore = await import('@/stores/auth').then(m => m.useAuthStore())
    const token = authStore.token
    
    if (!token) {
      throw new Error('No hay token de autenticación')
    }

    const apiUrl = await import('@/config/api').then(m => m.getApiBaseUrl())
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? `/api/v1/alumnos/${localUser.value.rut}`
      : `${apiUrl}/api/v1/alumnos/${localUser.value.rut}`

    const updateData: any = {
      primerNombre: localUser.value.primerNombre,
      segundoNombre: localUser.value.segundoNombre || undefined,
      primerApellido: localUser.value.apellidoPaterno,
      segundoApellido: localUser.value.apellidoMaterno || undefined,
      fechaIngreso: localUser.value.fechaIngreso || undefined,
      fechaTermino: localUser.value.fechaTermino || undefined,
    }

    // Eliminar campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key]
      }
    })

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`,
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error ${response.status}: ${errorText}`)
    }

    const updatedData = await response.json()
    
    // Actualizar localUser con los datos devueltos
    localUser.value = {
      ...localUser.value,
      nombre: `${updatedData.primerNombre || ''} ${updatedData.segundoNombre || ''} ${updatedData.primerApellido || ''} ${updatedData.segundoApellido || ''}`.trim(),
      fechaIngreso: updatedData.fechaIngreso,
      fechaTermino: updatedData.fechaTermino,
    }

    emit('update', localUser.value)
    saveSuccess.value = 'Cambios guardados correctamente.'
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Error al guardar los cambios.'
    console.error(error)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.user-info-card {
  background: white;
  border-radius: 8px;
}

.form-section {
  margin-bottom: 32px;
}

.section-title {
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.save-btn {
  text-transform: none;
  color: white;
}
</style>

