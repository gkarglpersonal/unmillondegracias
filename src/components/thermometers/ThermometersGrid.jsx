import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTripItems } from '../../hooks/useTripItems.js';
import { useConfig } from '../../hooks/useConfig.js';
import { useSections } from '../../hooks/useSections.js';
import { percent } from '../../utils/formatCurrency.js';
import { CITY_OPTIONS } from '../../content/tripCities.js';
import { MOBILE_COLLAGE } from '../../content/cityImages.js';
import TripItemCard from './TripItemCard.jsx';
import CityNode from './CityNode.jsx';
import styles from './ThermometersGrid.module.css';

/**
 * Construye los grupos por sección leyendo el orden y nombres de la
 * colección `sections` de Firestore. Mientras esa colección esté vacía
 * (estado inicial del proyecto), cae a `CITY_OPTIONS` como fallback para
 * que la página nunca se quede sin contenido.
 */
function buildSectionGroups(items, sections) {
  const sortByOrder = (a, b) => (a.order || 99) - (b.order || 99);
  const orderedNames =
    sections && sections.length > 0
      ? sections.map((s) => s.name)
      : [...CITY_OPTIONS];

  const byName = {};
  for (const name of orderedNames) byName[name] = [];
  const known = new Set(orderedNames);
  for (const it of items) {
    if (it.city && known.has(it.city)) byName[it.city].push(it);
  }

  return orderedNames
    .map((name) => {
      const list = byName[name];
      const flights = list.filter((it) => it.category === 'flight').sort(sortByOrder);
      const others = list.filter((it) => it.category !== 'flight').sort(sortByOrder);
      return { name, items: [...flights, ...others] };
    })
    .filter((group) => group.items.length > 0);
}

export default function ThermometersGrid() {
  const { items, loading } = useTripItems();
  const { config } = useConfig();
  const { sections } = useSections();

  const totalRaised = config?.totalRaised ?? 0;
  const totalCost = config?.totalTripCost ?? 10500;
  const tripPct = percent(totalRaised, totalCost);

  const groups = useMemo(() => buildSectionGroups(items, sections), [items, sections]);

  return (
    <section className={`${styles.section} section`} id="participar">
      <header className={styles.header}>
        <p className="eyebrow">El recorrido</p>
        <h2 className={styles.title}>Las experiencias del viaje.</h2>
        <p className={styles.lead}>
          Cada partida es un trozo concreto del viaje. Elige la que más te
          emocione, súmate al fondo general, o aporta lo que quieras a varias.
        </p>
        <p className={styles.totalProgress}>
          <span className={styles.totalNumber}>{tripPct}%</span>
          <span className={styles.totalText}>del viaje financiado</span>
        </p>
      </header>

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Cargando experiencias…</p>
      ) : groups.length === 0 ? (
        <p className={styles.empty}>
          Las experiencias aparecerán aquí en cuanto PANGEA The Travel Store
          cierre la lista definitiva del viaje.
        </p>
      ) : (
        <>
          {/* Desktop / tablet: timeline vertical */}
          <div className={styles.desktopOnly}>
            <div className={styles.timeline}>
              {groups.map((group) => (
                <CityNode key={group.name} name={group.name}>
                  {group.items.map((it) => (
                    <TripItemCard key={it.id} item={it} />
                  ))}
                </CityNode>
              ))}
            </div>
          </div>

          {/* Mobile: collage inspiracional + carrusel horizontal con scroll snap */}
          <div className={styles.mobileOnly}>
            <div className={styles.mobileCollage} aria-hidden="true">
              {MOBILE_COLLAGE.map((img, idx) => (
                <img
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  className={`${styles.collageImg} ${idx === 2 ? styles.collageWide : ''}`}
                  loading="lazy"
                />
              ))}
            </div>
            <MobileCarousel slides={groups} />
          </div>
        </>
      )}
    </section>
  );
}

function MobileCarousel({ slides }) {
  const trackRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handleScroll = () => {
      const slideWidth = track.firstElementChild?.getBoundingClientRect().width || track.clientWidth;
      if (!slideWidth) return;
      const idx = Math.round(track.scrollLeft / slideWidth);
      setActiveIdx(Math.max(0, Math.min(slides.length - 1, idx)));
    };
    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, [slides.length]);

  const goTo = (idx) => {
    const track = trackRef.current;
    if (!track) return;
    const slideWidth = track.firstElementChild?.getBoundingClientRect().width || track.clientWidth;
    track.scrollTo({ left: idx * slideWidth, behavior: 'smooth' });
  };

  const isFirst = activeIdx === 0;
  const isLast = activeIdx === slides.length - 1;

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselNav}>
        <button
          type="button"
          className={`${styles.navBtn} ${isFirst ? styles.navBtnHidden : ''}`}
          onClick={() => goTo(activeIdx - 1)}
          aria-label="Slide anterior"
          tabIndex={isFirst ? -1 : 0}
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className={`${styles.navBtn} ${isLast ? styles.navBtnHidden : ''}`}
          onClick={() => goTo(activeIdx + 1)}
          aria-label="Slide siguiente"
          tabIndex={isLast ? -1 : 0}
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className={styles.carouselTrack} ref={trackRef}>
        {slides.map((slide, idx) => (
          <div className={styles.carouselSlide} key={`slide-${idx}`}>
            <header className={styles.slideCityHeader}>
              <h3 className={styles.slideCityName}>{slide.name}</h3>
            </header>

            <div className={styles.slideCards}>
              {slide.items.map((it) => (
                <TripItemCard key={it.id} item={it} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dots} role="tablist" aria-label="Paradas del viaje">
        {slides.map((_, idx) => (
          <button
            type="button"
            key={`dot-${idx}`}
            className={`${styles.dot} ${idx === activeIdx ? styles.dotActive : ''}`}
            onClick={() => goTo(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
            aria-selected={idx === activeIdx}
            role="tab"
          />
        ))}
      </div>
    </div>
  );
}
