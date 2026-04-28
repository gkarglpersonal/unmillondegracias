/**
 * Estructura cronológica del viaje para la sección de experiencias.
 * Combina vuelos (banners) y ciudades (nodos con grid de tarjetas).
 *
 * Los IDs corresponden a los documentos en Firestore creados por el seed
 * (`tripItem-01` a `tripItem-29`, según el orden definido en seedTripItems.js).
 *
 * El componente TripTimeline (en ThermometersGrid.jsx) lee las partidas de
 * Firestore por listener y las organiza usando esta estructura.
 */

export const timelineSequence = [
  // ----- Vuelo de apertura -----
  {
    type: 'flight',
    itemId: 'tripItem-01', // El asiento de ida a Buenos Aires
    label: 'Madrid → Buenos Aires',
  },

  // ----- Buenos Aires (3 noches, días 1-3) -----
  {
    type: 'city',
    id: 'buenos-aires',
    name: 'Buenos Aires',
    nights: 3,
    days: 'días 1-3',
    itemIds: [
      'tripItem-08', // Tres noches en Buenos Aires
      'tripItem-13', // Traslados y transfers del viaje
      'tripItem-14', // City tour Buenos Aires y Tierra del Fuego
      'tripItem-23', // Noche de tango y cena en San Telmo
      'tripItem-20', // Día de estancia gaucha en las Pampas
      'tripItem-24', // Una cena especial en Buenos Aires
      'tripItem-26', // Cafés, antojos y placeres del camino
    ],
  },

  // ----- Vuelo -----
  {
    type: 'flight',
    itemId: 'tripItem-02',
    label: 'Buenos Aires → Ushuaia',
  },

  // ----- Ushuaia (2 noches, días 4-5) -----
  {
    type: 'city',
    id: 'ushuaia',
    name: 'Ushuaia',
    nights: 2,
    days: 'días 4-5',
    itemIds: [
      'tripItem-09', // Dos noches en Ushuaia
      'tripItem-19', // Tren del Fin del Mundo en Ushuaia
    ],
  },

  // ----- Vuelo -----
  {
    type: 'flight',
    itemId: 'tripItem-03',
    label: 'Ushuaia → El Calafate',
  },

  // ----- El Calafate (3 noches, días 6-8) -----
  {
    type: 'city',
    id: 'el-calafate',
    name: 'El Calafate',
    nights: 3,
    days: 'días 6-8',
    itemIds: [
      'tripItem-10', // Tres noches en El Calafate
      'tripItem-15', // Glaciar Perito Moreno y Safari Náutico
      'tripItem-17', // Navegación por los glaciares Upsala y Spegazzini
    ],
  },

  // ----- Vuelo -----
  {
    type: 'flight',
    itemId: 'tripItem-04',
    label: 'El Calafate → Iguazú',
  },

  // ----- Iguazú (2 noches, días 9-10) -----
  {
    type: 'city',
    id: 'iguazu',
    name: 'Iguazú',
    nights: 2,
    days: 'días 9-10',
    itemIds: [
      'tripItem-11', // Dos noches en Iguazú
      'tripItem-16', // Cataratas del Iguazú, ambos lados
      'tripItem-18', // La Gran Aventura: lancha bajo las Cataratas
    ],
  },

  // ----- Vuelo -----
  {
    type: 'flight',
    itemId: 'tripItem-05',
    label: 'Iguazú → Mendoza',
  },

  // ----- Mendoza (3 noches, días 11-13) -----
  {
    type: 'city',
    id: 'mendoza',
    name: 'Mendoza',
    nights: 3,
    days: 'días 11-13',
    itemIds: [
      'tripItem-12', // Tres noches en viñedos de Mendoza
      'tripItem-21', // Bodega con degustación en Mendoza
      'tripItem-22', // Día de montaña en los Andes desde Mendoza
      'tripItem-25', // Almuerzo en viñedo bajo el sol de Mendoza
    ],
  },

  // ----- Vuelos de cierre (doble) -----
  {
    type: 'flight',
    itemId: 'tripItem-06',
    label: 'Mendoza → Buenos Aires',
  },
  {
    type: 'flight',
    itemId: 'tripItem-07', // El asiento de vuelta a Madrid
    label: 'Buenos Aires → Madrid',
  },
];

/** Tarjetas de cierre, fuera de la línea de tiempo. */
export const closingItemIds = [
  'tripItem-27', // Recuerdos para traer a casa
  'tripItem-28', // Imprevistos y momentos espontáneos
  'tripItem-29', // Seguro de viaje para todo el recorrido
];
