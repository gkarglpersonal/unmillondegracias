import { useTripItems } from '../../hooks/useTripItems.js';
import { useConfig } from '../../hooks/useConfig.js';
import { percent } from '../../utils/formatCurrency.js';
import TripItemCard from './TripItemCard.jsx';
import styles from './ThermometersGrid.module.css';

export default function ThermometersGrid() {
  const { items, loading } = useTripItems();
  const { config } = useConfig();

  const totalRaised = config?.totalRaised ?? 0;
  const totalCost = config?.totalTripCost ?? 15000;
  const tripPct = percent(totalRaised, totalCost);

  return (
    <section className={`${styles.section} section`} id="participar">
      <header className={styles.header}>
        <p className="eyebrow">Lista de experiencias</p>
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
        <ul className={styles.grid}>
          {items.map((item) => (
            <li key={item.id}>
              <TripItemCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
