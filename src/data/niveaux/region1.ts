// Région 1, le Village Affamé : les 10 niveaux de la campagne (REGION1) et un niveau de test complet (un
// chemin, 5 vagues) utilisé par les tests du moteur et des données. Cartes dans cartes.ts, plan des
// niveaux dans plan-region1.ts, vagues figées dans vagues-region1.ts (générées par `npm run niveaux`).
import type { Carte, Niveau } from '../../engine/definitions';
import type { NiveauCampagne } from '../visuel';
import { assemblerNiveau } from './assemblage';
import { casesInterditesDuNiveau } from './grille-niveau';
import { PLANS_REGION1 } from './plan-region1';
import { VAGUES_REGION1 } from './vagues-region1';

/** Carte du niveau de test : un seul chemin en serpent, sans décor (seul le chemin interdit des cases). */
const CARTE_TEST: Carte = {
  largeur: 32,
  hauteur: 18,
  chemins: [
    {
      points: [
        { x: -1, y: 5 },
        { x: 13, y: 5 },
        { x: 13, y: 13 },
        { x: 25, y: 13 },
        { x: 25, y: 7 },
        { x: 33, y: 7 },
      ],
    },
  ],
  departHeros: { x: 17, y: 13 },
};

export const NIVEAU_TEST: Niveau = {
  id: 'r1-test',
  aretesDepart: 260,
  carte: CARTE_TEST,
  casesInterdites: casesInterditesDuNiveau(CARTE_TEST, [], []),
  vagues: [
    { paquets: [{ ennemi: 'paysan_affame', nombre: 6, intervalle: 1.5, chemin: 0, delai: 0 }] },
    {
      paquets: [
        { ennemi: 'paysan_affame', nombre: 8, intervalle: 1.2, chemin: 0, delai: 0 },
        { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 0, delai: 6 },
      ],
    },
    {
      paquets: [
        { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 0, delai: 0 },
        { ennemi: 'paysan_affame', nombre: 8, intervalle: 1, chemin: 0, delai: 5 },
      ],
    },
    {
      paquets: [
        { ennemi: 'mendiant', nombre: 12, intervalle: 0.6, chemin: 0, delai: 0 },
        { ennemi: 'paysan_affame', nombre: 10, intervalle: 1, chemin: 0, delai: 4 },
        { ennemi: 'chien_errant', nombre: 8, intervalle: 0.7, chemin: 0, delai: 8 },
      ],
    },
    {
      paquets: [
        { ennemi: 'paysan_affame', nombre: 10, intervalle: 1, chemin: 0, delai: 0 },
        { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 0, delai: 6 },
        { ennemi: 'boucher_vaudrelle', nombre: 1, intervalle: 0, chemin: 0, delai: 10 },
      ],
    },
  ],
};

/** Les 10 niveaux de la région 1, numérotés de 1 à 10 dans l'ordre. */
export const REGION1: readonly NiveauCampagne[] = PLANS_REGION1.map((plan, i) => {
  const vagues = VAGUES_REGION1[i];
  if (!vagues) throw new Error(`Vagues figées manquantes pour le niveau ${String(plan.numero)} : relancer npm run niveaux`);
  return assemblerNiveau(plan, vagues);
});

/** Clés de texte d'un niveau de campagne : son nom et sa phrase d'ambiance (src/i18n/fr.ts). */
export interface TextesNiveau {
  readonly numero: number;
  readonly nom: string;
  readonly ambiance: string;
  /** Clé d'une phrase d'annonce affichée sous l'ambiance de la fiche (ex. un siège), absente pour la plupart des niveaux. */
  readonly annonce?: string;
}

export const TEXTES_REGION1: readonly TextesNiveau[] = PLANS_REGION1.map((p) => ({ numero: p.numero, nom: p.nom, ambiance: p.ambiance }));

export const NIVEAUX_REGION1: readonly Niveau[] = [NIVEAU_TEST, ...REGION1.map((n) => n.niveau)];
