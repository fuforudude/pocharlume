// @vitest-environment happy-dom
// Indications du Vol de Corbeaux : un groupe en couloir n'est jamais compté sur le chemin 0 (panneaux d'entrée, traînées, porte),
// chaque couloir de la prochaine vague a son panneau au bord gauche (à la hauteur du couloir, sans chevaucher un panneau d'entrée),
// et un corbeau qui sort fait réagir le bout de son couloir, pas la porte du chemin 0.
import { afterEach, describe, expect, it } from 'vitest';
import { casesInterditesDuNiveau } from '../data/niveaux/grille-niveau';
import { VERSION_DONNEES } from '../data/version';
import { avancer, creerPartie } from '../engine';
import type { ConfigPartie, EtatPartie, Vague } from '../engine';
import type { Niveau, Paquet } from '../engine/definitions';
import type { AtlasRendu } from '../render/atlas';
import { cheminsDeLaVague, compositionParChemin, compositionParCouloir, DUREE_SECOUSSE_MS, Indications, placerPanneauCouloir } from './indications';

const ATLAS = { iconeUrl: (nom: string) => `${nom}.png` } as unknown as AtlasRendu;
const PROJECTION = { pixelsCssParTuile: 16, enCssX: (x: number): number => x * 16, enCssY: (y: number): number => y * 16 };
const CONFIG: ConfigPartie = { graine: 7, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };

const paysans = (n: number): Paquet => ({ ennemi: 'paysan_affame', nombre: n, intervalle: 1, chemin: 0, delai: 0 });
const corbeaux = (couloir: number, n: number, ennemi = 'corbeau_noir'): Paquet => ({ ennemi, nombre: n, intervalle: 0.5, chemin: 0, couloir, delai: 0 });

/** 32 × 18 tuiles, un chemin en y = 5 qui entre à gauche ; couloirs sur les lignes 1 et 7 de la grille (y = 3 et 15). */
function niveau(vagues: readonly Vague[]): Niveau {
  const carte = { largeur: 32, hauteur: 18, chemins: [{ points: [{ x: 0, y: 5 }, { x: 30, y: 5 }] }], departHeros: { x: 28, y: 1 } };
  return { id: 'essai', aretesDepart: 500, carte, casesInterdites: casesInterditesDuNiveau(carte, [], []), vagues, gimmick: { type: 'corbeaux', couloirs: [{ cy: 1 }, { cy: 7 }] } };
}

function monter(vagues: readonly Vague[], maintenant = (): number => 0): { etat: EtatPartie; indications: Indications } {
  const etat = creerPartie(niveau(vagues), CONFIG);
  const indications = new Indications(document.body, ATLAS, PROJECTION, etat, new AbortController().signal, 0, { reduit: () => false, maintenant });
  indications.mettreAJour(etat, 0);
  return { etat, indications };
}

