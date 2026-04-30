import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_W = 595.28;  // A4 portrait
const PAGE_H = 841.89;
const MARGIN_X = 64;
const MARGIN_Y = 72;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const COLOR_INK = rgb(0.11, 0.11, 0.12);     // #1c1c1e
const COLOR_MUTED = rgb(0.33, 0.33, 0.33);   // #555555
const COLOR_HONEY = rgb(0.79, 0.66, 0.30);   // #C9A84C
const COLOR_ALPINE = rgb(0.24, 0.32, 0.20);  // #3D5233

/**
 * Genera un PDF con todos los mensajes recibidos, en castellano,
 * maquetado para impresión o entrega en USB.
 *
 * - Portada: título + subtítulo
 * - Una entrada por mensaje: nombre + fecha + texto
 * - Salto de página automático
 *
 * Recibe el array de mensajes (formato messageWall) ya filtrado.
 * Devuelve un Uint8Array; el caller dispara la descarga.
 */
export async function generateMessagesPdf(messages, { totalContributors = null } = {}) {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const fontSans = await pdf.embedFont(StandardFonts.Helvetica);

  // ----- Portada -----
  const cover = pdf.addPage([PAGE_W, PAGE_H]);
  cover.drawText('Un millón de gracias', {
    x: MARGIN_X,
    y: PAGE_H - MARGIN_Y - 20,
    size: 11,
    font: fontSans,
    color: COLOR_HONEY,
  });
  cover.drawText('Mensajes para', {
    x: MARGIN_X,
    y: PAGE_H / 2 + 60,
    size: 28,
    font: fontRegular,
    color: COLOR_INK,
  });
  cover.drawText('MªÁngeles', {
    x: MARGIN_X,
    y: PAGE_H / 2 + 16,
    size: 56,
    font: fontBold,
    color: COLOR_INK,
  });
  if (totalContributors != null) {
    cover.drawText(
      `${totalContributors} ${totalContributors === 1 ? 'persona' : 'personas'}`,
      {
        x: MARGIN_X,
        y: PAGE_H / 2 - 30,
        size: 16,
        font: fontItalic,
        color: COLOR_MUTED,
      }
    );
  }
  cover.drawText('Hecho con cariño · Por las familias y exalumnos que pasaron por su clase', {
    x: MARGIN_X,
    y: MARGIN_Y,
    size: 11,
    font: fontSans,
    color: COLOR_MUTED,
  });

  // ----- Mensajes -----
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let cursorY = PAGE_H - MARGIN_Y;

  const drawHeaderRule = () => {
    page.drawRectangle({
      x: MARGIN_X,
      y: PAGE_H - MARGIN_Y / 2,
      width: 32,
      height: 1.5,
      color: COLOR_HONEY,
    });
  };
  drawHeaderRule();

  for (let idx = 0; idx < messages.length; idx++) {
    const msg = messages[idx];
    const dateStr = msg.createdAt?.toDate
      ? msg.createdAt.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    const lines = wrapText(msg.message || '', fontRegular, 13, CONTENT_W);
    const blockHeight = 28 + (dateStr ? 18 : 0) + lines.length * 18 + 32;

    if (cursorY - blockHeight < MARGIN_Y) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      cursorY = PAGE_H - MARGIN_Y;
      drawHeaderRule();
    }

    // Nombre
    page.drawText(msg.name, {
      x: MARGIN_X,
      y: cursorY,
      size: 14,
      font: fontBold,
      color: COLOR_ALPINE,
    });
    cursorY -= 22;

    // Fecha
    if (dateStr) {
      page.drawText(dateStr, {
        x: MARGIN_X,
        y: cursorY,
        size: 9,
        font: fontSans,
        color: COLOR_MUTED,
      });
      cursorY -= 18;
    }

    // Mensaje
    for (const line of lines) {
      page.drawText(line, {
        x: MARGIN_X,
        y: cursorY,
        size: 13,
        font: fontRegular,
        color: COLOR_INK,
      });
      cursorY -= 18;
    }

    cursorY -= 28;
  }

  return await pdf.save();
}

/**
 * Word-wrap simple. PDF-lib no incluye wrapping nativo.
 * Reemplaza caracteres no soportados por StandardFonts (latín-1) con aproximación.
 */
function wrapText(text, font, size, maxWidth) {
  const safe = sanitize(text);
  const paragraphs = safe.split(/\n/);
  const out = [];
  for (const para of paragraphs) {
    if (para.trim() === '') { out.push(''); continue; }
    const words = para.split(/\s+/);
    let current = '';
    for (const w of words) {
      const candidate = current ? `${current} ${w}` : w;
      const width = font.widthOfTextAtSize(candidate, size);
      if (width <= maxWidth) {
        current = candidate;
      } else {
        if (current) out.push(current);
        current = w;
      }
    }
    if (current) out.push(current);
  }
  return out;
}

/**
 * StandardFonts (Times, Helvetica) solo soportan WinAnsi (latín-1).
 * Reemplazamos caracteres comunes problemáticos por equivalentes seguros.
 */
function sanitize(text) {
  return String(text)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ');
}

/** Dispara la descarga de un Uint8Array como PDF. */
export function downloadPdf(bytes, filename = 'mensajes.pdf') {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
