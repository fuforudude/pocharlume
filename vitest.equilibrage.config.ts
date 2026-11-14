import { defineConfig } from 'vitest/config';

// Version complète des tests d'équilibrage lourds, hors de `npm run test` : `npm run test:equilibrage` (voir docs/architecture.md).
// `EQUILIBRAGE_COMPLET` active les parties longues dans boss-moderne.test.ts, bot-moderne-r3.test.ts (niveau 30) et simulation.test.ts (trois graines) ; zone-ordinaires.test.ts n'est lancé que par ici.
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/equilibrage/boss-moderne.test.ts',
      'src/equilibrage/zone-ordinaires.test.ts',
      'src/equilibrage/bot-moderne-r3.test.ts',
      'src/data/niveaux/simulation.test.ts',
    ],
    env: { EQUILIBRAGE_COMPLET: '1' },
    testTimeout: 600_000,
    hookTimeout: 900_000,
  },
});
