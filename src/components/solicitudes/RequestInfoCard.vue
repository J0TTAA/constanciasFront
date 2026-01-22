<template>
  <div class="info-card">
    <div class="info-card__header">
      <div>
        <p class="info-card__id">{{ request.id }}</p>
        <h2 class="info-card__title">{{ request.type }}</h2>
      </div>
      <StatusBadge :status="request.status" />
    </div>

    <div class="info-card__meta">
      <div class="info-card__meta-item">
        <span class="label">Estudiante</span>
        <span class="value">{{ request.studentName }}</span>
      </div>
      <div class="info-card__meta-item">
        <span class="label">Fecha Solicitud</span>
        <span class="value">{{ formatDate(request.requestDate) }}</span>
      </div>
      <div class="info-card__meta-item">
        <span class="label">Última Actualización</span>
        <span class="value">{{ formatDate(request.lastUpdateDate) }}</span>
      </div>
    </div>

    <div class="info-card__observations">
      <span class="label">Observación del Estudiante</span>
      <p class="blockquote">
        {{ request.observations }}
      </p>
    </div>

    <!-- Botones para ver y descargar documento (solo para secretaria y director) -->
    <div v-if="canViewDocument" class="info-card__document">
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-file-pdf-box"
        :loading="isLoadingDocument"
        :disabled="isLoadingDocument"
        @click="handleViewDocument"
        block
        class="mb-2"
      >
        {{ showPdfViewer ? 'Ocultar Previsualización' : 'Ver Previsualización (PDF)' }}
      </v-btn>
      <v-btn
        color="secondary"
        variant="outlined"
        prepend-icon="mdi-download"
        :loading="isDownloadingDocument"
        :disabled="isDownloadingDocument"
        @click="handleDownloadOriginal"
        block
      >
        Descargar Original (DOCX)
      </v-btn>
    </div>

    <!-- Visualizador de PDF directamente en la página (sin modal) -->
    <div v-if="showPdfViewer" class="info-card__pdf-viewer mt-4">
      <div class="pdf-viewer-header d-flex justify-space-between align-center pa-3" style="background: #f5f5f5; border-radius: 8px 8px 0 0;">
        <span class="font-weight-bold">
          Previsualización {{ isDocx ? 'DOCX' : 'PDF' }} - Solicitud {{ request.id }}
        </span>
        <div class="d-flex gap-2">
          <v-btn
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-file-word"
            size="small"
            @click="handleDownloadOriginal"
            :loading="isDownloadingDocument"
            :disabled="isDownloadingDocument"
          >
            Descargar DOCX
          </v-btn>
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-download"
            size="small"
            @click="downloadDocument"
          >
            Descargar PDF
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            @click="closePdfViewer"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
      
      <div class="pdf-viewer-content" style="border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; min-height: 600px; position: relative;">
        <div v-if="isLoadingDocument" class="d-flex align-center justify-center" style="height: 600px;">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <div v-else-if="documentError" class="pa-4">
          <v-alert type="error" variant="tonal" prominent>
            <v-alert-title>Error al cargar el documento</v-alert-title>
            {{ documentError }}
            <div class="mt-2">
              <v-btn
                color="error"
                variant="outlined"
                size="small"
                @click="handleViewDocument"
              >
                Reintentar
              </v-btn>
            </div>
          </v-alert>
        </div>
        <!-- Contenedor para DOCX - siempre presente pero oculto cuando no se usa -->
        <div
          v-show="isDocx && !isLoadingDocument && !documentError"
          ref="docxContainer"
          class="docx-container"
          style="padding: 20px; background: white; min-height: 600px; overflow-y: auto;"
        ></div>
        <!-- Visualización de PDF con iframe -->
        <iframe
          v-if="documentUrl && !isDocx && !isLoadingDocument && !documentError"
          :src="documentUrl"
          style="width: 100%; height: 600px; border: none; display: block;"
          title="Previsualización PDF de la solicitud"
        ></iframe>
        <!-- Fallback si no hay nada que mostrar -->
        <div v-if="!isLoadingDocument && !documentError && !isDocx && !documentUrl" class="d-flex align-center justify-center" style="height: 600px;">
          <p class="text-medium-emphasis">No hay documento disponible para mostrar</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { UserRole } from '@/types/requestTypes'
import type { Request } from '@/types/requestTypes'
import StatusBadge from './StatusBadge.vue'
import { renderAsync } from 'docx-preview'

const props = defineProps<{
  request: Request
}>()

const auth = useAuthStore()

