import { DIFFICULTES } from '../../src/data/difficultes.ts';
import { EQUILIBRAGE } from '../../src/data/equilibrage.ts';
import { PLANS_REGION1 } from '../../src/data/niveaux/plan-region1.ts';
import { vaguesDuPlan } from '../../src/data/niveaux/generation.ts';
import { assemblerNiveau } from '../../src/data/niveaux/assemblage.ts';
import { evaluerCampagne, synthetiser, trouver } from '../../src/equilibrage/campagne.ts';
import { verifierBandes } from '../../src/equilibrage/bandes.ts';

const p = JSON.parse(process.argv[2] ?? '{}') as { base?: number; cn?: number; cv?: number; ir?: number; dc?: Record<string, number>; dv?: Record<string, number>; depart?: number; nv?: number[]; dep?: number[] };
const E = EQUILIBRAGE as unknown as Record<string, number>;
if (p.base) E.budgetBase = p.base;
if (p.cn !== undefined) E.croissanceNiveau = p.cn;
if (p.ir !== undefined) E.intervalleReference = p.ir;
if (p.cv !== undefined) E.croissanceVague = p.cv;
Object.assign(DIFFICULTES.chaton, p.dc ?? {});
Object.assign(DIFFICULTES.vieux_sage, p.dv ?? {});
const niveaux = PLANS_REGION1.map((plan, i) => {
  const copie = { ...plan, aretesDepart: p.dep?.[i] ?? Math.round(plan.aretesDepart * (p.depart ?? 1)), vagues: { ...plan.vagues, nombre: p.nv?.[i] ?? plan.vagues.nombre } };
  const vagues = vaguesDuPlan(copie);
  const n = assemblerNiveau(copie, vagues);
  return n;
});
const ev = evaluerCampagne({ niveaux });
const f = (n: number, d: string, b: 'naif' | 'soigneux' | 'inactif') => {
  const e = trouver(ev, n, d, b);
  if (!e) return '-';
  const s = synthetiser(e.parties);
  return `${String(s.victoires).padStart(2)}/${String(s.parties).padEnd(2)} ${s.viesMoyennes.toFixed(1).padStart(4)}`;
};
console.log('niv | chaton naif    | matou naif     | matou soig     | VS naif        | VS soig        | inactif c/m/v');
for (const c of niveaux) {
  const n = c.numero;
  console.log(`${String(n).padStart(3)} | ${f(n, 'chaton', 'naif')}     | ${f(n, 'matou', 'naif')}     | ${f(n, 'matou', 'soigneux')}     | ${f(n, 'vieux_sage', 'naif')}     | ${f(n, 'vieux_sage', 'soigneux')}     | ${['chaton', 'matou', 'vieux_sage'].map((d) => f(n, d, 'inactif').slice(0, 5)).join(' ')}`);
}
for (const e of verifierBandes(ev)) console.log('!', e);
