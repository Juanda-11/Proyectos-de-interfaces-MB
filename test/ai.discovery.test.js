'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ai = require('../lib/ai');
const geminiModels = require('../lib/ai/geminiModels');

const OK = '{"isFood":true,"name":"Pan","category":"bakery"}';
const image = 'data:image/jpeg;base64,' + 'x'.repeat(200);
const LIST = {
  models: [
    { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3.8-flash-lite', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3.8-flash-image', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-embedding-001', supportedGenerationMethods: ['embedContent'] },
  ],
};

const reset = () => {
  for (const k of ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'AI_PROVIDER', 'GEMINI_MODEL', 'GEMINI_MODEL_DISCOVERY']) delete process.env[k];
  ai.resetCooldowns();
};

// fetch simulado: la lista de modelos (GET) y las llamadas generateContent (POST).
function mockGoogle(onGenerate, listResponse = { ok: true, status: 200, json: async () => LIST }) {
  const calls = [];
  const original = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes('/models?')) return listResponse;
    const model = /models\/([^:]+):generateContent/.exec(url)[1];
    calls.push(model);
    return onGenerate(model);
  };
  return { calls, restore: () => (global.fetch = original) };
}
const good = { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: OK }] } }] }) };
const bad = (status) => ({ ok: false, status, text: async () => 'fail' });

test('rank y parse: solo flash con generateContent, lite primero, sin variantes de imagen/embeddings', () => {
  assert.deepEqual(geminiModels.parse(LIST), ['gemini-3.8-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash']);
});

test('usa primero el modelo lite descubierto y no toca los demás si responde', async () => {
  reset();
  process.env.GEMINI_API_KEY = 'g';
  const g = mockGoogle(() => good);
  try {
    assert.equal((await ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' })).name, 'Pan');
    assert.deepEqual(g.calls, ['gemini-3.8-flash-lite']);
  } finally {
    g.restore();
    reset();
  }
});

test('si el lite está saturado (503) pasa al siguiente descubierto', async () => {
  reset();
  process.env.GEMINI_API_KEY = 'g';
  const g = mockGoogle((m) => (m === 'gemini-3.8-flash-lite' ? bad(503) : good));
  const orig = console.error;
  console.error = () => {};
  try {
    await ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' });
    assert.deepEqual(g.calls, ['gemini-3.8-flash-lite', 'gemini-3.8-flash']);
  } finally {
    console.error = orig;
    g.restore();
    reset();
  }
});

test('la lista de modelos se consulta una vez por hora (caché)', async () => {
  reset();
  process.env.GEMINI_API_KEY = 'g';
  let lists = 0;
  const g = mockGoogle(() => good, { ok: true, status: 200, json: async () => { lists++; return LIST; } });
  try {
    await ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' });
    await ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' });
    assert.equal(lists, 1);
  } finally {
    g.restore();
    reset();
  }
});

test('si no se puede listar usa la lista fija; GEMINI_MODEL va primero', async () => {
  reset();
  process.env.GEMINI_API_KEY = 'g';
  process.env.GEMINI_MODEL = 'gemini-mio';
  const g = mockGoogle((m) => (m === 'gemini-mio' ? bad(404) : good), bad(500));
  const orig = console.error;
  console.error = () => {};
  try {
    await ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' });
    assert.deepEqual(g.calls, ['gemini-mio', 'gemini-3.8-flash']);
  } finally {
    console.error = orig;
    g.restore();
    reset();
  }
});

test('prueba como máximo 5 modelos y reporta el último error', async () => {
  reset();
  process.env.GEMINI_API_KEY = 'g';
  const many = { models: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((x) => ({ name: `models/gemini-3.${x === 'a' ? 1 : 0}-flash-${x}`, supportedGenerationMethods: ['generateContent'] })) };
  const g = mockGoogle(() => bad(503), { ok: true, status: 200, json: async () => many });
  const orig = console.error;
  console.error = () => {};
  try {
    await assert.rejects(
      () => ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' }),
      (e) => e.status === 502 && e.details.upstreamStatus === 503
    );
    assert.equal(g.calls.length, 5);
  } finally {
    console.error = orig;
    g.restore();
    reset();
  }
});
