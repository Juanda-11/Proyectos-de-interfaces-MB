'use strict';

const v = require('./validate');
const { MAX_PHOTO_CHARS } = require('./config');
const { badRequest } = require('./errors');

exports.ROLES = ['donor', 'receiver'];
exports.CATEGORIES = ['bakery', 'fruits', 'vegetables', 'meals', 'dairy', 'other'];
exports.FRESHNESS = ['good', 'fair', 'poor'];

exports.registerInput = (body) => ({
  name: v.text(body.name, 'name', { min: 2, max: 80 }),
  email: v.email(body.email),
  password: v.password(body.password),
  role: v.oneOf(body.role, exports.ROLES, 'role'),
});

exports.loginInput = (body) => ({
  email: v.email(body.email),
  password: v.password(body.password),
  role: v.oneOf(body.role, exports.ROLES, 'role', null),
});

exports.profileInput = (body) => {
  const patch = {};
  if (body.name !== undefined) patch.name = v.text(body.name, 'name', { min: 2, max: 80 });
  if (body.phone !== undefined) patch.phone = v.text(body.phone, 'phone', { max: 30, optional: true });
  if (body.address !== undefined) patch.address = v.text(body.address, 'address', { max: 160, optional: true });
  if (Object.keys(patch).length === 0) throw badRequest('nothing_to_update');
  return patch;
};

exports.passwordChangeInput = (body) => ({
  current: v.password(body.current, 'current'),
  next: v.password(body.next, 'next'),
});
