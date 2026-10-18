'use strict';

const crypto = require('node:crypto');
const { TOKEN_TTL_SECONDS } = require('./config');

// Token firmado con HMAC-SHA256 (estilo JWT mínimo): base64url(payload).base64url(firma)
const b64 = (input) => Buffer.from(input).toString('base64url');
const sign = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

function signToken(payload, secret, ttl = TOKEN_TTL_SECONDS) {
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttl }));
  return `${body}.${sign(body, secret)}`;
}
exports.signToken = signToken;
