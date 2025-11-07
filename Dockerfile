# -------- ETAPA 1: BUILD (Construcción) --------
# Usamos una imagen ligera de Node.js (Alpine es una versión mínima)
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y package-lock.json para instalar dependencias
# Se copian primero para aprovechar el caché de Docker
COPY package.json package-lock.json ./
RUN npm install

# Copiamos el resto del código fuente del proyecto
COPY . .

# Ejecutamos el script de build de Vue (que crea la carpeta /dist)
RUN npm run build

# -------- ETAPA 2: SERVE (Servidor final) --------
# Usamos una imagen de Nginx súper ligera
FROM nginx:stable-alpine

# Copiamos la configuración de Nginx que crearemos abajo
# (Importante para que el Vue Router funcione bien en modo history)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos estáticos construidos desde la etapa 'builder'
# La carpeta /dist de la etapa 'builder' va al directorio web de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponemos el puerto 80 (el puerto por defecto de Nginx)
EXPOSE 80

# El comando para iniciar Nginx ya viene en la imagen base