'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetMemoryStore } = require('../lib/store');
const { mockReq } = require('./helpers');
const auth = require('../lib/auth');
const users = require('../lib/models/users');

const withToken = (token) => mockReq({ headers: { Authorization: `Bearer ${token}` } });

test('requireUser acepta un token válido', async () => {
  resetMemoryStore();
  const user = await users.createUser({ name: 'Ana', email: 'a@b.co', password: 'secreto1', role: 'donor' });
  const token = await auth.issueToken(user);
  assert.equal((await auth.requireUser(withToken(token))).id, user.id);
});

test('requireUser rechaza ausente, inválido y usuario borrado', async () => {
  resetMemoryStore();
  await assert.rejects(() => auth.requireUser(mockReq()), (e) => e.code === 'missing_token');
  await assert.rejects(() => auth.requireUser(withToken('a.b')), (e) => e.code === 'invalid_token');
  const user = await users.createUser({ name: 'Ana', email: 'a@b.co', password: 'secreto1', role: 'donor' });
  const token = await auth.issueToken(user);
  await users.deleteUser(user.id);
  await assert.rejects(() => auth.requireUser(withToken(token)), (e) => e.status === 401);
});

test('requireRole', () => {
  assert.doesNotThrow(() => auth.requireRole({ role: 'donor' }, 'donor'));
  assert.throws(() => auth.requireRole({ role: 'receiver' }, 'donor'), (e) => e.status === 403 && e.code === 'donor_only');
});
