<template>
  <v-card elevation="1" class="pa-6">
    <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
      <div>
        <h2 class="text-h6 font-weight-bold mb-1">Importación masiva (Excel)</h2>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Sube un archivo <strong>.xlsx</strong> o <strong>.xls</strong> para crear estudiantes.
        </p>
      </div>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-file-excel"
        :disabled="isDownloadingTemplate"
        :loading="isDownloadingTemplate"
        @click="downloadTemplate"
      >
        Descargar plantilla
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-file-input
      v-model="file"
      label="Archivo Excel"
      accept=".xlsx,.xls"
      prepend-icon="mdi-upload"
      variant="outlined"
      density="comfortable"
      :disabled="isSubmitting"
      :rules="[v => !!v || 'El archivo es requerido']"
      class="mb-4"
      show-size
    />

    <div class="d-flex gap-3 flex-wrap">
      <v-btn
        color="#1e5a3d"
        prepend-icon="mdi-play"
        :loading="isSubmitting"
        :disabled="!file || isSubmitting"
        @click="submit"
      >
        Procesar Excel
      </v-btn>
      <v-btn
        variant="text"
        :disabled="isSubmitting && !result"
        @click="reset"
      >
        Limpiar
      </v-btn>
    </div>

    <div v-if="result" class="mt-6">
      <v-alert type="success" variant="tonal" class="mb-4">
        Importación finalizada.
        <div class="mt-2 text-body-2">
          <strong>Total filas:</strong> {{ result?.resumen?.totalFilas ?? '-' }} |
          <strong>Creados:</strong> {{ result?.resumen?.creados ?? '-' }} |
          <strong>Con error:</strong> {{ result?.resumen?.conError ?? '-' }}
        </div>
      </v-alert>

      <v-expansion-panels multiple>
        <v-expansion-panel>
          <v-expansion-panel-title>Exitosos ({{ result?.exitosos?.length ?? 0 }})</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-data-table
              :headers="successHeaders"
              :items="result?.exitosos ?? []"
              :items-per-page="8"
              density="comfortable"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>Errores ({{ result?.errores?.length ?? 0 }})</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-data-table
              :headers="errorHeaders"
              :items="result?.errores ?? []"
              :items-per-page="8"
              density="comfortable"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getApiBaseUrl } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import type { VDataTable } from 'vuetify/components'

type ImportExcelResult = {
  resumen?: { totalFilas?: number; creados?: number; conError?: number }
  erroresPorCodigo?: Record<string, number>
  exitosos?: Array<{ fila?: number; email?: string; authUserId?: string; mensaje?: string }>
  errores?: Array<{ fila?: number; email?: string; code?: string; error?: string; sugerencia?: string }>
}

const auth = useAuthStore()
const file = ref<File | null>(null)
const isSubmitting = ref(false)
const isDownloadingTemplate = ref(false)
const error = ref<string | null>(null)
const result = ref<ImportExcelResult | null>(null)

const isDev = computed(() => import.meta.env.DEV || false)

const successHeaders: VDataTable['$props']['headers'] = [
  { title: 'FILA', key: 'fila', sortable: true },
  { title: 'EMAIL', key: 'email', sortable: true },
  { title: 'AUTH USER ID', key: 'authUserId', sortable: false },
  { title: 'MENSAJE', key: 'mensaje', sortable: false },
]

const errorHeaders: VDataTable['$props']['headers'] = [
  { title: 'FILA', key: 'fila', sortable: true },
  { title: 'EMAIL', key: 'email', sortable: true },
  { title: 'CÓDIGO', key: 'code', sortable: true },
  { title: 'ERROR', key: 'error', sortable: false },
  { title: 'SUGERENCIA', key: 'sugerencia', sortable: false },
]

const reset = () => {
  file.value = null
  result.value = null
  error.value = null
}

const submit = async () => {
  error.value = null
  result.value = null

  if (!file.value) {
    error.value = 'Selecciona un archivo Excel.'
    return
  }

  if (!auth.initialized) await auth.loadFromStorage()
  const token = auth.token?.trim().replace(/\s+/g, '')
  if (!token) {
    error.value = 'No hay token de autenticación disponible. Inicia sesión nuevamente.'
    return
  }

  isSubmitting.value = true
  try {
    const apiUrl = getApiBaseUrl()
    const endpoint = isDev.value
      ? '/api/v1/usuarios/admin/usuarios/importar-excel'
      : `${apiUrl}/api/v1/usuarios/admin/usuarios/importar-excel`

    const form = new FormData()
    form.append('file', file.value)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })

    const contentType = response.headers.get('Content-Type') || ''
    const text = await response.text()

    if (!response.ok) {
      let msg = text
      if (contentType.includes('application/json')) {
        try {
          const json = JSON.parse(text)
          msg = json?.message || json?.error || msg
        } catch {}
      }
      throw new Error(msg || `Error ${response.status}`)
    }

    result.value = contentType.includes('application/json') ? (JSON.parse(text) as ImportExcelResult) : null
    if (!result.value) throw new Error('El backend no devolvió JSON con el resumen de importación.')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al importar Excel'
  } finally {
    isSubmitting.value = false
  }
}

const downloadTemplate = async () => {
  error.value = null
  if (!auth.initialized) await auth.loadFromStorage()
  const token = auth.token?.trim().replace(/\s+/g, '')
  if (!token) {
    error.value = 'No hay token de autenticación disponible. Inicia sesión nuevamente.'
    return
  }

  isDownloadingTemplate.value = true
  try {
    const apiUrl = getApiBaseUrl()
    const endpoint = isDev.value
      ? '/api/v1/usuarios/admin/usuarios/template-excel-prueba'
      : `${apiUrl}/api/v1/usuarios/admin/usuarios/template-excel-prueba`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `Error ${response.status}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template-carga-masiva-usuarios.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al descargar plantilla'
  } finally {
    isDownloadingTemplate.value = false
  }
}
</script>