const showPdfViewer = ref(false)
const isLoadingDocument = ref(false)
const isDownloadingDocument = ref(false)
const documentError = ref<string | null>(null)
const documentUrl = ref<string | null>(null)
const documentBlob = ref<Blob | null>(null)
const documentContentType = ref<string | null>(null)
const docxContainer = ref<HTMLDivElement | null>(null)
const isDocx = ref(false)

// Verificar si el usuario puede ver documentos (secretaria o director)
const canViewDocument = computed(() => {
  const userRole = auth.user?.role
  return userRole === UserRole.SECRETARY || userRole === UserRole.DIRECTOR || userRole === UserRole.ADMIN
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-CL')
}

const handleViewDocument = async () => {
  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  
  if (!tokenFromStore) {
    documentError.value = 'No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.'
    showPdfViewer.value = true
    return
  }

  // Si ya está mostrando el PDF, ocultarlo. Si no, mostrarlo y cargar
  if (showPdfViewer.value) {
    closePdfViewer()
    return
  }

  showPdfViewer.value = true
  isLoadingDocument.value = true
  documentError.value = null
  documentUrl.value = null

  try {
    // Usar variable de entorno para la URL del backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3020'
    const isDevelopment = import.meta.env.DEV
    
    // 📋 Logs de configuración del backend API
    console.log('🔌 [Ver Documento] Configuración del Backend API:')
    console.log('   - VITE_API_URL:', apiUrl)
    console.log('   - Modo:', isDevelopment ? 'Desarrollo (con proxy)' : 'Producción (URL completa)')
    console.log('   - ID Solicitud:', props.request.id)
    
    // En desarrollo, usar proxy de Vite. En producción, usar la URL completa desde variable de entorno
    const endpoint = isDevelopment
      ? `/api/v1/constancias/documento/${props.request.id}/previsualizar`
      : `${apiUrl}/api/v1/constancias/documento/${props.request.id}/previsualizar`
    
    console.log('   - Endpoint relativo:', `/api/v1/constancias/documento/${props.request.id}/previsualizar`)
    console.log('   - Endpoint completo:', endpoint)
    console.log('   - URL final que se usará:', isDevelopment ? `http://localhost:3000${endpoint} (proxy → ${apiUrl}${endpoint})` : endpoint)
    
    console.log('📄 [Documento] Obteniendo previsualización PDF del backend...')
    console.log('   Endpoint:', endpoint)
    console.log('   ID Solicitud:', props.request.id)

    // Limpiar el token de espacios
    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
      },
    })

    console.log('📄 [Documento] Respuesta recibida:')
    console.log('   Status:', response.status, response.statusText)
    console.log('   OK:', response.ok)
    console.log('   Content-Type:', response.headers.get('content-type'))

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

      console.error('❌ [Documento] Error al obtener el documento:')
      console.error('   Status:', response.status)
      console.error('   Error:', JSON.stringify(errorData, null, 2))

      const errorMessage = errorData.message || errorData.msg || `Error ${response.status}: ${response.statusText}`
      documentError.value = `Error al cargar el documento: ${errorMessage}`
      return
    }

    // Obtener el tipo de contenido para determinar cómo mostrar el documento
    const contentType = response.headers.get('content-type') || ''
    console.log('   Content-Type del header:', contentType)

    // Crear un blob con la respuesta
    const blob = await response.blob()
    console.log('   Blob creado:')
    console.log('     - Tipo del blob:', blob.type)
    console.log('     - Tamaño:', blob.size, 'bytes')
    
    // Intentar detectar el tipo de archivo por los primeros bytes (magic numbers)
    const arrayBuffer = await blob.slice(0, 4).arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const magicBytes = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' ')
    console.log('     - Primeros bytes (hex):', magicBytes)
    
    // Detectar PDF por magic number: %PDF (25 50 44 46)
    const isPdfByMagic = uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && uint8Array[2] === 0x44 && uint8Array[3] === 0x46
    
    // Detectar DOCX por magic number: PK (50 4B) - DOCX es un archivo ZIP
    const isDocxByMagic = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B
    
    console.log('     - ¿Es PDF por magic number?', isPdfByMagic)
    console.log('     - ¿Es DOCX por magic number?', isDocxByMagic)

    // Usar el Content-Type del header, o el tipo del blob, o detectar por magic number
    let finalContentType = contentType
    if (!finalContentType || finalContentType === 'application/octet-stream') {
      finalContentType = blob.type || ''
    }
    
    // Detectar y forzar el tipo según magic number
    if (isPdfByMagic && !finalContentType.includes('pdf')) {
      finalContentType = 'application/pdf'
      console.log('     - Tipo forzado a PDF por magic number')
    } else if (isDocxByMagic && !finalContentType.includes('wordprocessingml') && !finalContentType.includes('msword')) {
      finalContentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      console.log('     - Tipo forzado a DOCX por magic number')
    }

    console.log('   Content-Type final:', finalContentType)

    // Determinar si es DOCX ANTES de guardar el blob
    const contentTypeLower = finalContentType.toLowerCase()
    isDocx.value = contentTypeLower.includes('wordprocessingml') || 
                   contentTypeLower.includes('msword') || 
                   isDocxByMagic
    
    console.log('   isDocx establecido a:', isDocx.value)

    // Guardar el blob y establecer isDocx ANTES de intentar renderizar
    documentBlob.value = blob
    documentContentType.value = finalContentType
    
    if (isDocx.value) {
      // Si es DOCX, renderizarlo con docx-preview
      console.log('📄 [Documento] Renderizando DOCX con docx-preview...')
      console.log('   Blob size:', blob.size, 'bytes')
      console.log('   Blob type:', blob.type)
      console.log('   isDocx.value:', isDocx.value)
      console.log('   showPdfViewer.value:', showPdfViewer.value)
      
      // Esperar a que Vue actualice el DOM con el contenedor visible
      await nextTick()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 200)) // Esperar más tiempo
      
      // Intentar obtener el contenedor
      let container = docxContainer.value
      let attempts = 0
      const maxAttempts = 30
      
      console.log('   Buscando contenedor...')
      console.log('   Contenedor en primer intento:', !!container)
      
      while (!container && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 50))
        container = docxContainer.value
        attempts++
        if (attempts % 5 === 0 || attempts === 1) {
          console.log(`   Intento ${attempts}/${maxAttempts}: contenedor encontrado:`, !!container)
          // También intentar buscar el contenedor en el DOM directamente
          if (!container) {
            const domContainer = document.querySelector('.docx-container')
            console.log('   Contenedor en DOM:', !!domContainer)
            if (domContainer) {
              // Asignar el contenedor encontrado en el DOM
              container = domContainer as HTMLDivElement
              docxContainer.value = container
              console.log('   ✅ Contenedor encontrado en DOM y asignado')
            }
          }
        }
      }
      
      if (container) {
        try {
          console.log('   ✅ Contenedor encontrado después de', attempts, 'intentos')
          console.log('   Limpiando contenedor...')
          container.innerHTML = ''
          
          console.log('   Iniciando renderizado de DOCX...')
          // Renderizar el DOCX
          await renderAsync(blob, container, undefined, {
            className: 'docx-wrapper',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: false,
            trimXmlDeclaration: true,
            useBase64URL: false,
            useMathMLPolyfill: true,
            showChanges: false,
            showInsertions: false,
            showDeletions: false,
          })
          
          console.log('✅ [Documento] DOCX renderizado exitosamente')
          const previewContent = container.innerHTML.substring(0, 200)
          console.log('   Contenedor después del renderizado (primeros 200 chars):', previewContent)
          console.log('   Longitud total del contenido:', container.innerHTML.length)
        } catch (renderError) {
          console.error('❌ [Documento] Error al renderizar DOCX:', renderError)
          console.error('   Error completo:', renderError)
          if (renderError instanceof Error) {
            console.error('   Stack:', renderError.stack)
          }
          documentError.value = `Error al renderizar el documento: ${renderError instanceof Error ? renderError.message : 'Error desconocido'}`
        }
      } else {
        console.error('❌ [Documento] No se pudo encontrar el contenedor para renderizar DOCX después de', maxAttempts, 'intentos')
        console.error('   Estado actual:')
        console.error('     - isDocx.value:', isDocx.value)
        console.error('     - documentBlob.value:', documentBlob.value ? 'Presente' : 'No presente')
        console.error('     - showPdfViewer.value:', showPdfViewer.value)
        console.error('     - docxContainer.value:', docxContainer.value)
        // Intentar buscar en el DOM como último recurso
        const domContainer = document.querySelector('.docx-container') as HTMLDivElement
        console.error('     - Contenedor en DOM:', !!domContainer)
        if (domContainer) {
          console.log('   ⚠️ Contenedor encontrado en DOM, intentando renderizar...')
          try {
            domContainer.innerHTML = ''
            await renderAsync(blob, domContainer, undefined, {
              className: 'docx-wrapper',
              inWrapper: true,
            })
            console.log('✅ [Documento] DOCX renderizado usando contenedor del DOM')
            docxContainer.value = domContainer
          } catch (domError) {
            console.error('❌ Error al renderizar usando contenedor del DOM:', domError)
            documentError.value = `Error al renderizar el documento: ${domError instanceof Error ? domError.message : 'Error desconocido'}`
          }
        } else {
          documentError.value = 'Error: No se pudo encontrar el contenedor para mostrar el documento. Por favor, intenta recargar la página.'
        }
      }
    } else {
      // Si es PDF, crear una URL temporal para el blob
      const blobUrl = URL.createObjectURL(blob)
      documentUrl.value = blobUrl
      console.log('✅ [Documento] Previsualización PDF cargada exitosamente')
    }

    console.log('   Tipo detectado:', finalContentType)
    console.log('   ¿Es DOCX?', isDocx.value)
    console.log('   ¿Se mostrará como PDF?', !isDocx.value && (finalContentType.includes('pdf') || isPdfByMagic))

  } catch (error) {
    console.error('❌ [Documento] Error al obtener el documento:', error)
    console.error('   Error completo:', error)
    if (error instanceof Error) {
      console.error('   Stack:', error.stack)
    }
    documentError.value = `Error al cargar el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`
  } finally {
    isLoadingDocument.value = false
    console.log('✅ [Documento] Proceso de carga finalizado')
    console.log('   Estado final:')
    console.log('     - isDocx:', isDocx.value)
    console.log('     - documentUrl:', documentUrl.value ? 'Presente' : 'No presente')
    console.log('     - docxContainer:', docxContainer.value ? 'Presente' : 'No presente')
    console.log('     - documentError:', documentError.value || 'Sin errores')
    console.log('     - showPdfViewer:', showPdfViewer.value)
  }
}

