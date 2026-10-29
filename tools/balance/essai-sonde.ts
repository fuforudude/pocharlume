// Sonde : taux de victoire du naïf (3 dieux x 10 graines) à des arêtes données, et vague la plus meurtrière.
import { niveauDeCampagne } from '../../src/data/niveaux/campagne.ts';
import { jouerPartie } from '../../src/equilibrage/simulation.ts';
import { creerBotNaif } from '../../src/equilibrage/bot-naif.ts';
const [a, b] = process.argv[2]!.split('-').map(Number) as [number, number];
const diff = process.argv[3] ?? 'matou';
const fois = Number(process.argv[4] ?? 1);
for (let n = a; n <= b; n++) {
  const c = niveauDeCampagne(n)!;
  const niveau = { ...c.niveau, aretesDepart: Math.round(c.niveau.aretesDepart * fois) };
  let g = 0, t = 0; const pertes: number[] = [];
  for (const dieu of ['plume', 'charlie', 'pollen']) for (let s = 101; s <= 110; s++) {
    const r = jouerPartie(niveau, creerBotNaif({ graine: s * 31 + 7 }), { graine: s, difficulte: diff, dieu });
    t++; if (r.statut === 'victoire') g++;
    r.viesPerduesParVague.forEach((x, i) => { pertes[i] = (pertes[i] ?? 0) + x; });
  }
  const pire = pertes.indexOf(Math.max(...pertes));
  console.log(n, 'aretes', niveau.aretesDepart, 'naif', Math.round((g / t) * 100), '% pire vague', pire + 1, '(' + Math.round((pertes[pire] ?? 0) / t * 10) / 10 + ' vies)');
}
