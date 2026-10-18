'use strict';

const { allowedOrigins, MAX_JSON_BYTES } = require('./config');
const { HttpError } = require('./errors');

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(payload === undefined ? '' : JSON.stringify(payload));
}
exports.send = send;

// CORS: la API se consume desde otro dominio (frontend) y desde apps nativas.
function applyCors(req, res) {
  const allowed = allowedOrigins();
  const origin = req.headers.origin;
  const value = allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : allowed[0];
  res.setHeader('Access-Control-Allow-Origin', value);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}
exports.applyCors = applyCors;

// Devuelve el cuerpo JSON ya parseado. Vercel entrega req.body; en local se lee el stream.
async function readJson(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'string') return parse(req.body);
    if (Buffer.isBuffer(req.body)) return parse(req.body.toString('utf8'));
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) throw new HttpError(413, 'payload_too_large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? parse(raw) : {};
}

function parse(text) {
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? value : {};
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}
exports.readJson = readJson;

exports.bearerToken = (req) => {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
};

exports.clientIp = (req) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || (req.socket && req.socket.remoteAddress) || 'unknown';
};