/** Les panneaux visibles d'une classe : pour chacun, ses pastilles `type:nombre`. */
function panneaux(classe: string): string[][] {
  return [...document.querySelectorAll<HTMLElement>(`.${classe}`)]
    .filter((p) => !p.hidden)
    .map((p) => [...p.querySelectorAll<HTMLElement>('.puce-ennemi[data-type]')].map((c) => `${c.dataset['type'] ?? ''}:${c.dataset['nombre'] ?? ''}`));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('composition d’une vague à corbeaux', () => {
  const vague: Vague = { paquets: [paysans(3), corbeaux(0, 4), corbeaux(1, 2), corbeaux(0, 1, 'chauve_souris'), corbeaux(0, 2)] };

  it('un groupe en couloir n’est pas compté sur le chemin 0', () => {
    expect(compositionParChemin(vague, 1)).toEqual([[{ type: 'paysan_affame', nombre: 3 }]]);
  });

  it('chaque couloir a ses types et ses nombres, dans l’ordre d’apparition', () => {
    expect(compositionParCouloir(vague, 2)).toEqual([
      [{ type: 'corbeau_noir', nombre: 6 }, { type: 'chauve_souris', nombre: 1 }],
      [{ type: 'corbeau_noir', nombre: 2 }],
    ]);
  });

  it('les chemins d’une vague ne comptent pas ses couloirs', () => {
    expect(cheminsDeLaVague({ paquets: [corbeaux(1, 2)] })).toEqual([]);
    expect(cheminsDeLaVague(vague)).toEqual([0]);
    expect(cheminsDeLaVague(null)).toEqual([]);
  });
});

describe('panneaux des couloirs', () => {
  it('avant la vague : un panneau par couloir utilisé, et l’entrée du chemin n’annonce que ses propres ennemis', () => {
    monter([{ paquets: [paysans(2), corbeaux(1, 3)] }]);
    expect(panneaux('entree-chemin')).toEqual([['paysan_affame:2']]);
    expect(panneaux('entree-couloir')).toEqual([['corbeau_noir:3']]);
    const panneau = [...document.querySelectorAll<HTMLElement>('.entree-couloir')].find((p) => !p.hidden);
    expect(panneau?.getAttribute('aria-label')).toBe('Couloir de corbeaux 2 : prochaine vague');
    expect(panneau?.querySelector('.repere-couloir')).not.toBeNull();
  });

  it('une vague sans chemin (corbeaux seuls) ne montre aucun panneau d’entrée', () => {
    monter([{ paquets: [corbeaux(0, 2)] }]);
    expect(panneaux('entree-chemin')).toEqual([]);
    expect(panneaux('entree-couloir')).toEqual([['corbeau_noir:2']]);
  });

  it('disparaissent une fois la vague partie, comme les panneaux d’entrée', () => {
    const { etat, indications } = monter([{ paquets: [corbeaux(0, 3)] }, { paquets: [corbeaux(1, 1)] }]);
    avancer(etat, [{ type: 'appelerVague' }]);
    indications.mettreAJour(etat, 0);
    expect(panneaux('entree-couloir')).toEqual([]);
  });

  it('collé au bord gauche de la zone libre, à la hauteur du couloir', () => {
    const { etat, indications } = monter([{ paquets: [corbeaux(1, 3)] }]);
    indications.definirMarges({ haut: 40, bas: 0, gauche: 20, droite: 0 });
    indications.mettreAJour(etat, 0);
    const panneau = [...document.querySelectorAll<HTMLElement>('.entree-couloir')].find((p) => !p.hidden);
    expect(panneau?.style.left).toBe('26px');
    // Couloir 2 en y = 15 tuiles = 240 px ; panneau de 34 px de haut (mesure de repli) centré dessus.
    expect(panneau?.style.top).toBe(`${String(Math.round(240 - 17))}px`);
  });

  it('le repère du couloir et ses pastilles se retrouvent sous le pointeur, avec leur genre', () => {
    const { indications } = monter([{ paquets: [corbeaux(0, 3)] }]);
    const panneau = [...document.querySelectorAll<HTMLElement>('.entree-couloir')].find((p) => !p.hidden);
    const repere = panneau?.querySelector<HTMLElement>('.repere-couloir');
    const puce = panneau?.querySelector<HTMLElement>('.puce-ennemi');
    if (!repere || !puce) throw new Error('panneau incomplet');
    const rect = (x: number): DOMRect => ({ left: x, top: 10, right: x + 20, bottom: 30, width: 20, height: 20, x, y: 10, toJSON: () => ({}) });
    repere.getBoundingClientRect = () => rect(0);
    puce.getBoundingClientRect = () => rect(100);
    expect(indications.puceSous(10, 20)).toMatchObject({ genre: 'couloir' });
    expect(indications.puceSous(110, 20)).toMatchObject({ genre: 'ennemi', type: 'corbeau_noir' });
  });
});

describe('placement d’un panneau de couloir', () => {
  const zone = { gauche: 6, haut: 46, droite: 734, bas: 354 };

  it('centré sur le couloir quand rien ne gêne', () => {
    expect(placerPanneauCouloir(200, 80, 30, zone, [])).toEqual({ gauche: 6, haut: 185 });
  });

  it('jamais sous la barre du HUD ni sous le bas de la zone', () => {
    expect(placerPanneauCouloir(30, 80, 30, zone, []).haut).toBe(46);
    expect(placerPanneauCouloir(360, 80, 30, zone, []).haut).toBe(324);
  });

  it('poussé sous un panneau d’entrée qu’il chevaucherait, ou au-dessus s’il est plus près du couloir', () => {
    const entree = { gauche: 0, haut: 180, droite: 90, bas: 214 };
    const sous = placerPanneauCouloir(205, 80, 30, zone, [entree]);
    expect(sous.haut).toBe(216);
    const dessus = placerPanneauCouloir(190, 80, 30, zone, [entree]);
    expect(dessus.haut).toBe(148);
  });

  it('évite aussi un panneau à droite du bord, s’il ne le chevauche pas', () => {
    expect(placerPanneauCouloir(200, 80, 30, zone, [{ gauche: 200, haut: 180, droite: 260, bas: 214 }])).toEqual({ gauche: 6, haut: 185 });
  });

  it('deux obstacles empilés : juste sous le premier, il chevaucherait le second, il passe donc au-dessus du premier', () => {
    const a = { gauche: 0, haut: 180, droite: 90, bas: 214 };
    const b = { gauche: 0, haut: 216, droite: 90, bas: 250 };
    const p = placerPanneauCouloir(220, 80, 30, zone, [a, b]);
    // Sous a (216), le plus près du couloir, est pris par b : le premier côté libre est au-dessus de a (180 - 30 - 2).
    expect(p.haut).toBe(148);
  });
});

describe('sortie d’un corbeau', () => {
  it('fait réagir le bout de son couloir, et pas la porte du chemin 0', () => {
    let horloge = 0;
    const { etat, indications } = monter([{ paquets: [corbeaux(1, 1)] }], () => horloge);
    avancer(etat, [{ type: 'appelerVague' }]);
    indications.apresPas(etat);
    const corbeau = etat.ennemis[0];
    if (!corbeau) throw new Error('corbeau absent');
    expect(corbeau.couloir).toBe(1);
    indications.evenement(etat, { type: 'fuite', ennemi: corbeau.id, vies: 1 }, 0);
    indications.mettreAJour(etat, 0);
    const bout = document.querySelectorAll<HTMLElement>('.sortie-couloir')[1];
    expect(bout?.hidden).toBe(false);
    expect(bout?.classList.contains('rougit')).toBe(true);
    expect(document.querySelector('.sortie-chemin')?.classList.contains('rougit')).toBe(false);
    expect(document.querySelectorAll<HTMLElement>('.sortie-couloir')[0]?.hidden).toBe(true);
    horloge = DUREE_SECOUSSE_MS + 1;
    indications.mettreAJour(etat, 0);
    expect(bout?.hidden).toBe(true);
  });
});

describe('composition par chemin avec repli', () => {
  it('un groupe prévu sur le chemin 1, replié sur le chemin 0, est compté sur le chemin 0', () => {
    const vague: Vague = { paquets: [{ ennemi: 'paysan_affame', nombre: 4, intervalle: 1, chemin: 1, delai: 0 }] };
    const repli = (c: number): number => (c === 1 ? 0 : c);
    expect(compositionParChemin(vague, 2, repli)).toEqual([[{ type: 'paysan_affame', nombre: 4 }], []]);
    expect(cheminsDeLaVague(vague, repli)).toEqual([0]);
    expect(compositionParChemin(vague, 2)).toEqual([[], [{ type: 'paysan_affame', nombre: 4 }]]);
  });
});
