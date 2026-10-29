import { EQUILIBRAGE, puissanceTour } from '../../src/data/equilibrage.ts';
import { toursHorsTolerance } from '../../src/equilibrage/puissance.ts';
const e = EQUILIBRAGE as { ciblesParRayonDeZone: number };
for (const c of [0.8, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 2]) {
  e.ciblesParRayonDeZone = c;
  console.log(c, toursHorsTolerance().map((t) => `${t.nom}/${t.palier}:${t.ecart.toFixed(2)}`).join(' ') || 'ok');
}
void puissanceTour;
