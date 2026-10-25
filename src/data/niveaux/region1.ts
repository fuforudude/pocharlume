// Région 1, le Village Affamé. Les 10 niveaux viendront à la tâche 8 ; pour l'instant un seul niveau de
// test complet (un chemin, 6 socles, 5 vagues), utilisé par les tests du moteur et des données.
import type { Niveau } from '../../engine/definitions';

export const NIVEAU_TEST: Niveau = {
  id: 'r1-test',
  aretesDepart: 260,
  carte: {
    largeur: 32,
    hauteur: 18,
    chemins: [
      {
        points: [
          { x: -1, y: 4 },
          { x: 12, y: 4 },
          { x: 12, y: 13 },
          { x: 24, y: 13 },
          { x: 24, y: 7 },
          { x: 33, y: 7 },
        ],
      },
    ],
    socles: [
      { x: 8, y: 6, ralliement: { x: 8, y: 4 } },
      { x: 10, y: 9, ralliement: { x: 12, y: 9 } },
      { x: 15, y: 11, ralliement: { x: 15, y: 13 } },
      { x: 19, y: 15, ralliement: { x: 19, y: 13 } },
      { x: 22, y: 9, ralliement: { x: 24, y: 9 } },
      { x: 28, y: 5, ralliement: { x: 28, y: 7 } },
    ],
    departHeros: { x: 16, y: 13 },
  },
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

export const NIVEAUX_REGION1: readonly Niveau[] = [NIVEAU_TEST];
