'use strict';

const notifications = require('../models/notifications');

// GET /api/notifications → { notifications } del usuario autenticado
exports.list = async (ctx) => ({ notifications: await notifications.list((await ctx.user()).id) });

// POST /api/notifications/read-all → { updated }
exports.readAll = async (ctx) => ({ updated: await notifications.markAllRead((await ctx.user()).id) });
