/**
 * Estructura cronológica del viaje para la sección de experiencias.
 *
 * Secuencia mixta de vuelos y ciudades:
 *  - Los vuelos NO pertenecen a ninguna ciudad: aparecen solos en su
 *    propia fila como separador narrativo entre ciudades, ocupando el
 *    ancho de una columna del grid (alineados a la izquierda).
 *  - Las ciudades agrupan únicamente las tarjetas de su estancia
 *    (hotel + experiencias). Sin vuelos en su grid.
 *
 * Orden:
 *   1. Vuelo de apertura Madrid → BA (antes del primer header)
 *   2. Cada ciudad seguida del vuelo a la siguiente
 *   3. Tras Mendoza, los dos vuelos de regreso (Mendoza → BA, BA → Madrid)
 *      antes de la sección final fuera del timeline
 *
 * Los IDs corresponden a los documentos en Firestore creados por el seed
 * (`tripItem-01` a `tripItem-29`).
 */

export const timelineSequence = [
  // ----- Vuelo de apertura -----
  { type: 'flight', itemId: 'tripItem-01' }, // Madrid → Buenos Aires

  // ----- Buenos Aires (3 noches, días 1-3) -----
  {
    type: 'city',
    id: 'buenos-aires',
    name: 'Buenos Aires',
    nights: 3,
    days: 'días 1-3',
    itemIds: [
      'tripItem-08', // Tres noches en Buenos Aires
      'tripItem-13', // Traslados y transfers
      'tripItem-14', // City tour Buenos Aires y Tierra del Fuego
      'tripItem-23', // Noche de tango y cena en San Telmo
      'tripItem-20', // Día de estancia gaucha en las Pampas
      'tripItem-24', // Una cena especial en Buenos Aires
      'tripItem-26', // Cafés, antojos y placeres del camino
    ],
  },

  // ----- Vuelo intermedio -----
  { type: 'flight', itemId: 'tripItem-02' }, // Buenos Aires → Ushuaia

  // ----- Ushuaia (2 noches, días 4-5) -----
  {
    type: 'city',
    id: 'ushuaia',
    name: 'Ushuaia',
    nights: 2,
    days: 'días 4-5',
    itemIds: [
      'tripItem-09', // Dos noches en Ushuaia
      'tripItem-19', // Tren del Fin del Mundo
    ],
  },

  // ----- Vuelo intermedio -----
  { type: 'flight', itemId: 'tripItem-03' }, // Ushuaia → El Calafate

  // ----- El Calafate (3 noches, días 6-8) -----
  {
    type: 'city',
    id: 'el-calafate',
    name: 'El Calafate',
    nights: 3,
    days: 'días 6-8',
    itemIds: [
      'tripItem-10', // Tres noches en El Calafate
      'tripItem-15', // Glaciar Perito Moreno
      'tripItem-17', // Navegación Upsala y Spegazzini
    ],
  },

  // ----- Vuelo intermedio -----
  { type: 'flight', itemId: 'tripItem-04' }, // El Calafate → Iguazú

  // ----- Iguazú (2 noches, días 9-10) -----
  {
    type: 'city',
    id: 'iguazu',
    name: 'Iguazú',
    nights: 2,
    days: 'días 9-10',
    itemIds: [
      'tripItem-11', // Dos noches en Iguazú
      'tripItem-16', // Cataratas, ambos lados
      'tripItem-18', // La Gran Aventura
    ],
  },

  // ----- Vuelo intermedio -----
  { type: 'flight', itemId: 'tripItem-05' }, // Iguazú → Mendoza

  // ----- Mendoza (3 noches, días 11-13) -----
  {
    type: 'city',
    id: 'mendoza',
    name: 'Mendoza',
    nights: 3,
    days: 'días 11-13',
    itemIds: [
      'tripItem-12', // Tres noches en viñedos
      'tripItem-21', // Bodega con degustación
      'tripItem-22', // Día de montaña en los Andes
      'tripItem-25', // Almuerzo en viñedo
    ],
  },

  // ----- Vuelos de regreso -----
  { type: 'flight', itemId: 'tripItem-06' }, // Mendoza → Buenos Aires
  { type: 'flight', itemId: 'tripItem-07' }, // Buenos Aires → Madrid
];

/** Tarjetas de cierre, fuera de la línea de tiempo. */
export const closingItemIds = [
  'tripItem-27', // Recuerdos para traer a casa
  'tripItem-28', // Imprevistos y momentos espontáneos
  'tripItem-29', // Seguro de viaje para todo el recorrido
];
