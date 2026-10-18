'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mockReq, mockRes } = require('./helpers');
const http = require('../lib/http');
const { badRequest, HttpError } = Object.assign({}, require('../lib/errors'));

test('send escribe JSON con el estado indicado', () => {
  const res = mockRes();
  http.send(res, 201, { ok: true });
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers['content-type'], 'application/json; charset=utf-8');
  assert.deepEqual(res.json(), { ok: true });
});

test('applyCors permite cualquier origen por defecto', () => {
  delete process.env.ALLOWED_ORIGINS;
  const res = mockRes();
  http.applyCors(mockReq({ headers: { Origin: 'https://x.app' } }), res);
  assert.equal(res.headers['access-control-allow-origin'], '*');
});

test('applyCors respeta ALLOWED_ORIGINS', () => {
  process.env.ALLOWED_ORIGINS = 'https://a.app,https://b.app';
  const res = mockRes();
  http.applyCors(mockReq({ headers: { Origin: 'https://b.app' } }), res);
  assert.equal(res.headers['access-control-allow-origin'], 'https://b.app');
  delete process.env.ALLOWED_ORIGINS;
});

test('readJson acepta objetos, strings y rechaza JSON inválido', async () => {
  assert.deepEqual(await http.readJson(mockReq({ body: { a: 1 } })), { a: 1 });
  assert.deepEqual(await http.readJson(mockReq({ body: '{"a":2}' })), { a: 2 });
  await assert.rejects(() => http.readJson(mockReq({ body: '{oops' })), (e) => e.code === 'invalid_json');
});

test('bearerToken y clientIp', () => {
  assert.equal(http.bearerToken(mockReq({ headers: { Authorization: 'Bearer abc.def' } })), 'abc.def');
  assert.equal(http.bearerToken(mockReq()), null);
  assert.equal(http.clientIp(mockReq({ headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } })), '1.2.3.4');
});

test('sendError traduce HttpError y oculta errores internos', () => {
  const a = mockRes();
  http.sendError(a, new HttpError(404, 'not_found'));
  assert.equal(a.statusCode, 404);
  assert.deepEqual(a.json(), { error: 'not_found' });
  const origError = console.error;
  console.error = () => {};
  const b = mockRes();
  http.sendError(b, new Error('boom'));
  console.error = origError;
  assert.equal(b.statusCode, 500);
  assert.deepEqual(b.json(), { error: 'internal_error' });
  assert.equal(badRequest().status, 400);
});
