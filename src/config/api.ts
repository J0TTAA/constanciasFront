/**
 * URL base del backend API (origen del servidor, sin paths).
 * - Quita cualquier sufijo /api/v1 para evitar duplicar el prefijo en producción.
 * - Si VITE_API_URL no está definida, en producción se deriva desde VITE_SUPABASE_URL
 *   (mismo origen: ej. http://srv-drrnn.ufro.cl/supabase → http://srv-drrnn.ufro.cl).
 *
 * Correcto: VITE_API_URL=http://srv-drrnn.ufro.cl
 * También válido (se normaliza): VITE_API_URL=http://srv-drrnn.ufro.cl/api/v1
 */
export function getApiBaseUrl(): string {
  let raw =
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
    ''

  // En producción, si no hay VITE_API_URL, usar el origen de VITE_SUPABASE_URL (ej. mismo servidor)
  if (!raw && import.meta.env.PROD) {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
    if (supabaseUrl) {
      try {
        const u = new URL(supabaseUrl)
        raw = u.origin
      } catch {
        raw = ''
      }
    }
  }

  if (!raw) {
    raw = 'http://localhost:3020'
  }

  // Quitar /api/v1 o /api/v1/ al final para evitar duplicado al construir rutas
  let base = raw.replace(/\/api\/v1\/?$/i, '')
  // Quitar barras finales para que `${base}/api/v1/...` no tenga doble barra
  base = base.replace(/\/+$/, '')
  return base
}
