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
