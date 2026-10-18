'use strict';

// Almacén en memoria. Solo para desarrollo y pruebas: en Vercel cada instancia tendría su
// propia copia, por eso en producción se usa Upstash (ver lib/store/index.js).
class MemoryStore {
  constructor() {
    this.kind = 'memory';
    this.hashes = new Map();
    this.values = new Map();
  }

  async hget(hash, field) {
    const h = this.hashes.get(hash);
    return h && h.has(field) ? h.get(field) : null;
  }

  async hset(hash, field, value) {
    if (!this.hashes.has(hash)) this.hashes.set(hash, new Map());
    this.hashes.get(hash).set(field, String(value));
  }

  async hdel(hash, field) {
    const h = this.hashes.get(hash);
    if (h) h.delete(field);
  }

  async hgetall(hash) {
    const h = this.hashes.get(hash);
    return h ? Object.fromEntries(h) : {};
  }

  // Versiones síncronas: así setnx e incr son atómicos (sin await entre leer y escribir).
  peek(key) {
    const entry = this.values.get(key);
    if (!entry) return null;
    if (entry.expires && entry.expires < Date.now()) {
      this.values.delete(key);
      return null;
    }
    return entry.value;
  }

  put(key, value, ttlSeconds) {
    this.values.set(key, { value: String(value), expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
  }

  async get(key) {
    return this.peek(key);
  }

  async set(key, value, ttlSeconds) {
    this.put(key, value, ttlSeconds);
  }

  // SET NX: devuelve true si la clave no existía (se usa para bloqueos y secretos).
  async setnx(key, value, ttlSeconds) {
    if (this.peek(key) !== null) return false;
    this.put(key, value, ttlSeconds);
    return true;
  }

  // Contador con ventana de expiración (limitador de peticiones).
  async incr(key, ttlSeconds) {
    const current = Number(this.peek(key)) || 0;
    const entry = this.values.get(key);
    const expires = entry && entry.expires ? entry.expires : Date.now() + ttlSeconds * 1000;
    this.values.set(key, { value: String(current + 1), expires });
    return current + 1;
  }

  async del(key) {
    this.values.delete(key);
    this.hashes.delete(key);
  }
}

module.exports = { MemoryStore };
