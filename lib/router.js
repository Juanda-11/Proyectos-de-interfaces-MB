'use strict';

// Router mínimo: patrones como /donations/:id/reserve → { id }.
const routes = [];

function compile(pattern) {
  const keys = [];
  const source = pattern
    .split('/')
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith(':')) {
        keys.push(part.slice(1));
        return '([^/]+)';
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { regex: new RegExp(`^/${source}/?$`), keys };
}

exports.route = (method, pattern, handler) => {
  routes.push({ method, ...compile(pattern), handler });
};

// Devuelve { handler, params } o { allowed: [métodos] } si la ruta existe con otro método.
exports.match = (method, path) => {
  const allowed = [];
  for (const r of routes) {
    const m = r.regex.exec(path);
    if (!m) continue;
    if (r.method !== method) {
      allowed.push(r.method);
      continue;
    }
    const params = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    return { handler: r.handler, params };
  }
  return allowed.length ? { allowed } : null;
};

exports.clear = () => (routes.length = 0);
exports.all = () => routes.map((r) => `${r.method} ${r.regex.source}`);
