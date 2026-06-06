import { useMemo } from 'react';
import { useTripItems } from './useTripItems.js';
import { sumCampaignTarget } from '../utils/campaignTarget.js';

/**
 * Objetivo económico total de la campaña, derivado en tiempo real de la suma
 * de `targetAmount` de todas las partidas ACTIVAS en Firestore.
 *
 * Reusa el listener `useTripItems()` (onSnapshot, `onlyActive: true`), así que
 * el valor se recalcula solo cada vez que se carga la página y refleja
 * cualquier alta, edición o archivado de partida sin ningún cambio de código.
 *
 * Devuelve `{ target, loading, error }`.
 */
export function useCampaignTarget() {
  const { items, loading, error } = useTripItems();
  const target = useMemo(() => sumCampaignTarget(items), [items]);
  return { target, loading, error };
}
