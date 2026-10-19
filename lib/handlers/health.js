'use strict';

const { getStore } = require('../store');
const ai = require('../ai');
const { isProduction } = require('../config');

// GET /api/health — comprobación rápida de la configuración (no expone secretos).
module.exports = async () => {
  const storage = getStore().kind;
  return {
    ok: !(isProduction() && storage === 'memory'),
    service: 'foodlink-backend',
    time: new Date().toISOString(),
    storage,
    ...(isProduction() && storage === 'memory'
      ? { warning: 'Almacenamiento no configurado: faltan las credenciales de Upstash Redis (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).' }
      : {}),
    ai: ai.status(),
  };
};
