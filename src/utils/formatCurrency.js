const fmt = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export const formatCurrency = (n) => fmt.format(n || 0);

/** Solo el número, sin símbolo. Ej: "1.200" */
export const formatNumber = (n) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n || 0);

/** Calcula porcentaje y lo limita a 0-100. */
export const percent = (raised, target) => {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((raised / target) * 100));
};
