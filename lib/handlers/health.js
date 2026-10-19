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
      ? { warning: 'Sin base de datos: conecta Upstash Redis en Vercel (Storage) y haz Redeploy. Ver docs/DEPLOY.md' }
      : {}),
    ai: ai.status(),
  };
};
