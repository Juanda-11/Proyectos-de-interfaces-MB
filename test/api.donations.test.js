'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetMemoryStore } = require('../lib/store');
const { call } = require('./helpers');

async function setup() {
  resetMemoryStore();
  delete globalThis.__foodlinkSeeded;
  delete globalThis.__foodlinkSecret;
  const login = async (email, role) => (await call('POST', '/auth/login', { body: { email, password: 'demo1234', role } })).json.token;
  return { donor: await login('donante@foodlink.app', 'donor'), receiver: await login('receptor@foodlink.app', 'receiver') };
}
const input = { title: 'Pan de yuca', category: 'bakery', qty: '10 unidades', kg: 1.5, lat: 1.21, lng: -77.28, address: 'Centro' };

test('requiere sesión y lista las donaciones de ejemplo sin mostrar el código al receptor', async () => {
  const { donor, receiver } = await setup();
  assert.equal((await call('GET', '/donations')).status, 401);
  const asReceiver = (await call('GET', '/donations', { token: receiver })).json.donations;
  assert.equal(asReceiver.length, 5);
  assert.ok(asReceiver.every((d) => d.code === undefined));
  const asDonor = (await call('GET', '/donations', { token: donor })).json.donations;
  assert.ok(asDonor.every((d) => /^FL-2026-\d{3}$/.test(d.code)));
});

test('solo los donantes publican; la publicación notifica al donante', async () => {
  const { donor, receiver } = await setup();
  assert.equal((await call('POST', '/donations', { token: receiver, body: input })).status, 403);
  const created = await call('POST', '/donations', { token: donor, body: input });
  assert.equal(created.status, 201);
  assert.equal(created.json.donation.status, 'available');
  assert.ok(created.json.donation.code);
  const notes = (await call('GET', '/notifications', { token: donor })).json.notifications;
  assert.equal(notes[0].type, 'published');
  assert.equal((await call('POST', '/donations', { token: donor, body: { ...input, title: '' } })).status, 400);
});

test('flujo completo: reservar → recoger → entregar con código', async () => {
  const { donor, receiver } = await setup();
  const { id, code } = (await call('POST', '/donations', { token: donor, body: input })).json.donation;

  const reserved = await call('POST', `/donations/${id}/reserve`, { token: receiver });
  assert.equal(reserved.json.donation.status, 'reserved');
  assert.equal(reserved.json.donation.code, undefined);
  assert.equal((await call('POST', `/donations/${id}/reserve`, { token: receiver })).status, 409);

  assert.equal((await call('POST', `/donations/${id}/pickup`, { token: receiver })).json.donation.status, 'onTheWay');

  const wrong = await call('POST', `/donations/${id}/deliver`, { token: receiver, body: { code: 'FL-0000' } });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.json.error, 'wrong_code');
  const done = await call('POST', `/donations/${id}/deliver`, { token: receiver, body: { code: code.toLowerCase() } });
  assert.equal(done.json.donation.status, 'collected');
  assert.ok(done.json.donation.history.collected);

  const donorNotes = (await call('GET', '/notifications', { token: donor })).json.notifications.map((n) => n.type);
  assert.deepEqual(new Set(donorNotes), new Set(['published', 'reserved', 'onTheWay', 'collected']));
});

test('el donante puede confirmar la entrega sin código y cancelar', async () => {
  const { donor, receiver } = await setup();
  const a = (await call('POST', '/donations', { token: donor, body: input })).json.donation.id;
  await call('POST', `/donations/${a}/reserve`, { token: receiver });
  await call('POST', `/donations/${a}/pickup`, { token: receiver });
  assert.equal((await call('POST', `/donations/${a}/deliver`, { token: donor })).json.donation.status, 'collected');

  const b = (await call('POST', '/donations', { token: donor, body: input })).json.donation.id;
  assert.equal((await call('POST', `/donations/${b}/cancel`, { token: donor })).json.donation.status, 'cancelled');
  assert.equal((await call('POST', `/donations/${b}/cancel`, { token: donor })).status, 409);
});

test('dos reservas simultáneas: solo una gana', async () => {
  const { donor, receiver } = await setup();
  const id = (await call('POST', '/donations', { token: donor, body: input })).json.donation.id;
  const other = (await call('POST', '/auth/register', { body: { name: 'Otro Receptor', email: 'otro@test.com', password: 'secreto1', role: 'receiver' } })).json.token;
  const [a, b] = await Promise.all([call('POST', `/donations/${id}/reserve`, { token: receiver }), call('POST', `/donations/${id}/reserve`, { token: other })]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
});

test('404 para donaciones inexistentes', async () => {
  const { receiver } = await setup();
  assert.equal((await call('GET', '/donations/nope', { token: receiver })).status, 404);
  assert.equal((await call('POST', '/donations/nope/reserve', { token: receiver })).status, 404);
});
