'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getAuthSecret } = require('../lib/secret');

test('usa AUTH_SECRET cuando está definido', async () => {
  process.env.AUTH_SECRET = 'mi-secreto';
  assert.equal(await getAuthSecret(), 'mi-secreto');
  delete process.env.AUTH_SECRET;
});

test('genera y reutiliza un secreto aleatorio si falta', async () => {
  delete process.env.AUTH_SECRET;
  delete globalThis.__foodlinkSecret;
  const first = await getAuthSecret();
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(await getAuthSecret(), first);
});
