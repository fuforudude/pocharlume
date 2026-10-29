import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const [dossier, prefixe, sortie] = process.argv.slice(2);
// Table de base : arêtes et facteur actuels des plans 6 à 10.
const t = {};
for (let r = 6; r <= 10; r++) {
  const s = readFileSync(`src/data/niveaux/plan-region${r}.ts`, 'utf8');
  for (const m of s.matchAll(/numero: (\d+),[\s\S]*?aretesDepart: (\d+),[\s\S]*?facteurBudget: ([\d.]+),/g)) t[m[1]] = [Number(m[2]), Number(m[3])];
}
for (const f of readdirSync(dossier).filter((x) => x.startsWith(prefixe) && x.endsWith('.out'))) {
  const j = JSON.parse(readFileSync(`${dossier}/${f}`, 'utf8') || '{}');
  for (const [k, v] of Object.entries(j)) if (t[k]) t[k][1] = v;
}
writeFileSync(sortie, JSON.stringify(t));
console.log(Object.keys(t).length, 'niveaux');
