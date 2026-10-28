// Plan des 10 niveaux de la région 5, de la Ville Pestiférée (niveaux 41 à 50 de la campagne).
// Comme la région 1 (plan-region1.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region5.ts. Trois cartes (cartes-region5.ts) : la première n'a qu'un chemin, les deux autres en ont deux
// ; un niveau en emprunte un seul ou les deux, et ne garde que les socles à portée des chemins empruntés. Les ennemis
// viennent de `ennemisDuNiveau` (plan-niveau.ts) : ceux de la région, puis dès le niveau 4 ceux des régions précédentes. Le
// niveau 10 est le combat contre la Mère des Rats. `defiFer` : deux familles de tours qui savent toucher les volants et
// révéler les furtifs quand le niveau en compte, et qui varient d'un niveau à l'autre.
// `aretesDepart` est réglé avec le simulateur (`npm run balance`), grossièrement : l'équilibrage fin des régions 2 à 5 est
// l'objet de la tâche 6 du jalon 3.
import { ennemisDuNiveau, type PlanNiveau } from './plan-niveau';

export const PLANS_REGION5: readonly PlanNiveau[] = [
  {
    numero: 41,
    carte: 'quarantaine',
    chemins: [0],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    aretesDepart: 550,
    defiFer: { familles: ['caserne', 'artillerie'] },
    nom: 'niveau.r5.01.nom',
    ambiance: 'niveau.r5.01.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(5, 1),
      graine: 1141,
    },
  },
  {
    numero: 42,
    carte: 'faubourg',
    chemins: [0],
    socles: [0, 3, 5, 8, 9, 10],
    aretesDepart: 1290,
    defiFer: { familles: ['magie', 'artillerie'] },
    nom: 'niveau.r5.02.nom',
    ambiance: 'niveau.r5.02.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(5, 2),
      graine: 1142,
    },
  },
  {
    numero: 43,
    carte: 'marche',
    chemins: [0],
    socles: [0, 1, 2, 3, 4, 5, 6],
    aretesDepart: 2870,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r5.03.nom',
    ambiance: 'niveau.r5.03.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(5, 3),
      graine: 1143,
    },
  },
  {
    numero: 44,
    carte: 'faubourg',
    chemins: [1],
    socles: [1, 2, 4, 6, 7, 10],
    aretesDepart: 2890,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r5.04.nom',
    ambiance: 'niveau.r5.04.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(5, 4),
      graine: 1144,
    },
  },
  {
    numero: 45,
    carte: 'marche',
    chemins: [1],
    socles: [0, 2, 3, 5, 7, 8],
    aretesDepart: 1590,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r5.05.nom',
    ambiance: 'niveau.r5.05.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(5, 5),
      graine: 1145,
    },
  },
  {
    numero: 46,
    carte: 'quarantaine',
    chemins: [0],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    aretesDepart: 2940,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r5.06.nom',
    ambiance: 'niveau.r5.06.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(5, 6),
      graine: 1146,
    },
  },
  {
    numero: 47,
    carte: 'faubourg',
    chemins: [0, 1],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    aretesDepart: 2970,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r5.07.nom',
    ambiance: 'niveau.r5.07.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(5, 7),
      graine: 1147,
    },
  },
  {
    numero: 48,
    carte: 'marche',
    chemins: [0, 1],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    aretesDepart: 1630,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r5.08.nom',
    ambiance: 'niveau.r5.08.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(5, 8),
      graine: 1148,
    },
  },
  {
    numero: 49,
    carte: 'faubourg',
    chemins: [0, 1],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    aretesDepart: 3020,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r5.09.nom',
    ambiance: 'niveau.r5.09.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ennemisDuNiveau(5, 9),
      graine: 1149,
    },
  },
  {
    numero: 50,
    carte: 'marche',
    chemins: [0, 1],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    aretesDepart: 1150,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r5.10.nom',
    ambiance: 'niveau.r5.10.ambiance',
    vagues: {
      nombre: 15,
      ennemis: ennemisDuNiveau(5, 10),
      graine: 1150,
      boss: { vague: 15, ennemi: 'mere_rats', chemin: 0, delai: 12 },
    },
  },
];
