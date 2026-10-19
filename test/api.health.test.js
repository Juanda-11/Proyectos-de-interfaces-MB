'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { call } = require('./helpers');
const { routePath } = require('../lib/app');

test('GET /health responde con almacenamiento e IA', async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.KV_REST_API_URL;
  const { status, json } = await call('GET', '/health');
  assert.equal(status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.storage, 'memory');
  assert.ok('ai' in json);
});

test('rutas desconocidas → 404 y métodos incorrectos → 405', async () => {
  assert.equal((await call('GET', '/nada')).status, 404);
  const r = await call('POST', '/health');
  assert.equal(r.status, 405);
  assert.equal(r.headers.allow, 'GET');
});

test('OPTIONS devuelve 204 con CORS', async () => {
  const r = await call('OPTIONS', '/health');
  assert.equal(r.status, 204);
  assert.equal(r.headers['access-control-allow-origin'], '*');
});

test('routePath entiende ?route= (Vercel) y la URL directa (local)', () => {
  assert.equal(routePath({ url: '/api/router?route=donations/abc/reserve' }), '/donations/abc/reserve');
  assert.equal(routePath({ url: '/api/health' }), '/health');
  assert.equal(routePath({ url: '/api/router', query: { route: ['a', 'b'] } }), '/a/b');
});

test('en producción con memoria: /health avisa y el resto responde 503', async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.KV_REST_API_URL;
  process.env.VERCEL_ENV = 'production';
  try {
    const health = await call('GET', '/health');
    assert.equal(health.json.ok, false);
    assert.match(health.json.warning, /Upstash/);
    const login = await call('POST', '/auth/login', { body: { email: 'a@b.co', password: 'secreto1' } });
    assert.equal(login.status, 503);
    assert.equal(login.json.error, 'storage_not_configured');
  } finally {
    delete process.env.VERCEL_ENV;
  }
});
