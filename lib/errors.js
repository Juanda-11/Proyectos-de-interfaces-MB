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
