'use strict';

// Utilidades para probar handlers sin levantar un servidor.
function mockReq({ method = 'GET', url = '/', headers = {}, body } = {}) {
  return { method, url, headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])), body };
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      res.headers[name.toLowerCase()] = value;
    },
    end(data) {
      res.body = data;
    },
    json() {
      return res.body ? JSON.parse(res.body) : undefined;
    },
  };
  return res;
}

module.exports = { mockReq, mockRes };

// Llama a la API completa (router + handlers) sin servidor HTTP.
// Uso: const { status, json } = await call('POST', '/auth/login', { body, token });
async function call(method, path, { body, token, headers = {} } = {}) {
  require('../lib/routes');
  const { handleRequest } = require('../lib/app');
  const req = mockReq({
    method,
    url: `/api${path}`,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body,
  });
  const res = mockRes();
  await handleRequest(req, res);
  return { status: res.statusCode, json: res.json(), headers: res.headers };
}

module.exports.call = call;
