'use strict';

const { forbidden } = require('../errors');
const { resetDemo } = require('../seed');

// POST /api/demo/reset — solo cuentas @foodlink.app (demo). Restablece donaciones y notificaciones.
exports.reset = async (ctx) => {
  const user = await ctx.user();
  if (!user.email.endsWith('@foodlink.app')) throw forbidden('demo_accounts_only');
  await resetDemo();
  return { ok: true };
};
