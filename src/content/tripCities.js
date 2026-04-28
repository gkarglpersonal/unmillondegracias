/**
 * Estructura cronológica del viaje para la sección de experiencias.
 *
 * Cada ciudad agrupa sus tarjetas en orden: el vuelo entrante (cuando lo
 * hay) va siempre como primera tarjeta del grid, seguido del hotel y de
 * las experiencias del destino. La línea de tiempo recorre los nodos de
 * ciudad de arriba a abajo.
 *
 * Los IDs corresponden a los documentos en Firestore creados por el seed
 * (`tripItem-01` a `tripItem-29`, según el orden de seedTripItems.js).
 */

export const cities = [
  // ----- Buenos Aires (3 noches, días 1-3) -----
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    nights: 3,
    days: 'días 1-3',
    itemIds: [
      'tripItem-01', // Vuelo Madrid → Buenos Aires
      'tripItem-08', // Tres noches en Buenos Aires
      'tripItem-13', // Traslados y transfers del viaje
      'tripItem-14', // City tour Buenos Aires y Tierra del Fuego
      'tripItem-23', // Noche de tango y cena en San Telmo
      'tripItem-20', // Día de estancia gaucha en las Pampas
      'tripItem-24', // Una cena especial en Buenos Aires
      'tripItem-26', // Cafés, antojos y placeres del camino
    ],
  },

  // ----- Ushuaia (2 noches, días 4-5) -----
  {
    id: 'ushuaia',
    name: 'Ushuaia',
    nights: 2,
    days: 'días 4-5',
    itemIds: [
      'tripItem-02', // Vuelo Buenos Aires → Ushuaia
      'tripItem-09', // Dos noches en Ushuaia
      'tripItem-19', // Tren del Fin del Mundo en Ushuaia
    ],
  },

  // ----- El Calafate (3 noches, días 6-8) -----
  {
    id: 'el-calafate',
    name: 'El Calafate',
    nights: 3,
    days: 'días 6-8',
    itemIds: [
      'tripItem-03', // Vuelo Ushuaia → El Calafate
      'tripItem-10', // Tres noches en El Calafate
      'tripItem-15', // Glaciar Perito Moreno y Safari Náutico
      'tripItem-17', // Navegación por los glaciares Upsala y Spegazzini
    ],
  },

  // ----- Iguazú (2 noches, días 9-10) -----
  {
    id: 'iguazu',
    name: 'Iguazú',
    nights: 2,
    days: 'días 9-10',
    itemIds: [
      'tripItem-04', // Vuelo El Calafate → Iguazú
      'tripItem-11', // Dos noches en Iguazú
      'tripItem-16', // Cataratas del Iguazú, ambos lados
      'tripItem-18', // La Gran Aventura: lancha bajo las Cataratas
    ],
  },

  // ----- Mendoza (3 noches, días 11-13) -----
  {
    id: 'mendoza',
    name: 'Mendoza',
    nights: 3,
    days: 'días 11-13',
    itemIds: [
      'tripItem-05', // Vuelo Iguazú → Mendoza
      'tripItem-12', // Tres noches en viñedos de Mendoza
      'tripItem-21', // Bodega con degustación en Mendoza
      'tripItem-22', // Día de montaña en los Andes desde Mendoza
      'tripItem-25', // Almuerzo en viñedo bajo el sol de Mendoza
    ],
  },

  // ----- La vuelta a casa (vuelos de regreso) -----
  {
    id: 'vuelta-a-casa',
    name: 'La vuelta a casa',
    nights: 0,
    days: 'día 14',
    showMeta: false, // sin "X noches"; solo el día final del viaje
    itemIds: [
      'tripItem-06', // Vuelo Mendoza → Buenos Aires
      'tripItem-07', // Vuelo Buenos Aires → Madrid
    ],
  },
];

/** Tarjetas de cierre, fuera de la línea de tiempo. */
export const closingItemIds = [
  'tripItem-27', // Recuerdos para traer a casa
  'tripItem-28', // Imprevistos y momentos espontáneos
  'tripItem-29', // Seguro de viaje para todo el recorrido
];
