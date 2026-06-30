# Contratos de API Backend

Fecha de referencia: 2026-06-24  
Base URL local por defecto: `http://localhost:3020/api/v1`

Este documento describe los contratos disponibles para configurar el frontend.

## Cambios Recientes Relevantes Para Frontend

- `GET /notas` ahora responde paginado: `{ data, total, page, limit, totalPages }`.
- `GET /examenes` ahora responde paginado: `{ data, total, page, limit, totalPages }`.
- `GET /alumnos/:rut/asignaturas` y `GET /alumnos/usuario/:auth0UserId/asignaturas` incluyen `idNota`, necesario para borrar desde la lista de asignaturas.
- `DELETE /alumnos/:rut/notas/:id` y `DELETE /notas/:id` ahora eliminan/desasignan el registro, no solo dejan `nota = null`.
- CORS se configura con `FRONTEND_ORIGINS`, separado por comas. Default: `http://localhost:5173`.
- Rate limit global: default `120` solicitudes por `60s` por IP + método + ruta. Configurable con `RATE_LIMIT_MAX` y `RATE_LIMIT_TTL_MS`.

## Convenciones Globales

### Autenticación

La mayoría de endpoints protegidos usan:

```http
Authorization: Bearer <access_token>
```

Roles usados por guards:

- `estudiante`
- `secretaria`
- `director`
- `admin`

### Paginación

Endpoints paginados usan:

```http
?page=1&limit=10
```

Límites:

- `page`: entero mínimo `1`
- `limit`: entero mínimo `1`, máximo `100`

