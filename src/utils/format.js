/**
 * Formatea un valor numerico a pesos colombianos (COP).
 * Ejemplo: 25000 -> "$25.000 COP"
 * @param {number} value
 * @returns {string}
 */
export function formatCOP(value) {
  if (value === undefined || value === null) return "$0 COP";
  return `$${Math.round(value).toLocaleString('es-CO')} COP`;
}
