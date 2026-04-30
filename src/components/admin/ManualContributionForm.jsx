import { useState } from 'react';
import { useTripItems } from '../../hooks/useTripItems.js';
import { createManualContribution } from '../../firebase/contributions.js';
import styles from './ManualContributionForm.module.css';

const blankForm = {
  name: '',
  email: '',
  message: '',
  tripItemId: '',
  amount: '',
  status: 'paid', // por defecto, manual = ya cobrado
};

/**
 * Aportación manual: para cuando alguien le notifica a Gerry por otro canal
 * (WhatsApp, transferencia directa, etc.) y hay que registrarlo a mano.
 *
 * El registro y la actualización de contadores ocurren dentro de la misma
 * transacción de Firestore (`createManualContribution`), así que el
 * termómetro nunca queda descuadrado a mitad de la operación.
 */
export default function ManualContributionForm() {
  const { items: tripItems } = useTripItems({ onlyActive: false });
  const [form, setForm] = useState(blankForm);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    setFeedback(null);

    try {
      const tripItemId = form.tripItemId || null;
      const amount = form.amount ? Number(form.amount) : null;
      const message = form.message.trim() || null;

      const { contributionId } = await createManualContribution({
        name: form.name.trim(),
        email: form.email.trim() || null,
        message,
        tripItemId,
        amount,
        paymentStatus: form.status,
      });

      setFeedback({
        type: 'success',
        text: `Aportación de ${form.name} registrada (#${contributionId.slice(0, 6)}).`,
      });
      setForm(blankForm);
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        text: 'No se pudo guardar la aportación. Vuelve a intentarlo en un momento.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.section}>
      <header>
        <h2 className={styles.heading}>Añadir aportación manual</h2>
        <p className={styles.lead}>
          Para cuando alguien te notifica por WhatsApp, transferencia u otro canal
          y necesitas registrarlo a mano. Si la marcas como pagada, el termómetro
          se actualiza al instante.
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

        <label className={styles.field}>
          <span className={styles.label}>Correo (opcional)</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Mensaje (opcional)</span>
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </label>

        <div className={styles.row2}>
          <label className={styles.field}>
            <span className={styles.label}>Partida</span>
            <select
              value={form.tripItemId}
              onChange={(e) => setForm({ ...form, tripItemId: e.target.value })}
            >
              <option value="">Sin preferencia · fondo general</option>
              {tripItems.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Importe (€)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>
        </div>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>Estado</legend>
          <label className={styles.radio}>
            <input
              type="radio"
              name="status"
              value="paid"
              checked={form.status === 'paid'}
              onChange={() => setForm({ ...form, status: 'paid' })}
            />
            <span>Pagada (incrementa termómetro)</span>
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="status"
              value="pending"
              checked={form.status === 'pending'}
              onChange={() => setForm({ ...form, status: 'pending' })}
            />
            <span>Pendiente (no incrementa todavía)</span>
          </label>
        </fieldset>

        {feedback && (
          <p className={feedback.type === 'success' ? styles.success : styles.error}>
            {feedback.text}
          </p>
        )}

        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Guardando…' : 'Registrar aportación'}
        </button>
      </form>
    </section>
  );
}
