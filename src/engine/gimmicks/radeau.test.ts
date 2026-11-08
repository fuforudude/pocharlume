import { describe, expect, it } from 'vitest';
import { casesInterditesDuNiveau } from '../../data/niveaux/grille-niveau';
import { REGLES } from '../../data/regles';
import { partEntiere } from '../argent';
import { CONFIG, VAGUE_LOINTAINE, configDe, distance, ennemiFixe, evenementsPendant } from '../aides.test-utils';
import type { Action } from '../actions';
import type { Gimmick, GimmickRadeau, Niveau, Vague } from '../definitions';
import type { EtatPartie, Tour } from '../etat';
import { centreCase } from '../grille';
import { appliquerAction, avancer, coutCompetence, creerPartie, deserialiser, rejouer, serialiser, step, valeurRevente } from '../partie';
import { casesDuTrajet, positionPlace, positionRadeau } from './radeau';

/**
 * Trajet d'essai : de la case (1, 4) à la case (14, 4) puis à la case (14, 7), soit des centres (3, 9) → (29, 9) → (29, 15),
 * 13 + 3 = 16 cases (32 tuiles). À 0,5 case par seconde, le bout est atteint en 32 s (960 pas) et le départ retrouvé en 1920 pas.
 */
const RADEAU: GimmickRadeau = {
  type: 'radeau',
  trajet: [{ cx: 1, cy: 4 }, { cx: 14, cy: 4 }, { cx: 14, cy: 7 }],
  vitesse: 0.5,
  places: [{ dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }],
};
const PAS_BOUT = 960;

/** Niveau d'essai du Radeau (aucune carte de la région 11 n'existe encore) : 32 × 18 tuiles, chemin 0 en y = 5. */
function niveauRadeau(vagues: readonly Vague[] = [VAGUE_LOINTAINE], gimmick: Gimmick | null = RADEAU, trajetInterdit = true): Niveau {
  const carte = { largeur: 32, hauteur: 18, chemins: [{ points: [{ x: 0, y: 5 }, { x: 30, y: 5 }] }], departHeros: { x: 28, y: 1 } };
  // Comme l'assemblage d'un niveau : les cases du trajet du radeau s'ajoutent aux cases interdites.
  const trajet = trajetInterdit && gimmick?.type === 'radeau' ? casesDuTrajet(gimmick) : [];
  return { id: 'essai-radeau', aretesDepart: 5000, carte, casesInterdites: [...casesInterditesDuNiveau(carte, []), ...trajet], vagues, ...(gimmick ? { gimmick } : {}) };
}

function accepter(etat: EtatPartie, ...actions: Action[]): void {
  for (const a of actions) {
    const r = appliquerAction(etat, a);
    if (!r.ok) throw new Error(`Action refusée : ${r.raison}`);
  }
}

function refus(etat: EtatPartie, action: Action): string | null {
  const r = appliquerAction(etat, action);
  return r.ok ? null : r.raison;
}

function tourDeLaPlace(etat: EtatPartie, place: number): Tour {
  const t = etat.tours.find((tour) => tour.place === place);
  if (!t) throw new Error(`Aucune tour sur la place ${String(place)}`);
  return t;
}

