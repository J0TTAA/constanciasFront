# Docker Setup - Frontend Constancias

## Requisitos Previos

- Docker instalado en la VM
- Docker Compose instalado
- Nginx configurado en la VM (como reverse proxy principal)
- Archivo `.env` con las variables de entorno necesarias

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# URLs para la VM (ajusta según tu configuración)
VITE_SUPABASE_URL=http://tu-dominio.com/auth/v1
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
VITE_API_URL=http://tu-dominio.com/api/v1
VITE_ANON_KEY=tu_anon_key_aqui
```

**Nota:** En la VM, las URLs deben apuntar a través del Nginx principal, no directamente a los puertos internos.

## Construcción y Ejecución

### Opción 1: Solo Frontend (Backend en el host)

Si tu backend y Supabase están corriendo en el host (fuera de Docker):

```bash
# Construir la imagen
docker-compose build

# Ejecutar el contenedor
docker-compose up -d

# Ver los logs
docker-compose logs -f frontend

# Detener el contenedor
docker-compose down
```

El frontend estará disponible en: `http://localhost:3000`

### Opción 2: Frontend + Backend en Docker

Si quieres ejecutar el backend también en Docker:

1. Descomenta la sección `backend` en `docker-compose.yml`
2. Ajusta la configuración según tu backend
3. Actualiza `nginx.conf` para usar `http://backend:3020` en lugar de `host.docker.internal:3020`

## Configuración de Nginx en la VM

El contenedor Docker solo sirve archivos estáticos. El Nginx de la VM debe configurarse como reverse proxy.

Ver el archivo `nginx-vm-example.conf` para un ejemplo de configuración que:
- Enruta `/` al frontend (contenedor Docker en puerto 3000)
- Enruta `/api/v1/constancias` al backend (puerto 3020)
- Enruta `/auth/v1` y `/rest/v1` a Supabase (puerto 8000)

**Pasos para configurar Nginx en la VM:**

1. Copia `nginx-vm-example.conf` a tu configuración de Nginx:
   ```bash
   sudo cp nginx-vm-example.conf /etc/nginx/sites-available/constancias
   sudo ln -s /etc/nginx/sites-available/constancias /etc/nginx/sites-enabled/
   ```

2. Edita el archivo y ajusta:
   - `server_name` con tu dominio o IP
   - URLs de proxy si tus servicios están en otros puertos

3. Prueba la configuración:
   ```bash
   sudo nginx -t
   ```

4. Recarga Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## Desarrollo vs Producción

### Desarrollo
- Usa `npm run dev` directamente (sin Docker)
- El proxy de Vite maneja las peticiones al backend

### Producción
- Usa Docker para construir y servir la aplicación
- Nginx maneja el proxy y sirve los archivos estáticos

## Troubleshooting

### El frontend no puede conectarse al backend
- Verifica que el backend esté corriendo en el puerto 3020
- Si el backend está en Docker, actualiza `nginx.conf` para usar `http://backend:3020`
- Si el backend está en el host, usa `http://host.docker.internal:3020`

### Variables de entorno no funcionan
- Las variables `VITE_*` se inyectan en tiempo de build
- Necesitas reconstruir la imagen si cambias las variables: `docker-compose build --no-cache`

### Ver logs del contenedor
```bash
docker-compose logs -f frontend
```

### Reconstruir sin caché
```bash
docker-compose build --no-cache
docker-compose up -d
```

