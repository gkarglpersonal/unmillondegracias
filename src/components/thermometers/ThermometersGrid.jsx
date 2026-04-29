import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTripItems } from '../../hooks/useTripItems.js';
import { useConfig } from '../../hooks/useConfig.js';
import { percent } from '../../utils/formatCurrency.js';
import {
  timelineSequence,
  closingItemIds,
  CITY_OPTIONS,
  resolveItemCity,
} from '../../content/tripCities.js';
import TripItemCard from './TripItemCard.jsx';
import CityNode from './CityNode.jsx';
import styles from './ThermometersGrid.module.css';

/**
 * Agrupa las partidas por ciudad para el carrusel móvil.
 * - Sigue el orden de CITY_OPTIONS (Buenos Aires, Ushuaia, ...).
 * - Dentro de cada ciudad: vuelos primero (por order), luego el resto
 *   (por order). Esto garantiza que el vuelo de llegada sea la primera
 *   tarjeta del slide, sin duplicados entre slides.
 */
function buildCitySlides(items) {
  const byCity = {};
  for (const city of CITY_OPTIONS) byCity[city] = [];
  for (const it of items) {
    const city = resolveItemCity(it);
    if (city && byCity[city]) byCity[city].push(it);
  }
  const sortByOrder = (a, b) => (a.order || 99) - (b.order || 99);
  return CITY_OPTIONS.map((city) => {
    const list = byCity[city];
    const flights = list.filter((it) => it.category === 'flight').sort(sortByOrder);
    const others = list.filter((it) => it.category !== 'flight').sort(sortByOrder);
    return { city, items: [...flights, ...others] };
  }).filter((slide) => slide.items.length > 0);
}

export default function ThermometersGrid() {
  const { items, loading } = useTripItems();
  const { config } = useConfig();

  const itemsById = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      map[it.id] = it;
    });
    return map;
  }, [items]);

  const totalRaised = config?.totalRaised ?? 0;
  const totalCost = config?.totalTripCost ?? 10500;
  const tripPct = percent(totalRaised, totalCost);

  const closingItems = closingItemIds.map((id) => itemsById[id]).filter(Boolean);
  const mobileSlides = useMemo(() => buildCitySlides(items), [items]);

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
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          Las experiencias aparecerán aquí en cuanto PANGEA The Travel Store
          cierre la lista definitiva del viaje.
        </p>
      ) : (
        <>
          {/* Desktop / tablet: timeline vertical */}
          <div className={styles.desktopOnly}>
            <div className={styles.timeline}>
              {timelineSequence.map((entry) => {
                if (entry.type === 'flight') {
                  const item = itemsById[entry.itemId];
                  if (!item) return null;
                  return (
                    <div
                      key={`flight-${entry.itemId}`}
                      className={styles.flightSolo}
                    >
                      <TripItemCard item={item} />
                    </div>
                  );
                }
                const cityCards = entry.itemIds
                  .map((id) => itemsById[id])
                  .filter(Boolean);
                return (
                  <CityNode
                    key={entry.id}
                    name={entry.name}
                    nights={entry.nights}
                    days={entry.days}
                  >
                    {cityCards.map((it) => (
                      <TripItemCard key={it.id} item={it} />
                    ))}
                  </CityNode>
                );
              })}
            </div>

            {closingItems.length > 0 && (
              <section className={styles.closing}>
                <h3 className={styles.closingTitle}>Para completar el viaje</h3>
                <div className={styles.closingGrid}>
                  {closingItems.map((it) => (
                    <TripItemCard key={it.id} item={it} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Mobile: carrusel horizontal con scroll snap */}
          <div className={styles.mobileOnly}>
            <MobileCarousel slides={mobileSlides} />
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
              <h3 className={styles.slideCityName}>{slide.city}</h3>
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
