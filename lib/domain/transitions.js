'use strict';

const { badRequest, forbidden, conflict } = require('../errors');

// Reglas de negocio del ciclo de vida de una donación (funciones puras, sin I/O):
//   available → reserved → onTheWay → collected     (o cancelled desde cualquier etapa abierta)
const STAGES = ['available', 'reserved', 'onTheWay', 'collected'];
const isFinal = (d) => d.status === 'collected' || d.status === 'cancelled';

const move = (donation, status, patch, now) => ({
  ...donation,
  ...patch,
  status,
  history: { ...donation.history, [status]: new Date(now).toISOString() },
});

exports.STAGES = STAGES;
exports.isFinal = isFinal;
exports.move = move;

// El receptor reserva una donación disponible (el donante no puede reservar la suya).
exports.reserve = (donation, user, now = Date.now()) => {
  if (user.role !== 'receiver' || donation.donorId === user.id) throw forbidden('only_receivers_can_reserve');
  if (donation.status !== 'available') throw conflict('not_available');
  return {
    donation: move(donation, 'reserved', { receiverId: user.id }, now),
    notify: [{ userId: donation.donorId, type: 'reserved' }],
  };
};

// Solo el receptor que reservó puede iniciar la recogida.
exports.startPickup = (donation, user, now = Date.now()) => {
  if (donation.receiverId !== user.id) throw forbidden('not_your_reservation');
  if (donation.status !== 'reserved') throw conflict('invalid_status');
  return {
    donation: move(donation, 'onTheWay', {}, now),
    notify: [{ userId: donation.donorId, type: 'onTheWay' }],
  };
};

const normalizeCode = (value) => String(value || '').trim().toUpperCase();

// El donante confirma la entrega directamente; el receptor debe ingresar el código del donante.
exports.deliver = (donation, user, code, now = Date.now()) => {
  const isDonor = donation.donorId === user.id;
  const isReceiver = donation.receiverId === user.id;
  if (!isDonor && !isReceiver) throw forbidden('not_participant');
  if (donation.status !== 'onTheWay') throw conflict('invalid_status');
  if (!isDonor && normalizeCode(code) !== normalizeCode(donation.code)) throw badRequest('wrong_code');
  const notify = [{ userId: donation.donorId, type: 'collected' }];
  if (donation.receiverId) notify.push({ userId: donation.receiverId, type: 'collected' });
  return { donation: move(donation, 'collected', {}, now), notify };
};

// Donante o receptor involucrado pueden cancelar mientras el proceso siga abierto.
exports.cancel = (donation, user, now = Date.now()) => {
  const isDonor = donation.donorId === user.id;
  const isReceiver = donation.receiverId === user.id;
  if (!isDonor && !isReceiver) throw forbidden('not_participant');
  if (isFinal(donation)) throw conflict('already_closed');
  const notify = [{ userId: donation.donorId, type: 'cancelled' }];
  if (donation.receiverId) notify.push({ userId: donation.receiverId, type: 'cancelled' });
  return { donation: move(donation, 'cancelled', {}, now), notify };
};
