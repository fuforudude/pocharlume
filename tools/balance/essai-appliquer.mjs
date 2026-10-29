// Écrit aretesDepart et facteurBudget des plans des régions 6 à 10 d'après un fichier JSON { "51": [aretes, facteur], ... }.
import { readFileSync, writeFileSync } from 'node:fs';
const table = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (let r = 6; r <= 10; r++) {
  const f = `src/data/niveaux/plan-region${r}.ts`;
  let s = readFileSync(f, 'utf8');
  for (const [num, [aretes, facteur]] of Object.entries(table)) {
    const n = Number(num);
    if (n < (r - 1) * 10 + 1 || n > r * 10) continue;
    const i = s.indexOf(`numero: ${n},`);
    const j = s.indexOf('numero:', i + 5);
    let bloc = s.slice(i, j < 0 ? undefined : j);
    bloc = bloc.replace(/aretesDepart: \d+,/, `aretesDepart: ${aretes},`).replace(/\n\s*facteurBudget: [\d.]+,/, '').replace(/(graine: \d+,)/, `$1\n      facteurBudget: ${facteur},`);
    s = s.slice(0, i) + bloc + (j < 0 ? '' : s.slice(j));
  }
  writeFileSync(f, s);
}
