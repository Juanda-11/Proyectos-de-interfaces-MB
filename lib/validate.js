'use strict';

const { badRequest } = require('./errors');

// Validaciones manuales (sin dependencias). Todas lanzan 400 con { field } en details.
const fail = (field, code) => badRequest(code, { field });

function text(value, field, { min = 1, max = 200, optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return '';
    throw fail(field, 'required');
  }
  if (typeof value !== 'string') throw fail(field, 'invalid_type');
  const trimmed = value.trim();
  if (trimmed.length < min) throw fail(field, optional && !trimmed ? 'required' : 'too_short');
  if (trimmed.length > max) throw fail(field, 'too_long');
  return trimmed;
}
exports.text = text;
