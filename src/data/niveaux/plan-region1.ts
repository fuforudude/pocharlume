// Plan des 10 niveaux du Village Affamé : quelle carte, quels chemins et socles, quels ennemis, combien de
// vagues. Les vagues elles-mêmes ne sont pas ici : `npm run niveaux` les génère depuis ce plan et les fige
// dans vagues-region1.ts. Changer ce plan (ennemis, nombre de vagues, graine, nombre de chemins) demande de
// relancer `npm run niveaux`, un test le rappelle.
//
// `aretesDepart` est réglé niveau par niveau avec le simulateur (`npm run balance`, voir docs/architecture.md) : il
// donne la difficulté de chaque carte (nombre de chemins et de socles) sans toucher aux budgets de vagues. Il n'est
// donc pas croissant : la carte du Gué (niveau 2) demande plus d'arêtes de départ que celle des Pendus (niveau 3).
//
// Progression : le niveau 1 a un chemin simple et 6 socles ; le mendiant arrive au 3, le chien errant au 5 ;
// plusieurs entrées du 5 au 9 ; le niveau 10 est le combat contre le Boucher de Vaudrelle.
import type { IdEnnemi } from '../ennemis';
import type { BossDeVague } from './generation';
import type { IdCarte } from './cartes';

export interface PlanNiveau {
  /** 1 à 10 dans la région. */
  readonly numero: number;
  readonly carte: IdCarte;
  /** Chemins de la carte utilisés (entrées), dans l'ordre : le paquet `chemin: i` suit `chemins[i]`. */
  readonly chemins: readonly number[];
  /** Socles de la carte utilisés, dans l'ordre : leur indice dans le niveau est leur rang ici. */
  readonly socles: readonly number[];
  readonly aretesDepart: number;
  /** Clés de src/i18n/fr.ts. */
  readonly nom: string;
  readonly ambiance: string;
  readonly vagues: {
    readonly nombre: number;
    readonly ennemis: readonly IdEnnemi[];
    readonly graine: number;
    readonly boss?: BossDeVague;
    /** Vagues retouchées à la main : le test de cohérence avec le générateur les laisse de côté. */
    readonly retouchees?: boolean;
  };
}

const PAYSAN: readonly IdEnnemi[] = ['paysan_affame'];
const PAYSAN_MENDIANT: readonly IdEnnemi[] = ['paysan_affame', 'mendiant'];
const TOUS: readonly IdEnnemi[] = ['paysan_affame', 'mendiant', 'chien_errant'];

export const PLANS_REGION1: readonly PlanNiveau[] = [
  {
    numero: 1,
    carte: 'chaumes',
    chemins: [0],
    socles: [0, 3, 5, 6, 9, 12],
    aretesDepart: 210,
    nom: 'niveau.r1.01.nom',
    ambiance: 'niveau.r1.01.ambiance',
    vagues: { nombre: 6, ennemis: PAYSAN, graine: 1101 },
  },
  {
    numero: 2,
    carte: 'gue',
    chemins: [0],
    socles: [0, 3, 4, 6, 7, 12, 16],
    aretesDepart: 300,
    nom: 'niveau.r1.02.nom',
    ambiance: 'niveau.r1.02.ambiance',
    vagues: { nombre: 7, ennemis: PAYSAN, graine: 1102 },
  },
  {
    numero: 3,
    carte: 'pendus',
    chemins: [0],
    socles: [1, 4, 6, 8, 9, 14, 20],
    aretesDepart: 200,
    nom: 'niveau.r1.03.nom',
    ambiance: 'niveau.r1.03.ambiance',
    vagues: { nombre: 7, ennemis: PAYSAN_MENDIANT, graine: 1103 },
  },
  {
    numero: 4,
    carte: 'carrefour',
    chemins: [0],
    socles: [1, 3, 5, 8, 10, 12, 14, 16],
    aretesDepart: 225,
    nom: 'niveau.r1.04.nom',
    ambiance: 'niveau.r1.04.ambiance',
    vagues: { nombre: 8, ennemis: PAYSAN_MENDIANT, graine: 1104 },
  },
  {
    numero: 5,
    carte: 'chaumes',
    chemins: [0, 1],
    socles: [0, 3, 5, 7, 10, 13, 14, 16],
    aretesDepart: 480,
    nom: 'niveau.r1.05.nom',
    ambiance: 'niveau.r1.05.ambiance',
    vagues: { nombre: 8, ennemis: TOUS, graine: 1105 },
  },
  {
    numero: 6,
    carte: 'gue',
    chemins: [0, 1],
    socles: [0, 3, 6, 8, 9, 11, 12, 16],
    aretesDepart: 540,
    nom: 'niveau.r1.06.nom',
    ambiance: 'niveau.r1.06.ambiance',
    vagues: { nombre: 9, ennemis: TOUS, graine: 1106 },
  },
  {
    numero: 7,
    carte: 'pendus',
    chemins: [0, 1],
    socles: [0, 4, 5, 8, 9, 12, 14, 16, 20],
    aretesDepart: 340,
    nom: 'niveau.r1.07.nom',
    ambiance: 'niveau.r1.07.ambiance',
    vagues: { nombre: 10, ennemis: TOUS, graine: 1107 },
  },
  {
    numero: 8,
    carte: 'carrefour',
    chemins: [0, 1],
    socles: [0, 2, 3, 5, 8, 10, 12, 15, 17],
    aretesDepart: 330,
    nom: 'niveau.r1.08.nom',
    ambiance: 'niveau.r1.08.ambiance',
    vagues: { nombre: 10, ennemis: TOUS, graine: 1108 },
  },
  {
    numero: 9,
    carte: 'pendus',
    chemins: [0, 1, 2],
    socles: [0, 4, 6, 9, 12, 13, 16, 17, 19, 21],
    aretesDepart: 700,
    nom: 'niveau.r1.09.nom',
    ambiance: 'niveau.r1.09.ambiance',
    vagues: { nombre: 11, ennemis: TOUS, graine: 1109 },
  },
  {
    numero: 10,
    carte: 'gue',
    chemins: [0, 1, 2],
    socles: [0, 3, 4, 7, 9, 11, 12, 14, 17, 18],
    aretesDepart: 640,
    nom: 'niveau.r1.10.nom',
    ambiance: 'niveau.r1.10.ambiance',
    vagues: {
      nombre: 12,
      ennemis: TOUS,
      graine: 1110,
      boss: { vague: 12, ennemi: 'boucher_vaudrelle', chemin: 0, delai: 12 },
    },
  },
];
