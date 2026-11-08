// Les bots et les gimmicks de l'après-histoire (spec du 2026-11-08, décision technique 4) : le bot soigneux couvre les couloirs du
// Vol de Corbeaux avec des tours qui visent les volants, poste un héros tireur au croisement du chemin et du couloir, et construit,
// améliore et spécialise sur les places du radeau ; aucun bot ne compte un ennemi de couloir sur le chemin 0.
import { describe, expect, it } from 'vitest';
import { casesInterditesDuNiveau } from '../data/niveaux/grille-niveau';
import { TOURS } from '../data/tours';
import { avancer, centreCase, creerPartie, toutesLesCases, validerAction } from '../engine';
import type { Action, GimmickCorbeaux, GimmickRadeau, Niveau, Vague } from '../engine';
import { creerBotNaif } from './bot-naif';
import { creerBotSoigneux } from './bot-soigneux';
import { partsSpeciales, poidsDesChemins } from './geometrie';
import { configPartie, jouerPartie, type Bot } from './simulation';

const EQUILIBREE = { nom: 'équilibrée', poids: { caserne: 1, tir: 1, magie: 1, artillerie: 1 }, diversite: 0.4 };

/** Un chemin qui descend en x = 17 de y = 1 à y = 17 : un couloir à la ligne 6 (y = 13) le croise en (17, 13). */
const CARTE_COULOIRS = { largeur: 32, hauteur: 18, chemins: [{ points: [{ x: 17, y: 0 }, { x: 17, y: 18 }] }], departHeros: { x: 20, y: 2 } };
const CORBEAUX: GimmickCorbeaux = { type: 'corbeaux', couloirs: [{ cy: 6 }] };

function niveauCouloirs(vagues: readonly Vague[]): Niveau {
  return { id: 'essai-couloirs', aretesDepart: 900, carte: CARTE_COULOIRS, casesInterdites: casesInterditesDuNiveau(CARTE_COULOIRS, []), vagues, gimmick: CORBEAUX };
}

/** Des corbeaux dans le couloir, et quelques paysans sur le chemin. */
function vaguesCouloir(fois = 6): Vague[] {
  return Array.from({ length: fois }, () => ({
    paquets: [
      { ennemi: 'corbeau_noir', nombre: 10, intervalle: 0.7, chemin: 0, couloir: 0, delai: 0 },
      { ennemi: 'paysan_affame', nombre: 3, intervalle: 1, chemin: 0, delai: 2 },
    ],
  }));
}

/** Radeau le long du chemin (y = 5) : de la case (1, 3) à la case (14, 3), centres (3, 7) → (29, 7). */
const RADEAU: GimmickRadeau = { type: 'radeau', trajet: [{ cx: 1, cy: 3 }, { cx: 14, cy: 3 }], vitesse: 0.5, places: [{ dx: -2, dy: 0 }, { dx: 0, dy: 0 }, { dx: 2, dy: 0 }] };
const CARTE_RADEAU = { largeur: 32, hauteur: 18, chemins: [{ points: [{ x: 0, y: 5 }, { x: 32, y: 5 }] }], departHeros: { x: 28, y: 1 } };

/**
 * Niveau dont aucune case utile n'est constructible : il ne reste que les places du radeau, et la dernière ligne de la grille
 * (y = 17), trop loin du chemin pour qu'une tour y voie quoi que ce soit.
 */
function niveauRadeau(vagues: readonly Vague[], ligneLibre = true): Niveau {
  const interdites = toutesLesCases(CARTE_RADEAU).filter((c) => !ligneLibre || c.cy !== 8);
  return { id: 'essai-radeau', aretesDepart: 1500, carte: CARTE_RADEAU, casesInterdites: interdites, vagues, gimmick: RADEAU };
}

function vaguesSol(fois = 6): Vague[] {
  return Array.from({ length: fois }, () => ({ paquets: [{ ennemi: 'paysan_affame', nombre: 10, intervalle: 0.8, chemin: 0, delai: 0 }] }));
}

/** Joue la partie avec le bot et rend les actions acceptées, avec celles qu'il a proposées et que le moteur a refusées. */
function partie(niveau: Niveau, bot: Bot, dieu: string, secondes = 600, avant: readonly Action[] = []): { jouees: Action[]; refusees: string[] } {
  const etat = creerPartie(niveau, configPartie({ graine: 3, difficulte: 'chaton', dieu }));
  avancer(etat, avant);
  const refusees: string[] = [];
  while (etat.statut === 'en_cours' && etat.pas < secondes * 30) {
    const actions = etat.pas % 15 === 0 ? bot.decider(etat) : [];
    for (const a of actions) {
      const raison = validerAction(etat, a);
      if (raison) refusees.push(`${a.type} : ${raison}`);
    }
    avancer(etat, actions);
  }
  return { jouees: etat.journal.map((e) => e.action), refusees };
}

