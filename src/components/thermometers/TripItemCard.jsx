import { useFormModal } from '../form/FormProvider.jsx';
import ThermometerBar from './ThermometerBar.jsx';
import HeartIcon from '../ui/HeartIcon.jsx';
import styles from './TripItemCard.module.css';

/**
 * Tarjeta individual de una partida del viaje.
 * Muestra: nombre, descripción, barra de progreso (solo %), y CTA.
 *
 * No mostramos nombres de contribuyentes por partida: la prueba social la
 * gestionan el contador global del hero y el feed de incorporaciones recientes.
 *
 * Click en CTA → openForm({ tripItemId }) — abre el modal mobile o
 * actualiza el sidebar desktop con la partida preseleccionada.
 */
export default function TripItemCard({ item }) {
  const { openForm } = useFormModal();

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{item.name}</h3>
        <p className={styles.description}>{item.description}</p>
      </header>

      <ThermometerBar raised={item.raisedAmount || 0} target={item.targetAmount} />

      <button
        type="button"
        className={`btn ${styles.cta}`}
        onClick={() => openForm({ tripItemId: item.id })}
      >
        <HeartIcon className={styles.heartIcon} size={18} />
        Sumarme a esta experiencia
      </button>
    </article>
  );
}
