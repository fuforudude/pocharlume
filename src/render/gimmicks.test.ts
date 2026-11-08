// Rendu des gimmicks : le radeau est dessiné au même instant que les tours interpolées par le suivi (elles restent sur leurs
// places), une tour du radeau suit sa place d'un pas à l'autre, ses effets (fumée, anneau) partent de sa position, et un corbeau
// qui sort de son couloir lance sa gerbe de plumes.
import { describe, expect, it } from 'vitest';
import { casesInterditesDuNiveau } from '../data/niveaux/grille-niveau';
import { VERSION_DONNEES } from '../data/version';
import { avancer, casesDuTrajet, creerPartie, positionPlace, positionRadeau } from '../engine';
import type { ConfigPartie, EtatPartie } from '../engine';
import type { GimmickRadeau, Niveau, Vague } from '../engine/definitions';
import type { AtlasRendu, SpriteAtlas } from './atlas';
import { PoolEffets, TYPE_EFFET } from './effets';
import { abscissesPlumes, centreRadeauAffiche, pasAffiche, placeAffichee } from './gimmicks';
import { Suivi } from './suivi';

const SPRITE = { ancre: { x: 0, y: 0 }, largeur: 16, hauteur: 16 } as unknown as SpriteAtlas;
const NOMS: string[] = [];
const ATLAS = { sprite: (nom: string) => { NOMS.push(nom); return SPRITE; }, animation: () => undefined } as unknown as AtlasRendu;
const CONFIG: ConfigPartie = { graine: 3, difficulte: 'matou', dieu: 'charlie', heros: 'charlie', niveauHeros: 1, competencesHeros: {}, ameliorations: {}, objets: [], versionDonnees: VERSION_DONNEES };
const RADEAU: GimmickRadeau = { type: 'radeau', trajet: [{ cx: 2, cy: 4 }, { cx: 10, cy: 4 }], vitesse: 0.5, places: [{ dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }] };
const VAGUE_LOINTAINE: Vague = { paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 1, chemin: 0, delai: 60 }] };

function niveau(vagues: readonly Vague[] = [VAGUE_LOINTAINE], gimmick: Niveau['gimmick'] | null = RADEAU): Niveau {
  const carte = { largeur: 32, hauteur: 18, chemins: [{ points: [{ x: 0, y: 1 }, { x: 31, y: 1 }] }], departHeros: { x: 28, y: 3 } };
  const trajet = gimmick?.type === 'radeau' ? casesDuTrajet(gimmick) : [];
  return { id: 'essai', aretesDepart: 5000, carte, casesInterdites: [...casesInterditesDuNiveau(carte, []), ...trajet], vagues, ...(gimmick ? { gimmick } : {}) };
}

function partieRadeau(): EtatPartie {
  return creerPartie(niveau(), CONFIG);
}

describe('pas affiché', () => {
  it('est celui des positions interpolées : deux pas derrière etat.pas, plus la fraction, jamais négatif', () => {
    expect(pasAffiche(10, 0)).toBe(8);
    expect(pasAffiche(10, 0.5)).toBe(8.5);
    expect(pasAffiche(0, 0.3)).toBe(0);
    expect(pasAffiche(1, 0.5)).toBe(0);
  });

  it('le radeau et ses places au pas affiché ; rien sans radeau', () => {
    const etat = partieRadeau();
    for (let i = 0; i < 40; i++) avancer(etat, []);
    expect(centreRadeauAffiche(etat, 0.25)).toEqual(positionRadeau(RADEAU, etat.pas - 2 + 0.25));
    expect(placeAffichee(etat, 0.25, 2)).toEqual(positionPlace(RADEAU, etat.pas - 2 + 0.25, 2));
    expect(placeAffichee(etat, 0.25, 3)).toBeNull();
    const sans = creerPartie(niveau([VAGUE_LOINTAINE], null), CONFIG);
    expect(centreRadeauAffiche(sans, 0)).toBeNull();
    expect(placeAffichee(sans, 0, 0)).toBeNull();
  });
});

