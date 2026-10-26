// Ce que les écrans de méta-progression (fiche de niveau, héros, boutique) montrent, calculé d'après la sauvegarde.
// Fonctions pures, sans DOM : les règles restent dans src/save/, ici on ne fait que lire et présenter.
import { DEFS_META, HEROS, SEUILS_XP } from '../data/heros';
import {
  BRANCHES_ARBRE,
  coutRangArbre,
  EMPLACEMENTS_OBJETS,
  estIdDieu,
  estIdHeros,
  estIdObjet,
  HEROS_PAR_DIEU,
  IDS_OBJETS,
  OBJETS,
  PRIX_DISCIPLE,
  RANG_MAX_ARBRE,
  STOCK_MAX_OBJET,
  type IdBranche,
  type IdDieu,
  type IdHeros,
  type IdObjet,
} from '../data/meta';
import { etoilesDisponibles, niveauDuHeros, pointsDisponibles, type ChoixPartie, type Sauvegarde } from '../save';

// --- Choix avant un niveau ------------------------------------------------------------------------------------

/** Un héros d'un dieu, tel que la fiche de niveau le propose. */
export interface VueHerosChoix {
  readonly id: IdHeros;
  readonly possede: boolean;
  /** Niveau du héros, null s'il n'est pas possédé. */
  readonly niveau: number | null;
  /** Prix en braises d'un disciple pas encore possédé, sinon null. */
  readonly prix: number | null;
}

export function vueHerosDuDieu(s: Sauvegarde, dieu: IdDieu): VueHerosChoix[] {
  return HEROS_PAR_DIEU[dieu].map((id) => {
    const niveau = niveauDuHeros(s, id, DEFS_META);
    return { id, possede: niveau !== null, niveau, prix: niveau === null ? PRIX_DISCIPLE : null };
  });
}

/** Retire des objets choisis ceux que le stock ne couvre plus (autant d'exemplaires que d'emplacements pris). */
export function objetsDansLeStock(s: Sauvegarde, objets: readonly string[]): IdObjet[] {
  const retenus: IdObjet[] = [];
  for (const objet of objets) {
    if (!estIdObjet(objet) || retenus.length >= EMPLACEMENTS_OBJETS) continue;
    if (retenus.filter((o) => o === objet).length < s.meta.objets[objet]) retenus.push(objet);
  }
  return retenus;
}

/**
 * Le dernier choix mémorisé, corrigé pour être jouable : un dieu inconnu devient Charlie, un héros qui n'est pas
 * possédé ou pas de ce dieu devient l'avatar du dieu, les objets que le stock ne couvre plus sont retirés.
 */
export function choixJouable(s: Sauvegarde, choix: ChoixPartie = s.meta.choix): ChoixPartie {
  const dieu: IdDieu = estIdDieu(choix.dieu) ? choix.dieu : 'charlie';
  const possible =
    estIdHeros(choix.heros) && (HEROS_PAR_DIEU[dieu] as readonly string[]).includes(choix.heros) && niveauDuHeros(s, choix.heros, DEFS_META) !== null;
  return { dieu, heros: possible ? choix.heros : HEROS_PAR_DIEU[dieu][0], objets: objetsDansLeStock(s, choix.objets) };
}

/** Un objet que la fiche propose d'emporter : son stock moins ce que les emplacements en prennent déjà. */
export interface VueObjetChoix {
  readonly id: IdObjet;
  readonly stock: number;
  readonly emporte: number;
  readonly libre: number;
}

export function vueObjetsChoix(s: Sauvegarde, choisis: readonly IdObjet[]): VueObjetChoix[] {
  return IDS_OBJETS.map((id) => {
    const stock = s.meta.objets[id];
    const emporte = choisis.filter((o) => o === id).length;
    return { id, stock, emporte, libre: Math.max(0, stock - emporte) };
  });
}

// --- Écran des héros ------------------------------------------------------------------------------------------

