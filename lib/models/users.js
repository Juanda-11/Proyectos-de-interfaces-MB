'use strict';

const crypto = require('node:crypto');
const { getStore } = require('../store');
const { hashPassword, verifyPassword } = require('../password');
const { conflict } = require('../errors');

const USERS = 'users'; // id → JSON
const BY_EMAIL = 'users:email'; // correo → id

const publicUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};
exports.publicUser = publicUser;

async function findById(id) {
  const raw = await getStore().hget(USERS, id);
  return raw ? JSON.parse(raw) : null;
}
exports.findById = findById;

exports.findByEmail = async (email) => {
  const id = await getStore().hget(BY_EMAIL, email);
  return id ? findById(id) : null;
};
