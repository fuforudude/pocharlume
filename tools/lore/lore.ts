// Lecture de docs/lore.md : chaque ligne `- \`clé\` : texte` donne la valeur d'une clé de src/i18n/.
// La section « Univers » (note pour l'équipe) et les paragraphes libres ne sont pas des textes du jeu.

// Espace avant ou après le deux-points : espace, espace insécable ou fine insécable (typographie française).
const ESPACE = String.raw`[\s\u00a0\u202f]`;
const LIGNE_TEXTE = new RegExp(String.raw`^- \`([^\`]+)\`${ESPACE}*:${ESPACE}*(.*)$`);
const DEBUT_ENTREE = /^- `/;
const SUITE = /^[ \t]+\S/;
const TITRE_UNIVERS = /^## Univers\b/;
const TITRE = /^## /;

export interface TexteLore {
  readonly cle: string;
  readonly texte: string;
  /** Numéro de ligne dans lore.md (à partir de 1), pour les messages d'erreur. */
  readonly ligne: number;
}

/**
 * Les textes du document, dans l'ordre. Hors de la section « Univers » : toute ligne qui commence par « - ` » et n'a pas
 * la forme `- \`clé\` : texte` est une erreur (une faute de frappe ne doit pas faire disparaître un texte) ; une ligne
 * indentée juste après une entrée la prolonge (les éditeurs coupent les lignes) et est recollée avec une espace. Une clé
 * répétée ou un texte vide est une erreur.
 */
export function lireLore(source: string): TexteLore[] {
  const entrees: { cle: string; ligne: number; texte: string }[] = [];
  const vues = new Map<string, number>();
  let dansUnivers = false;
  let courante: { cle: string; ligne: number; texte: string } | null = null;
  source.split(/\r?\n/).forEach((ligne, i) => {
    const numero = i + 1;
    if (TITRE.test(ligne)) dansUnivers = TITRE_UNIVERS.test(ligne);
    if (dansUnivers) return;
    if (courante && SUITE.test(ligne)) {
      courante.texte = `${courante.texte} ${ligne.trim()}`;
      return;
    }
    courante = null;
    if (!DEBUT_ENTREE.test(ligne)) return;
    const m = LIGNE_TEXTE.exec(ligne);
    if (m === null) throw new Error(`lore.md ligne ${String(numero)} : entrée illisible (attendu : - \`clé\` : texte) : ${ligne}`);
    const cle = m[1] ?? '';
    const avant = vues.get(cle);
    if (avant !== undefined) throw new Error(`lore.md ligne ${String(numero)} : clé ${cle} déjà vue ligne ${String(avant)}`);
    vues.set(cle, numero);
    courante = { cle, ligne: numero, texte: (m[2] ?? '').trim() };
    entrees.push(courante);
  });
  for (const e of entrees) if (e.texte === '') throw new Error(`lore.md ligne ${String(e.ligne)} : texte vide pour ${e.cle}`);
  return entrees;
}

/** Écrit un texte en littéral TypeScript entre apostrophes droites. */
export function litteral(texte: string): string {
  return `'${texte.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

/** Les clés qui peuvent être nouvelles (et vont dans fr-lore.ts) : les autres doivent déjà exister dans src/i18n/. */
export const CLE_NOUVELLE = /^(?:inscription\.[a-z0-9_]+|boss\.[rm]\d+\.parole|ennemi\.[a-z0-9_]+\.desc)$/;
