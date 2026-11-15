// Rythme de la Fac (DLC « Temps modernes », région 1), spec docs/specs/2026-11-15-dlc-rythme.md : les ennemis arrivent par deux, le
// bestiaire est complet au niveau 5, les niveaux comptent 6 à 8 vagues et gardent à peu près leur menace totale (vagues plus denses).
import { describe, expect, it } from 'vitest';
import { menaceVague } from '../equilibrage';
import { ENNEMIS } from '../ennemis';
import { PLANS_MODERNE_R1 } from './plan-moderne-r1';
import { VAGUES_MODERNE_R1 } from './vagues-moderne-r1';

/** Les nouveaux ennemis de chaque niveau (première apparition dans les vagues figées), dans la spec. */
const NOUVEAUX = [
  ['moderne_gendarme', 'moderne_gendarme_mobile'],
  ['moderne_crs', 'moderne_canon_a_eau'],
  ['moderne_bac', 'moderne_tireur_lbd'],
  ['moderne_bravm', 'moderne_grenadier_lacrymo'],
  ['moderne_bouclier_anti_emeute', 'moderne_commissaire', 'moderne_drone'],
  [],
  [],
  [],
  [],
  ['moderne_commissaire_boss'],
] as const;

/** Menace totale des vagues figées de chaque niveau avant le changement de rythme (niveaux 1 à 9 ; le boss du 10 est mis en scène). */
const MENACE_AVANT = [26935, 23901, 39531, 16992, 27565, 23162, 23864, 23568, 19787] as const;

describe('rythme de la Fac', () => {
  it('première apparition de chaque ennemi : la liste de la spec, niveau par niveau', () => {
    const vus = new Set<string>();
    VAGUES_MODERNE_R1.forEach((vagues, i) => {
      const ici = new Set(vagues.flatMap((v) => v.paquets.map((p) => p.ennemi)));
      const nouveaux = [...ici].filter((e) => !vus.has(e)).sort();
      expect(nouveaux, `niveau ${String(i + 1)}`).toEqual([...(NOUVEAUX[i] ?? [])].sort());
      ici.forEach((e) => vus.add(e));
    });
  });

  it('6 à 8 vagues par niveau, et le plan et les vagues figées sont d’accord', () => {
    expect(VAGUES_MODERNE_R1).toHaveLength(10);
    VAGUES_MODERNE_R1.forEach((vagues, i) => {
      expect(vagues.length, `niveau ${String(i + 1)}`).toBeGreaterThanOrEqual(6);
      expect(vagues.length, `niveau ${String(i + 1)}`).toBeLessThanOrEqual(8);
      expect(vagues.length).toBe(PLANS_MODERNE_R1[i]?.vagues.nombre);
    });
  });

  it('menace totale des niveaux 1 à 9 : entre 85 et 115 % de celle d’avant', () => {
    MENACE_AVANT.forEach((avant, i) => {
      const total = (VAGUES_MODERNE_R1[i] ?? []).reduce((s, v) => s + menaceVague(v, ENNEMIS), 0);
      expect(total / avant, `niveau ${String(i + 1)} : ${String(Math.round(total))} pour ${String(avant)}`).toBeGreaterThanOrEqual(0.85);
      expect(total / avant, `niveau ${String(i + 1)} : ${String(Math.round(total))} pour ${String(avant)}`).toBeLessThanOrEqual(1.15);
    });
  });

  it('aucun événement ne pointe vers une vague absente ou un chemin hors du plan', () => {
    PLANS_MODERNE_R1.forEach((plan, i) => {
      const nombre = VAGUES_MODERNE_R1[i]?.length ?? 0;
      for (const e of plan.evenements ?? []) {
        expect(e.vague, `niveau ${String(plan.numero)} : ${e.type}`).toBeGreaterThanOrEqual(1);
        expect(e.vague, `niveau ${String(plan.numero)} : ${e.type}`).toBeLessThanOrEqual(nombre);
      }
      for (const f of plan.cheminsFermes ?? []) {
        expect(plan.chemins).toContain(f.chemin);
        expect(plan.chemins).toContain(f.repli);
      }
      for (const f of plan.foules ?? []) {
        if (f.effet.type === 'bloquer') expect(plan.chemins).toContain(f.effet.chemin);
      }
      for (const v of VAGUES_MODERNE_R1[i] ?? []) for (const p of v.paquets) expect(plan.chemins).toContain(p.chemin);
    });
  });
});
