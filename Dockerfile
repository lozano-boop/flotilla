# Dockerfile para FlotillaManager

# Etapa 1: Build de dependencias y frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
# Instala todas las dependencias, incluyendo las de desarrollo para el build
RUN npm install --production=false
COPY . .
RUN npm run build

# Etapa 2: Imagen final para producción
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
# Instala solo las dependencias de producción
RUN npm install --production
# Copia los artefactos del build desde la etapa anterior
COPY --from=builder /app/dist ./dist
# Copia el resto del código de servidor necesario
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Expone el puerto en el que corre la aplicación
EXPOSE 5000

# Establece el entorno a producción
ENV NODE_ENV=production

# Comando para iniciar el servidor
CMD ["node", "dist/index.js"]