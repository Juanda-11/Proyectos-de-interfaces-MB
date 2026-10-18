'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const v = require('../lib/validate');
const schemas = require('../lib/validators');

const code = (fn) => {
  try {
    fn();
  } catch (e) {
    return `${e.code}:${e.details && e.details.field}`;
  }
  return 'ok';
};

test('text: requerido, tipos y longitudes', () => {
  assert.equal(v.text('  hola ', 'f'), 'hola');
  assert.equal(code(() => v.text('', 'f')), 'required:f');
  assert.equal(code(() => v.text(5, 'f')), 'invalid_type:f');
  assert.equal(code(() => v.text('a', 'f', { min: 2 })), 'too_short:f');
  assert.equal(code(() => v.text('abc', 'f', { max: 2 })), 'too_long:f');
  assert.equal(v.text(undefined, 'f', { optional: true }), '');
});

test('email se normaliza y valida', () => {
  assert.equal(v.email(' Ana@Test.COM '), 'ana@test.com');
  assert.equal(code(() => v.email('sin-arroba')), 'invalid_email:email');
});

test('password exige 6 caracteres', () => {
  assert.equal(v.password('123456'), '123456');
  assert.equal(code(() => v.password('123')), 'too_short:password');
  assert.equal(code(() => v.password()), 'required:password');
});

test('oneOf y number', () => {
  assert.equal(v.oneOf('a', ['a', 'b'], 'f'), 'a');
  assert.equal(v.oneOf(undefined, ['a'], 'f', 'a'), 'a');
  assert.equal(code(() => v.oneOf('z', ['a'], 'f')), 'invalid_value:f');
  assert.equal(v.number('2,5', 'n'), 2.5);
  assert.equal(v.number(undefined, 'n', { fallback: 1 }), 1);
  assert.equal(code(() => v.number('x', 'n')), 'invalid_number:n');
  assert.equal(code(() => v.number(99, 'n', { max: 10 })), 'out_of_range:n');
});

test('registerInput y loginInput', () => {
  const user = schemas.registerInput({ name: 'Ana Gómez', email: 'A@b.co', password: 'secreto', role: 'donor' });
  assert.deepEqual(user, { name: 'Ana Gómez', email: 'a@b.co', password: 'secreto', role: 'donor' });
  assert.equal(code(() => schemas.registerInput({ name: 'Ana', email: 'a@b.co', password: 'secreto', role: 'admin' })), 'invalid_value:role');
  assert.equal(schemas.loginInput({ email: 'a@b.co', password: 'secreto' }).role, null);
});

test('profileInput exige al menos un campo', () => {
  assert.deepEqual(schemas.profileInput({ phone: '300' }), { phone: '300' });
  assert.equal(code(() => schemas.profileInput({})), 'nothing_to_update:undefined');
});

test('donationInput aplica valores por defecto y valida la foto', () => {
  const d = schemas.donationInput({ title: 'Pan', lat: 1.2, lng: -77.2 });
  assert.equal(d.category, 'other');
  assert.equal(d.qty, '1');
  assert.equal(d.kg, 1);
  assert.equal(d.freshness, 'good');
  assert.equal(d.address, 'Pasto');
  assert.equal(code(() => schemas.donationInput({ title: 'Pan', lat: 1, lng: 1, photo: 'http://x' })), 'invalid_photo:photo');
  assert.equal(code(() => schemas.donationInput({ title: 'Pan', lat: 100, lng: 1 })), 'out_of_range:lat');
});
