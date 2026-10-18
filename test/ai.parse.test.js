'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractJson } = require('../lib/ai/extractJson');
const { normalize } = require('../lib/ai/normalize');
const { systemPrompt } = require('../lib/ai/prompt');

test('extractJson acepta JSON puro, con markdown y con texto alrededor', () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJson('```json\n{"a":2}\n```'), { a: 2 });
  assert.deepEqual(extractJson('Claro: {"a":3} listo'), { a: 3 });
  assert.throws(() => extractJson('sin json'), /no_json_in_response/);
});

test('normalize aplica valores por defecto y límites', () => {
  const n = normalize({ name: 'Pan', category: 'inventada', weightKg: '2.55', freshness: 'x', shelfLifeDays: -3, confidence: 5, allergens: ['gluten', 1] });
  assert.equal(n.category, 'other');
  assert.equal(n.weightKg, 2.6);
  assert.equal(n.freshness, 'good');
  assert.equal(n.shelfLifeDays, 0);
  assert.equal(n.confidence, 1);
  assert.deepEqual(n.allergens, ['gluten', '1']);
  assert.equal(n.isFood, true);
  assert.equal(normalize({ isFood: false }).isFood, false);
});

test('el prompt cambia de idioma', () => {
  assert.match(systemPrompt('en'), /English/);
  assert.match(systemPrompt('es'), /Spanish/);
});
