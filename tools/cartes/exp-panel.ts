import { CAMPAGNE } from '../../src/data/niveaux/campagne.ts';
import { COMPOSITIONS, mesurerZone } from '../../src/equilibrage/zone.ts';
const ord = (process.argv[2] ?? '2,4,5,6,8,12,14,15,18,22,24,25,28').split(',').map(Number);
const hor = (process.argv[3] ?? '3,7,13,17,23,27').split(',').map(Number);
const part = Number(process.argv[4] ?? 0.45);
const diff = process.argv[5] ?? 'vieux_sage';
const somme: Record<string, Record<string, number[]>> = { ord: {}, hor: {} };
for (const [groupe, niveaux] of [['ord', ord], ['hor', hor]] as const) {
  for (const c of COMPOSITIONS) somme[groupe]![c] = [];
  for (const n of niveaux) {
    const niv = CAMPAGNE[n - 1];
    if (!niv) continue;
    for (const dieu of ['plume', 'charlie', 'pollen']) {
      const m = mesurerZone(niv.niveau, { dieu, partAretes: part, difficulte: diff, graines: [101, 102, 103, 104, 105, 106], grainesEntrainement: [9001] });
      for (const x of m) somme[groupe]![x.composition]!.push(x.tauxVictoire);
    }
    const moy = (g: string, c: string) => { const a = somme[g]![c]!; return Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 100); };
    console.log(groupe, 'jusqu a', n, COMPOSITIONS.map((c) => `${c} ${moy(groupe, c)}%`).join(' | '));
  }
}
