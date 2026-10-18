'use strict';

// Los modelos a veces envuelven el JSON en ```json ... ``` o añaden texto: se extrae el objeto.
function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error('no_json_in_response');
  }
}

module.exports = { extractJson };
