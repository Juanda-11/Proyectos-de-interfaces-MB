'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../lib/password');

test('hash distinto en cada llamada pero verificable', async () => {
  const a = await hashPassword('secreto1');
  const b = await hashPassword('secreto1');
  assert.notEqual(a, b);
  assert.match(a, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.equal(await verifyPassword('secreto1', a), true);
  assert.equal(await verifyPassword('secreto1', b), true);
});

test('rechaza contraseñas incorrectas y formatos inválidos', async () => {
  const a = await hashPassword('secreto1');
  assert.equal(await verifyPassword('otra', a), false);
  assert.equal(await verifyPassword('x', 'texto-plano'), false);
  assert.equal(await verifyPassword('x', undefined), false);
});
