// Export et import de la progression par un code texte à copier-coller.
//
// Forme du code : `PCH1.<mode>.<données>.<somme>`
// - `PCH1` : version du format du code (indépendante de la version de la sauvegarde, qui est dans les données).
// - `mode` : `z` = JSON compressé (deflate brut) puis base64url ; `j` = JSON seul en base64url, utilisé quand le
//   navigateur n'a pas de CompressionStream. L'import comprend les deux.
// - `somme` : CRC-32 en 8 chiffres hexadécimaux de `<mode>.<données>`, qui détecte une copie tronquée ou fautive.
//
// Le code contient la progression, les réglages, la méta-progression (monnaies, héros, arbre, objets, choix) et la campagne du
// DLC (`moderne`, v9), pas la partie en cours. Un import ne touche à rien tant que
// tout n'est pas validé : taille, forme, somme, décompression bornée, JSON, migration, validation stricte.
import type { DefsMeta } from './definitions';
import { moderneParDefaut, VERSION_SAUVEGARDE, type CampagneModerne, type Sauvegarde } from './format';
import { migrer } from './migrations';
import { normaliserImport } from './normalisation';

export const PREFIXE_CODE = 'PCH1';
/**
 * Taille maximale d'un code accepté, en caractères. Un joueur complet (150 niveaux) fait environ 18 400 caractères quand le navigateur
 * ne sait pas compresser (mode `j`), bien moins en mode `z` : la limite doit laisser passer le premier cas. Les 64 Ko de données
 * décompressées (ci-dessous) protègent déjà des codes démesurés.
 */
export const TAILLE_MAX_CODE = 32 * 1024;
/** Taille maximale des données une fois décompressées, en octets (protège d'une bombe de décompression). */
const TAILLE_MAX_DONNEES = 64 * 1024;

export type RaisonImport = 'vide' | 'trop_long' | 'format' | 'somme' | 'compression' | 'donnees' | 'trop_recent';

export type ResultatImport =
  | {
      readonly ok: true;
      readonly sauvegarde: Sauvegarde;
      readonly depuis: number;
      /** Le code (v9 ou plus) contenait un bloc `moderne` (le DLC). Avant la v9 le DLC n'existait pas : toujours faux. Sinon `sauvegarde.moderne` est un défaut vide à ne pas appliquer : l'appareil garde le sien. */
      readonly avecModerne: boolean;
    }
  | { readonly ok: false; readonly raison: RaisonImport; readonly detail: string };

// --- CRC-32 -----------------------------------------------------------------------------------------------

