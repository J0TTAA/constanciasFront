# Arquitectura de Autenticación: Supabase + Vue 3 + NestJS

## 1. TIPOS DE KEYS Y TOKENS EN SUPABASE

### 1.1 Anon Key (Public Key)
```typescript
// Características:
- ✅ Pública (puede estar en el frontend)
- ✅ Limitada por RLS
- ❌ NO puede bypassear RLS
- ✅ Usada para operaciones del cliente

// Uso correcto:
// Frontend → Supabase PostgREST directo
fetch('http://localhost:8000/rest/v1/profiles', {
  headers: {
    'apikey': VITE_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${userJWT}` // ← JWT del usuario autenticado
  }
})
```

### 1.2 Service Role Key (Secret Key)
```typescript
// Características:
- ❌ NUNCA en el frontend
- ✅ Bypassa RLS completamente
- ✅ Solo en backend seguro
- ✅ Para operaciones administrativas

// Uso correcto:
// Backend (NestJS) → Supabase Admin API
const { data } = await supabaseAdmin
  .from('profiles')
  .select('*, roles(name)')
  .eq('id', userId)
  .single()
```

### 1.3 JWT del Usuario (Access Token)
```typescript
// Características:
- ✅ Generado por Supabase Auth
- ✅ Contiene: sub (user_id), email, role: 'authenticated'
- ✅ Firmado con JWT_SECRET de Supabase
- ✅ Expira (default: 3600s)
- ✅ Debe validarse en el backend

// Estructura del payload:
{
  "sub": "c780afc9-adc6-4fa1-966f-1ad0a136affe", // ← auth.uid()
  "email": "admin@test.cl",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1767694972,
  "iat": 1767691372
}
```

## 2. POR QUÉ OCURRE EL 401

### Escenario Actual (INCORRECTO):
```
Frontend → GET /auth/me
Headers: Authorization: Bearer <access_token>

Backend (NestJS):
- ❌ No valida el JWT con Supabase
- ❌ Usa anon key incorrectamente
- ❌ No extrae auth.uid() del JWT
- ❌ Intenta consultar sin contexto de usuario
```

### Causas Específicas:

#### A) Backend no valida el JWT
```typescript
// ❌ INCORRECTO - Backend no verifica la firma
@Get('me')
async me(@Headers('authorization') auth: string) {
  // Solo lee el header, no valida
  const token = auth.replace('Bearer ', '')
  // Supabase rechaza porque no valida la firma
}
```

#### B) Uso incorrecto de keys
```typescript
// ❌ INCORRECTO - Usa anon key como si fuera service role
const supabase = createClient(SUPABASE_URL, ANON_KEY)
// ANON_KEY no puede hacer operaciones sin RLS
```

#### C) Falta de contexto de usuario
```typescript
// ❌ INCORRECTO - No pasa el JWT a Supabase
const { data } = await supabase
  .from('profiles')
  .select('*')
  // Falta: .eq('id', auth.uid())
  // Supabase no sabe qué usuario es
