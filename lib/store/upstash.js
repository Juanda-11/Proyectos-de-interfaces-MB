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
}

module.exports = { UpstashStore };
