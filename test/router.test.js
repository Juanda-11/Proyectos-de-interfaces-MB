'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const router = require('../lib/router');

test('coincide con parámetros y distingue métodos', () => {
  router.clear();
  const h = () => 'x';
  router.route('GET', '/donations/:id', h);
  router.route('POST', '/donations/:id/reserve', h);
  assert.deepEqual(router.match('GET', '/donations/abc').params, { id: 'abc' });
  assert.deepEqual(router.match('POST', '/donations/a%20b/reserve').params, { id: 'a b' });
  assert.equal(router.match('GET', '/donations/abc/').handler, h);
  assert.deepEqual(router.match('DELETE', '/donations/abc'), { allowed: ['GET'] });
  assert.equal(router.match('GET', '/otra'), null);
  router.clear();
});
