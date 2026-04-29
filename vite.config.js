import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Base path:
 *  - Dev local y build por defecto: '/' (custom domain unmillondegracias.com,
 *    servido desde la raíz vía CNAME en public/CNAME).
 *  - Si en el futuro hay que volver a publicar bajo gkarglpersonal.github.io/unmillondegracias/,
 *    setear el secret VITE_BASE_PATH=/unmillondegracias/ en GitHub Actions
 *    (y actualizar public/404.html → pathSegmentsToKeep = 1).
 */
export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH ?? '/';

  return {
    plugins: [react()],
    base,
    server: {
      port: 5173,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