describe('Radeau : position, fonction pure du pas', () => {
  it('part de la première case, atteint le bout du trajet, puis revient exactement au départ', () => {
    expect(positionRadeau(RADEAU, 0)).toEqual({ x: 3, y: 9 });
    expect(positionRadeau(RADEAU, 780)).toEqual({ x: 29, y: 9 });
    expect(positionRadeau(RADEAU, PAS_BOUT)).toEqual({ x: 29, y: 15 });
    expect(positionRadeau(RADEAU, 2 * PAS_BOUT)).toEqual({ x: 3, y: 9 });
    expect(positionRadeau(RADEAU, 3 * PAS_BOUT)).toEqual({ x: 29, y: 15 });
  });

  it('interpole le long du trajet, à l’aller comme au retour', () => {
    // 7,5 s = 3,75 cases = 7,5 tuiles : (10,5 ; 9) à l'aller, et au même endroit 7,5 s avant le retour au départ.
    expect(positionRadeau(RADEAU, 225)).toEqual({ x: 10.5, y: 9 });
    expect(positionRadeau(RADEAU, 2 * PAS_BOUT - 225)).toEqual({ x: 10.5, y: 9 });
    // Après le virage : 29 tuiles = 3 tuiles sur le second segment.
    expect(positionRadeau(RADEAU, 870)).toEqual({ x: 29, y: 12 });
  });

  it('chaque place suit le radeau avec son décalage', () => {
    expect(positionPlace(RADEAU, 0, 0)).toEqual({ x: 3, y: 8 });
    expect(positionPlace(RADEAU, 0, 1)).toEqual({ x: 2, y: 9 });
    expect(positionPlace(RADEAU, PAS_BOUT, 2)).toEqual({ x: 30, y: 15 });
  });

  it('un radeau mal formé est refusé à la création de la partie', () => {
    const avec = (g: Partial<GimmickRadeau>): Niveau => niveauRadeau([VAGUE_LOINTAINE], { ...RADEAU, ...g });
    expect(() => creerPartie(avec({ trajet: [{ cx: 1, cy: 4 }] }), CONFIG)).toThrow(/Radeau/);
    expect(() => creerPartie(avec({ trajet: [{ cx: 1, cy: 4 }, { cx: 16, cy: 4 }] }), CONFIG)).toThrow(/hors de la grille/);
    expect(() => creerPartie(avec({ trajet: [{ cx: 1, cy: 4 }, { cx: 3, cy: 6 }] }), CONFIG)).toThrow(/ligne droite/);
    expect(() => creerPartie(avec({ trajet: [{ cx: 1, cy: 4 }, { cx: 1, cy: 4 }] }), CONFIG)).toThrow(/ligne droite/);
    expect(() => creerPartie(avec({ places: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }] }), CONFIG)).toThrow(/places/);
    expect(() => creerPartie(avec({ vitesse: -1 }), CONFIG)).toThrow(/vitesse/);
    // Deux cases voisines en diagonale font un trajet valide.
    expect(() => creerPartie(avec({ trajet: [{ cx: 1, cy: 4 }, { cx: 2, cy: 5 }] }), CONFIG)).not.toThrow();
  });

  it('refuse deux places au même décalage', () => {
    const places = [{ dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 }];
    expect(() => creerPartie(niveauRadeau([VAGUE_LOINTAINE], { ...RADEAU, places }), CONFIG)).toThrow(/même décalage/);
  });

  it('refuse un trajet dont une case, intermédiaire comprise, n’est pas interdite à la construction', () => {
    expect(() => creerPartie(niveauRadeau([VAGUE_LOINTAINE], RADEAU, false), CONFIG)).toThrow(/interdite/);
    // Seule la case intermédiaire (7, 4), entre (1, 4) et (14, 4), manque.
    const base = niveauRadeau();
    const sans = base.casesInterdites.filter((c) => !(c.cx === 7 && c.cy === 4));
    expect(sans).toHaveLength(base.casesInterdites.length - 1);
    expect(() => creerPartie({ ...base, casesInterdites: sans }, CONFIG)).toThrow(/\(7, 4\)/);
    expect(() => creerPartie(base, CONFIG)).not.toThrow();
  });

  it('une tour ne se pose pas sur le trajet du radeau', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    expect(refus(etat, { type: 'construire', cx: 7, cy: 4, tour: 'tir' })).toBe('case_interdite');
    expect(refus(etat, { type: 'construire', cx: 14, cy: 6, tour: 'tir' })).toBe('case_interdite');
  });

  it('casesDuTrajet liste les cases du trajet et les intermédiaires, une fois chacune, dans l’ordre', () => {
    const cases = casesDuTrajet(RADEAU);
    expect(cases).toHaveLength(17);
    expect(cases[0]).toEqual({ cx: 1, cy: 4 });
    expect(cases[6]).toEqual({ cx: 7, cy: 4 });
    expect(cases[16]).toEqual({ cx: 14, cy: 7 });
    const diagonale = casesDuTrajet({ ...RADEAU, trajet: [{ cx: 1, cy: 1 }, { cx: 4, cy: 4 }, { cx: 1, cy: 1 }] });
    expect(diagonale).toEqual([{ cx: 1, cy: 1 }, { cx: 2, cy: 2 }, { cx: 3, cy: 3 }, { cx: 4, cy: 4 }]);
  });
});

