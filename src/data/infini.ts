// Mode infini (jalon 4) : régions, ennemis tirés, élites et mini-boss. Les vagues elles-mêmes sont générées par le moteur
// (src/engine/infini.ts) à partir de ces paramètres et de la graine de la partie. Aucun nombre d'équilibrage ailleurs.
import type { ParametresInfini } from '../engine/definitions';
import type { IdCarte } from './niveaux/cartes-toutes';

/**
 * Les cartes d'après l'histoire qui rejoignent l'infini, sans leur gimmick (spec : 1 ou 2 par région). Les autres cartes des régions
 * 11 et suivantes ne s'y jouent pas, même gagnées en campagne. Région 11 : la plus simple de chaque bloc (Vol de Corbeaux, Radeau).
 */
export const CARTES_INFINI_APRES_HISTOIRE: readonly IdCarte[] = ['greve', 'eau_morte'];

export const INFINI: ParametresInfini = {
  // Le budget de la vague 1 est celui de la première vague du premier niveau de la campagne (budgetVague(1, 1)).
  niveauBase: 1,
  // Budget de la vague n = budget de la vague 1 × 1,22^(n−1) (1,08 avant le réglage du jalon 4 : trop doux, voir la spec).
  croissance: 1.22,
  // Au plus 200 ennemis par vague (mini-boss à part) : au-delà, le surplus de budget gonfle les PV de la vague (voir engine/infini.ts).
  ennemisMaxParVague: 200,
  // Chaque région tire ses trois ennemis ordinaires (deux pour la dixième) puis ses deux nouveaux (spec « variété »).
  regions: [
    { ennemis: ['paysan_affame', 'mendiant', 'chien_errant', 'coupe_bourse', 'grand_manteau'], boss: 'boucher_vaudrelle' },
    { ennemis: ['glaneur', 'corbeau_noir', 'epouvantail', 'gerbe_ardente', 'porte_herse'], boss: 'la_faim' },
    { ennemis: ['porteur_torche', 'chasseur_sorcieres', 'delateur', 'fagotier', 'crieur_public'], boss: 'juge_flammes' },
    { ennemis: ['noyeur', 'pelerin_voile', 'sangsue', 'crapaud_gonfle', 'lueur_marais'], boss: 'dame_puits' },
    { ennemis: ['rat_peste', 'pestifere', 'medecin_peste', 'montreur_rats', 'bubonneux'], boss: 'mere_rats' },
    { ennemis: ['fossoyeur', 'creux', 'chauve_souris', 'deterreur', 'fagot_os'], boss: 'roi_fosses' },
    { ennemis: ['fantassin', 'porte_banniere', 'cavalier', 'sapeur', 'aumonier'], boss: 'prince_croise' },
    { ennemis: ['flagellant', 'inquisiteur', 'exorciste', 'chantre', 'frere_sans_porte'], boss: 'grand_inquisiteur' },
    { ennemis: ['garde_royal', 'arbaletrier_elite', 'chevalier', 'effigie_roi', 'bourreau_roi'], boss: 'roi_fou' },
    { ennemis: ['acolyte_cendre', 'ange_cendre', 'gargouille', 'martyr_bleme'], boss: 'soleil_bleme' },
    // Région 11, les Grèves Grises : pas d'ennemi ordinaire à elle (après l'histoire, rien de nouveau) ; ses cartes d'infini tirent donc
    // les ennemis des régions 1 à 10, et le Passeur pour mini-boss.
    { ennemis: [], boss: 'passeur' },
  ],
  // Élites à partir de la vague 20 : 10 % des ennemis, 5 points de plus toutes les 10 vagues, au plus 60 %.
  elites: { premiereVague: 20, partDepart: 0.1, partParPalier: 0.05, intervalle: 10, partMax: 0.6 },
  // Mini-boss toutes les 10 vagues : le boss de la région à 30 % de ses PV, 15 points de plus par mini-boss déjà passé.
  miniBoss: { intervalle: 10, pvDepart: 0.3, pvParMiniBoss: 0.15, delai: 5 },
};
