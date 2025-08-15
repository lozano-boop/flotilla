# Dockerfile para FlotillaManager
# Etapa 1: Build de dependencias y frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production=false
COPY . .
RUN npm run build

# Etapa 2: Imagen final para producción
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.production ./.env.production
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/uploads ./uploads
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]

const db = drizzle(process.env.NEON_DATABASE_URL!);
