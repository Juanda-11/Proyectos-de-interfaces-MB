'use strict';

const { bearerToken } = require('./http');
const { getAuthSecret } = require('./secret');
const { signToken, verifyToken } = require('./token');
const { unauthorized, forbidden } = require('./errors');
const users = require('./models/users');

exports.issueToken = async (user) => signToken({ sub: user.id }, await getAuthSecret());

// Devuelve el usuario autenticado o lanza 401 (token ausente, inválido o usuario borrado).
exports.requireUser = async (req) => {
  const token = bearerToken(req);
  if (!token) throw unauthorized('missing_token');
  const payload = verifyToken(token, await getAuthSecret());
  if (!payload) throw unauthorized('invalid_token');
  const user = await users.findById(payload.sub);
  if (!user) throw unauthorized('invalid_token');
  return user;
};

exports.requireRole = (user, role) => {
  if (user.role !== role) throw forbidden(`${role}_only`);
  return user;
};
