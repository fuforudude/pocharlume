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

    it(`${dossier} n'utilise pas de fonctions mathématiques qui varient entre moteurs JS`, async () => {
      for (const appel of ['Math.hypot(3, 4)', 'Math.sin(1)', 'Math.cos(1)', 'Math.atan2(1, 2)', 'Math.pow(2, 3)', 'Math.exp(1)', 'Math.log(2)', 'Math.cbrt(8)']) {
        expect(await reglesEnfreintes(`export const y = ${appel};\n`, `${dossier}/essai.ts`))
          .toEqual(['no-restricted-properties']);
      }
      expect(await reglesEnfreintes('export const y = 2 ** 3;\n', `${dossier}/essai.ts`)).toEqual(['no-restricted-syntax']);
      expect(await reglesEnfreintes('let y = 2;\ny **= 3;\nexport { y };\n', `${dossier}/essai.ts`)).toEqual(['no-restricted-syntax']);
      expect(await reglesEnfreintes('export const y = Math.sqrt(2) * Math.imul(3, 4) + Math.floor(1.5);\n', `${dossier}/essai.ts`)).toEqual([]);
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
