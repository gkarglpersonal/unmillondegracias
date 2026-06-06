/**
 * Suma los importes objetivo (`targetAmount`) de una lista de partidas.
 *
 * Es la fuente única del objetivo económico de la campaña: sustituye al
 * antiguo target fijo (`config.totalTripCost`, 10500 €). Al derivarse de las
 * partidas reales, cualquier alta, edición o archivado de una partida en
 * Firestore recalcula el objetivo sin tocar código.
 *
 * Función pura para poder reusarla tanto desde el hook reactivo
 * (`useCampaignTarget`) como desde componentes que ya tienen la lista de
 * partidas cargada (p. ej. `ThermometersGrid`), sin abrir un listener nuevo.
 *
 * Un `targetAmount` ausente, no numérico o negativo cuenta como 0.
 */
export function sumCampaignTarget(items) {
  return (items || []).reduce((sum, it) => {
    const n = Number(it?.targetAmount);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}
