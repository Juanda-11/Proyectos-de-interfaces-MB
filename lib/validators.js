'use strict';

const v = require('./validate');
const { MAX_PHOTO_CHARS } = require('./config');
const { badRequest } = require('./errors');

exports.ROLES = ['donor', 'receiver'];
exports.CATEGORIES = ['bakery', 'fruits', 'vegetables', 'meals', 'dairy', 'other'];
exports.FRESHNESS = ['good', 'fair', 'poor'];

exports.registerInput = (body) => ({
  name: v.text(body.name, 'name', { min: 2, max: 80 }),
  email: v.email(body.email),
  password: v.password(body.password),
  role: v.oneOf(body.role, exports.ROLES, 'role'),
});

exports.loginInput = (body) => ({
  email: v.email(body.email),
  password: v.password(body.password),
  role: v.oneOf(body.role, exports.ROLES, 'role', null),
});

exports.profileInput = (body) => {
  const patch = {};
  if (body.name !== undefined) patch.name = v.text(body.name, 'name', { min: 2, max: 80 });
  if (body.phone !== undefined) patch.phone = v.text(body.phone, 'phone', { max: 30, optional: true });
  if (body.address !== undefined) patch.address = v.text(body.address, 'address', { max: 160, optional: true });
  if (Object.keys(patch).length === 0) throw badRequest('nothing_to_update');
  return patch;
};

exports.passwordChangeInput = (body) => ({
  current: v.password(body.current, 'current'),
  next: v.password(body.next, 'next'),
});

exports.donationInput = (body) => {
  const photo = body.photo == null ? null : String(body.photo);
  if (photo && (!photo.startsWith('data:image/') || photo.length > MAX_PHOTO_CHARS)) {
    throw badRequest('invalid_photo', { field: 'photo' });
  }
  return {
    title: v.text(body.title, 'title', { max: 80 }),
    category: v.oneOf(body.category, exports.CATEGORIES, 'category', 'other'),
    qty: v.text(body.qty, 'qty', { max: 40, optional: true }) || '1',
    kg: v.number(body.kg, 'kg', { min: 0, max: 5000, fallback: 1 }),
    shelfLifeDays: Math.round(v.number(body.shelfLifeDays, 'shelfLifeDays', { min: 0, max: 365, fallback: 1 })),
    freshness: v.oneOf(body.freshness, exports.FRESHNESS, 'freshness', 'good'),
    address: v.text(body.address, 'address', { max: 160, optional: true }) || 'Pasto',
    notes: v.text(body.notes, 'notes', { max: 300, optional: true }),
    lat: v.number(body.lat, 'lat', { min: -90, max: 90 }),
    lng: v.number(body.lng, 'lng', { min: -180, max: 180 }),
    ai: body.ai === true,
    photo,
  };
};
