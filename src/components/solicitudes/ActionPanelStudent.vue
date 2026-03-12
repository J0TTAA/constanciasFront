<template>
  <!-- Panel cuando está firmado y listo para descargar -->
  <v-card v-if="request.status === RequestStatus.SIGNED" class="student-panel" elevation="8">
    <div class="panel-icon">
      <v-icon color="white" size="32">mdi-cloud-download</v-icon>
    </div>

    <div class="panel-content">
      <p class="panel-title">Documento Disponible</p>
      <p class="panel-subtitle">Tu constancia firmada está lista para descargar.</p>

      <v-btn 
        color="white" 
        class="panel-button" 
        prepend-icon="mdi-download" 
        :loading="isDownloading"
        :disabled="isDownloading"
        @click="onDownload"
      >
        Descargar Documento
      </v-btn>
    </div>
  </v-card>

  <!-- Mensaje cuando NO está lista -->
  <v-card v-else class="student-panel-waiting" elevation="8">
    <div class="panel-icon-waiting">
      <v-icon color="#4f6b5d" size="32">mdi-clock-outline</v-icon>
    </div>

    <div class="panel-content">
      <p class="panel-title-waiting">Documento en Proceso</p>
      <p class="panel-subtitle-waiting">
        Tu constancia aún no está lista para descargar. Estado actual: 
        <strong>{{ request.status }}</strong>
      </p>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getApiBaseUrl } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import { RequestStatus } from '@/types/requestTypes'
import type { Request } from '@/types/requestTypes'

const props = defineProps<{
  request: Request
}>()

const auth = useAuthStore()
const isDownloading = ref(false)

const onDownload = async () => {
  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  
  if (!tokenFromStore) {
    alert('No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.')
    return
  }

  isDownloading.value = true

  try {
    // Usar URL base normalizada (sin /api/v1 duplicado)
    const apiUrl = getApiBaseUrl()
    const isDevelopment = import.meta.env.DEV
    
    // En desarrollo, usar proxy de Vite. En producción, usar la URL completa desde variable de entorno
    // Para estudiantes, usamos idSolicitud (no documentId)
    const endpoint = isDevelopment
      ? `/api/v1/constancias/mis/documento/${props.request.id}/descargar`
      : `${apiUrl}/api/v1/constancias/mis/documento/${props.request.id}/descargar`
    
    console.log('📥 [Descarga Estudiante] Descargando documento firmado (DOCX)...')
    console.log('   Endpoint:', endpoint)

    // Limpiar el token de espacios
    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
      },
    })

    console.log('📥 [Descarga Estudiante] Respuesta recibida:')
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

      console.error('❌ [Descarga Estudiante] Error al descargar el documento:')
      console.error('   Status:', response.status)
      console.error('   Error:', JSON.stringify(errorData, null, 2))

      const errorMessage = errorData.message || errorData.msg || `Error ${response.status}: ${response.statusText}`
      alert(`Error al descargar el documento: ${errorMessage}`)
      return
    }

    // Obtener el Content-Type antes de crear el blob
    const contentType = response.headers.get('Content-Type') || ''
    console.log('   Content-Type:', contentType)

    // Crear un blob con la respuesta
    const blob = await response.blob()
    console.log('   Blob creado:', blob.type, blob.size, 'bytes')

    // Obtener el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition')
    let fileName = `constancia-firmada-${props.request.id}`
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (fileNameMatch && fileNameMatch[1]) {
        // Remover comillas si las hay y decodificar si está codificado
        fileName = fileNameMatch[1].replace(/['"]/g, '')
        // Decodificar si está en formato UTF-8 (filename*=UTF-8''...)
        if (fileName.startsWith("UTF-8''")) {
          fileName = decodeURIComponent(fileName.replace("UTF-8''", ''))
        }
        console.log('   Nombre de archivo del header:', fileName)
      }
    }
    
    // Si no hay nombre en el header o no tiene extensión, detectar desde Content-Type
    if (!fileName.includes('.')) {
      const finalContentType = contentType || blob.type
      if (finalContentType.includes('pdf') || finalContentType === 'application/pdf') {
        fileName += '.pdf'
      } else if (finalContentType.includes('wordprocessingml') || finalContentType.includes('msword') || finalContentType.includes('document')) {
        fileName += '.docx'
      } else {
        // Por defecto, usar PDF si el blob es PDF
        if (blob.type.includes('pdf')) {
          fileName += '.pdf'
        } else {
          fileName += '.pdf' // El backend devuelve PDF por defecto
        }
      }
    }

    console.log('   Nombre de archivo final:', fileName)

    // Crear un enlace temporal para descargar
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('✅ [Descarga Estudiante] Documento descargado exitosamente:', fileName)

  } catch (error) {
    console.error('❌ [Descarga Estudiante] Error al descargar el documento:', error)
    alert(`Error al descargar el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  } finally {
    isDownloading.value = false
  }
}
</script>

<style scoped>
.student-panel {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #1e5a3d, #123025);
  border-radius: 20px;
  color: white;
}

.panel-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-title {
  font-weight: 700;
  font-size: 18px;
  margin: 0;
}

.panel-subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.85;
}

.panel-button {
  align-self: flex-start;
  margin-top: 8px;
  text-transform: none;
  font-weight: 600;
  color: #1e5a3d;
}

.student-panel-waiting {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #f6faf7, #ffffff);
  border-radius: 20px;
  border: 1px solid rgba(30, 90, 61, 0.12);
}

.panel-icon-waiting {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(30, 90, 61, 0.1);
}

.panel-title-waiting {
  font-weight: 700;
  font-size: 18px;
  margin: 0;
  color: #123025;
}

.panel-subtitle-waiting {
  margin: 0;
  font-size: 14px;
  color: #4f6b5d;
  line-height: 1.5;
}

.panel-subtitle-waiting strong {
  color: #1e5a3d;
  font-weight: 600;
}
</style>
