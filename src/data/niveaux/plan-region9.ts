// Plan des 10 niveaux de la région 9, de la Cité du Roi (niveaux 81 à 90 de la campagne).
// Comme les régions 2 à 5 (plan-region5.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region9.ts. Trois cartes (cartes-region9.ts) : la première n'a qu'un chemin, les deux autres en ont deux ; un niveau en
// emprunte un seul ou les deux, et ne garde que ces chemins. Les ennemis viennent de `ennemisDuNiveau` (plan-niveau.ts) : ceux de
// la région, puis dès le niveau 4 ceux des régions précédentes. Le niveau 10 est le combat contre le Roi Fou. `defiFer` :
// deux familles de tours qui savent toucher les volants et révéler les furtifs quand le niveau en compte (dès le niveau 4, les
// Délateurs des régions précédentes reviennent : la tour de tir est alors toujours imposée), et qui varient d'un niveau à l'autre.
// `aretesDepart` est une première estimation proportionnelle au budget de la première vague : l'équilibrage fin est l'objet de la
// tâche d'équilibrage du jalon 4 (`npm run balance`).
import { ennemisDuNiveau, type PlanNiveau } from './plan-niveau';

export const PLANS_REGION9: readonly PlanNiveau[] = [
  {
    numero: 81,
    carte: 'avenue',
    chemins: [0],
    aretesDepart: 2100,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r9.01.nom',
    ambiance: 'niveau.r9.01.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(9, 1),
      graine: 2081,
      facteurBudget: 0.217,

    },
  },
  {
    numero: 82,
    carte: 'douves',
    chemins: [0],
    aretesDepart: 1260,
    defiFer: { familles: ['artillerie', 'magie'] },
    nom: 'niveau.r9.02.nom',
    ambiance: 'niveau.r9.02.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(9, 2),
      graine: 3415,
      facteurBudget: 0.209,

    },
  },
  {
    numero: 83,
    carte: 'pont_levis',
    chemins: [0],
    aretesDepart: 1355,
    defiFer: { familles: ['artillerie', 'caserne'] },
    nom: 'niveau.r9.03.nom',
    ambiance: 'niveau.r9.03.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(9, 3),
      graine: 4194,
      facteurBudget: 0.217,

    },
  },
  {
    numero: 84,
    carte: 'douves',
    chemins: [1],
    aretesDepart: 1440,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r9.04.nom',
    ambiance: 'niveau.r9.04.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(9, 4),
      graine: 1084,
      facteurBudget: 0.366,

    },
  },
  {
    numero: 85,
    carte: 'pont_levis',
    chemins: [1],
    aretesDepart: 1530,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r9.05.nom',
    ambiance: 'niveau.r9.05.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(9, 5),
      graine: 2085,
      facteurBudget: 0.294,

    },
  },
  {
    numero: 86,
    carte: 'avenue',
    chemins: [0],
    aretesDepart: 1620,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r9.06.nom',
    ambiance: 'niveau.r9.06.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(9, 6),
      graine: 3086,
      facteurBudget: 0.638,

    },
  },
  {
    numero: 87,
    carte: 'douves',
    chemins: [0, 1],
    aretesDepart: 1710,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r9.07.nom',
    ambiance: 'niveau.r9.07.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(9, 7),
      graine: 4087,
      facteurBudget: 0.245,

    },
  },
  {
    numero: 88,
    carte: 'pont_levis',
    chemins: [0, 1],
    aretesDepart: 1800,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r9.08.nom',
    ambiance: 'niveau.r9.08.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(9, 8),
      graine: 1088,
      facteurBudget: 0.252,

    },
  },
  {
    numero: 89,
    carte: 'douves',
    chemins: [0, 1],
    aretesDepart: 1890,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r9.09.nom',
    ambiance: 'niveau.r9.09.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ennemisDuNiveau(9, 9),
      graine: 2089,
      facteurBudget: 0.258,

    },
  },
  {
    numero: 90,
    carte: 'pont_levis',
    chemins: [0, 1],
    aretesDepart: 1980,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r9.10.nom',
    ambiance: 'niveau.r9.10.ambiance',
    vagues: {
      nombre: 15,
      ennemis: ennemisDuNiveau(9, 10),
      graine: 3090,
      facteurBudget: 0.207,

      boss: { vague: 15, ennemi: 'roi_fou', chemin: 0, delai: 12 },
    },
  },
];
