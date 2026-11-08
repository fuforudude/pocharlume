// Construire sur le radeau : toucher une place ouvre son menu (comme une case libre), le menu n'admet que les tours permises
// (caserne, Sanctuaire de Plume et Atelier de Pollen grisés avec leur raison), une tour du radeau ouvre son menu (améliorer,
// vendre), la place touchée est la plus proche dans le rayon du doigt, et la surbrillance suit la place.
import { describe, expect, it } from 'vitest';
import { casesInterditesDuNiveau } from '../data/niveaux/grille-niveau';
import { avancer, casesDuTrajet, creerPartie, positionPlace } from '../engine';
import type { EtatPartie } from '../engine';
import { configDe } from '../engine/aides.test-utils';
import type { GimmickRadeau, Niveau } from '../engine/definitions';
import { Surbrillance } from '../render/rendu';
import { contenuElementMenu } from './bulle-contenus';
import { Interaction, lieuDuMenu, placeTouchee } from './interaction';
import { elementsMenu } from './menu-cercle';
import { texteRefus } from './refus';

const RADEAU: GimmickRadeau = { type: 'radeau', trajet: [{ cx: 2, cy: 4 }, { cx: 10, cy: 4 }], vitesse: 0.5, places: [{ dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }] };

function partie(dieu = 'charlie'): EtatPartie {
  const carte = { largeur: 32, hauteur: 18, chemins: [{ points: [{ x: 0, y: 1 }, { x: 31, y: 1 }] }], departHeros: { x: 28, y: 3 } };
  const niveau: Niveau = {
    id: 'essai',
    aretesDepart: 5000,
    carte,
    casesInterdites: [...casesInterditesDuNiveau(carte, []), ...casesDuTrajet(RADEAU)],
    vagues: [{ paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 1, chemin: 0, delai: 60 }] }],
    gimmick: RADEAU,
  };
  const etat = creerPartie(niveau, configDe(dieu));
  for (let i = 0; i < 25; i++) avancer(etat, []);
  return etat;
}

/** La position de la place `n` au dernier pas joué (celle où sont les tours). */
function place(etat: EtatPartie, n: number): { x: number; y: number } {
  return positionPlace(RADEAU, etat.pas - 1, n);
}

describe('place du radeau touchée', () => {
  it('la place sous le doigt, la plus proche si deux sont dans le rayon', () => {
    const etat = partie();
    const p1 = place(etat, 1);
    expect(placeTouchee(etat, p1.x, p1.y, 0.9)).toBe(1);
    expect(placeTouchee(etat, p1.x + 0.3, p1.y, 0.9)).toBe(1);
    const p2 = place(etat, 2);
    expect(placeTouchee(etat, p2.x - 0.2, p2.y + 0.1, 0.9)).toBe(2);
  });

  it('rien loin du radeau, ni sur un niveau sans radeau', () => {
    const etat = partie();
    expect(placeTouchee(etat, 30, 16, 0.9)).toBe(-1);
    const p0 = place(etat, 0);
    // Le rayon est borné (0,9 tuile au plus) : un grand doigt n'avale pas la rive.
    expect(placeTouchee(etat, p0.x, p0.y - 1.5, 5)).toBe(-1);
  });

  it('une tour posée sur une place se touche aussi par son corps (au-dessus du pied)', () => {
    const etat = partie();
    avancer(etat, [{ type: 'construire', place: 0, tour: 'tir' }]);
    const p0 = place(etat, 0);
    expect(placeTouchee(etat, p0.x, p0.y - 0.5 - 0.55, 0.6)).toBe(0);
  });
});

