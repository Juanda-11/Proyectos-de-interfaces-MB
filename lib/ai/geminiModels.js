'use strict';

// Descubre qué modelos Gemini tiene disponibles la clave (ListModels) en vez de depender de nombres
// fijos: Google retira modelos y los nuevos suelen saturarse. Resultado en caché durante 1 hora.
const LIST_URL = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200';
const TTL_MS = 3600000;

// Variantes que no sirven para clasificar una foto con respuesta JSON.
const EXCLUDED = /(image|tts|audio|live|native|embedding|robotics|computer|thinking|learnlm|gemma|exp\b)/i;

// Versión numérica del nombre ("gemini-3.8-flash" → 3.8) para ordenar de más nuevo a más viejo.
const version = (name) => {
  const m = /gemini-(\d+(?:\.\d+)?)/.exec(name);
  return m ? parseFloat(m[1]) : 0;
};

// Orden de preferencia: primero los "lite" (más ligeros y menos saturados), luego los "flash" estables
// y al final los "preview". Dentro de cada grupo, el más nuevo primero.
exports.rank = (names) => {
  const group = (n) => (/lite/i.test(n) ? 0 : /preview/i.test(n) ? 2 : 1);
  return [...names].sort((a, b) => group(a) - group(b) || version(b) - version(a) || a.localeCompare(b));
};

exports.parse = (payload) =>
  exports.rank(
    (payload.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name).replace(/^models\//, ''))
      .filter((n) => /^gemini-/.test(n) && /flash/i.test(n) && !EXCLUDED.test(n))
  );

exports.resetCache = () => {
  delete globalThis.__geminiModelCache;
};

// Devuelve los ids de modelos ordenados por preferencia, o [] si no se pudo consultar.
exports.discover = async (apiKey) => {
  if (process.env.GEMINI_MODEL_DISCOVERY === 'off') return [];
  const cache = globalThis.__geminiModelCache;
  if (cache && cache.until > Date.now()) return cache.models;
  try {
    const response = await fetch(LIST_URL, { headers: { 'x-goog-api-key': apiKey }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return [];
    const models = exports.parse(await response.json());
    if (models.length) globalThis.__geminiModelCache = { models, until: Date.now() + TTL_MS };
    return models;
  } catch {
    return [];
  }
};
