// `npm run niveaux:resume` : tableau des 10 niveaux de la région 1 (carte, entrées, socles, vagues, ennemis).
import { REGION1 } from '../../src/data/niveaux/region1.ts';
import { PLANS_REGION1 } from '../../src/data/niveaux/plan-region1.ts';

console.log('niveau | carte      | entrées | socles | vagues | ennemis (total sur toutes les vagues)       | départ');
for (const c of REGION1) {
  const plan = PLANS_REGION1[c.numero - 1];
  const totaux = new Map<string, number>();
  for (const v of c.niveau.vagues) for (const p of v.paquets) totaux.set(p.ennemi, (totaux.get(p.ennemi) ?? 0) + p.nombre);
  const ennemis = [...totaux].map(([id, n]) => `${id} ${String(n)}`).join(', ');
  console.log(
    `${String(c.numero).padStart(6)} | ${(plan?.carte ?? '').padEnd(10)} | ${String(c.niveau.carte.chemins.length).padStart(7)} | ${String(c.niveau.carte.socles.length).padStart(6)} | ${String(c.niveau.vagues.length).padStart(6)} | ${ennemis.padEnd(43)} | ${String(c.niveau.aretesDepart)}`,
  );
}
