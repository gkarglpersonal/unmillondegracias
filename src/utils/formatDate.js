const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const UNITS = [
  { unit: 'year', seconds: 60 * 60 * 24 * 365 },
  { unit: 'month', seconds: 60 * 60 * 24 * 30 },
  { unit: 'week', seconds: 60 * 60 * 24 * 7 },
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
];

/** Devuelve "hace 2 horas", "hace 3 días", etc. */
export function relativeTime(date) {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const diff = (d.getTime() - Date.now()) / 1000;

  for (const { unit, seconds } of UNITS) {
    if (Math.abs(diff) >= seconds) {
      return rtf.format(Math.round(diff / seconds), unit);
    }
  }
  return 'hace un momento';
}
