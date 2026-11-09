// Plan des 10 niveaux de la région 11, les Grèves Grises (niveaux 101 à 110, après l'histoire). Comme la région 10 (plan-region10.ts) :
// les vagues sont générées par `npm run niveaux` depuis ce plan et figées dans vagues-region11.ts. Une carte neuve par niveau
// (cartes-region11.ts), jouée avec tous ses chemins (les 5es niveaux de chaque bloc, 105 et 110, en ont trois).
//
// Gimmicks (docs/specs/2026-11-08-apres-histoire-gimmicks.md) :
// - 101 à 105, Vol de Corbeaux : les couloirs sont les rangées de cases laissées dégagées sur chaque carte. Le générateur envoie les
//   groupes de volants dans les couloirs à tour de rôle : les listes d'ennemis comptent donc des volants (Corbeau Noir, Ange de Cendre,
//   et la Chauve-Souris sauf aux niveaux 103 et 105) et peu d'ennemis au sol, pour que les volants pèsent lourd malgré
//   `EQUILIBRAGE.repetitionOrdinaires`. Les essaims de Chauves-Souris d'élite (10 à 0,2 s dans un couloir) rendaient le défi Héroïque
//   impossible aux niveaux 103 et 105 : elles en sont retirées (voir « Équilibrage de la région 11 » dans la spec).
// - 106 à 110, Radeau : le trajet sur l'eau de chaque carte, 0,5 case par seconde, 3 places autour du centre (`PLACES_RADEAU`).
//   Les ennemis sont surtout ceux de l'eau et des armures, que le radeau doit aller chercher d'un bout à l'autre de la carte.
//
// Ennemis : seulement les 59 existants (pas d'ennemi ordinaire nouveau), en mélanges plus durs que ceux de la région 10. Le niveau 110
// est le combat contre le Passeur, avec le Radeau. `defiFer` : deux familles qui touchent les volants (tir ou magie) quand le niveau
// en compte, la tour de tir dès qu'un Délateur (furtif) est là, jamais la même paire deux niveaux de suite (le niveau 100 finit sur
// magie + tir). Le Fer y a ses propres facteurs (`facteurAretes`, `facteurEffectifs`, au lieu de 6 et 0,36) : avec 20 vies, les couloirs
// et le radeau ne punissent qu'en Héroïque, et le Fer ordinaire était gagné à 100 % (décision de l'étudiant, option A).
// `aretesDepart` et `facteurBudget` sont réglés par `npm run balance` avec les stratégies de bot des gimmicks (tâche 6,
// « Équilibrage de la région 11 » dans docs/specs/2026-11-08-apres-histoire-gimmicks.md).
import type { GimmickRadeau, PlaceRadeau } from '../../engine/definitions';
import type { PlanNiveau } from './plan-niveau';

/**
 * Les 3 places du radeau, en tuiles autour de son centre : en ligne, une case (2 tuiles, la largeur d'une tour) entre deux places,
 * pour que les trois tours se voient entières sur le radeau dessiné (88 px, 5,5 tuiles de long, art/sprites/radeau.txt).
 */
const PLACES_RADEAU: readonly PlaceRadeau[] = [
  { dx: -2, dy: 0 },
  { dx: 0, dy: 0 },
  { dx: 2, dy: 0 },
];

/** Vitesse du radeau, en cases par seconde. */
const VITESSE_RADEAU = 0.5;

/** Un radeau sur ce trajet (cases `[cx, cy]` de la grille, voisines deux à deux). */
function radeau(...trajet: [number, number][]): GimmickRadeau {
  return { type: 'radeau', trajet: trajet.map(([cx, cy]) => ({ cx, cy })), vitesse: VITESSE_RADEAU, places: PLACES_RADEAU };
}

