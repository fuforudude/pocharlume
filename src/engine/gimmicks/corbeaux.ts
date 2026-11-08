// Vol de Corbeaux : des volants traversent la carte dans des couloirs horizontaux, du bord gauche au bord droit, sans suivre de
// chemin. Un couloir est précalculé comme un chemin droit (`EtatPartie.couloirs`) : le déplacement, la fuite et le ciblage sont
// ceux des autres ennemis, par `trajetEnnemi` (chemins.ts). Les règles des volants (soldats, tours, sorts) valent telles quelles.
import { REGLES } from '../../data/regles';
import { calculerChemin } from '../chemins';
import type { DefEnnemi, GimmickCorbeaux, Niveau, Paquet } from '../definitions';
import type { CheminCalcule, EtatPartie } from '../etat';
import { centreCase, lignes } from '../grille';

/** Le gimmick Corbeaux du niveau, s'il en a un. */
function gimmickCorbeaux(niveau: Niveau): GimmickCorbeaux | undefined {
  return niveau.gimmick?.type === 'corbeaux' ? niveau.gimmick : undefined;
}

/** Seul un volant traverse un couloir : la même règle sert à la validation du niveau et à l'apparition. */
export function peutVolerEnCouloir(def: Pick<DefEnnemi, 'volant'>): boolean {
  return def.volant;
}

/** Vérifie les couloirs du gimmick : chacun sur une ligne de la grille de la carte. */
export function verifierCorbeaux(niveau: Niveau, gimmick: GimmickCorbeaux): void {
  const max = lignes(niveau.carte);
  gimmick.couloirs.forEach((c, k) => {
    if (!Number.isInteger(c.cy) || c.cy < 0 || c.cy >= max) throw new Error(`Corbeaux : couloir ${String(k)} hors de la grille (ligne ${String(c.cy)})`);
  });
  if (gimmick.coutVies !== undefined && (!Number.isInteger(gimmick.coutVies) || gimmick.coutVies < 0)) throw new Error(`Corbeaux : coût en vies invalide ${String(gimmick.coutVies)}`);
}

/** Vérifie un groupe qui vole en couloir (vague numéro `vague`, de 1) : couloir du gimmick et ennemi volant. */
export function verifierPaquetEnCouloir(niveau: Niveau, paquet: Paquet, def: DefEnnemi, vague: number): void {
  const couloir = paquet.couloir;
  if (couloir === undefined) return;
  const nombre = gimmickCorbeaux(niveau)?.couloirs.length ?? 0;
  if (!Number.isInteger(couloir) || couloir < 0 || couloir >= nombre) throw new Error(`Vague ${String(vague)} : couloir inconnu ${String(couloir)}`);
  if (!peutVolerEnCouloir(def)) throw new Error(`Vague ${String(vague)} : ${paquet.ennemi} ne vole pas, il ne peut pas traverser un couloir`);
}

/** Les couloirs du niveau en chemins droits, du bord gauche (x = 0) au bord droit (x = largeur) ; aucun sans gimmick Corbeaux. */
export function calculerCouloirs(niveau: Niveau): CheminCalcule[] {
  const gimmick = gimmickCorbeaux(niveau);
  if (!gimmick) return [];
  return gimmick.couloirs.map((c) => {
    const y = centreCase(0, c.cy).y;
    return calculerChemin({ points: [{ x: 0, y }, { x: niveau.carte.largeur, y }] });
  });
}

/** Cœurs que coûte un ennemi sorti d'un couloir : la valeur du gimmick, sinon celle des règles. */
export function coutViesCouloir(etat: Pick<EtatPartie, 'niveau'>): number {
  return gimmickCorbeaux(etat.niveau)?.coutVies ?? REGLES.coutViesCouloir;
}
