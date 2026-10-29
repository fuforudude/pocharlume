import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Chemins relatifs : le site tourne sous un sous-dossier de GitHub Pages et dans Capacitor.
  base: './',
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts'],
    // Les simulations et la construction de l'atlas tournent en parallèle : sous charge, les délais par défaut sautent.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
