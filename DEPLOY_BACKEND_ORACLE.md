# Despliegue ABR Backend en Oracle Cloud

Contexto actual:

- Oracle Cloud Always Free, Ubuntu 24.04 ARM64.
- Docker y Docker Compose ya instalados.
- Nginx instalado en el host.
- Nginx ya redirige trafico publico a `http://127.0.0.1:3000`.
- Frontend en Vercel.
- Base de datos PostgreSQL en Supabase.

Nota importante: este backend actualmente usa **TypeORM**, no Prisma. Por eso no hay pasos de `prisma generate` ni migraciones Prisma.

## Archivos agregados

- `Dockerfile`: construye el backend NestJS para produccion.
- `.dockerignore`: evita copiar basura o secretos al build.
- `compose.yaml`: levanta el backend en Docker y publica solo `127.0.0.1:3000`.
- `.env.production.example`: plantilla para Supabase y Vercel.

## 1. Subir el backend al servidor

Ruta recomendada segun tu estructura:

```bash
cd /opt/inventarios/app
```

Con Git:

```bash
git clone TU_REPO .
cd abr-backend
```

Si copias desde tu maquina:

```bash
scp -r abr-backend ubuntu@IP_DE_TU_INSTANCIA:/opt/inventarios/app/abr-backend
```

## 2. Crear `.env`

En el servidor:

```bash
cd /opt/inventarios/app/abr-backend
cp .env.production.example .env
nano .env
```

Ejemplo para Supabase:

```env
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://TU_FRONTEND.vercel.app
CORS_PREVIEW_SUFFIXES=.vercel.app

DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.PROJECT_REF
DB_PASSWORD=TU_PASSWORD_SUPABASE
DB_DATABASE=postgres
DB_SYNC=true
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

SESSION_SECRET=UNA_CLAVE_LARGA_Y_ALEATORIA
```

Generar `SESSION_SECRET`:

```bash
openssl rand -base64 48
```

Sobre Supabase:

- Si usas el **Transaction pooler**, normalmente el puerto es `6543`.
- Si usas conexion directa, normalmente el puerto es `5432`.
- Copia `host`, `user`, `password` y `database` desde Supabase Project Settings > Database.

Nota: `DB_SYNC=true` deja que TypeORM cree/actualice tablas al arrancar. Para el primer despliegue puede ser practico. Cuando ya haya datos reales, conviene pasar a migraciones y cambiar a `DB_SYNC=false`.

## 3. Construir y levantar Docker

```bash
docker compose build
docker compose up -d
docker compose ps
```

El contenedor expone:

- Interno: `4000`
- Host local: `127.0.0.1:3000`

Esto coincide con tu Nginx actual.

## 4. Verificar localmente en el servidor

```bash
curl http://127.0.0.1:3000/health
```

Respuesta esperada:

```json
{"ok":true,"service":"abr-backend","timestamp":"..."}
```

Probar GraphQL:

```bash
curl -X POST http://127.0.0.1:3000/graphql \
  -H "content-type: application/json" \
  -d '{"query":"query { __typename }"}'
```

Respuesta esperada:

```json
{"data":{"__typename":"Query"}}
```

Logs:

```bash
docker compose logs -f backend
```

## 5. Verificar Nginx publico

Como tu Nginx ya apunta a `127.0.0.1:3000`, prueba desde tu maquina:

```bash
curl http://TU_DOMINIO_O_IP/health
```

Si usas dominio para API, el frontend debe apuntar a:

```env
NUXT_GRAPHQL_ENDPOINT=https://api.tu-dominio.com/graphql
```

Si aun no hay HTTPS:

```env
NUXT_GRAPHQL_ENDPOINT=http://TU_IP_O_DOMINIO/graphql
```

## 6. HTTPS con Certbot

Cuando el dominio apunte a la IP publica de Oracle:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.tu-dominio.com
```

Luego cambia en Vercel:

```env
NUXT_GRAPHQL_ENDPOINT=https://api.tu-dominio.com/graphql
```

Y en el `.env` del backend:

```env
CORS_ORIGIN=https://TU_FRONTEND.vercel.app
```

Reinicia:

```bash
docker compose up -d --build
```

## 7. Actualizar despliegue

```bash
cd /opt/inventarios/app/abr-backend
git pull
docker compose build
docker compose up -d
docker compose logs -n 100 backend
```

## 8. Rollback simple

Si despliegas con Git:

```bash
cd /opt/inventarios/app/abr-backend
git log --oneline -5
git checkout COMMIT_ANTERIOR
docker compose up -d --build
```

Para volver a la rama principal:

```bash
git checkout main
```

## 9. Comandos utiles

Estado:

```bash
docker compose ps
```

Logs:

```bash
docker compose logs -f backend
```

Reiniciar:

```bash
docker compose restart backend
```

Detener:

```bash
docker compose down
```

Entrar al contenedor:

```bash
docker compose exec backend sh
```
