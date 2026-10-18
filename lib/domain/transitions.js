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
