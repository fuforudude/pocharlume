// Plan des 10 niveaux de la région 3, du Bourg des Bûchers (niveaux 21 à 30 de la campagne).
// Comme la région 1 (plan-region1.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region3.ts. Trois cartes (cartes-region3.ts) : la première n'a qu'un chemin, les deux autres en ont deux
// ; un niveau en emprunte un seul ou les deux, et ne garde que ces chemins. Les ennemis
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
    aretesDepart: 385,
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
    aretesDepart: 765,
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
    aretesDepart: 1010,
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
    aretesDepart: 635,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r3.04.nom',
    ambiance: 'niveau.r3.04.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(3, 4),
      graine: 2124,
    },
  },
  {
    numero: 25,
    carte: 'beffroi',
    chemins: [1],
    aretesDepart: 930,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r3.05.nom',
    ambiance: 'niveau.r3.05.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(3, 5),
      graine: 4125,
    },
  },
  {
    numero: 26,
    carte: 'ruelles',
    chemins: [0],
    aretesDepart: 775,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r3.06.nom',
    ambiance: 'niveau.r3.06.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(3, 6),
      graine: 4126,
    },
  },
  {
    numero: 27,
    carte: 'place',
    chemins: [0, 1],
    aretesDepart: 700,
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
    aretesDepart: 785,
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
    aretesDepart: 1060,
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
    aretesDepart: 1305,
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
