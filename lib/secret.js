'use strict';

const crypto = require('node:crypto');
const { env } = require('./config');
const { getStore } = require('./store');

const SECRET_KEY = 'meta:auth-secret';

// El secreto de firma sale de AUTH_SECRET. Si no se configura, se genera uno aleatorio
// y se guarda en el almacén la primera vez, así no hace falta un paso extra de configuración.
async function getAuthSecret() {
  const configured = env('AUTH_SECRET');
  if (configured) return configured;
  if (globalThis.__foodlinkSecret) return globalThis.__foodlinkSecret;
  const store = getStore();
  const candidate = crypto.randomBytes(32).toString('hex');
  await store.setnx(SECRET_KEY, candidate);
  globalThis.__foodlinkSecret = await store.get(SECRET_KEY);
  return globalThis.__foodlinkSecret;
}

module.exports = { getAuthSecret };
