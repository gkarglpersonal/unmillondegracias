import styles from './CityNode.module.css';

/**
 * Nodo de ciudad en la línea de tiempo del viaje.
 * Muestra un círculo verde sobre la línea, el nombre en Fraunces honey,
 * el subtítulo de noches/días, y un grid de tarjetas debajo.
 *
 * Si `showMeta` es false, oculta el "X noches" y solo muestra `days`
 * (útil para grupos sin estancia, p.ej. los vuelos de regreso).
 */
export default function CityNode({ name, nights, days, showMeta = true, children }) {
  const nochesLabel = nights === 1 ? 'noche' : 'noches';
  const meta = showMeta ? `${nights} ${nochesLabel} · ${days}` : days;
  return (
    <section className={styles.city} aria-label={`Ciudad: ${name}`}>
      <header className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        {meta && <p className={styles.meta}>{meta}</p>}
      </header>
      <div className={styles.grid}>{children}</div>
    </section>
  );
}
