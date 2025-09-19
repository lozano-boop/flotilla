# Migración a Neon — guía rápida

Este proyecto ya soporta Neon serverless mediante la variable de entorno `NEON_DATABASE_URL` y las dependencias `@neondatabase/serverless` y `drizzle-orm/neon-http`.

Pasos recomendados para apuntar la app a Neon y aplicar migraciones:

1) Obtener la cadena de conexión de Neon
   - Usa el panel de Neon o la CLI para obtener el connection string (formato `postgresql://<user>:<password>@<host>:<port>/<db>?<params>`).
   - Asegúrate de que el string incluya parámetros SSL apropiados (por ejemplo `sslmode=require`).

2) No subir secretos
   - No comitees `NEON_DATABASE_URL` en git.
   - Añade la URL a los secretos de tu CI/CD o escribe en un `.env` local que no se subirÃ¡ (usa `.env.example` como plantilla).

3) Probar localmente con Docker Compose override
   - Crear un .env local con `NEON_DATABASE_URL` (o exportar la variable en tu shell).
   - Levantar la app forzando la variable con el override:

```bash
# desde la raíz del repo
export NEON_DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/<db>?sslmode=require"
docker-compose -f docker-compose.yml -f docker-compose.neon.yml up --build -d
```

Esto mantiene el servicio `db` local pero hace que la `app` use Neon.

4) Ejecutar migraciones con Drizzle
   - `drizzle.config.ts` ya usa `process.env.DATABASE_URL || process.env.NEON_DATABASE_URL`.
   - Para aplicar el esquema en Neon usa:

```bash
# desde la raíz del repo
export NEON_DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/<db>?sslmode=require"
npx drizzle-kit push --config drizzle.config.ts
```

Nota: `drizzle-kit` usa la URL definida en `drizzle.config.ts`. Si necesitas ejecutar SQL raw o revisar las migraciones genera/sincroniza los archivos en `drizzle/`.

5) Pooling y consideraciones runtime
   - El código detecta `NEON_DATABASE_URL` y usa `@neondatabase/serverless` (neon()) con `drizzle-orm/neon-http`. Esto es apropiado para Neon serverless.
   - No uses `pg.Pool` para Neon serverless; el paquete `@neondatabase/serverless` maneja conexiones HTTP.

6) Verificación
   - Revisa logs del contenedor app y/o llamadas a endpoints que hagan consultas a la DB (ej.: `/api/vehicles`, `/api/invoices`).
   - Valida que `drizzle` puede leer las tablas: `drizzle-kit status` o ejecutar queries desde la app.

7) Rollback
   - Mantén el servicio `db` local disponible durante pruebas; si Neon tiene problemas, desmonta el override y vuelve a la variable `DATABASE_URL` apuntando al `db` local:

```bash
docker-compose down
# unset NEON_DATABASE_URL or remove the override file
docker-compose up -d
```

8) Seguridad y producción
   - Usa un Secret Manager (GitHub Actions Secrets, Azure KeyVault, etc.) para almacenar `NEON_DATABASE_URL` en CI/CD.
   - Revisa los permisos de cuenta de la base de datos y restringe el acceso según sea necesario.

Extras útiles
- Para verificar tablas existentes puedes usar Adminer (ya viene en docker-compose: http://127.0.0.1:8081) pero recuerda que Adminer en local apunta al `db` local; para consultar Neon usa psql o la consola de Neon.
- Si usas Drizzle con Neon y ves incompatibilidades en queries, confirma la versión de `drizzle-orm` y `@neondatabase/serverless`.

Si quieres, puedo:
- Añadir un script en `package.json` para ejecutar `drizzle-kit` contra Neon de forma segura.
- Generar un pequeño `README` con pasos listos para CI/CD (GitHub Actions) que inyecte `NEON_DATABASE_URL` como secreto y ejecute migraciones.
