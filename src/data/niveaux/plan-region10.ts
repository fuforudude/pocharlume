// Plan des 10 niveaux de la région 10, de la Cathédrale du Soleil Blême (niveaux 91 à 100 de la campagne).
// Comme les régions 2 à 5 (plan-region5.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region10.ts. Trois cartes (cartes-region10.ts) : la première n'a qu'un chemin, les deux autres en ont deux ; un niveau en
// emprunte un seul ou les deux, et ne garde que ces chemins. Les ennemis viennent de `ennemisDuNiveau` (plan-niveau.ts) : ceux de
// la région, puis dès le niveau 4 ceux des régions précédentes. Le niveau 10 est le combat contre le Soleil Blême. `defiFer` :
// deux familles de tours qui savent toucher les volants et révéler les furtifs quand le niveau en compte (dès le niveau 4, les
// Délateurs des régions précédentes reviennent : la tour de tir est alors toujours imposée), et qui varient d'un niveau à l'autre.
// `aretesDepart` est une première estimation proportionnelle au budget de la première vague : l'équilibrage fin est l'objet de la
// tâche d'équilibrage du jalon 4 (`npm run balance`).
import { ennemisDuNiveau, type PlanNiveau } from './plan-niveau';

export const PLANS_REGION10: readonly PlanNiveau[] = [
  {
    numero: 91,
    carte: 'nef',
    chemins: [0],
    aretesDepart: 1400,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r10.01.nom',
    ambiance: 'niveau.r10.01.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(10, 1),
      graine: 4091,
      facteurBudget: 0.102,
    },
  },
  {
    numero: 92,
    carte: 'transept',
    chemins: [0],
    aretesDepart: 1510,
    defiFer: { familles: ['artillerie', 'magie'] },
    nom: 'niveau.r10.02.nom',
    ambiance: 'niveau.r10.02.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(10, 2),
      graine: 1092,
      facteurBudget: 0.106,
    },
  },
  {
    numero: 93,
    carte: 'choeur',
    chemins: [0],
    aretesDepart: 1620,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r10.03.nom',
    ambiance: 'niveau.r10.03.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(10, 3),
      graine: 2093,
      facteurBudget: 0.085,
    },
  },
  {
    numero: 94,
    carte: 'transept',
    chemins: [1],
    aretesDepart: 1730,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r10.04.nom',
    ambiance: 'niveau.r10.04.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(10, 4),
      graine: 3094,
      facteurBudget: 0.305,
    },
  },
  {
    numero: 95,
    carte: 'choeur',
    chemins: [1],
    aretesDepart: 1840,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r10.05.nom',
    ambiance: 'niveau.r10.05.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(10, 5),
      graine: 4095,
      facteurBudget: 0.188,
    },
  },
  {
    numero: 96,
    carte: 'nef',
    chemins: [0],
    aretesDepart: 1950,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r10.06.nom',
    ambiance: 'niveau.r10.06.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(10, 6),
      graine: 1096,
      facteurBudget: 0.323,
    },
  },
  {
    numero: 97,
    carte: 'transept',
    chemins: [0, 1],
    aretesDepart: 2060,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r10.07.nom',
    ambiance: 'niveau.r10.07.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(10, 7),
      graine: 2097,
      facteurBudget: 0.261,
    },
  },
  {
    numero: 98,
    carte: 'choeur',
    chemins: [0, 1],
    aretesDepart: 2170,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r10.08.nom',
    ambiance: 'niveau.r10.08.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(10, 8),
      graine: 3431,
      facteurBudget: 0.131,
    },
  },
  {
    numero: 99,
    carte: 'transept',
    chemins: [0, 1],
    aretesDepart: 2280,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r10.09.nom',
    ambiance: 'niveau.r10.09.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ennemisDuNiveau(10, 9),
      graine: 4099,
      facteurBudget: 0.168,
    },
  },
  {
    numero: 100,
    carte: 'choeur',
    chemins: [0, 1],
    aretesDepart: 2390,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r10.10.nom',
    ambiance: 'niveau.r10.10.ambiance',
    vagues: {
      nombre: 15,
      ennemis: ennemisDuNiveau(10, 10),
      graine: 1100,
      facteurBudget: 0.05,
      boss: { vague: 15, ennemi: 'soleil_bleme', chemin: 0, delai: 12 },
    },
  },
];
