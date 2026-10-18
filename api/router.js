'use strict';

// Única función serverless de Vercel: vercel.json reescribe /api/* hacia aquí
// (así no se agota el límite de funciones del plan gratuito).
require('../lib/routes');
const { handleRequest } = require('../lib/app');

module.exports = handleRequest;
