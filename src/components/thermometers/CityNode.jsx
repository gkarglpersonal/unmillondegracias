import { CITY_IMAGES } from '../../content/cityImages.js';
import styles from './CityNode.module.css';

/**
 * Nodo de ciudad en la línea de tiempo del viaje (desktop).
 * Muestra: header (nombre + meta) → imagen inspiracional + caption →
 * grid de tarjetas. Si no hay imagen registrada para la ciudad, omite el
 * bloque visual y muestra solo header + grid.
 */
export default function CityNode({ name, nights, days, showMeta = true, children }) {
  let meta = null;
  if (showMeta && nights != null && days) {
    const nochesLabel = nights === 1 ? 'noche' : 'noches';
    meta = `${nights} ${nochesLabel} · ${days}`;
  } else if (days) {
    meta = days;
  }
  const image = CITY_IMAGES[name];

  return (
    <section className={styles.city} aria-label={`Ciudad: ${name}`}>
      <header className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        {meta && <p className={styles.meta}>{meta}</p>}
      </header>

      {image && (
        <figure className={styles.imageBlock}>
          <img
            src={image.src}
            alt={image.alt}
            className={styles.image}
            loading="lazy"
          />
          <figcaption className={styles.caption}>{image.caption}</figcaption>
        </figure>
      )}

      <div className={styles.grid}>{children}</div>
    </section>
  );
}