const TABLE_CRC: readonly number[] = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(octets: Uint8Array): number {
  let crc = 0xffffffff;
  for (const octet of octets) crc = (TABLE_CRC[(crc ^ octet) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function sommeDe(texte: string): string {
  return crc32(new TextEncoder().encode(texte)).toString(16).padStart(8, '0');
}

// --- base64url (RFC 4648, sans remplissage) ---------------------------------------------------------------

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function versBase64Url(octets: Uint8Array): string {
  let sortie = '';
  for (let i = 0; i < octets.length; i += 3) {
    const bloc = ((octets[i] ?? 0) << 16) | ((octets[i + 1] ?? 0) << 8) | (octets[i + 2] ?? 0);
    const restants = octets.length - i;
    sortie += ALPHABET.charAt((bloc >> 18) & 63) + ALPHABET.charAt((bloc >> 12) & 63);
    if (restants > 1) sortie += ALPHABET.charAt((bloc >> 6) & 63);
    if (restants > 2) sortie += ALPHABET.charAt(bloc & 63);
  }
  return sortie;
}

/** Décode strictement : alphabet exact, longueur possible, forme canonique. Rend null sinon. */
export function depuisBase64Url(texte: string): Uint8Array<ArrayBuffer> | null {
  if (texte.length % 4 === 1) return null;
  const valeurs: number[] = [];
  for (const c of texte) {
    const v = ALPHABET.indexOf(c);
    if (v < 0) return null;
    valeurs.push(v);
  }
  const octets = new Uint8Array(Math.floor((valeurs.length * 6) / 8));
  let n = 0;
  for (let i = 0; i < valeurs.length; i += 4) {
    const bloc = ((valeurs[i] ?? 0) << 18) | ((valeurs[i + 1] ?? 0) << 12) | ((valeurs[i + 2] ?? 0) << 6) | (valeurs[i + 3] ?? 0);
    if (n < octets.length) octets[n++] = (bloc >> 16) & 255;
    if (n < octets.length) octets[n++] = (bloc >> 8) & 255;
    if (n < octets.length) octets[n++] = bloc & 255;
  }
  return versBase64Url(octets) === texte ? octets : null;
}

// --- compression ------------------------------------------------------------------------------------------

async function lireFlux(flux: ReadableStream<Uint8Array>, max: number): Promise<Uint8Array<ArrayBuffer> | null> {
  const lecteur = flux.getReader();
  const morceaux: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await lecteur.cancel();
      return null;
    }
    morceaux.push(value);
  }
  const sortie = new Uint8Array(total);
  let position = 0;
  for (const m of morceaux) {
    sortie.set(m, position);
    position += m.length;
  }
  return sortie;
}

async function passerParFlux(octets: Uint8Array<ArrayBuffer>, flux: CompressionStream | DecompressionStream, max: number): Promise<Uint8Array<ArrayBuffer> | null> {
  const entree = new Blob([octets]).stream().pipeThrough(flux);
  return lireFlux(entree, max);
}

const compressionDisponible = (): boolean => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

// --- export -----------------------------------------------------------------------------------------------

/** Vrai : la campagne du DLC est celle d'un joueur qui ne l'a jamais touchée (rien à transporter). */
function moderneVide(moderne: CampagneModerne): boolean {
  return JSON.stringify(moderne) === JSON.stringify(moderneParDefaut());
}

/**
 * Les données qui voyagent dans un code : tout sauf la partie en cours. La campagne du DLC n'y est que si elle n'est pas vide : le code
 * d'un joueur qui n'a pas touché au DLC garde la taille qu'il avait en v8 ; à l'import, un code v9 sans `moderne` la reçoit vide.
 */
function donneesExportees(s: Sauvegarde): string {
  return JSON.stringify({ version: s.version, progression: s.progression, reglages: s.reglages, meta: s.meta, ...(moderneVide(s.moderne) ? {} : { moderne: s.moderne }) });
}

/** Premier format de sauvegarde qui a la campagne du DLC (`moderne`). */
const VERSION_MODERNE = 9;

/** Produit le code qui redonne la progression, les réglages et la méta-progression de cette sauvegarde. */
export async function exporterCode(s: Sauvegarde): Promise<string> {
  const json = new TextEncoder().encode(donneesExportees(s));
  let mode = 'j';
  let octets: Uint8Array<ArrayBuffer> = json;
  if (compressionDisponible()) {
    try {
      const compresse = await passerParFlux(json, new CompressionStream('deflate-raw'), TAILLE_MAX_DONNEES);
      if (compresse && compresse.length < json.length) {
        mode = 'z';
        octets = compresse;
      }
    } catch {
      // Compression impossible : on exporte le JSON tel quel.
    }
  }
  const corps = `${mode}.${versBase64Url(octets)}`;
  return `${PREFIXE_CODE}.${corps}.${sommeDe(corps)}`;
}

// --- import -----------------------------------------------------------------------------------------------

function refus(raison: RaisonImport, detail: string): ResultatImport {
  return { ok: false, raison, detail };
}

/**
 * Lit un code d'export. Ne modifie rien : c'est à l'appelant, si le résultat est bon, de remplacer la
 * progression (avec `remplacerProgression`). Un code de la version courante ou d'une version plus ancienne
 * est accepté (migré : un code d'avant la version 3 donne une méta-progression de départ), un code plus récent que
 * le jeu est refusé. `defs` (facultatif) sert à remettre le code en cohérence avec les données d'aujourd'hui, sans
 * jamais le refuser pour cela : un héros dont les compétences ne tiennent plus (seuils d'expérience changés…) récupère
 * ses points, un héros choisi non possédé devient l'avatar du dieu (voir normalisation.ts).
 */
export async function importerCode(code: string, defs?: DefsMeta): Promise<ResultatImport> {
  // Les codes collés contiennent souvent des retours à la ligne ou des espaces en bout de ligne.
  const texte = code.replace(/\s+/g, '');
  if (texte.length === 0) return refus('vide', 'aucun code');
  if (texte.length > TAILLE_MAX_CODE) return refus('trop_long', 'code trop long');
  const parties = texte.split('.');
  const [prefixe, mode, donnees, somme] = parties;
  if (parties.length !== 4 || prefixe !== PREFIXE_CODE || (mode !== 'z' && mode !== 'j') || !donnees || !somme) {
    return refus('format', 'ce n\'est pas un code Pocharlume');
  }
  if (sommeDe(`${mode}.${donnees}`) !== somme.toLowerCase()) return refus('somme', 'la somme de contrôle ne correspond pas : code incomplet ou erroné');
  const octets = depuisBase64Url(donnees);
  if (!octets) return refus('format', 'données illisibles');
  let json: Uint8Array<ArrayBuffer> | null = octets;
  if (mode === 'z') {
    if (!compressionDisponible()) return refus('compression', 'ce navigateur ne sait pas décompresser le code');
    try {
      json = await passerParFlux(octets, new DecompressionStream('deflate-raw'), TAILLE_MAX_DONNEES);
    } catch {
      return refus('compression', 'données compressées invalides');
    }
    if (!json) return refus('compression', 'données décompressées trop grosses');
  } else if (octets.length > TAILLE_MAX_DONNEES) {
    return refus('trop_long', 'données trop grosses');
  }
  let analyse: unknown;
  try {
    analyse = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(json));
  } catch {
    return refus('donnees', 'données illisibles');
  }
  if (typeof analyse !== 'object' || analyse === null || Array.isArray(analyse) || Object.hasOwn(analyse, 'partie')) {
    return refus('donnees', 'structure inattendue');
  }
  // Validation comme une lecture du stockage (sans les définitions de héros) : seule une structure impossible est
  // refusée. Ce qui est devenu incohérent avec les données d'aujourd'hui est corrigé, pas refusé.
  // Un code v9 ou plus récent sans campagne du DLC vient d'un joueur qui n'y a pas touché (voir `donneesExportees`).
  const version: unknown = Reflect.get(analyse, 'version');
  const sansModerne = typeof version === 'number' && version >= VERSION_MODERNE && !Object.hasOwn(analyse, 'moderne');
  const migration = migrer({ ...analyse, partie: null, ...(sansModerne ? { moderne: moderneParDefaut() } : {}) });
  if (!migration.ok) return refus(migration.cause === 'trop_recente' ? 'trop_recent' : 'donnees', migration.raison);
  return { ok: true, sauvegarde: normaliserImport(migration.sauvegarde, defs), depuis: migration.depuis, avecModerne: typeof version === 'number' && version >= VERSION_MODERNE && Object.hasOwn(analyse, 'moderne') };
}

/**
 * Applique un import réussi : la progression, les réglages et la méta-progression du code remplacent ceux de la
 * sauvegarde courante, la partie en cours est abandonnée (elle appartenait à l'ancienne progression).
 * La campagne du DLC vient du code, sauf si `moderneAppareil` est donné (code sans bloc `moderne`, `avecModerne` faux) :
 * l'appareil garde alors la sienne (badges, skins, titres, progression).
 */
export function remplacerProgression(importee: Sauvegarde, moderneAppareil?: CampagneModerne): Sauvegarde {
  return { version: VERSION_SAUVEGARDE, progression: importee.progression, reglages: importee.reglages, meta: importee.meta, partie: null, moderne: moderneAppareil ?? importee.moderne };
}
