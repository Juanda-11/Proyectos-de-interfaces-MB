'use strict';

// Normaliza un origen: minúsculas y sin "/" final ("https://app.vercel.app/" → "https://app.vercel.app").
// Un origen del navegador nunca lleva barra final, así que una variable escrita con ella nunca coincidiría.
const normalizeOrigin = (value) => String(value || '').trim().toLowerCase().replace(/\/+$/, '');
exports.normalizeOrigin = normalizeOrigin;

// Compara contra un patrón que admite "*" como comodín (p. ej. https://foodlink-*.vercel.app,
// útil para que también funcionen las URLs de cada despliegue de Vercel).
const matches = (pattern, origin) => {
  if (pattern === '*') return true;
  const source = pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${source}$`).test(origin);
};

// Devuelve el valor para Access-Control-Allow-Origin, o null si el origen no está permitido.
exports.resolveOrigin = (allowedList, requestOrigin) => {
  const allowed = allowedList.map(normalizeOrigin).filter(Boolean);
  if (allowed.includes('*')) return '*';
  const origin = normalizeOrigin(requestOrigin);
  return origin && allowed.some((pattern) => matches(pattern, origin)) ? requestOrigin.trim() : null;
};
