'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeOrigin, resolveOrigin } = require('../lib/cors');
const { mockReq, mockRes } = require('./helpers');
const http = require('../lib/http');

test('normalizeOrigin quita la barra final y pasa a minúsculas', () => {
  assert.equal(normalizeOrigin(' https://Foodlink-Ashen.vercel.app/ '), 'https://foodlink-ashen.vercel.app');
  assert.equal(normalizeOrigin(undefined), '');
});

test('coincidencia exacta aunque la variable lleve barra final (el caso real que falló)', () => {
  const allowed = ['https://foodlink-ashen.vercel.app/'];
  assert.equal(resolveOrigin(allowed, 'https://foodlink-ashen.vercel.app'), 'https://foodlink-ashen.vercel.app');
  assert.equal(resolveOrigin(allowed, 'https://foodlink-pinh7wns0-juan-9a09.vercel.app'), null);
});

test('comodines para las URLs de cada despliegue', () => {
  const allowed = ['https://foodlink-*.vercel.app'];
  assert.ok(resolveOrigin(allowed, 'https://foodlink-pinh7wns0-juan-9a09.vercel.app'));
  assert.ok(resolveOrigin(allowed, 'https://foodlink-ashen.vercel.app'));
  assert.equal(resolveOrigin(allowed, 'https://otra-app.vercel.app'), null);
  assert.equal(resolveOrigin(allowed, 'https://foodlink-x.vercel.app.malo.com'), null);
});

test('* permite todo y sin Origin no se permite nada concreto', () => {
  assert.equal(resolveOrigin(['*'], 'https://x.app'), '*');
  assert.equal(resolveOrigin(['https://a.app'], undefined), null);
});

test('applyCors no envía la cabecera si el origen no está permitido', () => {
  process.env.ALLOWED_ORIGINS = 'https://a.app/';
  try {
    const ok = mockRes();
    http.applyCors(mockReq({ headers: { Origin: 'https://a.app' } }), ok);
    assert.equal(ok.headers['access-control-allow-origin'], 'https://a.app');
    const bad = mockRes();
    http.applyCors(mockReq({ headers: { Origin: 'https://b.app' } }), bad);
    assert.equal(bad.headers['access-control-allow-origin'], undefined);
  } finally {
    delete process.env.ALLOWED_ORIGINS;
  }
});
