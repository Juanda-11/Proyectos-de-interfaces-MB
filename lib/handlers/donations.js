'use strict';

const { reply } = require('../app');
const { requireRole } = require('../auth');
const { donationInput } = require('../validators');
const { notFound } = require('../errors');
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
