// Bandes du mode infini (jalon 4), en Matou, sur les quatre cartes de la région 1 et pour les trois dieux : la médiane du bot soigneux
// est entre la vague 25 et la vague 45, et le bot naïf ne passe jamais la vague 30. Même mesure que `npm run balance` (dix graines).
// Chaque (bot, dieu, carte) se calcule dans un fil à part.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { beforeAll, describe, expect, it } from 'vitest';
import { DELAI_EVALUATION } from './bandes.test-utils';
import { DIEUX_EVALUES } from './campagne';
import { BANDES_INFINI, CARTES_INFINI_REGION1, ecartsInfini, GRAINES_INFINI, mediane, type CarteInfini, type MesureInfini } from './infini';

const TRAVAILLEUR = new URL('./infini.travailleur.ts', import.meta.url);
const CROCHET = pathToFileURL(fileURLToPath(new URL('../../tools/niveaux/enregistrer.ts', import.meta.url))).href;

function mesurer(bot: 'naif' | 'soigneux', dieu: string, carte: CarteInfini): Promise<MesureInfini> {
  return new Promise((resolve, reject) => {
    const fil = new Worker(TRAVAILLEUR, { workerData: { bot, dieu, carte, graines: [...GRAINES_INFINI] }, execArgv: ['--import', CROCHET] });
    fil.once('message', (m: MesureInfini) => {
      resolve(m);
    });
    fil.once('error', reject);
  });
}

let mesures: MesureInfini[] = [];
beforeAll(async () => {
  mesures = await Promise.all(DIEUX_EVALUES.flatMap((dieu) => CARTES_INFINI_REGION1.flatMap((carte) => (['naif', 'soigneux'] as const).map((bot) => mesurer(bot, dieu, carte)))));
}, DELAI_EVALUATION);

describe.each(DIEUX_EVALUES)('bandes de l’infini, %s', (dieu) => {
  it(`le soigneux tient en médiane entre la vague ${String(BANDES_INFINI.soigneuxMin)} et la vague ${String(BANDES_INFINI.soigneuxMax)} sur chaque carte de la région 1`, () => {
    const siennes = mesures.filter((m) => m.dieu === dieu && m.bot === 'soigneux');
    expect(siennes).toHaveLength(CARTES_INFINI_REGION1.length);
    for (const m of siennes) {
      expect(mediane(m.vagues), m.carte.id).toBeGreaterThanOrEqual(BANDES_INFINI.soigneuxMin);
      expect(mediane(m.vagues), m.carte.id).toBeLessThanOrEqual(BANDES_INFINI.soigneuxMax);
    }
  });

  it(`le naïf ne passe jamais la vague ${String(BANDES_INFINI.naifMax)}`, () => {
    const siennes = mesures.filter((m) => m.dieu === dieu && m.bot === 'naif');
    expect(siennes).toHaveLength(CARTES_INFINI_REGION1.length);
    expect(ecartsInfini(siennes)).toEqual([]);
  });
});
