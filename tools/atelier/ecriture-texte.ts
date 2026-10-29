// Édition ciblée d'un fichier texte : on ne réécrit que les lignes de grille qui changent. Les commentaires, les
// fins de ligne (LF ou CRLF), l'indentation et tout le reste du fichier restent identiques à l'octet près.

/** Une grille de lettres à remplacer : `debut` est le numéro (à partir de 1) de sa première ligne dans le fichier. */
export interface BlocGrille {
  readonly debut: number;
  /** Nombre de lignes de la grille actuelle dans le fichier. */
  readonly longueur: number;
  /** Lignes voulues (peuvent être plus nombreuses : la grille s'allonge). */
  readonly lignes: readonly string[];
}

function sansPointsFinaux(ligne: string): string {
  return ligne.replace(/\.+$/, '');
}

/**
 * Fusionne l'ancienne grille et la nouvelle : une ligne qui ne change pas (aux points finaux près, qui sont
 * transparents) garde son texte d'origine. Une ligne nouvelle vide devient `.` (une ligne vide terminerait la grille).
 */
export function fusionnerGrille(anciennes: readonly string[], nouvelles: readonly string[]): string[] {
  return nouvelles.map((n, k) => {
    const a = anciennes[k];
    if (a !== undefined && sansPointsFinaux(a) === sansPointsFinaux(n)) return a;
    // Une ligne modifiée garde la largeur de l'ancienne (les points finaux sont transparents) : le fichier reste carré.
    const propre = sansPointsFinaux(n).padEnd(a?.length ?? 0, '.');
    return propre === '' ? '.' : propre;
  });
}

/** Applique des remplacements de grilles et rend le nouveau texte (inchangé si rien ne diffère). */
export function remplacerGrilles(texte: string, blocs: readonly BlocGrille[]): string {
  const lignes = texte.split('\n');
  const crlf = texte.includes('\r\n');
  for (const bloc of [...blocs].sort((a, b) => b.debut - a.debut)) {
    const debut = bloc.debut - 1;
    const anciennes = lignes.slice(debut, debut + bloc.longueur);
    if (anciennes.length !== bloc.longueur) throw new Error(`Grille hors du fichier à la ligne ${String(bloc.debut)}`);
    const brutes = anciennes.map((l) => l.replace(/\r$/, ''));
    const indent = /^\s*/.exec(brutes[0] ?? '')?.[0] ?? '';
    const fusionnees = fusionnerGrille(brutes.map((l) => l.trim()), bloc.lignes);
    const sortie = fusionnees.map((l, k) => {
      const ancienne = anciennes[k];
      const garde = ancienne !== undefined && l === brutes[k]?.trim();
      if (garde) return ancienne;
      return `${indent}${l}${ancienne?.endsWith('\r') === true || (ancienne === undefined && crlf) ? '\r' : ''}`;
    });
    lignes.splice(debut, bloc.longueur, ...sortie);
  }
  return lignes.join('\n');
}
