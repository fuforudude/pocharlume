// Garde-fou de l'invariant clé : src/engine et src/data doivent tourner dans Node
// (simulateur, futur serveur). On rejoue ici les règles ESLint du projet sur des extraits.
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import { reglesSimulationPure } from '../eslint.config.js';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    { files: ['**/*.ts'], languageOptions: { parser: tseslint.parser } },
    ...reglesSimulationPure,
  ],
});

async function reglesEnfreintes(code: string, fichier: string): Promise<string[]> {
  const [resultat] = await eslint.lintText(code, { filePath: fichier });
  return (resultat?.messages ?? []).map((m) => m.ruleId ?? m.message);
}

describe('frontières du moteur', () => {
  for (const dossier of ['src/engine', 'src/data']) {
    it(`${dossier} ne peut pas importer render, ui ni save`, async () => {
      for (const cible of ['../render/camera', '../ui/hud', '../save/stockage', '../../src/render/sprites']) {
        expect(await reglesEnfreintes(`import { x } from '${cible}';\nexport const y = x;\n`, `${dossier}/essai.ts`))
          .toEqual(['no-restricted-imports']);
      }
    });

    it(`${dossier} ne peut pas toucher au DOM`, async () => {
      for (const global of ['window', 'document', 'localStorage', 'requestAnimationFrame']) {
        expect(await reglesEnfreintes(`export const y = ${global};\n`, `${dossier}/essai.ts`))
          .toEqual(['no-restricted-globals']);
      }
    });

    it(`${dossier} ne peut pas tirer d'aléatoire sans graine ni lire l'horloge`, async () => {
      for (const appel of ['Math.random()', 'Date.now()', 'performance.now()']) {
        expect(await reglesEnfreintes(`export const y = ${appel};\n`, `${dossier}/essai.ts`))
          .toEqual(['no-restricted-properties']);
      }
    });

    it(`${dossier} peut importer depuis le moteur et les données`, async () => {
      expect(await reglesEnfreintes(`import { x } from '../engine/etat';\nimport { z } from './tours';\nexport const y = [x, z];\n`, `${dossier}/essai.ts`))
        .toEqual([]);
    });
  }

  it('le rendu et l’interface gardent l’accès au DOM', async () => {
    expect(await reglesEnfreintes(`import { x } from '../save/stockage';\nexport const y = [x, window, Math.random()];\n`, 'src/ui/essai.ts'))
      .toEqual([]);
  });
});
