'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetMemoryStore } = require('../lib/store');
const { rateLimit } = require('../lib/rateLimit');

test('permite hasta el máximo y luego lanza 429', async () => {
  resetMemoryStore();
  for (let i = 0; i < 3; i++) await rateLimit('ip:1', { max: 3, windowSeconds: 60 });
  await assert.rejects(
    () => rateLimit('ip:1', { max: 3, windowSeconds: 60 }),
    (e) => e.status === 429 && e.code === 'rate_limited'
  );
});

test('cada clave tiene su propio contador', async () => {
  resetMemoryStore();
  await rateLimit('a', { max: 1, windowSeconds: 60 });
  await rateLimit('b', { max: 1, windowSeconds: 60 });
});
