'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { UpstashStore } = require('../lib/store/upstash');

// fetch simulado: registra las peticiones y responde lo que indique cada prueba.
function withFetch(handler, fn) {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body, auth: options.headers.Authorization });
    const out = handler(url, body);
    return { ok: out.ok !== false, status: out.status || 200, json: async () => out.json };
  };
  return fn(calls).finally(() => {
    global.fetch = original;
  });
}

const store = () => new UpstashStore({ url: 'https://redis.test', token: 'tok' });

test('hgetall convierte el arreglo plano en objeto', () =>
  withFetch(
    () => ({ json: { result: ['a', '1', 'b', '2'] } }),
    async (calls) => {
      assert.deepEqual(await store().hgetall('h'), { a: '1', b: '2' });
      assert.deepEqual(calls[0].body, ['HGETALL', 'h']);
      assert.equal(calls[0].auth, 'Bearer tok');
    }
  ));

test('setnx devuelve true solo con OK', () =>
  withFetch(
    () => ({ json: { result: 'OK' } }),
    async (calls) => {
      assert.equal(await store().setnx('l', '1', 10), true);
      assert.deepEqual(calls[0].body, ['SET', 'l', '1', 'NX', 'EX', '10']);
    }
  ));

test('setnx devuelve false si la clave existe', () =>
  withFetch(
    () => ({ json: { result: null } }),
    async () => assert.equal(await store().setnx('l', '1'), false)
  ));

test('incr usa pipeline', () =>
  withFetch(
    () => ({ json: [{ result: 3 }, { result: 1 }] }),
    async (calls) => {
      assert.equal(await store().incr('rl', 60), 3);
      assert.equal(calls[0].url, 'https://redis.test/pipeline');
    }
  ));

test('propaga errores de Upstash', () =>
  withFetch(
    () => ({ json: { error: 'WRONGTYPE' } }),
    async () => assert.rejects(() => store().get('k'), /upstash_error: WRONGTYPE/)
  ));

test('propaga errores HTTP', () =>
  withFetch(
    () => ({ ok: false, status: 401, json: { error: 'unauthorized' } }),
    async () => assert.rejects(() => store().get('k'), /upstash_http_401/)
  ));