```

## 3. IMPLEMENTACIÓN CORRECTA DEL ENDPOINT /auth/me

### 3.1 Backend (NestJS) - Validación JWT

```typescript
// auth.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard) // ← Valida JWT antes de ejecutar
  async getMe(@Req() req: Request) {
    // req.user viene del JwtAuthGuard después de validar
    return this.authService.getMe(req.user);
  }
}
```

### 3.2 JWT Strategy - Validación con Supabase

```typescript
// jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private supabaseAdmin;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET, // ← JWT_SECRET de Supabase
      // ⚠️ CRÍTICO: Debe ser el mismo secret que usa Supabase Auth
    });

    // Service role para operaciones administrativas
    this.supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // ← Service Role, NO anon key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  async validate(payload: any) {
    // Payload viene del JWT decodificado y verificado
    // Supabase JWT tiene esta estructura:
    // {
    //   sub: 'user-uuid',      // ← auth.uid()
    //   email: 'user@email.cl',
    //   role: 'authenticated',
    //   aud: 'authenticated',
    //   exp: timestamp,
    //   iat: timestamp
    // }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // ⚠️ IMPORTANTE: No confiar en datos del JWT para autorización
    // Solo usar sub (user_id) para consultar la BD
    return {
      id: payload.sub,        // ← auth.uid() - ÚNICO dato confiable
      email: payload.email,   // ← Solo para UI, no para lógica
    };
  }
}
```

### 3.3 Auth Service - Consulta a Profiles

```typescript
// auth.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabaseAdmin;

  constructor() {
    // Service Role Key para bypassear RLS cuando sea necesario
    // O usar el JWT del usuario para respetar RLS
    this.supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  async getMe(user: { id: string; email: string }) {
    // Opción 1: Usar Service Role (bypassea RLS)
    // Útil si necesitas garantizar que siempre puedas leer el perfil
    const { data, error } = await this.supabaseAdmin
      .from('profiles')
      .select('id, email, primer_nombre, primer_apellido, roles(name)')
      .eq('id', user.id) // ← auth.uid() del JWT
      .single();

    if (error) {
      throw new NotFoundException(`Profile not found for user ${user.id}`);
    }

    // Opción 2: Usar JWT del usuario (respeta RLS)
    // Más seguro, pero requiere que RLS permita la lectura
    // const supabaseUser = createClient(
    //   process.env.SUPABASE_URL,
    //   process.env.SUPABASE_ANON_KEY,
    //   {
    //     global: {
    //       headers: {
    //         Authorization: `Bearer ${userJWT}`,
    //       },
    //     },
    //   }
    // );
    // const { data } = await supabaseUser
    //   .from('profiles')
    //   .select('id, email, roles(name)')
    //   .eq('id', user.id)
    //   .single();

    return {
      id: data.id,
      email: data.email,
      name: `${data.primer_nombre || ''} ${data.primer_apellido || ''}`.trim() || data.email.split('@')[0],
      role: data.roles?.name || null, // ← Rol desde la BD
    };
  }
}
```

### 3.4 JWT Auth Guard

```typescript
// guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Este guard automáticamente:
  // 1. Extrae el token del header Authorization
  // 2. Valida la firma con SUPABASE_JWT_SECRET
  // 3. Verifica expiración
  // 4. Llama a validate() del JwtStrategy
  // 5. Inyecta req.user con el resultado de validate()
}
```

## 4. FLUJO COMPLETO CORRECTO

```
┌─────────────┐
│   Frontend  │
│   (Vue 3)   │
└──────┬──────┘
       │
       │ 1. POST /auth/v1/token
       │    Body: { email, password, grant_type: 'password' }
       │    Headers: { apikey: ANON_KEY }
       │
       ▼
┌─────────────────┐
│  Supabase Auth  │
└──────┬──────────┘
       │
       │ 2. Valida credenciales
       │    Genera JWT firmado
       │
       │ 3. Response:
       │    {
       │      access_token: "eyJ...",
       │      token_type: "bearer",
       │      expires_in: 3600,
       │      user: { id, email, ... }
       │    }
       │
       ▼
┌─────────────┐
│   Frontend  │
│   (Vue 3)   │
└──────┬──────┘
       │
       │ 4. Guarda access_token
       │
       │ 5. GET /auth/me
       │    Headers: { Authorization: Bearer <access_token> }
       │
       ▼
┌─────────────────┐
│  Backend NestJS │
│  /auth/me       │
└──────┬──────────┘
       │
       │ 6. JwtAuthGuard intercepta
       │    - Extrae token
       │    - Valida firma con SUPABASE_JWT_SECRET
       │    - Decodifica payload
       │    - Llama JwtStrategy.validate()
       │
       │ 7. JwtStrategy.validate()
       │    - Extrae payload.sub (auth.uid())
       │    - Retorna { id: payload.sub, email: payload.email }
       │
       │ 8. AuthService.getMe(req.user)
       │    - Usa Service Role Key
       │    - Consulta: profiles WHERE id = req.user.id
       │    - Join con roles
       │
       ▼
┌─────────────────┐
│   Supabase DB   │
│   PostgREST     │
└──────┬──────────┘
       │
       │ 9. Query:
       │    SELECT profiles.*, roles.name
       │    FROM profiles
       │    JOIN roles ON profiles.role_id = roles.id
       │    WHERE profiles.id = 'auth.uid()'
       │
       │ 10. Response:
       │     {
       │       id: "...",
       │       email: "...",
       │       roles: { name: "admin" }
       │     }
       │
       ▼
┌─────────────────┐
│  Backend NestJS  │
└──────┬──────────┘
       │
       │ 11. Normaliza respuesta
       │     {
       │       id: "...",
       │       email: "...",
       │       name: "...",
       │       role: "admin"
       │     }
       │
       ▼
┌─────────────┐
│   Frontend  │
│   (Vue 3)   │
└─────────────┘
       │
       │ 12. Guarda en store
       │     - email
       │     - name
       │     - role (solo para UI)
       │
       │ 13. Muestra vistas según role
       │     (RLS en backend decide permisos reales)
```

## 5. ESTRUCTURA RLS CORRECTA

### 5.1 Policy para Profiles (Lectura)

```sql
-- Los usuarios solo pueden leer su propio perfil
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Los administradores pueden leer todos los perfiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    AND r.name = 'admin'
  )
);
```

### 5.2 Relación Profiles → Roles

```sql
-- Tabla roles
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

