# 🔴 ACCIÓN REQUERIDA: Backend debe validar JWT

## PROBLEMA ACTUAL
El frontend está enviando correctamente el `access_token` con `Bearer` token, pero el backend responde **401 Unauthorized**.

## LO QUE EL FRONTEND ESTÁ HACIENDO (CORRECTO)

```typescript
// Frontend envía:
GET http://localhost:8000/auth/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json

// ✅ CORRECTO: Solo el access_token, NO anon key
// ✅ CORRECTO: Formato Bearer token
```

## LO QUE EL BACKEND DEBE HACER

### 1. Validar el JWT con Supabase

El backend **DEBE** validar el JWT usando el `SUPABASE_JWT_SECRET` que coincide con Supabase.

### 2. Implementación Requerida

El backend necesita:

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET, // ← DEBE coincidir con Supabase
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

### 3. Verificar Variables de Entorno

En el **backend** `.env`:

```bash
SUPABASE_URL=http://localhost:8000
SUPABASE_JWT_SECRET=<copiar desde Supabase Dashboard → Settings → API → JWT Secret>
SUPABASE_SERVICE_ROLE_KEY=<copiar desde Supabase Dashboard → Settings → API → service_role>
```

### 4. El JWT Secret DEBE Coincidir

- Ve a Supabase Dashboard
- Settings → API
- Copia el **JWT Secret**
- Pégalo en `SUPABASE_JWT_SECRET` del backend
- **DEBE ser EXACTAMENTE igual**

## CHECKLIST PARA EL BACKEND

- [ ] Tiene `SUPABASE_JWT_SECRET` en `.env`
- [ ] `SUPABASE_JWT_SECRET` coincide EXACTAMENTE con Supabase Dashboard
- [ ] Tiene `JwtStrategy` implementado
- [ ] `JwtStrategy` usa `secretOrKey: process.env.SUPABASE_JWT_SECRET`
- [ ] Endpoint `/auth/me` tiene `@UseGuards(JwtAuthGuard)`
- [ ] `AuthModule` está registrado en `AppModule`
- [ ] Backend está corriendo y escuchando en el puerto correcto

## SI SIGUE FALLANDO

1. **Verifica el JWT Secret:**
   ```bash
   # En Supabase Dashboard
   Settings → API → JWT Secret
   # Copia y pega en backend .env
   ```

2. **Verifica que el token se recibe:**
   ```typescript
   // En el backend, en JwtStrategy.validate()
   console.log('Payload recibido:', payload);
   console.log('User ID:', payload.sub);
   ```

3. **Verifica la firma del JWT:**
   - El JWT debe ser válido (no expirado)
   - La firma debe coincidir con SUPABASE_JWT_SECRET
   - El formato debe ser: `Bearer <token>`

## EL FRONTEND YA ESTÁ CORRECTO

El frontend:
- ✅ Extrae el `access_token` del login
- ✅ Lo envía con `Authorization: Bearer <token>`
- ✅ NO usa anon key en esta llamada
- ✅ Espera respuesta `{ id, email, name, role }`

**El problema está 100% en el backend - debe validar el JWT correctamente.**

