import { formatCurrency } from '../../utils/formatCurrency.js';
import styles from './UnassignedSidebar.module.css';

/**
 * Banner lateral con las partidas sin sección asignada.
 *  - Vacío: fondo beige muy suave + leyenda discreta.
 *  - Con tarjetas: fondo ámbar suave, borde dorado, contador prominente
 *    y lista compacta de cada partida con botón "Asignar" que abre el
 *    formulario de edición de esa tarjeta (donde el dropdown ya permite
 *    moverla a cualquier sección).
 *
 * En desktop está fijo en el lado derecho. En móvil aparece al final del
 * panel — el CSS oculta `position: fixed` por debajo de 1024px.
 */
export default function UnassignedSidebar({ items, onAssign }) {
  const isEmpty = items.length === 0;

  return (
    <aside className={`${styles.sidebar} ${isEmpty ? styles.sidebarEmpty : styles.sidebarFilled}`}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Sin asignar</span>
        {isEmpty ? (
          <p className={styles.emptyText}>Sin tarjetas sin asignar</p>
        ) : (
          <p className={styles.count}>
            <span className={styles.countNumber}>{items.length}</span>
            <span className={styles.countLabel}>
              {items.length === 1 ? 'tarjeta sin asignar' : 'tarjetas sin asignar'}
            </span>
          </p>
        )}
      </header>

      {!isEmpty && (
        <ul className={styles.list}>
          {items.map((it) => (
            <li key={it.id} className={styles.item}>
              <div className={styles.itemMain}>
                <p className={styles.itemName}>{it.name}</p>
                <p className={styles.itemAmount}>{formatCurrency(it.targetAmount)}</p>
              </div>
              <button
                type="button"
                className={styles.assignBtn}
                onClick={() => onAssign(it)}
              >
                Asignar
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
