// Plan des 10 niveaux du Village Affamé (type et règles communes : plan-niveau.ts). Les vagues elles-mêmes ne sont pas ici :
// `npm run niveaux` les génère depuis ce plan et les fige dans vagues-region1.ts. Changer ce plan (ennemis, nombre de
// vagues, graine, nombre de chemins) demande de relancer `npm run niveaux`, un test le rappelle.
//
// `aretesDepart` est réglé niveau par niveau avec le simulateur (`npm run balance`, voir docs/architecture.md) : il
// donne la difficulté de chaque carte (nombre de chemins) sans toucher aux budgets de vagues. Il n'est
// donc pas croissant : la carte du Gué (niveau 2) demande plus d'arêtes de départ que celle des Pendus (niveau 3).
//
// Progression : le niveau 1 a un chemin simple ; le mendiant arrive au 3, le chien errant au 5 ;
// plusieurs entrées du 5 au 9 ; le niveau 10 est le combat contre le Boucher de Vaudrelle.
import type { IdEnnemi } from '../ennemis';
import { nouveauxEnnemisDuNiveau, type PlanNiveau } from './plan-niveau';

const PAYSAN: readonly IdEnnemi[] = ['paysan_affame'];
const PAYSAN_MENDIANT: readonly IdEnnemi[] = ['paysan_affame', 'mendiant'];
const TOUS: readonly IdEnnemi[] = ['paysan_affame', 'mendiant', 'chien_errant'];

/** Les ennemis du niveau `k` : ceux du palier, puis les nouveaux de la région déjà arrivés (Coupe-Bourse au niveau 4, Grand Manteau au 7). */
function avecNouveaux(base: readonly IdEnnemi[], k: number): readonly IdEnnemi[] {
  return [...base, ...nouveauxEnnemisDuNiveau(1, k)];
}

export const PLANS_REGION1: readonly PlanNiveau[] = [
  {
    numero: 1,
    carte: 'chaumes',
    chemins: [0],
    aretesDepart: 210,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r1.01.nom',
    ambiance: 'niveau.r1.01.ambiance',
    vagues: { nombre: 6, ennemis: PAYSAN, graine: 1101 },
  },
  {
    numero: 2,
    carte: 'gue',
    chemins: [0],
    aretesDepart: 310,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r1.02.nom',
    ambiance: 'niveau.r1.02.ambiance',
    vagues: { nombre: 7, ennemis: PAYSAN, graine: 1102, facteurBudget: 1.25, ecart: 0.8 },
  },
  {
    numero: 3,
    carte: 'pendus',
    chemins: [0],
    aretesDepart: 200,
    defiFer: { familles: ['caserne', 'artillerie'] },
    nom: 'niveau.r1.03.nom',
    ambiance: 'niveau.r1.03.ambiance',
    vagues: { nombre: 7, ennemis: PAYSAN_MENDIANT, graine: 1103, horde: true },
  },
  {
    numero: 4,
    carte: 'carrefour',
    chemins: [0],
    aretesDepart: 240,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r1.04.nom',
    ambiance: 'niveau.r1.04.ambiance',
    vagues: { nombre: 8, ennemis: avecNouveaux(PAYSAN_MENDIANT, 4), graine: 1104, ecart: 0.8 },
  },
  {
    numero: 5,
    carte: 'chaumes',
    chemins: [0, 1],
    aretesDepart: 280,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r1.05.nom',
    ambiance: 'niveau.r1.05.ambiance',
    vagues: { nombre: 8, ennemis: avecNouveaux(TOUS, 5), graine: 1105 },
  },
  {
    numero: 6,
    carte: 'gue',
    chemins: [0, 1],
    aretesDepart: 450,
    defiFer: { familles: ['magie', 'artillerie'] },
    nom: 'niveau.r1.06.nom',
    ambiance: 'niveau.r1.06.ambiance',
    vagues: { nombre: 9, ennemis: avecNouveaux(TOUS, 6), graine: 1106 },
  },
  {
    numero: 7,
    carte: 'pendus',
    chemins: [0, 1],
    aretesDepart: 250,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r1.07.nom',
    ambiance: 'niveau.r1.07.ambiance',
    vagues: { nombre: 10, ennemis: avecNouveaux(TOUS, 7), graine: 1107, horde: true },
  },
  {
    numero: 8,
    carte: 'carrefour',
    chemins: [0, 1],
    aretesDepart: 225,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r1.08.nom',
    ambiance: 'niveau.r1.08.ambiance',
    vagues: { nombre: 10, ennemis: avecNouveaux(TOUS, 8), graine: 1108 },
  },
  {
    numero: 9,
    carte: 'pendus',
    chemins: [0, 1, 2],
    aretesDepart: 690,
    defiFer: { familles: ['caserne', 'artillerie'] },
    nom: 'niveau.r1.09.nom',
    ambiance: 'niveau.r1.09.ambiance',
    vagues: { nombre: 11, ennemis: avecNouveaux(TOUS, 9), graine: 1109 },
  },
  {
    numero: 10,
    carte: 'gue',
    chemins: [0, 1, 2],
    aretesDepart: 1120,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r1.10.nom',
    ambiance: 'niveau.r1.10.ambiance',
    vagues: {
      nombre: 12,
      ennemis: avecNouveaux(TOUS, 10),
      graine: 1110,
      boss: { vague: 12, ennemi: 'boucher_vaudrelle', chemin: 0, delai: 12 },
    },
  },
];
