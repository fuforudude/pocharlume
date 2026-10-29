import { mesurerInfini, CARTES_INFINI_REGION1, CARTES_INFINI_AUTRES, mediane } from '../../src/equilibrage/infini.ts';
const bot = (process.argv[2] ?? 'naif') as 'naif' | 'soigneux';
const dieu = process.argv[3] ?? 'charlie';
const cartes = [...CARTES_INFINI_REGION1, ...CARTES_INFINI_AUTRES].filter((c) => !process.argv[4] || process.argv[4].split(',').includes(c.id));
const g = process.argv[5] ? process.argv[5].split(',').map(Number) : undefined;
for (const c of cartes) {
  const t = performance.now();
  const m = mesurerInfini(bot, dieu, c, g);
  console.log(bot, dieu, c.id, 'med', mediane(m.vagues), m.vagues.join(' '), Math.round(performance.now() - t) / 1000, 's');
}
