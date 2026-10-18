'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetMemoryStore } = require('../lib/store');
const donations = require('../lib/models/donations');
const notifications = require('../lib/models/notifications');

const donor = { id: 'd1', name: 'Panadería' };
const input = { title: 'Pan', category: 'bakery', qty: '12', kg: 3, lat: 1.2, lng: -77.2 };

test('create/get/list ordenado y serialize oculta el código', async () => {
  resetMemoryStore();
  const a = await donations.create(donor, input);
  await new Promise((r) => setTimeout(r, 5));
  const b = await donations.create(donor, { ...input, title: 'Frutas' });
  assert.equal(a.status, 'available');
  assert.match(a.code, /^FL-2026-\d{3}$/);
  assert.equal((await donations.get(a.id)).title, 'Pan');
  assert.deepEqual((await donations.list()).map((d) => d.id), [b.id, a.id]);
  assert.equal(donations.serialize(a, { id: 'otro' }).code, undefined);
  assert.equal(donations.serialize(a, donor).code, a.code);
  await donations.remove(a.id);
  assert.equal(await donations.get(a.id), null);
});

test('notificaciones: alta, listado, leídas y límite', async () => {
  resetMemoryStore();
  assert.equal(await notifications.add(null, 'x', { id: 'd', title: 't' }), null);
  for (let i = 0; i < 65; i++) await notifications.add('u1', 'reserved', { id: `d${i}`, title: `t${i}` });
  const list = await notifications.list('u1');
  assert.equal(list.length, 60);
  assert.equal(await notifications.markAllRead('u1'), 60);
  assert.ok((await notifications.list('u1')).every((n) => n.read));
  await notifications.clear('u1');
  assert.deepEqual(await notifications.list('u1'), []);
});
