# Referencia de la API

Base: `https://backend-foodlink.vercel.app/api` (en local: `http://localhost:3000/api`). Todas las respuestas son JSON. Los errores tienen la forma
`{ "error": "codigo", "details": { ... } }`.

La autenticación usa `Authorization: Bearer <token>` (el token se obtiene en `/auth/register` o `/auth/login`
y dura 30 días).

## Estado

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | no | `{ ok, storage: "upstash"\|"memory", ai: { configured, provider } }` |
| GET | `/analyze` | no | Estado de la IA (proveedor configurado) |

## Autenticación

| Método | Ruta | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password, role: "donor"\|"receiver" }` | `201 { token, user }` · `409 email_taken` |
| POST | `/auth/login` | `{ email, password, role? }` | `{ token, user }` · `401 invalid_credentials` · `403 role_mismatch { details.role }` |
| GET | `/auth/me` | — | `{ user }` |
| PATCH | `/auth/me` | `{ name?, phone?, address? }` | `{ user }` |
| POST | `/auth/password` | `{ current, next }` | `{ ok }` · `400 wrong_current_password` |
| DELETE | `/auth/me` | — | `{ ok }` |

## Donaciones

El ciclo de vida es `available → reserved → onTheWay → collected` (o `cancelled`).

| Método | Ruta | Quién | Descripción |
| --- | --- | --- | --- |
| GET | `/donations` | cualquiera | Lista todas. El campo `code` solo lo ve el donante dueño |
| GET | `/donations/:id` | cualquiera | Detalle |
| POST | `/donations` | donante | Crea una donación → `201 { donation }` |
| POST | `/donations/:id/reserve` | receptor | `available → reserved` |
| POST | `/donations/:id/pickup` | receptor que reservó | `reserved → onTheWay` |
| POST | `/donations/:id/deliver` | receptor (con `{ code }`) o donante | `onTheWay → collected` · `400 wrong_code` |
| POST | `/donations/:id/cancel` | donante o receptor involucrado | → `cancelled` |

Errores de reglas: `403` (rol/propiedad), `409` (estado inválido, p. ej. ya reservada), `404 donation_not_found`.

Cuerpo de `POST /donations`: `title` (obligatorio), `lat`, `lng` (obligatorios), `category`
(`bakery|fruits|vegetables|meals|dairy|other`), `qty`, `kg`, `shelfLifeDays`, `freshness` (`good|fair|poor`),
`address`, `notes`, `ai` (boolean), `photo` (data URI de una miniatura, máx. 150 KB).

## Notificaciones

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/notifications` | Las del usuario autenticado, recientes primero |
| POST | `/notifications/read-all` | Marca todas como leídas → `{ updated }` |

## Análisis con IA

`POST /analyze` con `{ image: "<base64>", mediaType?: "image/jpeg", lang?: "es"|"en" }` (requiere sesión,
máx. 20 por minuto por usuario). Devuelve:

```json
{ "isFood": true, "name": "Pan de yuca", "category": "bakery", "quantityText": "10 unidades",
  "weightKg": 1.5, "freshness": "good", "shelfLifeDays": 2, "storage": "...",
  "allergens": ["lactosa"], "safeToDonate": true, "notes": "...", "confidence": 0.92 }
```

Errores: `503 ai_not_configured`, `413 image_too_large`, `502 upstream_error { details }`, `429 rate_limited`.

## Demo

`POST /demo/reset` restablece las donaciones y notificaciones de ejemplo (solo cuentas `@foodlink.app`).
