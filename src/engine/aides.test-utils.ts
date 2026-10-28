// Outils réservés aux tests du moteur (suffixe .test-utils.ts : jamais importé par le jeu, donc absent du
// build) : configuration type, cartes d'essai, avance rapide.
import { ENNEMIS, type IdEnnemi } from '../data/ennemis';
import { VERSION_DONNEES } from '../data/version';
import type { DefEnnemi, IdFamille, Niveau, Vague, Voie } from './definitions';
import { ajouterEnnemi } from './ennemis';
import type { ConfigPartie, Ennemi, EtatPartie, Unite } from './etat';
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
 * Carte d'essai : chemin 0 droit de (0,5) à (30,5), chemin 1 droit de (0,12) à (30,12).
 * Socles 0 à 3 sous le chemin 0 (x = 5, 10, 15, 20), socle 4 près du chemin 1, socle 5 au-dessus du
 * chemin 0 entre les socles 0 et 1.
 * Le héros attend loin des chemins pour ne pas gêner.
 */
export function niveauEssai(vagues: readonly Vague[] = [VAGUE_LOINTAINE], aretesDepart = 5000): Niveau {
  return {
    id: 'essai',
    aretesDepart,
    carte: {
      largeur: 32,
      hauteur: 18,
      chemins: [
        { points: [{ x: 0, y: 5 }, { x: 30, y: 5 }] },
        { points: [{ x: 0, y: 12 }, { x: 30, y: 12 }] },
      ],
      socles: [
        { x: 5, y: 7, ralliement: { x: 5, y: 5 } },
        { x: 10, y: 7, ralliement: { x: 10, y: 5 } },
        { x: 15, y: 7, ralliement: { x: 15, y: 5 } },
        { x: 20, y: 7, ralliement: { x: 20, y: 5 } },
        { x: 10, y: 14, ralliement: { x: 10, y: 12 } },
        { x: 7.5, y: 3, ralliement: { x: 7.5, y: 5 } },
      ],
      departHeros: { x: 28, y: 16 },
    },
    vagues,
  };
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
export function construireTour(etat: EtatPartie, socle: number, tour: IdFamille | 'divine', voie?: Voie): void {
  const action = { type: 'construire', socle, tour } as const;
  if (!appliquerAction(etat, action).ok) throw new Error(`Construction refusée sur le socle ${String(socle)}`);
  if (!voie) return;
  for (const a of [{ type: 'ameliorer', socle }, { type: 'ameliorer', socle }, { type: 'specialiser', socle, voie }] as const) {
    if (!appliquerAction(etat, a).ok) throw new Error(`Amélioration refusée sur le socle ${String(socle)}`);
  }
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
