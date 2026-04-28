import { useRef } from 'react';
import { copy } from '../../content/copy.js';
import styles from './AmountField.module.css';

const PRESETS = [20, 50, 100, 200];

/**
 * Campo de importe con dos modos:
 *  - Sugerido: si la persona viene desde una partida, el campo se prerellena
 *    con el targetAmount y muestra "Importe sugerido para esta experiencia".
 *  - Libre: si no hay partida, muestra botones rápidos 20/50/100/200/Otro
 *    + input editable.
 *
 * En ambos modos el campo es siempre editable y nunca obligatorio.
 */
export default function AmountField({
  register,
  setValue,
  watch,
  error,
  suggestedAmount = null,
}) {
  const inputRef = useRef(null);
  const watched = watch('amount');
  const numValue = watched === '' || watched == null ? null : Number(watched);

  const isPreset = numValue != null && PRESETS.includes(numValue);
  const isCustom = numValue != null && !isPreset;

  // react-hook-form's register returns { ref, onChange, onBlur, name }
  const { ref: rhfRef, ...registerRest } = register('amount');

  const handlePreset = (value) => {
    setValue('amount', value, { shouldValidate: true, shouldDirty: true });
  };

  const handleOther = () => {
    setValue('amount', '', { shouldValidate: false, shouldDirty: true });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const hint = suggestedAmount != null
    ? copy.form.fields.amountSuggestedHint
    : copy.form.fields.amountHint;

  return (
    <div className={styles.field}>
      <span className={styles.label}>{copy.form.fields.amount}</span>

      {/* Modo libre: botones rápidos. No se muestran si hay sugerencia. */}
      {suggestedAmount == null && (
        <div className={styles.presets} role="group" aria-label="Importes rápidos">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.preset} ${numValue === p ? styles.presetActive : ''}`}
              onClick={() => handlePreset(p)}
            >
              {p} €
            </button>
          ))}
          <button
            type="button"
            className={`${styles.preset} ${isCustom ? styles.presetActive : ''}`}
            onClick={handleOther}
          >
            {copy.form.fields.amountOtherLabel}
          </button>
        </div>
      )}

      <input
        type="number"
        inputMode="decimal"
        min="1"
        step="1"
        placeholder={suggestedAmount != null ? String(suggestedAmount) : '—'}
        aria-invalid={!!error}
        {...registerRest}
        ref={(el) => {
          rhfRef(el);
          inputRef.current = el;
        }}
      />

      <span className={styles.hint}>{hint}</span>
      {error && <span className={styles.err}>{error.message}</span>}
    </div>
  );
}
