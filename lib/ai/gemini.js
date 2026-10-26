'use strict';

// Gemini (Google AI Studio, tiene plan gratuito). Devuelve { ok, status, text? , detail? }.
exports.name = 'gemini';
exports.key = () => process.env.GEMINI_API_KEY;
// Se prueban en orden. Google retira modelos con el tiempo (2.0 y 2.5 ya devuelven 404 para cuentas
// nuevas y gastaban una llamada inútil en cada análisis), por eso solo el vigente y el alias "latest".
exports.models = () => [process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-flash-latest'].filter(Boolean);

const { fetchWithTimeout } = require('./fetchTimeout');

// Los modelos con "razonamiento" tardan mucho y gastan tokens y cuota pensando; para clasificar una
// foto basta lo mínimo. Si el modelo no admite ese parámetro (400), se repite sin él.
const body = ({ system, image, mediaType, thinking }) =>
  JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mediaType, data: image } }, { text: 'Analyze this food photo and return the JSON.' }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 2048,
      ...(thinking ? { thinkingConfig: { thinkingLevel: 'low' } } : {}),
    },
  });

const send = (model, apiKey, payload) =>
  fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: payload,
  });

exports.call = async ({ model, apiKey, system, image, mediaType }) => {
  let response = await send(model, apiKey, body({ system, image, mediaType, thinking: true }));
  if (response.status === 400) {
    const detail = await response.text();
    if (!/thinking/i.test(detail)) return { ok: false, status: 400, detail };
    response = await send(model, apiKey, body({ system, image, mediaType, thinking: false }));
  }
  if (!response.ok) return { ok: false, status: response.status, detail: await response.text() };
  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  if (!text) {
    const reason = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason || 'unknown';
    return { ok: false, status: 502, detail: `empty response (${reason})` };
  }
  return { ok: true, text };
};
