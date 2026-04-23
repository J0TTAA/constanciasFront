<template>
  <div class="admin-page">
    <!-- Vista de lista de usuarios -->
    <template v-if="!showCreateForm && !showUserDetail">
      <v-tabs v-model="activeTab" color="#1e5a3d" class="mb-6">
        <v-tab value="usuarios">Usuarios</v-tab>
        <v-tab value="importar">Importar Excel</v-tab>
        <v-tab value="asignacion">Asignación masiva</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item value="usuarios">
      <!-- Encabezado -->
      <div class="admin-header">
        <div class="header-left">
          <h1 class="text-h4 font-weight-bold mb-1">Gestión de Usuarios</h1>
          <p class="text-body-2 text-medium-emphasis">
            Administra los usuarios del sistema académico
          </p>
        </div>
        <div class="header-right">
          <v-btn
            color="#1e5a3d"
            prepend-icon="mdi-plus"
            size="large"
            class="new-user-btn"
            @click="showCreateForm = true"
          >
            Nuevo Usuario
          </v-btn>
        </div>
      </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="search-filters-section">
      <v-text-field
        v-model="searchQuery"
        placeholder="Buscar por nombre, email o RUT..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        class="search-field"
      ></v-text-field>
      <v-select
        v-model="selectedRole"
        :items="roleOptions"
        variant="outlined"
        density="comfortable"
        hide-details
        class="filter-select"
      ></v-select>
      <v-select
        v-model="selectedStatus"
        :items="statusOptions"
        variant="outlined"
        density="comfortable"
        hide-details
        class="filter-select"
      ></v-select>
    </div>

    <!-- Tabla de usuarios -->
    <v-card class="users-table-card" elevation="1">
      <v-alert
        v-if="usersError"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        {{ usersError }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="users"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        :loading="isLoadingUsers"
        class="users-table"
        hide-default-footer
      >
        <template v-slot:item.usuario="{ item }">
          <div class="user-cell">
            <v-avatar
              :color="getAvatarColor(item.nombre)"
              size="40"
              class="user-avatar"
            >
              <span class="text-white font-weight-bold">
                {{ getInitials(item.nombre) }}
              </span>
            </v-avatar>
            <div class="user-info">
              <div class="user-name font-weight-bold">{{ item.nombre }}</div>
              <div class="user-email text-caption text-medium-emphasis">
                {{ item.email }}
              </div>
            </div>
          </div>
        </template>

        <template v-slot:item.rol="{ item }">
          <v-chip
            :color="getRoleColor(item.rol)"
            size="small"
            variant="flat"
            class="role-chip"
          >
            {{ item.rol }}
          </v-chip>
        </template>

        <template v-slot:item.estado="{ item }">
          <div class="status-cell">
            <v-icon
              :color="item.estado === 'Activo' ? 'success' : 'grey'"
              size="small"
              class="status-dot"
            >
              mdi-circle
            </v-icon>
            <span class="status-text">{{ item.estado }}</span>
          </div>
        </template>

        <template v-slot:item.acciones="{ item }">
          <div class="actions-cell">
            <v-btn
              icon="mdi-eye"
              variant="text"
              size="small"
              color="grey-darken-1"
              @click="handleViewUser(item)"
            ></v-btn>
            <v-btn
              :icon="item.estado === 'Activo' ? 'mdi-account-off' : 'mdi-account-check'"
              variant="text"
              size="small"
              :color="item.estado === 'Activo' ? 'warning' : 'success'"
              @click="handleToggleUserStatus(item)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>

      <!-- Paginación -->
      <div class="table-footer">
        <div class="footer-left">
          <span class="text-caption text-medium-emphasis">
            Mostrando {{ displayedUsers }} de {{ totalUsers }} usuarios
          </span>
        </div>
        <div class="footer-right">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            density="comfortable"
          ></v-pagination>
        </div>
      </div>
    </v-card>
        </v-window-item>

        <v-window-item value="importar">
          <AdminExcelImport />
        </v-window-item>

        <v-window-item value="asignacion">
          <AdminAsignacionMasiva
            :students="studentsForMassAssign"
            :is-loading-students="isLoadingMassAssignStudents"
          />
        </v-window-item>
      </v-window>
    </template>

    <!-- Vista de detalle del usuario -->
    <template v-if="showUserDetail && selectedUser">
      <UserDetailView
        :user="selectedUser"
        @back="handleBackFromDetail"
        @update="handleUserUpdate"
      />
    </template>

    <!-- Vista de formulario de creación -->
    <template v-if="showCreateForm">
      <!-- Encabezado con botón volver -->
      <div class="form-header">
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="handleBack"
          class="back-btn"
        >
          Volver
        </v-btn>
        <div class="form-header-content">
          <h1 class="text-h4 font-weight-bold mb-1">Crear Nuevo Usuario</h1>
          <p class="text-body-2 text-medium-emphasis">
            Información personal y credenciales
          </p>
        </div>
      </div>

      <!-- Formulario -->
      <v-card class="create-user-card" elevation="1">
        <v-card-text class="pa-6">
          <!-- Sección: Datos de acceso -->
          <section class="form-section">
            <div class="section-title text-caption text-medium-emphasis mb-3">
              DATOS DE ACCESO
            </div>
            <v-row dense>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="email"
                  label="Correo Electrónico"
                  type="email"
                  density="comfortable"
                  variant="outlined"
                  autocomplete="off"
                  required
                  :rules="[rules.required, rules.email]"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="password"
                  label="Contraseña"
                  type="password"
                  density="comfortable"
                  variant="outlined"
                  autocomplete="new-password"
                  required
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="rut"
                  label="RUT"
                  placeholder="12.345.678-9"
                  density="comfortable"
                  variant="outlined"
                  autocomplete="off"
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
                  v-model="firstName"
                  label="Primer Nombre"
                  density="comfortable"
                  variant="outlined"
                  required
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="secondName"
                  label="Segundo Nombre"
                  density="comfortable"
                  variant="outlined"
                  hint="Opcional"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="lastNameFather"
                  label="Apellido Paterno"
                  density="comfortable"
                  variant="outlined"
                  required
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="lastNameMother"
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
                  v-model="numeroMatricula"
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
                  v-model="fechaIngreso"
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
                  v-model="fechaTermino"
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
                  v-model="role"
                  :items="roleOptions"
                  label="Rol de Usuario"
                  density="comfortable"
                  variant="outlined"
                  readonly
                />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-switch
                  v-model="isActive"
                  color="success"
                  inset
                  class="ml-md-4"
                  :label="isActive ? 'Usuario Activo' : 'Usuario Inactivo'"
                />
              </v-col>
            </v-row>
          </section>

          <!-- Acciones -->
          <div class="form-actions">
            <v-btn
              variant="text"
              color="secondary"
              @click="handleReset"
            >
              Limpiar
            </v-btn>
            <v-btn
              color="#1e5a3d"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              @click="handleSubmit"
              class="save-btn"
            >
              Guardar Usuario
            </v-btn>
          </div>

          <!-- Mensajes de resultado -->
          <v-alert
            v-if="submitSuccess"
            type="success"
            variant="tonal"
            class="mt-6"
            border="start"
            elevation="1"
          >
            {{ submitSuccess }}
          </v-alert>

          <v-alert
            v-if="submitError"
            type="error"
            variant="tonal"
            class="mt-4"
            border="start"
            elevation="1"
          >
            {{ submitError }}
          </v-alert>
        </v-card-text>
      </v-card>
    </template>

    <!-- Modal de confirmación para activar/desactivar usuario -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon
            :color="userToToggle?.estado === 'Activo' ? 'warning' : 'success'"
            class="mr-2"
          >
            {{ userToToggle?.estado === 'Activo' ? 'mdi-alert' : 'mdi-check-circle' }}
          </v-icon>
          <span>
            {{ userToToggle?.estado === 'Activo' ? 'Desactivar Usuario' : 'Activar Usuario' }}
          </span>
        </v-card-title>
        <v-card-text>
          <p class="mb-2">
            ¿Estás seguro de que deseas
            <strong>{{ userToToggle?.estado === 'Activo' ? 'desactivar' : 'activar' }}</strong>
            al usuario?
          </p>
          <div class="user-info-confirm">
            <div class="d-flex align-center gap-2 mb-2">
              <v-avatar
                :color="getAvatarColor(userToToggle?.nombre || '')"
                size="32"
              >
                <span class="text-white font-weight-bold text-caption">
                  {{ getInitials(userToToggle?.nombre || '') }}
                </span>
              </v-avatar>
              <div>
                <div class="font-weight-bold">{{ userToToggle?.nombre }}</div>
                <div class="text-caption text-medium-emphasis">{{ userToToggle?.email }}</div>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showConfirmDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            :color="userToToggle?.estado === 'Activo' ? 'warning' : 'success'"
            @click="confirmToggleUserStatus"
            :loading="isTogglingStatus"
          >
            {{ userToToggle?.estado === 'Activo' ? 'Desactivar' : 'Activar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { VDataTable } from 'vuetify/components'
import { getApiBaseUrl } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import UserDetailView from '@/components/users/UserDetailView.vue'
import AdminExcelImport from '@/components/admin/AdminExcelImport.vue'
import AdminAsignacionMasiva from '@/components/admin/AdminAsignacionMasiva.vue'

const auth = useAuthStore()

const activeTab = ref<'usuarios' | 'importar' | 'asignacion'>('usuarios')

// Estado para controlar la vista
const showCreateForm = ref(false)
const showUserDetail = ref(false)
const selectedUser = ref<any>(null)

// Estado para modal de confirmación
const showConfirmDialog = ref(false)
const userToToggle = ref<any>(null)
const isTogglingStatus = ref(false)

// Formulario de creación de usuario
const email = ref('')
const password = ref('')
const rut = ref('')
const firstName = ref('')
const secondName = ref('')
const lastNameFather = ref('')
const lastNameMother = ref('')
const numeroMatricula = ref('')
const fechaIngreso = ref('')
const fechaTermino = ref('')
const role = ref('Estudiante')
const isActive = ref(true)

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref<string | null>(null)

const roleOptions = ['Estudiante', 'Profesor', 'Secretaria', 'Director', 'Administrador']

// Reglas de validación
const rules = {
  required: (value: any) => !!value || 'Este campo es requerido',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Email inválido'
  },
}

const handleBack = () => {
  showCreateForm.value = false
  handleReset()
}

const handleReset = () => {
  email.value = ''
  password.value = ''
  rut.value = ''
  firstName.value = ''
  secondName.value = ''
  lastNameFather.value = ''
  lastNameMother.value = ''
  numeroMatricula.value = ''
  fechaIngreso.value = ''
  fechaTermino.value = ''
  role.value = 'Estudiante'
  isActive.value = true
  submitError.value = null
  submitSuccess.value = null
}

const handleSubmit = async () => {
  submitError.value = null
  submitSuccess.value = null

  // Validaciones básicas de campos requeridos
  if (!email.value || !password.value || !rut.value || !firstName.value || !lastNameFather.value || !numeroMatricula.value || !fechaIngreso.value) {
    submitError.value = 'Por favor completa todos los campos obligatorios: correo, contraseña, RUT, primer nombre, apellido paterno, número de matrícula y fecha de ingreso.'
    return
  }

  // Validar token del usuario logueado
  if (!auth.token) {
    submitError.value = 'No hay token de autenticación. Por favor, inicia sesión nuevamente.'
    return
  }

  isSubmitting.value = true

  try {
    // Obtener la URL base normalizada (sin /api/v1 duplicado)
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false

    // Construir endpoint completo
    const endpoint = isDevelopment
      ? '/api/v1/usuarios/admin/crear'
      : `${apiUrl}/api/v1/usuarios/admin/crear`

    // Obtener el token del usuario logueado (admin)
    const userToken = auth.token.trim()
    
    if (!userToken) {
      throw new Error('No hay token disponible. Por favor, inicia sesión nuevamente.')
    }

    // Construir el body exactamente como lo requiere el backend
    const requestBody: Record<string, any> = {
      email: email.value.trim(),
      password: password.value,
      rut: rut.value.trim(),
      primer_nombre: firstName.value.trim(),
      apellido_paterno: lastNameFather.value.trim(),
      id_rol: 1, // Siempre estudiante
      activo: isActive.value,
      nro_matricula: numeroMatricula.value.trim(),
      fecha_ingreso: fechaIngreso.value,
      segundo_nombre: secondName.value.trim() || undefined,
      apellido_materno: lastNameMother.value.trim() || undefined,
      fecha_termino: fechaTermino.value || undefined,
    }
    
    // Eliminar campos opcionales si están vacíos
    if (!requestBody.segundo_nombre) delete requestBody.segundo_nombre
    if (!requestBody.apellido_materno) delete requestBody.apellido_materno
    if (!requestBody.fecha_termino) delete requestBody.fecha_termino

    // Realizar la petición
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(requestBody),
    })

    // Leer la respuesta
    const responseText = await response.text()
    let responseData: any = null

    try {
      responseData = responseText ? JSON.parse(responseText) : null
    } catch (e) {
      console.warn('Respuesta no es JSON:', responseText)
    }

    if (!response.ok) {
      const errorMessage = responseData?.message || 
                           responseData?.error || 
                           responseText || 
                           `Error ${response.status}: ${response.statusText}`
      
      throw new Error(errorMessage)
    }

    // Éxito
    submitSuccess.value = 'Usuario creado correctamente.'
    handleReset()
    // Opcional: regresar a la lista después de 2 segundos
    setTimeout(() => {
      showCreateForm.value = false
    }, 2000)
  } catch (error) {
    console.error('Error al crear usuario:', error)
    submitError.value =
      error instanceof Error
        ? error.message
        : 'Ocurrió un error inesperado al crear el usuario.'
  } finally {
    isSubmitting.value = false
  }
}

