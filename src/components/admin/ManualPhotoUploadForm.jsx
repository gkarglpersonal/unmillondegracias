import { useRef, useState } from 'react';
import { useTripItems } from '../../hooks/useTripItems.js';
import { uploadPhoto } from '../../firebase/storage.js';
import { createManualPhotoEntry } from '../../firebase/messageWall.js';
import PhotoUploader from '../form/PhotoUploader.jsx';
import styles from './ManualContributionForm.module.css';

const blankForm = {
  name: '',
  message: '',
  tripItemId: '',
};

/**
 * Subida manual de foto desde /admin: para cuando alguien envía una foto
 * por WhatsApp u otro canal y el admin quiere ponerla en la galería en
 * nombre de esa persona.
 *
 * Flujo:
 *  1. Sube la foto a `photos/pending/` (mismo path que cualquier foto
 *     de usuario). El blob queda privado hasta aprobación.
 *  2. Crea un doc en `messageWall` con `excludeFromFeed: true` para que
 *     NO aparezca en el feed de "X se ha sumado". El feed sigue siendo
 *     exclusivo del formulario público.
 *  3. NO crea entrada en `contributions`: es solo subida de foto, no
 *     aportación económica. Si el admin quiere registrar también un
 *     importe, usa la pestaña "Aportación manual" en su lugar.
 *  4. La foto aparece después en la pestaña "Fotos" como pendiente y se
 *     aprueba con el flujo habitual; al aprobarla pasa a la galería
 *     pública.
 */
export default function ManualPhotoUploadForm() {
  const { items: tripItems } = useTripItems({ onlyActive: false });
  const [form, setForm] = useState(blankForm);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Guard síncrono contra doble-clic, mismo patrón que ManualContributionForm.
  const submittingRef = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    if (!form.name.trim() || !photo?.file) {
      submittingRef.current = false;
      return;
    }
    setBusy(true);
    setFeedback(null);

    try {
      const tripItemId = form.tripItemId || null;
      const message = form.message.trim() || null;

      const { storagePath } = await uploadPhoto(photo.file);

      const { id } = await createManualPhotoEntry({
        name: form.name.trim(),
        message,
        photoStoragePath: storagePath,
        tripItemId,
      });

      setFeedback({
        type: 'success',
        text: `Foto de ${form.name.trim()} subida (#${id.slice(0, 6)}). Apruébala desde la pestaña "Fotos" para que aparezca en la galería.`,
      });
      setForm(blankForm);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      setPhoto(null);
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        text: 'No se pudo subir la foto. Vuelve a intentarlo en un momento.',
      });
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <section className={styles.section}>
      <header>
        <h2 className={styles.heading}>Subir foto manual</h2>
        <p className={styles.lead}>
          Para cuando alguien te envía una foto por WhatsApp u otro canal y
          quieres ponerla en la galería en su nombre. NO genera entrada en
          el feed de "X se ha sumado" — eso solo lo hacen las
          participaciones del formulario público. La foto queda pendiente
          de aprobación; apruébala desde la pestaña "Fotos" como cualquier
          otra.
        </p>
      </header>

      <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>
          <span className={styles.label}>Nombre *</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>

        <PhotoUploader value={photo} onChange={setPhoto} />

        <label className={styles.field}>
          <span className={styles.label}>Mensaje (opcional)</span>
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Partida (opcional)</span>
          <select
            value={form.tripItemId}
            onChange={(e) => setForm({ ...form, tripItemId: e.target.value })}
          >
            <option value="">Sin asignar a partida</option>
            {tripItems.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        {feedback && (
          <p className={feedback.type === 'success' ? styles.success : styles.error}>
            {feedback.text}
          </p>
        )}

        <button
          type="submit"
          className="btn"
          disabled={busy || !form.name.trim() || !photo?.file}
        >
          {busy ? 'Subiendo…' : 'Subir foto'}
        </button>
      </form>
    </section>
  );
}
