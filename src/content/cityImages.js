/**
 * Imágenes inspiracionales por ciudad para la sección de experiencias.
 * Los archivos viven en /public/images/. El nombre del archivo de Iguazú
 * lleva un acento (ú = U+00FA) y va URL-encoded como %C3%BA para evitar
 * problemas en algunos navegadores.
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
    src: '/images/Iguaz%C3%BA_-_Gemini.png',
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
  { src: '/images/Iguaz%C3%BA_-_Gemini.png', alt: 'Cataratas del Iguazú' },
  { src: '/images/Buenos_Aires_-_Gemini.png', alt: 'Buenos Aires' },
];
