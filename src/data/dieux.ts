// Les trois dieux-chats (classes) : héros, 2 sorts, bonus de famille et tour divine, décrits comme données.
// Les héros eux-mêmes sont dans heros.ts ; ici chaque dieu nomme les siens (l'avatar d'abord).
import type { DefDieu, DefPiege } from '../engine/definitions';
import { capacites } from './capacites';
import { HEROS } from './heros';
import { niveau, soldats } from './tours';

/** Piège des Pièges à Ressort : 60 dégâts physiques, immobilise 1,5 s. */
const PIEGE_A_RESSORT: DefPiege = { degats: 60, typeDegats: 'physique', immobilisation: 1.5, rayon: 0.6 };

// --- Plume, la Dame des Ombres -------------------------------------------------------------------

const plume: DefDieu = {
  nom: 'dieu.plume',
  description: 'dieu.plume.desc',
  heros: HEROS.plume,
  idsHeros: ['plume', 'suie', 'corbeau'],
  sorts: [
    {
      nom: 'sort.voile_de_nuit',
      description: 'sort.voile_de_nuit.desc',
      recharge: 25,
      rechargeInitiale: 15,
      rayon: 3,
      surChemin: false,
      global: false,
      effets: [
        {
          type: 'zone',
          zone: { duree: 10, effets: [{ type: 'ralentissement', chance: 1, duree: 0.2, valeur: 0.4 }], critique: 0.5, volants: true },
        },
      ],
    },
    {
      nom: 'sort.griffes_d_ombre',
      description: 'sort.griffes_d_ombre.desc',
      recharge: 40,
      rechargeInitiale: 20,
      rayon: 1.6,
      surChemin: false,
      global: false,
      effets: [{ type: 'execution', volants: true, fractionBoss: 0.15 }],
    },
  ],
  bonus: { famille: 'tir', pvSoldats: 0, cadence: 0.6, chanceCritique: 0.15, prix: 0, effets: [], piegeAuSol: null },
  tourDivine: niveau({
    nom: 'tour.sanctuaire_de_l_ombre',
    cout: 200,
    portee: 3,
    revele: true,
    soldats: soldats({
      nom: 'unite.assassin_du_sanctuaire',
      nombre: 4,
      pv: 110,
      degats: [18, 26],
      cadence: 0.6,
      vitesse: 3,
      portee: 2.8,
      reapparition: 12,
      capacites: capacites({ ciblable: false, execution: 0.15, voitFurtifs: true }),
    }),
  }),
};

// --- Charlie, le Colosse -------------------------------------------------------------------------

const charlie: DefDieu = {
  nom: 'dieu.charlie',
  description: 'dieu.charlie.desc',
  heros: HEROS.charlie,
  idsHeros: ['charlie', 'mastoc', 'brise_os'],
  sorts: [
    {
      nom: 'sort.chute_du_colosse',
      description: 'sort.chute_du_colosse.desc',
      recharge: 40,
      rechargeInitiale: 10,
      rayon: 1.6,
      surChemin: false,
      global: false,
      effets: [
        { type: 'degats', degats: [50, 80], typeDegats: 'physique', volants: false },
        { type: 'effet', effet: { type: 'etourdissement', chance: 1, duree: 2.5, valeur: 0 }, volants: false },
      ],
    },
    {
      nom: 'sort.renforts',
      description: 'sort.renforts.desc',
      recharge: 20,
      rechargeInitiale: 0,
      rayon: 0.6,
      surChemin: true,
      global: false,
      effets: [
        {
          type: 'invoquer',
          nombre: 2,
          duree: 20,
          unite: {
            nom: 'unite.gros_matou',
            pv: 180,
            degats: [6, 10],
            cadence: 1,
            coups: 1,
            armure: 0.3,
            resistance: 0,
            vitesse: 1.4,
            portee: 1.5,
            capacite: 1,
            effets: [],
          },
        },
      ],
    },
  ],
  bonus: {
    famille: 'caserne',
    pvSoldats: 0.25,
    cadence: 0,
    chanceCritique: 0,
    prix: 0,
    effets: [{ type: 'etourdissement', chance: 0.15, duree: 0.8, valeur: 0 }],
    piegeAuSol: null,
  },
  tourDivine: niveau({
    nom: 'tour.totem_du_colosse',
    cout: 200,
    portee: 2.5,
    cadence: 8,
    degats: [20, 30],
    effets: [{ type: 'etourdissement', chance: 1, duree: 1, valeur: 0 }],
    onde: true,
  }),
};

// --- Pollen, Trois-Pattes ------------------------------------------------------------------------

const pollen: DefDieu = {
  nom: 'dieu.pollen',
  description: 'dieu.pollen.desc',
  heros: HEROS.pollen,
  idsHeros: ['pollen', 'rouage', 'lanterne'],
  sorts: [
    {
      nom: 'sort.pieges_a_ressort',
      description: 'sort.pieges_a_ressort.desc',
      recharge: 30,
      rechargeInitiale: 10,
      rayon: 1.2,
      surChemin: true,
      global: false,
      effets: [{ type: 'pieges', nombre: 4, ecart: 0.9, piege: PIEGE_A_RESSORT }],
    },
    {
      nom: 'sort.ingeniosite',
      description: 'sort.ingeniosite.desc',
      recharge: 50,
      rechargeInitiale: 20,
      rayon: 3,
      surChemin: false,
      global: false,
      effets: [
        { type: 'aretes', montant: 130 },
        { type: 'boost', cadence: 0.8, duree: 10 },
      ],
    },
  ],
  bonus: {
    famille: 'artillerie',
    pvSoldats: 0,
    cadence: 0,
    chanceCritique: 0,
    prix: -0.1,
    effets: [],
    piegeAuSol: { chance: 0.2, piege: { degats: 40, typeDegats: 'physique', immobilisation: 1, rayon: 0.6 } },
  },
  tourDivine: niveau({
    nom: 'tour.atelier_boiteux',
    cout: 200,
    portee: 3.5,
    atelier: {
      constructeur: {
        tourelle: {
          nom: 'unite.tourelle_de_l_atelier',
          portee: 3.5,
          degats: [10, 16],
          cadence: 0.8,
          typeDegats: 'physique',
          volants: true,
          effets: [],
          duree: 30,
        },
        max: 2,
        cadence: 10,
        decalages: [
          { x: -1, y: 0.9 },
          { x: 1, y: 0.9 },
        ],
      },
      pieges: { piege: { degats: 50, typeDegats: 'physique', immobilisation: 1.2, rayon: 0.6 }, cadence: 12, portee: 3.5 },
    },
  }),
};

export const DIEUX = { plume, charlie, pollen } as const satisfies Record<string, DefDieu>;

export type IdDieu = keyof typeof DIEUX;