Respuesta paginada:

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "totalPages": 0
}
```

### Errores

Formato global:

```json
{
  "statusCode": 400,
  "timestamp": "2026-06-24T00:00:00.000Z",
  "path": "/api/v1/recurso",
  "method": "POST",
  "message": "Detalle del error"
}
```

Rate limit:

```json
{
  "statusCode": 429,
  "timestamp": "2026-06-24T00:00:00.000Z",
  "path": "/api/v1/recurso",
  "method": "GET",
  "message": {
    "message": "Demasiadas solicitudes. Intenta nuevamente más tarde.",
    "retryAfterSeconds": 30
  }
}
```

### Validación

El backend usa `ValidationPipe` global con:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `forbidUnknownValues: true`
- `transform: true`
- `enableImplicitConversion: true`

El frontend debe evitar enviar propiedades extra fuera de cada DTO.

## DTOs Base

### `PaginationDto`

```ts
{
  page?: number;  // default 1
  limit?: number; // default 10, max 100
}
```

### `CreateAlumnoDto`

```ts
{
  rut: string;
  auth0UserId: string;
  nroMatricula: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  fechaIngreso: string; // ISO date
  fechaTermino?: string; // ISO date
}
```

### `CreateAsignaturaDto`

```ts
{
  codAsignatura: string;
  nombreAsignatura: string;
  nivel?: string;
}
```

### `CreateNotaDto`

Para endpoint global `/notas`:

```ts
{
  nroMatricula: string;
  codAsignatura: string;
  anhoCursada: number;
  semestreCursada: number;
  nota?: number | null; // 1.0 a 7.0
}
```

Para endpoint agrupado `/alumnos/:rut/notas`, `nroMatricula` se resuelve por `rut`, pero el DTO actual lo declara. Recomendación frontend: enviar al menos:

```ts
{
  codAsignatura: string;
  anhoCursada: number;
  semestreCursada: number;
  nota?: number | null;
}
```

### `CreateExamenDto`

Para endpoint global `/examenes`:

```ts
{
  nroMatricula: string;
  fechaExamen: string; // ISO date
  notaExamen: number; // 1.0 a 7.0
}
```

Para endpoint agrupado `/alumnos/:rut/examenes`, `nroMatricula` se resuelve por `rut`, pero el DTO actual lo declara. Recomendación frontend: enviar:

```ts
{
  fechaExamen: string;
  notaExamen: number;
}
```

### `AsignarAsignaturaDto`

```ts
{
  codAsignatura: string;
  anhoCursada?: number;
  semestreCursada?: number;
  nota?: number; // 1.0 a 7.0
}
```

### `AsignarVariasAsignaturasDto`

```ts
{
  asignaturas: AsignarAsignaturaDto[];
}
```

### `AsignarAsignaturasMasivoDto`

```ts
{
  ruts: string[];
  asignaturas: AsignarAsignaturaDto[];
}
```

### `AsignarAsignaturasMasivoPorUsuarioDto`

```ts
{
  auth0UserIds: string[];
  asignaturas: AsignarAsignaturaDto[];
}
```

### `SolicitarConstanciaDto`

Debe venir `idTipoConstancia` o `nombreTipoConstancia`.

```ts
{
  idTipoConstancia?: number;
  nombreTipoConstancia?: string;
  observacionAlumno?: string;
  titulo1?: string;
  titulo2?: string;
  titulo3?: string;
  titulo4?: string;
  titulo5?: string;
  semestre?: string;
  proposito?: string;
}
```

### `CambiarEstadoDto`

```ts
{
  nombreEstado: string;
  detalle?: string;
}
```

### `LoginDto`

```ts
{
  email: string;
  password: string;
}
```

### `CreateUsuarioDto`

```ts
{
  auth0UserId: string;
  rut: string;
  idRol: number;
  email: string;
  activo?: boolean;
}
```

### `CreateUsuarioSupabaseDto`

```ts
{
  email: string;
  password: string;
  rut: string;
  idRol: number;
  primerNombre: string;
  segundoNombre?: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  activo?: boolean;
  emailConfirm?: boolean;
}
```

### `CreateUsuarioAdminDto`

Usado por `POST /usuarios/admin/crear`.

```ts
{
  email: string;
  password: string;
  rut: string;
  id_rol: number;
  primer_nombre: string;
  segundo_nombre?: string;
  apellido_paterno: string;
  apellido_materno?: string;
  activo?: boolean;
  nro_matricula?: string; // obligatorio si id_rol === 1
  fecha_ingreso?: string; // obligatorio si id_rol === 1
  fecha_termino?: string;
}
```

## Endpoints Activos

Estos endpoints están montados porque sus módulos se importan en `AppModule`.

## App

### `GET /`

Auth: No.  
Respuesta:

```json
"Hello World!"
```

## Auth

### `POST /auth/login`

Auth: No.  
Body: `LoginDto`.

```json
{
  "email": "usuario@dominio.cl",
  "password": "secret123"
}
```

Respuesta:

```json
{
  "access_token": "jwt",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1710000000,
  "refresh_token": "refresh",
  "user": {
    "id": "uuid",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "usuario@dominio.cl",
    "is_anonymous": false
  },
  "profile": {
    "id": "uuid",
    "rut": "12345678-9",
    "email": "usuario@dominio.cl",
    "role_id": 1,
    "primer_nombre": "Nombre",
    "segundo_nombre": "",
    "primer_apellido": "Apellido",
    "segundo_apellido": "",
    "activo": true,
    "created_at": "2026-01-01T00:00:00.000Z",
    "roles": {
      "name": "estudiante"
    }
  },
  "roleName": "estudiante"
}
```

## Usuarios

Controller base: `/usuarios`  
Auth base: `JwtAuthGuard` para todas las rutas del controller.

### `GET /usuarios/admin/config`

Roles: `AdminGuard`.  
Respuesta: diagnóstico de configuración Supabase.

### `POST /usuarios/admin/crear`

Roles: `AdminGuard`.  
Body: `CreateUsuarioAdminDto`.

Respuesta:

```json
{
  "user": {},
  "usuario": {},
  "alumno": {},
  "message": "Usuario y perfil de alumno creados con éxito"
}
```

### `GET /usuarios/admin/usuarios`

Roles: `secretaria`, `director`, `admin`.  
Query:

```ts
{
  page?: number;    // default 1
  perPage?: number; // default 50, cap 100
}
```

Respuesta:

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@mail.cl",
      "emailConfirmed": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "lastSignIn": "2026-01-02T00:00:00.000Z",
      "userMetadata": {},
      "usuario": {
        "auth0UserId": "uuid",
        "rut": "12345678-9",
        "idRol": 1,
        "email": "user@mail.cl",
        "activo": true,
        "rol": {}
      }
    }
  ],
  "total": 1,
  "page": 1,
  "perPage": 50
}
```

