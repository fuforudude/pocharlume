// Logique pure de la carte du monde : quels nœuds se voient, ce qu'ils affichent, où on touche, où vont les
// flèches. Aucune dépendance au DOM ni au canvas : l'écran (carte-monde.ts) et le rendu (render/carte-monde.ts)
// ne font que la dessiner.
import type { NoeudNiveau } from '../data/niveaux/carte-du-monde';
import {
  DIFFICULTES_SAUVEGARDE,
  etoilesDe,
  meilleuresEtoiles,
  niveauDebloque,
  niveauReussi,
  type DefisNiveau,
  type DifficulteSauvegarde,
  type Sauvegarde,
} from '../save';

/** Ce que la carte montre d'un nœud, d'après la sauvegarde. */
export interface VueNoeud extends NoeudNiveau {
  /** Débloqué : seuls les niveaux débloqués se voient et se touchent. */
  readonly visible: boolean;
  /** Le prochain niveau à jouer (débloqué, jamais réussi) : le nœud clignote. */
  readonly clignote: boolean;
  readonly reussi: boolean;
  /** Meilleur résultat toutes difficultés confondues, 0 à 3. */
  readonly etoiles: number;
  /** Les défis (Héroïque, Fer) réussis sur ce niveau. */
  readonly defis: DefisNiveau;
}

/**
 * Les nœuds d'une région d'après la sauvegarde. Le `numero` d'un nœud de données est son numéro dans la région (1 à 10) ;
 * `decalage` est le nombre de niveaux des régions d'avant (0 pour la région 1, 10 pour la 2…). Le `numero` d'une vue est le
 * numéro du niveau dans la campagne (1 à 100), celui de la sauvegarde et celui que la carte affiche.
 */
export function vueNoeuds(s: Sauvegarde, noeuds: readonly NoeudNiveau[], decalage = 0): VueNoeud[] {
  return noeuds.map((n) => {
    const numero = n.numero + decalage;
    const visible = niveauDebloque(s, numero);
    const reussi = niveauReussi(s, numero);
    const cle = String(numero);
    const defis = Object.hasOwn(s.meta.defis, cle) ? (s.meta.defis[cle] ?? {}) : {};
    return { ...n, numero, visible, reussi, clignote: visible && !reussi, etoiles: meilleuresEtoiles(s, numero), defis };
  });
}

// --- Défis réussis, marqués sur les nœuds -------------------------------------------------------------------------

/** Une petite icône posée à côté d'un nœud : sprite de l'atlas et décalage, en pixels du fond, de son centre à celui du nœud. */
export interface IconeDefi {
  readonly sprite: string;
  readonly dx: number;
  readonly dy: number;
}

/** Écart, en pixels du fond, entre le centre d'un nœud et celui de l'icône d'un défi (au-dessus, de part et d'autre). */
const ECART_ICONE_DEFI_X = 11;
const ECART_ICONE_DEFI_Y = -19;

/** Les icônes des défis réussis d'un niveau : Héroïque à gauche, Fer à droite, au-dessus du nœud. */
export function iconesDefis(defis: DefisNiveau): readonly IconeDefi[] {
  const icones: IconeDefi[] = [];
  if (defis.heroique === true) icones.push({ sprite: 'icone-defi-heroique', dx: -ECART_ICONE_DEFI_X, dy: ECART_ICONE_DEFI_Y });
  if (defis.fer === true) icones.push({ sprite: 'icone-defi-fer', dx: ECART_ICONE_DEFI_X, dy: ECART_ICONE_DEFI_Y });
  return icones;
}

// --- Régions ------------------------------------------------------------------------------------------------------

/** Ce que la carte sait d'une région pour la montrer : son numéro, la clé de son nom et si ses niveaux sont livrés. */
export interface RegionPourVue {
  readonly numero: number;
  readonly nom: string;
  /** null : les niveaux de cette région ne sont pas encore dans le jeu. */
  readonly contenu: object | null;
}

export interface VueRegion {
  readonly numero: number;
  readonly nom: string;
  /** Ouverte : le boss de la région d'avant est battu. Une région fermée se voit grisée, sans s'ouvrir. */
  readonly ouverte: boolean;
  /** Ouverte et ses niveaux sont dans le jeu. */
  readonly disponible: boolean;
}

export function vueRegions(s: Sauvegarde, regions: readonly RegionPourVue[]): VueRegion[] {
  return regions.map((r) => {
    const ouverte = r.numero <= s.meta.regionMax;
    return { numero: r.numero, nom: r.nom, ouverte, disponible: ouverte && r.contenu !== null };
  });
}

