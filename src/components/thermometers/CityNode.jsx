import styles from './CityNode.module.css';

/**
 * Nodo de ciudad en la línea de tiempo del viaje.
 * Muestra un círculo verde sobre la línea, el nombre en Fraunces honey,
 * el subtítulo de noches/días, y un grid de tarjetas debajo.
 */
export default function CityNode({ name, nights, days, children }) {
  const nochesLabel = nights === 1 ? 'noche' : 'noches';
  return (
    <section className={styles.city} aria-label={`Ciudad: ${name}`}>
      <header className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.meta}>
          {nights} {nochesLabel} · {days}
        </p>
      </header>
      <div className={styles.grid}>{children}</div>
    </section>
  );
}
