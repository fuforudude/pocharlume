// Plan des 10 niveaux de la région 3, du Bourg des Bûchers (niveaux 21 à 30 de la campagne).
// Comme la région 1 (plan-region1.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region3.ts. Trois cartes (cartes-region3.ts) : la première n'a qu'un chemin, les deux autres en ont deux
// ; un niveau en emprunte un seul ou les deux, et ne garde que les socles à portée des chemins empruntés. Les ennemis
// viennent de `ennemisDuNiveau` (plan-niveau.ts) : ceux de la région, puis dès le niveau 4 ceux des régions précédentes. Le
// niveau 10 est le combat contre le Juge des Flammes. `defiFer` : deux familles de tours qui savent toucher les volants et
// révéler les furtifs quand le niveau en compte, et qui varient d'un niveau à l'autre.
// `aretesDepart` est réglé avec le simulateur (`npm run balance`), grossièrement : l'équilibrage fin des régions 2 à 5 est
// l'objet de la tâche 6 du jalon 3.
import { ennemisDuNiveau, type PlanNiveau } from './plan-niveau';

export const PLANS_REGION3: readonly PlanNiveau[] = [
  {
    numero: 21,
    carte: 'ruelles',
    chemins: [0],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    aretesDepart: 350,
    defiFer: { familles: ['caserne', 'artillerie'] },
    nom: 'niveau.r3.01.nom',
    ambiance: 'niveau.r3.01.ambiance',
    vagues: {
      nombre: 9,
      ennemis: ennemisDuNiveau(3, 1),
      graine: 1121,
    },
  },
  {
    numero: 22,
    carte: 'place',
    chemins: [0],
    socles: [0, 1, 2, 5, 8, 9, 10, 11],
    aretesDepart: 350,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r3.02.nom',
    ambiance: 'niveau.r3.02.ambiance',
    vagues: {
      nombre: 9,
      ennemis: ennemisDuNiveau(3, 2),
      graine: 1122,
    },
  },
  {
    numero: 23,
    carte: 'beffroi',
    chemins: [0],
    socles: [4, 5, 6, 7, 8, 9, 10, 11],
    aretesDepart: 890,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r3.03.nom',
    ambiance: 'niveau.r3.03.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(3, 3),
      graine: 1123,
    },
  },
  {
    numero: 24,
    carte: 'place',
    chemins: [1],
    socles: [3, 4, 6, 7, 10, 11],
    aretesDepart: 2380,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r3.04.nom',
    ambiance: 'niveau.r3.04.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(3, 4),
      graine: 1124,
    },
  },
  {
    numero: 25,
    carte: 'beffroi',
    chemins: [1],
    socles: [0, 1, 2, 3, 4, 5],
    aretesDepart: 2400,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r3.05.nom',
    ambiance: 'niveau.r3.05.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(3, 5),
      graine: 1125,
    },
  },
  {
    numero: 26,
    carte: 'ruelles',
    chemins: [0],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    aretesDepart: 2430,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r3.06.nom',
    ambiance: 'niveau.r3.06.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(3, 6),
      graine: 1126,
    },
  },
  {
    numero: 27,
    carte: 'place',
    chemins: [0, 1],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    aretesDepart: 1340,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r3.07.nom',
    ambiance: 'niveau.r3.07.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(3, 7),
      graine: 1127,
    },
  },
  {
    numero: 28,
    carte: 'beffroi',
    chemins: [0, 1],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    aretesDepart: 750,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r3.08.nom',
    ambiance: 'niveau.r3.08.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(3, 8),
      graine: 1128,
    },
  },
  {
    numero: 29,
    carte: 'place',
    chemins: [0, 1],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    aretesDepart: 2050,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r3.09.nom',
    ambiance: 'niveau.r3.09.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(3, 9),
      graine: 1129,
    },
  },
  {
    numero: 30,
    carte: 'beffroi',
    chemins: [0, 1],
    socles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    aretesDepart: 2530,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r3.10.nom',
    ambiance: 'niveau.r3.10.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ennemisDuNiveau(3, 10),
      graine: 1130,
      boss: { vague: 14, ennemi: 'juge_flammes', chemin: 0, delai: 12 },
    },
  },
];
