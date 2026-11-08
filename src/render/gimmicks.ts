// Rendu des gimmicks de la région 11 (Vol de Corbeaux, Radeau). Il lit l'état du moteur et ne le modifie jamais.
//
// - Couloirs : une brume en pointillé et des plumes en chevron le long de chaque couloir, toute la partie (immobiles si l'on réduit
//   les animations). Discrets : sous les entités, à peine plus clairs que le sol.
// - Radeau : sa position est une fonction pure du pas (`positionRadeau`, moteur). Le rendu la calcule pour un pas fractionnaire
//   (`pasAffiche`), au même instant que celui où les entités sont interpolées : les tours du radeau (interpolées entre deux pas par
//   le suivi) restent posées sur leurs places.
import { REGLES } from '../data/regles';
import { gimmickRadeau, positionPlace, positionRadeau, type EtatPartie } from '../engine';
import type { Point } from '../engine/definitions';
import { cadreA } from './animations';
import type { AtlasRendu, SpriteAtlas } from './atlas';
import { TUILE } from './camera';

/** Brume des couloirs : pixels clairs, très transparents. */
const BRUME = 'rgba(214, 222, 236, 0.22)';
/** Plumes des couloirs (chevrons qui montrent le sens du vol). */
const PLUME = 'rgba(28, 26, 34, 0.55)';
const PLUME_CLAIRE = 'rgba(200, 206, 220, 0.4)';
/** Écart entre deux chevrons d'un couloir, en pixels logiques (3 tuiles). */
const ECART_PLUMES = 48;
/** Durée (ms) pour que la brume défile d'un motif (8 px). */
const DEFILEMENT_MS = 900;
/** Corde du radeau entre son centre et une place qui dépasse de la plateforme. */
const CORDE = '#b08a52';

/**
 * Le pas, fractionnaire, auquel le rendu montre la partie : celui des positions interpolées. Après le pas p du moteur, `etat.pas`
 * vaut p + 1 et les tours du radeau sont à la position du pas p ; le suivi interpole entre p - 1 et p avec `alpha`. Le radeau
 * dessiné au pas `etat.pas - 2 + alpha` est donc exactement sous elles. Jamais négatif (avant le deuxième pas, au départ).
 */
export function pasAffiche(pas: number, alpha: number): number {
  return Math.max(0, pas - 2 + alpha);
}

/** Centre du radeau à l'écran (tuiles), ou null sans radeau. */
export function centreRadeauAffiche(etat: EtatPartie, alpha: number): Point | null {
  const g = gimmickRadeau(etat.niveau);
  return g ? positionRadeau(g, pasAffiche(etat.pas, alpha)) : null;
}

/** Position d'une place du radeau à l'écran (tuiles), ou null sans radeau ou sans cette place. */
export function placeAffichee(etat: EtatPartie, alpha: number, place: number): Point | null {
  const g = gimmickRadeau(etat.niveau);
  if (!g || place < 0 || place >= g.places.length) return null;
  return positionPlace(g, pasAffiche(etat.pas, alpha), place);
}

/**
 * Les points d'un couloir où poser un chevron de plume (pixels logiques, x croissant), tous les `ECART_PLUMES` pixels de la carte,
 * décalés de `decalage` (défilement), en gardant une marge aux deux bords.
 */
export function abscissesPlumes(largeurPx: number, decalage: number): number[] {
  const xs: number[] = [];
  const debut = ((decalage % ECART_PLUMES) + ECART_PLUMES) % ECART_PLUMES;
  for (let x = debut + ECART_PLUMES / 2; x < largeurPx - 8; x += ECART_PLUMES) if (x > 8) xs.push(Math.round(x));
  return xs;
}

export class DessinGimmicks {
  private readonly radeau: SpriteAtlas | undefined;
  private readonly place: SpriteAtlas | undefined;

  constructor(
    private readonly atlas: AtlasRendu,
    private readonly ctx: CanvasRenderingContext2D,
  ) {
    this.radeau = atlas.sprite('radeau');
    this.place = atlas.sprite('radeau-place');
  }