// Computed para determinar el tipo de documento
const isPdf = computed(() => {
  if (!documentContentType.value) return false
  const contentType = documentContentType.value.toLowerCase()
  return contentType.includes('pdf') || contentType.includes('application/pdf')
})

const isImage = computed(() => {
  if (!documentContentType.value) return false
  const contentType = documentContentType.value.toLowerCase()
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
  return imageTypes.some(type => contentType.includes(type))
})

const isWord = computed(() => {
  if (!documentContentType.value) return false
  const contentType = documentContentType.value.toLowerCase()
  return contentType.includes('wordprocessingml') || 
         contentType.includes('msword') || 
         contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
})

const getDocumentTypeName = computed(() => {
  if (isPdf.value) return 'PDF'
  if (isImage.value) return 'Imagen'
  if (isWord.value) return 'Documento Word (.docx)'
  return 'Archivo'
})

// Computed para mostrar información de debug (temporal)
const documentTypeInfo = computed(() => {
  return {
    contentType: documentContentType.value || 'No detectado',
    isPdf: isPdf.value,
    isImage: isImage.value,
    isWord: isWord.value,
    blobType: documentBlob.value?.type || 'N/A',
    blobSize: documentBlob.value?.size || 0,
    typeName: getDocumentTypeName.value,
  }
})

