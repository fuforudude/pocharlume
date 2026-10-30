// Les profils des vérifications supplémentaires du rapport d'équilibrage : disciples comparés à leur avatar,
// effet de l'arbre au rang maximal et d'un héros de niveau 10, soigneux sans tour divine. Un profil est un joueur
// (dieu, héros, niveau et compétences du héros, rangs de l'arbre) que `evaluerProfil` (campagne.ts) fait jouer.
import { HEROS } from '../data/heros';
import { BRANCHES_ARBRE, HEROS_PAR_DIEU, IDS_DIEUX, RANG_MAX_ARBRE } from '../data/meta';
import { REGLES } from '../data/regles';
import type { Profil } from './campagne';

/** L'arbre au rang maximal : les 6 branches à 5 rangs. */
export const ARBRE_AU_MAXIMUM: Readonly<Record<string, number>> = Object.fromEntries(BRANCHES_ARBRE.map((branche) => [branche, RANG_MAX_ARBRE]));

/**
 * Compétences d'un héros de niveau 10 (un point par niveau, 10 points) : l'ultime d'abord, puis les compétences
 * ordinaires dans l'ordre de la fiche jusqu'à épuisement des points.
 */
export function competencesNiveauMax(heros: string): Record<string, number> {
  const def = (HEROS as Readonly<Record<string, (typeof HEROS)[keyof typeof HEROS]>>)[heros];
  if (!def) throw new Error(`Héros inconnu : ${heros}`);
  const rangs: Record<string, number> = {};
  let points = REGLES.niveauHerosMax;
  const ordre = [...def.competences.filter((c) => c.ultime), ...def.competences.filter((c) => !c.ultime)];
  for (const c of ordre) {
    const rang = Math.min(c.rangMax, points);
    if (rang > 0) rangs[c.id] = rang;
    points -= rang;
  }
  return rangs;
}

/** Chaque disciple (les deux héros payants de chaque dieu), joué avec son dieu au niveau 1, sans arbre ni objet. */
export function profilsDisciples(): Profil[] {
  return IDS_DIEUX.flatMap((dieu) => HEROS_PAR_DIEU[dieu].slice(1).map((heros) => ({ id: heros, dieu, heros })));
}

/** L'avatar de chaque dieu, niveau 1, sans arbre ni objet : la référence des disciples. */
export function profilsAvatars(): Profil[] {
  return IDS_DIEUX.map((dieu) => ({ id: dieu, dieu }));
}

export type IdProfilProgression = 'arbre' | 'heros10' | 'tout';

/** L'avatar d'un dieu avec l'arbre au rang maximal, au niveau 10 avec ses compétences, ou les deux. */
export function profilProgression(dieu: string, id: IdProfilProgression): Profil {
  const arbre = id === 'arbre' || id === 'tout' ? { ameliorations: ARBRE_AU_MAXIMUM } : {};
  const heros = id === 'heros10' || id === 'tout' ? { niveauHeros: REGLES.niveauHerosMax, competencesHeros: competencesNiveauMax(dieu) } : {};
  return { id, dieu, ...arbre, ...heros };
}

/** Le soigneux sans tour divine : ses 400 arêtes vont à des tours communes. */
export function profilSansTourDivine(dieu: string): Profil {
  return { id: 'sans_divine', dieu, tourDivine: false };
}
