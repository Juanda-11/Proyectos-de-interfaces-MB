'use strict';

const crypto = require('node:crypto');
const { getStore } = require('../store');

const DONATIONS = 'donations'; // id → JSON

// El código de entrega solo lo ve el donante; el receptor debe recibirlo de él.
const serialize = (donation, viewer) => {
  const { code, ...rest } = donation;
  return viewer && viewer.id === donation.donorId ? { ...rest, code } : rest;
};
exports.serialize = serialize;

exports.newCode = () => `FL-2026-${String(crypto.randomInt(0, 1000)).padStart(3, '0')}`;

const get = async (id) => {
  const raw = await getStore().hget(DONATIONS, id);
  return raw ? JSON.parse(raw) : null;
};
exports.get = get;

exports.save = (donation) => getStore().hset(DONATIONS, donation.id, JSON.stringify(donation));
