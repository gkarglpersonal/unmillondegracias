import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import './styles/reset.css';
import './styles/tokens.css';
import './styles/globals.css';
import './styles/animations.css';

/**
 * Mientras Firestore aún no está provisionado, el SDK lanza errores
 * "INTERNAL ASSERTION FAILED" desde su watch stream. No se pueden atrapar
 * con onSnapshot.onError (son síncronos antes de invocar nuestro callback)
 * y, a alta frecuencia, ralentizan el navegador. Los silenciamos a nivel
 * window. Cuando se cree la DB en Firebase Console, estos errores cesan.
 */
const isFirestoreInternalAssertion = (msg) =>
  typeof msg === 'string' &&
  msg.includes('FIRESTORE') &&
  msg.includes('INTERNAL ASSERTION FAILED');

window.addEventListener('error', (e) => {
  if (isFirestoreInternalAssertion(e.message) || isFirestoreInternalAssertion(e.error?.message)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message || String(e.reason);
  if (isFirestoreInternalAssertion(msg)) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
