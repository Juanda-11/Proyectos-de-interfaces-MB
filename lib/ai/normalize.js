'use strict';

const CATEGORIES = ['bakery', 'fruits', 'vegetables', 'meals', 'dairy', 'other'];
const num = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

// Sanea la respuesta del modelo: tipos, rangos y longitudes seguros para guardar y mostrar.
function normalize(raw) {
  return {
    isFood: raw.isFood !== false,
    name: String(raw.name || '').slice(0, 80),
    category: CATEGORIES.includes(raw.category) ? raw.category : 'other',
    quantityText: String(raw.quantityText || '').slice(0, 60),
    weightKg: Math.max(0, Math.round(num(raw.weightKg, 1) * 10) / 10),
    freshness: ['good', 'fair', 'poor'].includes(raw.freshness) ? raw.freshness : 'good',
    shelfLifeDays: Math.max(0, Math.round(num(raw.shelfLifeDays, 1))),
    storage: String(raw.storage || '').slice(0, 160),
    allergens: Array.isArray(raw.allergens) ? raw.allergens.map(String).slice(0, 8) : [],
    safeToDonate: raw.safeToDonate !== false,
    notes: String(raw.notes || '').slice(0, 200),
    confidence: Math.min(1, Math.max(0, num(raw.confidence, 0.7))),
  };
}

module.exports = { normalize };