describe('Radeau : construire sur une place', () => {
  it('construire, améliorer, spécialiser puis vendre une tour sur une place, comme sur une case', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    const aretes = etat.aretes;
    accepter(etat, { type: 'construire', place: 0, tour: 'tir' });
    const t = tourDeLaPlace(etat, 0);
    expect(t.famille).toBe('tir');
    expect({ x: t.x, y: t.y }).toEqual(positionPlace(RADEAU, 0, 0));
    accepter(etat, { type: 'ameliorer', place: 0 }, { type: 'ameliorer', place: 0 }, { type: 'specialiser', place: 0, voie: 'A' });
    expect(t.niveau).toBe(4);
    const depense = aretes - etat.aretes;
    accepter(etat, { type: 'vendre', place: 0 });
    expect(etat.tours).toEqual([]);
    expect(etat.aretes).toBeGreaterThan(aretes - depense);
    expect(etat.journal.map((e) => e.action)).toContainEqual({ type: 'vendre', place: 0 });
  });

  it('la tour suit sa place à chaque pas', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    accepter(etat, { type: 'construire', place: 2, tour: 'magie' });
    evenementsPendant(etat, 10);
    const t = tourDeLaPlace(etat, 2);
    // La position est celle du dernier pas simulé (etat.pas a déjà avancé d'un cran).
    expect({ x: t.x, y: t.y }).toEqual(positionPlace(RADEAU, etat.pas - 1, 2));
    expect(t.x).toBeCloseTo(3 + 1 + (2 * 0.5 * (etat.pas - 1)) / 30, 9);
  });

  it('une caserne est refusée sur le radeau, avec sa raison', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    expect(refus(etat, { type: 'construire', place: 1, tour: 'caserne' })).toBe('radeau_sol_requis');
    expect(etat.tours).toEqual([]);
  });

  it('une tour divine se pose sur le radeau, sauf celles qui posent quelque chose au sol', () => {
    // Charlie (onde de choc) : rien ne l'interdit.
    expect(refus(creerPartie(niveauRadeau(), CONFIG), { type: 'construire', place: 0, tour: 'divine' })).toBeNull();
    // Plume : son sanctuaire a des assassins, c'est une caserne.
    expect(refus(creerPartie(niveauRadeau(), configDe('plume')), { type: 'construire', place: 0, tour: 'divine' })).toBe('radeau_sol_requis');
    // Pollen : son atelier construit des tourelles et des pièges au sol.
    expect(refus(creerPartie(niveauRadeau(), configDe('pollen')), { type: 'construire', place: 0, tour: 'divine' })).toBe('radeau_sol_requis');
  });

  it('une place occupée, inexistante ou mal désignée est refusée', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    accepter(etat, { type: 'construire', place: 0, tour: 'tir' });
    expect(refus(etat, { type: 'construire', place: 0, tour: 'magie' })).toBe('case_occupee');
    expect(refus(etat, { type: 'construire', place: 3, tour: 'tir' })).toBe('place_inconnue');
    expect(refus(etat, { type: 'construire', place: -1, tour: 'tir' })).toBe('place_inconnue');
    expect(refus(etat, { type: 'ameliorer', place: 1 })).toBe('case_vide');
    expect(refus(etat, { type: 'construire', place: 0.5, tour: 'tir' })).toBe('action_invalide');
    expect(refus(etat, { type: 'construire', place: 1, cx: 2, cy: 2, tour: 'tir' } as unknown as Action)).toBe('action_invalide');
    // La tour du radeau ne se désigne pas par une case.
    expect(refus(etat, { type: 'vendre', cx: -1, cy: -1 })).toBe('case_vide');
    expect(refus(etat, { type: 'deplacerRalliement', place: 0, x: 3, y: 5 })).toBe('pas_une_caserne');
  });

  it('sans radeau, aucune place n’existe', () => {
    const etat = creerPartie(niveauRadeau([VAGUE_LOINTAINE], null), CONFIG);
    expect(refus(etat, { type: 'construire', place: 0, tour: 'tir' })).toBe('place_inconnue');
  });

  it('vendre, améliorer, spécialiser et acheter une compétence sur une place inexistante : place_inconnue, testée en premier', () => {
    const avecRadeau = creerPartie(niveauRadeau(), CONFIG);
    const sansRadeau = creerPartie(niveauRadeau([VAGUE_LOINTAINE], null), CONFIG);
    for (const etat of [avecRadeau, sansRadeau]) {
      for (const place of [3, -1]) {
        expect(refus(etat, { type: 'vendre', place })).toBe('place_inconnue');
        expect(refus(etat, { type: 'ameliorer', place })).toBe('place_inconnue');
        expect(refus(etat, { type: 'specialiser', place, voie: 'A' })).toBe('place_inconnue');
        expect(refus(etat, { type: 'ameliorerCompetence', place, competence: 'x' })).toBe('place_inconnue');
      }
    }
    // Une place qui existe mais est vide garde sa raison.
    expect(refus(avecRadeau, { type: 'vendre', place: 1 })).toBe('case_vide');
  });

  it('construire sur une place à un pas > 0 : la tour prend la position de la place à ce pas, et l’événement la porte', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    evenementsPendant(etat, 10);
    const pas = etat.pas;
    expect(pas).toBeGreaterThan(0);
    accepter(etat, { type: 'construire', place: 1, tour: 'magie' });
    const attendu = positionPlace(RADEAU, pas, 1);
    const t = tourDeLaPlace(etat, 1);
    expect({ x: t.x, y: t.y }).toEqual(attendu);
    expect(attendu).not.toEqual(positionPlace(RADEAU, 0, 1));
    expect(etat.evenements).toContainEqual({ type: 'construction', tour: t.id, cx: -1, cy: -1, place: 1, x: attendu.x, y: attendu.y, famille: 'magie' });
  });

  it('les événements d’une tour du radeau portent sa place et sa position, ceux d’une case sa case', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    evenementsPendant(etat, 3);
    accepter(etat, { type: 'construire', place: 2, tour: 'tir' });
    const t = tourDeLaPlace(etat, 2);
    accepter(etat, { type: 'ameliorer', place: 2 });
    expect(etat.evenements).toContainEqual({ type: 'amelioration', tour: t.id, cx: -1, cy: -1, place: 2, x: t.x, y: t.y, niveau: 2, voie: null });
    accepter(etat, { type: 'ameliorer', place: 2 }, { type: 'specialiser', place: 2, voie: 'A' });
    const id = t.stats.competences[0]?.id ?? '';
    accepter(etat, { type: 'ameliorerCompetence', place: 2, competence: id });
    expect(etat.evenements).toContainEqual({ type: 'competence_tour', tour: t.id, cx: -1, cy: -1, place: 2, x: t.x, y: t.y, competence: id, rang: 1 });
    accepter(etat, { type: 'vendre', place: 2 });
    expect(etat.evenements).toContainEqual({ type: 'vente', tour: t.id, cx: -1, cy: -1, place: 2, x: t.x, y: t.y, aretes: expect.any(Number) as number });
    accepter(etat, { type: 'construire', cx: 4, cy: 1, tour: 'tir' });
    const c = etat.tours[0];
    expect(etat.evenements).toContainEqual({ type: 'construction', tour: c?.id, cx: 4, cy: 1, place: -1, x: c?.x, y: c?.y, famille: 'tir' });
  });

  it('ameliorerCompetence sur une place : prix annoncé par coutCompetence({ place }), rang acheté, arêtes débitées', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    accepter(etat, { type: 'construire', place: 0, tour: 'tir' }, { type: 'ameliorer', place: 0 }, { type: 'ameliorer', place: 0 }, { type: 'specialiser', place: 0, voie: 'A' });
    const t = tourDeLaPlace(etat, 0);
    const id = t.stats.competences[0]?.id ?? '';
    const cout = coutCompetence(etat, { place: 0 }, id);
    expect(cout).toBeGreaterThan(0);
    const aretes = etat.aretes;
    const cumule = t.coutCumule;
    accepter(etat, { type: 'ameliorerCompetence', place: 0, competence: id });
    expect(t.rangs[0]).toBe(1);
    expect(etat.aretes).toBe(aretes - (cout ?? 0));
    expect(t.coutCumule).toBe(cumule + (cout ?? 0));
    expect(coutCompetence(etat, { place: 1 }, id)).toBeUndefined();
    expect(coutCompetence(etat, { place: 7 }, id)).toBeUndefined();
  });

  it('la revente d’une tour de place rend exactement partEntiere(coutCumule, tauxRevente), comme valeurRevente({ place })', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    accepter(etat, { type: 'construire', place: 0, tour: 'tir' }, { type: 'ameliorer', place: 0 }, { type: 'ameliorer', place: 0 });
    const t = tourDeLaPlace(etat, 0);
    const attendu = partEntiere(t.coutCumule, REGLES.tauxRevente);
    expect(attendu).toBeGreaterThan(0);
    expect(valeurRevente(etat, { place: 0 })).toBe(attendu);
    expect(valeurRevente(etat, { place: 1 })).toBe(0);
    const aretes = etat.aretes;
    accepter(etat, { type: 'vendre', place: 0 });
    expect(etat.aretes).toBe(aretes + attendu);
  });
});

