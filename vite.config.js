import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Base path:
 *  - Dev local: '/' (limpio).
 *  - Build por defecto: '/unmillondegracias/' (GitHub Pages bajo la org/user).
 *  - Cuando el custom domain unmillondegracias.com esté activo, añadir el
 *    secret VITE_BASE_PATH=/ en GitHub Actions y se publicará en raíz sin
 *    tocar código.
 */
export default defineConfig(({ command }) => {
  const base =
    process.env.VITE_BASE_PATH ?? (command === 'build' ? '/unmillondegracias/' : '/');

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
