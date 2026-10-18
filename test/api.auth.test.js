'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resetMemoryStore } = require('../lib/store');
const { call } = require('./helpers');

const fresh = () => {
  resetMemoryStore();
  delete globalThis.__foodlinkSeeded;
  delete globalThis.__foodlinkSecret;
};
const ana = { name: 'Ana Gómez', email: 'ana@test.com', password: 'secreto1', role: 'donor' };

test('registro devuelve token y usuario sin hash; correo repetido → 409', async () => {
  fresh();
  const r = await call('POST', '/auth/register', { body: ana });
  assert.equal(r.status, 201);
  assert.ok(r.json.token);
  assert.equal(r.json.user.passwordHash, undefined);
  assert.equal(r.json.user.role, 'donor');
  const again = await call('POST', '/auth/register', { body: ana });
  assert.equal(again.status, 409);
  assert.equal(again.json.error, 'email_taken');
});

test('registro valida los campos', async () => {
  fresh();
  const r = await call('POST', '/auth/register', { body: { ...ana, email: 'mal' } });
  assert.equal(r.status, 400);
  assert.equal(r.json.error, 'invalid_email');
  assert.equal(r.json.details.field, 'email');
});

test('login: credenciales, rol y cuentas demo', async () => {
  fresh();
  await call('POST', '/auth/register', { body: ana });
  const ok = await call('POST', '/auth/login', { body: { email: 'ANA@test.com', password: 'secreto1', role: 'donor' } });
  assert.equal(ok.status, 200);
  assert.equal((await call('POST', '/auth/login', { body: { email: 'ana@test.com', password: 'mala1234' } })).status, 401);
  const mismatch = await call('POST', '/auth/login', { body: { email: 'ana@test.com', password: 'secreto1', role: 'receiver' } });
  assert.equal(mismatch.status, 403);
  assert.deepEqual(mismatch.json, { error: 'role_mismatch', details: { role: 'donor' } });
  const demo = await call('POST', '/auth/login', { body: { email: 'receptor@foodlink.app', password: 'demo1234', role: 'receiver' } });
  assert.equal(demo.status, 200);
});

test('me: requiere token, edita perfil y cambia contraseña', async () => {
  fresh();
  assert.equal((await call('GET', '/auth/me')).status, 401);
  const { json } = await call('POST', '/auth/register', { body: ana });
  const token = json.token;
  assert.equal((await call('GET', '/auth/me', { token })).json.user.email, 'ana@test.com');
  const upd = await call('PATCH', '/auth/me', { token, body: { name: 'Ana María', phone: '300 111' } });
  assert.equal(upd.json.user.name, 'Ana María');
  assert.equal((await call('PATCH', '/auth/me', { token, body: {} })).status, 400);
  assert.equal((await call('POST', '/auth/password', { token, body: { current: 'incorrecta', next: 'nuevaClave' } })).json.error, 'wrong_current_password');
  assert.equal((await call('POST', '/auth/password', { token, body: { current: 'secreto1', next: 'nuevaClave' } })).status, 200);
  assert.equal((await call('POST', '/auth/login', { body: { email: 'ana@test.com', password: 'nuevaClave' } })).status, 200);
});

test('borrar la cuenta invalida el token', async () => {
  fresh();
  const { json } = await call('POST', '/auth/register', { body: ana });
  assert.equal((await call('DELETE', '/auth/me', { token: json.token })).status, 200);
  assert.equal((await call('GET', '/auth/me', { token: json.token })).status, 401);
});
