// Mode infini (jalon 4) : régions, ennemis tirés, élites et mini-boss. Les vagues elles-mêmes sont générées par le moteur
// (src/engine/infini.ts) à partir de ces paramètres et de la graine de la partie. Aucun nombre d'équilibrage ailleurs.
import type { ParametresInfini } from '../engine/definitions';

export const INFINI: ParametresInfini = {
  // Le budget de la vague 1 est celui de la première vague du premier niveau de la campagne (budgetVague(1, 1)).
  niveauBase: 1,
  // Budget de la vague n = budget de la vague 1 × 1,08^(n−1).
  croissance: 1.08,
  regions: [
    { ennemis: ['paysan_affame', 'mendiant', 'chien_errant'], boss: 'boucher_vaudrelle' },
    { ennemis: ['glaneur', 'corbeau_noir', 'epouvantail'], boss: 'la_faim' },
    { ennemis: ['porteur_torche', 'chasseur_sorcieres', 'delateur'], boss: 'juge_flammes' },
    { ennemis: ['noyeur', 'pelerin_voile', 'sangsue'], boss: 'dame_puits' },
    { ennemis: ['rat_peste', 'pestifere', 'medecin_peste'], boss: 'mere_rats' },
    { ennemis: ['fossoyeur', 'creux', 'chauve_souris'], boss: 'roi_fosses' },
    { ennemis: ['fantassin', 'porte_banniere', 'cavalier'], boss: 'prince_croise' },
    { ennemis: ['flagellant', 'inquisiteur', 'exorciste'], boss: 'grand_inquisiteur' },
    { ennemis: ['garde_royal', 'arbaletrier_elite', 'chevalier'], boss: 'roi_fou' },
    { ennemis: ['acolyte_cendre', 'ange_cendre'], boss: 'soleil_bleme' },
  ],
  // Élites à partir de la vague 20 : 10 % des ennemis, 5 points de plus toutes les 10 vagues, au plus 60 %.
  elites: { premiereVague: 20, partDepart: 0.1, partParPalier: 0.05, intervalle: 10, partMax: 0.6 },
  // Mini-boss toutes les 10 vagues : le boss de la région à 30 % de ses PV, 15 points de plus par mini-boss déjà passé.
  miniBoss: { intervalle: 10, pvDepart: 0.3, pvParMiniBoss: 0.15, delai: 5 },
};
