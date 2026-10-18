'use strict';

const { rateLimit } = require('../rateLimit');
const { badRequest, HttpError } = require('../errors');
const ai = require('../ai');

const MAX_BASE64_CHARS = 6 * 1024 * 1024; // ~4.5 MB de imagen
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// GET /api/analyze → estado de la IA (qué proveedor está configurado).
exports.status = async () => ai.status();

// POST /api/analyze { image (base64), mediaType?, lang? } → análisis del alimento.
// Requiere sesión y limita a 20 análisis por minuto por usuario para cuidar la cuota de la IA.
exports.analyze = async (ctx) => {
  const user = await ctx.user();
  await rateLimit(`analyze:${user.id}`, { max: 20, windowSeconds: 60 });
  const { image, mediaType = 'image/jpeg', lang = 'es' } = await ctx.body();
  if (typeof image !== 'string' || image.length < 100) throw badRequest('image_required');
  if (image.length > MAX_BASE64_CHARS) throw new HttpError(413, 'image_too_large');
  if (!MEDIA_TYPES.includes(mediaType)) throw badRequest('bad_media_type');
  return ai.analyzeImage({ image, mediaType, lang });
};
