// Aiguillage des gimmicks (particularités des niveaux 101 à 150) : un seul point d'entrée par moment de la partie, qui renvoie au
// module du gimmick du niveau. Chaque `switch` est exhaustif : un nouveau type de `Gimmick` oublié ici ne compile pas.
// Tant que l'union n'a qu'un membre (Corbeaux), la règle no-unnecessary-condition voit chaque `case` comme toujours vrai : elle est
// coupée sur ces seules lignes, et ces commentaires sont à retirer quand le Radeau rejoindra l'union.
import type { Gimmick, Niveau } from '../definitions';
import type { EtatPartie } from '../etat';
import { verifierCorbeaux } from './corbeaux';

/** Arrête la compilation si un type de gimmick n'est pas traité, et la partie si des données inconnues arrivent quand même. */
function gimmickInconnu(type: never): never {
  throw new Error(`Gimmick inconnu : ${String(type)}`);
}

/** Vérifie le gimmick du niveau à la création de la partie (lève une erreur s'il est mal formé). */
export function verifierGimmick(niveau: Niveau): void {
  const gimmick: Gimmick | undefined = niveau.gimmick;
  if (!gimmick) return;
  switch (gimmick.type) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- union à un seul membre, voir l'en-tête
    case 'corbeaux':
      verifierCorbeaux(niveau, gimmick);
      return;
    default:
      gimmickInconnu(gimmick.type);
  }
}

/**
 * Le pas du gimmick, appelé au début de chaque pas de simulation, avant les vagues : un gimmick qui change les règles du pas (chemins,
 * emplacements…) le fait avant que les ennemis apparaissent, bougent et soient visés. Sans gimmick, rien.
 */
export function mettreAJourGimmick(etat: EtatPartie): void {
  const gimmick: Gimmick | undefined = etat.niveau.gimmick;
  if (!gimmick) return;
  switch (gimmick.type) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- union à un seul membre, voir l'en-tête
    case 'corbeaux':
      // Rien à faire au pas : les ennemis des couloirs apparaissent avec leur vague et avancent avec les autres (trajetEnnemi).
      return;
    default:
      gimmickInconnu(gimmick.type);
  }
}
