'use strict';

const { getStore } = require('./store');
const { tooManyRequests } = require('./errors');

// Limitador por clave y ventana fija. Lanza 429 al superar el máximo.
async function rateLimit(key, { max, windowSeconds }) {
  const count = await getStore().incr(`rl:${key}`, windowSeconds);
  if (count > max) throw tooManyRequests('rate_limited', { retryAfterSeconds: windowSeconds });
  return count;
}

module.exports = { rateLimit };