/** La région où la carte s'ouvre : la plus haute région ouverte parmi celles qu'on montre (indice dans `regions`). */
export function regionInitiale(s: Sauvegarde, regions: readonly RegionPourVue[]): number {
  let meilleure = 0;
  regions.forEach((r, i) => {
    if (r.numero <= s.meta.regionMax) meilleure = i;
  });
  return meilleure;
}

/**
 * Résultat d'une demande d'aller dans une région : l'indice où l'on se trouve ensuite, et, si la région demandée est
 * fermée, `bloquee` avec son numéro (`visee`) pour dire comment l'ouvrir. `index` vaut -1 quand la demande ne vise
 * aucune région (hors de la liste).
 */
export type DeplacementRegion =
  | { readonly index: number; readonly bloquee: false }
  | { readonly index: number; readonly bloquee: true; readonly visee: number };

/** Va dans la région d'indice `cible` si elle est ouverte ; sinon reste où l'on est (`index` -1 pour « nulle part ») et le dit. */
export function regionVisee(s: Sauvegarde, regions: readonly RegionPourVue[], cible: number): DeplacementRegion {
  const region = regions[cible];
  if (!region) return { index: -1, bloquee: false };
  if (region.numero > s.meta.regionMax) return { index: -1, bloquee: true, visee: region.numero };
  return { index: cible, bloquee: false };
}

/** La région d'à côté (`sens` -1 ou 1) : atteinte si elle est ouverte, sinon on reste sur place et `bloquee` le dit. */
export function regionVoisine(s: Sauvegarde, regions: readonly RegionPourVue[], courante: number, sens: -1 | 1): DeplacementRegion {
  const cible = courante + sens;
  if (cible < 0 || cible >= regions.length) return { index: courante, bloquee: false };
  const r = regionVisee(s, regions, cible);
  return r.bloquee ? { index: courante, bloquee: true, visee: r.visee } : r;
}

/**
 * Nombre de tronçons du chemin à montrer : un tronçon relie deux nœuds visibles consécutifs (le tronçon i va
 * du nœud i + 1 au nœud i + 2). Le reste du chemin se devine en pointillé.
 */
export function nombreTroncons(vues: readonly VueNoeud[]): number {
  let visibles = 0;
  while (visibles < vues.length && vues[visibles]?.visible) visibles++;
  return Math.max(0, visibles - 1);
}

/** Meilleures étoiles de ce niveau pour chaque difficulté, dans l'ordre d'affichage (Chaton, Matou, Vieux Sage). */
export function etoilesParDifficulte(s: Sauvegarde, numero: number): readonly { readonly difficulte: DifficulteSauvegarde; readonly etoiles: number }[] {
  return DIFFICULTES_SAUVEGARDE.map((difficulte) => ({ difficulte, etoiles: etoilesDe(s, numero, difficulte) }));
}

/**
 * Le nœud sélectionné quand la carte s'ouvre : le prochain niveau à jouer, sinon le dernier niveau visible
 * (région terminée). Rend -1 si aucun nœud n'est visible.
 */
export function noeudInitial(vues: readonly VueNoeud[]): number {
  const suivant = vues.findIndex((v) => v.clignote);
  if (suivant !== -1) return suivant;
  for (let i = vues.length - 1; i >= 0; i--) if (vues[i]?.visible) return i;
  return -1;
}

export type Direction = 'gauche' | 'droite' | 'haut' | 'bas';

/**
 * Où va une flèche : le chemin se parcourt dans l'ordre des niveaux, gauche et haut reculent, droite et bas
 * avancent. Seuls les nœuds visibles sont atteignables ; au bout du chemin, la sélection ne bouge pas.
 */
export function noeudVoisin(vues: readonly VueNoeud[], courant: number, direction: Direction): number {
  const pas = direction === 'gauche' || direction === 'haut' ? -1 : 1;
  const suivant = courant + pas;
  return vues[suivant]?.visible ? suivant : courant;
}

/** Le nœud visible touché au point (x, y) du fond (pixels logiques), à `rayon` près ; -1 si aucun. Le plus proche l'emporte. */
export function noeudToucheA(vues: readonly VueNoeud[], x: number, y: number, rayon: number): number {
  let meilleur = -1;
  let meilleure = rayon * rayon;
  vues.forEach((v, i) => {
    if (!v.visible) return;
    const d = (v.x - x) * (v.x - x) + (v.y - y) * (v.y - y);
    if (d <= meilleure) {
      meilleur = i;
      meilleure = d;
    }
  });
  return meilleur;
}

/** La touche du clavier vers une direction de flèche, ou null. */
export function directionDeTouche(key: string): Direction | null {
  switch (key) {
    case 'ArrowLeft':
      return 'gauche';
    case 'ArrowRight':
      return 'droite';
    case 'ArrowUp':
      return 'haut';
    case 'ArrowDown':
      return 'bas';
    default:
      return null;
  }
}
