import { useMemo, useState } from 'react';
import Masonry from 'react-masonry-css';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import { useApprovedPhotos } from '../../hooks/useApprovedPhotos.js';
import styles from './PhotoGallery.module.css';

const breakpointCols = {
  default: 4,
  1280: 3,
  900: 3,
  640: 2,
};

const PAGE_SIZE = 8;

export default function PhotoGallery() {
  const { items, loading } = useApprovedPhotos();
  const [openIdx, setOpenIdx] = useState(-1);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const slides = useMemo(
    () =>
      items.map((p) => ({
        src: p.photoUrl,
        alt: `Foto compartida por ${p.name}`,
        title: p.name,
        description: p.message || '',
      })),
    [items]
  );

  const visibleItems = items.slice(0, visible);
  const canLoadMore = visible < items.length;

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
        <>
          <Masonry
            breakpointCols={breakpointCols}
            className={styles.masonry}
            columnClassName={styles.masonryColumn}
          >
            {visibleItems.map((p, idx) => (
              <button
                type="button"
                key={p.id}
                className={styles.tile}
                onClick={() => setOpenIdx(idx)}
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

          {canLoadMore && (
            <div className={styles.loadMoreWrap}>
              <button
                type="button"
                className={`btn btn-secondary ${styles.loadMoreBtn}`}
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Cargar más recuerdos
              </button>
            </div>
          )}
        </>
      )}

      <Lightbox
        open={openIdx >= 0}
        index={openIdx >= 0 ? openIdx : 0}
        close={() => setOpenIdx(-1)}
        slides={slides}
        plugins={[Captions]}
        captions={{ descriptionTextAlign: 'center', descriptionMaxLines: 6 }}
        styles={{ container: { background: 'rgba(20, 20, 22, 0.92)' } }}
      />
    </section>
  );
}
