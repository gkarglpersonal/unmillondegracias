import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, defaultFormValues } from './formSchema.js';
import { copy } from '../../content/copy.js';
import { useTripItems } from '../../hooks/useTripItems.js';
import TripItemPicker from './TripItemPicker.jsx';
import PhotoUploader from './PhotoUploader.jsx';
import { uploadPhoto } from '../../firebase/storage.js';
import { createContribution } from '../../firebase/contributions.js';
import { notifyPangea, notifyAdmin } from '../../firebase/email.js';
import styles from './ParticipationForm.module.css';

/**
 * Formulario unificado de participación.
 *
 * Props:
 *  - variant: 'sidebar' (en el sidebar desktop) | 'modal' (mobile fullscreen) | 'inline'
 *  - lockedTripItemId: si viene desde una tarjeta de partida, queda preseleccionada
 *  - onSuccess: callback con datos cuando la submission termina OK
 */
export default function ParticipationForm({
  variant = 'sidebar',
  lockedTripItemId = null,
  onSuccess,
}) {
  const { items: tripItems } = useTripItems();
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultFormValues,
      tripItemId: lockedTripItemId || '',
    },
  });

  const lockedItem = lockedTripItemId
    ? tripItems.find((t) => t.id === lockedTripItemId)
    : null;

  const onValid = async (data) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Sube la foto si la hay
      let photoStoragePath = null;
      let photoUrl = null;
      if (photo?.file) {
        const up = await uploadPhoto(photo.file);
        photoStoragePath = up.path;
        photoUrl = up.url;
      }

      const tripItemId = data.tripItemId || null;
      const tripItem = tripItemId ? tripItems.find((t) => t.id === tripItemId) : null;
      const amount = data.amount && data.amount > 0 ? Number(data.amount) : null;
      const message = data.message?.trim() || null;

      // 2. Crea contribution + messageWall (atómico via la función)
      await createContribution({
        name: data.name.trim(),
        email: data.email.trim(),
        message,
        photoUrl,
        photoStoragePath,
        tripItemId,
        amount,
      });

      // 3. Dispara emails
      const adminUrl = `${window.location.origin}/admin`;
      const kind = amount ? 'contribution' : 'message-only';

      // Email a PANGEA solo si hay monto
      if (amount) {
        try {
          await notifyPangea({
            name: data.name.trim(),
            email: data.email.trim(),
            amount,
            tripItemName: tripItem?.name || null,
            message,
          });
        } catch (e) {
          console.warn('notifyPangea falló (la submission ya está guardada):', e);
        }
      }

      try {
        await notifyAdmin({
          name: data.name.trim(),
          kind,
          hasPhoto: !!photoUrl,
          hasMessage: !!message,
          amount,
          adminUrl,
        });
      } catch (e) {
        console.warn('notifyAdmin falló:', e);
      }

      onSuccess?.({
        name: data.name.trim(),
        amount,
        hasMessage: !!message,
        hasPhoto: !!photoUrl,
      });
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitError(
        'No hemos podido guardar tu participación. Vuelve a intentarlo en un momento.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className={`${styles.form} ${styles[`variant_${variant}`]}`}
      onSubmit={handleSubmit(onValid)}
      noValidate
    >
      {variant === 'sidebar' && (
        <header className={styles.header}>
          <h2 className={styles.title}>Súmate al regalo</h2>
        </header>
      )}

      <div className={styles.fields}>
        {/* Nombre */}
        <label className={styles.field}>
          <span className={styles.label}>{copy.form.fields.name} *</span>
          <input
            type="text"
            autoComplete="name"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && <span className={styles.err}>{errors.name.message}</span>}
        </label>

        {/* Email */}
        <label className={styles.field}>
          <span className={styles.label}>{copy.form.fields.email} *</span>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className={styles.err}>{errors.email.message}</span>}
        </label>

        {/* Mensaje */}
        <label className={styles.field}>
          <span className={styles.label}>{copy.form.fields.message}</span>
          <textarea
            rows={5}
            placeholder={copy.form.fields.messagePlaceholder}
            {...register('message')}
          />
          {errors.message && <span className={styles.err}>{errors.message.message}</span>}
        </label>

        {/* Foto */}
        <PhotoUploader value={photo} onChange={setPhoto} />

        {/* Partida */}
        <Controller
          control={control}
          name="tripItemId"
          render={({ field }) => (
            <TripItemPicker
              value={field.value}
              onChange={field.onChange}
              lockedItem={lockedItem}
            />
          )}
        />

        {/* Monto */}
        <label className={styles.field}>
          <span className={styles.label}>{copy.form.fields.amount}</span>
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            placeholder="—"
            {...register('amount')}
            aria-invalid={!!errors.amount}
          />
          <span className={styles.hint}>{copy.form.fields.amountHint}</span>
          {errors.amount && <span className={styles.err}>{errors.amount.message}</span>}
        </label>
      </div>

      {submitError && <p className={styles.submitError}>{submitError}</p>}

      <button
        type="submit"
        className={`btn btn-honey ${styles.submitBtn}`}
        disabled={submitting}
      >
        {submitting ? 'Enviando…' : copy.form.submit}
      </button>
    </form>
  );
}
