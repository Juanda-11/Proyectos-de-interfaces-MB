'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ai = require('../lib/ai');

const OK = '{"isFood":true,"name":"Pan","category":"bakery","quantityText":"12","weightKg":2,"freshness":"good","shelfLifeDays":1}';
const clean = () => {
  for (const k of ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'AI_PROVIDER', 'GEMINI_MODEL', 'ANTHROPIC_MODEL']) delete process.env[k];
};
const image = 'data:image/jpeg;base64,' + 'x'.repeat(200);

function mockFetch(handler) {
  const calls = [];
  const original = global.fetch;
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body });
    const r = handler(url, body);
    return { ok: r.ok !== false, status: r.status || 200, json: async () => r.json, text: async () => r.text || '' };
  };
  return { calls, restore: () => (global.fetch = original) };
}

test('status: sin claves, Gemini por prioridad y AI_PROVIDER', () => {
  clean();
  assert.deepEqual(ai.status(), { configured: false, provider: null, models: [] });
  process.env.GEMINI_API_KEY = 'g';
  process.env.ANTHROPIC_API_KEY = 'a';
  assert.equal(ai.status().provider, 'gemini');
  process.env.AI_PROVIDER = 'anthropic';
  assert.equal(ai.status().provider, 'anthropic');
  clean();
});

test('sin proveedor lanza 503', async () => {
  clean();
  await assert.rejects(() => ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' }), (e) => e.status === 503);
});

test('Gemini: prueba el siguiente modelo si el primero devuelve 404 y limpia el data URI', async () => {
  clean();
  process.env.GEMINI_API_KEY = 'g';
  const f = mockFetch((url) =>
    url.includes('gemini-3.8-flash') ? { ok: false, status: 404, text: 'nf' } : { json: { candidates: [{ content: { parts: [{ text: OK }] } }] } }
  );
  try {
    const out = await ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' });
    assert.equal(out.name, 'Pan');
    assert.equal(f.calls.length, 2);
    assert.ok(f.calls[1].url.includes('gemini-flash-latest'));
    assert.ok(!f.calls[1].body.contents[0].parts[0].inline_data.data.startsWith('data:'));
  } finally {
    f.restore();
    clean();
  }
});

test('Anthropic: respuesta correcta', async () => {
  clean();
  process.env.ANTHROPIC_API_KEY = 'a';
  const f = mockFetch(() => ({ json: { content: [{ type: 'text', text: OK }] } }));
  try {
    assert.equal((await ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'en' })).category, 'bakery');
    assert.equal(f.calls[0].url, 'https://api.anthropic.com/v1/messages');
  } finally {
    f.restore();
    clean();
  }
});

test('errores del proveedor se informan como 502 con detalle', async () => {
  clean();
  process.env.GEMINI_API_KEY = 'g';
  const f = mockFetch(() => ({ ok: false, status: 403, text: 'API key not valid' }));
  const orig = console.error;
  console.error = () => {};
  try {
    await assert.rejects(
      () => ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' }),
      (e) => e.status === 502 && e.details.upstreamStatus === 403 && /not valid/.test(e.details.detail)
    );
    assert.equal(f.calls.length, 1); // 403 no prueba otros modelos
  } finally {
    console.error = orig;
    f.restore();
    clean();
  }
});

test('Gemini: ante 503 (saturado) o 429 sigue con el siguiente modelo', async () => {
  clean();
  process.env.GEMINI_API_KEY = 'g';
  const statuses = { 'gemini-3.8-flash': 503, 'gemini-flash-latest': 429 };
  const f = mockFetch((url) => {
    const model = Object.keys(statuses).find((m) => url.includes(m));
    return model ? { ok: false, status: statuses[model], text: 'busy' } : { json: { candidates: [{ content: { parts: [{ text: OK }] } }] } };
  });
  const orig = console.error;
  console.error = () => {};
  try {
    assert.equal((await ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' })).name, 'Pan');
    assert.equal(f.calls.length, 3);
    assert.ok(f.calls[2].url.includes('gemini-2.5-flash'));
  } finally {
    console.error = orig;
    f.restore();
    clean();
  }
});

test('un timeout cuenta como error reintentable (504)', async () => {
  clean();
  process.env.GEMINI_API_KEY = 'g';
  const original = global.fetch;
  let n = 0;
  global.fetch = async () => {
    if (n++ === 0) throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: OK }] } }] }) };
  };
  const orig = console.error;
  console.error = () => {};
  try {
    assert.equal((await ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' })).name, 'Pan');
    assert.equal(n, 2);
  } finally {
    console.error = orig;
    global.fetch = original;
    clean();
  }
});

test('si todos los modelos fallan se informa el último error', async () => {
  clean();
  process.env.GEMINI_API_KEY = 'g';
  const f = mockFetch(() => ({ ok: false, status: 503, text: 'high demand' }));
  const orig = console.error;
  console.error = () => {};
  try {
    await assert.rejects(
      () => ai.analyzeImage({ image, mediaType: 'image/jpeg', lang: 'es' }),
      (e) => e.status === 502 && e.details.upstreamStatus === 503 && /high demand/.test(e.details.detail)
    );
    assert.equal(f.calls.length, 3);
  } finally {
    console.error = orig;
    f.restore();
    clean();
  }
});