### `GET /usuarios/admin/usuarios/tabla`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `Usuario[]` con relación `rol`.

### `GET /usuarios/admin/usuarios/validos-auth0`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `Usuario[]` con `rol` y `alumno`, filtrados por `auth0UserId` UUID válido.

### `GET /usuarios/admin/usuarios/:id`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // Supabase/Auth user id
```

Respuesta: usuario de Supabase + registro local `usuario`.

### `POST /usuarios/admin/usuarios`

Roles: `secretaria`, `director`, `admin`.  
Body: `CreateUsuarioSupabaseDto`.  
Respuesta: objeto de creación Supabase/local.

### `POST /usuarios/admin/usuarios/importar-excel`

Roles: `AdminGuard`.  
Content-Type: `multipart/form-data`.  
Campo archivo: `file`.  
Formatos: `.xlsx`, `.xls`.

Respuesta:

```json
{
  "resumen": {
    "totalFilas": 10,
    "creados": 8,
    "conError": 2
  },
  "erroresPorCodigo": {
    "ROW_EMAIL_INVALID": 1
  },
  "exitosos": [],
  "errores": []
}
```

### `GET /usuarios/admin/usuarios/template-excel`

Roles: `AdminGuard`.  
Respuesta: archivo `.xlsx`.

### `GET /usuarios/admin/usuarios/template-excel-prueba`

Roles: `AdminGuard`.  
Respuesta: archivo `.xlsx` desde `exceltemplate/usuarios_prueba.xlsx`.

### `PATCH /usuarios/admin/usuarios/:id`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string }
```

Body: `UpdateUsuarioSupabaseDto`.

### `DELETE /usuarios/admin/usuarios/:id`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string }
```

Respuesta: resultado de eliminación Supabase/local.

### `POST /usuarios`

Auth: JWT por controller base. Sin `RolesGuard` declarado.  
Body: `CreateUsuarioDto`.  
Respuesta: `Usuario`.

### `GET /usuarios`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `Usuario[]` con relación `rol`.  
Nota: no paginado.

### `GET /usuarios/estudiantes`

Roles: `secretaria`, `director`, `admin`.  
Query: `PaginationDto`.  
Respuesta paginada con estudiantes y datos de alumno.

### `GET /usuarios/me`

Auth: JWT.  
Respuesta: usuario actual local + datos derivados.

### `GET /usuarios/:id`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // auth0UserId
```

Respuesta: `Usuario`.

### `PATCH /usuarios/:id`

Auth: JWT por controller base. Sin `RolesGuard` declarado.  
Params:

```ts
{ id: string }
```

Body: `UpdateUsuarioDto`.

### `DELETE /usuarios/:id`

Auth: JWT por controller base. Sin `RolesGuard` declarado.  
Params:

```ts
{ id: string }
```

Respuesta: `void`.

## Alumnos

Controller base: `/alumnos`  
Auth: `JwtAuthGuard`, `RolesGuard`.

### `POST /alumnos`

Roles: `secretaria`, `director`, `admin`.  
Body: `CreateAlumnoDto`.  
Respuesta: `Alumno`.

### `GET /alumnos`

Roles: `secretaria`, `director`, `admin`.  
Query: `PaginationDto`.  
Respuesta paginada de `Alumno[]` con relación `usuario`.

### `GET /alumnos/:rut`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `Alumno`.

### `PATCH /alumnos/:rut`

Roles: `secretaria`, `director`, `admin`.  
Body: `UpdateAlumnoDto`.  
Respuesta: `Alumno`.

### `DELETE /alumnos/:rut`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `void`.

### `GET /alumnos/:rut/resumen-academico`

Roles: `secretaria`, `director`, `admin`.

Respuesta:

```json
{
  "alumno": {},
  "notas": [],
  "examenes": [],
  "promedioGeneral": 5.75
}
```

