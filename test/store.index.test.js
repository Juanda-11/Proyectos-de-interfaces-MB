'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getStore, resetMemoryStore } = require('../lib/store');

test('sin credenciales usa memoria y reutiliza la instancia', () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.KV_REST_API_URL;
  resetMemoryStore();
  const a = getStore();
  assert.equal(a.kind, 'memory');
  assert.equal(getStore(), a);
});

test('con credenciales usa Upstash (también con nombres KV_*)', () => {
  process.env.KV_REST_API_URL = 'https://x.upstash.io/';
  process.env.KV_REST_API_TOKEN = 't';
  const s = getStore();
  assert.equal(s.kind, 'upstash');
  assert.equal(s.url, 'https://x.upstash.io');
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});
