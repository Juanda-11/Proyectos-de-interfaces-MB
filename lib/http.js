'use strict';

const { allowedOrigins, MAX_JSON_BYTES } = require('./config');
const { HttpError } = require('./errors');

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(payload === undefined ? '' : JSON.stringify(payload));
}
exports.send = send;
