// Ennemis : région 1 (le Village Affamé), puis régions 2 à 5 (les Champs Brûlés, le Bourg des Bûchers, les Marais de
// l'Ordalie, la Ville Pestiférée) avec leurs mécaniques (`pouvoirs`) et leurs boss.
// Valeurs de départ cohérentes avec la formule de menace (`menaceEnnemi`) ; l'équilibrage fin vient du simulateur.
import type { DefEnnemi } from '../engine/definitions';

/** Ennemi ordinaire au sol : les champs qu'un ennemi ne précise pas gardent ces valeurs. */
const DEFAUT = {
  armure: 0,
  resistance: 0,
  volant: false,
  furtif: false,
  distance: null,
  boss: false,
  insensibleEtourdissement: false,
  devore: 0,
} as const;

type ChampsEnnemi = Pick<DefEnnemi, 'nom' | 'pv' | 'vitesse' | 'degats' | 'cadence' | 'coutVies' | 'prime'> & Partial<DefEnnemi>;

function ennemi(champs: ChampsEnnemi): DefEnnemi {
  return { ...DEFAUT, ...champs };
}

export const ENNEMIS = {
  paysan_affame: {
    nom: 'ennemi.paysan_affame',
    pv: 40,
    vitesse: 0.9,
    armure: 0,
    resistance: 0,
    volant: false,
    furtif: false,
    degats: [2, 4],
    cadence: 1,
    distance: null,
    coutVies: 1,
    prime: 6,
    boss: false,
    insensibleEtourdissement: false,
    devore: 0,
  },
  mendiant: {
    nom: 'ennemi.mendiant',
    pv: 22,
    vitesse: 1.4,
    armure: 0,
    resistance: 0,
    volant: false,
    furtif: false,
    degats: [1, 2],
    cadence: 0.8,
    distance: null,
    coutVies: 1,
    prime: 4,
    boss: false,
    insensibleEtourdissement: false,
    devore: 0,
  },
  chien_errant: {
    nom: 'ennemi.chien_errant',
    pv: 30,
    vitesse: 2.2,
    armure: 0,
    resistance: 0,
    volant: false,
    furtif: false,
    degats: [2, 3],
    cadence: 0.7,
    distance: null,
    coutVies: 1,
    prime: 6,
    boss: false,
    insensibleEtourdissement: false,
    devore: 0,
  },
  boucher_vaudrelle: {
    nom: 'ennemi.boucher_vaudrelle',
    pv: 1500,
    vitesse: 0.45,
    armure: 0.6,
    resistance: 0.3,
    volant: false,
    furtif: false,
    degats: [20, 35],
    cadence: 1.5,
    distance: null,
    coutVies: 10,
    prime: 150,
    boss: true,
    insensibleEtourdissement: true,
    devore: 8,
  },

  // --- Région 2 : les Champs Brûlés ---------------------------------------------------------------
  /** Archer : tire de loin sur les soldats et le héros. */
  glaneur: ennemi({
    nom: 'ennemi.glaneur',
    pv: 34,
    vitesse: 0.9,
    degats: [1, 2],
    cadence: 1.2,
    distance: { portee: 2, degats: [3, 5], cadence: 1.4, typeDegats: 'physique' },
    coutVies: 1,
    prime: 7,
  }),
  /** Volant et rapide : ni la caserne ni l'artillerie ne l'atteignent. */
  corbeau_noir: ennemi({ nom: 'ennemi.corbeau_noir', pv: 24, vitesse: 1.8, volant: true, degats: [1, 2], cadence: 1, coutVies: 1, prime: 6 }),
  /** Se relève une fois avec 40 % de ses PV. */
  epouvantail: ennemi({
    nom: 'ennemi.epouvantail',
    pv: 55,
    vitesse: 0.7,
    degats: [3, 5],
    cadence: 1.3,
    coutVies: 1,
    prime: 9,
    pouvoirs: { relevement: { fois: 1, pv: 0.4, delai: 1.5 } },
  }),
  /** Chaque quart de PV perdu affame les tours à portée (cadence −30 % pendant 5 s). */
  la_faim: ennemi({
    nom: 'ennemi.la_faim',
    pv: 2200,
    vitesse: 0.4,
    armure: 0.3,
    resistance: 0.3,
    degats: [25, 40],
    cadence: 1.6,
    coutVies: 12,
    prime: 180,
    boss: true,
    insensibleEtourdissement: true,
    pouvoirs: {
      paliers: [0.75, 0.5, 0.25].map((pv) => ({ pv, actions: [{ type: 'affamer', rayon: 5, cadence: 0.3, duree: 5 }] })),
    },
  }),

  // --- Région 3 : le Bourg des Bûchers -------------------------------------------------------------
  /** Brûle les soldats au contact (dégâts sur 3 s). */
  porteur_torche: ennemi({
    nom: 'ennemi.porteur_torche',
    pv: 48,
    vitesse: 1,
    degats: [3, 5],
    cadence: 1.2,
    coutVies: 1,
    prime: 8,
    pouvoirs: { brulure: { duree: 3, degats: 4 } },
  }),
  /** Armure moyenne, double dégâts contre le héros. */
  chasseur_sorcieres: ennemi({
    nom: 'ennemi.chasseur_sorcieres',
    pv: 70,
    vitesse: 0.9,
    armure: 0.3,
    degats: [4, 6],
    cadence: 1.3,
    coutVies: 1,
    prime: 11,
    pouvoirs: { degatsHeros: 1.5 },
  }),
  /** Furtif : invisible des tours, soldats et héros qui ne révèlent pas. */
  delateur: ennemi({ nom: 'ennemi.delateur', pv: 30, vitesse: 1.3, furtif: true, degats: [1, 2], cadence: 1, coutVies: 1, prime: 8 }),
  /** Met le feu à la tour la plus proche toutes les 12 s (4 s hors service) et appelle 3 Porteurs de Torche à 50 % de PV. */
  juge_flammes: ennemi({
    nom: 'ennemi.juge_flammes',
    pv: 3000,
    vitesse: 0.45,
    armure: 0.3,
    resistance: 0.3,
    degats: [22, 38],
    cadence: 1.6,
    coutVies: 12,
    prime: 200,
    boss: true,
    insensibleEtourdissement: true,
    pouvoirs: {
      periodiques: [{ cadence: 12, actions: [{ type: 'desactiver_tour', duree: 4 }] }],
      paliers: [{ pv: 0.5, actions: [{ type: 'invoquer', ennemi: 'porteur_torche', nombre: 3, ecart: 0.4 }] }],
    },
  }),

  // --- Région 4 : les Marais de l'Ordalie ----------------------------------------------------------
  /** Entraîne un soldat bloquant sous l'eau : il le tue en 3 s s'il n'est pas tué avant. */
  noyeur: ennemi({
    nom: 'ennemi.noyeur',
    pv: 85,
    vitesse: 0.8,
    armure: 0.3,
    degats: [4, 7],
    cadence: 1.4,
    coutVies: 1,
    prime: 11,
    pouvoirs: { noyade: { delai: 5 } },
  }),
  /** Résistance magique 60 %. */
  pelerin_voile: ennemi({
    nom: 'ennemi.pelerin_voile',
    pv: 55,
    vitesse: 0.9,
    resistance: 0.6,
    degats: [2, 4],
    cadence: 1.3,
    coutVies: 1,
    prime: 10,
  }),
  /** Essaim de 6, fragile : draine 1 PV/s du soldat qu'elle touche. */
  sangsue: ennemi({
    nom: 'ennemi.sangsue',
    pv: 14,
    vitesse: 1.3,
    degats: [1, 1],
    cadence: 1,
    coutVies: 1,
    prime: 2,
    pouvoirs: { essaim: 6, drain: { degats: 1, soin: 1 } },
  }),
  /** Plonge à 66 % et 33 % de PV (intouchable 3 s, réapparaît 3 tuiles plus loin) et appelle 6 Sangsues à chaque plongée. */
  dame_puits: ennemi({
    nom: 'ennemi.dame_puits',
    pv: 3400,
    vitesse: 0.5,
    armure: 0.3,
    resistance: 0.3,
    degats: [24, 40],
    cadence: 1.6,
    coutVies: 12,
    prime: 220,
    boss: true,
    insensibleEtourdissement: true,
    pouvoirs: {
      paliers: [0.66, 0.33].map((pv) => ({
        pv,
        actions: [
          { type: 'plonger', duree: 3, saut: 3 },
          { type: 'invoquer', ennemi: 'sangsue', nombre: 6, ecart: 0.3 },
        ],
      })),
    },
  }),

  // --- Région 5 : la Ville Pestiférée --------------------------------------------------------------
  /** Essaim de 8, très rapide, coût en vies 1. */
  rat_peste: ennemi({
    nom: 'ennemi.rat_peste',
    pv: 12,
    vitesse: 2.6,
    degats: [1, 2],
    cadence: 0.8,
    coutVies: 1,
    prime: 2,
    pouvoirs: { essaim: 8 },
  }),
  /** Laisse un nuage toxique de 3 s en mourant (blesse soldats et héros). */
  pestifere: ennemi({
    nom: 'ennemi.pestifere',
    pv: 90,
    vitesse: 0.9,
    degats: [3, 5],
    cadence: 1.2,
    coutVies: 1,
    prime: 10,
    pouvoirs: { nuage: { rayon: 1.5, duree: 3, degats: 4 } },
  }),
  /** Soigne de 5 % de leurs PV maximaux les ennemis proches toutes les 4 s. */
  medecin_peste: ennemi({
    nom: 'ennemi.medecin_peste',
    pv: 55,
    vitesse: 0.8,
    resistance: 0.15,
    degats: [1, 2],
    cadence: 1.3,
    coutVies: 1,
    prime: 14,
    pouvoirs: { soin: { rayon: 2.5, quantite: 0.02, cadence: 5 } },
  }),
  /** Pond un groupe de 4 Rats de Peste toutes les 6 s. */
  mere_rats: ennemi({
    nom: 'ennemi.mere_rats',
    pv: 4600,
    vitesse: 0.4,
    armure: 0.3,
    resistance: 0.3,
    degats: [26, 42],
    cadence: 1.6,
    coutVies: 12,
    prime: 250,
    boss: true,
    insensibleEtourdissement: true,
    pouvoirs: { periodiques: [{ cadence: 6, actions: [{ type: 'invoquer', ennemi: 'rat_peste', nombre: 4, ecart: 0.3 }] }] },
  }),
} as const satisfies Record<string, DefEnnemi>;

export type IdEnnemi = keyof typeof ENNEMIS;
