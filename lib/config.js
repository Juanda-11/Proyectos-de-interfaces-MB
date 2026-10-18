'use strict';

// Lee la configuración del entorno en cada llamada (facilita las pruebas).
const env = (name) => {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
};
exports.env = env;

exports.isProduction = () => env('VERCEL_ENV') === 'production' || env('NODE_ENV') === 'production';

exports.TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 días
exports.MAX_JSON_BYTES = 6 * 1024 * 1024; // las fotos viajan en base64
exports.MAX_PHOTO_CHARS = 150 * 1024; // miniatura guardada con la donación

// Orígenes permitidos para CORS ('*' por defecto: la API usa Bearer tokens, no cookies).
exports.allowedOrigins = () => (env('ALLOWED_ORIGINS') || '*').split(',').map((s) => s.trim());

// Credenciales de Upstash Redis. Acepta los nombres de la integración de Vercel (KV_REST_API_*).
exports.upstash = () => {
  const url = env('UPSTASH_REDIS_REST_URL') || env('KV_REST_API_URL');
  const token = env('UPSTASH_REDIS_REST_TOKEN') || env('KV_REST_API_TOKEN');
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
};
