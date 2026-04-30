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
 *  { ok: false, reason: 'send-failed', error } — EmailJS lanzó.
 *
 * Estas funciones NUNCA tiran. El llamador decide qué hacer con el fallo
 * (típicamente: guardar la contribución igual y avisar al usuario).
 */

/** Envía a PANGEA The Travel Store (con copia a Gerry) los datos para gestionar el cobro. */
export async function notifyPangea({ name, email, amount, tripItemName, message }) {
  init();
  if (!SERVICE_ID || !TEMPLATE_PANGEA || !PUBLIC_KEY) {
    return { ok: false, reason: 'not-configured' };
  }
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_PANGEA, {
      contributor_name: name,
      contributor_email: email,
      amount_eur: amount,
      trip_item: tripItemName || 'Sin preferencia (fondo general)',
      message: message || '(sin mensaje)',
    });
    return { ok: true };
  } catch (error) {
    console.error('notifyPangea: EmailJS send failed', error);
    return { ok: false, reason: 'send-failed', error };
  }
}

const KIND_LABELS = {
  contribution: 'Aportación al viaje',
  'message-only': 'Solo mensaje y/o foto',
};

/** Notifica a Gerry de cualquier submission (con/sin contribución). */
export async function notifyAdmin({ name, kind, hasPhoto, hasMessage, amount, adminUrl }) {
  init();
  if (!SERVICE_ID || !TEMPLATE_ADMIN || !PUBLIC_KEY) {
    return { ok: false, reason: 'not-configured' };
  }
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ADMIN, {
      contributor_name: name,
      submission_kind: KIND_LABELS[kind] || kind,
      has_photo: hasPhoto ? 'Sí' : 'No',
      has_message: hasMessage ? 'Sí' : 'No',
      amount_eur: amount ? `${amount} €` : '—',
      admin_url: adminUrl,
    });
    return { ok: true };
  } catch (error) {
    console.error('notifyAdmin: EmailJS send failed', error);
    return { ok: false, reason: 'send-failed', error };
  }
}
