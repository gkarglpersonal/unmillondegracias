import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, defaultFormValues } from './formSchema.js';
import { copy } from '../../content/copy.js';
import { useTripItems } from '../../hooks/useTripItems.js';
import TripItemPicker from './TripItemPicker.jsx';
import PhotoUploader from './PhotoUploader.jsx';
import AmountField from './AmountField.jsx';
import { uploadPhoto, deletePhotoByPath } from '../../firebase/storage.js';
import {
  createContribution,
  deleteContributionById,
  deletePublicMessageById,
  generateContributionIds,
} from '../../firebase/contributions.js';
import { notifyPangea, notifyAdmin } from '../../firebase/email.js';
import styles from './ParticipationForm.module.css';

/**
 * Formulario unificado de participación.
 *
 * Props:
 *  - variant: 'sidebar' (en el sidebar desktop) | 'modal' (mobile fullscreen) | 'inline'
 *  - lockedTripItemId: si viene desde una tarjeta de partida, queda preseleccionada
 *  - onSuccess: callback con datos cuando la submission termina OK.
 *      data = { name, amount, hasMessage, hasPhoto, warning? }
 *      `warning` aparece cuando la contribución se ha guardado pero alguna
 *      notificación por email ha fallado.
 *
 * Diseño del submit (críticos #2, #3, #6):
 *  - Idempotencia anti doble-clic con `submittingRef` síncrono. Cualquier
 *    re-disparo del handler antes de que el primero termine se ignora.
 *  - Pre-generación de IDs (contributionId + publicMessageId) antes de
 *    cualquier write. Si el guardado falla y el usuario reintenta, se usan
 *    los mismos IDs: setDoc es idempotente, no hay duplicados.
 *  - Cleanup compensatorio si algo falla a mitad: se borran recursos
 *    parciales (foto en Storage, doc de contribution) en orden inverso.
 *  - Honestidad en el éxito: si los emails fallan, la contribución se
 *    guarda igual pero el SuccessOverlay muestra un aviso explícito en
 *    lugar de un falso "todo perfecto".
 */
