// Multiplie facteurBudget par région : node essai-echelle.mjs 7=0.8 10=1.1
import { readFileSync, writeFileSync } from 'node:fs';
for (const arg of process.argv.slice(2)) {
  const [r, k] = arg.split('=').map(Number);
  const f = `src/data/niveaux/plan-region${r}.ts`;
  const s = readFileSync(f, 'utf8').replace(/facteurBudget: ([\d.]+),/g, (_, v) => `facteurBudget: ${Math.round(Number(v) * k * 1000) / 1000},`);
  writeFileSync(f, s);
}
