// Transactions du mode infini : enregistrer la fin d'une partie infinie (record par carte, paliers payés une seule fois au
// total, objets rendus) et lire ce que le mode propose (ouvert ou non, cartes jouables). Des fonctions pures, comme
// celles de transactions.ts : une sauvegarde en entrée, une copie en sortie ou un refus sans rien avoir changé.
//
// Choix simples, à relire : pas d'expérience de héros en infini (la spec n'en prévoit pas) ; l'abandon, la défaite et la fin
// d'une partie se traitent de la même façon (« une partie arrêtée garde le record atteint »).
import {
  CARTES_INFINI_MAX,
  EMPLACEMENTS_OBJETS,
  NIVEAU_OUVERTURE_INFINI,
  PALIERS_INFINI,
  PLAFOND_MONNAIE,
  RECOMPENSES_PALIERS_INFINI,
  STOCK_MAX_OBJET,
  VAGUE_MAX_INFINI,
  type IdObjet,
  type PalierInfini,
} from '../data/meta';
import { NOMBRE_NIVEAUX, type Sauvegarde } from './format';
import { niveauReussi } from './progression';
import { inclus, listeObjets, nonUtilises } from './transactions';
import { estIdCarteBienForme } from './validation-infini';
import { estEntierEntre, poser } from './validation';

export type RaisonFinInfinie = 'infini_ferme' | 'carte_invalide' | 'vague_invalide' | 'objets_invalides';

/** Ce que l'interface sait d'une partie infinie terminée (ou arrêtée). */
export interface FinInfinie {
  /** Identifiant de la carte jouée. */
  readonly carte: string;
  /** Dernière vague terminée (0 si la première n'a pas été terminée). */
  readonly vague: number;
  /** Objets emportés (3 au plus), déjà débités du stock au lancement. */
  readonly objetsEquipes?: readonly string[];
  /** Objets utilisés pendant la partie : consommés pour de bon ; les autres sont rendus. */
  readonly objetsUtilises?: readonly string[];
}

/** Ce qu'une partie infinie a rapporté, pour l'écran de fin. */
export interface BilanInfini {
  /** Dernière vague terminée de cette partie. */
  readonly vague: number;
  /** Record de la carte après la partie, et avant. */
  readonly record: number;
  readonly recordPrecedent: number;
  readonly nouveauRecord: boolean;
  /** Paliers payés par cette partie (jamais un palier déjà payé, même sur une autre carte). */
  readonly paliersPayes: readonly PalierInfini[];
  readonly aretes: number;
  readonly braises: number;
  readonly objetsConsommes: readonly IdObjet[];
  readonly objetsRendus: readonly IdObjet[];
}

export type ResultatFinInfinie =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly bilan: BilanInfini }
  | { readonly ok: false; readonly raison: RaisonFinInfinie };

// --- Lectures -------------------------------------------------------------------------------------------------

/** Le mode infini est ouvert par la victoire sur le boss de la région 1. */
export function infiniOuvert(s: Sauvegarde): boolean {
  return niveauReussi(s, NIVEAU_OUVERTURE_INFINI);
}

/** Record d'une carte : dernière vague terminée (0 si jamais jouée). */
export function recordDeLaCarte(s: Sauvegarde, carte: string): number {
  return Object.hasOwn(s.meta.infini.records, carte) ? (s.meta.infini.records[carte] ?? 0) : 0;
}

/**
 * Les cartes qu'on peut choisir en infini : celles dont au moins un niveau est gagné, une fois chacune, dans l'ordre des
 * niveaux ; aucune tant que le mode est fermé. `carteDuNiveau` dit quelle carte porte un niveau de campagne (les données
 * des niveaux ne sont pas du ressort de la sauvegarde) ; un niveau sans carte connue est ignoré.
 */
export function cartesInfiniJouables(s: Sauvegarde, carteDuNiveau: (niveau: number) => string | undefined): string[] {
  if (!infiniOuvert(s)) return [];
  const cartes: string[] = [];
  for (let n = 1; n <= NOMBRE_NIVEAUX; n++) {
    if (!niveauReussi(s, n)) continue;
    const carte = carteDuNiveau(n);
    if (carte !== undefined && !cartes.includes(carte)) cartes.push(carte);
  }
  return cartes;
}

// --- Fin de partie infinie --------------------------------------------------------------------------------------

/**
 * Enregistre une partie infinie : met à jour le record de la carte s'il est battu, paie chaque palier atteint qui ne l'a
 * jamais été (une seule fois au total, toutes cartes confondues), rend les objets emportés mais non utilisés (le stock reste
 * borné à 10). Une partie invalide est refusée en entier : rien ne bouge.
 */
export function enregistrerFinInfinie(s: Sauvegarde, fin: FinInfinie): ResultatFinInfinie {
  if (!infiniOuvert(s)) return { ok: false, raison: 'infini_ferme' };
  if (!estIdCarteBienForme(fin.carte)) return { ok: false, raison: 'carte_invalide' };
  const recordAvant = recordDeLaCarte(s, fin.carte);
  if (recordAvant === 0 && Object.keys(s.meta.infini.records).length >= CARTES_INFINI_MAX) return { ok: false, raison: 'carte_invalide' };
  if (!estEntierEntre(fin.vague, 0, VAGUE_MAX_INFINI)) return { ok: false, raison: 'vague_invalide' };
  const equipes = listeObjets(fin.objetsEquipes ?? []);
  const utilises = listeObjets(fin.objetsUtilises ?? []);
  if (!equipes || !utilises || equipes.length > EMPLACEMENTS_OBJETS || !inclus(utilises, equipes)) return { ok: false, raison: 'objets_invalides' };

  const nouveauRecord = fin.vague > recordAvant;
  const records = { ...s.meta.infini.records };
  if (nouveauRecord) poser(records, fin.carte, fin.vague);

  // Un palier se paie quand la partie l'atteint et qu'il n'a jamais été payé, sur n'importe quelle carte.
  const payes = PALIERS_INFINI.filter((p) => p <= fin.vague && !s.meta.infini.paliers.includes(p));
  const paliers = [...s.meta.infini.paliers, ...payes].sort((a, b) => a - b);
  const aretesDues = payes.reduce((total, p) => total + RECOMPENSES_PALIERS_INFINI[p].aretes, 0);
  const braisesDues = payes.reduce((total, p) => total + RECOMPENSES_PALIERS_INFINI[p].braises, 0);
  const aretes = Math.min(PLAFOND_MONNAIE, s.meta.monnaies.aretes + aretesDues);
  const braises = Math.min(PLAFOND_MONNAIE, s.meta.monnaies.braises + braisesDues);

  const objets = { ...s.meta.objets };
  const rendus: IdObjet[] = [];
  for (const objet of nonUtilises(equipes, utilises)) {
    if (objets[objet] >= STOCK_MAX_OBJET) continue;
    objets[objet] += 1;
    rendus.push(objet);
  }

  return {
    ok: true,
    sauvegarde: { ...s, meta: { ...s.meta, monnaies: { aretes, braises }, objets, infini: { records, paliers } } },
    bilan: {
      vague: fin.vague,
      record: nouveauRecord ? fin.vague : recordAvant,
      recordPrecedent: recordAvant,
      nouveauRecord,
      paliersPayes: payes,
      aretes: aretes - s.meta.monnaies.aretes,
      braises: braises - s.meta.monnaies.braises,
      objetsConsommes: utilises,
      objetsRendus: rendus,
    },
  };
}