// Datos de usuarios
const users = ref<any[]>([])
const isLoadingUsers = ref(false)
const usersError = ref<string | null>(null)
const massAssignStudents = ref<any[]>([])
const isLoadingMassAssignStudents = ref(false)

const searchQuery = ref('')
const selectedRole = ref('Todos los roles')
const selectedStatus = ref('Todos')
const currentPage = ref(1)
const itemsPerPage = ref(6)

const statusOptions = ['Todos', 'Activo', 'Inactivo']

const headers: VDataTable['$props']['headers'] = [
  { title: 'USUARIO', key: 'usuario', sortable: false },
  { title: 'RUT', key: 'rut', sortable: true },
  { title: 'MATRÍCULA', key: 'matricula', sortable: true },
  { title: 'ROL', key: 'rol', sortable: true },
  { title: 'ESTADO', key: 'estado', sortable: true },
  { title: 'ACCIONES', key: 'acciones', sortable: false, align: 'end' },
]

const totalUsers = computed(() => users.value.length)
const displayedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return Math.min(end, totalUsers.value)
})
const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage.value))

const studentsForMassAssign = computed(() =>
  massAssignStudents.value,
)

const fetchMassAssignStudents = async () => {
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  if (!tokenFromStore) return

  isLoadingMassAssignStudents.value = true
  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? '/api/v1/usuarios/admin/usuarios/validos-auth0'
      : `${apiUrl}/api/v1/usuarios/admin/usuarios/validos-auth0`

    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status} al cargar usuarios válidos para asignación masiva.`)
    }

    const payload = await response.json()
    const dataArray: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : []

    massAssignStudents.value = dataArray
      .map((user: any) => {
        const auth0UserId = (user.auth0UserId || user.authUserId || '').toString().trim()
        return {
          uuid: user.id || user.uuid || auth0UserId || user.email,
          auth0UserId,
          rut: user.rut,
          nombre:
            user.nombreCompleto ||
            `${user.primerNombre || ''} ${user.segundoNombre || ''} ${user.apellidoPaterno || ''} ${user.apellidoMaterno || ''}`.trim(),
          email: user.email,
        }
      })
      .filter((u: any) => u.auth0UserId.length > 0)
  } catch {
    // Fallback silencioso: usar lista local de usuarios ya cargada
    massAssignStudents.value = users.value
      .map((u: any) => ({
        uuid: u.uuid || u.id,
        auth0UserId: (u.auth0UserId || '').toString().trim(),
        rut: u.rut,
        nombre: u.nombre,
        email: u.email,
      }))
      .filter((u: any) => u.auth0UserId.length > 0)
  } finally {
    isLoadingMassAssignStudents.value = false
  }
}

// Cargar usuarios desde el backend
const fetchUsers = async () => {
  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  const userRole = auth.user?.role
  
  if (!tokenFromStore) {
    usersError.value = 'No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.'
    return
  }

  // Verificar que el usuario tenga el rol correcto
  if (!userRole || !['Secretaria', 'Director', 'Administrador'].includes(userRole)) {
    usersError.value = `No tienes permisos para acceder a esta sección. Tu rol actual: ${userRole || 'No definido'}. Se requiere: Secretaria, Director o Administrador.`
    console.warn('⚠️ [AdminPage] Usuario sin permisos:', userRole)
    return
  }

  isLoadingUsers.value = true
  usersError.value = null

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    const endpoint = isDevelopment
      ? '/api/v1/usuarios/estudiantes'
      : `${apiUrl}/api/v1/usuarios/estudiantes`

    // Limpiar el token de espacios
    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')

    console.log('🔐 [AdminPage] Cargando usuarios:')
    console.log('   - Endpoint:', endpoint)
    console.log('   - Token presente:', !!cleanToken)
    console.log('   - Token length:', cleanToken.length)
    console.log('   - Usuario rol:', userRole)
    console.log('   - Usuario email:', auth.user?.email)

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
    })

    console.log('📥 [AdminPage] Respuesta recibida:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   OK:', response.ok)

    if (!response.ok) {
      let errorText = ''
      let errorData: any = null
      
      try {
        errorText = await response.text()
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
      } catch (e) {
        errorText = 'No se pudo leer el cuerpo de la respuesta'
        errorData = { message: errorText }
      }

      console.error('❌ [AdminPage] Error al cargar usuarios:')
      console.error('   Status:', response.status)
      console.error('   Error:', JSON.stringify(errorData, null, 2))

      const errorMessage = errorData.message || errorData.msg || `Error ${response.status}: ${response.statusText}`
      throw new Error(`Error ${response.status}: ${errorMessage}`)
    }

    const payload = await response.json()
    console.log('✅ [AdminPage] Usuarios cargados exitosamente (payload):', payload)
    
    const dataArray: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : []

    // Mapear los datos del backend al formato esperado por la tabla
    users.value = dataArray.map((user: any) => {
      // El UUID puede venir en diferentes campos según el backend
      const userId = user.id || user.uuid || user.auth0UserId || user.email
      console.log('👤 [AdminPage] Mapeando usuario:', {
        email: user.email,
        id: user.id,
        uuid: user.uuid,
        auth0UserId: user.auth0UserId,
        userIdFinal: userId
      })
      
      return {
        id: userId, // UUID del usuario (para usar en endpoints)
        uuid: userId, // UUID explícito (alias)
        nombre: user.nombreCompleto || `${user.primerNombre || ''} ${user.segundoNombre || ''} ${user.apellidoPaterno || ''} ${user.apellidoMaterno || ''}`.trim(),
        email: user.email,
        rut: user.rut,
        matricula: user.alumno?.nroMatricula || '',
        rol: user.rol || 'Estudiante',
        estado: user.activo ? 'Activo' : 'Inactivo',
        fechaIngreso: user.alumno?.fechaIngreso || null,
        // Datos adicionales para el detalle
        primerNombre: user.primerNombre,
        segundoNombre: user.segundoNombre,
        apellidoPaterno: user.apellidoPaterno,
        apellidoMaterno: user.apellidoMaterno,
        auth0UserId: user.auth0UserId || user.authUserId || null,
      }
    })
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    usersError.value = error instanceof Error ? error.message : 'Error al cargar usuarios'
  } finally {
    isLoadingUsers.value = false
  }
}

// Cargar usuarios al montar el componente
onMounted(() => {
  fetchUsers()
  fetchMassAssignStudents()
})

// Funciones auxiliares
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

const handleViewUser = (user: any) => {
  console.log('👤 [AdminPage] Ver usuario:', user)
  // Preparar datos del usuario para la vista de detalle
  selectedUser.value = {
    id: user.id || user.uuid || user.email, // UUID del usuario (importante para endpoints)
    uuid: user.uuid || user.id || user.email, // UUID explícito
    nombre: user.nombre,
    email: user.email,
    rut: user.rut,
    matricula: user.matricula,
    rol: user.rol,
    estado: user.estado,
    fechaIngreso: user.fechaIngreso || '2024-02-29',
    // Extraer nombres y apellidos del nombre completo
    primerNombre: user.nombre.split(' ')[0] || '',
    segundoNombre: user.nombre.split(' ')[1] || '',
    apellidoPaterno: user.nombre.split(' ')[2] || '',
    apellidoMaterno: user.nombre.split(' ')[3] || '',
    activo: user.estado === 'Activo',
  }
  console.log('✅ [AdminPage] Usuario seleccionado con UUID:', selectedUser.value.uuid)
  showUserDetail.value = true
  showCreateForm.value = false
  console.log('Estado actualizado - showUserDetail:', showUserDetail.value, 'selectedUser:', selectedUser.value)
}

const handleBackFromDetail = () => {
  showUserDetail.value = false
  selectedUser.value = null
}

const handleUserUpdate = (updatedUser: any) => {
  // Actualizar el usuario en la lista
  const index = users.value.findIndex(u => u.email === updatedUser.email)
  if (index !== -1) {
    users.value[index] = {
      ...users.value[index],
      nombre: updatedUser.nombre || users.value[index].nombre,
      email: updatedUser.email || users.value[index].email,
      rut: updatedUser.rut || users.value[index].rut,
      matricula: updatedUser.matricula || users.value[index].matricula,
      rol: updatedUser.rol || users.value[index].rol,
      estado: updatedUser.activo ? 'Activo' : 'Inactivo',
    }
  }
}

const handleToggleUserStatus = (user: any) => {
  userToToggle.value = user
  showConfirmDialog.value = true
}

const confirmToggleUserStatus = async () => {
  if (!userToToggle.value) return

  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  
  if (!tokenFromStore) {
    console.error('No hay token de autenticación disponible')
    usersError.value = 'No hay token de autenticación disponible'
    return
  }

  isTogglingStatus.value = true

  try {
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV || false
    
    // TODO: Implementar endpoint para activar/desactivar usuario
    // Por ahora solo actualizamos el estado localmente
    // Cuando esté disponible el endpoint, usar:
    // const endpoint = isDevelopment
    //   ? `/api/v1/usuarios/${userToToggle.value.auth0UserId}/toggle-status`
    //   : `${apiUrl}/api/v1/usuarios/${userToToggle.value.auth0UserId}/toggle-status`
    
    const index = users.value.findIndex(u => u.email === userToToggle.value.email)
    if (index !== -1) {
      const newStatus = userToToggle.value.estado === 'Activo' ? 'Inactivo' : 'Activo'
      users.value[index].estado = newStatus
      
      // Si el usuario está en la vista de detalle, actualizar también ahí
      if (selectedUser.value && selectedUser.value.email === userToToggle.value.email) {
        selectedUser.value.estado = newStatus
        selectedUser.value.activo = newStatus === 'Activo'
      }
    }

    // Cerrar el modal
    showConfirmDialog.value = false
    const userEmail = userToToggle.value.email
    const wasActive = userToToggle.value.estado === 'Activo'
    userToToggle.value = null

    console.log(`Usuario ${wasActive ? 'desactivado' : 'activado'} correctamente`)
  } catch (error) {
    console.error('Error al cambiar el estado del usuario:', error)
    usersError.value = 'Error al cambiar el estado del usuario'
  } finally {
    isTogglingStatus.value = false
  }
}
</script>

<style scoped>
.admin-page {
  width: 100%;
  padding: 24px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left h1 {
  color: #212121;
  margin-bottom: 4px;
}

.header-left p {
  color: #757575;
}

.new-user-btn {
  text-transform: none;
  color: white;
}

.search-filters-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-field {
  flex: 1;
  max-width: 600px;
}

.filter-select {
  min-width: 180px;
}

.users-table-card {
  background: white;
  border-radius: 8px;
}

.users-table {
  background: white;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  color: #212121;
  font-size: 14px;
}

.user-email {
  color: #757575;
  font-size: 12px;
}

.role-chip {
  font-weight: 500;
  color: white;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  font-size: 8px;
}

.status-text {
  color: #212121;
  font-size: 14px;
}

.actions-cell {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.footer-left {
  color: #757575;
}

/* Estilos del formulario */
.form-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  margin-top: 4px;
  text-transform: none;
}

.form-header-content h1 {
  color: #212121;
  margin-bottom: 4px;
}

.form-header-content p {
  color: #757575;
}

.create-user-card {
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
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.save-btn {
  text-transform: none;
  color: white;
}

.user-info-confirm {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
}

/* Responsive */
@media (max-width: 960px) {
  .admin-header {
    flex-direction: column;
    gap: 16px;
  }

  .search-filters-section {
    flex-direction: column;
  }

  .filter-select {
    min-width: 100%;
  }

  .table-footer {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>
