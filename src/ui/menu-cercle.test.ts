import { describe, expect, it } from 'vitest';
import { NIVEAU_TEST } from '../data/niveaux/region1';
import { avancer, creerPartie } from '../engine';
import { CONFIG } from '../engine/aides.test-utils';
import type { Action, EtatPartie } from '../engine';
import { elementsMenu, elementsSocleVide, elementsTour, positionsCercle } from './menu-cercle';

function partie(aretes = 5000): EtatPartie {
  const etat = creerPartie(NIVEAU_TEST, CONFIG);
  etat.aretes = aretes;
  return etat;
}

function jouer(etat: EtatPartie, ...actions: Action[]): void {
  for (const action of actions) {
    const [resultat] = avancer(etat, [action]);
    expect(resultat?.ok, JSON.stringify(action)).toBe(true);
  }
}

describe('menu d’un socle vide', () => {
  it('propose les 4 familles puis la tour divine, avec leur prix', () => {
    const elements = elementsSocleVide(partie(), 0);
    expect(elements.map((e) => e.id)).toEqual([
      'construire:caserne', 'construire:tir', 'construire:magie', 'construire:artillerie', 'construire:divine',
    ]);
    // Charlie : Grenier des Griffes 70, Clocher 70, Autel 100, Catapulte (prix des données), Totem 200.
    expect(elements[0]?.prix).toBe(70);
    expect(elements[1]?.prix).toBe(70);
    expect(elements[2]?.prix).toBe(100);
    expect(elements[4]?.prix).toBe(200);
    expect(elements.every((e) => e.action?.type === 'construire')).toBe(true);
    expect(elements.every((e) => e.refus === null)).toBe(true);
  });

  it('grise ce qu’on ne peut pas payer, d’après le moteur', () => {
    const elements = elementsSocleVide(partie(90), 0);
    const refus = Object.fromEntries(elements.map((e) => [e.id, e.refus]));
    expect(refus['construire:caserne']).toBeNull();
    expect(refus['construire:tir']).toBeNull();
    expect(refus['construire:magie']).toBe('aretes_insuffisantes');
    expect(refus['construire:divine']).toBe('aretes_insuffisantes');
  });

  it('grise la tour divine quand elle est déjà construite ailleurs', () => {
    const etat = partie();
    jouer(etat, { type: 'construire', socle: 1, tour: 'divine' });
    const divine = elementsSocleVide(etat, 0).find((e) => e.id === 'construire:divine');
    expect(divine?.refus).toBe('tour_divine_unique');
  });

  it('chaque libellé est un texte traduit, jamais une clé', () => {
    for (const e of elementsSocleVide(partie(), 0)) expect(e.libelle).not.toMatch(/^(menu|tour|famille)\./);
  });
});

