'use strict';

const { getStore } = require('../store');
const ai = require('../ai');

// GET /api/health — comprobación rápida de la configuración (no expone secretos).
module.exports = async () => ({
  ok: true,
  service: 'foodlink-backend',
  time: new Date().toISOString(),
  storage: getStore().kind,
  ai: ai.status(),
});
