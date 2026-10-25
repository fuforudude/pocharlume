// `npm run niveaux:bilan` : joue les 10 niveaux de la région 1 avec le joueur automatique des tests
// (src/data/niveaux/bot.test-utils.ts) et affiche le résultat, avec et sans défense, dans chaque difficulté.
// Simple coup d'œil pour régler les niveaux ; le simulateur complet, avec de vrais bots, est `npm run balance` (src/equilibrage/).
import { DIFFICULTES } from '../../src/data/difficultes.ts';
import { CONFIG_MATOU, jouer, planDeConstruction } from '../../src/data/niveaux/bot.test-utils.ts';
import { REGION1 } from '../../src/data/niveaux/region1.ts';

console.log('niveau | difficulté  | avec le plan                       | sans défense');
for (const campagne of REGION1) {
  for (const difficulte of Object.keys(DIFFICULTES)) {
    const config = { ...CONFIG_MATOU, difficulte };
    const avec = jouer(campagne.niveau, planDeConstruction(campagne.niveau), config);
    const sans = jouer(campagne.niveau, null, config);
    const texte = (b: typeof avec): string => `${b.statut.padEnd(8)} ${String(b.vies).padStart(2)} vies ${String(b.etoiles)}★ ${String(Math.round(b.secondes)).padStart(4)} s`;
    console.log(`${String(campagne.numero).padStart(6)} | ${difficulte.padEnd(11)} | ${texte(avec)} | ${texte(sans)}`);
  }
}
