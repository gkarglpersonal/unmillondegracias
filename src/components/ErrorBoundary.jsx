import React from 'react';

/**
 * Boundary global de React.
 *
 * Captura errores que se lanzan durante el render de cualquier componente
 * descendiente y muestra un fallback estático en lugar de la pantalla
 * blanca por defecto. El copy está en castellano de Madrid y los estilos
 * van inline para no depender de CSS Modules (que pueden no haber cargado
 * si el fallo ocurre temprano).
 *
 * Se envuelve alrededor de `<App />` en `main.jsx`, dentro del
 * `BrowserRouter` para que el botón de "Recargar" no tenga que pelearse
 * con el router.
 *
 * Limitaciones de los boundaries de React:
 *  - No capturan errores asíncronos (promesas, setTimeout, event handlers).
 *    Esos los seguimos manejando en su sitio (try/catch en submits, etc.).
 *  - No capturan errores en el propio boundary. El fallback debe ser
 *    minimalista para no fallar a su vez.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // El error queda en consola para que un admin curioso pueda diagnosticar.
    // En producción, sin Sentry ni similar, esta es nuestra única señal.
    console.error('ErrorBoundary capturó:', error, info);
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          background: '#f9f9f7',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          color: '#1c1c1e',
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(28, 28, 30, 0.08)',
          }}
        >
          <h1
            style={{
              margin: '0 0 16px',
              fontSize: '1.75rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Algo ha fallado
          </h1>
          <p
            style={{
              margin: '0 0 24px',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#4a4a4f',
            }}
          >
            Hemos tenido un problema al cargar esta parte. Recarga la página y
            vuelve a intentarlo. Si vuelve a ocurrir, escríbeme a{' '}
            <a
              href="mailto:gerardo.kargl@gmail.com"
              style={{ color: '#3D5233', fontWeight: 600 }}
            >
              gerardo.kargl@gmail.com
            </a>
            .
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '12px 28px',
              minHeight: '44px',
              borderRadius: '999px',
              border: 'none',
              background: '#3D5233',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}
