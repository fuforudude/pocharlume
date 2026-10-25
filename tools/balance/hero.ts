import { DIFFICULTES } from '../../src/data/difficultes.ts';
import { EQUILIBRAGE } from '../../src/data/equilibrage.ts';
import { PLANS_REGION1 } from '../../src/data/niveaux/plan-region1.ts';
import { vaguesDuPlan } from '../../src/data/niveaux/generation.ts';
import { assemblerNiveau } from '../../src/data/niveaux/assemblage.ts';
import { BOT_INACTIF, jouerPartie } from '../../src/equilibrage/simulation.ts';
const E = EQUILIBRAGE as unknown as Record<string, number>;
const p = JSON.parse(process.argv[2] ?? '{}') as Record<string, number>;
E.budgetBase = p.base ?? 220; E.intervalleReference = p.ir ?? 0.3; E.croissanceNiveau = p.cn ?? 0.15; E.croissanceVague = p.cv ?? 0.45;
Object.assign(DIFFICULTES.chaton, { pvEnnemis: p.pv ?? 0.6, vies: p.vies ?? 28 });
for (const i of [0, 1, 2, 3, 4, 5]) {
  const plan = PLANS_REGION1[i]!;
  const n = assemblerNiveau(plan, vaguesDuPlan(plan));
  const r = jouerPartie(n.niveau, BOT_INACTIF, { graine: 101, difficulte: 'chaton' });
  console.log(i + 1, r.statut, r.vies, Math.round(r.secondes), JSON.stringify(r.viesPerduesParVague));
}
