// Validation stricte de ce que la sauvegarde v7 ajoute : le bestiaire (ennemis rencontrés, option des fiches). Même esprit que
// validation-inscriptions.ts : types exacts, copie neuve, forme canonique.
import type { Bestiaire } from './format';
import { avecCles, echec, ok, valeur, type Resultat } from './validation-base';

/** Forme d'un identifiant d'ennemi (clé de src/data/ennemis.ts) : minuscules, chiffres et tiret bas. */
const ID_ENNEMI = /^[a-z][a-z0-9_]{0,63}$/;
/** Plafond de la liste : très au-dessus du nombre d'ennemis du jeu, bien en dessous de quoi gonfler la sauvegarde. */
export const PLAFOND_RENCONTRES = 500;

/**
 * Le bestiaire : une liste d'identifiants triés, sans doublon (la forme que les transactions écrivent), et l'option des fiches. Un
 * identifiant que les données ne connaissent plus n'est PAS refusé : un ennemi retiré ou renommé d'une version à l'autre ne doit pas
 * rendre la sauvegarde illisible. L'écran ne montre que ceux qui existent.
 */
export function validerBestiaire(x: unknown): Resultat<Bestiaire> {
  const base = avecCles(x, ['rencontres', 'fiches'], 'meta.bestiaire');
  if (!base.ok) return base;
  const liste = valeur(base.valeur, 'rencontres');
  const fiches = valeur(base.valeur, 'fiches');
  if (typeof fiches !== 'boolean') return echec('meta.bestiaire.fiches : booléen attendu');
  if (!Array.isArray(liste)) return echec('meta.bestiaire.rencontres : liste attendue');
  const ids = liste as unknown[];
  if (ids.length > PLAFOND_RENCONTRES) return echec(`meta.bestiaire.rencontres : au plus ${String(PLAFOND_RENCONTRES)} ennemis`);
  const copie: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string' || !ID_ENNEMI.test(id)) return echec('meta.bestiaire.rencontres : identifiant d’ennemi invalide');
    const precedent = copie[copie.length - 1];
    if (precedent !== undefined && id <= precedent) return echec('meta.bestiaire.rencontres : identifiants attendus triés, sans doublon');
    copie.push(id);
  }
  return ok({ rencontres: copie, fiches });
}
