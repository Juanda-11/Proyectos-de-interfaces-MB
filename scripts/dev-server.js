'use strict';

// Servidor local sin dependencias: sirve la misma API que Vercel en http://localhost:3000/api/...
// Carga .env.local si existe. Uso: npm run dev
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

require('../lib/routes');
const { handleRequest } = require('../lib/app');

const port = Number(process.env.PORT) || 3000;
http.createServer((req, res) => handleRequest(req, res)).listen(port, () => {
  console.log(`FoodLink API en http://localhost:${port}/api/health`);
});
