// Export et import de la progression par un code texte à copier-coller.
//
// Forme du code : `PCH1.<mode>.<données>.<somme>`
// - `PCH1` : version du format du code (indépendante de la version de la sauvegarde, qui est dans les données).
// - `mode` : `z` = JSON compressé (deflate brut) puis base64url ; `j` = JSON seul en base64url, utilisé quand le
//   navigateur n'a pas de CompressionStream. L'import comprend les deux.
// - `somme` : CRC-32 en 8 chiffres hexadécimaux de `<mode>.<données>`, qui détecte une copie tronquée ou fautive.
//
// Le code contient la progression et les réglages, pas la partie en cours. Un import ne touche à rien tant que
// tout n'est pas validé : taille, forme, somme, décompression bornée, JSON, migration, validation stricte.
import { VERSION_SAUVEGARDE, type Sauvegarde } from './format';
import { migrer } from './migrations';

export const PREFIXE_CODE = 'PCH1';
/** Taille maximale d'un code accepté, en caractères. Une progression complète en fait moins de 1000. */
export const TAILLE_MAX_CODE = 16 * 1024;
/** Taille maximale des données une fois décompressées, en octets (protège d'une bombe de décompression). */
const TAILLE_MAX_DONNEES = 64 * 1024;

export type RaisonImport = 'vide' | 'trop_long' | 'format' | 'somme' | 'compression' | 'donnees' | 'trop_recent';

export type ResultatImport =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly depuis: number }
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

/** Les données qui voyagent dans un code : tout sauf la partie en cours. */
function donneesExportees(s: Sauvegarde): string {
  return JSON.stringify({ version: s.version, progression: s.progression, reglages: s.reglages });
}

/** Produit le code qui redonne la progression et les réglages de cette sauvegarde. */
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
 * est accepté (migré), un code plus récent que le jeu est refusé.
 */
export async function importerCode(code: string): Promise<ResultatImport> {
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
  const migration = migrer({ ...analyse, partie: null });
  if (!migration.ok) return refus(migration.cause === 'trop_recente' ? 'trop_recent' : 'donnees', migration.raison);
  return { ok: true, sauvegarde: migration.sauvegarde, depuis: migration.depuis };
}

/**
 * Applique un import réussi : la progression et les réglages du code remplacent ceux de la sauvegarde
 * courante, la partie en cours est abandonnée (elle appartenait à l'ancienne progression).
 */
export function remplacerProgression(importee: Sauvegarde): Sauvegarde {
  return { version: VERSION_SAUVEGARDE, progression: importee.progression, reglages: importee.reglages, partie: null };
}
