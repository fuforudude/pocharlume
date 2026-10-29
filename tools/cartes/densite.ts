// Nombre moyen d'ennemis ordinaires par vague, par région : ancienne densité (profil de horde) contre densité du jalon 5.
import { ENNEMIS } from '../../src/data/ennemis.ts';
import { vaguesDuPlan } from '../../src/data/niveaux/generation.ts';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans.ts';
const compte = (v: { paquets: readonly { ennemi: string; nombre: number }[] }[]) => v.reduce((t, w) => t + w.paquets.filter((p) => !ENNEMIS[p.ennemi as keyof typeof ENNEMIS].boss).reduce((s, p) => s + p.nombre, 0), 0);
let ta = 0, tn = 0, tv = 0;
PLANS_REGIONS.forEach((plans, r) => {
  let a = 0, n = 0, vag = 0;
  for (const p of plans.filter((q) => q.vagues.horde !== true)) {
    a += compte(vaguesDuPlan({ ...p, vagues: { ...p.vagues, horde: true } }));
    n += compte(vaguesDuPlan(p));
    vag += p.vagues.nombre;
  }
  ta += a; tn += n; tv += vag;
  console.log(`région ${String(r + 1)} : ${(a / vag).toFixed(1)} -> ${(n / vag).toFixed(1)} ennemis par vague (${String(Math.round((1 - n / a) * 100))} % en moins)`);
});
console.log(`total : ${(ta / tv).toFixed(1)} -> ${(tn / tv).toFixed(1)} (${String(Math.round((1 - tn / ta) * 100))} % en moins)`);
