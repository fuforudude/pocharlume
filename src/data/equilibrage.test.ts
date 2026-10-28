import { describe, expect, it } from 'vitest';
import type { DefEnnemi } from '../engine/definitions';
import { ENNEMIS } from './ennemis';
import {
  EQUILIBRAGE,
  aretesAttenduesVague,
  aretesCumuleesAttendues,
  budgetVague,
  dpsEfficace,
  genererVague,
  menaceEnnemi,
  menaceVague,
  paliersFamille,
  puissanceTour,
} from './equilibrage';
import { FAMILLES, TOURS } from './tours';

const paysan: DefEnnemi = ENNEMIS.paysan_affame;
const ennemis = (ids: readonly (keyof typeof ENNEMIS)[]): [string, DefEnnemi][] => ids.map((id) => [id, ENNEMIS[id] as DefEnnemi]);
const ennemisRegion1 = ennemis(['paysan_affame', 'mendiant', 'chien_errant', 'boucher_vaudrelle']);

describe('puissance des tours', () => {
  it('chaque tour commune reste à ±15 % de la moyenne de son palier de coût', () => {
    const paliers = FAMILLES.flatMap((f) => paliersFamille(TOURS[f]));
    for (const palier of [1, 2, 3, 4]) {
      const groupe = paliers.filter((p) => p.palier === palier).map((p) => ({ nom: p.def.nom, puissance: puissanceTour(p.def, p.coutCumule) }));
      expect(groupe.length).toBe(palier === 4 ? 8 : 4);
      const moyenne = groupe.reduce((a, g) => a + g.puissance, 0) / groupe.length;
      for (const g of groupe) {
        expect(Math.abs(g.puissance / moyenne - 1), `${g.nom} au palier ${String(palier)}`).toBeLessThanOrEqual(EQUILIBRAGE.tolerancePuissance);
      }
    }
  });

  it('le DPS efficace baisse avec l’armure pour le physique, pas pour le pur', () => {
    const archers = dpsEfficace(TOURS.tir.niveaux[0]);
    for (let i = 1; i < archers.length; i++) expect(archers[i]).toBeLessThan(archers[i - 1] ?? 0);
    const oracle = dpsEfficace(TOURS.magie.specialisations.A);
    expect(new Set(oracle).size).toBe(1);
  });

  it('chaque niveau d’une famille fait plus de dégâts que le précédent', () => {
    for (const f of FAMILLES) {
      const dps = paliersFamille(TOURS[f]).filter((p) => p.palier <= 3).map((p) => dpsEfficace(p.def)[0] ?? 0);
      expect(dps[1]).toBeGreaterThan(dps[0] ?? 0);
      expect(dps[2]).toBeGreaterThan(dps[1] ?? 0);
    }
  });

  it('la puissance croît avec la portée et baisse avec le coût', () => {
    const def = TOURS.tir.niveaux[0];
    expect(puissanceTour({ ...def, portee: def.portee + 1 }, def.cout)).toBeGreaterThan(puissanceTour(def, def.cout));
    expect(puissanceTour(def, def.cout * 2)).toBeLessThan(puissanceTour(def, def.cout));
  });
});

describe('menace des ennemis', () => {
  it('croît avec les PV, les protections, la vitesse et le coût en vies', () => {
    const base = menaceEnnemi(paysan);
    expect(menaceEnnemi({ ...paysan, pv: paysan.pv * 2 })).toBeCloseTo(base * 2);
    expect(menaceEnnemi({ ...paysan, armure: 0.3 })).toBeGreaterThan(base);
    expect(menaceEnnemi({ ...paysan, resistance: 0.6 })).toBeGreaterThan(menaceEnnemi({ ...paysan, resistance: 0.3 }));
    expect(menaceEnnemi({ ...paysan, vitesse: paysan.vitesse * 2 })).toBeGreaterThan(base);
    expect(menaceEnnemi({ ...paysan, coutVies: 3 })).toBeCloseTo(base * 3);
  });

  it('classe le boss loin devant les ennemis ordinaires', () => {
    const ordinaires = ennemisRegion1.filter(([, d]) => !d.boss).map(([, d]) => menaceEnnemi(d));
    expect(menaceEnnemi(ENNEMIS.boucher_vaudrelle)).toBeGreaterThan(10 * Math.max(...ordinaires));
  });
});

