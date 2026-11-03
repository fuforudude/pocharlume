// Transactions du bestiaire : noter les ennemis rencontrés en partie (la première fois seulement) et régler les fiches « Nouvel ennemi ».
// Des fonctions pures, comme celles de transactions-inscriptions.ts : une sauvegarde en entrée, une copie en sortie.
//
// Rencontrer un ennemi ne coûte ni ne rapporte rien : c'est de la méta, sans effet sur une partie. Une fois rencontré, un ennemi
// l'est pour toujours ; le revoir ne change rien (la sauvegarde rendue est la même).
import type { Sauvegarde } from './format';

export interface ResultatRencontres {
  readonly sauvegarde: Sauvegarde;
  /** Les identifiants qui entrent au bestiaire à cette occasion (vide : rien n'a changé), sans doublon, dans l'ordre reçu. */
  readonly nouveaux: string[];
}

/** Cet ennemi a-t-il déjà été rencontré ? */
export function ennemiRencontre(s: Sauvegarde, id: string): boolean {
  return s.meta.bestiaire.rencontres.includes(id);
}

/** La réunion de deux listes de rencontres, sans doublon et triée (la forme de la sauvegarde). */
export function reunirRencontres(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}

/** Note ces ennemis comme rencontrés. Ceux qui l'étaient déjà sont ignorés ; s'il n'y a rien de neuf, la sauvegarde rendue est la même. */
export function rencontrerEnnemis(s: Sauvegarde, ids: readonly string[]): ResultatRencontres {
  const connus = new Set(s.meta.bestiaire.rencontres);
  const nouveaux: string[] = [];
  for (const id of ids) {
    if (connus.has(id)) continue;
    connus.add(id);
    nouveaux.push(id);
  }
  if (nouveaux.length === 0) return { sauvegarde: s, nouveaux };
  const rencontres = [...connus].sort();
  return { sauvegarde: { ...s, meta: { ...s.meta, bestiaire: { ...s.meta.bestiaire, rencontres } } }, nouveaux };
}

/** Active ou coupe les fiches « Nouvel ennemi ». */
export function changerFichesEnnemis(s: Sauvegarde, actives: boolean): Sauvegarde {
  if (s.meta.bestiaire.fiches === actives) return s;
  return { ...s, meta: { ...s.meta, bestiaire: { ...s.meta.bestiaire, fiches: actives } } };
}
