import { describe, expect, it } from 'vitest';
import { ENNEMIS } from '../../data/ennemis';
import { casesInterditesDuNiveau } from '../../data/niveaux/grille-niveau';
import { REGLES } from '../../data/regles';
import { CONFIG, compter, evenementsPendant } from '../aides.test-utils';
import type { Action } from '../actions';
import type { DefEnnemi, Gimmick, Niveau, Paquet, Vague } from '../definitions';
import { ajouterEnnemi } from '../ennemis';
import type { EntreeJournal, EtatPartie } from '../etat';
import { appliquerAction, avancer, creerPartie, deserialiser, rejouer, serialiser, step } from '../partie';
import { centreCase } from '../grille';

/** Couloirs du niveau d'essai : lignes 1, 4 et 7 de la grille (axes y = 3, 9 et 15). */
const CORBEAUX: Gimmick = { type: 'corbeaux', couloirs: [{ cy: 1 }, { cy: 4 }, { cy: 7 }] };
/** Case d'une caserne ou d'une tour au bord du couloir 2 : centre (17, 13), à 2 tuiles de l'axe y = 15. */
const CASE_BORD = { cx: 8, cy: 6 };
/** Une tour d'archers montée au niveau 3 au bord du couloir 2 : elle abat un corbeau pendant sa traversée. */
const ARCHERS: readonly Action[] = [{ type: 'construire', ...CASE_BORD, tour: 'tir' }, { type: 'ameliorer', ...CASE_BORD }, { type: 'ameliorer', ...CASE_BORD }];
const corbeau = (surcharges: Partial<Paquet> = {}): Paquet => ({ ennemi: 'corbeau_noir', nombre: 1, intervalle: 0, chemin: 0, couloir: 2, delai: 0, ...surcharges });

/**
 * Niveau d'essai des Corbeaux (aucune carte de la région 11 n'existe encore) : 32 × 18 tuiles, chemin 0 en y = 5, chemin 1 en
 * y = 15, sur la ligne du couloir 2 (une caserne voisine y pose ses soldats). Le héros attend en haut à droite, loin du couloir 2.
 */
function niveauCorbeaux(vagues: readonly Vague[], gimmick: Gimmick | null = CORBEAUX): Niveau {
  const carte = {
    largeur: 32,
    hauteur: 18,
    chemins: [{ points: [{ x: 0, y: 5 }, { x: 30, y: 5 }] }, { points: [{ x: 0, y: 15 }, { x: 30, y: 15 }] }],
    departHeros: { x: 28, y: 1 },
  };
  return { id: 'essai-corbeaux', aretesDepart: 5000, carte, casesInterdites: casesInterditesDuNiveau(carte, []), vagues, ...(gimmick ? { gimmick } : {}) };
}

const APPEL: Action = { type: 'appelerVague' };

/** Partie d'un corbeau dans le couloir 2, vague appelée tout de suite ; `avant` : actions du premier pas (construction…). */
function partieCorbeau(avant: readonly Action[] = [], paquet: Paquet = corbeau(), gimmick?: Gimmick): EtatPartie {
  const etat = creerPartie(niveauCorbeaux([{ paquets: [paquet] }], gimmick), CONFIG);
  for (const r of avancer(etat, [...avant, APPEL])) if (!r.ok) throw new Error(`Action refusée : ${r.raison}`);
  return etat;
}

function seul(etat: EtatPartie): EtatPartie['ennemis'][number] {
  const e = etat.ennemis[0];
  if (!e || etat.ennemis.length !== 1) throw new Error(`Un seul ennemi attendu, ${String(etat.ennemis.length)} présents`);
  return e;
}

