// Outils partagés par les tests du moteur : configuration type, cartes d'essai, avance rapide.
import { ENNEMIS } from '../data/ennemis';
import type { DefEnnemi, Niveau, Vague } from './definitions';
import type { ConfigPartie, EtatPartie } from './etat';
import { PAS_PAR_SECONDE } from './temps';
import { step } from './partie';

export const CONFIG: ConfigPartie = { graine: 42, difficulte: 'matou', dieu: 'charlie', niveauHeros: 1 };

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
