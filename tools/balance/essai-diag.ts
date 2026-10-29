import { niveauDeCampagne } from '../../src/data/niveaux/campagne.ts';
import { jouerPartie } from '../../src/equilibrage/simulation.ts';
import { creerBotNaif } from '../../src/equilibrage/bot-naif.ts';
import { creerBotSoigneux } from '../../src/equilibrage/bot-soigneux.ts';
const [num, aretes, dieu, bot, diff] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4] ?? 'charlie', process.argv[5] ?? 'naif', process.argv[6] ?? 'matou'];
const c = niveauDeCampagne(num)!;
const niveau = { ...c.niveau, aretesDepart: aretes || c.niveau.aretesDepart };
const comp = c.niveau.vagues.map((v, i) => `${i + 1}:` + Object.entries(v.paquets.reduce((a: Record<string, number>, p) => { a[p.ennemi] = (a[p.ennemi] ?? 0) + p.nombre; return a; }, {})).map(([k, n]) => `${k}x${n}`).join(',')).join('\n');
if (process.argv[7]) console.log(comp);
for (const g of [101, 102, 103, 104]) {
  const r = jouerPartie(niveau, bot === 'naif' ? creerBotNaif({ graine: g * 31 + 7 }) : creerBotSoigneux(), { graine: g, difficulte: diff, dieu });
  console.log(r.statut, 'vies', r.vies, 'aretesFin', Math.round(r.aretesFin), 'pertes/vague', r.viesPerduesParVague.map((x) => Math.round(x)).join(' '));
}
