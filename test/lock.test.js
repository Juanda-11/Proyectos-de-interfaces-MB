'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetMemoryStore } = require('../lib/store');
const { withLock } = require('../lib/lock');

test('serializa ejecuciones concurrentes sobre la misma clave', async () => {
  resetMemoryStore();
  const order = [];
  const job = (name) => withLock('d1', async () => {
    order.push(`${name}:start`);
    await new Promise((r) => setTimeout(r, 30));
    order.push(`${name}:end`);
  });
  await Promise.all([job('a'), job('b')]);
  assert.deepEqual(order.map((x) => x.split(':')[1]), ['start', 'end', 'start', 'end']);
});

test('libera el bloqueo aunque la función falle', async () => {
  resetMemoryStore();
  await assert.rejects(() => withLock('x', async () => { throw new Error('boom'); }), /boom/);
  assert.equal(await withLock('x', async () => 'ok'), 'ok');
});

test('lanza 409 si no consigue el bloqueo', async () => {
  resetMemoryStore();
  await withLock('y', async () => {
    await assert.rejects(
      () => withLock('y', async () => 'nunca', { retries: 2, waitMs: 1 }),
      (e) => e.status === 409 && e.code === 'busy'
    );
  });
});
