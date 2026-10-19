# FoodLink Backend

API REST de **FoodLink**, la app que reduce el desperdicio de alimentos conectando donantes y receptores.
Corre como **función serverless en Vercel**, **sin dependencias de npm**, y guarda los datos en **Upstash Redis**.

> Frontend (React Native / Expo, web + móvil): [Juanda-11/Proyectos-de-interfaces](https://github.com/Juanda-11/Proyectos-de-interfaces)

## Qué hace
- **Cuentas con dos roles** (donante / receptor): registro, login, perfil, cambio de contraseña y borrado.
  Contraseñas con `scrypt`, tokens firmados con HMAC-SHA256.
- **Donaciones con ciclo de vida**: `available → reserved → onTheWay → collected` (o `cancelled`), con reglas
  por rol y **código de entrega** que solo ve el donante.
- **Notificaciones** por cada cambio de etapa.
- **Análisis de alimentos con IA** (`/api/analyze`): Gemini (plan gratuito) o Claude, a partir de una foto.
- Control de concurrencia (bloqueos), límite de peticiones y validación de entradas.

Referencia completa de endpoints: [`docs/API.md`](docs/API.md).

## Estructura
```
api/router.js        Única función de Vercel (vercel.json reescribe /api/* hacia ella)
lib/app.js           CORS, enrutado y manejo de errores
lib/routes.js        Tabla de rutas
lib/handlers/        auth, donations, notifications, analyze, demo, health
lib/domain/          Reglas de transición de una donación (funciones puras)
lib/models/          Repositorios: users, donations, notifications
lib/store/           Almacén: Upstash Redis (producción) o memoria (desarrollo)
lib/ai/              Proveedores Gemini y Anthropic, prompt y normalización
scripts/dev-server.js  Servidor local
test/                Pruebas con node:test
```

## Desarrollo local
Requiere Node 20 o superior. No hay `npm install` que hacer.

```bash
cp .env.example .env.local   # opcional: claves de IA
npm run dev                  # http://localhost:3000/api/health
npm test                     # 80+ pruebas
```

Sin credenciales de Upstash usa memoria (los datos se pierden al reiniciar).

### Cuentas de demostración
| Rol | Correo | Contraseña |
| --- | --- | --- |
| Receptor | `receptor@foodlink.app` | `demo1234` |
| Donante | `donante@foodlink.app` | `demo1234` |

El código de entrega de cada donación solo lo ve el donante: para completar una entrega como receptor,
ábrela con la cuenta de donante y muestra el código (o escanea el QR).

## Producción
La API está desplegada en Vercel (una función serverless) con Upstash Redis como base de datos:
<https://backend-foodlink.vercel.app/api/health>

## Decisiones de diseño
- **Una sola función serverless** que enruta internamente: evita el límite de funciones del plan gratuito y
  comparte el arranque en frío.
- **Sin dependencias**: usa `fetch` y `crypto` de Node; menos superficie de ataque y despliegues más rápidos.
- **Reglas de negocio puras** (`lib/domain`) separadas del acceso a datos, por eso son fáciles de probar.
- **Redis con bloqueos cortos** para que dos receptores no reserven la misma donación a la vez.
