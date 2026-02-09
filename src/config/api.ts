/**
 * URL base del backend API.
 * Se normaliza quitando un posible sufijo /api/v1 para evitar duplicar el prefijo
 * al construir rutas como `${base}/api/v1/constancias/...`.
 *
 * Correcto: VITE_API_URL=http://srv-drrnn.ufro.cl
 * También válido (se normaliza): VITE_API_URL=http://srv-drrnn.ufro.cl/api/v1
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:3020'
  return raw.replace(/\/api\/v1\/?$/, '')
}
