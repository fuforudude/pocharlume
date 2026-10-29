// Multiplie aretesDepart par région : node essai-aretes.mjs 10=0.8
import { readFileSync, writeFileSync } from 'node:fs';
for (const arg of process.argv.slice(2)) {
  const [r, k] = arg.split('=').map(Number);
  const f = `src/data/niveaux/plan-region${r}.ts`;
  const s = readFileSync(f, 'utf8').replace(/aretesDepart: (\d+),/g, (_, v) => `aretesDepart: ${Math.round((Number(v) * k) / 5) * 5},`);
  writeFileSync(f, s);
}