describe('menu d’une place du radeau', () => {
  it('toucher une place libre ouvre son menu ; la retoucher le referme', () => {
    const etat = partie();
    const interaction = new Interaction();
    const p = place(etat, 1);
    expect(interaction.toucher(etat, p.x, p.y, 0.9)).toEqual({ action: null, refus: null });
    expect(interaction.mode).toEqual({ type: 'menu', cx: -1, cy: -1, place: 1 });
    expect(lieuDuMenu(interaction.mode)).toEqual({ place: 1 });
    interaction.toucher(etat, p.x, p.y, 0.9);
    expect(interaction.mode).toEqual({ type: 'libre' });
  });

  it('la caserne est grisée avec sa raison, les autres tours se construisent sur la place', () => {
    const etat = partie();
    const elements = elementsMenu(etat, { place: 1 });
    const refus = Object.fromEntries(elements.map((e) => [e.id, e.refus]));
    expect(refus['construire:caserne']).toBe('radeau_sans_caserne');
    expect(refus['construire:tir']).toBeNull();
    expect(refus['construire:magie']).toBeNull();
    expect(refus['construire:artillerie']).toBeNull();
    expect(refus['construire:divine']).toBeNull();
    expect(elements.find((e) => e.id === 'construire:tir')?.action).toEqual({ type: 'construire', tour: 'tir', place: 1 });
    // Pas de ralliement à montrer sur l'eau.
    expect(elements.every((e) => e.apercu?.ralliement == null)).toBe(true);
    const caserne = elements.find((e) => e.id === 'construire:caserne');
    if (!caserne) throw new Error('caserne absente');
    expect(contenuElementMenu(etat, { place: 1 }, caserne)?.notes).toContain(texteRefus('radeau_sans_caserne'));
  });

  it('les tours divines de Plume (assassins) et de Pollen (atelier) sont grisées, chacune avec sa raison', () => {
    expect(elementsMenu(partie('plume'), { place: 0 }).find((e) => e.id === 'construire:divine')?.refus).toBe('radeau_sans_caserne');
    expect(elementsMenu(partie('pollen'), { place: 0 }).find((e) => e.id === 'construire:divine')?.refus).toBe('radeau_sans_ouvrage');
  });

  it('choisir « construire » envoie l’action sur la place ; une tour du radeau ouvre alors améliorer et vendre', () => {
    const etat = partie();
    const interaction = new Interaction();
    const p = place(etat, 2);
    interaction.toucher(etat, p.x, p.y, 0.9);
    const tir = elementsMenu(etat, { place: 2 }).find((e) => e.id === 'construire:tir');
    if (!tir) throw new Error('tir absent');
    const issue = interaction.choisirElement(tir);
    expect(issue.action).toEqual({ type: 'construire', tour: 'tir', place: 2 });
    if (!issue.action) throw new Error('action absente');
    expect(avancer(etat, [issue.action])[0]).toEqual({ ok: true });
    expect(elementsMenu(etat, { place: 2 }).map((e) => e.id)).toEqual(['ameliorer', 'vendre']);
    expect(elementsMenu(etat, { place: 2 }).find((e) => e.id === 'vendre')?.action).toEqual({ type: 'vendre', place: 2 });
  });

  it('la surbrillance suit la place du menu (portée de sa tour, aperçu de construction), pas une case', () => {
    const etat = partie();
    avancer(etat, [{ type: 'construire', place: 0, tour: 'tir' }]);
    const interaction = new Interaction();
    const p = place(etat, 0);
    interaction.toucher(etat, p.x, p.y, 0.9);
    const surb = new Surbrillance();
    interaction.surbrillance(etat, surb);
    expect(surb.place).toBe(0);
    expect(surb.cx).toBe(-1);
    expect(surb.portee).toBe(etat.tours[0]?.stats.portee);
  });

  it('survoler une place l’éclaire à la place de la case d’eau ; les touches 1 à 5 y construisent', () => {
    const etat = partie();
    const interaction = new Interaction();
    const p = place(etat, 1);
    interaction.viser(etat, p.x, p.y);
    expect(interaction.viseePlace).toBe(1);
    expect(interaction.visee).toBeNull();
    const surb = new Surbrillance();
    interaction.surbrillance(etat, surb);
    expect(surb.viseePlace).toBe(1);
    expect(interaction.construireSurSelection(etat, 'magie').action).toEqual({ type: 'construire', tour: 'magie', place: 1 });
    expect(interaction.construireSurSelection(etat, 'caserne').refus).toBe('radeau_sans_caserne');
    interaction.cesserDeViser();
    expect(interaction.viseePlace).toBe(-1);
  });
});
