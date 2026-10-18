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
