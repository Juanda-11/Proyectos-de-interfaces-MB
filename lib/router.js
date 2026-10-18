'use strict';

// Router mínimo: patrones como /donations/:id/reserve → { id }.
const routes = [];

function compile(pattern) {
  const keys = [];
  const source = pattern
    .split('/')
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith(':')) {
        keys.push(part.slice(1));
        return '([^/]+)';
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { regex: new RegExp(`^/${source}/?$`), keys };
}

exports.route = (method, pattern, handler) => {
  routes.push({ method, ...compile(pattern), handler });
};
