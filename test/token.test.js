'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { signToken, verifyToken } = require('../lib/token');

test('ida y vuelta del token', () => {
  const token = signToken({ sub: 'u1' }, 'secreto');
  const payload = verifyToken(token, 'secreto');
  assert.equal(payload.sub, 'u1');
  assert.ok(payload.exp > Date.now() / 1000);
});

test('rechaza firma distinta, manipulación y basura', () => {
  const token = signToken({ sub: 'u1' }, 'secreto');
  assert.equal(verifyToken(token, 'otro-secreto'), null);
  const [body, sig] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 'admin', exp: 9999999999 })).toString('base64url');
  assert.equal(verifyToken(`${forged}.${sig}`, 'secreto'), null);
  assert.equal(verifyToken(body, 'secreto'), null);
  assert.equal(verifyToken('', 'secreto'), null);
  assert.equal(verifyToken(undefined, 'secreto'), null);
});

test('rechaza tokens expirados', () => {
  const token = signToken({ sub: 'u1' }, 'secreto', -10);
  assert.equal(verifyToken(token, 'secreto'), null);
});
