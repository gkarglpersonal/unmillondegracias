import { Link } from 'react-router-dom';

const sectionStyle = { marginTop: 'var(--space-7)' };
const headingStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--fs-h3)',
  fontWeight: 'var(--fw-semibold)',
  letterSpacing: '-0.01em',
  margin: '0 0 var(--space-3) 0',
  color: 'var(--text-primary)',
};
const paragraphStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--fs-body)',
  lineHeight: 'var(--lh-relaxed)',
  color: 'var(--text-body)',
  margin: 0,
};

export default function Privacy() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        paddingBlock: 'clamp(3rem, 7vw, 6rem)',
        paddingInline: 'var(--section-pad-x)',
      }}
    >
      <article
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--fs-body-sm)',
            color: 'var(--color-alpine-500)',
            textDecoration: 'none',
            marginBottom: 'var(--space-5)',
            width: 'fit-content',
          }}
        >
          ← Volver
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h1)',
            fontWeight: 'var(--fw-semibold)',
            letterSpacing: '-0.025em',
            lineHeight: 'var(--lh-tight)',
            margin: 0,
            color: 'var(--text-primary)',
          }}
        >
          Política de Privacidad
        </h1>

        <p
          style={{
            ...paragraphStyle,
            color: 'var(--text-subtle)',
            fontSize: 'var(--fs-body-sm)',
            marginTop: 'var(--space-2)',
          }}
        >
          Última actualización: abril de 2026
        </p>

        <p style={{ ...paragraphStyle, marginTop: 'var(--space-5)' }}>
          Esta página ha sido creada con un único propósito: rendir homenaje a
          MªÁngeles en su jubilación y organizar un regalo colectivo de las
          familias, exalumnos y compañeros del Colegio Everest School Monteclaro.
        </p>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Responsable</h2>
          <p style={paragraphStyle}>
            El responsable de esta página es Gerardo Kargl, contacto:{' '}
            <a
              href="mailto:gkargl@outlook.com"
              style={{ color: 'var(--color-alpine-500)' }}
            >
              gkargl@outlook.com
            </a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Qué datos recogemos</h2>
          <p style={paragraphStyle}>
            Cuando rellenas el formulario de participación, recogemos tu nombre,
            correo electrónico, el mensaje que quieras dejar para MªÁngeles y,
            opcionalmente, una foto. Si decides contribuir al regalo, también
            indicamos la partida elegida y el importe.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Para qué usamos tus datos</h2>
          <p style={paragraphStyle}>
            Tus datos se usan exclusivamente para tres cosas: publicar tu mensaje
            y foto en esta página como parte del homenaje, coordinar tu
            contribución al regalo con la agencia de viajes PANGEA (que te
            enviará el enlace de pago directamente a tu correo), y entregar a
            MªÁngeles al final la lista completa de personas que han
            participado, con sus mensajes y fotos.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Cesión de datos a terceros</h2>
          <p style={paragraphStyle}>
            Tu nombre, correo electrónico, partida elegida e importe se comparten
            con PANGEA The Travel Store, exclusivamente para gestionar el enlace
            de pago de tu contribución al regalo. Ningún dato se cede a otras
            empresas ni se usa con fines comerciales.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Fotos</h2>
          <p style={paragraphStyle}>
            Las fotos que subas serán revisadas por el organizador antes de
            publicarse. Al subir una foto confirmas que tienes permiso de las
            personas adultas que aparecen en ella. Si la foto incluye menores de
            edad actuales, confirmas contar con autorización de sus padres o
            tutores. Las fotos antiguas donde los participantes aparecen de niños
            son bienvenidas — en ese caso, quien sube la foto está ejerciendo su
            propio derecho sobre su imagen.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Cuánto tiempo conservamos tus datos</h2>
          <p style={paragraphStyle}>
            Esta página estará activa aproximadamente hasta abril de 2027.
            Transcurrido ese plazo, los datos serán eliminados.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Tus derechos</h2>
          <p style={paragraphStyle}>
            Puedes solicitar el acceso, rectificación o eliminación de tus datos
            en cualquier momento escribiendo a{' '}
            <a
              href="mailto:gkargl@outlook.com"
              style={{ color: 'var(--color-alpine-500)' }}
            >
              gkargl@outlook.com
            </a>
            . Atenderemos tu solicitud en un plazo máximo de 30 días.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Cookies</h2>
          <p style={paragraphStyle}>
            Esta página utiliza únicamente cookies técnicas necesarias para su
            funcionamiento. No se utilizan cookies publicitarias ni de
            seguimiento.
          </p>
        </section>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--fs-body-sm)',
            color: 'var(--color-alpine-500)',
            textDecoration: 'none',
            marginTop: 'var(--space-8)',
            width: 'fit-content',
          }}
        >
          ← Volver a la página principal
        </Link>
      </article>
    </div>
  );
}
