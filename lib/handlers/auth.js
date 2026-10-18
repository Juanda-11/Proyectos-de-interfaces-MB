'use strict';

const { reply } = require('../app');
const { rateLimit } = require('../rateLimit');
const { clientIp } = require('../http');
const { issueToken } = require('../auth');
const { registerInput, loginInput } = require('../validators');
const users = require('../models/users');
const { HttpError } = require('../errors');

// POST /api/auth/register → 201 { token, user }
exports.register = async (ctx) => {
  await rateLimit(`register:${clientIp(ctx.req)}`, { max: 10, windowSeconds: 600 });
  const input = registerInput(await ctx.body());
  const user = await users.createUser(input);
  return reply(201, { token: await issueToken(user), user: users.publicUser(user) });
};