### `GET /alumnos/:rut/asignaturas`

Roles: `estudiante`, `secretaria`, `director`, `admin`.  
Restricción: si el rol es estudiante, solo puede consultar su propio `rut`.

Respuesta:

```json
[
  {
    "idNota": 1,
    "codAsignatura": "INF101",
    "nombreAsignatura": "Programación I",
    "nivel": "1",
    "nota": 6.2,
    "anhoCursada": 2026,
    "semestreCursada": 1
  }
]
```

### `GET /alumnos/usuario/:auth0UserId/asignaturas`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: mismo contrato que `GET /alumnos/:rut/asignaturas`.

### `POST /alumnos/:rut/asignaturas/asignar`

Roles: `secretaria`, `director`, `admin`.  
Body: `AsignarAsignaturaDto`.  
Respuesta: `Nota`.

### `POST /alumnos/:rut/asignaturas/asignar-varias`

Roles: `secretaria`, `director`, `admin`.  
Body: `AsignarVariasAsignaturasDto`.

Respuesta:

```json
{
  "rut": "12345678-9",
  "total": 2,
  "creadas": 1,
  "actualizadas": 0,
  "omitidas": 1,
  "errores": []
}
```

### `POST /alumnos/asignaturas/asignar-masivo`

Roles: `secretaria`, `director`, `admin`.  
Body: `AsignarAsignaturasMasivoDto`.

Respuesta:

```json
{
  "totalAlumnos": 2,
  "totalAsignaturas": 2,
  "totalIntentos": 4,
  "creadas": 3,
  "actualizadas": 0,
  "omitidas": 1,
  "errores": []
}
```

### `POST /alumnos/asignaturas/prevalidar-masivo`

Roles: `secretaria`, `director`, `admin`.  
Body: `AsignarAsignaturasMasivoDto`.

Respuesta:

```json
{
  "totalAlumnos": 1,
  "totalAsignaturas": 1,
  "totalCombinaciones": 1,
  "resumen": {
    "asignables": 1,
    "yaAsignadasConNota": 0,
    "asignadasSinNota": 0,
    "alumnosNoEncontrados": 0,
    "asignaturasNoEncontradas": 0
  },
  "resultados": []
}
```

### `POST /alumnos/usuario/:auth0UserId/asignaturas/asignar`

Roles: `secretaria`, `director`, `admin`.  
Body: `AsignarAsignaturaDto`.  
Respuesta: `Nota`.

### `POST /alumnos/usuario/:auth0UserId/asignaturas/asignar-varias`

Roles: `secretaria`, `director`, `admin`.  
Body: `AsignarVariasAsignaturasDto`.  
Respuesta: resumen con `auth0UserId`, `total`, `creadas`, `actualizadas`, `omitidas`, `errores`.

### `POST /alumnos/usuarios/asignaturas/asignar-masivo`

Roles: `secretaria`, `director`, `admin`.  
Body: `AsignarAsignaturasMasivoPorUsuarioDto`.  
Respuesta: resumen masivo por `auth0UserIds`.

### `POST /alumnos/usuarios/asignaturas/prevalidar-masivo`

Roles: `secretaria`, `director`, `admin`.  
Body: `AsignarAsignaturasMasivoPorUsuarioDto`.  
Respuesta: prevalidación masiva por `auth0UserIds`.

### `GET /alumnos/:rut/notas`

Roles: `estudiante`, `secretaria`, `director`, `admin`.  
Restricción: si el rol es estudiante, solo puede consultar su propio `rut`.

Respuesta: `Nota[]` con relación `asignatura`.

### `POST /alumnos/:rut/notas`

Roles: `secretaria`, `director`, `admin`.  
Body: `CreateNotaDto` sin necesidad de `nroMatricula` desde frontend.  
Respuesta: `Nota`.

### `PATCH /alumnos/:rut/notas/:id`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{
  rut: string;
  id: number; // idNota
}
```

Body: `UpdateNotaDto`.  
Respuesta: `Nota`.

### `DELETE /alumnos/:rut/notas/:id`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{
  rut: string;
  id: number; // idNota
}
```