export const PLANS_REGION11: readonly PlanNiveau[] = [
  {
    numero: 101,
    carte: 'greve',
    chemins: [0],
    aretesDepart: 1820,
    defiFer: { familles: ['caserne', 'tir'], facteurAretes: 4, facteurEffectifs: 0.8 },
    gimmick: { type: 'corbeaux', couloirs: [{ cy: 1 }, { cy: 6 }] },
    nom: 'niveau.r11.01.nom',
    ambiance: 'niveau.r11.01.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ['corbeau_noir', 'chauve_souris', 'ange_cendre', 'acolyte_cendre', 'garde_royal'],
      graine: 4103,
      facteurBudget: 0.19,
    },
  },
  {
    numero: 102,
    carte: 'filets',
    chemins: [0],
    aretesDepart: 1890,
    defiFer: { familles: ['artillerie', 'magie'], facteurAretes: 4, facteurEffectifs: 0.8 },
    gimmick: { type: 'corbeaux', couloirs: [{ cy: 2 }, { cy: 6 }] },
    nom: 'niveau.r11.02.nom',
    ambiance: 'niveau.r11.02.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ['corbeau_noir', 'chauve_souris', 'ange_cendre', 'noyeur', 'martyr_bleme', 'chevalier'],
      graine: 1102,
      facteurBudget: 0.22,
    },
  },
  {
    numero: 103,
    carte: 'epaves',
    chemins: [0],
    aretesDepart: 1960,
    defiFer: { familles: ['tir', 'artillerie'], facteurAretes: 3.5, facteurEffectifs: 0.9 },
    gimmick: { type: 'corbeaux', couloirs: [{ cy: 1 }, { cy: 4 }, { cy: 7 }] },
    nom: 'niveau.r11.03.nom',
    ambiance: 'niveau.r11.03.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ['corbeau_noir', 'ange_cendre', 'crapaud_gonfle', 'gargouille', 'delateur'],
      graine: 2156,
      horde: true,
      facteurBudget: 0.12,
    },
  },
  {
    numero: 104,
    carte: 'ponton_noir',
    chemins: [0],
    aretesDepart: 2030,
    defiFer: { familles: ['caserne', 'magie'], facteurAretes: 3.5, facteurEffectifs: 0.9 },
    gimmick: { type: 'corbeaux', couloirs: [{ cy: 2 }, { cy: 5 }, { cy: 8 }] },
    nom: 'niveau.r11.04.nom',
    ambiance: 'niveau.r11.04.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ['corbeau_noir', 'chauve_souris', 'ange_cendre', 'lueur_marais', 'bourreau_roi', 'garde_royal'],
      graine: 3110,
      facteurBudget: 0.26,
    },
  },
  {
    numero: 105,
    carte: 'cap_corbeaux',
    chemins: [0, 1, 2],
    aretesDepart: 2170,
    defiFer: { familles: ['magie', 'tir'], facteurAretes: 4, facteurEffectifs: 0.8 },
    gimmick: { type: 'corbeaux', couloirs: [{ cy: 1 }, { cy: 4 }, { cy: 7 }] },
    nom: 'niveau.r11.05.nom',
    ambiance: 'niveau.r11.05.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ['corbeau_noir', 'ange_cendre', 'delateur', 'effigie_roi', 'gargouille', 'porte_herse'],
      graine: 4133,
      facteurBudget: 0.24,
    },
  },
  {
    numero: 106,
    carte: 'eau_morte',
    chemins: [0],
    aretesDepart: 1690,
    defiFer: { familles: ['artillerie', 'tir'], facteurAretes: 4, facteurEffectifs: 0.8 },
    gimmick: radeau([6, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4]),
    nom: 'niveau.r11.06.nom',
    ambiance: 'niveau.r11.06.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ['noyeur', 'sangsue', 'pelerin_voile', 'garde_royal', 'acolyte_cendre', 'delateur', 'corbeau_noir'],
      graine: 1106,
      facteurBudget: 0.25,
    },
  },
  {
    numero: 107,
    carte: 'pontons',
    chemins: [0],
    aretesDepart: 1750,
    defiFer: { familles: ['caserne', 'magie'], facteurAretes: 3.5, facteurEffectifs: 0.9 },
    gimmick: radeau([4, 8], [4, 7], [4, 6], [5, 6], [6, 6], [6, 5], [6, 4], [6, 3]),
    nom: 'niveau.r11.07.nom',
    ambiance: 'niveau.r11.07.ambiance',
    vagues: {
      nombre: 12,
      ennemis: ['noyeur', 'crapaud_gonfle', 'lueur_marais', 'sangsue', 'chevalier', 'martyr_bleme', 'ange_cendre'],
      graine: 2107,
      horde: true,
      facteurBudget: 0.18,
    },
  },
  {
    numero: 108,
    carte: 'passe_noyes',
    chemins: [0],
    aretesDepart: 1810,
    defiFer: { familles: ['tir', 'caserne'], facteurAretes: 4, facteurEffectifs: 0.8 },
    gimmick: radeau([5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [13, 5], [13, 4], [13, 3]),
    nom: 'niveau.r11.08.nom',
    ambiance: 'niveau.r11.08.ambiance',
    vagues: {
      nombre: 13,
      ennemis: ['sangsue', 'noyeur', 'gargouille', 'inquisiteur', 'exorciste', 'bourreau_roi', 'delateur', 'chauve_souris'],
      graine: 3108,
      facteurBudget: 0.3,
    },
  },
  {
    numero: 109,
    carte: 'baie_morte',
    chemins: [0],
    aretesDepart: 1875,
    defiFer: { familles: ['magie', 'artillerie'], facteurAretes: 3.5, facteurEffectifs: 0.9 },
    gimmick: radeau([4, 5], [5, 5], [5, 4], [6, 4], [7, 4], [8, 4], [8, 5], [8, 6]),
    nom: 'niveau.r11.09.nom',
    ambiance: 'niveau.r11.09.ambiance',
    vagues: {
      nombre: 14,
      ennemis: ['lueur_marais', 'crapaud_gonfle', 'chevalier', 'garde_royal', 'aumonier', 'frere_sans_porte', 'ange_cendre'],
      graine: 4109,
      facteurBudget: 0.33,
    },
  },
  {
    numero: 110,
    carte: 'naufrage',
    chemins: [0, 1, 2],
    aretesDepart: 3600,
    defiFer: { familles: ['tir', 'magie'], facteurAretes: 4, facteurEffectifs: 0.8 },
    gimmick: radeau([5, 6], [5, 5], [5, 4], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [9, 4], [9, 5], [9, 6]),
    nom: 'niveau.r11.10.nom',
    ambiance: 'niveau.r11.10.ambiance',
    vagues: {
      nombre: 15,
      ennemis: ['noyeur', 'sangsue', 'gargouille', 'martyr_bleme', 'chevalier', 'acolyte_cendre', 'delateur', 'corbeau_noir'],
      graine: 1110,
      facteurBudget: 0.07,
      ecart: 0.8,
      // Le Passeur arrive par le chemin nord (1), qui rejoint le chemin 0 près de la sortie : sur le chemin 0, il pesait 93 % de la
      // menace et le bot soigneux délaissait les chemins 1 et 2 (décision de l'étudiant, « Équilibrage de la région 11 » dans la spec).
      boss: { vague: 15, ennemi: 'passeur', chemin: 1, delai: 12 },
    },
  },
];
