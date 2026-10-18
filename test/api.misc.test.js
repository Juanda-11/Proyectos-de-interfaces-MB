'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetMemoryStore } = require('../lib/store');
const { call } = require('./helpers');

async function login(email, role) {
  resetMemoryStore();
  delete globalThis.__foodlinkSeeded;
  delete globalThis.__foodlinkSecret;
  return (await call('POST', '/auth/login', { body: { email, password: 'demo1234', role } })).json.token;
}

test('notificaciones: el receptor demo tiene que marcarlas como leídas', async () => {
  const donor = await login('donante@foodlink.app', 'donor');
  const id = (await call('POST', '/donations', { token: donor, body: { title: 'Pan', lat: 1.2, lng: -77.2 } })).json.donation.id;
  const receiver = (await call('POST', '/auth/login', { body: { email: 'receptor@foodlink.app', password: 'demo1234' } })).json.token;
  await call('POST', `/donations/${id}/reserve`, { token: receiver });
  const before = (await call('GET', '/notifications', { token: donor })).json.notifications;
  assert.ok(before.some((n) => n.type === 'reserved' && !n.read));
  assert.equal((await call('POST', '/notifications/read-all', { token: donor })).json.updated, 2);
  assert.ok((await call('GET', '/notifications', { token: donor })).json.notifications.every((n) => n.read));
});

test('demo/reset solo para cuentas demo', async () => {
  const donor = await login('donante@foodlink.app', 'donor');
  await call('POST', '/donations', { token: donor, body: { title: 'Extra', lat: 1.2, lng: -77.2 } });
  assert.equal((await call('GET', '/donations', { token: donor })).json.donations.length, 6);
  assert.equal((await call('POST', '/demo/reset', { token: donor })).status, 200);
  assert.equal((await call('GET', '/donations', { token: donor })).json.donations.length, 5);
  const other = (await call('POST', '/auth/register', { body: { name: 'Pepe Real', email: 'pepe@real.com', password: 'secreto1', role: 'donor' } })).json.token;
  assert.equal((await call('POST', '/demo/reset', { token: other })).status, 403);
});

test('analyze: requiere sesión, valida la imagen y usa el proveedor', async () => {
  const token = await login('receptor@foodlink.app', 'receiver');
  assert.equal((await call('POST', '/analyze', { body: {} })).status, 401);
  assert.equal((await call('POST', '/analyze', { token, body: { image: 'corta' } })).json.error, 'image_required');
  const image = 'x'.repeat(200);
  assert.equal((await call('POST', '/analyze', { token, body: { image, mediaType: 'image/gif' } })).json.error, 'bad_media_type');
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  assert.equal((await call('POST', '/analyze', { token, body: { image } })).status, 503);

  process.env.GEMINI_API_KEY = 'g';
  const original = global.fetch;
  global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"isFood":true,"name":"Pan de yuca","category":"bakery"}' }] } }] }) });
  try {
    const r = await call('POST', '/analyze', { token, body: { image } });
    assert.equal(r.status, 200);
    assert.equal(r.json.name, 'Pan de yuca');
    assert.equal((await call('GET', '/analyze')).json.provider, 'gemini');
  } finally {
    global.fetch = original;
    delete process.env.GEMINI_API_KEY;
  }
});