Respuesta: `Nota` eliminada.  
Cambio reciente: desasigna/elimina el registro. Ya no deja la asignatura visible con `nota = null`.

### `GET /alumnos/:rut/examenes`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `Examen[]`.

### `POST /alumnos/:rut/examenes`

Roles: `secretaria`, `director`, `admin`.  
Body: `CreateExamenDto` sin necesidad de `nroMatricula` desde frontend.  
Respuesta: `Examen`.

### `PATCH /alumnos/:rut/examenes/:id`

Roles: `secretaria`, `director`, `admin`.  
Body: `UpdateExamenDto`.  
Respuesta: `Examen`.

### `DELETE /alumnos/:rut/examenes/:id`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `void`.

## Asignaturas

Controller base: `/asignaturas`  
Auth: `JwtAuthGuard`, `RolesGuard`.

### `POST /asignaturas`

Roles: `secretaria`, `director`, `admin`.  
Body: `CreateAsignaturaDto`.  
Respuesta: `Asignatura`.

### `GET /asignaturas`

Roles: `secretaria`, `director`, `admin`.  
Query: `PaginationDto`.  
Respuesta paginada de `Asignatura[]`.

### `GET /asignaturas/:cod`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `Asignatura`.

### `PATCH /asignaturas/:cod`

Roles: `secretaria`, `director`, `admin`.  
Body: `UpdateAsignaturaDto`.  
Respuesta: `Asignatura`.

### `DELETE /asignaturas/:cod`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `void`.

## Notas

Controller base: `/notas`  
Auth: `JwtAuthGuard`, `RolesGuard`.

### `POST /notas`

Roles: `secretaria`, `director`, `admin`.  
Body: `CreateNotaDto`.  
Respuesta: `Nota`.

### `GET /notas`

Roles: `secretaria`, `director`, `admin`.  
Query: `PaginationDto`.

Respuesta:

