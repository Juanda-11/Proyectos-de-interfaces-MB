'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetMemoryStore } = require('../lib/store');
const users = require('../lib/models/users');

const input = { name: 'Ana', email: 'ana@test.com', password: 'secreto1', role: 'donor' };

test('crea, busca y no expone el hash', async () => {
  resetMemoryStore();
  const user = await users.createUser(input);
  assert.ok(user.id.startsWith('u-'));
  assert.equal((await users.findByEmail('ana@test.com')).id, user.id);
  assert.equal((await users.findById(user.id)).name, 'Ana');
  assert.equal(users.publicUser(user).passwordHash, undefined);
});

test('rechaza correos repetidos', async () => {
  resetMemoryStore();
  await users.createUser(input);
  await assert.rejects(() => users.createUser(input), (e) => e.status === 409 && e.code === 'email_taken');
});

test('verifyCredentials', async () => {
  resetMemoryStore();
  const user = await users.createUser(input);
  assert.equal((await users.verifyCredentials('ana@test.com', 'secreto1')).id, user.id);
  assert.equal(await users.verifyCredentials('ana@test.com', 'mala'), null);
  assert.equal(await users.verifyCredentials('nadie@test.com', 'secreto1'), null);
});

test('actualizar, cambiar contraseña y borrar', async () => {
  resetMemoryStore();
  const user = await users.createUser(input);
  assert.equal((await users.updateUser(user.id, { phone: '300' })).phone, '300');
  await users.setPassword(user.id, 'nueva-clave');
  assert.ok(await users.verifyCredentials('ana@test.com', 'nueva-clave'));
  assert.equal(await users.verifyCredentials('ana@test.com', 'secreto1'), null);
  await users.deleteUser(user.id);
  assert.equal(await users.findByEmail('ana@test.com'), null);
  assert.equal(await users.updateUser(user.id, {}), null);
});
