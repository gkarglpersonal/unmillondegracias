import {
  Plane,
  BedDouble,
  Bus,
  Map,
  Wine,
  Music,
  UtensilsCrossed,
  Gift,
  Shield,
  Sparkles,
} from 'lucide-react';

const ICONS = {
  flight: Plane,
  hotel: BedDouble,
  transport: Bus,
  excursion: Map,
  wine: Wine,
  entertainment: Music,
  food: UtensilsCrossed,
  gift: Gift,
  insurance: Shield,
};

/**
 * Renderiza el icono Lucide correspondiente a la categoría de una partida.
 * Color: heredado del CSS de la tarjeta (eucalipto).
 */
export default function CategoryIcon({ category, size = 22, className }) {
  const Icon = ICONS[category] || Sparkles;
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden="true" />;
}
