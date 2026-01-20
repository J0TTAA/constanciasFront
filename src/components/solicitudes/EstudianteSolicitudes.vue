<template>
  <div class="solicitudes-wrapper">
    <template v-if="!selectedRequest">
      <div class="d-flex align-center gap-2 mb-5">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          @click="showModal = true"
        >
          Nueva Solicitud
        </v-btn>
        
        <!-- Botón de prueba para endpoint -->
        <v-btn
          color="secondary"
          variant="outlined"
          size="small"
          prepend-icon="mdi-test-tube"
          :loading="isTestingEndpoint"
          :disabled="isTestingEndpoint || !auth.token"
          @click="handleTestEndpoint"
        >
          Prueba API
        </v-btn>
      </div>

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
const isTestingEndpoint = ref(false)

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

const handleTestEndpoint = async () => {
  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  // Obtener el token del store
  const tokenFromStore = auth.token
  
  if (!tokenFromStore) {
    console.error('❌ No hay token disponible en el store')
    console.error('   Store state:', {
      user: auth.user,
      isLoggedIn: auth.isLoggedIn,
      token: auth.token,
      initialized: auth.initialized,
    })
    
    // Intentar obtener del localStorage directamente
    const storedAuth = localStorage.getItem('auth')
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth)
        console.log('   Token en localStorage:', parsed.token ? 'Presente' : 'Ausente')
        if (parsed.token) {
          console.log('   Token de localStorage:', parsed.token.substring(0, 50) + '...')
        }
      } catch (e) {
        console.error('   Error al leer localStorage:', e)
      }
    }
    
    alert('Error: No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.')
    return
  }

  isTestingEndpoint.value = true

  try {
    // ⚠️ IMPORTANTE: Usar proxy de Vite en desarrollo para evitar CORS
    // El proxy redirige /api/v1/constancias/* a http://localhost:3020/api/v1/constancias/*
    // Esto evita problemas de CORS durante desarrollo
    // En producción, el backend DEBE tener CORS configurado
    const isDevelopment = import.meta.env.DEV
    const endpoint = isDevelopment
      ? '/api/v1/constancias/solicitar' // Proxy de Vite (evita CORS en desarrollo)
      : 'http://localhost:3020/api/v1/constancias/solicitar' // URL completa en producción
    
    const body = {
      nombreTipoConstancia: 'Alumno Regular',
    }

    // Limpiar el token de espacios y caracteres extra (múltiples espacios, saltos de línea, etc.)
    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')
    
    if (!cleanToken) {
      console.error('❌ Token vacío o inválido')
      alert('Error: No hay token de autenticación disponible')
      isTestingEndpoint.value = false
      return
    }

    // Validar formato del token (debe empezar con "eyJ")
    if (!cleanToken.startsWith('eyJ')) {
      console.error('❌ Token con formato inválido')
      console.error('   Token debe empezar con "eyJ" (JWT base64)')
      console.error('   Token recibido (primeros 10 chars):', cleanToken.substring(0, 10))
      alert('Error: Token con formato inválido. Debe ser un JWT válido.')
      isTestingEndpoint.value = false
      return
    }

    // Decodificar el token para verificar expiración y mostrar información
    let tokenExpired = false
    let tokenExpirationDate: Date | null = null
    let tokenUserId: string | null = null
    let tokenEmail: string | null = null
    
    try {
      const { jwtDecode } = await import('jwt-decode')
      const decodedToken = jwtDecode<any>(cleanToken)
      
      // Verificar expiración
      if (decodedToken.exp) {
        tokenExpirationDate = new Date(decodedToken.exp * 1000)
        const now = new Date()
        tokenExpired = tokenExpirationDate < now
        
        console.log('🔍 [JWT] Información del token:')
        console.log('   User ID (sub):', decodedToken.sub || 'No disponible')
        console.log('   Email:', decodedToken.email || 'No disponible')
        console.log('   Expiración:', tokenExpirationDate.toISOString())
        console.log('   Fecha actual:', now.toISOString())
        console.log('   ¿Token expirado?', tokenExpired ? '❌ SÍ' : '✅ NO')
        
        if (tokenExpired) {
          const minutesExpired = Math.floor((now.getTime() - tokenExpirationDate.getTime()) / 1000 / 60)
          console.error('   ⚠️ Token expirado hace', minutesExpired, 'minutos')
        } else {
          const minutesUntilExpiry = Math.floor((tokenExpirationDate.getTime() - now.getTime()) / 1000 / 60)
          console.log('   ✅ Token válido por', minutesUntilExpiry, 'minutos más')
        }
        
        tokenUserId = decodedToken.sub || null
        tokenEmail = decodedToken.email || null
      }
    } catch (decodeError) {
      console.warn('⚠️ [JWT] No se pudo decodificar el token (puede ser normal si el formato es diferente):', decodeError)
      // Continuar de todas formas, el backend validará el token
    }

    // Si el token está expirado, advertir al usuario
    if (tokenExpired) {
      console.error('❌ [JWT] Token expirado - El backend rechazará esta petición')
      alert(`Error: El token de autenticación ha expirado.\n\nPor favor, cierra sesión y vuelve a iniciar sesión.`)
      isTestingEndpoint.value = false
      return
    }

    console.log('🔍 [Test Endpoint] Llamando al endpoint de prueba...')
    console.log('   Modo:', isDevelopment ? 'Desarrollo (con proxy)' : 'Producción (URL completa)')
    console.log('   URL relativa:', endpoint)
    if (isDevelopment) {
      console.log('   URL completa (proxy redirige a):', 'http://localhost:3020' + endpoint)
    } else {
      console.log('   URL completa:', endpoint)
    }
    console.log('   Método: POST')
    console.log('   Body:', JSON.stringify(body, null, 2))
    console.log('   Token presente:', !!cleanToken)
    console.log('   Token longitud:', cleanToken.length)
    console.log('   Token formato:', cleanToken.startsWith('eyJ') ? '✅ JWT válido' : '❌ Formato inválido')
    console.log('   Token (primeros 50 chars):', cleanToken.substring(0, 50) + '...')
    console.log('   Token (últimos 20 chars):', '...' + cleanToken.substring(cleanToken.length - 20))
    if (tokenExpirationDate) {
      console.log('   Token expiración:', tokenExpirationDate.toISOString())
      console.log('   Token expirado:', tokenExpired ? '❌ SÍ' : '✅ NO')
    }
    if (tokenUserId) {
      console.log('   User ID del token:', tokenUserId)
    }
    if (tokenEmail) {
      console.log('   Email del token:', tokenEmail)
    }
    
    // Construir el header Authorization exactamente como en Postman
    // Asegurar que no haya espacios extra después de "Bearer"
    const bearerToken = `Bearer ${cleanToken}`.trim()
    
    // Verificar que no haya espacios extra
    if (bearerToken.includes('  ') || bearerToken.startsWith('Bearer  ')) {
      console.error('❌ [Headers] Hay espacios extra en el header Authorization')
      console.error('   Header problemático:', bearerToken)
    }
    
    console.log('   Header Authorization completo:', bearerToken.substring(0, 80) + '...')
    console.log('   Header Authorization longitud:', bearerToken.length)
    console.log('   Header Authorization sin espacios extra:', !bearerToken.includes('  ') ? '✅' : '❌')
    
    // Headers exactos como en Postman - asegurar que no haya valores undefined o null
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': bearerToken,
    }
    
    // Validar que los headers no tengan valores vacíos o undefined
    Object.keys(requestHeaders).forEach(key => {
      const value = requestHeaders[key as keyof HeadersInit]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        console.error(`❌ [Headers] Header "${key}" está vacío o undefined:`, value)
      }
    })
    
    console.log('   Headers que se enviarán:', {
      'Content-Type': requestHeaders['Content-Type'],
      'Authorization': requestHeaders.Authorization.substring(0, 70) + '...',
    })
    console.log('   Comparación con Postman:')
    console.log('     - URL:', isDevelopment ? '✅ Relativa (proxy redirige)' : '✅ Completa')
    console.log('     - URL destino:', isDevelopment ? 'http://localhost:3020' + endpoint : endpoint)
    console.log('     - Method: ✅ POST')
    console.log('     - Body: ✅ Correcto')
    console.log('     - Authorization header: ✅ Bearer token presente')
    console.log('     - Token expirado:', tokenExpired ? '❌ SÍ (causará 401)' : '✅ NO')
    console.log('   ⚠️ Si sigue dando 401/500, verifica:')
    console.log('     1. Token no expirado:', tokenExpired ? '❌' : '✅')
    console.log('     2. Backend corriendo en puerto 3020')
    console.log('     3. Backend tiene SUPABASE_JWT_SECRET configurado')
    console.log('     4. Proxy de Vite redirige correctamente (solo en desarrollo)')

    // ⚠️ IMPORTANTE: El navegador hace una petición OPTIONS (preflight) antes del POST
    // Si el backend no tiene CORS configurado, el navegador bloquea la petición
    const currentOrigin = window.location.origin
    console.log('⚠️ [CORS] Información del navegador:')
    console.log('   Origin actual:', currentOrigin)
    console.log('   El navegador enviará una petición OPTIONS (preflight) antes del POST')
    console.log('   El backend debe responder con headers CORS correctos')
    console.log('   Origin permitido debe incluir:', currentOrigin)

    // Verificar primero si el endpoint responde (test de conectividad)
    console.log('🔍 [Test Endpoint] Verificando conectividad con el backend...')
    let response: Response
    let fetchError: unknown = null
    
    try {
      const requestInit: RequestInit = {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(body),
      }
      
      console.log('📤 [Test Endpoint] Enviando request:')
      console.log('   URL:', endpoint)
      console.log('   Method:', requestInit.method)
      console.log('   Headers:', JSON.stringify(requestHeaders, null, 2))
      console.log('   Body:', JSON.stringify(body, null, 2))
      console.log('   RequestInit completo:', {
        method: requestInit.method,
        headers: requestInit.headers,
        body: requestInit.body,
      })
      
      const startTime = Date.now()
      response = await fetch(endpoint, requestInit)
      const requestTime = Date.now() - startTime
      
      console.log('📥 [Test Endpoint] Respuesta recibida:')
      console.log('   Tiempo de respuesta:', requestTime, 'ms')
      console.log('   Status:', response.status, response.statusText)
      console.log('   OK:', response.ok)
      console.log('   Type:', response.type)
      console.log('   Redirected:', response.redirected)
      console.log('   URL final:', response.url)
      
      // Analizar headers de respuesta
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      
      console.log('   Headers de respuesta (todos):', JSON.stringify(responseHeaders, null, 2))
      
      // Headers CORS específicos
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-expose-headers': response.headers.get('access-control-expose-headers'),
      }
      
      console.log('   Headers CORS:', JSON.stringify(corsHeaders, null, 2))
      
      // Verificar si CORS está configurado
      if (!corsHeaders['access-control-allow-origin']) {
        console.warn('⚠️ [CORS] No se encontró header Access-Control-Allow-Origin')
        console.warn('   Esto puede indicar que CORS no está configurado en el backend')
      } else {
        console.log('✅ [CORS] Access-Control-Allow-Origin:', corsHeaders['access-control-allow-origin'])
        if (corsHeaders['access-control-allow-origin'] !== '*' && corsHeaders['access-control-allow-origin'] !== currentOrigin) {
          console.warn('⚠️ [CORS] El origen permitido no coincide con el actual')
          console.warn('   Permitido:', corsHeaders['access-control-allow-origin'])
          console.warn('   Actual:', currentOrigin)
        }
      }
      
    } catch (error) {
      fetchError = error
      console.error('❌ [Test Endpoint] Error al hacer la petición:')
      console.error('   Tipo de error:', error?.constructor?.name)
      console.error('   Error completo:', error)
      console.error('   Stack:', error instanceof Error ? error.stack : 'No disponible')
      
      if (error instanceof TypeError) {
        console.error('   Mensaje:', error.message)
        console.error('   Name:', error.name)
        
        if (error.message.includes('Failed to fetch')) {
          console.error('   🔴 ERROR DE CORS O RED:')
          console.error('   - El navegador no pudo completar la petición')
          console.error('   - Posibles causas:')
          console.error('     1. CORS no configurado en el backend')
          console.error('     2. El backend no responde a OPTIONS (preflight)')
          console.error('     3. El backend está bloqueando el origen:', currentOrigin)
          console.error('     4. Problema de red o el backend no está corriendo')
          console.error('   Solución: El backend debe configurar CORS para permitir:', currentOrigin)
        } else if (error.message.includes('NetworkError')) {
          console.error('   🔴 ERROR DE RED:')
          console.error('   - No se pudo conectar al backend')
          console.error('   - Verifica que el backend esté corriendo en puerto 3020')
        }
      } else if (error instanceof DOMException) {
        console.error('   🔴 ERROR DEL NAVEGADOR:')
        console.error('   - Tipo:', error.name)
        console.error('   - Mensaje:', error.message)
      }
      
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}\n\nRevisa la consola para más detalles.`)
      isTestingEndpoint.value = false
      return
    }

    if (!response.ok) {
      // Intentar leer el error de múltiples formas
      let errorText: string = ''
      let errorJson: any = null
      
      try {
        // Primero intentar como texto
        errorText = await response.text()
        console.error('   Error raw (texto):', errorText)
        
        // Intentar parsear como JSON
        if (errorText) {
          try {
            errorJson = JSON.parse(errorText)
            console.error('   Error parseado (JSON):', JSON.stringify(errorJson, null, 2))
          } catch {
            // No es JSON, está bien
            console.error('   Error no es JSON, es texto plano')
          }
        }
      } catch (e) {
        errorText = 'No se pudo leer el cuerpo de la respuesta'
        console.error('   Error al leer el cuerpo:', e)
      }
      
      console.error('❌ [Test Endpoint] Error en la respuesta:')
      console.error('   Status:', response.status)
      console.error('   Status Text:', response.statusText)
      console.error('   Response type:', response.type)
      console.error('   Response URL:', response.url)
      console.error('   Content-Type:', response.headers.get('content-type'))
      console.error('   Error raw:', errorText || '(vacío)')
      console.error('   Error JSON:', errorJson || '(no es JSON)')

      let errorData: any
      try {
        errorData = JSON.parse(errorText)
        console.error('   Error parseado:', JSON.stringify(errorData, null, 2))
      } catch {
        errorData = { message: errorText, raw: errorText }
      }

      // Análisis detallado según el código de estado
      if (response.status === 401) {
        console.error('')
        console.error('🔍 [Test Endpoint] ANÁLISIS DETALLADO - 401 Unauthorized:')
        console.error('')
        console.error('📋 CHECKLIST DE VERIFICACIÓN:')
        console.error('')
        console.error('1. CORS:')
        const allowOrigin = response.headers.get('access-control-allow-origin')
        console.error('   - Access-Control-Allow-Origin:', allowOrigin || '❌ NO PRESENTE')
        console.error('   - Origin actual:', currentOrigin)
        if (allowOrigin) {
          if (allowOrigin === '*' || allowOrigin === currentOrigin) {
            console.error('   ✅ CORS configurado correctamente')
          } else {
            console.error('   ❌ CORS permite otro origen:', allowOrigin)
            console.error('   ❌ Debe permitir:', currentOrigin)
          }
        } else {
          console.error('   ❌ CORS NO está configurado en el backend')
          console.error('   ❌ El backend debe responder con Access-Control-Allow-Origin')
        }
        console.error('')
        console.error('2. JWT Validation:')
        console.error('   - Token enviado:', cleanToken ? '✅ Presente' : '❌ Ausente')
        console.error('   - Token longitud:', cleanToken.length, 'caracteres')
        console.error('   - Token formato:', cleanToken.startsWith('eyJ') ? '✅ JWT válido' : '❌ Formato inválido')
        console.error('   - Header Authorization:', bearerToken.substring(0, 80) + '...')
        console.error('   - Backend debe tener SUPABASE_JWT_SECRET configurado')
        console.error('   - Backend debe validar con JwtStrategy')
        console.error('')
        console.error('3. Request Headers enviados:')
        console.error('   ', JSON.stringify(requestHeaders, null, 2))
        console.error('')
        console.error('4. Response Headers recibidos:')
        const allResponseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          allResponseHeaders[key] = value
        })
        console.error('   ', JSON.stringify(allResponseHeaders, null, 2))
        console.error('')
        console.error('5. Comparación con Postman:')
        console.error('   - Postman funciona: ✅')
        console.error('   - Frontend falla: ❌')
        console.error('   - Diferencia: Postman no tiene restricciones CORS')
        console.error('   - El navegador requiere CORS, Postman no')
        console.error('')
        console.error('💡 SOLUCIÓN:')
        console.error('   El backend debe configurar CORS para permitir:', currentOrigin)
        console.error('   Ejemplo en NestJS:')
        console.error('   app.enableCors({')
        console.error('     origin: "http://localhost:5173",')
        console.error('     credentials: true,')
        console.error('   })')
      } else if (response.status === 0) {
        console.error('🔴 ERROR: Status 0 indica que la petición fue bloqueada por CORS')
        console.error('   El navegador bloqueó la petición antes de llegar al servidor')
        console.error('   El backend no está respondiendo correctamente a OPTIONS (preflight)')
      } else if (response.status >= 500) {
        console.error('🔴 ERROR DEL SERVIDOR:', response.status)
        console.error('   El backend tiene un error interno')
        console.error('')
        console.error('📋 DIAGNÓSTICO DEL ERROR 500:')
        console.error('   1. El proxy de Vite está funcionando (CORS resuelto) ✅')
        console.error('   2. La petición llegó al backend ✅')
        console.error('   3. El backend está devolviendo un error 500 ❌')
        console.error('')
        console.error('💡 POSIBLES CAUSAS:')
        console.error('   - El backend no puede validar el JWT')
        console.error('   - El backend tiene un error en el endpoint')
        console.error('   - El backend no puede acceder a la base de datos')
        console.error('   - El backend tiene un error de configuración')
        console.error('')
        console.error('🔍 VERIFICAR EN EL BACKEND (puerto 3020):')
        console.error('   - Revisar los logs del servidor backend')
        console.error('   - Verificar que el endpoint existe y está configurado')
        console.error('   - Verificar que el JWT se está validando correctamente')
        console.error('   - Verificar que la base de datos está accesible')
        console.error('')
        console.error('📤 REQUEST ENVIADO AL BACKEND:')
        console.error('   URL:', endpoint)
        console.error('   Method: POST')
        console.error('   Headers:', JSON.stringify(requestHeaders, null, 2))
        console.error('   Body:', JSON.stringify(body, null, 2))
        console.error('')
        console.error('📥 RESPUESTA DEL BACKEND:')
        console.error('   Status:', response.status)
        console.error('   Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))
        console.error('   Body:', errorText || '(vacío)')
      }

      // Usar el mensaje de error más descriptivo disponible
      const errorMessage = errorJson?.message || errorJson?.error || errorData?.message || errorData?.msg || errorText || `Error ${response.status}: ${response.statusText}`
      alert(`Error ${response.status}: ${errorMessage}\n\nRevisa la consola para análisis detallado.`)
      return
    }

    const data = await response.json()
    console.log('✅ [Test Endpoint] Respuesta exitosa:')
    console.log('   Data:', JSON.stringify(data, null, 2))

    alert(`✅ Solicitud creada exitosamente!\n\n${JSON.stringify(data, null, 2)}`)
  } catch (error) {
    console.error('❌ [Test Endpoint] Error en la petición:', error)
    alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  } finally {
    isTestingEndpoint.value = false
  }
}
</script>

<style scoped>
.solicitudes-wrapper {
  padding-left: 12px;
}
</style>
