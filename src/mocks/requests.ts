import { RequestStatus } from '@/types/requestTypes'
import type { Request } from '@/types/requestTypes'

const toIso = (date: string) => new Date(date).toISOString()

export const mockRequests: Request[] = [
  {
    id: 'RRNN-24001',
    type: 'Constancia Alumno Regular',
    studentName: 'Ana Contreras',
    studentId: '20.123.456-7',
    requestDate: toIso('2024-07-15T09:40:00'),
    lastUpdateDate: toIso('2024-07-19T13:15:00'),
    status: RequestStatus.SIGNED,
    observations: 'Necesito constancia actualizada para renovación de beca.',
    history: [
      {
        id: 'RRNN-24001-1',
        date: toIso('2024-07-15T09:40:00'),
        user: 'Ana Contreras',
        status: RequestStatus.REQUESTED,
        observation: 'Solicitud creada por estudiante.',
      },
      {
        id: 'RRNN-24001-2',
        date: toIso('2024-07-16T11:05:00'),
        user: 'Secretaría Programa',
        status: RequestStatus.IN_REVIEW,
        observation: 'Antecedentes revisados y en evaluación.',
      },
      {
        id: 'RRNN-24001-3',
        date: toIso('2024-07-18T16:20:00'),
        user: 'Director Programa',
        status: RequestStatus.AWAITING_SIGNATURE,
        observation: 'Documento enviado para firma del director.',
      },
      {
        id: 'RRNN-24001-4',
        date: toIso('2024-07-19T13:15:00'),
        user: 'Director Programa',
        status: RequestStatus.SIGNED,
        observation: 'Documento firmado y disponible para descarga.',
      },
    ],
    fileUrl: '/docs/RRNN-24001.pdf',
  },
  {
    id: 'RRNN-24003',
    type: 'Constancia Asignaturas Inscritas',
    studentName: 'Ana Contreras',
    studentId: '20.123.456-7',
    requestDate: toIso('2024-07-20T10:10:00'),
    lastUpdateDate: toIso('2024-07-22T09:00:00'),
    status: RequestStatus.IN_REVIEW,
    observations: 'Requiero constancia de mis asignaturas actuales.',
    history: [
      {
        id: 'RRNN-24003-1',
        date: toIso('2024-07-20T10:10:00'),
        user: 'Ana Contreras',
        status: RequestStatus.REQUESTED,
        observation: 'Solicitud creada por estudiante.',
      },
      {
        id: 'RRNN-24003-2',
        date: toIso('2024-07-21T08:30:00'),
        user: 'Secretaría Programa',
        status: RequestStatus.IN_REVIEW,
        observation: 'Solicitud en análisis por secretaría.',
      },
    ],
  },
  {
    id: 'RRNN-24004',
    type: 'Rendición Examen Calificación',
    studentName: 'Carlos Díaz',
    studentId: '19.987.654-3',
    requestDate: toIso('2024-07-22T11:45:00'),
    lastUpdateDate: toIso('2024-07-22T11:45:00'),
    status: RequestStatus.REQUESTED,
    observations: 'Solicito constancia para inscripción a examen.',
    history: [
      {
        id: 'RRNN-24004-1',
        date: toIso('2024-07-22T11:45:00'),
        user: 'Carlos Díaz',
        status: RequestStatus.REQUESTED,
        observation: 'Solicitud creada por estudiante.',
      },
    ],
  },
]

