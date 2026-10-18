'use strict';

// Cliente mínimo de la API REST de Upstash Redis (sin dependencias).
// https://upstash.com/docs/redis/features/restapi
class UpstashStore {
  constructor({ url, token }) {
    this.kind = 'upstash';
    this.url = url;
    this.token = token;
  }

  async request(path, body) {
    const response = await fetch(`${this.url}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`upstash_http_${response.status}: ${data.error || ''}`);
    return data;
  }

  async command(...args) {
    const data = await this.request('', args.map(String));
    if (data.error) throw new Error(`upstash_error: ${data.error}`);
    return data.result;
  }

  async hget(hash, field) {
    return this.command('HGET', hash, field);
  }

  async hset(hash, field, value) {
    await this.command('HSET', hash, field, value);
  }

  async hdel(hash, field) {
    await this.command('HDEL', hash, field);
  }

  async get(key) {
    return this.command('GET', key);
  }

  async set(key, value, ttlSeconds) {
    if (ttlSeconds) await this.command('SET', key, value, 'EX', ttlSeconds);
    else await this.command('SET', key, value);
  }

  async setnx(key, value, ttlSeconds) {
    const args = ['SET', key, value, 'NX'];
    if (ttlSeconds) args.push('EX', ttlSeconds);
    return (await this.command(...args)) === 'OK';
  }

  async del(key) {
    await this.command('DEL', key);
  }

  // INCR + EXPIRE NX en una sola petición (pipeline).
  async incr(key, ttlSeconds) {
    const data = await this.request('/pipeline', [
      ['INCR', key],
      ['EXPIRE', key, String(ttlSeconds), 'NX'],
    ]);
    return Number(data[0].result);
  }

  // HGETALL devuelve [campo, valor, campo, valor...]
  async hgetall(hash) {
    const flat = (await this.command('HGETALL', hash)) || [];
    const out = {};
    for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
    return out;
  }
}

module.exports = { UpstashStore };