const downloadDocument = () => {
  if (!documentBlob.value) return

  // Crear un enlace temporal para descargar
  const url = URL.createObjectURL(documentBlob.value)
  const link = document.createElement('a')
  link.href = url
  
  // Determinar la extensión del archivo basado en el content-type
  let extension = '.pdf'
  const contentType = (documentContentType.value || '').toLowerCase()
  
  if (contentType.includes('pdf')) {
    extension = '.pdf'
  } else if (contentType.includes('wordprocessingml') || contentType.includes('msword')) {
    // Archivos Word
    if (contentType.includes('openxmlformats')) {
      extension = '.docx'
    } else {
      extension = '.doc'
    }
  } else if (contentType.includes('image')) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = '.jpg'
    } else if (contentType.includes('png')) {
      extension = '.png'
    } else if (contentType.includes('gif')) {
      extension = '.gif'
    } else if (contentType.includes('webp')) {
      extension = '.webp'
    } else if (contentType.includes('bmp')) {
      extension = '.bmp'
    }
  } else if (contentType.includes('excel') || contentType.includes('spreadsheetml')) {
    extension = '.xlsx'
  } else if (contentType.includes('powerpoint') || contentType.includes('presentationml')) {
    extension = '.pptx'
  }
  
  link.download = `solicitud-${props.request.id}${extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  console.log('📥 [Documento] Descarga iniciada')
}

// Función para descargar el documento original (DOCX)
const handleDownloadOriginal = async () => {
  // Verificar que el store esté inicializado
  if (!auth.initialized) {
    await auth.loadFromStorage()
  }

  const tokenFromStore = auth.token
  
  if (!tokenFromStore) {
    alert('No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.')
    return
  }

  isDownloadingDocument.value = true

  try {
    // Usar variable de entorno para la URL del backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3020'
    const isDevelopment = import.meta.env.DEV
    
    // 📋 Logs de configuración del backend API
    console.log('🔌 [Descargar Documento] Configuración del Backend API:')
    console.log('   - VITE_API_URL:', apiUrl)
    console.log('   - Modo:', isDevelopment ? 'Desarrollo (con proxy)' : 'Producción (URL completa)')
    console.log('   - ID Solicitud:', props.request.id)
    
    // En desarrollo, usar proxy de Vite. En producción, usar la URL completa desde variable de entorno
    const endpoint = isDevelopment
      ? `/api/v1/constancias/documento/${props.request.id}/descargar`
      : `${apiUrl}/api/v1/constancias/documento/${props.request.id}/descargar`
    
    console.log('📥 [Descarga] Descargando documento original (DOCX)...')
    console.log('   - Endpoint relativo:', `/api/v1/constancias/documento/${props.request.id}/descargar`)
    console.log('   - Endpoint completo:', endpoint)
    console.log('   - URL final que se usará:', isDevelopment ? `http://localhost:3000${endpoint} (proxy → ${apiUrl}${endpoint})` : endpoint)

    // Limpiar el token de espacios
    const cleanToken = tokenFromStore.trim().replace(/\s+/g, '')

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
      },
    })

    console.log('📥 [Descarga] Respuesta recibida:')
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

      console.error('❌ [Descarga] Error al descargar el documento:')
      console.error('   Status:', response.status)
      console.error('   Error:', JSON.stringify(errorData, null, 2))

      const errorMessage = errorData.message || errorData.msg || `Error ${response.status}: ${response.statusText}`
      alert(`Error al descargar el documento: ${errorMessage}`)
      return
    }

    // Crear un blob con la respuesta
    const blob = await response.blob()
    console.log('   Blob creado:', blob.type, blob.size, 'bytes')

    // Crear un enlace temporal para descargar
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `solicitud-${props.request.id}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('✅ [Descarga] Documento DOCX descargado exitosamente')

  } catch (error) {
    console.error('❌ [Descarga] Error al descargar el documento:', error)
    alert(`Error al descargar el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  } finally {
    isDownloadingDocument.value = false
  }
}

