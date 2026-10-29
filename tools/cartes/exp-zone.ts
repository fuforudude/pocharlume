import { CAMPAGNE } from '../../src/data/niveaux/campagne.ts';
import { mesurerZone } from '../../src/equilibrage/zone.ts';
const num = process.argv[2]?.split(',').map(Number) ?? [3];
const part = Number(process.argv[3] ?? 1);
const dieu = process.argv[4] ?? 'plume';
const diff = process.argv[5] ?? 'matou';
for (const n of num) {
  const c = CAMPAGNE[n - 1];
  if (!c) continue;
  const t = Date.now();
  const m = mesurerZone(c.niveau, { dieu, partAretes: part, difficulte: diff, graines: [101, 102, 103, 104, 105, 106], grainesEntrainement: [9001] });
  console.log(`niveau ${n}${c.horde ? ' (horde)' : ''} ${dieu} ${diff} x${part} :`, m.map((x) => `${x.composition} ${Math.round(x.tauxVictoire * 100)}% vies ${x.viesMoyennes.toFixed(1)}`).join(' | '), `${((Date.now() - t) / 1000).toFixed(0)}s`);
}