  /** La trace des couloirs : brume en pointillé et chevrons de plumes, sous les entités. `reduit` : rien ne bouge. */
  dessinerCouloirs(etat: EtatPartie, temps: number, reduit: boolean, ox: number, oy: number, l: number): void {
    const couloirs = etat.couloirs;
    if (couloirs.length === 0) return;
    const ctx = this.ctx;
    const largeurPx = etat.niveau.carte.largeur * TUILE;
    const defile = reduit ? 0 : Math.floor(temps / (DEFILEMENT_MS / 8));
    for (const couloir of couloirs) {
      const y = Math.round((couloir.points[0]?.y ?? 0) * TUILE) - oy;
      ctx.fillStyle = BRUME;
      // Deux rangs de pointillés décalés : une bande de brume d'un pixel d'épaisseur apparente, qui avance vers la droite.
      // Partie visible de la carte, en pixels du monde ; chaque motif commence sur un multiple de 8 décalé de `defile`.
      const x0 = Math.max(0, ox);
      const x1 = Math.min(largeurPx, ox + l);
      for (let x = x0 - ((((x0 - defile) % 8) + 8) % 8); x < x1; x += 8) {
        ctx.fillRect(x - ox, y - 3, 3, 1);
        ctx.fillRect(x - ox + 4, y + 3, 3, 1);
      }
      for (const x of abscissesPlumes(largeurPx, reduit ? 0 : Math.floor(temps / (DEFILEMENT_MS / 4)))) {
        const px = x - ox;
        if (px < -8 || px > l + 8) continue;
        this.chevron(px, y);
      }
    }
  }

  /** Une plume en chevron pointé vers la droite (le sens du vol), 5 px de haut. */
  private chevron(px: number, py: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = PLUME;
    ctx.fillRect(px - 2, py - 2, 1, 1);
    ctx.fillRect(px - 1, py - 1, 1, 1);
    ctx.fillRect(px, py, 1, 1);
    ctx.fillRect(px - 1, py + 1, 1, 1);
    ctx.fillRect(px - 2, py + 2, 1, 1);
    ctx.fillStyle = PLUME_CLAIRE;
    ctx.fillRect(px - 3, py - 2, 1, 1);
    ctx.fillRect(px - 3, py + 2, 1, 1);
  }

  /**
   * Le radeau au pas affiché : la plateforme centrée sur sa position, une corde vers chaque place qui dépasse, et la natte de
   * chaque place libre (une place occupée est cachée par sa tour). Sous les entités : il flotte, les tours sont posées dessus.
   */
  dessinerRadeau(etat: EtatPartie, alpha: number, ox: number, oy: number): void {
    const g = gimmickRadeau(etat.niveau);
    if (!g) return;
    const pas = pasAffiche(etat.pas, alpha);
    const centre = positionRadeau(g, pas);
    const cx = Math.round(centre.x * TUILE) - ox;
    const cy = Math.round(centre.y * TUILE) - oy;
    const ctx = this.ctx;
    const plateforme = this.radeau;
    const animRadeau = plateforme ? this.atlas.animation(plateforme, 'repos') : undefined;
    if (plateforme && animRadeau) this.atlas.dessiner(ctx, plateforme, cadreA(animRadeau, 0), cx, cy, false);
    else {
      ctx.fillStyle = '#705030';
      ctx.fillRect(cx - 20, cy - 12, 40, 24);
    }
    const demiL = plateforme ? plateforme.largeur / 2 : 20;
    const demiH = plateforme ? plateforme.hauteur / 2 : 12;
    const natte = this.place;
    const animNatte = natte ? this.atlas.animation(natte, 'repos') : undefined;
    for (let n = 0; n < g.places.length; n++) {
      const p = positionPlace(g, pas, n);
      const px = Math.round(p.x * TUILE) - ox;
      const py = Math.round(p.y * TUILE) - oy;
      // Une place hors de la plateforme (décalage plus grand que le dessin) y reste liée par une corde.
      if (Math.abs(px - cx) > demiL - 4 || Math.abs(py - cy) > demiH - 4) {
        ctx.fillStyle = CORDE;
        const pasCorde = Math.max(Math.abs(px - cx), Math.abs(py - cy));
        for (let i = 0; i <= pasCorde; i += 2) ctx.fillRect(Math.round(cx + ((px - cx) * i) / pasCorde), Math.round(cy + ((py - cy) * i) / pasCorde), 1, 1);
      }
      if (etat.tours.some((t) => t.place === n)) continue;
      if (natte && animNatte) this.atlas.dessiner(ctx, natte, cadreA(animNatte, 0), px, py, false);
    }
  }
}

/** Demi-côté (pixels logiques) du cadre de visée d'une place du radeau : une tuile de large. */
export const DEMI_VISEE_PLACE = Math.round((REGLES.tailleCase * TUILE) / 4);
