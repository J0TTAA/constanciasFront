<template>
  <v-app class="login-app">
    <v-main class="login-main gradient-background">
      <div class="login-container">
        <!-- Formulario de login centrado -->
        <div class="login-center">
      <v-responsive max-width="448">
            <!-- Imagen encima del formulario -->
            <div class="login-logo-container">
              <v-img
                src="/images/barra-izq.png"
                alt="Barra izquierda"
                class="login-logo-above"
                contain
              ></v-img>
            </div>
            <v-card class="rounded-xl" elevation="12">
              <v-card-title class="pa-6 pb-2 text-center" style="line-height: 1.4">
            <h1
              class="text-h6 text-wrap font-weight-bold"
              style="color: #1e5a3d"
            >
              Sistema de Gestión de Constancias
            </h1>
          </v-card-title>

          <v-card-subtitle
                class="text-center text-wrap pb-4"
            style="color: #1e5a3d"
          >
            Doctorado en Ciencias de Recursos Naturales
          </v-card-subtitle>

          <!--
            v-card-text equivale a CardContent.
            Usamos v-form para manejar el submit.
          -->
          <v-card-text class="pa-6">
            <v-form @submit.prevent="login">
              <!-- Campo de correo electrónico -->
              <v-text-field
                v-model="email"
                label="CORREO ELECTRÓNICO"
                placeholder="ejemplo@ufro.cl"
                type="email"
                variant="outlined"
                class="mb-4"
                :disabled="isLoading"
                :error="!!emailError"
                :error-messages="emailError ? [emailError] : []"
                required
                density="comfortable"
              ></v-text-field>

              <!-- Campo de contraseña -->
              <v-text-field
                v-model="password"
                label="CONTRASEÑA"
                placeholder="********"
                type="password"
                variant="outlined"
                class="mb-4"
                :disabled="isLoading"
                :error="!!passwordError"
                :error-messages="passwordError ? [passwordError] : []"
                required
                density="comfortable"
              ></v-text-field>

              <!-- Botón de ingresar -->
              <v-btn
                :loading="isLoading"
                :disabled="isLoading"
                color="#1e5a3d"
                size="large"
                block
                class="mb-3"
                style="text-transform: none; color: white"
                type="submit"
              >
                Ingresar
              </v-btn>

              <!-- Enlace de olvidé mi contraseña -->
              <div class="text-center mb-4">
                <a
                  href="#"
                  class="text-caption"
                  style="color: #757575; text-decoration: none"
                  @click.prevent="handleForgotPassword"
                >
                  ¿Olvidaste tu contraseña?
                </a>
            </div>

              <!-- Mensaje de error -->
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
                class="mt-2 text-caption"
              density="compact"
            >
              {{ error }}
            </v-alert>
            </v-form>

            <p
              class="text-center text-caption text-disabled mt-6"
              style="color: #1e5a3d"
            >
              © 2025 Universidad de La Frontera. Prototipo.
            </p>
          </v-card-text>
        </v-card>
            <!-- Imagen debajo del formulario -->
            <div class="login-logo-container login-logo-below">
              <v-img
                src="/images/barra-der.png"
                alt="Barra derecha"
                class="login-logo-above"
                contain
              ></v-img>
            </div>
      </v-responsive>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = computed(() => auth.errorMessage)

const emailError = ref('')
const passwordError = ref('')

type DecodedToken = {
  sub?: string
  email?: string
  user_metadata?: {
    role?: string
    roles?: string[]
    name?: string
    full_name?: string
    primer_nombre?: string
    primer_apellido?: string
  }
  app_metadata?: {
    role?: string
    roles?: string[]
  }
}

watch(email, () => {
  if (emailError.value) emailError.value = ''
})

watch(password, () => {
  if (passwordError.value) passwordError.value = ''
})

