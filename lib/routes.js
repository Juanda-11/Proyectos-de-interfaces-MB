'use strict';

const { route } = require('./router');

route('GET', '/health', require('./handlers/health'), { skipSeed: true });

const auth = require('./handlers/auth');
route('POST', '/auth/register', auth.register);
route('POST', '/auth/login', auth.login);
route('GET', '/auth/me', auth.me);
route('PATCH', '/auth/me', auth.updateMe);
route('DELETE', '/auth/me', auth.deleteMe);
route('POST', '/auth/password', auth.changePassword);

const donations = require('./handlers/donations');
route('GET', '/donations', donations.list);
route('POST', '/donations', donations.create);
route('GET', '/donations/:id', donations.get);
route('POST', '/donations/:id/reserve', donations.reserve);
route('POST', '/donations/:id/pickup', donations.pickup);
route('POST', '/donations/:id/deliver', donations.deliver);
route('POST', '/donations/:id/cancel', donations.cancel);

const notif = require('./handlers/notifications');
route('GET', '/notifications', notif.list);
route('POST', '/notifications/read-all', notif.readAll);

route('POST', '/demo/reset', require('./handlers/demo').reset);

const analyze = require('./handlers/analyze');
route('GET', '/analyze', analyze.status, { skipSeed: true });
route('POST', '/analyze', analyze.analyze);
