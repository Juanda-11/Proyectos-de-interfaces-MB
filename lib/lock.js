'use strict';

const { getStore } = require('./store');
const { conflict } = require('./errors');

// Bloqueo corto por clave (SET NX con expiración) para que dos usuarios no cambien
// la misma donación a la vez (p. ej. dos reservas simultáneas).
async function withLock(name, fn, { ttlSeconds = 10, retries = 20, waitMs = 50 } = {}) {
  const store = getStore();
  const key = `lock:${name}`;
  let acquired = false;
  for (let i = 0; i < retries && !acquired; i++) {
    acquired = await store.setnx(key, '1', ttlSeconds);
    if (!acquired) await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  if (!acquired) throw conflict('busy');
  try {
    return await fn();
  } finally {
    await store.del(key);
  }
}

module.exports = { withLock };
