import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useFormModal } from '../form/FormProvider.jsx';
import CategoryIcon from '../ui/CategoryIcon.jsx';
import HeartIcon from '../ui/HeartIcon.jsx';
import ThermometerBar from './ThermometerBar.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import styles from './TripItemCard.module.css';

/**
 * Tarjeta de partida en formato acordeón.
 *
 * Estructura en 3 bloques (flex column con justify-content: space-between):
 *   1. titleBlock: icono + título (max 2 líneas) + chevron, y descripción
 *      colapsable que se despliega bajo el título.
 *   2. progressRow: importe + barra. Altura consistente entre tarjetas
 *      del mismo grupo para alineación visual.
 *   3. cta: botón "Regalar" pill compacto centrado.
 */
export default function TripItemCard({ item }) {
  const { openForm } = useFormModal();
  const [expanded, setExpanded] = useState(false);

  const isFlight = item.category === 'flight';

  return (
    <article className={`${styles.card} ${isFlight ? styles.cardFlight : ''}`}>
      <div className={styles.titleBlock}>
        <button
          type="button"
          className={styles.head}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={`desc-${item.id}`}
        >
          <CategoryIcon category={item.category} className={styles.categoryIcon} />
          <h3 className={styles.title}>{item.name}</h3>
          <ChevronDown
            size={18}
            strokeWidth={2}
            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          />
        </button>

        <div
          id={`desc-${item.id}`}
          className={`${styles.descriptionWrap} ${expanded ? styles.expanded : ''}`}
        >
          <div className={styles.descriptionInner}>
            <p className={styles.description}>{item.description}</p>
          </div>
        </div>
      </div>

      <div className={styles.progressRow}>
        <span className={styles.amount}>{formatCurrency(item.targetAmount)}</span>
        <ThermometerBar raised={item.raisedAmount || 0} target={item.targetAmount} />
      </div>

      <button
        type="button"
        className={`btn ${styles.cta}`}
        onClick={() => openForm({ tripItemId: item.id })}
      >
        <HeartIcon className={styles.heartIcon} size={16} />
        Regalar
      </button>
    </article>
  );
}
