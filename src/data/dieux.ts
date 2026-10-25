// Les dieux-chats (classes) : héros, 2 sorts, bonus de famille et tour divine, décrits comme données.
// Jalon 1 : Charlie seul. Plume et Pollen s'ajouteront ici au jalon 2.
import type { DefDieu } from '../engine/definitions';

const charlie: DefDieu = {
  nom: 'dieu.charlie',
  heros: {
    nom: 'heros.charlie',
    pv: 420,
    pvParNiveau: 40,
    degats: [14, 22],
    degatsParNiveau: 2,
    cadence: 1.5,
    armure: 0.3,
    resistance: 0,
    vitesse: 1.5,
    portee: 1.8,
    capacite: 1,
    effets: [],
    zone: { rayon: 1, effets: [{ type: 'etourdissement', chance: 0.35, duree: 1, valeur: 0 }] },
  },
  sorts: [
    {
      nom: 'sort.chute_du_colosse',
      recharge: 40,
      rechargeInitiale: 10,
      rayon: 1.6,
      surChemin: false,
      effets: [
        { type: 'degats', degats: [50, 80], typeDegats: 'physique', volants: false },
        { type: 'effet', effet: { type: 'etourdissement', chance: 1, duree: 2.5, valeur: 0 }, volants: false },
      ],
    },
    {
      nom: 'sort.renforts',
      recharge: 20,
      rechargeInitiale: 0,
      rayon: 0.6,
      surChemin: true,
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
  },
  tourDivine: {
    nom: 'tour.totem_du_colosse',
    cout: 200,
    portee: 2.5,
    cadence: 6,
    degats: [20, 30],
    typeDegats: 'physique',
    projectile: 0,
    zone: 0,
    volants: false,
    effets: [{ type: 'etourdissement', chance: 1, duree: 1.5, valeur: 0 }],
    critique: null,
    revele: false,
    chaine: null,
    soldats: null,
    spectres: null,
    onde: true,
  },
};

export const DIEUX = { charlie } as const satisfies Record<string, DefDieu>;

export type IdDieu = keyof typeof DIEUX;
