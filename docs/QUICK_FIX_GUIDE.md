# Guía Rápida: Solución al 401 en /auth/me

## PROBLEMA ACTUAL
```
Frontend → GET /auth/me → 401 Unauthorized
```

## CAUSA RAÍZ
El backend (NestJS) **NO está validando el JWT de Supabase correctamente**.

## SOLUCIÓN INMEDIATA (Backend)

### Paso 1: Instalar dependencias
```bash
npm install @nestjs/passport passport passport-jwt @supabase/supabase-js
npm install -D @types/passport-jwt
```

### Paso 2: Configurar variables de entorno
```bash
# .env del backend
SUPABASE_URL=http://localhost:8000
SUPABASE_JWT_SECRET=<copiar desde Supabase Dashboard → Settings → API → JWT Secret>
SUPABASE_SERVICE_ROLE_KEY=<copiar desde Supabase Dashboard → Settings → API → service_role key>
```

### Paso 3: Crear JWT Strategy
```typescript
// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET, // ← CRÍTICO
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,      // ← auth.uid()
      email: payload.email,
    };
  }
}
```

### Paso 4: Crear Auth Module
```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.SUPABASE_JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

### Paso 5: Implementar Auth Service
```typescript
// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabaseAdmin;

  constructor() {
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
    const { data, error } = await this.supabaseAdmin
      .from('profiles')
      .select('id, email, primer_nombre, primer_apellido, roles(name)')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error(`Profile not found: ${error.message}`);
    }

    return {
      id: data.id,
      email: data.email,
      name: `${data.primer_nombre || ''} ${data.primer_apellido || ''}`.trim() || data.email.split('@')[0],
      role: data.roles?.name || null,
    };
  }
}
```

### Paso 6: Implementar Auth Controller
```typescript
// src/auth/auth.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return this.authService.getMe(req.user);
  }
}
```

### Paso 7: Crear JWT Auth Guard
```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

## VERIFICACIÓN

1. **Login funciona** ✅
2. **Token se guarda** ✅
3. **GET /auth/me con token** → Debe devolver 200 OK con `{ id, email, name, role }`

## SI SIGUE FALLANDO

### Verificar JWT Secret
```bash
# En Supabase Dashboard
Settings → API → JWT Secret
# Debe ser EXACTAMENTE igual a SUPABASE_JWT_SECRET en backend
```

### Verificar que el token se envía
```typescript
// En frontend, antes de llamar /auth/me
console.log('Token:', token);
// Debe ser un JWT válido
```

### Verificar logs del backend
```typescript
// En JwtStrategy.validate()
console.log('Payload:', payload);
// Debe tener: { sub: 'user-id', email: '...', role: 'authenticated' }
```

