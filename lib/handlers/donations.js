'use strict';

const { reply } = require('../app');
const { requireRole } = require('../auth');
const { donationInput } = require('../validators');
const { notFound } = require('../errors');
const { withLock } = require('../lock');
const transitions = require('../domain/transitions');
const donations = require('../models/donations');
const notifications = require('../models/notifications');

// GET /api/donations → { donations } (el código de entrega solo lo ve el donante)
exports.list = async (ctx) => {
  const user = await ctx.user();
  return { donations: (await donations.list()).map((d) => donations.serialize(d, user)) };
};

// GET /api/donations/:id → { donation }
exports.get = async (ctx) => {
  const user = await ctx.user();
  const donation = await donations.get(ctx.params.id);
  if (!donation) throw notFound('donation_not_found');
  return { donation: donations.serialize(donation, user) };
};

// POST /api/donations (solo donantes) → 201 { donation }
exports.create = async (ctx) => {
  const user = requireRole(await ctx.user(), 'donor');
  const donation = await donations.create(user, donationInput(await ctx.body()));
  await notifications.add(user.id, 'published', donation);
  return reply(201, { donation: donations.serialize(donation, user) });
};

// Aplica una transición bajo bloqueo: lee, valida la regla, guarda y notifica.
async function transition(ctx, apply) {
  const user = await ctx.user();
  const body = ctx.body ? await ctx.body().catch(() => ({})) : {};
  return withLock(`donation:${ctx.params.id}`, async () => {
    const current = await donations.get(ctx.params.id);
    if (!current) throw notFound('donation_not_found');
    const { donation, notify } = apply(current, user, body);
    await donations.save(donation);
    for (const n of notify) await notifications.add(n.userId, n.type, donation);
    return { donation: donations.serialize(donation, user) };
  });
}

// POST /api/donations/:id/{reserve|pickup|deliver|cancel}
exports.reserve = (ctx) => transition(ctx, (d, u) => transitions.reserve(d, u));
exports.pickup = (ctx) => transition(ctx, (d, u) => transitions.startPickup(d, u));
exports.deliver = (ctx) => transition(ctx, (d, u, body) => transitions.deliver(d, u, body.code));
exports.cancel = (ctx) => transition(ctx, (d, u) => transitions.cancel(d, u));
