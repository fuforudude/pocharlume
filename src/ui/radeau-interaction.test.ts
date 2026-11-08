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

const RADEAU: GimmickRadeau = { type: 'radeau', trajet: [{ cx: 2, cy: 4 }, { cx: 10, cy: 4 }], vitesse: 0.5, places: [{ dx: -2, dy: 0 }, { dx: 0, dy: 0 }, { dx: 2, dy: 0 }] };

function partie(dieu = 'charlie'): EtatPartie {
  const carte = { largeur: 32, hauteur: 18, chemins: [{ points: [{ x: 0, y: 1 }, { x: 31, y: 1 }] }], departHeros: { x: 28, y: 3 } };
  const niveau: Niveau = {
    id: 'essai',
    aretesDepart: 5000,
    carte,
    casesInterdites: [...casesInterditesDuNiveau(carte, [], []), ...casesDuTrajet(RADEAU)],
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

/** Joue jusqu'à ce que le dernier pas joué (celui des tours) soit `pasTours`. */
function jouerJusqua(etat: EtatPartie, pasTours: number): void {
  while (etat.pas - 1 < pasTours) avancer(etat, []);
  expect(etat.pas - 1).toBe(pasTours);
}

describe('une tour de la rive au contact du trajet garde son menu', () => {
  // Le radeau fait une tuile par seconde : il est à x = 5 + pas / 30 tuiles à l'aller, de x = 5 (case 2) à x = 21 (case 10).
  // Ses places sont en ligne, en y = 9 : la place 0 deux tuiles à gauche du centre, la place 1 au centre, la place 2 deux tuiles à droite.
  it('au-dessus du trajet : toucher la tour de la rive quand le radeau passe dessous ouvre son menu, pas celui de la place 1', () => {
    const etat = partie();
    avancer(etat, [{ type: 'construire', place: 1, tour: 'tir' }, { type: 'construire', cx: 6, cy: 3, tour: 'tir' }]);
    expect(etat.tours).toHaveLength(2);
    // Au pas 240, le radeau est sous la case (6, 3) : la place 1 en (13, 9), le corps de sa tour en (13, 8,5), le centre de la case en (13, 7).
    jouerJusqua(etat, 240);
    expect(place(etat, 1)).toEqual({ x: 13, y: 9 });
    expect(placeTouchee(etat, 13, 7, 0.9)).toBe(-1);
    const interaction = new Interaction();
    interaction.toucher(etat, 13, 7, 0.9);
    expect(interaction.mode).toEqual({ type: 'menu', cx: 6, cy: 3 });
    expect(elementsMenu(etat, lieuDuMenu(interaction.mode) ?? { cx: -1, cy: -1 }).find((e) => e.id === 'vendre')?.action).toEqual({ type: 'vendre', cx: 6, cy: 3 });
    // Le bas de la case de la rive reste à sa tour, alors que ce point est à 0,8 tuile du corps de la tour du radeau (dans le rayon).
    expect(placeTouchee(etat, 13, 7.7, 0.9)).toBe(-1);
    interaction.toucher(etat, 13, 7, 0.9);
    interaction.toucher(etat, 13, 7.7, 0.9);
    expect(interaction.mode).toEqual({ type: 'menu', cx: 6, cy: 3 });
    // Sur l'eau du trajet, la place 1 et sa tour se touchent toujours.
    expect(placeTouchee(etat, 13, 8.2, 0.9)).toBe(1);
  });

  it('une case de la rive sans tour : la place ne l’emporte que si le point est plus près d’elle que du centre de la case', () => {
    const etat = partie();
    // Au pas 450, le radeau est en x = 20 : la place 2, en (22, 9), est sur le bord gauche de la case (11, 4), de centre (23, 9).
    jouerJusqua(etat, 450);
    expect(place(etat, 2)).toEqual({ x: 22, y: 9 });
    expect(placeTouchee(etat, 22.2, 9, 0.9)).toBe(2);
    expect(placeTouchee(etat, 22.6, 9, 0.9)).toBe(-1);
  });

  it('au bout gauche du trajet : la tour de la case (1, 4) garde son menu face à la tour de la place 0', () => {
    const etat = partie();
    avancer(etat, [{ type: 'construire', place: 0, tour: 'tir' }, { type: 'construire', cx: 1, cy: 4, tour: 'tir' }]);
    expect(etat.tours).toHaveLength(2);
    // Le radeau revient au bout gauche au pas 960 (aller-retour de 16 tuiles) : la place 0 est en (3, 9), au centre de la case (1, 4).
    jouerJusqua(etat, 960);
    expect(place(etat, 0)).toEqual({ x: 3, y: 9 });
    // Ce point est à 0,41 tuile du corps de la tour du radeau, mais pas plus près de son pied que du centre de la case.
    expect(placeTouchee(etat, 3.4, 8.6, 0.9)).toBe(-1);
    const interaction = new Interaction();
    interaction.toucher(etat, 3.4, 8.6, 0.9);
    expect(interaction.mode).toEqual({ type: 'menu', cx: 1, cy: 4 });
    // Le pied même de la place, confondu avec le centre de la case, reste à la case : à égalité, la rive l'emporte.
    expect(placeTouchee(etat, 3, 9, 0.9)).toBe(-1);
    // Une demi-tuile plus tôt (pas 945), la place 0 est en (3,5 ; 9) : son pied, plus près d'elle que du centre de la case, la touche.
    const avant = partie();
    avancer(avant, [{ type: 'construire', place: 0, tour: 'tir' }, { type: 'construire', cx: 1, cy: 4, tour: 'tir' }]);
    jouerJusqua(avant, 945);
    expect(place(avant, 0)).toEqual({ x: 3.5, y: 9 });
    expect(placeTouchee(avant, 3.6, 9, 0.9)).toBe(0);
  });

  it('au bout droit du trajet : la tour de la case (11, 4) garde son menu face à la tour de la place 2', () => {
    const etat = partie();
    avancer(etat, [{ type: 'construire', place: 2, tour: 'tir' }, { type: 'construire', cx: 11, cy: 4, tour: 'tir' }]);
    expect(etat.tours).toHaveLength(2);
    jouerJusqua(etat, 465);
    // La place 2 en (22,5 ; 9) : son pied se touche encore, plus près d'elle que du centre de la case (23, 9).
    expect(place(etat, 2)).toEqual({ x: 22.5, y: 9 });
    expect(placeTouchee(etat, 22.4, 9, 0.9)).toBe(2);
    jouerJusqua(etat, 480);
    expect(place(etat, 2)).toEqual({ x: 23, y: 9 });
    expect(placeTouchee(etat, 22.6, 8.6, 0.9)).toBe(-1);
    const interaction = new Interaction();
    interaction.toucher(etat, 22.6, 8.6, 0.9);
    expect(interaction.mode).toEqual({ type: 'menu', cx: 11, cy: 4 });
    expect(placeTouchee(etat, 20.8, 9, 0.9)).toBe(1);
  });

  it('le survol suit la même règle : la case de la rive s’éclaire, pas la place', () => {
    const etat = partie();
    avancer(etat, [{ type: 'construire', place: 1, tour: 'tir' }, { type: 'construire', cx: 6, cy: 3, tour: 'tir' }]);
    jouerJusqua(etat, 240);
    const interaction = new Interaction();
    for (const y of [7, 7.7]) {
      interaction.viser(etat, 13, y);
      expect(interaction.viseePlace).toBe(-1);
      expect(interaction.visee).toEqual({ cx: 6, cy: 3 });
    }
  });

  it('souris immobile : refaire la visée au même point après le passage du radeau suit ce qui est dessous', () => {
    const etat = partie();
    jouerJusqua(etat, 240);
    const interaction = new Interaction();
    interaction.viser(etat, 13, 8.6);
    expect(interaction.viseePlace).toBe(1);
    // Le radeau s'en va, ses trois places avec lui (la place 0 passe à 1,08 tuile au pas 330) : la même position vise la case d'eau
    // du trajet (rien ne s'y construit).
    jouerJusqua(etat, 330);
    expect(place(etat, 0)).toEqual({ x: 14, y: 9 });
    interaction.viser(etat, 13, 8.6);
    expect(interaction.viseePlace).toBe(-1);
    expect(interaction.construireSurSelection(etat, 'tir').refus).toBe('case_interdite');
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
    expect(refus['construire:caserne']).toBe('radeau_sol_requis');
    expect(refus['construire:tir']).toBeNull();
    expect(refus['construire:magie']).toBeNull();
    expect(refus['construire:artillerie']).toBeNull();
    expect(refus['construire:divine']).toBeNull();
    expect(elements.find((e) => e.id === 'construire:tir')?.action).toEqual({ type: 'construire', tour: 'tir', place: 1 });
    // Pas de ralliement à montrer sur l'eau.
    expect(elements.every((e) => e.apercu?.ralliement == null)).toBe(true);
    const caserne = elements.find((e) => e.id === 'construire:caserne');
    if (!caserne) throw new Error('caserne absente');
    expect(contenuElementMenu(etat, { place: 1 }, caserne)?.notes).toContain(texteRefus('radeau_sol_requis'));
  });

  it('les tours divines de Plume (assassins) et de Pollen (atelier) sont grisées, toutes deux pour radeau_sol_requis', () => {
    expect(elementsMenu(partie('plume'), { place: 0 }).find((e) => e.id === 'construire:divine')?.refus).toBe('radeau_sol_requis');
    expect(elementsMenu(partie('pollen'), { place: 0 }).find((e) => e.id === 'construire:divine')?.refus).toBe('radeau_sol_requis');
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
    expect(interaction.construireSurSelection(etat, 'caserne').refus).toBe('radeau_sol_requis');
    interaction.cesserDeViser();
    expect(interaction.viseePlace).toBe(-1);
  });
});
