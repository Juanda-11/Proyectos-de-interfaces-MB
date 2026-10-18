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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

exports.email = (value, field = 'email') => {
  const email = text(value, field, { max: 120 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw fail(field, 'invalid_email');
  return email;
};

exports.password = (value, field = 'password') => {
  if (typeof value !== 'string' || !value) throw fail(field, 'required');
  if (value.length < 6) throw fail(field, 'too_short');
  if (value.length > 100) throw fail(field, 'too_long');
  return value;
};
