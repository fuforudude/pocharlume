// Outils réservés aux tests du moteur (suffixe .test-utils.ts : jamais importé par le jeu, donc absent du
// build) : configuration type, cartes d'essai, avance rapide.
import { ENNEMIS, type IdEnnemi } from '../data/ennemis';
import { casesInterditesDuNiveau } from '../data/niveaux/grille-niveau';
import { VERSION_DONNEES } from '../data/version';
import type { CaseGrille, DefEnnemi, IdFamille, Niveau, Vague, Voie } from './definitions';
import { ajouterEnnemi } from './ennemis';
import { casesLibres } from './grille';
import type { ConfigPartie, Ennemi, EtatPartie, Tour, Unite } from './etat';
import type { Evenement } from './evenements';
import { PAS_PAR_SECONDE } from './temps';
import { appliquerAction, creerPartie, step } from './partie';

export const CONFIG: ConfigPartie = {
  graine: 42,
  difficulte: 'matou',
  dieu: 'charlie',
  heros: 'charlie',
  niveauHeros: 1,
  competencesHeros: {},
  ameliorations: {},
  objets: [],
  versionDonnees: VERSION_DONNEES,
};

/** Config d'un dieu avec son avatar, sans compétence, amélioration ni objet ; `surcharges` pour le reste. */
export function configDe(dieu: string, surcharges: Partial<ConfigPartie> = {}): ConfigPartie {
  return { ...CONFIG, dieu, heros: dieu, ...surcharges };
}

/** Distance entre deux points, sans Math.hypot (interdit dans le moteur). */
export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
}

/** Vague dont l'unique ennemi n'apparaît qu'après une heure : la partie reste en cours. */
export const VAGUE_LOINTAINE: Vague = {
  paquets: [{ ennemi: 'paysan_affame', nombre: 1, intervalle: 0, chemin: 0, delai: 3600 }],
};

/**
 * Cases de la carte d'essai (indices 0 à 5, pour écrire `ce(0)` plutôt que des coordonnées de grille) :
 * 0 à 3 sous le chemin 0 (centres à x = 5, 11, 15, 19 ; y = 7, à 2 tuiles de l'axe : une caserne y a un chemin à portée),
 * 4 sous le chemin 1 (centre (9, 15), à 3 tuiles de l'axe : pas de caserne), 5 au-dessus du chemin 0 (centre (7, 3)).
 */
export const CASES_ESSAI: readonly CaseGrille[] = [
  { cx: 2, cy: 3 },
  { cx: 5, cy: 3 },
  { cx: 7, cy: 3 },
  { cx: 9, cy: 3 },
  { cx: 4, cy: 7 },
  { cx: 3, cy: 1 },
];

/** La case d'essai numéro `i`. */
export function ce(i: number): CaseGrille {
  const c = CASES_ESSAI[i];
  if (!c) throw new Error(`Pas de case d'essai ${String(i)}`);
  return c;
}

/**
 * Cases de `NIVEAU_TEST` (indices 0 à 5). 0 à 3 sont à 2 tuiles d'un axe de chemin impair (une caserne y a un chemin à portée) :
 * centres (15, 11), (19, 15), (29, 5), (29, 9). 4 et 5 sont à 3 tuiles de l'axe : une caserne y a un chemin à portée (3,5). 6 est à
 * plus de 4 tuiles de tout chemin : pas de caserne, mais tout le reste.
 */
export const CASES_TEST: readonly CaseGrille[] = [
  { cx: 7, cy: 5 },
  { cx: 9, cy: 7 },
  { cx: 14, cy: 2 },
  { cx: 14, cy: 4 },
  { cx: 4, cy: 4 },
  { cx: 10, cy: 4 },
  { cx: 9, cy: 1 },
];

/** La case numéro `i` de `NIVEAU_TEST`. */
export function ct(i: number): CaseGrille {
  const c = CASES_TEST[i];
  if (!c) throw new Error(`Pas de case de test ${String(i)}`);
  return c;
}

/**
 * Carte d'essai : chemin 0 droit de (0,5) à (30,5), chemin 1 droit de (0,12) à (30,12), sans décor (seuls les chemins
 * interdisent des cases ; cases d'essai : voir `CASES_ESSAI`).
 * Le héros attend loin des chemins pour ne pas gêner.
 */
