// Affine facteurBudget par niveau : le naïf doit gagner 30 à 80 % en Matou et 100 % en Chaton (3 dieux x 10 graines).
import { CAMPAGNE } from '../../src/data/niveaux/campagne.ts';
import { vaguesDuPlan } from '../../src/data/niveaux/generation.ts';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans.ts';
import { creerBotNaif } from '../../src/equilibrage/bot-naif.ts';
import { jouerPartie } from '../../src/equilibrage/simulation.ts';
const [a, b] = process.argv[2]?.split('-').map(Number) ?? [51, 60];
function taux(numero: number, f: number, difficulte: string): number {
  const c = CAMPAGNE.find((x) => x.numero === numero);
  const plan = PLANS_REGIONS.flat().find((p) => p.numero === numero);
  if (!c || !plan) throw new Error('niveau');
  const niveau = { ...c.niveau, vagues: vaguesDuPlan({ ...plan, vagues: { ...plan.vagues, facteurBudget: f } }) };
  let g = 0, t = 0;
  for (const dieu of ['plume', 'charlie', 'pollen']) for (let s = 101; s <= 110; s++) {
    t++;
    if (jouerPartie(niveau, creerBotNaif({ graine: s * 31 + 7 }), { graine: s, difficulte, dieu }).statut === 'victoire') g++;
  }
  return g / t;
}
const sortie: Record<string, number> = {};
for (let n = a ?? 51; n <= (b ?? 60); n++) {
  const plan = PLANS_REGIONS.flat().find((p) => p.numero === n);
  let f = plan?.vagues.facteurBudget ?? 1;
  let dernier = '';
  for (let i = 0; i < 8; i++) {
    const m = taux(n, f, 'matou');
    const c = m >= 0.3 ? taux(n, f, 'chaton') : 0;
    dernier = `matou ${String(Math.round(m * 100))} % chaton ${String(Math.round(c * 100))} %`;
    if (m < 0.35 || c < 1) f *= m < 0.35 ? 0.78 : 0.88;
    else if (m > 0.8) f *= 1.28;
    else break;
    f = Math.round(f * 1000) / 1000;
  }
  sortie[String(n)] = f;
  console.error(`niveau ${String(n)} facteur ${String(f)} (${dernier})`);
}
console.log(JSON.stringify(sortie));
