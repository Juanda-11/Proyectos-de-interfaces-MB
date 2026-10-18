'use strict';

const { upstash } = require('../config');
const { MemoryStore } = require('./memory');
const { UpstashStore } = require('./upstash');

// Un solo almacén por proceso. La memoria se guarda en globalThis para sobrevivir recargas
// de módulos en desarrollo.
function getStore() {
  const creds = upstash();
  if (creds) {
    if (!globalThis.__foodlinkUpstash || globalThis.__foodlinkUpstash.url !== creds.url) {
      globalThis.__foodlinkUpstash = new UpstashStore(creds);
    }
    return globalThis.__foodlinkUpstash;
  }
  if (!globalThis.__foodlinkMemory) globalThis.__foodlinkMemory = new MemoryStore();
  return globalThis.__foodlinkMemory;
}

// Solo para pruebas: vacía el almacén en memoria.
function resetMemoryStore() {
  globalThis.__foodlinkMemory = new MemoryStore();
}

module.exports = { getStore, resetMemoryStore };
