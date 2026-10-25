// Compétences des spécialisations de tours : 2 par spécialisation, 3 rangs, achetées en partie avec des arêtes.
// Les clés de textes sont `comptour.<id>` et `comptour.<id>.desc` dans src/i18n/fr.ts. Un rang donne l'effet
// TOTAL de la compétence (le rang 2 remplace le rang 1). Les prix sont ceux du rang 1, 2, 3.
import type { DefCompetenceTour, ModTour, ModUnite } from '../engine/definitions';
import { MOD_UNITE_NUL, rangsTour, type ValeursParRang } from './capacites';

function competenceTour(id: string, cout: readonly [number, number, number], valeurs: ValeursParRang<ModTour>): DefCompetenceTour {
  return { id, nom: `comptour.${id}`, description: `comptour.${id}.desc`, cout, rangs: rangsTour(valeurs) };
}

const unites = (champs: Partial<ModUnite>): ModUnite => ({ ...MOD_UNITE_NUL, ...champs });

/** Les compétences de chaque spécialisation, indexées par `<famille><voie>`. */
export const COMPETENCES_TOURS = {
  // Caserne A, Garde du Cloître : soigne les siens et tient plus longtemps.
  caserneA: [
    competenceTour('benediction', [90, 120, 160], {
      unites: [unites({ regeneration: 1 }), unites({ regeneration: 2.5 }), unites({ regeneration: 4 })],
    }),
    competenceTour('mur', [80, 110, 150], { pvSoldats: [0.15, 0.3, 0.5] }),
  ],
  // Caserne B, Écorcheurs : saignements plus longs, lames plus rapides.
  caserneB: [
    competenceTour('entailles_profondes', [90, 120, 160], {
      effets: [
        [{ type: 'saignement', chance: 0.7, duree: 3.5, valeur: 4 }],
        [{ type: 'saignement', chance: 0.85, duree: 4, valeur: 6 }],
        [{ type: 'saignement', chance: 1, duree: 5, valeur: 8 }],
      ],
    }),
    competenceTour('frenesie', [80, 110, 150], {
      unites: [unites({ cadence: 0.1 }), unites({ cadence: 0.2 }), unites({ cadence: 0.35 })],
    }),
  ],
  // Tir A, Guetteurs des Toits : poison, portée.
  tirA: [
    competenceTour('venin_noir', [90, 120, 160], {
      effets: [
        [{ type: 'poison', chance: 1, duree: 3, valeur: 8 }],
        [{ type: 'poison', chance: 1, duree: 4, valeur: 11 }],
        [{ type: 'poison', chance: 1, duree: 5, valeur: 15 }],
      ],
    }),
    competenceTour('oeil_de_lynx', [80, 110, 150], { portee: [0.4, 0.8, 1.2] }),
  ],
  // Tir B, Arbalétriers du Beffroi : Tir à la tête et Carreau perforant.
  tirB: [
    competenceTour('tir_a_la_tete', [100, 130, 170], { critique: [0.1, 0.2, 0.3] }),
    competenceTour('carreau_perforant', [100, 130, 170], { ignoreArmure: [0.25, 0.5, 0.75] }),
  ],
  // Magie A, Oracle de la Braise : rayon plus dur, brûlure tenace.
  magieA: [
    competenceTour('rayon_concentre', [110, 150, 200], { degats: [0.15, 0.3, 0.5] }),
    competenceTour('braise_tenace', [100, 140, 190], {
      effets: [
        [{ type: 'brulure', chance: 1, duree: 2, valeur: 5 }],
        [{ type: 'brulure', chance: 1, duree: 3, valeur: 8 }],
        [{ type: 'brulure', chance: 1, duree: 4, valeur: 12 }],
      ],
    }),
  ],
  // Magie B, Nécromancien des Neuf Vies : plus de spectres, plus durs.
  magieB: [
    competenceTour('legion', [110, 150, 200], { spectres: [1, 2, 3] }),
    competenceTour('os_durcis', [100, 140, 190], {
      unites: [unites({ pv: 0.25, degats: 0.2 }), unites({ pv: 0.5, degats: 0.4 }), unites({ pv: 0.8, degats: 0.6 })],
    }),
  ],
  // Artillerie A, Mortier de Soufre : Nappe de soufre et Charge lourde.
  artillerieA: [
    competenceTour('nappe_de_soufre', [120, 160, 210], {
      nappe: [
        { rayon: 1, duree: 3, critique: 0, volants: false, effets: [{ type: 'brulure', chance: 1, duree: 0.6, valeur: 4 }] },
        { rayon: 1.2, duree: 5, critique: 0, volants: false, effets: [{ type: 'brulure', chance: 1, duree: 0.6, valeur: 6 }] },
        { rayon: 1.4, duree: 7, critique: 0, volants: false, effets: [{ type: 'brulure', chance: 1, duree: 0.6, valeur: 9 }] },
      ],
    }),
    competenceTour('charge_lourde', [110, 150, 200], { degats: [0.15, 0.3, 0.5], zone: [0, 0.1, 0.2] }),
  ],
  // Artillerie B, Baliste à Chaînes : chaînes plus longues, entraves plus serrées.
  artillerieB: [
    competenceTour('chaines_longues', [110, 150, 200], { chaine: [1, 2, 3] }),
    competenceTour('entraves', [100, 140, 190], {
      effets: [
        [{ type: 'ralentissement', chance: 1, duree: 2.5, valeur: 0.4 }],
        [{ type: 'ralentissement', chance: 1, duree: 3, valeur: 0.3 }],
        [{ type: 'ralentissement', chance: 1, duree: 3.5, valeur: 0.2 }],
      ],
    }),
  ],
} as const satisfies Record<string, readonly DefCompetenceTour[]>;
