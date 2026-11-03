import { describe, expect, it } from 'vitest';
import {
  animationsReduites, decalageSursaut, DUREE_ANNEAU, DUREE_FLASH, DUREE_POUSSIERE, DUREE_SURSAUT, haloDe, HALOS, opaciteAnneau,
  opaciteFlash, PARTICULES, particule, pulsationHalo, rayonAnneau, type EtatParticule,
} from './effets-tours';

describe('sursaut de la tour', () => {
  it('se tasse de 2 px, rebondit au-dessus de sa place, puis revient à 0', () => {
    expect(decalageSursaut(-5)).toBe(0);
    expect(decalageSursaut(70)).toBe(2);
    const valeurs = Array.from({ length: DUREE_SURSAUT }, (_, t) => decalageSursaut(t));
    expect(Math.max(...valeurs)).toBe(2);
    expect(Math.min(...valeurs)).toBe(-1);
    expect(decalageSursaut(DUREE_SURSAUT - 1) + 0).toBe(0);
    expect(decalageSursaut(DUREE_SURSAUT)).toBe(0);
  });
});

describe('flash et anneau', () => {
  it('le flash est plein au départ et éteint après sa durée', () => {
    expect(opaciteFlash(0)).toBe(1);
    expect(opaciteFlash(DUREE_FLASH)).toBe(0);
    expect(opaciteFlash(-1)).toBe(0);
  });

  it('l’anneau grandit depuis le pied (~0,3 s) et s’éteint', () => {
    expect(DUREE_ANNEAU).toBe(300);
    expect(rayonAnneau(0, 8)).toBeLessThan(rayonAnneau(150, 8));
    expect(rayonAnneau(150, 8)).toBeLessThan(rayonAnneau(DUREE_ANNEAU, 8));
    expect(opaciteAnneau(0)).toBe(1);
    expect(opaciteAnneau(DUREE_ANNEAU)).toBe(0);
  });
});

describe('poussière', () => {
  it('chaque coin a ses particules, symétriques, éteintes après la durée', () => {
    const g: EtatParticule = { x: 0, y: 0, taille: 0, alpha: 0, eclat: false };
    const d: EtatParticule = { x: 0, y: 0, taille: 0, alpha: 0, eclat: false };
    for (let i = 0; i < PARTICULES.length; i++) {
      expect(particule(i, -1, 200, 8, g)).toBe(true);
      expect(particule(i, 1, 200, 8, d)).toBe(true);
      expect(g.x).toBe(-d.x);
      expect(g.y).toBe(d.y);
      expect(d.alpha).toBeGreaterThan(0);
      expect(particule(i, 1, DUREE_POUSSIERE, 8, d)).toBe(false);
    }
    expect(PARTICULES.some((p) => p.eclat)).toBe(true);
    expect(PARTICULES.some((p) => !p.eclat)).toBe(true);
  });
});

describe('réduire les animations', () => {
  it('suit prefers-reduced-motion, faux si le navigateur ne sait pas', () => {
    expect(animationsReduites({ matchMedia: () => ({ matches: true }) })).toBe(true);
    expect(animationsReduites({ matchMedia: () => ({ matches: false }) })).toBe(false);
    expect(animationsReduites({})).toBe(false);
    expect(animationsReduites({ matchMedia: () => { throw new Error('non'); } })).toBe(false);
  });
});

describe('halo des tours à feu', () => {
  it('magie à tous les niveaux, plus fort au 3 ; artillerie au 3 seulement ; les autres familles rien', () => {
    expect(haloDe('magie', 1)).not.toBeNull();
    expect(haloDe('magie', 3)?.intensite).toBeGreaterThan(haloDe('magie', 1)?.intensite ?? 1);
    expect(haloDe('artillerie', 1)).toBeNull();
    expect(haloDe('artillerie', 2)).toBeNull();
    expect(haloDe('artillerie', 3)).not.toBeNull();
    expect(haloDe('tir', 3)).toBeNull();
    expect(haloDe('caserne', 3)).toBeNull();
  });

  it('la spécialisation (niveau 4) garde le halo du niveau 3', () => {
    expect(haloDe('magie', 4)).toEqual(haloDe('magie', 3));
  });

  it('reste doux : intensité modérée même avec la pulsation', () => {
    for (const lignes of Object.values(HALOS)) for (const h of lignes) if (h) expect(h.intensite * 1.12).toBeLessThanOrEqual(0.55);
    for (let t = 0; t < 4000; t += 50) expect(Math.abs(pulsationHalo(t, 123) - 1)).toBeLessThanOrEqual(0.12 + 1e-9);
  });
});
