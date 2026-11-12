// Règles de la campagne « Temps modernes » (le DLC) dans la sauvegarde v9, en fonctions pures comme progression.ts : une sauvegarde en
// entrée, une copie en sortie (la même si rien ne change). La progression du DLC suit les règles de l'histoire (réussir le niveau N
// débloque N + 1, meilleures étoiles par difficulté), sur ses niveaux 1 à 30 ; elle ne touche jamais `progression` ni `meta`.
import { NIVEAU_MAX_MODERNE, regionOuverteModerne, type IdCampagne } from '../data/campagnes';
import { DIFFICULTES_SAUVEGARDE, type CampagneModerne, type DifficulteSauvegarde, type Etoiles, type EtoilesNiveau, type Sauvegarde } from './format';
import { reunirDefis, reunirEtoiles, reunirRecords } from './fusion-campagne';
import { estEntierEntre } from './validation-base';

/**
 * Enregistre la victoire d'un niveau du DLC : meilleur résultat par difficulté, niveau suivant débloqué. Une victoire invalide (niveau
 * hors de 1 à 30 ou verrouillé, étoiles hors de 1 à 3, difficulté inconnue) est ignorée : la sauvegarde rendue est la même.
 */
export function enregistrerVictoireModerne(s: Sauvegarde, numero: number, difficulte: DifficulteSauvegarde, etoiles: number): Sauvegarde {
  const progression = s.moderne.progression;
  if (!estEntierEntre(numero, 1, NIVEAU_MAX_MODERNE) || numero > progression.niveauMax) return s;
  if (!estEntierEntre(etoiles, 1, 3) || !DIFFICULTES_SAUVEGARDE.includes(difficulte)) return s;
  const cle = String(numero);
  const anciennes: EtoilesNiveau = Object.hasOwn(progression.etoiles, cle) ? { ...progression.etoiles[cle] } : {};
  const meilleures = Math.max(anciennes[difficulte] ?? 0, etoiles) as Etoiles;
  const niveauMax = Math.max(progression.niveauMax, Math.min(numero + 1, NIVEAU_MAX_MODERNE));
  if (anciennes[difficulte] === meilleures && niveauMax === progression.niveauMax) return s;
  anciennes[difficulte] = meilleures;
  const nouvelles = { ...progression.etoiles };
  Object.defineProperty(nouvelles, cle, { value: anciennes, enumerable: true, writable: true, configurable: true });
  return { ...s, moderne: { ...s.moderne, progression: { niveauMax, etoiles: nouvelles } } };
}

/**
 * La sauvegarde telle qu'une carte du monde de cette campagne la lit : pour le DLC, sa progression, ses défis et sa région ouverte prennent
 * la place de ceux de l'histoire (le reste, monnaies comprises, est celui du joueur). Sert à l'affichage (nœuds, régions, étoiles
 * par difficulté, modes d'une fiche) et, en lecture seulement, à la fin de partie (`enregistrerFinDePartie`), au choix de la configuration
 * (`configDuChoix`) et à la relance, qui y lisent les étoiles et les défis d'avant la partie : on n'écrit jamais cette vue. Pour
 * l'histoire, rend la sauvegarde elle-même.
 */
export function sauvegardeDeCampagne(s: Sauvegarde, campagne: IdCampagne): Sauvegarde {
  if (campagne === 'histoire') return s;
  const { progression, defis } = s.moderne;
  return { ...s, progression, meta: { ...s.meta, defis, regionMax: regionOuverteModerne(progression.niveauMax) } };
}

/** Le sticker « DLC disponible ! » est-il replié en bouton « DLC » ? */
export function stickerDlcReplie(s: Sauvegarde): boolean {
  return s.moderne.stickerReplie;
}

/** Replie (ou déplie) le sticker « DLC disponible ! ». */
export function replierStickerDlc(s: Sauvegarde, replie: boolean): Sauvegarde {
  if (s.moderne.stickerReplie === replie) return s;
  return { ...s, moderne: { ...s.moderne, stickerReplie: replie } };
}

/** La réunion de deux listes d'identifiants, sans doublon et dans l'ordre alphabétique (la forme de la sauvegarde). */
function reunirIds(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}

/**
 * Réunit la campagne du DLC de deux sauvegardes (deux onglets, une lecture qui avait échoué), comme `fusionnerProgressions` pour
 * l'histoire : niveau débloqué le plus haut, meilleures étoiles, défis et titres réunis, meilleur record par carte. Les badges, la
 * collection (achetée avec les badges de `a`) et la préférence du sticker restent ceux de `a`. Rend null si `b` n'apporte rien.
 */
export function fusionnerModerne(a: CampagneModerne, b: CampagneModerne): CampagneModerne | null {
  const etoiles = reunirEtoiles(a.progression.etoiles, b.progression.etoiles);
  const defis = reunirDefis(a.defis, b.defis);
  const records = reunirRecords(a.records, b.records);
  const titres = reunirIds(a.titres, b.titres);
  const niveauMax = Math.max(a.progression.niveauMax, b.progression.niveauMax);
  const change = niveauMax > a.progression.niveauMax || etoiles.change || defis.change || records.change || titres.length > a.titres.length;
  if (!change) return null;
  return { ...a, progression: { niveauMax, etoiles: etoiles.valeur }, defis: defis.valeur, records: records.valeur, titres };
}