describe('tours du radeau dans le suivi', () => {
  it('une tour suit sa place : son visuel interpolé tombe sur la place au pas affiché, image après image', () => {
    const suivi = new Suivi(ATLAS, new PoolEffets(16));
    const etat = partieRadeau();
    avancer(etat, [{ type: 'construire', place: 2, tour: 'tir' }]);
    suivi.apresPas(etat, 0);
    for (let i = 0; i < 30; i++) {
      avancer(etat, []);
      suivi.apresPas(etat, i * 33);
    }
    const tour = etat.tours[0];
    const v = tour ? suivi.tours.get(tour.id) : undefined;
    if (!v) throw new Error('tour absente');
    for (const alpha of [0, 0.4, 0.9]) {
      const x = v.xPrec + (v.x - v.xPrec) * alpha;
      const y = v.yPrec + (v.y - v.yPrec) * alpha;
      const place = placeAffichee(etat, alpha, 2);
      expect(x).toBeCloseTo(place?.x ?? Number.NaN, 9);
      expect(y).toBeCloseTo(place?.y ?? Number.NaN, 9);
    }
    // Le radeau avance vraiment (0,5 case par seconde) : la tour n'est plus là où elle a été construite.
    expect(v.x).not.toBeCloseTo(positionPlace(RADEAU, 0, 2).x, 3);
  });

  it('fumée de construction et de vente à la position de la place, anneau d’amélioration qui suit la tour', () => {
    const effets = new PoolEffets(32);
    const suivi = new Suivi(ATLAS, effets);
    suivi.animationsReduites = () => false;
    const etat = partieRadeau();
    for (let i = 0; i < 20; i++) avancer(etat, []);
    avancer(etat, [{ type: 'construire', place: 1, tour: 'tir' }]);
    const construite = etat.evenements.find((e) => e.type === 'construction');
    suivi.apresPas(etat, 0);
    const fumee = effets.liste.find((e) => e.actif && e.type === TYPE_EFFET.sprite);
    if (construite?.type !== 'construction') throw new Error('construction absente');
    expect(fumee?.x).toBe(Math.round(construite.x * 16));
    for (const e of effets.liste) e.actif = false;

    avancer(etat, [{ type: 'ameliorer', place: 1 }]);
    suivi.apresPas(etat, 100);
    const tourId = etat.tours[0]?.id;
    const anneau = effets.liste.find((e) => e.actif && e.type === TYPE_EFFET.anneau);
    const poussiere = effets.liste.find((e) => e.actif && e.type === TYPE_EFFET.poussiere);
    expect(anneau?.suitTour).toBe(tourId);
    expect(poussiere?.suitTour).toBe(tourId);
    for (const e of effets.liste) e.actif = false;

    for (let i = 0; i < 15; i++) avancer(etat, []);
    avancer(etat, [{ type: 'vendre', place: 1 }]);
    const vente = etat.evenements.find((e) => e.type === 'vente');
    suivi.apresPas(etat, 200);
    if (vente?.type !== 'vente') throw new Error('vente absente');
    expect(vente.cx).toBe(-1);
    const fumeeVente = effets.liste.find((e) => e.actif && e.type === TYPE_EFFET.sprite);
    expect(fumeeVente?.x).toBe(Math.round(vente.x * 16));
  });

  it('une tour posée sur une case garde des effets fixes (aucune tour suivie)', () => {
    const effets = new PoolEffets(32);
    const suivi = new Suivi(ATLAS, effets);
    suivi.animationsReduites = () => false;
    const etat = partieRadeau();
    avancer(etat, [{ type: 'construire', cx: 4, cy: 7, tour: 'tir' }]);
    suivi.apresPas(etat, 0);
    avancer(etat, [{ type: 'ameliorer', cx: 4, cy: 7 }]);
    suivi.apresPas(etat, 100);
    expect(effets.liste.filter((e) => e.actif && e.type === TYPE_EFFET.anneau).map((e) => e.suitTour)).toEqual([-1]);
  });
});

describe('corbeau qui sort de son couloir', () => {
  it('lance une gerbe de plumes ; un ennemi du chemin qui fuit n’en lance pas', () => {
    const corbeaux: Niveau['gimmick'] = { type: 'corbeaux', couloirs: [{ cy: 6 }] };
    const vagues: Vague[] = [{ paquets: [{ ennemi: 'corbeau_noir', nombre: 1, intervalle: 0, chemin: 0, couloir: 0, delai: 0 }, { ennemi: 'paysan_affame', nombre: 1, intervalle: 0, chemin: 0, delai: 0 }] }];
    const etat = creerPartie({ ...niveau(vagues, corbeaux), aretesDepart: 0 }, CONFIG);
    const effets = new PoolEffets(64);
    const suivi = new Suivi(ATLAS, effets);
    avancer(etat, [{ type: 'appelerVague' }]);
    suivi.apresPas(etat, 0);
    NOMS.length = 0;
    let fuites = 0;
    for (let i = 0; i < 2000 && etat.statut === 'en_cours' && fuites < 2; i++) {
      avancer(etat, []);
      fuites += etat.evenements.filter((e) => e.type === 'fuite').length;
      suivi.apresPas(etat, i * 33);
    }
    expect(fuites).toBe(2);
    expect(NOMS.filter((n) => n === 'effet-plumes')).toHaveLength(1);
  });
});

describe('plumes des couloirs', () => {
  it('un chevron toutes les 3 tuiles, à l’intérieur de la carte, décalé par le défilement', () => {
    const xs = abscissesPlumes(512, 0);
    expect(xs[0]).toBe(24);
    expect(xs.every((x, i) => i === 0 || x - (xs[i - 1] ?? 0) === 48)).toBe(true);
    expect(xs.every((x) => x > 8 && x < 504)).toBe(true);
    expect(abscissesPlumes(512, 10)[0]).toBe(34);
    expect(abscissesPlumes(512, 48)).toEqual(xs);
  });
});
