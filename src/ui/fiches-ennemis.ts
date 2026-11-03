// Quelles fiches « Nouvel ennemi » montrer quand des ennemis paraissent pour la première fois dans une partie. Hors de main.ts pour être
// testé avec une vraie session : les ennemis jamais rencontrés entrent au bestiaire (même quand l'option coupe les fiches), et seuls
// ceux-là, si l'option est active, ont leur fiche. Une partie hors sauvegarde (niveau d'essai) ne note ni ne montre rien.
import { ennemiRencontre, type Sauvegarde } from '../save';

/** Ce dont la décision a besoin de la session (une `Session` convient). */
export interface SourceRencontres {
  readonly sauvegarde: Sauvegarde;
  rencontrerEnnemis(ids: readonly string[]): Promise<unknown>;
}

/** Les identifiants dont la fiche doit s'ouvrir ; les nouveaux sont notés dans la sauvegarde au passage. */
export function ennemisAMontrer(session: SourceRencontres, ids: readonly string[], horsSauvegarde: boolean): string[] {
  if (horsSauvegarde) return [];
  const nouveaux = [...new Set(ids)].filter((id) => !ennemiRencontre(session.sauvegarde, id));
  if (nouveaux.length === 0) return [];
  const fiches = session.sauvegarde.meta.bestiaire.fiches;
  session.rencontrerEnnemis(nouveaux).catch(console.error);
  return fiches ? nouveaux : [];
}
