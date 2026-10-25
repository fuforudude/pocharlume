import { REGION1 } from '../../src/data/niveaux/region1.ts';
import { creerBotNaif } from '../../src/equilibrage/bot-naif.ts';
import { creerBotSoigneux } from '../../src/equilibrage/bot-soigneux.ts';
import { jouerPartie } from '../../src/equilibrage/simulation.ts';

const diff = process.argv[2] ?? 'matou';
const graines = [101, 102, 103, 104, 105];
const t0 = Date.now();
for (const c of REGION1) {
  const naif = graines.map((g) => jouerPartie(c.niveau, creerBotNaif({ graine: g }), { graine: g, difficulte: diff }));
  const soi = graines.map((g) => jouerPartie(c.niveau, creerBotSoigneux(), { graine: g, difficulte: diff }));
  const f = (rs: typeof naif) => `${rs.filter((r) => r.statut === 'victoire').length}/5 v${(rs.reduce((a, r) => a + r.vies, 0) / 5).toFixed(1)} ${Math.round(rs.reduce((a, r) => a + r.secondes, 0) / 5)}s`;
  console.log(`${c.numero} naif ${f(naif)} | soig ${f(soi)}`);
}
console.log((Date.now() - t0) / 1000);