describe('budget de vague et arêtes attendues', () => {
  it('le budget croît avec le niveau et avec la vague', () => {
    expect(budgetVague(1, 1)).toBe(EQUILIBRAGE.budgetBase);
    for (let l = 1; l < 100; l++) expect(budgetVague(l + 1, 3)).toBeGreaterThan(budgetVague(l, 3));
    for (let w = 1; w < 30; w++) expect(budgetVague(5, w + 1)).toBeGreaterThan(budgetVague(5, w));
  });

  it('la croissance par niveau est pleine jusqu’au niveau 10 (région 1) et plus lente ensuite', () => {
    const { croissanceNiveau, croissanceNiveauSuite, niveauPleineCroissance, budgetBase, croissanceVague } = EQUILIBRAGE;
    expect(niveauPleineCroissance).toBe(10);
    expect(croissanceNiveauSuite).toBeLessThan(croissanceNiveau);
    expect(croissanceNiveauSuite).toBeGreaterThan(0);
    // Région 1 : la formule d'origine, à l'identique.
    for (let l = 1; l <= 10; l++) expect(budgetVague(l, 1)).toBeCloseTo(budgetBase * (1 + croissanceNiveau * (l - 1)), 9);
    expect(budgetVague(10, 5)).toBeCloseTo(budgetBase * (1 + croissanceNiveau * 9) * (1 + croissanceVague * 4), 9);
    // Ensuite : pente réduite, sans saut au niveau 10.
    expect(budgetVague(11, 1) - budgetVague(10, 1)).toBeCloseTo(budgetBase * croissanceNiveauSuite, 9);
    expect(budgetVague(50, 1)).toBeCloseTo(budgetBase * (1 + croissanceNiveau * 9 + croissanceNiveauSuite * 40), 9);
    expect(budgetVague(50, 1)).toBeLessThan(budgetBase * (1 + croissanceNiveau * 49));
  });

  it('les arêtes attendues suivent le budget et leur cumul croît', () => {
    expect(aretesAttenduesVague(3, 4)).toBeCloseTo(budgetVague(3, 4) * EQUILIBRAGE.aretesParMenace);
    expect(aretesCumuleesAttendues(1, 0, 260)).toBe(260);
    for (let w = 1; w < 10; w++) expect(aretesCumuleesAttendues(1, w + 1, 260)).toBeGreaterThan(aretesCumuleesAttendues(1, w, 260));
  });
});

describe('générateur de vagues', () => {
  const options = { niveau: 4, vague: 3, ennemis: ennemisRegion1, graine: 2026, chemins: 2 };

  it('remplit le budget sans le dépasser, jusqu’à ce que plus rien ne rentre', () => {
    for (let graine = 0; graine < 50; graine++) {
      const vague = genererVague({ ...options, graine });
      const budget = budgetVague(options.niveau, options.vague);
      const menace = menaceVague(vague, ENNEMIS);
      const plusPetite = Math.min(...ennemisRegion1.filter(([, d]) => !d.boss).map(([, d]) => menaceEnnemi(d)));
      expect(menace).toBeLessThanOrEqual(budget);
      expect(menace).toBeGreaterThan(budget - plusPetite);
    }
  });

  it('est déterministe : même entrée, même vague ; autre graine, autre vague', () => {
    expect(genererVague(options)).toEqual(genererVague(options));
    expect(genererVague({ ...options, graine: 1 })).not.toEqual(genererVague(options));
  });

  it('n’ajoute le boss que si on le demande, et produit des paquets valides', () => {
    for (let graine = 0; graine < 20; graine++) {
      const vague = genererVague({ ...options, graine });
      expect(vague.paquets.some((p) => p.ennemi === 'boucher_vaudrelle')).toBe(false);
      for (const p of vague.paquets) {
        expect(p.nombre).toBeGreaterThanOrEqual(1);
        expect(p.nombre).toBeLessThanOrEqual(EQUILIBRAGE.tailleMaxPaquet);
        expect(p.intervalle).toBeGreaterThan(0);
        expect(p.chemin).toBeGreaterThanOrEqual(0);
        expect(p.chemin).toBeLessThan(options.chemins);
      }
    }
    const avecBoss = genererVague({ ...options, niveau: 100, vague: 30, boss: true, graine: 3 });
    expect(menaceVague(avecBoss, ENNEMIS)).toBeLessThanOrEqual(budgetVague(100, 30));
  });
});

describe('essaims', () => {
  const marais = ennemis(['paysan_affame', 'sangsue', 'rat_peste']);

  it('un ennemi en essaim n’arrive que par groupes de sa taille', () => {
    let vus = 0;
    for (let graine = 0; graine < 60; graine++) {
      const vague = genererVague({ niveau: 25, vague: 4, ennemis: marais, graine, chemins: 2 });
      for (const p of vague.paquets) {
        const taille = (ENNEMIS as Record<string, DefEnnemi>)[p.ennemi]?.pouvoirs?.essaim ?? 1;
        expect(p.nombre % taille, `${p.ennemi} ×${String(p.nombre)}`).toBe(0);
        if (taille > 1) vus++;
      }
    }
    expect(vus).toBeGreaterThan(0);
  });

  it('remplit toujours le budget sans le dépasser', () => {
    for (let graine = 0; graine < 60; graine++) {
      const vague = genererVague({ niveau: 25, vague: 4, ennemis: marais, graine, chemins: 2 });
      expect(menaceVague(vague, ENNEMIS)).toBeLessThanOrEqual(budgetVague(25, 4));
    }
  });

  it('les rats de peste arrivent par 8, les sangsues par 6 ou 12', () => {
    const tailles = new Map<string, Set<number>>();
    for (let graine = 0; graine < 200; graine++) {
      for (const p of genererVague({ niveau: 30, vague: 5, ennemis: marais, graine, chemins: 1 }).paquets) {
        tailles.set(p.ennemi, (tailles.get(p.ennemi) ?? new Set<number>()).add(p.nombre));
      }
    }
    expect([...(tailles.get('rat_peste') ?? [])]).toEqual([8]);
    expect([...(tailles.get('sangsue') ?? [])].sort((a, b) => a - b)).toEqual([6, 12]);
  });
});
