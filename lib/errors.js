'use strict';

// Error con código HTTP. Los handlers lanzan HttpError y lib/http.js lo convierte en JSON.
class HttpError extends Error {
  constructor(status, code, details) {
    super(code);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
exports.HttpError = HttpError;

const make = (status, defaultCode) => (code = defaultCode, details) => new HttpError(status, code, details);

exports.badRequest = make(400, 'bad_request');
exports.unauthorized = make(401, 'unauthorized');
exports.forbidden = make(403, 'forbidden');
exports.notFound = make(404, 'not_found');
exports.conflict = make(409, 'conflict');
exports.tooManyRequests = make(429, 'too_many_requests');
