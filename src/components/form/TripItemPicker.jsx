import { useTripItems } from '../../hooks/useTripItems.js';
import { copy } from '../../content/copy.js';
import styles from './TripItemPicker.module.css';

/**
 * Selector de partida del viaje.
 * - Desktop: <select> dropdown.
 * - Mobile: fila de chips horizontales con scroll, primer chip = "Sin preferencia".
 *
 * Si el formulario llega con `lockedItem` (preseleccionado desde una tarjeta de
 * partida), no muestra picker — solo confirma visualmente la elección.
 */
export default function TripItemPicker({ value, onChange, variant = 'auto', lockedItem = null }) {
  const { items } = useTripItems();

  if (lockedItem) {
    return (
      <div className={styles.lockedRow}>
        <span className={styles.lockedLabel}>Aportas a:</span>
        <span className={styles.lockedValue}>{lockedItem.name}</span>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <label htmlFor="tripItemId" className={styles.label}>
        {copy.form.fields.tripItem}
      </label>

      {/* Desktop: dropdown */}
      <select
        id="tripItemId"
        className={`${styles.dropdown} ${variant === 'tags' ? styles.dropdownHidden : ''}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{copy.form.fields.tripItemDefault}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      {/* Mobile: chips horizontales */}
      <div
        className={`${styles.tags} ${variant === 'dropdown' ? styles.tagsHidden : ''}`}
        role="radiogroup"
        aria-label={copy.form.fields.tripItem}
      >
        <button
          type="button"
          role="radio"
          aria-checked={!value}
          className={`${styles.tag} ${!value ? styles.tagActive : ''}`}
          onClick={() => onChange('')}
        >
          Sin preferencia
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={value === item.id}
            className={`${styles.tag} ${value === item.id ? styles.tagActive : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
