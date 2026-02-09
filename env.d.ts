/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_URL: string // URL base del backend (sin /api/v1); ej: http://srv-drrnn.ufro.cl
  readonly VITE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
