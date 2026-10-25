// Objets consommables : emportés avant un niveau (3 emplacements), un emplacement ne sert qu'une fois par partie.
// `prix` et `stockMax` servent hors partie (boutique en arêtes) ; le reste décrit l'effet en partie.
import type { DefObjet } from '../engine/definitions';

export const OBJETS = {
  /** Zone de soufre : 150 dégâts purs aux ennemis au sol. */
  fiole_soufre: {
    nom: 'objet.fiole_soufre',
    description: 'objet.fiole_soufre.desc',
    prix: 60,
    stockMax: 10,
    rayon: 1.8,
    surChemin: false,
    global: false,
    effets: [{ type: 'degats', degats: [150, 150], typeDegats: 'pur', volants: false }],
  },
  /** Rend 5 vies (sans dépasser les vies de départ). */
  herbe_sabbat: {
    nom: 'objet.herbe_sabbat',
    description: 'objet.herbe_sabbat.desc',
    prix: 80,
    stockMax: 10,
    rayon: 0,
    surChemin: false,
    global: true,
    effets: [{ type: 'vies', nombre: 5 }],
  },
  /** Un chat soldat fort sur le chemin pendant 30 s. */
  griffe_renfort: {
    nom: 'objet.griffe_renfort',
    description: 'objet.griffe_renfort.desc',
    prix: 60,
    stockMax: 10,
    rayon: 0.6,
    surChemin: true,
    global: false,
    effets: [
      {
        type: 'invoquer',
        nombre: 1,
        duree: 30,
        unite: {
          nom: 'unite.chat_de_renfort',
          pv: 350,
          degats: [14, 20],
          cadence: 0.9,
          coups: 1,
          armure: 0.3,
          resistance: 0,
          vitesse: 1.6,
          portee: 1.8,
          capacite: 2,
          effets: [],
        },
      },
    ],
  },
  /** Gèle tous les ennemis ordinaires 5 s ; un boss est seulement ralenti. */
  sablier: {
    nom: 'objet.sablier',
    description: 'objet.sablier.desc',
    prix: 100,
    stockMax: 10,
    rayon: 0,
    surChemin: false,
    global: true,
    effets: [
      { type: 'effet', effet: { type: 'etourdissement', chance: 1, duree: 5, valeur: 0 }, volants: true, cibles: 'non_boss' },
      { type: 'effet', effet: { type: 'ralentissement', chance: 1, duree: 5, valeur: 0.4 }, volants: true, cibles: 'boss' },
    ],
  },
} as const satisfies Record<string, DefObjet>;

export type IdObjet = keyof typeof OBJETS;

