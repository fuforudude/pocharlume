// Capacités de famille par campagne (docs/specs/2026-11-12-dlc-temps-modernes-campagne.md, décision technique 2) : les tours
// gardent leurs stats d'origine, et chaque famille gagne dans la campagne `moderne` la capacité décrite ici. La campagne
// `histoire` n'en a aucune. Chiffres de départ modestes, à régler au simulateur.
import type { CapacitesCampagne, IdCampagne } from '../engine/definitions';

export const CAPACITES_CAMPAGNE: Readonly<Record<IdCampagne, CapacitesCampagne>> = {
  histoire: {},
  moderne: {
    /** Barricade, « Piquet » : −25 % de dégâts subis tant que deux soldats de la caserne au moins retiennent des ennemis. */
    caserne: { type: 'piquet', reduction: 0.25, soldats: 2 },
    /** Perchoir, « Renvoi » : dissipe les nuages à portée et renvoie un tir de LBD sur trois (le tireur est étourdi 2 s). */
    tir: { type: 'renvoi', chaque: 3, etourdissement: 2 },
    /** Sono, « Sono » : −15 % de vitesse aux ennemis à portée de la tour, volants compris. */
    magie: { type: 'sono', rayon: 1, ralentissement: 0.15, volants: true },
    /** Engin bricolé, « Perçage » : les pavés passent le bouclier frontal et ignorent 30 % de l'armure en plus. */
    artillerie: { type: 'percage', ignoreArmure: 0.3 },
  },
};
