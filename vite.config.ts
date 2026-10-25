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
  },
});
