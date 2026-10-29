import { CAMPAGNE } from '../../src/data/niveaux/campagne.ts';
import { BOT_INACTIF, jouerPartie } from '../../src/equilibrage/simulation.ts';
for (const n of (process.argv[2] ?? '').split(',').map(Number)) {
  const c = CAMPAGNE[n - 1];
  if (!c) continue;
  const r: string[] = [];
  for (const dieu of ['plume', 'charlie', 'pollen']) {
    let g = 0;
    for (const s of [101, 102, 103]) if (jouerPartie(c.niveau, BOT_INACTIF, { graine: s, difficulte: 'chaton', dieu }).statut === 'victoire') g++;
    r.push(`${dieu} ${String(g)}/3`);
  }
  console.log(`niveau ${String(n)} héros seul en chaton : ${r.join(' ')}`);
}
