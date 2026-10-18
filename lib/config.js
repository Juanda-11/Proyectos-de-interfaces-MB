'use strict';

// Lee la configuración del entorno en cada llamada (facilita las pruebas).
const env = (name) => {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
};
exports.env = env;

exports.isProduction = () => env('VERCEL_ENV') === 'production' || env('NODE_ENV') === 'production';
