'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const t = require('../lib/domain/transitions');

const donor = { id: 'd1', role: 'donor' };
const receiver = { id: 'r1', role: 'receiver' };
const other = { id: 'r2', role: 'receiver' };
const base = () => ({ id: 'x', donorId: 'd1', receiverId: null, status: 'available', code: 'FL-2026-084', history: { available: 'x' } });
const err = (fn) => {
  try {
    fn();
  } catch (e) {
    return e.code;
  }
  return 'ok';
};

test('reserve: solo receptores y solo si está disponible', () => {
  const { donation, notify } = t.reserve(base(), receiver, 0);
  assert.equal(donation.status, 'reserved');
  assert.equal(donation.receiverId, 'r1');
  assert.ok(donation.history.reserved);
  assert.deepEqual(notify, [{ userId: 'd1', type: 'reserved' }]);
  assert.equal(err(() => t.reserve(base(), donor)), 'only_receivers_can_reserve');
  assert.equal(err(() => t.reserve({ ...base(), status: 'reserved' }, receiver)), 'not_available');
});

test('startPickup: solo quien reservó', () => {
  const reserved = t.reserve(base(), receiver).donation;
  assert.equal(t.startPickup(reserved, receiver).donation.status, 'onTheWay');
  assert.equal(err(() => t.startPickup(reserved, other)), 'not_your_reservation');
  assert.equal(err(() => t.startPickup(base(), receiver)), 'not_your_reservation');
});

test('deliver: el receptor necesita el código; el donante no', () => {
  const onTheWay = { ...base(), receiverId: 'r1', status: 'onTheWay' };
  assert.equal(err(() => t.deliver(onTheWay, receiver, 'FL-0000')), 'wrong_code');
  const ok = t.deliver(onTheWay, receiver, ' fl-2026-084 ');
  assert.equal(ok.donation.status, 'collected');
  assert.equal(ok.notify.length, 2);
  assert.equal(t.deliver(onTheWay, donor).donation.status, 'collected');
  assert.equal(err(() => t.deliver(onTheWay, other, 'FL-2026-084')), 'not_participant');
  assert.equal(err(() => t.deliver(base(), donor)), 'invalid_status');
});

test('cancel: participantes, y no si ya cerró', () => {
  const reserved = { ...base(), receiverId: 'r1', status: 'reserved' };
  const out = t.cancel(reserved, receiver);
  assert.equal(out.donation.status, 'cancelled');
  assert.equal(out.notify.length, 2);
  assert.equal(t.cancel(base(), donor).notify.length, 1);
  assert.equal(err(() => t.cancel(reserved, other)), 'not_participant');
  assert.equal(err(() => t.cancel({ ...reserved, status: 'collected' }, donor)), 'already_closed');
});
