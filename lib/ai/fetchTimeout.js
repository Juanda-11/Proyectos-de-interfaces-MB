'use strict';

// Tiempo máximo por llamada al proveedor de IA. Con varios modelos de respaldo, la suma debe
// quedar por debajo del límite de la función (60 s en vercel.json).
const CALL_TIMEOUT_MS = 15000;

// fetch con tiempo límite. Si se agota devuelve una respuesta falsa 504 en vez de lanzar,
// así el resto del código trata el timeout como cualquier otro error del proveedor.
async function fetchWithTimeout(url, options) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });
  } catch (err) {
    const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return { ok: false, status: timedOut ? 504 : 502, text: async () => `${timedOut ? 'timeout' : 'network'}: ${err.message}` };
  }
}

module.exports = { fetchWithTimeout, CALL_TIMEOUT_MS };
