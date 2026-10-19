# Despliegue en Vercel

## 1. Crear el proyecto
1. En [vercel.com/new](https://vercel.com/new) importa este repositorio.
2. No cambies nada: `vercel.json` ya define la función (`api/router.js`) y la página de inicio (`public/`).

## 2. Base de datos (obligatoria): Upstash Redis
Vercel es *serverless*: no hay disco ni memoria compartida, así que las cuentas y donaciones necesitan una base de datos.

1. En el proyecto de Vercel abre **Storage → Create Database** (o **Marketplace**) y elige **Upstash Redis** (plan gratuito).
2. Conéctala al proyecto. Vercel agrega solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`
   (el backend también acepta `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).

## 3. IA para el análisis de fotos
En **Settings → Environment Variables** agrega **una** de estas claves:

- `GEMINI_API_KEY` — gratis, desde <https://aistudio.google.com/apikey> (recomendado).
- `ANTHROPIC_API_KEY` — de pago, desde <https://console.anthropic.com>.

Las claves nunca se escriben en el repositorio ni llegan al navegador.

## 4. Redeploy y comprobación
Después de agregar variables haz **Deployments → Redeploy**. Luego abre:

```
https://TU-BACKEND.vercel.app/api/health
```

Debe mostrar `"storage": "upstash"` y `"ai": { "configured": true, "provider": "gemini" }`.

## 5. Conectar el frontend
En el proyecto de Vercel del **frontend** define `EXPO_PUBLIC_API_URL=https://TU-BACKEND.vercel.app`
y vuelve a desplegar (la variable se incorpora al compilar).

Opcional: `ALLOWED_ORIGINS` limita qué sitios pueden llamar a la API (por defecto cualquiera, `*`).
Lista separada por comas; se ignora la barra final y admite `*` como comodín. Como Vercel crea una URL distinta por
despliegue, lo más cómodo es un patrón: `ALLOWED_ORIGINS=https://foodlink-*.vercel.app`.

## Solución de problemas
| Síntoma | Causa probable |
| --- | --- |
| `/api/health` muestra `"storage": "memory"` | Falta conectar Upstash o hacer Redeploy |
| El login funciona y luego "se pierde" la sesión | Mismo caso: sin Redis cada instancia tiene datos distintos |
| `ai.configured: false` | Falta `GEMINI_API_KEY`/`ANTHROPIC_API_KEY` o Redeploy |
| En la consola: "blocked by CORS policy ... Access-Control-Allow-Origin" | `ALLOWED_ORIGINS` no coincide con la URL desde la que abres el frontend (otra URL de despliegue, o falta el comodín). Bórrala o usa un patrón |
| Análisis con `502 upstream_error` | Mira `details` en la respuesta: clave inválida o sin cuota |
