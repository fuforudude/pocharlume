import { configDefaults, defineConfig } from 'vitest/config';

// Tests d'équilibrage lourds : seulement par `npm run test:equilibrage` (vitest.equilibrage.config.ts).
const LOURDS = ['src/equilibrage/zone-ordinaires.test.ts'];

export default defineConfig({
  // Chemins relatifs : le site tourne sous un sous-dossier de GitHub Pages et dans Capacitor.
  base: './',
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts'],
    exclude: [...configDefaults.exclude, ...(process.env['EQUILIBRAGE_COMPLET'] ? [] : LOURDS)],
    // Les simulations et la construction de l'atlas tournent en parallèle : sous charge, les délais par défaut sautent.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