-- Tabla profiles con foreign key
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id INTEGER REFERENCES public.roles(id),
  primer_nombre TEXT,
  primer_apellido TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX idx_profiles_role_id ON public.profiles(role_id);
```

## 6. ERRORES TÍPICOS (LOS QUE ESTÁS COMETIENDO)

### ❌ Error 1: No validar JWT en el backend
```typescript
// INCORRECTO
@Get('me')
async me(@Headers('authorization') auth: string) {
  const token = auth.replace('Bearer ', '')
  // ❌ No valida la firma, Supabase rechaza
}
```

### ❌ Error 2: Usar ANON_KEY como SERVICE_ROLE_KEY
```typescript
// INCORRECTO
const supabase = createClient(URL, ANON_KEY)
// ❌ ANON_KEY está limitada por RLS
// ❌ No puede hacer operaciones administrativas
```

### ❌ Error 3: No extraer auth.uid() del JWT
```typescript
// INCORRECTO
const { data } = await supabase
  .from('profiles')
  .select('*')
  // ❌ Falta .eq('id', auth.uid())
  // ❌ Supabase no sabe qué usuario consultar
```

### ❌ Error 4: Confiar en datos del JWT para autorización
```typescript
// INCORRECTO
if (payload.role === 'admin') {
  // ❌ El JWT solo tiene role: 'authenticated'
  // ❌ El rol real está en profiles.roles.name
}
```

### ❌ Error 5: Frontend consulta BD directamente
```typescript
// INCORRECTO - Frontend
const { data } = await supabase
  .from('profiles')
  .select('*, roles(name)')
  // ❌ Frontend no debe hacer esto
  // ❌ Debe llamar al backend /auth/me
```

## 7. CHECKLIST FINAL

### Backend (NestJS)
- [ ] Instalar `@nestjs/passport`, `passport`, `passport-jwt`
- [ ] Instalar `@supabase/supabase-js`
- [ ] Configurar `SUPABASE_JWT_SECRET` en `.env` (debe coincidir con Supabase)
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY` en `.env` (NUNCA exponer)
- [ ] Implementar `JwtStrategy` con validación de firma
- [ ] Implementar `JwtAuthGuard`
- [ ] Implementar `AuthService.getMe()` que consulta profiles + roles
- [ ] Endpoint `/auth/me` protegido con `@UseGuards(JwtAuthGuard)`
- [ ] Extraer `auth.uid()` del JWT (payload.sub)
- [ ] Consultar profiles usando Service Role o JWT del usuario
- [ ] Devolver respuesta normalizada: `{ id, email, name, role }`

### Frontend (Vue 3)
- [ ] Guardar `access_token` después del login
- [ ] Llamar a `/auth/me` con `Authorization: Bearer <token>`
- [ ] Guardar respuesta en store (email, name, role)
- [ ] Usar role solo para UI (mostrar/ocultar vistas)
- [ ] NUNCA validar permisos en frontend
- [ ] NUNCA confiar en role del frontend para lógica

### Supabase (RLS)
- [ ] Policy: usuarios leen su propio perfil
- [ ] Policy: admins leen todos los perfiles
- [ ] Foreign key: profiles.role_id → roles.id
- [ ] Índice en profiles.role_id
- [ ] Verificar que `auth.uid()` funciona correctamente

### Seguridad
- [ ] JWT_SECRET coincide entre Supabase y NestJS
- [ ] SERVICE_ROLE_KEY solo en backend (nunca en frontend)
- [ ] ANON_KEY puede estar en frontend (limitada por RLS)
- [ ] Todos los endpoints protegidos validan JWT
- [ ] RLS es la única fuente de verdad para permisos
- [ ] Frontend solo muestra UI, backend decide todo

## 8. VARIABLES DE ENTORNO NECESARIAS

### Backend (.env)
```bash
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
```

### Frontend (.env)
```bash
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 9. DEBUGGING

### Verificar JWT Secret
```bash
# En Supabase Dashboard → Settings → API
# Copiar "JWT Secret"
# Debe coincidir con SUPABASE_JWT_SECRET en backend
```

### Verificar que el token se pasa correctamente
```typescript
// En el frontend, antes de llamar /auth/me
console.log('Token:', token);
console.log('Header:', `Bearer ${token}`);
```

### Verificar que el backend recibe el token
```typescript
// En el backend, en JwtStrategy
console.log('Validating token:', payload);
console.log('User ID from JWT:', payload.sub);
```

### Verificar consulta a profiles
```typescript
// En AuthService.getMe()
console.log('Querying profile for user:', user.id);
console.log('Profile data:', data);
console.log('Role:', data.roles?.name);
```

