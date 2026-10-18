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

// Donaciones de ejemplo alrededor de Pasto, una por cada etapa del seguimiento.
exports.seedDonations = () => [
  { id: 'seed-1', title: 'Pan artesanal', category: 'bakery', qty: '12 unidades', kg: 3, donorId: 'demo-donor', donorName: 'Panadería La 14', receiverId: null, lat: CENTER.lat + 0.004, lng: CENTER.lng + 0.003, address: 'Calle 14 #22-10, Pasto', shelfLifeDays: 1, freshness: 'good', ai: true, notes: 'Disponible hasta las 7:00 PM.', code: 'FL-2026-084', status: 'available', createdAt: hoursAgo(2), history: { available: hoursAgo(2) } },
  { id: 'seed-2', title: 'Frutas mixtas', category: 'fruits', qty: '8 kg', kg: 8, donorId: 'demo-donor', donorName: 'Fruver El Campo', receiverId: 'demo-receiver', lat: CENTER.lat - 0.006, lng: CENTER.lng + 0.008, address: 'Plaza de Mercado El Potrerillo', shelfLifeDays: 2, freshness: 'fair', ai: true, notes: 'Maduración avanzada, ideal para jugos.', code: 'FL-2026-085', status: 'reserved', createdAt: hoursAgo(5), history: { available: hoursAgo(5), reserved: hoursAgo(3) } },
  { id: 'seed-3', title: 'Arroz preparado', category: 'meals', qty: '20 porciones', kg: 6, donorId: 'demo-donor', donorName: 'Restaurante Sabor Nariñense', receiverId: 'demo-receiver', lat: CENTER.lat + 0.009, lng: CENTER.lng - 0.006, address: 'Carrera 27 #18-40, Pasto', shelfLifeDays: 1, freshness: 'good', ai: false, notes: 'Mantener refrigerado.', code: 'FL-2026-086', status: 'onTheWay', createdAt: hoursAgo(7), history: { available: hoursAgo(7), reserved: hoursAgo(5), onTheWay: hoursAgo(1) } },
  { id: 'seed-4', title: 'Verduras frescas', category: 'vegetables', qty: '5 kg', kg: 5, donorId: 'demo-donor', donorName: 'Supermercado Central', receiverId: 'demo-receiver', lat: CENTER.lat - 0.003, lng: CENTER.lng - 0.009, address: 'Avenida Idema, Pasto', shelfLifeDays: 3, freshness: 'good', ai: true, notes: '', code: 'FL-2026-080', status: 'collected', createdAt: hoursAgo(50), history: { available: hoursAgo(50), reserved: hoursAgo(48), onTheWay: hoursAgo(47), collected: hoursAgo(46) } },
  { id: 'seed-5', title: 'Yogures y quesos', category: 'dairy', qty: '15 unidades', kg: 4, donorId: 'demo-donor', donorName: 'Lácteos Doña Rosa', receiverId: null, lat: CENTER.lat + 0.012, lng: CENTER.lng + 0.011, address: 'Barrio Lorenzo, Pasto', shelfLifeDays: 4, freshness: 'good', ai: true, notes: 'Cadena de frío garantizada.', code: 'FL-2026-087', status: 'available', createdAt: hoursAgo(1), history: { available: hoursAgo(1) } },
];