```json
{
  "data": [
    {
      "idNota": 1,
      "nroMatricula": "20260001",
      "codAsignatura": "INF101",
      "anhoCursada": 2026,
      "semestreCursada": 1,
      "nota": 6.1,
      "alumno": {},
      "asignatura": {}
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

Cambio reciente: antes devolvía `Nota[]`, ahora devuelve paginado.

### `GET /notas/:id`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `Nota` con `alumno` y `asignatura`.

### `PATCH /notas/:id`

Roles: `secretaria`, `director`, `admin`.  
Body: `UpdateNotaDto`.  
Respuesta: `Nota`.

### `DELETE /notas/:id`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `Nota` eliminada.  
Cambio reciente: elimina/desasigna el registro.

## Exámenes

Controller base: `/examenes`  
Auth: `JwtAuthGuard`, `RolesGuard`.

### `POST /examenes`

Roles: `secretaria`, `director`, `admin`.  
Body: `CreateExamenDto`.  
Respuesta: `Examen`.

### `GET /examenes`

Roles: `secretaria`, `director`, `admin`.  
Query: `PaginationDto`.

Respuesta paginada:

```json
{
  "data": [
    {
      "idExamen": 1,
      "nroMatricula": "20260001",
      "fechaExamen": "2026-06-24",
      "notaExamen": 6.0,
      "alumno": {}
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

Cambio reciente: antes devolvía `Examen[]`, ahora devuelve paginado.

### `GET /examenes/:id`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `Examen` con `alumno`.

### `PATCH /examenes/:id`

Roles: `secretaria`, `director`, `admin`.  
Body: `UpdateExamenDto`.  
Respuesta: `Examen`.

### `DELETE /examenes/:id`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: `void`.

## Constancias

Controller base: `/constancias`

### `POST /constancias/solicitar`

Roles: `estudiante`.  
Body: `SolicitarConstanciaDto`.

Respuesta:

```json
{
  "solicitud": {},
  "tipoConstancia": "Alumno Regular",
  "alumno": {
    "rut": "12345678-9",
    "nombreCompleto": "Nombre Apellido"
  },
  "documento": {
    "idDocumento": 1,
    "codigoDocumento": "uuid",
    "nombreArchivo": "archivo.docx",
    "rutaRelativa": "ruta",
    "tamanioBytes": 12345,
    "fechaGeneracion": "2026-01-01T00:00:00.000Z"
  },
  "estado": "GENERADA_PDF",
  "mensaje": "Constancia generada exitosamente"
}
```

### `GET /constancias/mis`

Roles: `estudiante`, `secretaria`, `director`, `admin`.  
Query: `PaginationDto`.  
Respuesta paginada de solicitudes del estudiante actual.

### `GET /constancias/mis/estado`

Roles: `estudiante`, `secretaria`, `director`, `admin`.  
Respuesta: estado de solicitudes del estudiante actual.

### `GET /constancias/todas/estado`

Roles: `secretaria`, `director`, `admin`.  
Query: `PaginationDto`.  
Respuesta paginada con estados de todas las solicitudes.

### `GET /constancias/all`

Roles: `secretaria`, `director`, `admin`.  
Query: `PaginationDto`.  
Respuesta paginada de solicitudes enriquecidas.

### `GET /constancias/pending`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: solicitudes/documentos pendientes según lógica del servicio.

### `POST /constancias/approve/:id`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // idSolicitud
```

Respuesta: `void`.

### `POST /constancias/reject/:id`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string }
```

Body:

```ts
{
  motivo?: string;
}
```

Respuesta: `void`.

### `PATCH /constancias/solicitud/:id/estado`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string }
```

Body: `CambiarEstadoDto`.  
Respuesta: resultado de cambio de estado.

### `GET /constancias/:id/historial`

Roles: `estudiante`, `secretaria`, `director`.  
Params:

```ts
{ id: string } // idSolicitud
```

Respuesta: historial de solicitud.

### `GET /constancias/documento/:id/previsualizar`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // idSolicitud
```

Respuesta: HTML (`text/html`) renderizado para preview.

### `GET /constancias/documento/:id/docx`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // idSolicitud
```

Respuesta: archivo `.docx`.

### `GET /constancias/documento/:id/descargar`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // idSolicitud
```

Respuesta: archivo PDF.

### `POST /constancias/documento/:id/firmar`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // idDocumento o codigoDocumento según lógica interna
```

Respuesta: documento firmado.

### `POST /constancias/solicitud/:id/firmar`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // idSolicitud
```

Respuesta: documento firmado.

### `GET /constancias/documentos/mis`

Roles: `estudiante`, `secretaria`, `director`, `admin`.  
Respuesta: documentos del alumno actual con estado.

### `GET /constancias/mis/documento/:id/descargar`

Roles: `estudiante`, `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // idSolicitud
```

Respuesta: archivo PDF del estudiante.

### `GET /constancias/documentos/pendientes`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: documentos pendientes.

### `GET /constancias/documentos/firmados`

Roles: `secretaria`, `director`, `admin`.  
Respuesta: documentos firmados.

### `GET /constancias/documentos/todos`

Roles: `secretaria`, `director`, `admin`.  
Query: `PaginationDto`.  
Respuesta paginada de documentos.

### `GET /constancias/documentos/:id`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // idDocumento o codigoDocumento
```

Respuesta: documento.

### `GET /constancias/documentos/:id/descargar-admin`

Roles: `secretaria`, `director`, `admin`.  
Params:

```ts
{ id: string } // idDocumento o codigoDocumento
```

Respuesta: archivo PDF.

### `GET /constancias/documentos/:id/descargar`

Roles: `estudiante`.  
Params:

```ts
{ id: string } // idDocumento o codigoDocumento
```

Respuesta: archivo PDF.

## Documentos

Controller base: `/documentos`  
Nota: este controller del módulo nuevo no declara guards en el archivo actual.

### `POST /documentos/generar/:idSolicitud`

Auth/Roles: no declarados en controller.  
Params:

```ts
{ idSolicitud: string }
```

Respuesta: `DocumentoGenerado`.

### `GET /documentos/descargar/:idDocumento`

Auth/Roles: no declarados en controller.  
Params:

```ts
{ idDocumento: string }
```

Respuesta: archivo `.docx`.

### `GET /documentos/:idDocumento`

Auth/Roles: no declarados en controller.  
Params:

```ts
{ idDocumento: string }
```

Respuesta: `DocumentoGenerado`.

### `POST /documentos/prueba/generar`

Auth/Roles: no declarados en controller.  
Body:

```ts
{
  rutAlumno: string;
  tipoDocumento: string;
  observacionAlumno?: string;
}
```

Respuesta: documento de prueba.

## Endpoints Definidos Pero No Montados En `AppModule`

Los siguientes controllers existen en `src`, pero sus módulos no están importados actualmente en `AppModule`. En condiciones normales no responderán en runtime, salvo que se importen sus módulos.

### Roles (`/roles`)

DTO:

```ts
{
  nombreRol: string;
}
```

Rutas definidas:

- `POST /roles`
- `GET /roles`
- `GET /roles/:id`
- `PATCH /roles/:id`
- `DELETE /roles/:id`

### Tipos Constancia (`/tipos-constancia`)

DTO:

```ts
{
  nombre: string;
}
```

Rutas definidas:

- `POST /tipos-constancia`
- `GET /tipos-constancia`
- `GET /tipos-constancia/:id`
- `PATCH /tipos-constancia/:id`
- `DELETE /tipos-constancia/:id`

### Estados Solicitud (`/estados-solicitud`)

DTO:

```ts
{
  nombreEstado: string;
}
```

Rutas definidas:

- `POST /estados-solicitud`
- `GET /estados-solicitud`
- `GET /estados-solicitud/:id`
- `PATCH /estados-solicitud/:id`
- `DELETE /estados-solicitud/:id`

### Directores (`/directores`)

DTO:

```ts
{
  auth0UserId: string;
  primerNombre: string;
  primerApellido: string;
}
```

Rutas definidas:

- `POST /directores`
- `GET /directores`
- `GET /directores/:id`
- `PATCH /directores/:id`
- `DELETE /directores/:id`

### Secretarias (`/secretarias`)

DTO:

```ts
{
  auth0UserId: string;
  primerNombre: string;
  primerApellido: string;
}
```

Rutas definidas:

- `POST /secretarias`
- `GET /secretarias`
- `GET /secretarias/:id`
- `PATCH /secretarias/:id`
- `DELETE /secretarias/:id`

### Historiales Solicitud (`/historiales-solicitud`)

DTO:

```ts
{
  idSolicitud: string; // UUID
  idEstado: number;
  auth0UserId?: string;
  detalle?: string;
}
```

Rutas definidas:

- `POST /historiales-solicitud`
- `GET /historiales-solicitud`
- `GET /historiales-solicitud/:id`
- `PATCH /historiales-solicitud/:id`
- `DELETE /historiales-solicitud/:id`

### Solicitudes Legacy (`/solicitudes`)

Existe `src/solicitudes/solicitudes.controller.ts`, pero `AppModule` importa `src/modules/solicitudes`, que no tiene controller público. Por eso estas rutas legacy no están montadas actualmente.

DTO:

```ts
{
  rutAlumno: string;
  idTipoConstancia: number;
  observacionAlumno?: string;
}
```

Rutas definidas:

- `POST /solicitudes`
- `GET /solicitudes`
- `GET /solicitudes/:id`
- `PATCH /solicitudes/:id`
- `DELETE /solicitudes/:id`

## Checklist Para Configurar Frontend

- Usar `/api/v1` como prefijo global.
- Agregar `Authorization: Bearer <token>` en rutas protegidas.
- No enviar propiedades extra en body.
- Actualizar consumo de `GET /notas` y `GET /examenes`: ahora son paginados.
- Para borrar asignaturas desde alumno, usar `idNota` retornado por `GET /alumnos/:rut/asignaturas`.
- Para descargas/previews, tratar la respuesta como archivo/blob o HTML, no JSON.
- No depender de endpoints listados como “definidos pero no montados” hasta que se importen explícitamente en `AppModule`.
