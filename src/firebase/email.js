import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_PANGEA = import.meta.env.VITE_EMAILJS_TEMPLATE_PANGEA;
const TEMPLATE_ADMIN = import.meta.env.VITE_EMAILJS_TEMPLATE_ADMIN;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

let initialized = false;
function init() {
  if (initialized || !PUBLIC_KEY) return;
  emailjs.init({ publicKey: PUBLIC_KEY });
  initialized = true;
}

/**
 * Contrato unificado de retorno para los notificadores:
 *  { ok: true }                               — envío correcto.
 *  { ok: false, reason: 'not-configured' }    — variables de entorno ausentes.
 *  { ok: false, reason: 'send-failed', error } — EmailJS lanzó tras agotar reintentos.
 *
 * Estas funciones NUNCA tiran. El llamador decide qué hacer con el fallo
 * (típicamente: guardar la contribución igual y avisar al usuario).
 */

/**
 * Helper interno: envía con reintentos y backoff exponencial.
 *
 * Estrategia: 3 intentos con esperas de 0ms, 300ms y 900ms entre fallos
 * (peor caso ~1.2s extra antes de declararlo perdido). Cubre fallos
 * transitorios típicos de EmailJS (timeout puntual, hipo de red) sin
 * convertir el submit en una espera larga si el servicio está caído.
 *
 * No hace falta distinguir tipos de error: si EmailJS lanza, reintentamos.
 * Si todos los intentos fallan, devolvemos el último error para logging.
 */
async function sendWithRetry(serviceId, templateId, params, maxAttempts = 3) {
  let lastErr = null;
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      await emailjs.send(serviceId, templateId, params);
      return { ok: true };
    } catch (error) {
      lastErr = error;
      // Solo esperamos si todavía quedan intentos por delante.
      if (i < maxAttempts - 1) {
        const delay = 300 * Math.pow(3, i);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  return { ok: false, reason: 'send-failed', error: lastErr };
}

/** Envía a PANGEA The Travel Store (con copia a Gerry) los datos para gestionar el cobro. */
export async function notifyPangea({ name, email, amount, tripItemName, message }) {
  init();
  if (!SERVICE_ID || !TEMPLATE_PANGEA || !PUBLIC_KEY) {
    return { ok: false, reason: 'not-configured' };
  }
  const result = await sendWithRetry(SERVICE_ID, TEMPLATE_PANGEA, {
    contributor_name: name,
    contributor_email: email,
    amount_eur: amount,
    trip_item: tripItemName || 'Sin preferencia (fondo general)',
    message: message || '(sin mensaje)',
  });
  if (!result.ok && result.reason === 'send-failed') {
    console.error('notifyPangea: EmailJS send failed tras reintentos', result.error);
  }
  return result;
}

const KIND_LABELS = {
  contribution: 'Aportación al viaje',
  'message-only': 'Solo mensaje y/o foto',
};

/**
 * Notifica a Gerry de cualquier submission (con/sin contribución).
 *
 * `pangeaStatus` (opcional) indica si la notificación a PANGEA tuvo éxito,
 * de modo que el correo al admin deja claro si hay que atender el cobro
 * manualmente. Valores típicos:
 *   - 'ok'        — PANGEA recibió el aviso correctamente.
 *   - 'failed'    — los reintentos a PANGEA fallaron; atender manualmente.
 *   - 'no-amount' — no hay importe, no hace falta avisar a PANGEA.
 */
export async function notifyAdmin({ name, kind, hasPhoto, hasMessage, amount, adminUrl, pangeaStatus }) {
  init();
  if (!SERVICE_ID || !TEMPLATE_ADMIN || !PUBLIC_KEY) {
    return { ok: false, reason: 'not-configured' };
  }
  const result = await sendWithRetry(SERVICE_ID, TEMPLATE_ADMIN, {
    contributor_name: name,
    submission_kind: KIND_LABELS[kind] || kind,
    has_photo: hasPhoto ? 'Sí' : 'No',
    has_message: hasMessage ? 'Sí' : 'No',
    amount_eur: amount ? `${amount} €` : '—',
    admin_url: adminUrl,
    pangea_status: pangeaStatus || '',
  });
  if (!result.ok && result.reason === 'send-failed') {
    console.error('notifyAdmin: EmailJS send failed tras reintentos', result.error);
  }
  return result;
}