describe('Radeau : tir depuis la position courante', () => {
  it('une tour du radeau touche un ennemi quand le radeau passe à portée, plus quand il s’est éloigné', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    const e = ennemiFixe(etat, 3);
    accepter(etat, { type: 'construire', place: 0, tour: 'tir' });
    const id = tourDeLaPlace(etat, 0).id;
    const tirs = (secondes: number): number => evenementsPendant(etat, secondes).filter((v) => v.type === 'tir' && v.tour === id).length;
    // Au départ, la place 0 est en (3, 8), à 3 tuiles de l'ennemi en (3, 5) : portée 3,5.
    expect(distance(3, 8, e.x, e.y)).toBeLessThan(3.5);
    expect(tirs(2)).toBeGreaterThan(0);
    // 30 s plus tard, le radeau a passé le virage, vers (29, 13) : bien trop loin.
    evenementsPendant(etat, 28);
    const t = tourDeLaPlace(etat, 0);
    expect(distance(t.x, t.y, e.x, e.y)).toBeGreaterThan(10);
    expect(tirs(2)).toBe(0);
  });
});

describe('Radeau : rejeu et reprise', () => {
  const VAGUES: readonly Vague[] = [{ paquets: [{ ennemi: 'paysan_affame', nombre: 6, intervalle: 1, chemin: 0, delai: 0 }] }];
  const ACTIONS: readonly Action[] = [
    { type: 'construire', place: 0, tour: 'tir' },
    { type: 'construire', place: 2, tour: 'artillerie' },
    { type: 'construire', cx: 4, cy: 1, tour: 'caserne' },
    { type: 'appelerVague' },
  ];

  function partieJouee(): EtatPartie {
    const etat = creerPartie(niveauRadeau(VAGUES), CONFIG);
    for (const r of avancer(etat, ACTIONS)) if (!r.ok) throw new Error(`Action refusée : ${r.raison}`);
    for (let i = 0; i < 150; i++) step(etat);
    accepter(etat, { type: 'ameliorer', place: 0 });
    for (let i = 0; i < 150; i++) step(etat);
    return etat;
  }

  it('rejouer la graine et le journal redonne le même état', () => {
    const joue = partieJouee();
    expect(joue.journal.length).toBe(ACTIONS.length + 1);
    expect(serialiser(rejouer(niveauRadeau(VAGUES), CONFIG, joue.journal, joue.pas))).toBe(serialiser(joue));
  });

  it('une sauvegarde en pleine partie, reprise, redonne le même état', () => {
    const joue = partieJouee();
    const repris = deserialiser(serialiser(joue));
    for (let i = 0; i < 300; i++) {
      step(joue);
      step(repris);
    }
    expect(serialiser(repris)).toBe(serialiser(joue));
    expect(tourDeLaPlace(repris, 0).x).not.toBe(3);
  });
});

describe('Radeau : non-régression', () => {
  it('sur un niveau sans radeau, une tour posée sur une case n’a pas de place et ne bouge pas', () => {
    for (const gimmick of [null, { type: 'corbeaux', couloirs: [{ cy: 1 }] } as const]) {
      const etat = creerPartie(niveauRadeau([VAGUE_LOINTAINE], gimmick), CONFIG);
      accepter(etat, { type: 'construire', cx: 4, cy: 3, tour: 'tir' });
      evenementsPendant(etat, 5);
      const t = etat.tours[0];
      expect(t?.place).toBe(-1);
      expect({ x: t?.x, y: t?.y }).toEqual(centreCase(4, 3));
    }
  });

  it('sur un niveau à radeau, une tour posée sur une case ne bouge pas non plus', () => {
    const etat = creerPartie(niveauRadeau(), CONFIG);
    accepter(etat, { type: 'construire', cx: 4, cy: 1, tour: 'tir' });
    evenementsPendant(etat, 5);
    expect({ x: etat.tours[0]?.x, y: etat.tours[0]?.y }).toEqual(centreCase(4, 1));
  });
});
