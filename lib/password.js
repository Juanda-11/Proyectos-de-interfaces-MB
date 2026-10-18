'use strict';

const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// Formato almacenado: scrypt$<sal hex>$<hash hex>
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(String(password), salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}
exports.hashPassword = hashPassword;

async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scrypt(String(password), Buffer.from(saltHex, 'hex'), expected.length);
  // Comparación en tiempo constante para no filtrar información por tiempos.
  return crypto.timingSafeEqual(derived, expected);
}
exports.verifyPassword = verifyPassword;
