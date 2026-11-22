'use strict';

const gemini = require('./gemini');
const anthropic = require('./anthropic');
const { systemPrompt } = require('./prompt');
const { extractJson } = require('./extractJson');
const { normalize } = require('./normalize');
const { HttpError } = require('../errors');

const PROVIDERS = { gemini, anthropic };

// Gemini tiene prioridad si hay dos claves; AI_PROVIDER fuerza uno concreto.
function pickProvider() {
  const forced = process.env.AI_PROVIDER;
  if (forced && PROVIDERS[forced] && PROVIDERS[forced].key()) return PROVIDERS[forced];
  return [gemini, anthropic].find((p) => p.key()) || null;
}

exports.status = () => {
  const provider = pickProvider();
  return { configured: !!provider, provider: provider ? provider.name : null, models: provider ? provider.models() : [] };
};

// Errores en los que vale la pena probar el siguiente modelo: modelo retirado (404), límite de uso
// (429) o proveedor caído / saturado / lento (5xx). Un 400/401/403 (petición o clave) no mejora cambiando de modelo.
const RETRYABLE = [404, 429, 500, 502, 503, 504];

// Modelos que acaban de fallar descansan un rato: así no se gasta cuota ni tiempo en cada
// análisis llamando a uno retirado (404, 1 h), sin cuota (429, 60 s) o saturado/lento (5xx, 20 s).
const COOLDOWN_MS = { 404: 3600000, 429: 60000, default: 20000 };
const cooldowns = new Map();
exports.resetCooldowns = () => {
  cooldowns.clear();
  if (gemini.resetCache) gemini.resetCache();
};

const available = (models) => {
  const ready = models.filter((m) => !(cooldowns.get(m) > Date.now()));
  return ready.length ? ready : models; // si todos descansan, se intenta igualmente
};

// Presupuesto total de espera (la función de Vercel dura 60 s) y tiempo máximo por modelo.
const BUDGET_MS = 50000;
const PER_CALL_MS = 15000;
const MIN_CALL_MS = 3000;

const candidatesOf = async (provider, apiKey) => (provider.candidates ? provider.candidates(apiKey) : provider.models());

// Analiza la foto probando los modelos del proveedor en orden (ver RETRYABLE), sin pasar del presupuesto.
exports.analyzeImage = async ({ image, mediaType, lang }) => {
  const provider = pickProvider();
  if (!provider) throw new HttpError(503, 'ai_not_configured');
  const system = systemPrompt(lang === 'en' ? 'en' : 'es');
  const apiKey = provider.key();
  const cleanImage = image.replace(/^data:image\/[a-z+.-]+;base64,/i, '');
  const deadline = Date.now() + BUDGET_MS;
  let last = null;
  for (const model of available(await candidatesOf(provider, apiKey))) {
    const remaining = deadline - Date.now();
    if (last && remaining < MIN_CALL_MS) break;
    const result = await provider.call({ model, apiKey, system, image: cleanImage, mediaType, timeoutMs: Math.max(MIN_CALL_MS, Math.min(PER_CALL_MS, remaining)) });
    if (result.ok) return normalize(extractJson(result.text));
    console.error(provider.name, 'error', model, result.status, result.detail);
    last = result;
    cooldowns.set(model, Date.now() + (COOLDOWN_MS[result.status] || COOLDOWN_MS.default));
    if (!RETRYABLE.includes(result.status)) break;
  }
  throw new HttpError(502, 'upstream_error', { provider: provider.name, upstreamStatus: last.status, detail: String(last.detail).slice(0, 300) });
};
