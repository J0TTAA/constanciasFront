export const unwrapApiList = <T = any>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[]
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data
  }
  return []
}

export const parseApiError = async (response: Response, fallback: string): Promise<string> => {
  const text = await response.text().catch(() => '')
  if (!text) return fallback

  try {
    const json = JSON.parse(text)
    const message = json?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
    if (typeof json?.error === 'string') return json.error
  } catch {}

  return text
}

export const isValidRut = (value: string): boolean =>
  /^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$/.test(value.trim())

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export const isValidYear = (value: number): boolean =>
  Number.isInteger(value) && value >= 1900 && value <= 2100

export const isValidSemester = (value: number): boolean => value === 1 || value === 2

export const isValidGrade = (value: number): boolean =>
  Number.isFinite(value) && value >= 1 && value <= 7
