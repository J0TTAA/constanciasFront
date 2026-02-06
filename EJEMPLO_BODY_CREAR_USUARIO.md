# Ejemplo de Body para Crear Usuario Estudiante

## Endpoint
```
POST /api/v1/usuarios/admin/crear
Headers: {
  Authorization: "Bearer <token_del_admin>",
  Content-Type: "application/json"
}
```

## Body Completo (con todos los campos)

```json
{
  // ============================================
  // CAMPOS OBLIGATORIOS - Usuario
  // ============================================
  "email": "alumno1@miapp.cl",              // ✅ OBLIGATORIO - Correo electrónico del usuario
  "password": "Alumno123!",                  // ✅ OBLIGATORIO - Contraseña del usuario
  "rut": "12.123.456-7",                     // ✅ OBLIGATORIO - RUT (llave primaria de alumno)
  "primer_nombre": "Juan",                   // ✅ OBLIGATORIO - Primer nombre
  "apellido_paterno": "Perez",               // ✅ OBLIGATORIO - Primer apellido (apellido paterno)
  "id_rol": 1,                               // ✅ OBLIGATORIO - Siempre 1 (Estudiante)
  "activo": true,                            // ✅ OBLIGATORIO - Estado del usuario (true/false)
  
  // ============================================
  // CAMPOS OBLIGATORIOS - Tabla Alumno
  // ============================================
  "nro_matricula": "2024001",                // ✅ OBLIGATORIO - Número de matrícula del estudiante
  "fecha_ingreso": "2024-03-01",             // ✅ OBLIGATORIO - Fecha de ingreso (formato: YYYY-MM-DD)
  
  // ============================================
  // CAMPOS OPCIONALES
  // ============================================
  "segundo_nombre": "Pablo",                  // ⚪ OPCIONAL - Segundo nombre (puede omitirse)
  "apellido_materno": "Gomez",                // ⚪ OPCIONAL - Segundo apellido (puede omitirse)
  "fecha_termino": "2027-12-31"              // ⚪ OPCIONAL - Fecha de término (formato: YYYY-MM-DD, puede omitirse)
}
```

## Body Mínimo (solo campos obligatorios)

```json
{
  "email": "alumno1@miapp.cl",
  "password": "Alumno123!",
  "rut": "12.123.456-7",
  "primer_nombre": "Juan",
  "apellido_paterno": "Perez",
  "id_rol": 1,
  "activo": true,
  "nro_matricula": "2024001",
  "fecha_ingreso": "2024-03-01"
}
```

## Body Completo (con campos opcionales)

```json
{
  "email": "alumno1@miapp.cl",
  "password": "Alumno123!",
  "rut": "12.123.456-7",
  "primer_nombre": "Juan",
  "segundo_nombre": "Pablo",
  "apellido_paterno": "Perez",
  "apellido_materno": "Gomez",
  "id_rol": 1,
  "activo": true,
  "nro_matricula": "2024001",
  "fecha_ingreso": "2024-03-01",
  "fecha_termino": "2027-12-31"
}
```

## Notas Importantes

1. **RUT**: Es la llave primaria de la tabla `alumno`, por lo que debe ser único.
2. **Nro Matrícula**: Debe ser único para cada estudiante.
3. **Fecha Ingreso**: Formato ISO 8601 (YYYY-MM-DD).
4. **Fecha Término**: Formato ISO 8601 (YYYY-MM-DD). Solo se envía si tiene valor.
5. **Campos Opcionales**: Si están vacíos, el frontend los omite del body (no envía `null` o `""`).
6. **id_rol**: Siempre debe ser `1` (Estudiante) cuando se crea desde este formulario.

## Validaciones del Frontend

El formulario valida que estén presentes:
- ✅ email
- ✅ password
- ✅ rut
- ✅ primer_nombre
- ✅ apellido_paterno
- ✅ nro_matricula
- ✅ fecha_ingreso

Los campos opcionales pueden dejarse vacíos:
- ⚪ segundo_nombre
- ⚪ apellido_materno
- ⚪ fecha_termino

