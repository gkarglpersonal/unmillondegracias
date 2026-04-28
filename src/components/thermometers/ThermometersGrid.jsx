import { useMemo } from 'react';
import { useTripItems } from '../../hooks/useTripItems.js';
import { useConfig } from '../../hooks/useConfig.js';
import { percent } from '../../utils/formatCurrency.js';
import { timelineSequence, closingItemIds } from '../../content/tripCities.js';
import TripItemCard from './TripItemCard.jsx';
import CityNode from './CityNode.jsx';
import FlightBanner from './FlightBanner.jsx';
import styles from './ThermometersGrid.module.css';

/**
 * Sección de experiencias del viaje. Línea de tiempo cronológica:
 * vuelos como banners + ciudades con grid de tarjetas, conectados por
 * una línea vertical en verde eucalipto. Cierra con tres tarjetas
 * "Para completar el viaje" fuera de la línea de tiempo.
 */
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
          <div className={styles.timeline}>
            {timelineSequence.map((entry, idx) => {
              if (entry.type === 'flight') {
                const item = itemsById[entry.itemId];
                return (
                  <FlightBanner
                    key={`flight-${entry.itemId}-${idx}`}
                    label={entry.label}
                    item={item}
                  />
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
        </>
      )}
    </section>
  );
}
