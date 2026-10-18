'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetMemoryStore } = require('../lib/store');
const seed = require('../lib/seed');
const users = require('../lib/models/users');
const donations = require('../lib/models/donations');

const fresh = () => {
  resetMemoryStore();
  delete globalThis.__foodlinkSeeded;
};

test('ensureSeeded crea usuarios demo y 5 donaciones una sola vez', async () => {
  fresh();
  await seed.ensureSeeded();
  assert.equal((await donations.list()).length, 5);
  assert.ok(await users.verifyCredentials('receptor@foodlink.app', 'demo1234'));
  assert.ok(await users.verifyCredentials('donante@foodlink.app', 'demo1234'));
  delete globalThis.__foodlinkSeeded;
  await seed.ensureSeeded(); // segunda vez: no duplica
  assert.equal((await donations.list()).length, 5);
});

test('resetDemo devuelve las donaciones al estado inicial', async () => {
  fresh();
  await seed.ensureSeeded();
  await donations.create({ id: 'x', name: 'X' }, { title: 'Extra', lat: 1, lng: 1 });
  assert.equal((await donations.list()).length, 6);
  await seed.resetDemo();
  assert.equal((await donations.list()).length, 5);
});

test('las donaciones de ejemplo cubren las cuatro etapas', () => {
  const statuses = new Set(seed.seedDonations().map((d) => d.status));
  for (const s of ['available', 'reserved', 'onTheWay', 'collected']) assert.ok(statuses.has(s), s);
});
