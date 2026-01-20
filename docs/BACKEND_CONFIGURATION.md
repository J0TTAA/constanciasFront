# Configuración del Backend - Verificación

## ✅ Variable de Entorno Configurada

El backend ahora tiene configurado:

```bash
SUPABASE_JWT_SECRET=6b9f3c2a4e8d7f1a0c9e2b5d8a4f7c1e
```

## ⚠️ IMPORTANTE: Verificar que Coincida

Este valor **DEBE coincidir EXACTAMENTE** con el JWT Secret de Supabase:

1. Ve a **Supabase Dashboard**
2. **Settings** → **API**
3. Busca **"JWT Secret"**
4. Compara con el valor en el backend `.env`

Si no coinciden, el backend seguirá devolviendo 401.

## Verificación Rápida

Si el backend sigue devolviendo 401 después de agregar esta variable:

1. **Reinicia el servidor del backend** (las variables de entorno se cargan al iniciar)
2. **Verifica que el valor sea exactamente igual** (sin espacios, sin comillas)
3. **Verifica que el backend esté leyendo la variable:**
   ```typescript
   // En el backend, en jwt.strategy.ts
   console.log('JWT Secret configurado:', process.env.SUPABASE_JWT_SECRET);
   ```

## Flujo Correcto Ahora

```
1. Frontend → Login → Obtiene access_token
2. Frontend → GET /auth/me con Authorization: Bearer <token>
3. Backend → JwtStrategy valida el token con SUPABASE_JWT_SECRET ✅
4. Backend → Extrae auth.uid() del payload
5. Backend → Consulta profiles + roles
6. Backend → Devuelve { id, email, name, role }
7. Frontend → Guarda en store y muestra UI
```

## Si Funciona Correctamente

Deberías ver en la consola del frontend:

```
✅ Respuesta del backend /auth/me: { id: "...", email: "...", name: "...", role: "admin" }
✅ Usuario del backend: { id: "...", email: "...", role: "admin" }
✅ Rol mapeado para el sistema: Administrador
```

