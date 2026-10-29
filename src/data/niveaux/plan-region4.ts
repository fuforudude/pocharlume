// Plan des 10 niveaux de la région 4, des Marais de l’Ordalie (niveaux 31 à 40 de la campagne).
// Comme la région 1 (plan-region1.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region4.ts. Trois cartes (cartes-region4.ts) : la première n'a qu'un chemin, les deux autres en ont deux
// ; un niveau en emprunte un seul ou les deux, et ne garde que ces chemins. Les ennemis
// viennent de `ennemisDuNiveau` (plan-niveau.ts) : ceux de la région, puis dès le niveau 4 ceux des régions précédentes. Le
// niveau 10 est le combat contre la Dame du Puits. `defiFer` : deux familles de tours qui savent toucher les volants et
// révéler les furtifs quand le niveau en compte, et qui varient d'un niveau à l'autre.
// `aretesDepart` est réglé avec le simulateur (`npm run balance`), grossièrement : l'équilibrage fin des régions 2 à 5 est
// l'objet de la tâche 6 du jalon 3.
import { ennemisDuNiveau, type PlanNiveau } from './plan-niveau';

export const PLANS_REGION4: readonly PlanNiveau[] = [
  {
    numero: 31,
    carte: 'ponton',
    chemins: [0],
    aretesDepart: 1500,
    defiFer: { familles: ['caserne', 'artillerie'] },
    nom: 'niveau.r4.01.nom',
    ambiance: 'niveau.r4.01.ambiance',
    vagues: {
      nombre: 9,
      ennemis: ennemisDuNiveau(4, 1),
      graine: 1131,
    },
  },
  {
    numero: 32,
    carte: 'etang',
    chemins: [0],
    aretesDepart: 660,
    defiFer: { familles: ['magie', 'artillerie'] },
    nom: 'niveau.r4.02.nom',
    ambiance: 'niveau.r4.02.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(4, 2),
      graine: 1132,
    },
  },
  {
    numero: 33,
    carte: 'saules',
    chemins: [0],
    aretesDepart: 550,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r4.03.nom',
    ambiance: 'niveau.r4.03.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(4, 3),
      graine: 1133,
    },
  },
  {
    numero: 34,
    carte: 'etang',
    chemins: [1],
    aretesDepart: 685,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r4.04.nom',
    ambiance: 'niveau.r4.04.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(4, 4),
      graine: 1134,
    },
  },
  {
    numero: 35,
    carte: 'saules',
    chemins: [1],
    aretesDepart: 775,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r4.05.nom',
    ambiance: 'niveau.r4.05.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(4, 5),
      graine: 2135,
    },
  },
  {
    numero: 36,
    carte: 'ponton',
    chemins: [0],
    aretesDepart: 610,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r4.06.nom',
    ambiance: 'niveau.r4.06.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(4, 6),
      graine: 3136,
    },
  },
  {
    numero: 37,
    carte: 'etang',
    chemins: [0, 1],
    aretesDepart: 910,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r4.07.nom',
    ambiance: 'niveau.r4.07.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(4, 7),
      graine: 1137,
    },
  },
  {
    numero: 38,
    carte: 'saules',
    chemins: [0, 1],
    aretesDepart: 1610,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r4.08.nom',
    ambiance: 'niveau.r4.08.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(4, 8),
      graine: 1138,
    },
  },
  {
    numero: 39,
    carte: 'etang',
    chemins: [0, 1],
    aretesDepart: 800,
    defiFer: { familles: ['tir', 'magie'] },
    nom: 'niveau.r4.09.nom',
    ambiance: 'niveau.r4.09.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(4, 9),
      graine: 39014,
    },
  },
  {
    numero: 40,
    carte: 'saules',
    chemins: [0, 1],
    aretesDepart: 1775,
    defiFer: { familles: ['tir', 'artillerie'] },
    nom: 'niveau.r4.10.nom',
    ambiance: 'niveau.r4.10.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ennemisDuNiveau(4, 10),
      graine: 1140,
      boss: { vague: 14, ennemi: 'dame_puits', chemin: 0, delai: 12 },
    },
  },
];
