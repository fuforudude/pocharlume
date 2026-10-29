import { CAMPAGNE } from '../../src/data/niveaux/campagne.ts';
import { vaguesDuPlan } from '../../src/data/niveaux/generation.ts';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans.ts';
import { creerBotNaif } from '../../src/equilibrage/bot-naif.ts';
import { jouerPartie } from '../../src/equilibrage/simulation.ts';
const n = Number(process.argv[2]);
const c = CAMPAGNE.find((x) => x.numero === n)!;
const plan = PLANS_REGIONS.flat().find((p) => p.numero === n)!;
for (let j = 1; j <= 8; j++) {
  const graine = plan.vagues.graine + 111 * j;
  const niveau = { ...c.niveau, vagues: vaguesDuPlan({ ...plan, vagues: { ...plan.vagues, graine } }) };
  const r = ['matou', 'chaton'].map((d) => { let g = 0; for (const dieu of ['plume', 'charlie', 'pollen']) for (let s = 101; s <= 110; s++) if (jouerPartie(niveau, creerBotNaif({ graine: s * 31 + 7 }), { graine: s, difficulte: d, dieu }).statut === 'victoire') g++; return Math.round(g / 30 * 100); });
  console.log(n, 'graine', graine, 'matou', r[0], 'chaton', r[1]);
}
