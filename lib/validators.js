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
