// Lecture de docs/lore.md : chaque ligne `- \`clé\` : texte` donne la valeur d'une clé de src/i18n/.
// La section « Univers » (note pour l'équipe) et les paragraphes libres ne sont pas des textes du jeu.

const LIGNE_TEXTE = /^- `([^`]+)` : ?(.*)$/;
const TITRE_UNIVERS = /^## Univers\b/;
const TITRE = /^## /;

export interface TexteLore {
  readonly cle: string;
  readonly texte: string;
  /** Numéro de ligne dans lore.md (à partir de 1), pour les messages d'erreur. */
  readonly ligne: number;
}

/** Les textes du document, dans l'ordre. Lève une erreur sur une clé répétée ou un texte vide. */
export function lireLore(source: string): TexteLore[] {
  const textes: TexteLore[] = [];
  const vues = new Map<string, number>();
  let dansUnivers = false;
  source.split(/\r?\n/).forEach((ligne, i) => {
    if (TITRE.test(ligne)) dansUnivers = TITRE_UNIVERS.test(ligne);
    if (dansUnivers) return;
    const m = LIGNE_TEXTE.exec(ligne);
    if (m === null) return;
    const cle = m[1] ?? '';
    const texte = (m[2] ?? '').trim();
    if (texte === '') throw new Error(`lore.md ligne ${i + 1} : texte vide pour ${cle}`);
    const avant = vues.get(cle);
    if (avant !== undefined) throw new Error(`lore.md ligne ${i + 1} : clé ${cle} déjà vue ligne ${avant}`);
    vues.set(cle, i + 1);
    textes.push({ cle, texte, ligne: i + 1 });
  });
  return textes;
}

/** Écrit un texte en littéral TypeScript entre apostrophes droites. */
export function litteral(texte: string): string {
  return `'${texte.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

/** Les clés qui peuvent être nouvelles (et vont dans fr-lore.ts) : les autres doivent déjà exister dans src/i18n/. */
export const CLE_NOUVELLE = /^(?:inscription\.[a-z0-9_]+|boss\.r\d+\.parole|ennemi\.[a-z0-9_]+\.desc)$/;
