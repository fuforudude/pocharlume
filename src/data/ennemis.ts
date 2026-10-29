// Ennemis : région 1 (le Village Affamé), puis régions 2 à 5 (les Champs Brûlés, le Bourg des Bûchers, les Marais de
// l'Ordalie, la Ville Pestiférée) et 6 à 10 (le Charnier, la Croisade, le Monastère Noir, la Cité du Roi, la Cathédrale du
// Soleil Blême) avec leurs mécaniques (`pouvoirs`) et leurs boss.
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
    pouvoirs: { degatsHeros: 2 },
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
    pouvoirs: { noyade: { delai: 3 } },
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
    pouvoirs: { nuage: { rayon: 1.5, duree: 3, degats: 6 } },
  }),
  /** Soigne de 5 % de leurs PV maximaux les ennemis proches toutes les 4 s. */
  medecin_peste: ennemi({
    nom: 'ennemi.medecin_peste',
    pv: 70,
    vitesse: 0.8,
    resistance: 0.3,
    degats: [1, 2],
    cadence: 1.3,
    coutVies: 1,
    prime: 14,
    pouvoirs: { soin: { rayon: 2.5, quantite: 0.05, cadence: 4 } },
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
  // --- Région 6 : le Charnier ----------------------------------------------------------------------
  /** Un soldat tué à 2 tuiles de lui met deux fois plus de temps à réapparaître. */
  fossoyeur: ennemi({
    nom: 'ennemi.fossoyeur',
    pv: 110,
    vitesse: 0.8,
    degats: [5, 8],
    cadence: 1.4,
    coutVies: 1,
    prime: 14,
    pouvoirs: { enterrement: { rayon: 2, facteur: 2 } },
  }),
  /** Se relève une fois avec 50 % de ses PV, sauf s'il meurt de dégâts magiques. */
  creux: ennemi({
    nom: 'ennemi.creux',
    pv: 80,
    vitesse: 1,
    degats: [4, 6],
    cadence: 1.2,
    coutVies: 1,
    prime: 11,
    pouvoirs: { relevement: { fois: 1, pv: 0.5, delai: 1.5, sauf: 'magique' } },
  }),
  /** Volante, par groupes de 5, rapide et fragile. */
  chauve_souris: ennemi({
    nom: 'ennemi.chauve_souris',
    pv: 18,
    vitesse: 2,
    volant: true,
    degats: [1, 2],
    cadence: 0.9,
    coutVies: 1,
    prime: 3,
    pouvoirs: { essaim: 5 },
  }),
  /** Toutes les 15 s, relève les 4 derniers ennemis morts à 50 % de leurs PV. */
  roi_fosses: ennemi({
    nom: 'ennemi.roi_fosses',
    pv: 6000,
    vitesse: 0.4,
    armure: 0.3,
    resistance: 0.3,
    degats: [28, 45],
    cadence: 1.6,
    coutVies: 12,
    prime: 280,
    boss: true,
    insensibleEtourdissement: true,
    pouvoirs: { periodiques: [{ cadence: 15, actions: [{ type: 'relever_morts', nombre: 4, pv: 0.5 }] }] },
  }),

  // --- Région 7 : la Croisade ----------------------------------------------------------------------
  /** Armure 60 %. */
  fantassin: ennemi({ nom: 'ennemi.fantassin', pv: 120, vitesse: 0.9, armure: 0.6, degats: [5, 8], cadence: 1.3, coutVies: 1, prime: 14 }),
  /** Aura : +25 % de vitesse aux ennemis à 2 tuiles (non cumulable). */
  porte_banniere: ennemi({
    nom: 'ennemi.porte_banniere',
    pv: 100,
    vitesse: 0.9,
    armure: 0.3,
    degats: [3, 5],
    cadence: 1.3,
    coutVies: 1,
    prime: 16,
    pouvoirs: { aura: { rayon: 2, vitesse: 0.25 } },
  }),
  /** Très rapide, armure 30 % ; renverse le premier soldat qui le bloque (étourdi 2 s) et passe. */
  cavalier: ennemi({
    nom: 'ennemi.cavalier',
    pv: 130,
    vitesse: 2,
    armure: 0.3,
    degats: [6, 9],
    cadence: 1.3,
    coutVies: 1,
    prime: 18,
    pouvoirs: { renversement: { etourdissement: 2 } },
  }),
  /** Charge toutes les 10 s (vitesse ×3 pendant 2 s, ignore les soldats) et porte l'aura du Porte-Bannière à 3 tuiles. */
  prince_croise: ennemi({
    nom: 'ennemi.prince_croise',
    pv: 8000,
    vitesse: 0.45,
    armure: 0.3,
    resistance: 0.3,
    degats: [30, 48],
    cadence: 1.6,
    coutVies: 12,
    prime: 300,
    boss: true,
    insensibleEtourdissement: true,
    pouvoirs: {
      aura: { rayon: 3, vitesse: 0.25 },
      periodiques: [{ cadence: 10, actions: [{ type: 'charger', duree: 2, vitesse: 3 }] }],
    },
  }),

  // --- Région 8 : le Monastère Noir ----------------------------------------------------------------
  /** Sous 50 % de PV, +50 % de vitesse et de dégâts. */
  flagellant: ennemi({
    nom: 'ennemi.flagellant',
    pv: 150,
    vitesse: 0.9,
    degats: [6, 9],
    cadence: 1.2,
    coutVies: 1,
    prime: 16,
    pouvoirs: { rage: { pv: 0.5, vitesse: 0.5, degats: 0.5 } },
  }),
  /** Fige la tour la plus proche à 2,5 tuiles pendant 3 s, toutes les 8 s. */
  inquisiteur: ennemi({
    nom: 'ennemi.inquisiteur',
    pv: 90,
    vitesse: 0.8,
    degats: [3, 5],
    cadence: 1.3,
    coutVies: 1,
    prime: 18,
    pouvoirs: { periodiques: [{ cadence: 8, actions: [{ type: 'figer_tour', nombre: 1, duree: 3, rayon: 2.5 }] }] },
  }),
  /** Résistance magique 30 % ; toutes les 6 s, tue une invocation à 2 tuiles ou étourdit le héros 2 s. */
  exorciste: ennemi({
    nom: 'ennemi.exorciste',
    pv: 110,
    vitesse: 0.8,
    resistance: 0.3,
    degats: [2, 4],
    cadence: 1.3,
    coutVies: 1,
    prime: 20,
    pouvoirs: { periodiques: [{ cadence: 6, actions: [{ type: 'bannir', rayon: 2, etourdissement: 2 }] }] },
  }),
  /** Fige les 2 tours les plus proches pendant 4 s toutes les 10 s ; insensible aux ralentissements. */
  grand_inquisiteur: ennemi({
    nom: 'ennemi.grand_inquisiteur',
    pv: 10000,
    vitesse: 0.4,
    armure: 0.3,
    resistance: 0.3,
    degats: [32, 50],
    cadence: 1.6,
    coutVies: 12,
    prime: 340,
    boss: true,
    insensibleEtourdissement: true,
    pouvoirs: {
      insensibleRalentissement: true,
      periodiques: [{ cadence: 10, actions: [{ type: 'figer_tour', nombre: 2, duree: 4 }] }],
    },
  }),

  // --- Région 9 : la Cité du Roi -------------------------------------------------------------------
  /** Armure 90 %, lent. */
  garde_royal: ennemi({ nom: 'ennemi.garde_royal', pv: 200, vitesse: 0.6, armure: 0.9, degats: [7, 10], cadence: 1.4, coutVies: 1, prime: 22 }),
  /** Tire sur les soldats et le héros à 3,5 tuiles. */
  arbaletrier_elite: ennemi({
    nom: 'ennemi.arbaletrier_elite',
    pv: 100,
    vitesse: 0.9,
    degats: [2, 3],
    cadence: 1.3,
    distance: { portee: 3.5, degats: [7, 10], cadence: 1.6, typeDegats: 'physique' },
    coutVies: 1,
    prime: 20,
  }),
  /** Rapide, armure 60 %, résistance magique 30 %. */
  chevalier: ennemi({
    nom: 'ennemi.chevalier',
    pv: 170,
    vitesse: 1.6,
    armure: 0.6,
    resistance: 0.3,
    degats: [8, 12],
    cadence: 1.3,
    coutVies: 1,
    prime: 26,
  }),
  /** À 75, 50 et 25 % de PV, appelle 4 Gardes Royaux et devient invulnérable 3 s. */
  roi_fou: ennemi({
    nom: 'ennemi.roi_fou',
    pv: 12000,
    vitesse: 0.4,
    armure: 0.3,
    resistance: 0.3,
    degats: [34, 52],
    cadence: 1.6,
    coutVies: 12,
    prime: 380,
    boss: true,
    insensibleEtourdissement: true,
    pouvoirs: {
      paliers: [0.75, 0.5, 0.25].map((pv) => ({
        pv,
        actions: [
          { type: 'invoquer', ennemi: 'garde_royal', nombre: 4, ecart: 0.5 },
          { type: 'invulnerabilite', duree: 3 },
        ],
      })),
    },
  }),

  // --- Région 10 : la Cathédrale du Soleil Blême ---------------------------------------------------
  /** Résistance magique 30 % ; invoque 2 Creux toutes les 8 s. */
  acolyte_cendre: ennemi({
    nom: 'ennemi.acolyte_cendre',
    pv: 140,
    vitesse: 0.8,
    resistance: 0.3,
    degats: [4, 6],
    cadence: 1.3,
    coutVies: 1,
    prime: 24,
    pouvoirs: { periodiques: [{ cadence: 12, actions: [{ type: 'invoquer', ennemi: 'creux', nombre: 1, ecart: 0.5 }] }] },
  }),
  /** Volant, armure 30 %, résistance magique 60 %. */
  ange_cendre: ennemi({
    nom: 'ennemi.ange_cendre',
    pv: 160,
    vitesse: 1.2,
    armure: 0.3,
    resistance: 0.6,
    volant: true,
    degats: [6, 9],
    cadence: 1.2,
    coutVies: 1,
    prime: 26,
  }),
  /**
   * Trois phases. Jusqu'à 66 % de PV, aveugle les tours à 4 tuiles (portée −30 % pendant 4 s, toutes les 12 s) ; jusqu'à 33 %,
   * appelle 2 Anges de Cendre toutes les 10 s ; ensuite, cadence −30 % aux tours à 4 tuiles tant qu'il vit (renouvelée chaque seconde).
   */
  soleil_bleme: ennemi({
    nom: 'ennemi.soleil_bleme',
    pv: 16000,
    vitesse: 0.35,
    armure: 0.3,
    resistance: 0.3,
    degats: [38, 58],
    cadence: 1.6,
    coutVies: 12,
    prime: 450,
    boss: true,
    insensibleEtourdissement: true,
    pouvoirs: {
      periodiques: [
        { cadence: 12, phase: [1, 0.66], actions: [{ type: 'aveugler', rayon: 4, portee: 0.3, duree: 4 }] },
        { cadence: 10, phase: [0.66, 0.33], actions: [{ type: 'invoquer', ennemi: 'ange_cendre', nombre: 2, ecart: 0.5 }] },
        { cadence: 1, phase: [0.33, 0], actions: [{ type: 'affamer', rayon: 4, cadence: 0.3, duree: 1.5 }] },
      ],
    },
  }),
} as const satisfies Record<string, DefEnnemi>;

export type IdEnnemi = keyof typeof ENNEMIS;
