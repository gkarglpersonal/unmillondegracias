/**
 * Lista definitiva de las partidas del viaje a Argentina.
 *
 * Cada partida incluye un campo `city` que determina:
 *  - En desktop: a qué ciudad pertenece dentro de la timeline (las
 *    partidas de "Regreso y extras" pasan a la sección de cierre).
 *  - En móvil: en qué slide del carrusel aparece.
 *
 * Categorías (icono Lucide en la tarjeta):
 *   flight | hotel | transport | excursion | wine | entertainment |
 *   food | gift | insurance
 */
export const seedTripItems = [
  // ----- Vuelos en orden cronológico (1-7) -----
  {
    name: 'El asiento de ida a Buenos Aires',
    description:
      'El momento en que el viaje deja de ser una idea. Iberia despega, y Argentina espera al otro lado del Atlántico.',
    targetAmount: 550,
    category: 'flight',
    city: 'Buenos Aires',
    order: 1,
  },
  {
    name: 'Buenos Aires → Ushuaia',
    description:
      'Volar hacia el fin del mundo. Literalmente. En una hora, del calor porteño al frío austral.',
    targetAmount: 280,
    category: 'flight',
    city: 'Ushuaia',
    order: 2,
  },
  {
    name: 'Ushuaia → El Calafate',
    description:
      'De un paisaje imposible a otro. La Patagonia desde el aire, infinita y salvaje.',
    targetAmount: 220,
    category: 'flight',
    city: 'El Calafate',
    order: 3,
  },
  {
    name: 'El Calafate → Iguazú',
    description:
      'Cruzar Argentina de sur a norte, de hielo a selva, en un solo día.',
    targetAmount: 280,
    category: 'flight',
    city: 'Iguazú',
    order: 4,
  },
  {
    name: 'Iguazú → Mendoza',
    description:
      'De la selva más impresionante del mundo a los viñedos andinos. Argentina de norte a oeste en un solo vuelo.',
    targetAmount: 280,
    category: 'flight',
    city: 'Mendoza',
    order: 5,
  },
  {
    name: 'Mendoza → Buenos Aires',
    description:
      'El último vuelo interno. De regreso a Buenos Aires para tomar el gran vuelo a casa.',
    targetAmount: 320,
    category: 'flight',
    city: 'Regreso y extras',
    order: 6,
  },
  {
    name: 'El asiento de vuelta a Madrid',
    description:
      'La vuelta, con la maleta llena de recuerdos nuevos. El último regalo de un viaje que no quiere terminar.',
    targetAmount: 550,
    category: 'flight',
    city: 'Regreso y extras',
    order: 7,
  },

  // ----- Hoteles en orden cronológico (8-12) -----
  {
    name: 'Tres noches en Buenos Aires',
    description:
      'Hotel boutique en Recoleta. Balcón, desayuno al sol y la luz dorada de Buenos Aires entrando por la ventana.',
    targetAmount: 650,
    category: 'hotel',
    city: 'Buenos Aires',
    order: 8,
  },
  {
    name: 'Dos noches en Ushuaia',
    description:
      'Una habitación con vistas al Canal Beagle. El amanecer más austral del planeta.',
    targetAmount: 550,
    category: 'hotel',
    city: 'Ushuaia',
    order: 9,
  },
  {
    name: 'Tres noches en El Calafate',
    description:
      'Despertar con el lago Argentino al fondo y los glaciares esperando al otro lado de la ventana.',
    targetAmount: 620,
    category: 'hotel',
    city: 'El Calafate',
    order: 10,
  },
  {
    name: 'Dos noches en Iguazú',
    description:
      'Selva alrededor, monos en los árboles y el rugido distante del agua. Dormir, literalmente, en otro mundo.',
    targetAmount: 480,
    category: 'hotel',
    city: 'Iguazú',
    order: 11,
  },
  {
    name: 'Tres noches en viñedos de Mendoza',
    description:
      'Una habitación con vistas a la cordillera. Despertar oliendo a tierra mojada y uva madura.',
    targetAmount: 600,
    category: 'hotel',
    city: 'Mendoza',
    order: 12,
  },

  // ----- Traslados (13) -----
  {
    name: 'Traslados y transfers del viaje',
    description:
      'Llegar siempre con alguien esperando. El lujo discreto de no preocuparse por nada logístico.',
    targetAmount: 380,
    category: 'transport',
    city: 'Buenos Aires',
    order: 13,
  },

  // ----- Excursiones y experiencias (14-24) -----
  {
    name: 'City tour Buenos Aires y Tierra del Fuego',
    description:
      'Palermo, Recoleta, San Telmo, La Boca — y el cartel que dice Fin de la Ruta 3.',
    targetAmount: 300,
    category: 'excursion',
    city: 'Buenos Aires',
    order: 14,
  },
  {
    name: 'Glaciar Perito Moreno y Safari Náutico',
    description:
      'Pasarelas del glaciar más navegación en lancha hasta su base. Estar de pie frente a 70 metros de hielo vivo.',
    targetAmount: 280,
    category: 'excursion',
    city: 'El Calafate',
    order: 15,
  },
  {
    name: 'Cataratas del Iguazú, ambos lados',
    description:
      'La Garganta del Diablo desde Argentina y la vista panorámica desde Brasil. Una maravilla, dos perspectivas.',
    targetAmount: 300,
    category: 'excursion',
    city: 'Iguazú',
    order: 16,
  },
  {
    name: 'Navegación por los glaciares Upsala y Spegazzini',
    description:
      'El día libre en El Calafate convertido en aventura. Glaciares que no aparecen en los mapas turísticos.',
    targetAmount: 200,
    category: 'excursion',
    city: 'El Calafate',
    order: 17,
  },
  {
    name: 'La Gran Aventura: lancha bajo las Cataratas',
    description:
      'Una embarcación que se mete bajo el agua que cae. Salir empapadas, salir riéndose como niñas.',
    targetAmount: 160,
    category: 'excursion',
    city: 'Iguazú',
    order: 18,
  },
  {
    name: 'Tren del Fin del Mundo en Ushuaia',
    description:
      'El tren más austral del planeta atravesando el bosque subantártico. Un capricho que vale cada minuto.',
    targetAmount: 100,
    category: 'excursion',
    city: 'Ushuaia',
    order: 19,
  },
  {
    name: 'Día de estancia gaucha en las Pampas',
    description:
      'Empanadas, asado, cabalgata y sobremesa larga. La Argentina más auténtica, a una hora de Buenos Aires.',
    targetAmount: 330,
    category: 'excursion',
    city: 'Buenos Aires',
    order: 20,
  },
  {
    name: 'Bodega con degustación en Mendoza',
    description:
      'Un Malbec de autor, tabla de quesos andinos y vistas a la cordillera. Zuccardi o Catena Zapata.',
    targetAmount: 200,
    category: 'wine',
    city: 'Mendoza',
    order: 21,
  },
  {
    name: 'Día de montaña en los Andes desde Mendoza',
    description:
      'Aconcagua a lo lejos, aire puro y silencio. La otra cara de Mendoza, la que no es viñedo.',
    targetAmount: 150,
    category: 'excursion',
    city: 'Mendoza',
    order: 22,
  },
  {
    name: 'Noche de tango y cena en San Telmo',
    description:
      'Cena y espectáculo en El Querandi o La Ventana. El bandoneón, las miradas cómplices, el primer paso.',
    targetAmount: 220,
    category: 'entertainment',
    city: 'Buenos Aires',
    order: 23,
  },
  {
    name: 'Una cena especial en Buenos Aires',
    description:
      'Una mesa en Don Julio o Tegui. Vino bueno, conversación larga y un menú que se recordará durante años.',
    targetAmount: 180,
    category: 'food',
    city: 'Buenos Aires',
    order: 24,
  },

  // ----- Gastronomía y extras (25-29) -----
  {
    name: 'Almuerzo en viñedo bajo el sol de Mendoza',
    description:
      'La mesa puesta entre hileras de vides. Las copas brillando con la última luz del día.',
    targetAmount: 160,
    category: 'food',
    city: 'Mendoza',
    order: 25,
  },
  {
    name: 'Cafés, antojos y placeres del camino',
    description:
      'Medialunas porteñas, centolla en Ushuaia, fruta tropical en Iguazú, empanadas mendocinas.',
    targetAmount: 400,
    category: 'food',
    city: 'Buenos Aires',
    order: 26,
  },
  {
    name: 'Recuerdos para traer a casa',
    description:
      'Un mate de plata labrado, un pañuelo de alpaca patagónica. Algo pequeño que dura toda una vida.',
    targetAmount: 150,
    category: 'gift',
    city: 'Regreso y extras',
    order: 27,
  },
  {
    name: 'Imprevistos y momentos espontáneos',
    description:
      'El taxi nocturno, la excursión de última hora, el helado junto al lago. Para que nada se quede sin vivir.',
    targetAmount: 1130,
    category: 'gift',
    city: 'Regreso y extras',
    order: 28,
  },
  {
    name: 'Seguro de viaje para todo el recorrido',
    description:
      'Para que viajar tranquila también sea parte del regalo. 16 días, dos personas, sin preocupaciones.',
    targetAmount: 480,
    category: 'insurance',
    city: 'Regreso y extras',
    order: 29,
  },
];

export const seedConfig = {
  totalTripCost: 10500,
  heroTitle: '40 años. Miles de niños. Una maestra que lo ha dado todo.',
  heroSubtitle:
    'Mariángeles ha dedicado más de cuatro décadas a su vocación con ánimo, ilusión y una entrega que ha marcado a generaciones. Es nuestro turno de devolverle aunque sea una pequeña parte de todo lo que nos ha dado.',
};
