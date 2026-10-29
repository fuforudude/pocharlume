import { CAMPAGNE } from '../../src/data/niveaux/campagne.ts';
import { vaguesDuPlan } from '../../src/data/niveaux/generation.ts';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans.ts';
import { creerBotNaif } from '../../src/equilibrage/bot-naif.ts';
import { BOT_INACTIF, jouerPartie } from '../../src/equilibrage/simulation.ts';
const n = Number(process.argv[2]);
const c = CAMPAGNE.find((x) => x.numero === n)!;
const plan = PLANS_REGIONS.flat().find((p) => p.numero === n)!;
for (let j = process.env.J0 ? 0 : 1; j <= (process.env.J0 ? 0 : 8); j++) {
  const graine = plan.vagues.graine + 111 * j;
  const niveau = { ...c.niveau, vagues: vaguesDuPlan({ ...plan, vagues: { ...plan.vagues, graine, ...(process.env.F ? { facteurBudget: Number(process.env.F) } : {}) } }) };
  const present = niveau.vagues.some((v) => v.paquets.some((q) => q.ennemi === plan.vagues.ennemis[0]));
  const r = ['matou', 'chaton'].map((d) => { let g = 0; for (const dieu of ['plume', 'charlie', 'pollen']) for (let s = 101; s <= 110; s++) if (jouerPartie(niveau, creerBotNaif({ graine: s * 31 + 7 }), { graine: s, difficulte: d, dieu }).statut === 'victoire') g++; return Math.round(g / 30 * 100); });
  let inactif = 0; for (const dieu of ['plume', 'charlie', 'pollen']) for (const s of [101, 102, 103]) if (jouerPartie(niveau, BOT_INACTIF, { graine: s, difficulte: 'chaton', dieu }).statut === 'victoire') inactif++;
  console.log(n, 'premier ennemi', present, 'inactif', inactif, 'graine', graine, 'matou', r[0], 'chaton', r[1]);
}
