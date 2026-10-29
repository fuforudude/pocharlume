// Plan des 10 niveaux de la région 6, du Charnier (niveaux 51 à 60 de la campagne).
// Comme les régions 2 à 5 (plan-region5.ts) : les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans
// vagues-region6.ts. Trois cartes (cartes-region6.ts) : la première n'a qu'un chemin, les deux autres en ont deux ; un niveau en
// emprunte un seul ou les deux, et ne garde que ces chemins. Les ennemis viennent de `ennemisDuNiveau` (plan-niveau.ts) : ceux de
// la région, puis dès le niveau 4 ceux des régions précédentes. Le niveau 10 est le combat contre le Roi des Fosses. `defiFer` :
// deux familles de tours qui savent toucher les volants et révéler les furtifs quand le niveau en compte (dès le niveau 4, les
// Délateurs des régions précédentes reviennent : la tour de tir est alors toujours imposée), et qui varient d'un niveau à l'autre.
// `aretesDepart` est une première estimation proportionnelle au budget de la première vague : l'équilibrage fin est l'objet de la
// tâche d'équilibrage du jalon 4 (`npm run balance`).
import { ennemisDuNiveau, type PlanNiveau } from './plan-niveau';

export const PLANS_REGION6: readonly PlanNiveau[] = [
  {
    numero: 51,
    carte: 'fossoyage',
    chemins: [0],
    aretesDepart: 900,
    defiFer: { familles: ['artillerie', 'caserne'] },
    nom: 'niveau.r6.01.nom',
    ambiance: 'niveau.r6.01.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(6, 1),
      graine: 4051,
      facteurBudget: 0.979,
    },
  },
  {
    numero: 52,
    carte: 'tertres',
    chemins: [0],
    aretesDepart: 970,
    defiFer: { familles: ['artillerie', 'magie'] },
    nom: 'niveau.r6.02.nom',
    ambiance: 'niveau.r6.02.ambiance',
    vagues: {
      nombre: 10,
      ennemis: ennemisDuNiveau(6, 2),
      graine: 1052,
      facteurBudget: 0.618,
    },
  },
  {
    numero: 53,
    carte: 'ossuaire',
    chemins: [0],
    aretesDepart: 1040,
    defiFer: { familles: ['caserne', 'magie'] },
    nom: 'niveau.r6.03.nom',
    ambiance: 'niveau.r6.03.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(6, 3),
      graine: 2053,
      facteurBudget: 0.639,
    },
  },
  {
    numero: 54,
    carte: 'tertres',
    chemins: [1],
    aretesDepart: 1110,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r6.04.nom',
    ambiance: 'niveau.r6.04.ambiance',
    vagues: {
      nombre: 11,
      ennemis: ennemisDuNiveau(6, 4),
      graine: 3054,
      facteurBudget: 0.402,
    },
  },
  {
    numero: 55,
    carte: 'ossuaire',
    chemins: [1],
    aretesDepart: 1180,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r6.05.nom',
    ambiance: 'niveau.r6.05.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(6, 5),
      graine: 4055,
      facteurBudget: 0.873,
    },
  },
  {
    numero: 56,
    carte: 'fossoyage',
    chemins: [0],
    aretesDepart: 1250,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r6.06.nom',
    ambiance: 'niveau.r6.06.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ennemisDuNiveau(6, 6),
      graine: 1056,
      facteurBudget: 0.702,
    },
  },
  {
    numero: 57,
    carte: 'tertres',
    chemins: [0, 1],
    aretesDepart: 1320,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r6.07.nom',
    ambiance: 'niveau.r6.07.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(6, 7),
      graine: 2057,
      facteurBudget: 0.927,
    },
  },
  {
    numero: 58,
    carte: 'ossuaire',
    chemins: [0, 1],
    aretesDepart: 1390,
    defiFer: { familles: ['magie', 'tir'] },
    nom: 'niveau.r6.08.nom',
    ambiance: 'niveau.r6.08.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ennemisDuNiveau(6, 8),
      graine: 3058,
      facteurBudget: 0.954,
    },
  },
  {
    numero: 59,
    carte: 'tertres',
    chemins: [0, 1],
    aretesDepart: 1460,
    defiFer: { familles: ['caserne', 'tir'] },
    nom: 'niveau.r6.09.nom',
    ambiance: 'niveau.r6.09.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ennemisDuNiveau(6, 9),
      graine: 4059,
      facteurBudget: 0.466,
    },
  },
  {
    numero: 60,
    carte: 'ossuaire',
    chemins: [0, 1],
    aretesDepart: 1530,
    defiFer: { familles: ['artillerie', 'tir'] },
    nom: 'niveau.r6.10.nom',
    ambiance: 'niveau.r6.10.ambiance',
    vagues: {
      nombre: 15,
      ennemis: ennemisDuNiveau(6, 10),
      graine: 1060,
      facteurBudget: 0.786,
      boss: { vague: 15, ennemi: 'roi_fosses', chemin: 0, delai: 12 },
    },
  },
];