const closePdfViewer = () => {
  showPdfViewer.value = false
  // Limpiar el contenedor de DOCX
  if (docxContainer.value) {
    docxContainer.value.innerHTML = ''
  }
  // Limpiar la URL del blob cuando se cierra el visor para liberar memoria
  if (documentUrl.value) {
    URL.revokeObjectURL(documentUrl.value)
    documentUrl.value = null
  }
  documentBlob.value = null
  documentContentType.value = null
  documentError.value = null
  isDocx.value = false
}

// Limpiar al desmontar el componente
onUnmounted(() => {
  closePdfViewer()
})
</script>

<style scoped>
.info-card {
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfc 100%);
  border-radius: 20px;
  padding: 32px;
  box-shadow:
    0 20px 45px rgba(18, 46, 38, 0.08),
    0 8px 18px rgba(18, 46, 38, 0.05);
  border: 1px solid rgba(23, 82, 53, 0.08);
}

.info-card__header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.info-card__id {
  font-size: 14px;
  font-weight: 600;
  color: #1e5a3d;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.info-card__title {
  font-size: 28px;
  line-height: 1.3;
  font-weight: 700;
  color: #123025;
  margin-top: 4px;
}

.info-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

.info-card__meta-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: #6a7c72;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #123025;
}

.info-card__observations {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.blockquote {
  background: rgba(30, 90, 61, 0.07);
  border-left: 4px solid #1e5a3d;
  padding: 16px 20px;
  border-radius: 12px;
  color: #1f4134;
  font-style: italic;
  line-height: 1.5;
}

.info-card__document {
  margin-top: 24px;
}

.info-card__pdf-viewer {
  margin-top: 24px;
}

.pdf-viewer-content {
  background: #fafafa;
}

/* Estilos para docx-preview */
.docx-container :deep(.docx-wrapper) {
  background: white;
  padding: 40px;
  max-width: 816px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.docx-container :deep(.docx-wrapper > section) {
  margin-bottom: 20px;
}

.docx-container :deep(p) {
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.docx-container :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 20px 0;
}

.docx-container :deep(table td),
.docx-container :deep(table th) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
</style>
