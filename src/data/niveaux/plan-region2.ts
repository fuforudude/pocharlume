// Plan des 10 niveaux de la région 2, des Champs Brûlés (niveaux 11 à 20 de la campagne).
// Comme la région 1 (plan-region1.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region2.ts. Trois cartes (cartes-region2.ts) : la première n'a qu'un chemin, les deux autres en ont deux
// ; un niveau en emprunte un seul ou les deux, et ne garde que ces chemins. Les ennemis
// viennent de `ennemisDuNiveau` (plan-niveau.ts) : ceux de la région, puis dès le niveau 4 ceux des régions précédentes. Le
// niveau 10 est le combat contre la Faim. `defiFer` : deux familles de tours qui savent toucher les volants et
// révéler les furtifs quand le niveau en compte, et qui varient d'un niveau à l'autre.
// `aretesDepart` est réglé avec le simulateur (`npm run balance`), grossièrement : l'équilibrage fin des régions 2 à 5 est
// l'objet de la tâche 6 du jalon 3.
import { ennemisDuNiveau, type PlanNiveau } from './plan-niveau';

export const PLANS_REGION2: readonly PlanNiveau[] = [
  {
    numero: 11,
    carte: 'sillons',
    chemins: [0],
    aretesDepart: 465,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r2.01.nom',
    ambiance: 'niveau.r2.01.ambiance',
    vagues: {
      nombre: 8,
      ennemis: ennemisDuNiveau(2, 1),
      graine: 1111,
    },
  },
  {
    numero: 12,
    carte: 'meules',
    chemins: [0],
    aretesDepart: 1565,
    defiFer: { familles: ['magie', 'artillerie'] },
    nom: 'niveau.r2.02.nom',
    ambiance: 'niveau.r2.02.ambiance',
    vagues: {
      nombre: 8,
      ennemis: ennemisDuNiveau(2, 2),
      graine: 2112,
    },
  },
  {
    numero: 13,
    carte: 'aire',
    chemins: [0],
    aretesDepart: 1295,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r2.03.nom',
    ambiance: 'niveau.r2.03.ambiance',
    vagues: {
      nombre: 9,
      ennemis: ennemisDuNiveau(2, 3),
      graine: 2113,
    },
  },
  {
    numero: 14,
    carte: 'meules',
    chemins: [1],
    aretesDepart: 725,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r2.04.nom',
    ambiance: 'niveau.r2.04.ambiance',
    vagues: {
      nombre: 9,
      ennemis: ennemisDuNiveau(2, 4),
      graine: 1114,
    },
  },
  {
    numero: 15,
    carte: 'aire',
    chemins: [1],
    aretesDepart: 700,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r2.05.nom',
    ambiance: 'niveau.r2.05.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(2, 5),
      graine: 2115,
    },
  },
  {
    numero: 16,
    carte: 'sillons',
    chemins: [0],
    aretesDepart: 765,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r2.06.nom',
    ambiance: 'niveau.r2.06.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(2, 6),
      graine: 1116,
    },
  },
  {
    numero: 17,
    carte: 'meules',
    chemins: [0, 1],
    aretesDepart: 970,
    defiFer: { familles: ['magie', 'artillerie'] },
    nom: 'niveau.r2.07.nom',
    ambiance: 'niveau.r2.07.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(2, 7),
      graine: 3117,
    },
  },
  {
    numero: 18,
    carte: 'aire',
    chemins: [0, 1],
    aretesDepart: 740,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r2.08.nom',
    ambiance: 'niveau.r2.08.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(2, 8),
      graine: 2118,
    },
  },
  {
    numero: 19,
    carte: 'meules',
    chemins: [0, 1],
    aretesDepart: 970,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r2.09.nom',
    ambiance: 'niveau.r2.09.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(2, 9),
      graine: 1119,
    },
  },
  {
    numero: 20,
    carte: 'aire',
    chemins: [0, 1],
    aretesDepart: 1110,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r2.10.nom',
    ambiance: 'niveau.r2.10.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(2, 10),
      graine: 1120,
      boss: { vague: 13, ennemi: 'la_faim', chemin: 0, delai: 12 },
    },
  },
];
