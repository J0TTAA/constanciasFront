// Basado en tu código de React, estos son los tipos que usas.
// Puedes ya tenerlos en otro lugar.

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export enum UserRole {
  STUDENT = 'Estudiante',
  SECRETARY = 'Secretaria',
  DIRECTOR = 'Director',
  ADMIN = 'Administrador',
}

export enum RequestStatus {
  REQUESTED = 'Solicitado',
  IN_REVIEW = 'En Revisión',
  AWAITING_SIGNATURE = 'Para Firma',
  SIGNED = 'Firmado y Disponible',
  REJECTED = 'Rechazado',
}

export interface RequestHistory {
  id: string
  date: string
  user: string
  status: RequestStatus
  observation: string
}

export interface Request {
  id: string
  type: string
  studentName: string
  studentId: string
  requestDate: string
  lastUpdateDate: string
  status: RequestStatus
  observations: string // Observación del estudiante
  history: RequestHistory[]
  fileUrl?: string
}
