'use strict';

const { reply } = require('../app');
const { rateLimit } = require('../rateLimit');
const { clientIp } = require('../http');
const { issueToken } = require('../auth');
const { registerInput, loginInput, profileInput, passwordChangeInput } = require('../validators');
const users = require('../models/users');
const notifications = require('../models/notifications');
const { HttpError } = require('../errors');

// POST /api/auth/register → 201 { token, user }
exports.register = async (ctx) => {
  await rateLimit(`register:${clientIp(ctx.req)}`, { max: 10, windowSeconds: 600 });
  const input = registerInput(await ctx.body());
  const user = await users.createUser(input);
  return reply(201, { token: await issueToken(user), user: users.publicUser(user) });
};

// POST /api/auth/login → { token, user }. Si se indica role y no coincide → 403 role_mismatch.
exports.login = async (ctx) => {
  await rateLimit(`login:${clientIp(ctx.req)}`, { max: 30, windowSeconds: 600 });
  const { email, password, role } = loginInput(await ctx.body());
  const user = await users.verifyCredentials(email, password);
  if (!user) throw new HttpError(401, 'invalid_credentials');
  if (role && user.role !== role) throw new HttpError(403, 'role_mismatch', { role: user.role });
  return { token: await issueToken(user), user: users.publicUser(user) };
};

// GET /api/auth/me → { user }
exports.me = async (ctx) => ({ user: users.publicUser(await ctx.user()) });

// PATCH /api/auth/me { name?, phone?, address? } → { user }
exports.updateMe = async (ctx) => {
  const user = await ctx.user();
  const patch = profileInput(await ctx.body());
  return { user: users.publicUser(await users.updateUser(user.id, patch)) };
};

// POST /api/auth/password { current, next }
exports.changePassword = async (ctx) => {
  const user = await ctx.user();
  const { current, next } = passwordChangeInput(await ctx.body());
  if (!(await users.verifyCredentials(user.email, current))) throw new HttpError(400, 'wrong_current_password');
  await users.setPassword(user.id, next);
  return { ok: true };
};

// DELETE /api/auth/me — borra la cuenta y sus notificaciones.
exports.deleteMe = async (ctx) => {
  const user = await ctx.user();
  await users.deleteUser(user.id);
  await notifications.clear(user.id);
  return { ok: true };
};
