// Plan des 10 niveaux de la région 7, de la Croisade (niveaux 61 à 70 de la campagne).
// Comme les régions 2 à 5 (plan-region5.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region7.ts. Trois cartes (cartes-region7.ts) : la première n'a qu'un chemin, les deux autres en ont deux ; un niveau en
// emprunte un seul ou les deux, et ne garde que ces chemins. Les ennemis viennent de `ennemisDuNiveau` (plan-niveau.ts) : ceux de
// la région, puis dès le niveau 4 ceux des régions précédentes. Le niveau 10 est le combat contre le Prince Croisé. `defiFer` :
// deux familles de tours qui savent toucher les volants et révéler les furtifs quand le niveau en compte (dès le niveau 4, les
// Délateurs des régions précédentes reviennent : la tour de tir est alors toujours imposée), et qui varient d'un niveau à l'autre.
// `aretesDepart` est une première estimation proportionnelle au budget de la première vague : l'équilibrage fin est l'objet de la
// tâche d'équilibrage du jalon 4 (`npm run balance`).
import { ennemisDuNiveau, type PlanNiveau } from './plan-niveau';

export const PLANS_REGION7: readonly PlanNiveau[] = [
  {
    numero: 61,
    carte: 'bivouac',
    chemins: [0],
    aretesDepart: 1155,
    defiFer: { familles: ['artillerie', 'caserne'] },
    nom: 'niveau.r7.01.nom',
    ambiance: 'niveau.r7.01.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(7, 1),
      graine: 2061,
      facteurBudget: 0.273,
    },
  },
  {
    numero: 62,
    carte: 'palissade',
    chemins: [0],
    aretesDepart: 1240,
    defiFer: { familles: ['artillerie', 'magie'] },
    nom: 'niveau.r7.02.nom',
    ambiance: 'niveau.r7.02.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(7, 2),
      graine: 3062,
      facteurBudget: 0.282,
    },
  },
  {
    numero: 63,
    carte: 'baliste',
    chemins: [0],
    aretesDepart: 1325,
    defiFer: { familles: ['artillerie', 'caserne'] },
    nom: 'niveau.r7.03.nom',
    ambiance: 'niveau.r7.03.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(7, 3),
      graine: 4063,
      horde: true,
      facteurBudget: 0.291,
    },
  },
  {
    numero: 64,
    carte: 'palissade',
    chemins: [1],
    aretesDepart: 1405,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r7.04.nom',
    ambiance: 'niveau.r7.04.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(7, 4),
      graine: 1286,
      facteurBudget: 0.385,
    },
  },
  {
    numero: 65,
    carte: 'baliste',
    chemins: [1],
    aretesDepart: 1490,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r7.05.nom',
    ambiance: 'niveau.r7.05.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(7, 5),
      graine: 2065,
      facteurBudget: 0.654,
    },
  },
  {
    numero: 66,
    carte: 'bivouac',
    chemins: [0],
    aretesDepart: 1575,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r7.06.nom',
    ambiance: 'niveau.r7.06.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(7, 6),
      graine: 3066,
      facteurBudget: 0.41,
    },
  },
  {
    numero: 67,
    carte: 'palissade',
    chemins: [0, 1],
    aretesDepart: 1660,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r7.07.nom',
    ambiance: 'niveau.r7.07.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(7, 7),
      graine: 4067,
      horde: true,
      facteurBudget: 0.33,
    },
  },
  {
    numero: 68,
    carte: 'baliste',
    chemins: [0, 1],
    aretesDepart: 1745,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r7.08.nom',
    ambiance: 'niveau.r7.08.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(7, 8),
      graine: 1068,
      facteurBudget: 0.34,
    },
  },
  {
    numero: 69,
    carte: 'palissade',
    chemins: [0, 1],
    aretesDepart: 1825,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r7.09.nom',
    ambiance: 'niveau.r7.09.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ennemisDuNiveau(7, 9),
      graine: 2069,
      facteurBudget: 0.732,
    },
  },
  {
    numero: 70,
    carte: 'baliste',
    chemins: [0, 1],
    aretesDepart: 1910,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r7.10.nom',
    ambiance: 'niveau.r7.10.ambiance',
    vagues: {
      nombre: 15,
      ennemis: ennemisDuNiveau(7, 10),
      graine: 3847,
      facteurBudget: 0.457,
      boss: { vague: 15, ennemi: 'prince_croise', chemin: 0, delai: 12 },
    },
  },
];
