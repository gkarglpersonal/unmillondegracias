import Layout from '../components/layout/Layout.jsx';
import FloatingCTA from '../components/layout/FloatingCTA.jsx';
import HeroSection from '../components/hero/HeroSection.jsx';
import HistorySection from '../components/history/HistorySection.jsx';
import TripTransition from '../components/trip/TripTransition.jsx';
import TripIntro from '../components/trip/TripIntro.jsx';
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

        <section id="participar" className="section">
          <p className="eyebrow">Lista de experiencias</p>
          <h2 style={{ fontSize: 'var(--fs-h1)', maxWidth: '22ch', margin: 0 }}>
            Las experiencias del viaje.
          </h2>
          <p style={{ marginTop: 'var(--space-5)', color: 'var(--text-muted)' }}>
            (Lane D — termómetros por partida)
          </p>
        </section>

        <section className="section section-alt">
          <p className="eyebrow">Mensajes</p>
          <h2 style={{ fontSize: 'var(--fs-h1)', maxWidth: '22ch', margin: 0 }}>
            Lo que tenemos para decirle.
          </h2>
          <p style={{ marginTop: 'var(--space-5)', color: 'var(--text-muted)' }}>
            (Lane D — muro de mensajes)
          </p>
        </section>

        <section className="section">
          <p className="eyebrow">Galería</p>
          <h2 style={{ fontSize: 'var(--fs-h1)', maxWidth: '22ch', margin: 0 }}>
            Recuerdos compartidos.
          </h2>
          <p style={{ marginTop: 'var(--space-5)', color: 'var(--text-muted)' }}>
            (Lane D — galería de fotos)
          </p>
        </section>

        <footer
          className="section"
          style={{
            textAlign: 'center',
            color: 'var(--text-subtle)',
            fontSize: 'var(--fs-caption)',
            paddingBlock: 'var(--space-6)',
            borderTop: '1px solid var(--border-soft)',
          }}
        >
          Hecho con cariño · Colegio Everest de Monteclaro
        </footer>
      </Layout>
    </FormProvider>
  );
}
