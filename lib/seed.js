'use strict';

const { getStore } = require('./store');
const users = require('./models/users');
const donations = require('./models/donations');
const notifications = require('./models/notifications');

// Cuentas de demostración (también documentadas en el README).
exports.DEMO_USERS = [
  { id: 'demo-receiver', name: 'Juan Pérez', email: 'receptor@foodlink.app', role: 'receiver', phone: '300 123 4567', address: 'Centro, Pasto', createdAt: '2026-08-15T10:00:00.000Z' },
  { id: 'demo-donor', name: 'Laura Rivas', email: 'donante@foodlink.app', role: 'donor', phone: '300 765 4321', address: 'Calle 14 #22-10, Pasto', createdAt: '2026-08-15T10:00:00.000Z' },
];
exports.DEMO_PASSWORD = 'demo1234';

const CENTER = { lat: 1.2136, lng: -77.2811 }; // Pasto, Nariño
const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