const login = async () => {
  auth.clearError()
  emailError.value = ''
  passwordError.value = ''
  
  if (!email.value || !password.value) {
    if (!email.value) emailError.value = 'Ingresa tu correo.'
    if (!password.value) passwordError.value = 'Ingresa tu contraseña.'
    auth.captureError(new Error('Completa correo y contraseña.'))
    return
  }
  
  isLoading.value = true
  
  try {
    const apiUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000'
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    // 📋 Logs de configuración de Supabase
    console.log('🔐 [Login] Configuración de Supabase:')
    console.log('   - VITE_SUPABASE_URL:', apiUrl)
    console.log('   - VITE_SUPABASE_ANON_KEY:', anonKey ? '✅ Definida' : '❌ No definida')
    
    if (!apiUrl) {
      throw new Error('VITE_SUPABASE_URL no está configurado en el archivo .env')
    }
    
    if (!anonKey) {
      throw new Error('VITE_SUPABASE_ANON_KEY no está configurado en el archivo .env')
    }
    
    const loginEndpoint = `${apiUrl}/auth/v1/token?grant_type=password`
    console.log('   - Endpoint completo:', loginEndpoint)
    const loginBody = {
      email: email.value,
      password: password.value,
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    }
    
    console.log('🔍 [Login] Iniciando login...')
    console.log('   URL del API:', apiUrl)
    console.log('   Endpoint completo:', loginEndpoint)
    console.log('   Método: POST')
    console.log('   Anon Key configurada:', anonKey ? 'Sí' : 'No')
    console.log('   Email:', email.value)
    console.log('   Password:', password.value ? '***' : 'No proporcionada')
    console.log('   Headers:', {
      'Content-Type': 'application/json',
      'apikey': anonKey ? `${anonKey.substring(0, 20)}...` : 'No configurada',
      'Authorization': `Bearer ${anonKey ? anonKey.substring(0, 20) + '...' : 'No configurada'}`,
    })
    console.log('   Body:', loginBody)
    
    const response = await fetch(loginEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(loginBody),
    })
    
    console.log('📥 [Login] Respuesta recibida:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   OK:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Login] Error en la respuesta:')
      console.error('   Status:', response.status)
      console.error('   Status Text:', response.statusText)
      console.error('   Error raw:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
        console.error('   Error parseado:', JSON.stringify(errorData, null, 2))
      } catch (e) {
        console.error('   Error al parsear JSON:', e)
        errorData = { message: errorText || 'Error al iniciar sesión' }
      }
      
      // Extraer mensaje de error más específico
      const errorMessage = errorData.msg || errorData.message || errorData.error_description || `Error ${response.status}: ${response.statusText}`
      const errorCode = errorData.error_code || errorData.error || null
      
      console.error('   Código de error:', errorCode)
      console.error('   Mensaje de error:', errorMessage)
      
      // Mensajes de ayuda según el tipo de error
      let userFriendlyMessage = errorMessage
      
      if (
        errorCode === 'invalid_credentials' ||
        errorMessage.toLowerCase().includes('invalid login') ||
        response.status === 400 ||
        response.status === 401
      ) {
        console.error('   💡 Sugerencia: Verifica que el email y password sean correctos')
        console.error('   💡 Credenciales de prueba correctas:', 'admin@correo.com / password123')
        userFriendlyMessage = 'Correo o contraseña incorrectos.'
        passwordError.value = 'Correo o contraseña incorrectos.'
      }
      
      if (response.status === 400 && !errorCode) {
        console.error('   💡 Sugerencia: Verifica que el endpoint y los headers sean correctos')
      }
      
      // Capturar el error en el store para mostrarlo en la UI
      auth.captureError(new Error(userFriendlyMessage))
      throw new Error(userFriendlyMessage)
    }

    const data = await response.json()
    
    console.log('✅ [Login] Login exitoso:')
    console.log('   Respuesta completa:', JSON.stringify(data, null, 2))
    console.log('   Access token presente:', !!data.access_token)
    console.log('   User ID:', data.user?.id)
    console.log('   User email:', data.user?.email)
    
    // Extraer access_token de la respuesta
    const token = data.access_token || data.token || data.accessToken
    
    if (!token) {
      throw new Error('No se recibió un token en la respuesta')
    }
    
    console.log('Token extraído:', token ? 'Token presente' : 'Sin token')
    console.log('Token (primeros 50 chars):', token ? token.substring(0, 50) + '...' : 'Sin token')
    
    // 🔍 Decodificar el JWT para obtener el rol del metadata
    console.log('🔍 [JWT] Decodificando token para extraer rol del metadata...')
    
    let roleName: string | null = null
    let userName: string | null = null
    let userEmail: string | null = null
    let userId: string | null = null
    
    try {
      const decodedToken = jwtDecode<DecodedToken>(token)
      console.log('✅ [JWT] Token decodificado exitosamente')
      console.log('   Payload completo:', JSON.stringify(decodedToken, null, 2))
      
      // Extraer datos del usuario
      userId = decodedToken.sub || null
      userEmail = decodedToken.email || data.user?.email || email.value
      
      console.log('   User ID (sub):', userId)
      console.log('   Email:', userEmail)
      
      // Buscar el rol en diferentes ubicaciones del metadata
      // 1. user_metadata.role
      // 2. app_metadata.role
      // 3. user_metadata.roles (array)
      // 4. app_metadata.roles (array)
      
      if (decodedToken.user_metadata?.role) {
        roleName = decodedToken.user_metadata.role
        console.log('   Rol encontrado en user_metadata.role:', roleName)
      } else if (decodedToken.app_metadata?.role) {
        roleName = decodedToken.app_metadata.role
        console.log('   Rol encontrado en app_metadata.role:', roleName)
      } else if (decodedToken.user_metadata?.roles && Array.isArray(decodedToken.user_metadata.roles) && decodedToken.user_metadata.roles.length > 0) {
        roleName = decodedToken.user_metadata.roles[0]
        console.log('   Rol encontrado en user_metadata.roles[0]:', roleName)
      } else if (decodedToken.app_metadata?.roles && Array.isArray(decodedToken.app_metadata.roles) && decodedToken.app_metadata.roles.length > 0) {
        roleName = decodedToken.app_metadata.roles[0]
        console.log('   Rol encontrado en app_metadata.roles[0]:', roleName)
      } else {
        console.warn('⚠️ [JWT] No se encontró rol en el metadata del token')
        console.warn('   user_metadata:', decodedToken.user_metadata)
        console.warn('   app_metadata:', decodedToken.app_metadata)
      }
      
      // Extraer nombre si está en metadata
      if (decodedToken.user_metadata?.name) {
        userName = decodedToken.user_metadata.name
      } else if (decodedToken.user_metadata?.full_name) {
        userName = decodedToken.user_metadata.full_name
      } else if (decodedToken.user_metadata?.primer_nombre && decodedToken.user_metadata?.primer_apellido) {
        userName = `${decodedToken.user_metadata.primer_nombre} ${decodedToken.user_metadata.primer_apellido}`
      }
      
      console.log('   Rol extraído del JWT:', roleName)
      console.log('   Nombre extraído del JWT:', userName)
      
    } catch (error) {
      console.error('❌ [JWT] Error al decodificar el token:', error)
      console.error('   Token que intentó decodificar:', token ? token.substring(0, 50) + '...' : 'No token')
      // Continuar sin rol si no se puede decodificar
    }
    
    // Mapear el rol del JWT metadata a los roles permitidos del sistema
    // El metadata puede tener: "admin", "estudiante", "secretaria", "director", etc.
    type AllowedRole = 'Estudiante' | 'Secretaria' | 'Director' | 'Administrador'

    const roleMapping: Record<string, AllowedRole> = {
      'admin': 'Administrador',
      'administrador': 'Administrador',
      'estudiante': 'Estudiante',
      'student': 'Estudiante',
      'secretaria': 'Secretaria',
      'secretary': 'Secretaria',
      'secretaría': 'Secretaria',
      'director': 'Director',
    }
    const allowedRoleByNormalized: Record<string, AllowedRole> = {
      estudiante: 'Estudiante',
      secretaria: 'Secretaria',
      secretaría: 'Secretaria',
      director: 'Director',
      administrador: 'Administrador',
    }
    
    // Mapear el rol del backend al rol del sistema (case-insensitive)
    const normalizedRoleName = roleName?.toLowerCase().trim() || null
    const mappedRole: AllowedRole | null = normalizedRoleName
      ? roleMapping[normalizedRoleName] || allowedRoleByNormalized[normalizedRoleName] || null
      : null
    
    console.log('🔍 [Frontend] Procesamiento del rol:')
    console.log('   Rol del JWT metadata (raw):', roleName)
    console.log('   Rol normalizado (lowercase):', normalizedRoleName)
    console.log('   Rol mapeado para el sistema:', mappedRole)
    console.log('   Role mapping usado:', normalizedRoleName && roleMapping[normalizedRoleName] ? roleMapping[normalizedRoleName] : 'No mapeado')
    console.log('⚠️ IMPORTANTE: El rol se extrae del JWT (metadata del token)')
    console.log('⚠️ El frontend usa el rol solo para mostrar/ocultar vistas. RLS decide los permisos reales.')

    // Guardar la sesión en el store ANTES de redirigir
    // Usar los datos extraídos del JWT (metadata)
    const finalEmail = userEmail || data.user?.email || email.value
    const finalName = userName || data.user?.email?.split('@')[0] || email.value.split('@')[0] || null
    
    auth.login(
      {
        email: finalEmail,
        name: finalName,
        role: mappedRole,
      },
      token,
    )
    
    console.log('✅ [Frontend] Sesión guardada en el store:')
    console.log('   Usuario completo:', JSON.stringify(auth.user, null, 2))
    console.log('   Token guardado:', auth.token ? `Sí (${auth.token.length} caracteres)` : 'No')
    console.log('   Usuario autenticado:', auth.isLoggedIn)
    console.log('   Email:', auth.user?.email)
    console.log('   Nombre:', auth.user?.name)
    console.log('   Rol:', auth.user?.role, '(extraído del JWT metadata)')
    console.log('🔐 Seguridad: El frontend usa el rol solo para UI. RLS decide permisos reales.')

    // Redirigir al dashboard después de guardar la sesión
    await router.push('/dashboard/solicitudes')
  } catch (err) {
    console.error('Error en login:', err)
    auth.captureError(err)
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = () => {
  router.push({ name: 'forgot-password-help' })
}
</script>

<style scoped>
/* Estilo para el fondo verde sólido */
.gradient-background {
  background: #1e5a3d;
  min-height: 100vh;
}

.login-main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
}

.login-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.login-right-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  color: white;
  height: 100%;
  justify-content: space-between;
}

.login-title-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.login-logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}

.login-logo-below {
  margin-bottom: 0;
  margin-top: 24px;
}

.login-logo-above {
  max-width: 400px;
  width: 100%;
  height: auto;
}


/* Estilos para los campos de texto - labels en mayúsculas */
:deep(.v-field-label) {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 500;
  color: #424242;
  letter-spacing: 0.5px;
}

/* Estilos para el enlace de olvidé contraseña */
a {
  transition: color 0.2s ease;
}

a:hover {
  color: #1e5a3d !important;
  text-decoration: underline !important;
}
</style>

<style>
/* Estilos globales para el v-app en login */
.login-app {
  background: #1e5a3d !important;
  min-height: 100vh;
}

.login-app .v-main {
  background: #1e5a3d !important;
}

/* Responsive */
@media (max-width: 960px) {
  .login-logo-above {
    max-width: 100%;
  }
}

@media (max-width: 600px) {
  .login-main {
    padding: 16px;
  }

  .login-logo-above {
    max-width: 100%;
  }
}
</style>