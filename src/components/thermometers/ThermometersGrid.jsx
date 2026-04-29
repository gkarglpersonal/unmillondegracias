import { useEffect, useMemo, useRef, useState } from 'react';
import { useTripItems } from '../../hooks/useTripItems.js';
import { useConfig } from '../../hooks/useConfig.js';
import { percent } from '../../utils/formatCurrency.js';
import { timelineSequence, closingItemIds } from '../../content/tripCities.js';
import TripItemCard from './TripItemCard.jsx';
import CityNode from './CityNode.jsx';
import styles from './ThermometersGrid.module.css';

/**
 * Agrupa el `timelineSequence` en slides móviles. Cada slide es un vuelo
 * (o vuelos) seguido de la ciudad de destino. El último slide contiene los
 * vuelos de regreso + las tarjetas de cierre.
 */
function buildMobileSlides(timeline, closingIds) {
  const slides = [];
  let pendingFlights = [];
  for (const entry of timeline) {
    if (entry.type === 'flight') {
      pendingFlights.push(entry.itemId);
    } else {
      slides.push({ flightIds: pendingFlights, city: entry, closingIds: [] });
      pendingFlights = [];
    }
  }
  if (pendingFlights.length || closingIds.length) {
    slides.push({ flightIds: pendingFlights, city: null, closingIds });
  }
  return slides;
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
  const mobileSlides = useMemo(
    () => buildMobileSlides(timelineSequence, closingItemIds),
    []
  );

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
            <MobileCarousel slides={mobileSlides} itemsById={itemsById} />
          </div>
        </>
      )}
    </section>
  );
}

function MobileCarousel({ slides, itemsById }) {
  const trackRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handleScroll = () => {
      const slideWidth = track.clientWidth;
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
    track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselTrack} ref={trackRef}>
        {slides.map((slide, idx) => {
          const flights = slide.flightIds
            .map((id) => itemsById[id])
            .filter(Boolean);
          const cityCards = slide.city
            ? slide.city.itemIds.map((id) => itemsById[id]).filter(Boolean)
            : [];
          const closingCards = slide.closingIds
            .map((id) => itemsById[id])
            .filter(Boolean);

          return (
            <div className={styles.carouselSlide} key={`slide-${idx}`}>
              {flights.length > 0 && (
                <div className={styles.slideFlights}>
                  {flights.map((it) => (
                    <TripItemCard key={it.id} item={it} />
                  ))}
                </div>
              )}

              {slide.city && (
                <header className={styles.slideCityHeader}>
                  <h3 className={styles.slideCityName}>{slide.city.name}</h3>
                  <p className={styles.slideCityMeta}>
                    {slide.city.nights}{' '}
                    {slide.city.nights === 1 ? 'noche' : 'noches'} ·{' '}
                    {slide.city.days}
                  </p>
                </header>
              )}

              {cityCards.length > 0 && (
                <div className={styles.slideCards}>
                  {cityCards.map((it) => (
                    <TripItemCard key={it.id} item={it} />
                  ))}
                </div>
              )}

              {closingCards.length > 0 && (
                <>
                  <header className={styles.slideCityHeader}>
                    <h3 className={styles.slideCityName}>
                      Para completar el viaje
                    </h3>
                  </header>
                  <div className={styles.slideCards}>
                    {closingCards.map((it) => (
                      <TripItemCard key={it.id} item={it} />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
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