export interface VueCompetence {
  readonly id: string;
  readonly rang: number;
  readonly rangMax: number;
  readonly niveauRequis: number;
  readonly ultime: boolean;
  /** Le héros n'a pas encore le niveau pour y placer un point. */
  readonly verrouillee: boolean;
  /** Un point peut être placé ici maintenant (côté interface : la transaction a le dernier mot). */
  readonly peutPlacer: boolean;
}

export interface VueFicheHeros {
  readonly id: IdHeros;
  readonly possede: boolean;
  /** Niveau (1 pour un héros pas possédé, pour l'affichage). */
  readonly niveau: number;
  readonly xp: number;
  /** Expérience cumulée du niveau suivant, null au niveau maximal. */
  readonly xpSuivant: number | null;
  /** Avancement vers le niveau suivant, de 0 à 1 (1 au niveau maximal). */
  readonly fractionXp: number;
  /** Points de compétence qu'il reste à placer. */
  readonly points: number;
  /** Points déjà placés. */
  readonly pointsPlaces: number;
  readonly competences: readonly VueCompetence[];
  /** Prix en braises (disciple pas encore possédé), sinon null. */
  readonly prix: number | null;
}

export function vueFicheHeros(s: Sauvegarde, id: IdHeros): VueFicheHeros {
  const niveauReel = niveauDuHeros(s, id, DEFS_META);
  const possede = niveauReel !== null;
  const niveau = niveauReel ?? 1;
  const progression = s.meta.heros[id];
  const xp = progression?.xp ?? 0;
  const debut = niveau <= 1 ? 0 : (SEUILS_XP[niveau - 2] ?? 0);
  const xpSuivant = SEUILS_XP[niveau - 1] ?? null;
  const fractionXp = xpSuivant === null ? 1 : Math.max(0, Math.min(1, (xp - debut) / Math.max(1, xpSuivant - debut)));
  const points = pointsDisponibles(s, id, DEFS_META);
  const rangs = progression?.competences ?? {};
  const competences = HEROS[id].competences.map((c): VueCompetence => {
    const rang = Object.hasOwn(rangs, c.id) ? (rangs[c.id] ?? 0) : 0;
    const verrouillee = niveau < c.niveauRequis;
    return {
      id: c.id,
      rang,
      rangMax: c.rangMax,
      niveauRequis: c.niveauRequis,
      ultime: c.ultime,
      verrouillee,
      peutPlacer: possede && !verrouillee && rang < c.rangMax && points > 0,
    };
  });
  return {
    id,
    possede,
    niveau,
    xp,
    xpSuivant,
    fractionXp,
    points,
    pointsPlaces: competences.reduce((somme, c) => somme + c.rang, 0),
    competences,
    prix: possede ? null : PRIX_DISCIPLE,
  };
}

// --- Boutique -------------------------------------------------------------------------------------------------

export interface VueBranche {
  readonly id: IdBranche;
  readonly rang: number;
  readonly rangMax: number;
  /** Étoiles que coûte le rang suivant, null au sommet. */
  readonly cout: number | null;
  readonly achetable: boolean;
}

export function vueArbre(s: Sauvegarde): VueBranche[] {
  const disponibles = etoilesDisponibles(s);
  return BRANCHES_ARBRE.map((id) => {
    const rang = s.meta.arbre[id];
    const cout = rang >= RANG_MAX_ARBRE ? null : coutRangArbre(rang + 1);
    return { id, rang, rangMax: RANG_MAX_ARBRE, cout, achetable: cout !== null && disponibles >= cout };
  });
}

export interface VueObjetBoutique {
  readonly id: IdObjet;
  readonly prix: number;
  readonly stock: number;
  readonly stockMax: number;
  readonly achetable: boolean;
}

export function vueObjetsBoutique(s: Sauvegarde): VueObjetBoutique[] {
  return IDS_OBJETS.map((id) => {
    const prix = OBJETS[id].prix;
    const stock = s.meta.objets[id];
    return { id, prix, stock, stockMax: STOCK_MAX_OBJET, achetable: stock < STOCK_MAX_OBJET && s.meta.monnaies.aretes >= prix };
  });
}
