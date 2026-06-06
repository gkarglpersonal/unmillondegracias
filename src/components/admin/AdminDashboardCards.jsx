import { useEffect, useMemo, useState } from 'react';
import { Wallet, MapPin, HelpCircle, Target } from 'lucide-react';
import { subscribeAdminContributions } from '../../firebase/contributions.js';
import { useTripItems } from '../../hooks/useTripItems.js';
import { sumCampaignTarget } from '../../utils/campaignTarget.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import styles from './AdminDashboardCards.module.css';

/**
 * Dashboard de totales en la parte superior del panel admin.
 *
 * Cuatro tarjetas calculadas en tiempo real:
 *   1. Total recaudado: suma de `amount` de TODAS las pagadas.
 *   2. Total asignado a partidas: suma de las pagadas con `tripItemId` válido.
 *   3. Total sin asignar: suma de las pagadas con `tripItemId` null/vacío
 *      (fondo general / "sin preferencia").
 *   4. Objetivo total: suma de `targetAmount` de las partidas activas. Solo
 *      lectura. Es el mismo cálculo que alimenta el porcentaje global de la
 *      página pública (`sumCampaignTarget`); aquí se muestra en euros, cifra
 *      que NO aparece en ningún sitio de la página pública.
 *
 * Diseño:
 *  - Solo lectura: no modifica nada de la colección. Reusa el legacy
 *    `subscribeAdminContributions(callback)` (sin options) que ya emite el
 *    array completo de docs — el mismo flujo que usan ExportTools y
 *    EmailJsAlert.
 *  - Las cifras coinciden con la lógica del termómetro público: solo
 *    `paymentStatus === 'paid'` cuenta. Los pendientes quedan fuera para
 *    no inflar visualmente lo que aún no es real.
 *  - Un `amount` ausente, null o ≤ 0 se trata como 0 € (caso de aportaciones
 *    sin importe definido en la entrada manual).
 */
export default function AdminDashboardCards() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Partidas activas: fuente del objetivo total (suma de targetAmount), el
  // mismo cálculo que el porcentaje global público. Listener reactivo: si se
  // añade, edita o archiva una partida, el objetivo se recalcula solo.
  const { items: tripItems, loading: tripItemsLoading } = useTripItems();
  const campaignTarget = useMemo(() => sumCampaignTarget(tripItems), [tripItems]);

  useEffect(() => {
    const unsub = subscribeAdminContributions((docs) => {
      setItems(docs);
      setLoading(false);
    });
    return () => {
      try { unsub(); } catch { /* noop */ }
    };
  }, []);

  const totals = useMemo(() => {
    let totalAmount = 0;
    let totalCount = 0;
    let assignedAmount = 0;
    let assignedCount = 0;
    let unassignedAmount = 0;
    let unassignedCount = 0;

    for (const c of items) {
      if (c.paymentStatus !== 'paid') continue;
      const amount = c.amount && c.amount > 0 ? Number(c.amount) : 0;
      totalAmount += amount;
      totalCount += 1;

      const hasTripItem =
        typeof c.tripItemId === 'string' && c.tripItemId.trim().length > 0;
      if (hasTripItem) {
        assignedAmount += amount;
        assignedCount += 1;
      } else {
        unassignedAmount += amount;
        unassignedCount += 1;
      }
    }

    return {
      totalAmount,
      totalCount,
      assignedAmount,
      assignedCount,
      unassignedAmount,
      unassignedCount,
    };
  }, [items]);

  const cards = [
    {
      key: 'total',
      label: 'Total recaudado',
      hint: 'Suma de aportaciones pagadas',
      amount: totals.totalAmount,
      count: totals.totalCount,
      loading,
      Icon: Wallet,
      tone: 'primary',
    },
    {
      key: 'assigned',
      label: 'Asignado a partidas',
      hint: 'Pagadas con partida elegida',
      amount: totals.assignedAmount,
      count: totals.assignedCount,
      loading,
      Icon: MapPin,
      tone: 'soft',
    },
    {
      key: 'unassigned',
      label: 'Sin asignar',
      hint: 'Pagadas a fondo general · sin preferencia',
      amount: totals.unassignedAmount,
      count: totals.unassignedCount,
      loading,
      Icon: HelpCircle,
      tone: 'soft',
    },
    {
      key: 'target',
      label: 'Objetivo total',
      hint: 'Suma de las partidas activas · solo lectura',
      amount: campaignTarget,
      count: null,
      loading: tripItemsLoading,
      Icon: Target,
      tone: 'soft',
    },
  ];

  return (
    <section className={styles.grid} aria-label="Resumen de aportaciones">
      {cards.map(({ key, label, hint, amount, count, loading: cardLoading, Icon, tone }) => (
        <article
          key={key}
          className={`${styles.card} ${tone === 'primary' ? styles.cardPrimary : ''}`}
        >
          <div className={styles.cardHead}>
            <span className={styles.iconWrap} aria-hidden="true">
              <Icon size={18} />
            </span>
            <span className={styles.label}>{label}</span>
          </div>
          <p className={styles.amount}>
            {cardLoading ? '—' : formatCurrency(amount)}
          </p>
          {count !== null && (
            <p className={styles.meta}>
              <span className={styles.count}>
                {cardLoading ? '…' : count}
              </span>
              <span className={styles.metaLabel}>
                {count === 1 ? 'aportación' : 'aportaciones'}
              </span>
            </p>
          )}
          <p className={styles.hint}>{hint}</p>
        </article>
      ))}
    </section>
  );
}
