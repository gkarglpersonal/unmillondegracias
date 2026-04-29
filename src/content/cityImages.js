/**
 * Imágenes inspiracionales por ciudad para la sección de experiencias.
 * Los archivos viven en /public/images/ con nombres ASCII-only para evitar
 * cualquier problema de codificación al servirlos desde GitHub Pages.
 */
export const CITY_IMAGES = {
  'Buenos Aires': {
    src: '/images/Buenos_Aires_-_Gemini.png',
    caption: 'Cafés históricos y arquitectura europea en San Telmo',
    alt: 'Buenos Aires',
  },
  Ushuaia: {
    src: '/images/Ushuaia_-_Gemini.png',
    caption: 'La ciudad más austral del mundo, puerta a la Patagonia',
    alt: 'Ushuaia',
  },
  'El Calafate': {
    src: '/images/Perito_Moreno_-_Gemini.png',
    caption: 'El Glaciar Perito Moreno, una de las maravillas del mundo',
    alt: 'Glaciar Perito Moreno',
  },
  'Iguazú': {
    src: '/images/Iguazu_-_Gemini.png',
    caption:
      'Las Cataratas del Iguazú, el espectáculo natural más impresionante de América',
    alt: 'Cataratas del Iguazú',
  },
  Mendoza: {
    src: '/images/Mendoza_-_Gemini.png',
    caption: 'Viñedos infinitos con los Andes nevados de fondo',
    alt: 'Viñedos de Mendoza',
  },
};

/** Tres imágenes para el collage del top del carrusel móvil. */
export const MOBILE_COLLAGE = [
  { src: '/images/Perito_Moreno_-_Gemini.png', alt: 'Glaciar Perito Moreno' },
  { src: '/images/Iguazu_-_Gemini.png', alt: 'Cataratas del Iguazú' },
  { src: '/images/Buenos_Aires_-_Gemini.png', alt: 'Buenos Aires' },
];
