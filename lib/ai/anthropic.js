'use strict';

// Claude (alternativa de pago). Devuelve { ok, status, text?, detail? }.
exports.name = 'anthropic';
exports.key = () => process.env.ANTHROPIC_API_KEY;
exports.models = () => [process.env.ANTHROPIC_MODEL, 'claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5', 'claude-sonnet-4-5'].filter(Boolean);

const { fetchWithTimeout } = require('./fetchTimeout');

exports.call = async ({ model, apiKey, system, image, mediaType }) => {
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      system,
      messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: image } }, { type: 'text', text: 'Analyze this food photo and return the JSON.' }] }],
    }),
  });
  if (!response.ok) return { ok: false, status: response.status, detail: await response.text() };
  const data = await response.json();
  return { ok: true, text: (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('') };
};
