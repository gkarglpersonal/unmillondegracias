/**
 * Estructura cronológica del viaje para la sección de experiencias.
 *
 * - `CITY_OPTIONS` define las opciones del dropdown del panel admin y el
 *   orden de los slides del carrusel móvil. La última opción "Regreso y
 *   extras" agrupa los vuelos de regreso y las partidas de cierre.
 * - `timelineSequence` describe el orden cronológico para la timeline
 *   vertical de desktop (vuelos como separadores entre ciudades).
 * - `closingItemIds` son las tarjetas de cierre fuera de timeline en
 *   desktop (en móvil viven en el slide "Regreso y extras").
 */

export const CITY_OPTIONS = [
  'Buenos Aires',
  'Ushuaia',
  'El Calafate',
  'Iguazú',
  'Mendoza',
  'Regreso y extras',
];

/**
 * Mapeo de fallback: si una partida en Firestore aún no tiene `city`,
 * inferimos la ciudad por id. Permite que el carrusel siga funcionando
 * antes de que se migren los documentos vía admin.
 */
const FALLBACK_CITY_BY_ID = {
  'tripItem-01': 'Buenos Aires',
  'tripItem-02': 'Ushuaia',
  'tripItem-03': 'El Calafate',
  'tripItem-04': 'Iguazú',
  'tripItem-05': 'Mendoza',
  'tripItem-06': 'Regreso y extras',
  'tripItem-07': 'Regreso y extras',
  'tripItem-08': 'Buenos Aires',
  'tripItem-09': 'Ushuaia',
  'tripItem-10': 'El Calafate',
  'tripItem-11': 'Iguazú',
  'tripItem-12': 'Mendoza',
  'tripItem-13': 'Buenos Aires',
  'tripItem-14': 'Buenos Aires',
  'tripItem-15': 'El Calafate',
  'tripItem-16': 'Iguazú',
  'tripItem-17': 'El Calafate',
  'tripItem-18': 'Iguazú',
  'tripItem-19': 'Ushuaia',
  'tripItem-20': 'Buenos Aires',
  'tripItem-21': 'Mendoza',
  'tripItem-22': 'Mendoza',
  'tripItem-23': 'Buenos Aires',
  'tripItem-24': 'Buenos Aires',
  'tripItem-25': 'Mendoza',
  'tripItem-26': 'Buenos Aires',
  'tripItem-27': 'Regreso y extras',
  'tripItem-28': 'Regreso y extras',
  'tripItem-29': 'Regreso y extras',
};

export function resolveItemCity(item) {
  if (!item) return null;
  if (item.city) return item.city;
  return FALLBACK_CITY_BY_ID[item.id] || null;
}

export const timelineSequence = [
  { type: 'flight', itemId: 'tripItem-01' },

  {
    type: 'city',
    id: 'buenos-aires',
    name: 'Buenos Aires',
    nights: 3,
    days: 'días 1-3',
    itemIds: [
      'tripItem-08',
      'tripItem-13',
      'tripItem-14',
      'tripItem-23',
      'tripItem-20',
      'tripItem-24',
      'tripItem-26',
    ],
  },

  { type: 'flight', itemId: 'tripItem-02' },

  {
    type: 'city',
    id: 'ushuaia',
    name: 'Ushuaia',
    nights: 2,
    days: 'días 4-5',
    itemIds: ['tripItem-09', 'tripItem-19'],
  },

  { type: 'flight', itemId: 'tripItem-03' },

  {
    type: 'city',
    id: 'el-calafate',
    name: 'El Calafate',
    nights: 3,
    days: 'días 6-8',
    itemIds: ['tripItem-10', 'tripItem-15', 'tripItem-17'],
  },

  { type: 'flight', itemId: 'tripItem-04' },

  {
    type: 'city',
    id: 'iguazu',
    name: 'Iguazú',
    nights: 2,
    days: 'días 9-10',
    itemIds: ['tripItem-11', 'tripItem-16', 'tripItem-18'],
  },

  { type: 'flight', itemId: 'tripItem-05' },

  {
    type: 'city',
    id: 'mendoza',
    name: 'Mendoza',
    nights: 3,
    days: 'días 11-13',
    itemIds: ['tripItem-12', 'tripItem-21', 'tripItem-22', 'tripItem-25'],
  },

  { type: 'flight', itemId: 'tripItem-06' },
  { type: 'flight', itemId: 'tripItem-07' },
];

/** Tarjetas de cierre, fuera de la línea de tiempo en desktop. */
export const closingItemIds = [
  'tripItem-27',
  'tripItem-28',
  'tripItem-29',
];
