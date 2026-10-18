'use strict';

const { route } = require('./router');

route('GET', '/health', require('./handlers/health'));
