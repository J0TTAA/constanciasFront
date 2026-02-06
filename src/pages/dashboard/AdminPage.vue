<template>
  <div class="admin-page">
    <!-- Encabezado principal -->
    <h1 class="text-h4 font-weight-bold">Panel de Administración</h1>
    <p class="mt-2 text-medium-emphasis">
      Gestión completa de las entidades del sistema.
    </p>

    <!-- Alerta de rol / guardia de ruta -->
    <v-alert
      type="success"
      variant="tonal"
      class="mt-6"
      border="start"
      elevation="2"
      icon="mdi-shield-check"
    >
      Estás viendo esta página porque tu rol es
      <strong>'Administrador'</strong>. El "Guardia de Ruta" (Route Guard) ha
      funcionado correctamente.
    </v-alert>

    <!-- Card principal: Crear nuevo usuario -->
    <v-card class="mt-8 rounded-xl admin-card" elevation="1">
      <v-card-title class="py-4 px-6 d-flex flex-column align-start">
        <span class="text-subtitle-1 font-weight-bold">
          Crear Nuevo Usuario
        </span>
        <span class="text-caption text-medium-emphasis mt-1">
          Información personal y credenciales
        </span>
      </v-card-title>

      <v-divider />

      <v-card-text class="px-6 pb-6">
        <!-- Sección: Datos de acceso -->
        <section class="mb-6">
          <div class="section-title text-caption text-medium-emphasis">
            DATOS DE ACCESO
          </div>

          <v-row class="mt-3" dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="email"
                label="Correo Electrónico"
                type="email"
                density="comfortable"
                variant="outlined"
                autocomplete="off"
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
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="rut"
                label="RUT *"
                placeholder="12.345.678-9"
                density="comfortable"
                variant="outlined"
                autocomplete="off"
                required
              />
            </v-col>
          </v-row>
        </section>

        <!-- Sección: Información personal -->
        <section class="mb-6">
          <div class="section-title text-caption text-medium-emphasis">
            INFORMACIÓN PERSONAL
          </div>

          <v-row class="mt-3" dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="firstName"
                label="Primer Nombre *"
                density="comfortable"
                variant="outlined"
                required
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
                label="Apellido Paterno *"
                density="comfortable"
                variant="outlined"
                required
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

        <!-- Sección: Datos académicos del estudiante -->
        <section class="mb-6">
          <div class="section-title text-caption text-medium-emphasis">
            DATOS ACADÉMICOS
          </div>

          <v-row class="mt-3" dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="numeroMatricula"
                label="Nro Matrícula *"
                density="comfortable"
                variant="outlined"
                required
                hint="Número de matrícula del estudiante"
                persistent-hint
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="fechaIngreso"
                label="Fecha Ingreso *"
                type="date"
                density="comfortable"
                variant="outlined"
                required
                hint="Fecha de ingreso del estudiante"
                persistent-hint
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
        <section>
          <div class="section-title text-caption text-medium-emphasis">
            ROL Y ESTADO
          </div>

          <v-row class="mt-3" dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="role"
                label="Rol de Usuario"
                placeholder="Estudiante (rol fijo id_rol = 1)"
                readonly
                density="comfortable"
                variant="outlined"
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
        <div class="d-flex justify-end mt-6">
          <v-btn
            variant="text"
            color="secondary"
            class="mr-2"
            @click="handleReset"
          >
            Limpiar
          </v-btn>

          <v-btn
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="handleSubmit"
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

        <!-- Mensaje informativo general -->
        <v-alert
          v-if="!submitSuccess && !submitError"
          type="info"
          variant="tonal"
          class="mt-6"
          border="start"
          elevation="1"
        >
          Esta vista permite crear nuevos usuarios estudiantes (id_rol = 1).
          El backend valida que sólo usuarios con rol Administrador puedan usar
          este formulario.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

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
    // Obtener la URL del backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3020'
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
    // Campos obligatorios: email, password, rut, primer_nombre, apellido_paterno, nro_matricula, fecha_ingreso
    // Campos opcionales: segundo_nombre, apellido_materno, fecha_termino
    const requestBody: Record<string, any> = {
      // Campos obligatorios para usuario
      email: email.value.trim(),
      password: password.value,
      rut: rut.value.trim(),
      primer_nombre: firstName.value.trim(),
      apellido_paterno: lastNameFather.value.trim(),
      id_rol: 1, // Siempre estudiante
      activo: isActive.value,
      
      // Campos obligatorios para tabla alumno
      nro_matricula: numeroMatricula.value.trim(),
      fecha_ingreso: fechaIngreso.value,
      
      // Campos opcionales
      segundo_nombre: secondName.value.trim() || undefined,
      apellido_materno: lastNameMother.value.trim() || undefined,
      fecha_termino: fechaTermino.value || undefined,
    }
    
    // Eliminar campos opcionales si están vacíos para no enviarlos
    if (!requestBody.segundo_nombre) delete requestBody.segundo_nombre
    if (!requestBody.apellido_materno) delete requestBody.apellido_materno
    if (!requestBody.fecha_termino) delete requestBody.fecha_termino

    // Logs de depuración
    console.log('🧩 [AdminPage] Creando usuario...')
    console.log('   - Endpoint:', endpoint)
    console.log('   - Token (primeros 20 chars):', userToken.substring(0, 20) + '...')
    console.log('   - Body:', {
      ...requestBody,
      password: '***' // No mostrar la contraseña
    })

    // Realizar la petición
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('📥 [AdminPage] Respuesta recibida:')
    console.log('   - Status:', response.status, response.statusText)

    // Leer la respuesta
    const responseText = await response.text()
    let responseData: any = null

    try {
      responseData = responseText ? JSON.parse(responseText) : null
    } catch (e) {
      console.warn('   - Respuesta no es JSON:', responseText)
    }

    if (!response.ok) {
      console.error('❌ [AdminPage] Error del backend:')
      console.error('   - Status:', response.status)
      console.error('   - Respuesta:', responseData || responseText)
      
      const errorMessage = responseData?.message || 
                           responseData?.error || 
                           responseText || 
                           `Error ${response.status}: ${response.statusText}`
      
      throw new Error(errorMessage)
    }

    // Éxito
    console.log('✅ [AdminPage] Usuario creado correctamente')
    console.log('   - Respuesta:', responseData)

    submitSuccess.value = 'Usuario creado correctamente.'
    handleReset()
  } catch (error) {
    console.error('❌ [AdminPage] Error al crear usuario:', error)
    submitError.value =
      error instanceof Error
        ? error.message
        : 'Ocurrió un error inesperado al crear el usuario.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.admin-page {
  width: 100%;
}

.admin-card {
  background-color: #f9fafb;
}

.section-title {
  font-weight: 600;
  letter-spacing: 0.08em;
}
</style>