export default function ParticipationForm({
  variant = 'sidebar',
  lockedTripItemId = null,
  onSuccess,
  onSubmittingChange,
}) {
  const { items: tripItems } = useTripItems();
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Guard síncrono contra doble-clic. `setSubmitting` es asíncrono y no
  // protege del segundo evento que entra en el mismo tick antes del re-render.
  // Un useRef sí: la asignación es inmediata y la lectura del ref también.
  const submittingRef = useRef(false);

  // Estado retenido entre intentos para que un reintento sea idempotente:
  // mismos IDs Firestore, mismo path de foto en Storage. Un fallo de red
  // a mitad no produce duplicados al reintentar.
  const attemptStateRef = useRef({
    ids: null, // { contributionId, publicMessageId }
    photoStoragePath: null, // path en Storage si la foto ya subió
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
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

  // Cuando se conoce la partida bloqueada y tiene targetAmount, prerrellenar
  // el campo de importe como sugerencia. La persona puede cambiarlo o vaciarlo.
  useEffect(() => {
    if (lockedItem?.targetAmount) {
      setValue('amount', lockedItem.targetAmount, { shouldDirty: false });
    }
  }, [lockedItem, setValue]);

  const onValid = async (data) => {
    // === Crítico #3: defensa síncrona contra doble-clic ===
    // Esta comprobación se evalúa en el mismo tick del evento submit,
    // antes de cualquier setState. Si ya hay un submit en vuelo, return
    // inmediato. El botón con disabled es la segunda capa.
    if (submittingRef.current) return;
    submittingRef.current = true;
    // Notificamos al contenedor (FormModal) para que bloquee ESC y × mientras
    // el submit está en vuelo. Simétrico al patrón ya existente para `success`.
    onSubmittingChange?.(true);

    setSubmitting(true);
    setSubmitError(null);

    // IDs e identificador de foto persistentes entre reintentos.
    if (!attemptStateRef.current.ids) {
      attemptStateRef.current.ids = generateContributionIds();
    }
    const { contributionId, publicMessageId } = attemptStateRef.current.ids;

    const tripItemId = data.tripItemId || null;
    const tripItem = tripItemId ? tripItems.find((t) => t.id === tripItemId) : null;
    const amount = data.amount && data.amount > 0 ? Number(data.amount) : null;
    const amountPrivate = amount ? Boolean(data.amountPrivate) : false;
    const message = data.message?.trim() || null;
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim();

    // Bandera para el cleanup compensatorio: solo borramos la foto si la
    // hemos subido EN ESTE intento. Si venía de un intento anterior
    // (idempotencia), la conservamos para el siguiente reintento.
    let photoUploadedThisAttempt = false;

    try {
      // === Paso 1+2: subir foto si hay (idempotente entre reintentos) ===
      // Si la foto ya se subió en un intento previo, reusamos el path
      // y no volvemos a subir. Si todavía no, subimos y guardamos el path
      // en el ref antes de tocar Firestore: así un fallo de Firestore
      // no nos deja sin saber qué borrar.
      if (photo?.file && !attemptStateRef.current.photoStoragePath) {
        // Pasamos contributionId para nombrar el blob de forma estable:
        // si el usuario reintenta, el path resultante sería el mismo, lo
        // que ayuda al debugging y a la traza admin → blob.
        try {
          const { storagePath } = await uploadPhoto(photo.file, { contributionId });
          attemptStateRef.current.photoStoragePath = storagePath;
          photoUploadedThisAttempt = true;
        } catch (photoErr) {
          // Anotamos la fase para que el catch externo pueda mostrar copy
          // específico al usuario sin tener que distinguir por mensaje.
          photoErr.phase = 'photo';
          throw photoErr;
        }
      }
      const photoStoragePath = attemptStateRef.current.photoStoragePath;

      // === Paso 3+4: crear los dos docs Firestore ===
      // createContribution hace setDoc con los IDs pre-generados. Si la
      // segunda escritura falla, contribution queda creada pero
      // messageWall no — lo limpiamos en el catch de abajo.
      try {
        await createContribution({
          contributionId,
          publicMessageId,
          name: trimmedName,
          email: trimmedEmail,
          message,
          photoStoragePath,
          tripItemId,
          amount,
          amountPrivate,
        });
      } catch (saveErr) {
        // Caso especial: timeout esperando confirmación del servidor. Las
        // escrituras siguen pendientes en cache local de Firestore y, si
        // el usuario reconecta, se aplicarán. Llamar a deleteDoc aquí
        // añadiría más operaciones a la cola que, si la pestaña se cierra
        // antes de sincronizar todo, podrían dejar setDoc sin deleteDoc
        // (docs huérfanos). Mejor: no tocar nada, conservar IDs en
        // attemptStateRef y dejar que el usuario reintente cuando vuelva
        // la red — setDoc es idempotente.
        if (saveErr?.code !== 'server-ack-timeout') {
          // Cleanup normal en orden inverso: messageWall (puede o no
          // existir), contribution (puede o no existir), foto (si se
          // subió en este intento). deletePublicMessageById /
          // deleteContributionById son no-throw; si falla el cleanup, se
          // loguea y seguimos.
          await deletePublicMessageById(publicMessageId);
          await deleteContributionById(contributionId);
          if (photoUploadedThisAttempt && photoStoragePath) {
            await deletePhotoByPath(photoStoragePath);
            attemptStateRef.current.photoStoragePath = null;
          }
        }
        saveErr.phase = 'save';
        throw saveErr;
      }

      // === Paso 5: notificaciones por email ===
      // Crítico #6: notifyPangea y notifyAdmin retornan { ok, reason }
      // y NO tiran. Recogemos el resultado y construimos un warning
      // honesto si algo falló.
      const adminUrl = `${window.location.origin}/admin`;
      const kind = amount ? 'contribution' : 'message-only';

      let pangeaResult = { ok: true };
      if (amount) {
        pangeaResult = await notifyPangea({
          name: trimmedName,
          email: trimmedEmail,
          amount,
          tripItemName: tripItem?.name || null,
          message,
        });
      }

      // notifyAdmin se llama por su efecto secundario: NO afectamos al
      // usuario si falla (su contribución es válida igual y el admin se
      // entera por consola/Firestore). Solo el fallo de PANGEA, cuando
      // hay importe, sí merece aviso explícito al donante.
      // Le pasamos el estado de PANGEA para que el correo al admin diga
      // claramente si hay que atender el cobro manualmente.
      const pangeaStatus = amount ? (pangeaResult.ok ? 'ok' : 'failed') : 'no-amount';
      await notifyAdmin({
        name: trimmedName,
        kind,
        hasPhoto: !!photoStoragePath,
        hasMessage: !!message,
        amount,
        adminUrl,
        pangeaStatus,
      });

      const warning =
        amount && !pangeaResult.ok
          ? 'Tu participación se ha guardado correctamente, pero no hemos podido enviar la notificación a PANGEA en este momento. Nos pondremos en contacto contigo en cuanto resolvamos esa parte para enviarte el enlace de pago.'
          : null;

      // Submit completado: limpiamos el estado de reintento para que un
      // próximo submit del mismo formulario use IDs nuevos.
      attemptStateRef.current = { ids: null, photoStoragePath: null };

      onSuccess?.({
        name: trimmedName,
        amount,
        hasMessage: !!message,
        hasPhoto: !!photoStoragePath,
        warning,
      });

      // Tras éxito, vaciar el formulario para que el usuario no envíe la
      // misma participación dos veces. En la variante 'modal', el modal
      // desmonta tras cerrar el SuccessOverlay; el reset cubre el caso del
      // sidebar desktop, donde el form queda montado y visible.
      reset({
        ...defaultFormValues,
        tripItemId: lockedTripItemId || '',
      });
      setPhoto(null);
      setSubmitError(null);
    } catch (err) {
      // Llegamos aquí si:
      //  - falló la subida de foto (paso 1-2)
      //  - falló el guardado en Firestore (paso 3 o 4) — cleanup ya hecho
      //  - falló cualquier cosa inesperada antes del éxito
      // En todos los casos: NO mostramos SuccessOverlay (no mentir al
      // usuario). Mostramos error inline con botón de "Reintentar". El
      // reintento reusa los IDs ya generados (idempotente vía setDoc) y
      // el path de foto si ya estaba subida — no se duplican recursos.
      console.error('Submit failed:', err);
      // Mensaje específico según la fase / código del error. El código
      // `server-ack-timeout` (la escritura no se confirmó en el servidor
      // dentro del timeout) tiene prioridad sobre la fase porque marca un
      // problema de red distinto del de validación o permisos.
      const phase = err?.phase;
      const code = err?.code;
      const msg =
        code === 'server-ack-timeout'
          ? copy.form.errors.serverTimeout
          : code === 'upload-timeout'
            ? copy.form.errors.photoTimeout
            : phase === 'photo'
              ? copy.form.errors.photo
              : phase === 'save'
                ? copy.form.errors.save
                : copy.form.errors.unknown;
      setSubmitError(msg);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      onSubmittingChange?.(false);
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

        {/* Importe — sugerido si hay partida bloqueada, o presets rápidos */}
        <AmountField
          register={register}
          setValue={setValue}
          watch={watch}
          error={errors.amount}
          suggestedAmount={lockedItem?.targetAmount ?? null}
        />

        {/* Privacidad del importe — Mariángeles ve nombre y mensaje, no el monto */}
        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            className={styles.checkbox}
            {...register('amountPrivate')}
          />
          <span className={styles.checkboxText}>
            {copy.form.fields.amountPrivate}
          </span>
        </label>

        {/* Consentimiento RGPD — obligatorio. Texto y link sostenidos por copy.js. */}
        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            className={styles.checkbox}
            {...register('privacyAccepted')}
            aria-invalid={!!errors.privacyAccepted}
          />
          <span className={styles.checkboxText}>
            He leído y acepto la{' '}
            <a
              href="https://unmillondegracias.com/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.privacyLink}
            >
              política de privacidad
            </a>
            . Entiendo que mi nombre, mensaje y foto se mostrarán en la web pública (la foto solo tras aprobación del admin) y que, si indico un importe, mis datos de contacto se cederán a{' '}
            <strong>PANGEA The Travel Store</strong> para gestionar el cobro.
          </span>
        </label>
        {errors.privacyAccepted && (
          <span className={styles.err}>{errors.privacyAccepted.message}</span>
        )}
      </div>

      {submitError && <p className={styles.submitError}>{submitError}</p>}

      <button
        type="submit"
        className={`btn btn-honey ${styles.submitBtn}`}
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? 'Enviando…' : submitError ? 'Reintentar' : copy.form.submit}
      </button>
    </form>
  );
}
