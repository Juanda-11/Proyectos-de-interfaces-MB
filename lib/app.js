'use strict';

const { applyCors, send, sendError, readJson } = require('./http');
const { requireUser } = require('./auth');
const { HttpError } = require('./errors');
const router = require('./router');
const { ensureSeeded } = require('./seed');
const { isProduction } = require('./config');
const { getStore } = require('./store');

// Obtiene la ruta solicitada: Vercel la reescribe a ?route=... (ver vercel.json);
// en local se toma de la URL.
function routePath(req) {
  const url = new URL(req.url, 'http://localhost');
  let path = url.searchParams.get('route');
  if (path === null && req.query && req.query.route !== undefined) {
    path = Array.isArray(req.query.route) ? req.query.route.join('/') : req.query.route;
  }
  if (path === null || path === undefined) path = url.pathname.replace(/^\/api/, '');
  return `/${String(path).replace(/^\/+/, '')}`;
}
exports.routePath = routePath;

// Punto de entrada único de la API: CORS → ruta → handler → respuesta JSON.
exports.handleRequest = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  try {
    const found = router.match(req.method, routePath(req));
    if (!found) throw new HttpError(404, 'not_found');
    if (found.allowed) {
      res.setHeader('Allow', found.allowed.join(', '));
      throw new HttpError(405, 'method_not_allowed');
    }
    const url = new URL(req.url, 'http://localhost');
    const ctx = {
      req,
      params: found.params,
      query: Object.fromEntries(url.searchParams),
      body: () => readJson(req),
      user: () => requireUser(req),
    };
    // En producción la memoria no sirve: cada instancia serverless tendría datos (y secreto de
    // firma) distintos, y las sesiones fallarían al azar. Mejor un error claro.
    if (!found.skipSeed && isProduction() && getStore().kind === 'memory') throw new HttpError(503, 'storage_not_configured');
    if (!found.skipSeed) await ensureSeeded();
    const result = await found.handler(ctx);
    if (result && result.__reply) return send(res, result.status, result.body);
    return send(res, 200, result === undefined ? { ok: true } : result);
  } catch (err) {
    return sendError(res, err);
  }
};

// Respuesta con código distinto de 200 (p. ej. 201 al crear).
exports.reply = (status, body) => ({ __reply: true, status, body });
