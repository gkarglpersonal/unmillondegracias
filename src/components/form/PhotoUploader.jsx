import { useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { compressImage } from '../../utils/compressImage.js';
import { isHeic, convertHeicToJpeg } from '../../utils/convertHeic.js';
import { copy } from '../../content/copy.js';
import styles from './PhotoUploader.module.css';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB pre-compresión

const HEIC_CONVERT_FAILED_MSG =
  'No hemos podido procesar esta foto. Vuelve a intentarlo; si sigue fallando, escríbeme a gerardo.kargl@gmail.com o mándamela por WhatsApp y la subo yo.';

export default function PhotoUploader({ value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reseleccionar el mismo archivo
    if (!file) return;

    setErr(null);

    // En algunos browsers (Linux, ciertos Windows) HEIC llega con type
    // vacío o "application/octet-stream". `isHeic` también mira la
    // extensión, así que primero comprobamos ahí.
    const heic = isHeic(file);

    if (!heic && !file.type.startsWith('image/')) {
      setErr('Solo imágenes (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr('La imagen supera los 8 MB. Prueba con una más pequeña.');
      return;
    }

    setBusy(true);
    try {
      let toProcess = file;

      if (heic) {
        try {
          toProcess = await convertHeicToJpeg(file);
        } catch (heicErr) {
          // Conversión HEIC falló: el navegador del usuario puede no
          // soportar wasm o el archivo es HEIC corrupto/cifrado.
          // Mensaje claro para que sepa qué hacer.
          console.error('HEIC conversion failed:', heicErr);
          setErr(HEIC_CONVERT_FAILED_MSG);
          return;
        }
      }

      const compressed = await compressImage(toProcess);
      const url = URL.createObjectURL(compressed);
      onChange({ file: compressed, previewUrl: url });
    } catch (e2) {
      console.error(e2);
      setErr(
        e2?.code === 'image-too-large'
          ? 'La foto es demasiado pesada y no hemos podido reducirla. Prueba con una más ligera.'
          : 'No se pudo procesar la imagen.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
    setErr(null);
  };

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{copy.form.fields.photo}</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleFile}
      />

      {!value && (
        <button
          type="button"
          className={styles.dropzone}
          onClick={handlePick}
          disabled={busy}
        >
          {busy ? 'Procesando…' : 'Añadir una foto'}
        </button>
      )}

      {value && (
        <div className={styles.preview}>
          <img src={value.previewUrl} alt="Vista previa" className={styles.thumb} />
          <button
            type="button"
            className={styles.removeBtn}
            onClick={handleClear}
            aria-label="Quitar foto"
          >
            Quitar
          </button>
        </div>
      )}

      {err && <p className={styles.err}>{err}</p>}

      <p className={styles.privacyNotice}>
        <ShieldCheck size={12} aria-hidden="true" className={styles.privacyIcon} />
        Por favor, no subas fotos donde aparezcan menores de edad actuales sin el
        consentimiento de sus padres o tutores.
      </p>
    </div>
  );
}
