'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryStore } = require('../lib/store/memory');

test('hashes: hset/hget/hgetall/hdel', async () => {
  const s = new MemoryStore();
  assert.equal(await s.hget('h', 'a'), null);
  await s.hset('h', 'a', '1');
  await s.hset('h', 'b', 2);
  assert.equal(await s.hget('h', 'a'), '1');
  assert.deepEqual(await s.hgetall('h'), { a: '1', b: '2' });
  await s.hdel('h', 'a');
  assert.deepEqual(await s.hgetall('h'), { b: '2' });
  assert.deepEqual(await s.hgetall('vacio'), {});
});

test('claves simples con expiración', async () => {
  const s = new MemoryStore();
  await s.set('k', 'v');
  assert.equal(await s.get('k'), 'v');
  await s.set('t', 'x', 1);
  s.values.get('t').expires = Date.now() - 1;
  assert.equal(await s.get('t'), null);
  await s.del('k');
  assert.equal(await s.get('k'), null);
});

test('setnx solo escribe una vez', async () => {
  const s = new MemoryStore();
  assert.equal(await s.setnx('lock', '1', 5), true);
  assert.equal(await s.setnx('lock', '2', 5), false);
  assert.equal(await s.get('lock'), '1');
});

test('incr cuenta dentro de la ventana', async () => {
  const s = new MemoryStore();
  assert.equal(await s.incr('rl', 60), 1);
  assert.equal(await s.incr('rl', 60), 2);
  assert.equal(await s.incr('rl', 60), 3);
});
