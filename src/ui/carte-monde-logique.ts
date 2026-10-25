// Logique pure de la carte du monde : quels nœuds se voient, ce qu'ils affichent, où on touche, où vont les
// flèches. Aucune dépendance au DOM ni au canvas : l'écran (carte-monde.ts) et le rendu (render/carte-monde.ts)
// ne font que la dessiner.
import type { NoeudNiveau } from '../data/niveaux/carte-du-monde';
import { DIFFICULTES_SAUVEGARDE, etoilesDe, meilleuresEtoiles, niveauDebloque, niveauReussi, type DifficulteSauvegarde, type Sauvegarde } from '../save';

/** Ce que la carte montre d'un nœud, d'après la sauvegarde. */
export interface VueNoeud extends NoeudNiveau {
  /** Débloqué : seuls les niveaux débloqués se voient et se touchent. */
  readonly visible: boolean;
  /** Le prochain niveau à jouer (débloqué, jamais réussi) : le nœud clignote. */
  readonly clignote: boolean;
  readonly reussi: boolean;
  /** Meilleur résultat toutes difficultés confondues, 0 à 3. */
  readonly etoiles: number;
}

/** Les nœuds d'une région d'après la sauvegarde. `numero` d'un nœud est le numéro du niveau de campagne. */
export function vueNoeuds(s: Sauvegarde, noeuds: readonly NoeudNiveau[]): VueNoeud[] {
  return noeuds.map((n) => {
    const visible = niveauDebloque(s, n.numero);
    const reussi = niveauReussi(s, n.numero);
    return { ...n, visible, reussi, clignote: visible && !reussi, etoiles: meilleuresEtoiles(s, n.numero) };
  });
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
