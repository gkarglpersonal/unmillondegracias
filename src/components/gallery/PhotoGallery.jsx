import { useState } from 'react';
import Masonry from 'react-masonry-css';
import { useApprovedPhotos } from '../../hooks/useApprovedPhotos.js';
import PhotoLightbox from './PhotoLightbox.jsx';
import styles from './PhotoGallery.module.css';

const breakpointCols = {
  default: 4,
  1280: 3,
  900: 3,
  640: 2,
};

export default function PhotoGallery() {
  const { items, loading } = useApprovedPhotos();
  const [openPhoto, setOpenPhoto] = useState(null);

  return (
    <section className={`${styles.section} section`} id="galeria">
      <header className={styles.header}>
        <p className="eyebrow">Galería</p>
        <h2 className={styles.title}>Recuerdos compartidos.</h2>
      </header>

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Cargando recuerdos…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          Aún no hay fotos compartidas. Cuando subas una con tu participación,
          aparecerá aquí tras una breve revisión.
        </p>
      ) : (
        <Masonry
          breakpointCols={breakpointCols}
          className={styles.masonry}
          columnClassName={styles.masonryColumn}
        >
          {items.map((p) => (
            <button
              type="button"
              key={p.id}
              className={styles.tile}
              onClick={() => setOpenPhoto(p)}
              aria-label={`Ampliar foto de ${p.name}`}
            >
              <img
                src={p.photoUrl}
                alt={`Foto compartida por ${p.name}`}
                loading="lazy"
                className={styles.img}
              />
            </button>
          ))}
        </Masonry>
      )}

      <PhotoLightbox photo={openPhoto} onClose={() => setOpenPhoto(null)} />
    </section>
  );
}