describe('géométrie des couloirs', () => {
  it('un groupe de couloir pèse sur son couloir (indice N + k), jamais sur le chemin 0', () => {
    const poids = poidsDesChemins(niveauCouloirs(vaguesCouloir()));
    expect(poids).toHaveLength(2);
    expect(poids[1]).toBeGreaterThan(0.5);
    expect((poids[0] ?? 0) + (poids[1] ?? 0)).toBeCloseTo(1, 9);
  });

  it('les volants des couloirs ne comptent pas dans la part de volants des chemins', () => {
    expect(partsSpeciales(niveauCouloirs(vaguesCouloir())).volants).toBe(0);
  });
});

describe('bot soigneux et Vol de Corbeaux', () => {
  it.each(['charlie', 'plume', 'pollen'])('%s : il pose des tours qui visent les volants à portée du couloir', (dieu) => {
    const { jouees, refusees } = partie(niveauCouloirs(vaguesCouloir()), creerBotSoigneux({ variante: EQUILIBREE }), dieu, 300);
    expect(refusees).toEqual([]);
    const yCouloir = centreCase(0, 6).y;
    const aPortee = jouees.filter((a) => a.type === 'construire' && a.tour !== 'divine' && a.cx !== undefined && TOURS[a.tour].niveaux[0].volants
      && Math.abs(centreCase(a.cx, a.cy).y - yCouloir) <= TOURS[a.tour].niveaux[0].portee);
    expect(aPortee.length, dieu).toBeGreaterThan(0);
  });

  it('le héros tireur (Pollen) se poste au croisement du chemin et du couloir', () => {
    const { jouees } = partie(niveauCouloirs(vaguesCouloir()), creerBotSoigneux({ variante: EQUILIBREE }), 'pollen', 300);
    const ordres = jouees.flatMap((a) => (a.type === 'deplacerHeros' ? [a] : []));
    expect(ordres.some((o) => Math.abs(o.x - 17) < 0.5 && Math.abs(o.y - centreCase(0, 6).y) < 0.5)).toBe(true);
  });
});

describe('bots et Radeau', () => {
  it.each(['charlie', 'plume', 'pollen'])('%s : le soigneux construit, améliore et spécialise sur les places, sans tour qui pose au sol', (dieu) => {
    const { jouees, refusees } = partie(niveauRadeau(vaguesSol()), creerBotSoigneux({ variante: EQUILIBREE }), dieu);
    expect(refusees).toEqual([]);
    const construites = jouees.flatMap((a) => (a.type === 'construire' && a.tour !== 'divine' ? [a] : []));
    expect(construites.length).toBeGreaterThanOrEqual(3);
    for (const c of construites) {
      expect(c.place, dieu).toBeDefined();
      expect(c.tour).not.toBe('caserne');
    }
    // Le niveau 3 et la spécialisation se font par la place, jamais par une case (cx = -1).
    const ameliorations = jouees.filter((a) => a.type === 'ameliorer' || a.type === 'specialiser');
    expect(ameliorations.length).toBeGreaterThan(0);
    for (const a of ameliorations) expect('place' in a && a.place !== undefined).toBe(true);
  });

  it('la tour divine de Charlie va sur le radeau, celles de Plume et de Pollen jamais', () => {
    // Trois tours déjà posées loin du chemin : la tour divine est permise, et seul le radeau voit le chemin.
    const avant: Action[] = [0, 2, 4].map((cx) => ({ type: 'construire', cx, cy: 8, tour: 'tir' }));
    const divine = (dieu: string): boolean =>
      partie(niveauRadeau(vaguesSol()), creerBotSoigneux({ variante: EQUILIBREE }), dieu, 600, avant).jouees.some((a) => a.type === 'construire' && a.tour === 'divine' && a.place !== undefined);
    expect(divine('charlie')).toBe(true);
    expect(divine('plume')).toBe(false);
    expect(divine('pollen')).toBe(false);
  });

  it('jouerPartie compte les spécialisations d’une tour du radeau dans les choix', () => {
    const r = jouerPartie(niveauRadeau(vaguesSol()), creerBotSoigneux({ variante: EQUILIBREE }), { graine: 3, difficulte: 'chaton', dieu: 'charlie' });
    expect(r.choix.some((c) => c.voie !== undefined)).toBe(true);
  });

  it('le naïf améliore une tour du radeau par sa place', () => {
    // Le naïf ne bâtit que sur des cases (ici, aucune) : on lui donne une tour sur le radeau et on regarde ce qu'il en fait.
    const niveau = niveauRadeau(vaguesSol(), false);
    const etat = creerPartie(niveau, configPartie({ graine: 3, difficulte: 'chaton', dieu: 'charlie' }));
    avancer(etat, [{ type: 'construire', place: 0, tour: 'tir' }]);
    const bot = creerBotNaif({ graine: 1 });
    const proposees: Action[] = [];
    while (etat.statut === 'en_cours' && etat.pas < 120 * 30) {
      const actions = etat.pas % 15 === 0 ? bot.decider(etat) : [];
      proposees.push(...actions);
      avancer(etat, actions);
    }
    expect(proposees.some((a) => a.type === 'ameliorer' && a.place === 0)).toBe(true);
  });
});
