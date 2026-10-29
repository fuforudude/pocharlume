// Garde-fou des écritures : un chemin n'est écrit que s'il est normalisé, sous la racine du projet, permis par
// l'adaptateur et qu'aucun lien symbolique ne le détourne. Aucun chemin en dur : tout vient de l'adaptateur.
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { Ecriture } from './types.ts';

export class ErreurChemin extends Error {
  constructor(chemin: string, raison: string) {
    super(`Écriture refusée (${chemin}) : ${raison}`);
    this.name = 'ErreurChemin';
  }
}

/** Normalise un chemin relatif (séparateurs `/`) ; refuse `..`, les chemins absolus, les lecteurs et les octets nuls. */
export function normaliser(chemin: string): string {
  if (chemin === '' || chemin.includes('\0')) throw new ErreurChemin(chemin, 'chemin vide ou invalide');
  const unifie = chemin.replaceAll('\\', '/');
  if (isAbsolute(chemin) || unifie.startsWith('/') || /^[a-zA-Z]:/.test(unifie)) throw new ErreurChemin(chemin, 'chemin absolu');
  const segments: string[] = [];
  for (const segment of unifie.split('/')) {
    if (segment === '..') throw new ErreurChemin(chemin, '« .. » interdit');
    if (segment === '' || segment === '.') continue;
    segments.push(segment);
  }
  if (segments.length === 0) throw new ErreurChemin(chemin, 'chemin vide');
  return segments.join('/');
}

function motifVersRegex(motif: string): RegExp {
  const echappe = motif.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[^/]*');
  return new RegExp(`^${echappe}$`);
}

/** Un chemin normalisé est-il couvert par l'un des motifs (dossier `x/`, fichier exact, ou motif `*` dans le nom) ? */
export function estPermis(chemin: string, permis: readonly string[]): boolean {
  return permis.some((motif) => {
    if (motif.endsWith('/')) return chemin.startsWith(motif);
    return motifVersRegex(motif).test(chemin);
  });
}

/** Vérifie un chemin ; rend son chemin absolu. Lève une `ErreurChemin` au premier défaut. */
export function verifierChemin(racine: string, chemin: string, permis: readonly string[]): string {
  const propre = normaliser(chemin);
  if (!estPermis(propre, permis)) throw new ErreurChemin(chemin, 'hors des dossiers autorisés');
  const absolu = resolve(racine, propre);
  const rel = relative(racine, absolu);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) throw new ErreurChemin(chemin, 'hors de la racine du projet');
  // Aucun lien symbolique sur le chemin existant : ni sur le fichier, ni sur un dossier parent.
  const racineReelle = realpathSync(racine);
  let courant = racine;
  for (const segment of rel.split(sep)) {
    courant = join(courant, segment);
    let stat;
    try {
      stat = lstatSync(courant);
    } catch {
      break; // n'existe pas encore : sera créé sous un parent déjà vérifié
    }
    if (stat.isSymbolicLink()) throw new ErreurChemin(chemin, 'lien symbolique');
  }
  let existant = dirname(absolu);
  for (;;) {
    try {
      const reel = realpathSync(existant);
      if (reel !== racineReelle && !reel.startsWith(racineReelle + sep)) throw new ErreurChemin(chemin, 'sort de la racine du projet');
      break;
    } catch (erreur) {
      if (erreur instanceof ErreurChemin) throw erreur;
      const parent = dirname(existant);
      if (parent === existant) throw new ErreurChemin(chemin, 'dossier parent introuvable');
      existant = parent;
    }
  }
  return absolu;
}

/**
 * Écrit les fichiers, tout ou rien : tous les chemins sont vérifiés avant la première écriture, puis chaque contenu est
 * écrit dans un fichier temporaire voisin, et les renommages ne viennent qu'ensuite. Si l'un d'eux échoue, les fichiers
 * déjà remplacés retrouvent leur contenu d'avant. Un fichier dont le contenu ne change pas n'est pas réécrit. Rend les
 * chemins réellement écrits.
 */
export function ecrireFichiers(racine: string, ecritures: readonly Ecriture[], permis: readonly string[]): string[] {
  const cibles = ecritures.map((e) => ({ absolu: verifierChemin(racine, e.chemin, permis), chemin: normaliser(e.chemin), contenu: e.contenu }));
  const aEcrire = cibles.flatMap((c) => {
    const actuel = existsSync(c.absolu) ? readFileSync(c.absolu, 'utf8') : null;
    return actuel === c.contenu ? [] : [{ ...c, actuel, temporaire: `${c.absolu}.atelier-tmp` }];
  });
  try {
    for (const c of aEcrire) {
      mkdirSync(dirname(c.absolu), { recursive: true });
      writeFileSync(c.temporaire, c.contenu, 'utf8');
    }
  } catch (erreur) {
    for (const c of aEcrire) rmSync(c.temporaire, { force: true });
    throw erreur;
  }
  const remplaces: typeof aEcrire = [];
  try {
    for (const c of aEcrire) {
      renameSync(c.temporaire, c.absolu);
      remplaces.push(c);
    }
  } catch (erreur) {
    for (const c of aEcrire) rmSync(c.temporaire, { force: true });
    for (const c of remplaces) {
      if (c.actuel === null) rmSync(c.absolu, { force: true });
      else writeFileSync(c.absolu, c.actuel, 'utf8');
    }
    throw erreur;
  }
  return aEcrire.map((c) => c.chemin);
}
