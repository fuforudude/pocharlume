// Plan des 10 niveaux de la région 8, du Monastère Noir (niveaux 71 à 80 de la campagne).
// Comme les régions 2 à 5 (plan-region5.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region8.ts. Trois cartes (cartes-region8.ts) : la première n'a qu'un chemin, les deux autres en ont deux ; un niveau en
// emprunte un seul ou les deux, et ne garde que ces chemins. Les ennemis viennent de `ennemisDuNiveau` (plan-niveau.ts) : ceux de
// la région, puis dès le niveau 4 ceux des régions précédentes. Le niveau 10 est le combat contre le Grand Inquisiteur. `defiFer` :
// deux familles de tours qui savent toucher les volants et révéler les furtifs quand le niveau en compte (dès le niveau 4, les
// Délateurs des régions précédentes reviennent : la tour de tir est alors toujours imposée), et qui varient d'un niveau à l'autre.
// `aretesDepart` est une première estimation proportionnelle au budget de la première vague : l'équilibrage fin est l'objet de la
// tâche d'équilibrage du jalon 4 (`npm run balance`).
import { ennemisDuNiveau, type PlanNiveau } from './plan-niveau';

export const PLANS_REGION8: readonly PlanNiveau[] = [
  {
    numero: 71,
    carte: 'cloitre',
    chemins: [0],
    aretesDepart: 1200,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r8.01.nom',
    ambiance: 'niveau.r8.01.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(8, 1),
      graine: 4071,
      facteurBudget: 0.383,
    },
  },
  {
    numero: 72,
    carte: 'refectoire',
    chemins: [0],
    aretesDepart: 1290,
    defiFer: { familles: ['artillerie', 'magie'] },
    nom: 'niveau.r8.02.nom',
    ambiance: 'niveau.r8.02.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(8, 2),
      graine: 1072,
      facteurBudget: 0.396,
    },
  },
  {
    numero: 73,
    carte: 'scriptorium',
    chemins: [0],
    aretesDepart: 1380,
    defiFer: { familles: ['artillerie', 'caserne'] },
    nom: 'niveau.r8.03.nom',
    ambiance: 'niveau.r8.03.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(8, 3),
      graine: 2073,
      facteurBudget: 0.409,
    },
  },
  {
    numero: 74,
    carte: 'refectoire',
    chemins: [1],
    aretesDepart: 1470,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r8.04.nom',
    ambiance: 'niveau.r8.04.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(8, 4),
      graine: 3074,
      facteurBudget: 0.423,
    },
  },
  {
    numero: 75,
    carte: 'scriptorium',
    chemins: [1],
    aretesDepart: 1560,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r8.05.nom',
    ambiance: 'niveau.r8.05.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(8, 5),
      graine: 4075,
      facteurBudget: 0.436,
    },
  },
  {
    numero: 76,
    carte: 'cloitre',
    chemins: [0],
    aretesDepart: 1650,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r8.06.nom',
    ambiance: 'niveau.r8.06.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(8, 6),
      graine: 1076,
      facteurBudget: 0.45,
    },
  },
  {
    numero: 77,
    carte: 'refectoire',
    chemins: [0, 1],
    aretesDepart: 1740,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r8.07.nom',
    ambiance: 'niveau.r8.07.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(8, 7),
      graine: 2077,
      facteurBudget: 0.464,
    },
  },
  {
    numero: 78,
    carte: 'scriptorium',
    chemins: [0, 1],
    aretesDepart: 1830,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r8.08.nom',
    ambiance: 'niveau.r8.08.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(8, 8),
      graine: 3078,
      facteurBudget: 0.477,
    },
  },
  {
    numero: 79,
    carte: 'refectoire',
    chemins: [0, 1],
    aretesDepart: 1920,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r8.09.nom',
    ambiance: 'niveau.r8.09.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ennemisDuNiveau(8, 9),
      graine: 4079,
      facteurBudget: 0.49,
    },
  },
  {
    numero: 80,
    carte: 'scriptorium',
    chemins: [0, 1],
    aretesDepart: 2010,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r8.10.nom',
    ambiance: 'niveau.r8.10.ambiance',
    vagues: {
      nombre: 15,
      ennemis: ennemisDuNiveau(8, 10),
      graine: 1080,
      facteurBudget: 0.504,
      boss: { vague: 15, ennemi: 'grand_inquisiteur', chemin: 0, delai: 12 },
    },
  },
];
