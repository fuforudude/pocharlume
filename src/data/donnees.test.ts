import { describe, expect, it } from 'vitest';
import { calculerChemin, distanceAuxChemins } from '../engine/chemins';
import type { DefNiveauTour, StatsCombattant } from '../engine/definitions';
import { fr } from '../i18n/fr';
import { DIEUX } from './dieux';
import { DIFFICULTES } from './difficultes';
import { ENNEMIS } from './ennemis';
import { NIVEAU_TEST, NIVEAUX_REGION1 } from './niveaux/region1';
import { REGLES } from './regles';
import { FAMILLES, TOURS } from './tours';

const toutesLesTours: DefNiveauTour[] = FAMILLES.flatMap((f) => [...TOURS[f].niveaux, TOURS[f].specialisations.A, TOURS[f].specialisations.B]);

function nomsUnites(def: DefNiveauTour): string[] {
  const unites: (StatsCombattant | null)[] = [def.soldats, def.spectres];
  return unites.flatMap((u) => (u ? [u.nom] : []));
}

describe('textes des données', () => {
  it('chaque nom affiché est une clé de src/i18n/fr.ts', () => {
    const cles = new Set(Object.keys(fr));
    const noms = [
      ...Object.values(ENNEMIS).map((e) => e.nom),
      ...Object.values(DIFFICULTES).map((d) => d.nom),
      ...toutesLesTours.flatMap((t) => [t.nom, ...nomsUnites(t)]),
      ...Object.values(DIEUX).flatMap((d) => [
        d.nom,
        d.heros.nom,
        d.tourDivine.nom,
        ...d.sorts.flatMap((s) => [s.nom, ...s.effets.flatMap((e) => (e.type === 'invoquer' ? [e.unite.nom] : []))]),
      ]),
    ];
    for (const nom of noms) expect(cles.has(nom), nom).toBe(true);
  });
});

describe('valeurs des données', () => {
  const paliers = new Set(REGLES.paliersProtection);

  it('les armures et résistances sont sur les paliers 0 / 30 / 60 / 90 %', () => {
    for (const e of Object.values(ENNEMIS)) {
      expect(paliers.has(e.armure), e.nom).toBe(true);
      expect(paliers.has(e.resistance), e.nom).toBe(true);
    }
    for (const t of toutesLesTours) {
      for (const u of [t.soldats, t.spectres]) {
        if (u) {
          expect(paliers.has(u.armure), u.nom).toBe(true);
          expect(paliers.has(u.resistance), u.nom).toBe(true);
        }
      }
    }
  });

  it('la région 1 a ses 3 ennemis et son boss', () => {
    expect(Object.keys(ENNEMIS).sort()).toEqual(['boucher_vaudrelle', 'chien_errant', 'mendiant', 'paysan_affame']);
    expect(Object.values(ENNEMIS).filter((e) => e.boss)).toHaveLength(1);
    expect(ENNEMIS.mendiant.vitesse).toBeGreaterThan(ENNEMIS.paysan_affame.vitesse);
    expect(ENNEMIS.mendiant.pv).toBeLessThan(ENNEMIS.paysan_affame.pv);
    expect(ENNEMIS.chien_errant.vitesse).toBeGreaterThan(ENNEMIS.mendiant.vitesse);
    expect(ENNEMIS.boucher_vaudrelle.devore).toBeGreaterThan(0);
  });

  it('les tours ont des coûts positifs, des tirs cohérents et 3 soldats par caserne', () => {
    for (const t of toutesLesTours) {
      expect(t.cout, t.nom).toBeGreaterThan(0);
      expect(t.portee, t.nom).toBeGreaterThan(0);
      if (!t.soldats) {
        expect(t.cadence, t.nom).toBeGreaterThan(0);
        expect(t.degats[1], t.nom).toBeGreaterThanOrEqual(t.degats[0]);
      }
    }
    for (const t of [...TOURS.caserne.niveaux, TOURS.caserne.specialisations.A, TOURS.caserne.specialisations.B]) {
      expect(t.soldats?.nombre).toBe(3);
    }
    expect(TOURS.artillerie.niveaux.every((t) => !t.volants && t.zone > 0)).toBe(true);
    expect(TOURS.tir.niveaux.every((t) => t.volants)).toBe(true);
    expect(TOURS.magie.niveaux.every((t) => t.typeDegats === 'magique')).toBe(true);
  });

  it('Charlie : bonus de caserne, deux sorts, tour divine à onde', () => {
    const charlie = DIEUX.charlie;
    expect(charlie.bonus).toMatchObject({ famille: 'caserne', pvSoldats: 0.25 });
    expect(charlie.bonus.effets.some((e) => e.type === 'etourdissement')).toBe(true);
    expect(charlie.sorts).toHaveLength(2);
    expect(charlie.sorts[1].effets.find((e) => e.type === 'invoquer')).toMatchObject({ nombre: 2 });
    expect(charlie.tourDivine.onde).toBe(true);
    expect(charlie.heros.zone?.effets.some((e) => e.type === 'etourdissement')).toBe(true);
  });

  it('les difficultés vont de la plus douce à la plus dure', () => {
    expect(DIFFICULTES.chaton.vies).toBeGreaterThan(DIFFICULTES.matou.vies);
    expect(DIFFICULTES.matou.vies).toBeGreaterThan(DIFFICULTES.vieux_sage.vies);
    expect(DIFFICULTES.chaton.pvEnnemis).toBeLessThan(DIFFICULTES.vieux_sage.pvEnnemis);
  });
});

describe('niveau de test de la région 1', () => {
  const carte = NIVEAU_TEST.carte;
  const chemins = carte.chemins.map(calculerChemin);

  it('a une carte 16:9 de 32 × 18 tuiles, 6 socles et 5 vagues', () => {
    expect(NIVEAUX_REGION1).toContain(NIVEAU_TEST);
    expect([carte.largeur, carte.hauteur]).toEqual([32, 18]);
    expect(carte.socles).toHaveLength(6);
    expect(NIVEAU_TEST.vagues).toHaveLength(5);
  });

  it('place les socles dans la carte, hors du chemin, et les ralliements sur le chemin à portée de caserne', () => {
    const porteeCaserne = TOURS.caserne.niveaux[0].portee;
    for (const s of carte.socles) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(carte.largeur);
      expect(s.y).toBeGreaterThan(0);
      expect(s.y).toBeLessThan(carte.hauteur);
      expect(distanceAuxChemins(chemins, s.x, s.y)).toBeGreaterThan(1);
      expect(distanceAuxChemins(chemins, s.ralliement.x, s.ralliement.y)).toBeLessThanOrEqual(REGLES.distanceMaxChemin);
      expect(Math.hypot(s.ralliement.x - s.x, s.ralliement.y - s.y)).toBeLessThanOrEqual(porteeCaserne);
    }
    expect(distanceAuxChemins(chemins, carte.departHeros.x, carte.departHeros.y)).toBeLessThanOrEqual(REGLES.distanceMaxChemin);
  });

  it('ses vagues n’utilisent que des ennemis et des chemins connus, et la dernière amène le boss', () => {
    for (const vague of NIVEAU_TEST.vagues) {
      for (const p of vague.paquets) {
        expect(Object.keys(ENNEMIS)).toContain(p.ennemi);
        expect(carte.chemins[p.chemin]).toBeDefined();
      }
    }
    expect(NIVEAU_TEST.vagues.at(-1)?.paquets.some((p) => p.ennemi === 'boucher_vaudrelle')).toBe(true);
  });
});
