import { useEffect, useRef, useState } from 'react';
import { copy } from '../../content/copy.js';
import { useFormModal } from '../form/FormProvider.jsx';
import HeartIcon from '../ui/HeartIcon.jsx';
import styles from './FloatingCTA.module.css';

const GAP_ABOVE_FOOTER = 16;

/**
 * Botón flotante para mobile (oculto en desktop, donde existe el sidebar).
 * Mientras se hace scroll, está fijo en la esquina inferior derecha. Cuando
 * el footer entra en el viewport, el botón pasa a position: absolute y se
 * coloca justo encima del footer para no taparlo. Al salir el footer del
 * viewport (scroll hacia arriba), vuelve a fixed.
 */
export default function FloatingCTA() {
  const { openForm } = useFormModal();
  const buttonRef = useRef(null);
  const [absoluteTop, setAbsoluteTop] = useState(null);

  useEffect(() => {
    const footer = document.getElementById('site-footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return;

    const updateAbsoluteTop = () => {
      const footerTopFromDocument = footer.getBoundingClientRect().top + window.scrollY;
      const buttonHeight = buttonRef.current?.offsetHeight ?? 56;
      setAbsoluteTop(footerTopFromDocument - buttonHeight - GAP_ABOVE_FOOTER);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) updateAbsoluteTop();
        else setAbsoluteTop(null);
      },
      { threshold: 0 }
    );

    observer.observe(footer);

    // Si el usuario redimensiona mientras el footer está visible,
    // recalculamos la posición absoluta.
    const onResize = () => {
      const rect = footer.getBoundingClientRect();
      const stillVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (stillVisible) updateAbsoluteTop();
    };
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const isAboveFooter = absoluteTop !== null;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => openForm()}
      className={`${styles.fab} ${isAboveFooter ? styles.fabAbsolute : ''}`}
      style={isAboveFooter ? { top: `${absoluteTop}px` } : undefined}
      aria-label={copy.floatingCta.label}
    >
      <HeartIcon className={styles.icon} />
      <span className={styles.label}>{copy.floatingCta.label}</span>
    </button>
  );
}