describe('Vol de Corbeaux : traversée en couloir', () => {
  it('un volant du couloir 2 part du bord gauche, avance en ligne droite et sort à droite en retirant 1 cœur', () => {
    const etat = partieCorbeau();
    const e = seul(etat);
    const axe = centreCase(0, 7).y;
    expect(e.couloir).toBe(2);
    expect(e.x).toBeLessThan(0.2);
    expect(Math.abs(e.y - axe)).toBeLessThanOrEqual(REGLES.decalageLateralMax);
    const y = e.y;
    const vies = etat.vies;
    let x = e.x;
    const vus = [];
    while (etat.ennemis.length > 0) {
      step(etat);
      vus.push(...etat.evenements);
      if (!e.vivant) break;
      expect(e.y).toBe(y);
      expect(e.x).toBeGreaterThan(x);
      x = e.x;
    }
    expect(x).toBeGreaterThan(31);
    expect(vus.filter((v) => v.type === 'fuite')).toEqual([{ type: 'fuite', ennemi: e.id, vies: 1 }]);
    expect(etat.vies).toBe(vies - 1);
    expect(etat.viePerdue).toBe(true);
  });

  it('chaque volant sorti coûte 1 cœur, élite comprise, ou ce que dit le gimmick', () => {
    const elite = partieCorbeau([], corbeau({ elite: true }));
    const viesElite = elite.vies;
    evenementsPendant(elite, 30);
    expect(elite.vies).toBe(viesElite - 1);
    const cher = partieCorbeau([], corbeau(), { ...CORBEAUX, coutVies: 3 });
    const viesCher = cher.vies;
    evenementsPendant(cher, 30);
    expect(cher.vies).toBe(viesCher - 3);
  });

  it('il n’est pas retenu par les soldats d’une caserne postés sur sa ligne', () => {
    const etat = partieCorbeau([{ type: 'construire', ...CASE_BORD, tour: 'caserne' }]);
    const e = seul(etat);
    // Les soldats se postent sur le chemin 1, c'est-à-dire sur la ligne du couloir.
    evenementsPendant(etat, 3);
    const soldats = etat.unites.filter((u) => u.genre === 'soldat');
    expect(soldats.length).toBeGreaterThan(0);
    for (const s of soldats) expect(Math.abs(s.ancreY - 15)).toBeLessThan(1);
    const vies = etat.vies;
    let passeDevant = false;
    while (e.vivant) {
      step(etat);
      expect(e.bloqueur).toBe(-1);
      if (soldats.some((s) => Math.abs(s.x - e.x) < 0.5)) passeDevant = true;
    }
    expect(passeDevant).toBe(true);
    expect(etat.vies).toBe(vies - 1);
  });

  it('une tour qui ne vise pas les volants l’ignore', () => {
    const etat = partieCorbeau([{ type: 'construire', ...CASE_BORD, tour: 'artillerie' }]);
    const e = seul(etat);
    const pv = e.pv;
    const vus = evenementsPendant(etat, 30);
    expect(compter(vus, 'mort')).toBe(0);
    expect(compter(vus, 'fuite')).toBe(1);
    expect(e.pv).toBe(pv);
  });

  it('une tour qui vise les volants le tue et verse sa prime', () => {
    const etat = partieCorbeau(ARCHERS);
    const e = seul(etat);
    const aretes = etat.aretes;
    const vies = etat.vies;
    const vus = evenementsPendant(etat, 30);
    expect(vus.filter((v) => v.type === 'mort')).toEqual([{ type: 'mort', ennemi: e.id, typeEnnemi: 'corbeau_noir', x: e.x, y: e.y, prime: e.prime }]);
    expect(e.prime).toBeGreaterThan(0);
    expect(etat.aretes).toBe(aretes + e.prime);
    expect(etat.vies).toBe(vies);
    // Un volant tombé dans un couloir n'est pas gardé pour être relevé sur un chemin.
    expect(etat.morts).toEqual([]);
  });
});

describe('Vol de Corbeaux : déterminisme', () => {
  const vagues: Vague[] = [{ paquets: [corbeau({ nombre: 6, intervalle: 0.7 }), corbeau({ nombre: 4, intervalle: 1, couloir: 0, delai: 2 }), { ennemi: 'paysan_affame', nombre: 3, intervalle: 1, chemin: 1, delai: 0 }] }];
  const journal: EntreeJournal[] = [
    { pas: 0, action: { type: 'construire', ...CASE_BORD, tour: 'tir' } },
    { pas: 0, action: APPEL },
    { pas: 40, action: { type: 'construire', cx: 3, cy: 2, tour: 'magie' } },
  ];

  function jouer(pas: number): EtatPartie {
    const etat = creerPartie(niveauCorbeaux(vagues), CONFIG);
    let i = 0;
    while (etat.pas < pas) {
      const lot: Action[] = [];
      for (let entree = journal[i]; entree && entree.pas <= etat.pas; entree = journal[++i]) lot.push(entree.action);
      avancer(etat, lot);
    }
    return etat;
  }

  it('rejouer la graine et le journal redonne le même état', () => {
    const joue = jouer(300);
    expect(joue.ennemis.some((e) => e.couloir >= 0)).toBe(true);
    expect(serialiser(rejouer(niveauCorbeaux(vagues), CONFIG, joue.journal, 300))).toBe(serialiser(joue));
  });

  it('une sauvegarde en pleine traversée, puis la reprise, redonnent le même état', () => {
    const joue = jouer(150);
    expect(joue.ennemis.filter((e) => e.couloir >= 0 && e.x > 1).length).toBeGreaterThan(0);
    const repris = deserialiser(serialiser(joue));
    for (let k = 0; k < 400; k++) {
      step(joue);
      step(repris);
    }
    expect(serialiser(repris)).toBe(serialiser(joue));
  });
});

