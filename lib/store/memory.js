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
}

module.exports = { MemoryStore };