describe('menu d’une tour construite', () => {
  it('niveaux 1 et 2 : améliorer, vendre et, pour une caserne, le ralliement', () => {
    const etat = partie();
    jouer(etat, { type: 'construire', socle: 0, tour: 'caserne' }, { type: 'construire', socle: 1, tour: 'tir' });
    expect(elementsTour(etat, 0).map((e) => e.id)).toEqual(['ameliorer', 'vendre', 'ralliement']);
    expect(elementsTour(etat, 1).map((e) => e.id)).toEqual(['ameliorer', 'vendre']);
    expect(elementsMenu(etat, 0)).toEqual(elementsTour(etat, 0));
  });

  it('affiche le prix de l’amélioration et le montant de la revente (70 % du coût cumulé)', () => {
    const etat = partie();
    jouer(etat, { type: 'construire', socle: 1, tour: 'tir' });
    const [ameliorer, vendre] = elementsTour(etat, 1);
    expect(ameliorer?.prix).toBe(110);
    expect(vendre?.gain).toBe(Math.floor((70 * 70) / 100));
    jouer(etat, { type: 'ameliorer', socle: 1 });
    expect(elementsTour(etat, 1)[1]?.gain).toBe(Math.floor((180 * 70) / 100));
  });

  it('niveau 3 : les deux spécialisations avec leur prix, plus d’amélioration simple', () => {
    const etat = partie();
    jouer(etat, { type: 'construire', socle: 1, tour: 'tir' }, { type: 'ameliorer', socle: 1 }, { type: 'ameliorer', socle: 1 });
    const elements = elementsTour(etat, 1);
    expect(elements.map((e) => e.id)).toEqual(['specialiser:A', 'specialiser:B', 'vendre']);
    expect(elements[0]?.prix).toBe(230);
    expect(elements[0]?.libelle).toBe('Guetteurs des Toits');
    expect(elements[1]?.libelle).toBe('Arbalétriers du Beffroi');
    expect(elements.every((e) => e.refus === null || e.id === 'vendre')).toBe(true);
  });

  it('grise l’amélioration quand les arêtes manquent', () => {
    const etat = partie();
    jouer(etat, { type: 'construire', socle: 1, tour: 'tir' });
    etat.aretes = 50;
    expect(elementsTour(etat, 1)[0]?.refus).toBe('aretes_insuffisantes');
    expect(elementsTour(etat, 1)[1]?.refus).toBeNull();
  });

  it('niveau 4 : vendre seulement (et le ralliement d’une caserne) ; tour divine : vendre', () => {
    const etat = partie();
    jouer(
      etat,
      { type: 'construire', socle: 0, tour: 'caserne' }, { type: 'ameliorer', socle: 0 }, { type: 'ameliorer', socle: 0 },
      { type: 'specialiser', socle: 0, voie: 'A' },
      { type: 'construire', socle: 1, tour: 'divine' },
    );
    expect(elementsTour(etat, 0).map((e) => e.id)).toEqual(['vendre', 'ralliement']);
    expect(elementsTour(etat, 1).map((e) => e.id)).toEqual(['vendre']);
  });

  it('un socle vide n’a pas de menu de tour', () => {
    expect(elementsTour(partie(), 3)).toEqual([]);
  });
});

describe('positionsCercle', () => {
  const dist = (a: { x: number; y: number }, cx: number, cy: number): number => Math.hypot(a.x - cx, a.y - cy);

  it('répartit les boutons à égale distance du centre, le premier en haut', () => {
    const p = positionsCercle(5, 60, 400, 200, 800, 400, 30);
    expect(p).toHaveLength(5);
    expect(p[0]?.x).toBeCloseTo(400, 6);
    expect(p[0]?.y).toBeCloseTo(140, 6);
    for (const point of p) expect(dist(point, 400, 200)).toBeCloseTo(60, 6);
    const angles = p.map((q) => Math.atan2(q.y - 200, q.x - 400));
    const ecarts = angles.slice(1).map((a, i) => a - (angles[i] ?? 0));
    for (const e of ecarts) expect((e + 2 * Math.PI) % (2 * Math.PI)).toBeCloseTo((2 * Math.PI) / 5, 6);
  });

  it('les boutons ne se chevauchent pas (47 px de large, 5 boutons à 64 px du centre)', () => {
    const p = positionsCercle(5, 64, 400, 200, 800, 400, 30);
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const a = p[i];
        const b = p[j];
        if (a && b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(47);
      }
    }
  });

  it('garde tous les boutons dans l’écran quand le socle est près d’un bord ou d’un coin', () => {
    for (const [cx, cy] of [[5, 5], [795, 5], [5, 395], [795, 395], [400, 2], [2, 200]] as const) {
      const p = positionsCercle(5, 60, cx, cy, 800, 400, 30);
      for (const point of p) {
        expect(point.x).toBeGreaterThanOrEqual(30);
        expect(point.x).toBeLessThanOrEqual(770);
        expect(point.y).toBeGreaterThanOrEqual(30);
        expect(point.y).toBeLessThanOrEqual(370);
      }
    }
  });

  it('un écran trop petit pour le cercle centre le menu', () => {
    const p = positionsCercle(4, 60, 10, 10, 100, 100, 30);
    expect(p[0]?.x).toBeCloseTo(50, 6);
  });

  it('un seul bouton se place en haut, aucun bouton ne donne une liste vide', () => {
    expect(positionsCercle(1, 50, 100, 100, 400, 400, 20)[0]?.y).toBeCloseTo(50, 6);
    expect(positionsCercle(0, 50, 100, 100, 400, 400, 20)).toEqual([]);
  });
});