export function niveauEssai(vagues: readonly Vague[] = [VAGUE_LOINTAINE], aretesDepart = 5000): Niveau {
  const carte = {
    largeur: 32,
    hauteur: 18,
    chemins: [
      { points: [{ x: 0, y: 5 }, { x: 30, y: 5 }] },
      { points: [{ x: 0, y: 12 }, { x: 30, y: 12 }] },
    ],
    departHeros: { x: 28, y: 16 },
  };
  return { id: 'essai', aretesDepart, carte, casesInterdites: casesInterditesDuNiveau(carte, [], []), vagues };
}

export function ennemiEssai(surcharges: Partial<DefEnnemi> = {}): DefEnnemi {
  return { ...ENNEMIS.paysan_affame, ...surcharges };
}

export function avancerPas(etat: EtatPartie, pas: number): void {
  for (let i = 0; i < pas; i++) step(etat);
}

export function avancerSecondes(etat: EtatPartie, secondes: number): void {
  avancerPas(etat, Math.round(secondes * PAS_PAR_SECONDE));
}

/** Partie sur la carte d'essai avec beaucoup d'arêtes et la config donnée. */
export function partieEssai(config: ConfigPartie = CONFIG, aretes = 5000): EtatPartie {
  return creerPartie(niveauEssai(undefined, aretes), config);
}

/** Construit une tour (et la spécialise si `voie` est donnée) en vérifiant que le moteur accepte chaque étape. */
export function construireTour(etat: EtatPartie, i: number, tour: IdFamille | 'divine', voie?: Voie): void {
  const { cx, cy } = ce(i);
  const action = { type: 'construire', cx, cy, tour } as const;
  const refus = appliquerAction(etat, action);
  if (!refus.ok) throw new Error(`Construction refusée sur la case d'essai ${String(i)} : ${refus.raison}`);
  if (!voie) return;
  for (const a of [{ type: 'ameliorer', cx, cy }, { type: 'ameliorer', cx, cy }, { type: 'specialiser', cx, cy, voie }] as const) {
    if (!appliquerAction(etat, a).ok) throw new Error(`Amélioration refusée sur la case d'essai ${String(i)}`);
  }
}

/** La première case libre du niveau de la partie (la plus au nord-ouest). */
export function premiereCaseLibre(etat: EtatPartie): CaseGrille {
  const c = casesLibres(etat)[0];
  if (!c) throw new Error('aucune case libre');
  return c;
}

/** La tour posée sur la case d'essai numéro `i`, ou undefined. */
export function tourDe(etat: EtatPartie, i: number): Tour | undefined {
  const { cx, cy } = ce(i);
  return etat.tours.find((t) => t.cx === cx && t.cy === cy);
}

/** Le héros de la partie. */
export function heros(etat: EtatPartie): Unite {
  const h = etat.unites.find((u) => u.id === etat.heros);
  if (!h) throw new Error('pas de héros');
  return h;
}

/**
 * Ennemi immobile, increvable et inoffensif posé à `x` sur le chemin 0 (ou un autre) ; `surcharges` pour changer
 * ce qu'on veut tester (volant, boss, furtif, armure…).
 */
export function ennemiFixe(etat: EtatPartie, x: number, surcharges: Partial<DefEnnemi> = {}, chemin = 0): Ennemi {
  return ajouterEnnemi(etat, ennemiEssai({ pv: 100000, vitesse: 0, degats: [0, 0], ...surcharges }), 'paysan_affame', chemin, x);
}

/** Avance de `secondes` en gardant les événements de chaque pas. */
export function evenementsPendant(etat: EtatPartie, secondes: number): Evenement[] {
  const vus: Evenement[] = [];
  for (let i = 0; i < Math.round(secondes * PAS_PAR_SECONDE); i++) {
    step(etat);
    vus.push(...etat.evenements);
  }
  return vus;
}

/** Nombre d'événements d'un type dans une liste. */
export function compter(evenements: readonly Evenement[], type: Evenement['type']): number {
  return evenements.filter((e) => e.type === type).length;
}

/**
 * Ennemi tiré de la table des données (mécaniques comprises), immobile sauf si `surcharges` donne une vitesse.
 * `elite` en fait une version d'élite.
 */
export function ennemiDonnees(etat: EtatPartie, id: IdEnnemi, x: number, surcharges: Partial<DefEnnemi> = {}, chemin = 0, elite = false): Ennemi {
  return ajouterEnnemi(etat, { ...(ENNEMIS[id] as DefEnnemi), vitesse: 0, ...surcharges }, id, chemin, x, elite);
}

/** Les ennemis vivants d'un type donné. */
export function ennemisDe(etat: EtatPartie, type: string): Ennemi[] {
  return etat.ennemis.filter((e) => e.vivant && e.type === type);
}