describe('Vol de Corbeaux : validation du niveau', () => {
  const refus = (vagues: readonly Vague[], gimmick: Gimmick | null = CORBEAUX): (() => EtatPartie) => () => creerPartie(niveauCorbeaux(vagues, gimmick), CONFIG);

  it('refuse un non-volant dans un couloir', () => {
    expect(refus([{ paquets: [corbeau({ ennemi: 'paysan_affame' })] }])).toThrow(/vol/);
  });

  it('refuse un couloir inexistant ou mal formé', () => {
    expect(refus([{ paquets: [corbeau({ couloir: 3 })] }])).toThrow(/couloir/i);
    expect(refus([{ paquets: [corbeau({ couloir: -1 })] }])).toThrow(/couloir/i);
    expect(refus([{ paquets: [corbeau({ couloir: 0.5 })] }])).toThrow(/couloir/i);
  });

  it('refuse un couloir sans gimmick Corbeaux sur le niveau', () => {
    expect(refus([{ paquets: [corbeau()] }], null)).toThrow(/couloir/i);
  });

  it('refuse un couloir hors de la grille', () => {
    expect(refus([{ paquets: [corbeau({ couloir: 0 })] }], { type: 'corbeaux', couloirs: [{ cy: 9 }] })).toThrow(/couloir/i);
    expect(refus([{ paquets: [corbeau({ couloir: 0 })] }], { type: 'corbeaux', couloirs: [{ cy: -1 }] })).toThrow(/couloir/i);
    expect(refus([{ paquets: [corbeau({ couloir: 0 })] }], { type: 'corbeaux', couloirs: [{ cy: 1.5 }] })).toThrow(/couloir/i);
  });

  it('le moteur refuse aussi de poser un non-volant dans un couloir', () => {
    const etat = partieCorbeau();
    expect(() => ajouterEnnemi(etat, ENNEMIS.paysan_affame, 'paysan_affame', 0, 0, false, { couloir: 1 })).toThrow(/vol/);
  });
});

describe('Vol de Corbeaux : pouvoirs qui supposent un chemin', () => {
  /** Un ennemi des données rendu volant, posé au bord gauche du couloir 2. */
  function volantEnCouloir(etat: EtatPartie, id: keyof typeof ENNEMIS, surcharges: Partial<DefEnnemi> = {}): EtatPartie['ennemis'][number] {
    return ajouterEnnemi(etat, { ...(ENNEMIS[id] as DefEnnemi), volant: true, ...surcharges }, id, 0, 0, false, { couloir: 2 });
  }

  it('le Crapaud Gonflé volant traverse son couloir sans bondir', () => {
    const etat = partieCorbeau([{ type: 'construire', ...CASE_BORD, tour: 'caserne' }]);
    const crapaud = volantEnCouloir(etat, 'crapaud_gonfle', { vitesse: 2 });
    const vus = evenementsPendant(etat, 25);
    expect(compter(vus, 'bond')).toBe(0);
    expect(crapaud.vivant).toBe(false);
    expect(vus.some((v) => v.type === 'fuite' && v.ennemi === crapaud.id)).toBe(true);
  });

  it('le Déterreur volant ne plonge pas dans un couloir', () => {
    const etat = partieCorbeau();
    const deterreur = volantEnCouloir(etat, 'deterreur', { vitesse: 1 });
    const vus = evenementsPendant(etat, 40);
    expect(compter(vus, 'plongee')).toBe(0);
    expect(compter(vus, 'emergence')).toBe(0);
    expect(vus.some((v) => v.type === 'fuite' && v.ennemi === deterreur.id)).toBe(true);
  });

  it('un volant en couloir n’appelle personne et ne se divise pas à sa mort', () => {
    const etat = partieCorbeau(ARCHERS);
    const appeleur = volantEnCouloir(etat, 'paysan_affame', {
      pv: 1,
      pouvoirs: { periodiques: [{ cadence: 0.5, actions: [{ type: 'invoquer', ennemi: 'paysan_affame', nombre: 2, ecart: 1 }] }], division: { ennemi: 'paysan_affame', nombre: 2, ecart: 0.5 } },
    });
    const vus = evenementsPendant(etat, 20);
    expect(compter(vus, 'appel')).toBe(0);
    expect(compter(vus, 'division')).toBe(0);
    expect(appeleur.vivant).toBe(false);
    expect(etat.ennemis.filter((e) => e.vivant && e.type === 'paysan_affame')).toEqual([]);
  });
});

describe('niveau sans gimmick', () => {
  it('ses ennemis suivent leur chemin, sans couloir', () => {
    const etat = creerPartie(niveauCorbeaux([{ paquets: [{ ennemi: 'corbeau_noir', nombre: 1, intervalle: 0, chemin: 0, delai: 0 }] }], null), CONFIG);
    appliquerAction(etat, APPEL);
    step(etat);
    expect(etat.couloirs).toEqual([]);
    expect(seul(etat).couloir).toBe(-1);
    expect(seul(etat).y).toBeCloseTo(5, 0);
  });
});
