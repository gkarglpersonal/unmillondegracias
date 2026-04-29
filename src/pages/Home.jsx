import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout.jsx';
import FloatingCTA from '../components/layout/FloatingCTA.jsx';
import HeroSection from '../components/hero/HeroSection.jsx';
import HistorySection from '../components/history/HistorySection.jsx';
import TripTransition from '../components/trip/TripTransition.jsx';
import TripIntro from '../components/trip/TripIntro.jsx';
import ThermometersGrid from '../components/thermometers/ThermometersGrid.jsx';
import MessagesWall from '../components/messages/MessagesWall.jsx';
import PhotoGallery from '../components/gallery/PhotoGallery.jsx';
import StickySidebar from '../components/form/StickySidebar.jsx';
import { FormProvider } from '../components/form/FormProvider.jsx';

export default function Home() {
  return (
    <FormProvider>
      <Layout sidebar={<StickySidebar />} floating={<FloatingCTA />}>
        <HeroSection />

        <div className="section-alt">
          <HistorySection />
        </div>

        <TripTransition />

        <div className="section-alt">
          <TripIntro />
        </div>

        <ThermometersGrid />

        <div className="section-alt">
          <MessagesWall />
        </div>

        <PhotoGallery />

        <footer
          id="site-footer"
          className="section"
          style={{
            textAlign: 'center',
            color: 'var(--text-subtle)',
            fontSize: 'var(--fs-caption)',
            paddingBlock: 'var(--space-6)',
            borderTop: '1px solid var(--border-soft)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <span>
            Hecho con cariño · Por las familias y exalumnos que pasaron por su clase
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--text-subtle)',
            }}
          >
            © 2026 · Un millón de gracias · Homenaje privado a Mariángeles ·{' '}
            <Link
              to="/privacidad"
              style={{
                color: 'inherit',
                textDecoration: 'none',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-alpine-500)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
            >
              Privacidad
            </Link>
          </span>
        </footer>
      </Layout>
    </FormProvider>
  );
}
