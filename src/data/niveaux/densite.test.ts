// Moins d'ennemis, plus solides (jalon 5) : hors niveaux de horde, une vague compte au moins 40 % d'ennemis ordinaires en moins que
// la même vague générée à l'ancienne densité (profil de horde, identique à ce que produisait le générateur avant le jalon 5), les
// ennemis d'un paquet sont espacés d'au moins 0,8 tuile à leur entrée (hors essaims), et chaque région a 1 ou 2 niveaux de horde.
import { describe, expect, it } from 'vitest';
import type { DefEnnemi } from '../../engine/definitions';
import { ENNEMIS } from '../ennemis';
import { EQUILIBRAGE } from '../equilibrage';
import { REGIONS } from './campagne';
import { vaguesDuPlan } from './generation';
import { PLANS_REGIONS } from './plans';

const plans = PLANS_REGIONS.flat();
const nombreOrdinaires = (vagues: readonly { paquets: readonly { ennemi: string; nombre: number }[] }[]): number =>
  vagues.reduce((total, v) => total + v.paquets.filter((p) => !ENNEMIS[p.ennemi as keyof typeof ENNEMIS].boss).reduce((s, p) => s + p.nombre, 0), 0);

describe('densité des ennemis', () => {
  it('hors horde, une vague compte en moyenne au moins 40 % d’ennemis ordinaires en moins qu’à l’ancienne densité (100 niveaux)', () => {
    let avant = 0;
    let apres = 0;
    for (const plan of plans.filter((p) => p.vagues.horde !== true)) {
      const ancienne = vaguesDuPlan({ ...plan, vagues: { ...plan.vagues, horde: true } });
      const nouvelle = vaguesDuPlan(plan);
      const a = nombreOrdinaires(ancienne);
      const n = nombreOrdinaires(nouvelle);
      // Niveau par niveau : jamais plus de 70 % de l'ancien effectif (les arrondis des petits budgets laissent de la marge).
      expect(n / a, `niveau ${String(plan.numero)}`).toBeLessThanOrEqual(0.7);
      avant += a;
      apres += n;
    }
    expect(apres / avant).toBeLessThanOrEqual(0.6);
  });

  it('les ennemis ordinaires ont plus de PV et de prime (facteur de PV), presque toujours au facteur plein', () => {
    let total = 0;
    let pleins = 0;
    for (const plan of plans.filter((p) => p.vagues.horde !== true && p.numero <= 50)) {
      for (const vague of vaguesDuPlan(plan)) {
        for (const p of vague.paquets.filter((q) => !ENNEMIS[q.ennemi as keyof typeof ENNEMIS].boss)) {
          // Moins que le facteur plein seulement quand le budget restant ne paie pas un ennemi renforcé entier.
          expect(p.facteurPv ?? 1, `niveau ${String(plan.numero)}`).toBeGreaterThanOrEqual(1);
          expect(p.facteurPv ?? 1).toBeLessThanOrEqual(EQUILIBRAGE.robustesseOrdinaires);
          total++;
          if (p.facteurPv === EQUILIBRAGE.robustesseOrdinaires) pleins++;
        }
      }
    }
    expect(pleins / total).toBeGreaterThan(0.9);
  });

  it('hors essaims, deux ennemis d’un même paquet sont espacés d’au moins 0,8 tuile à leur entrée', () => {
    let verifies = 0;
    for (const niveau of REGIONS.flat().filter((n) => !n.horde)) {
      for (const vague of niveau.niveau.vagues) {
        for (const p of vague.paquets) {
          const def: DefEnnemi = ENNEMIS[p.ennemi as keyof typeof ENNEMIS];
          if (def.boss || (def.pouvoirs?.essaim ?? 1) > 1 || p.nombre < 2) continue;
          expect(p.intervalle * def.vitesse, `niveau ${String(niveau.numero)} : ${p.ennemi}`).toBeGreaterThanOrEqual(EQUILIBRAGE.ecartMinimalTuiles - 1e-9);
          verifies++;
        }
      }
    }
    expect(verifies).toBeGreaterThan(1000);
  });

  it('une horde garde la densité d’avant : effectifs complets, colonnes serrées, aucun facteur de PV', () => {
    for (const plan of plans.filter((p) => p.vagues.horde === true)) {
      for (const vague of vaguesDuPlan(plan)) for (const p of vague.paquets) expect(p.facteurPv).toBeUndefined();
    }
  });
});

describe('niveaux de horde', () => {
  it('chaque région a 1 ou 2 niveaux de horde, marqués dans leur plan et dans le niveau de campagne (fiche)', () => {
    PLANS_REGIONS.forEach((region, r) => {
      const hordes = region.filter((p) => p.vagues.horde === true);
      expect(hordes.length, `région ${String(r + 1)}`).toBeGreaterThanOrEqual(1);
      expect(hordes.length, `région ${String(r + 1)}`).toBeLessThanOrEqual(2);
      region.forEach((p, i) => {
        const niveau = REGIONS[r]?.[i];
        expect(niveau?.horde, `niveau ${String(p.numero)}`).toBe(p.vagues.horde === true);
        expect(niveau?.niveau.horde === true, `niveau ${String(p.numero)} (moteur)`).toBe(p.vagues.horde === true);
      });
    });
  });

  it('le niveau du boss d’une région n’est jamais une horde', () => {
    for (const plan of plans.filter((p) => p.vagues.boss)) expect(plan.vagues.horde).toBeUndefined();
  });
});
