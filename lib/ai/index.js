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

// Analiza la foto probando los modelos del proveedor en orden. Solo se prueba el
// siguiente modelo si el actual no existe (404); cualquier otro error se informa tal cual.
exports.analyzeImage = async ({ image, mediaType, lang }) => {
  const provider = pickProvider();
  if (!provider) throw new HttpError(503, 'ai_not_configured');
  const system = systemPrompt(lang === 'en' ? 'en' : 'es');
  const apiKey = provider.key();
  const cleanImage = image.replace(/^data:image\/[a-z+.-]+;base64,/i, '');
  let last = null;
  for (const model of provider.models()) {
    const result = await provider.call({ model, apiKey, system, image: cleanImage, mediaType });
    if (result.ok) return normalize(extractJson(result.text));
    console.error(provider.name, 'error', model, result.status, result.detail);
    last = result;
    if (result.status !== 404) break;
  }
  throw new HttpError(502, 'upstream_error', { provider: provider.name, upstreamStatus: last.status, detail: String(last.detail).slice(0, 300) });
};
