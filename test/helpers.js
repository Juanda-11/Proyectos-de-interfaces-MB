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
