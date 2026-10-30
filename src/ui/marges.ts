// Marges de l'interface de partie : les bandes de l'écran que les barres du HUD (haut et bas) et l'encoche du
// téléphone recouvrent. La caméra s'en sert pour laisser la carte dépasser de ces bandes, afin qu'une case collée
// au bord puisse être amené dans la zone libre. Le calcul est pur ; la lecture du DOM est à part.

/** Un rectangle d'écran en pixels CSS (la forme d'un `DOMRect`). */
export interface Rectangle {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** Bandes recouvertes, en pixels CSS. */
export interface Marges {
  readonly haut: number;
  readonly bas: number;
  readonly gauche: number;
  readonly droite: number;
}

/** Une marge ne mange jamais plus de cette part de l'écran : il doit rester de la carte à voir. */
const PART_MAX = 0.4;

function positif(valeur: number): number {
  return Number.isFinite(valeur) && valeur > 0 ? valeur : 0;
}

function plafonner(valeur: number, total: number): number {
  return Math.min(positif(valeur), positif(total) * PART_MAX);
}

/**
 * Marges d'après les rectangles des groupes du HUD collés en haut et en bas, et les zones sûres de l'écran
 * (encoche, barre système). Un groupe du haut recouvre l'écran jusqu'à son bord bas, un groupe du bas depuis son
 * bord haut.
 */
export function calculerMarges(
  ecran: { readonly largeur: number; readonly hauteur: number },
  groupesHaut: readonly Rectangle[],
  groupesBas: readonly Rectangle[],
  zonesSures: Marges,
): Marges {
  let haut = positif(zonesSures.haut);
  let bas = positif(zonesSures.bas);
  for (const r of groupesHaut) {
    if (r.right > r.left && r.bottom > r.top) haut = Math.max(haut, positif(r.bottom));
  }
  for (const r of groupesBas) {
    if (r.right > r.left && r.bottom > r.top && r.top < ecran.hauteur) bas = Math.max(bas, positif(ecran.hauteur - r.top));
  }
  return {
    haut: plafonner(haut, ecran.hauteur),
    bas: plafonner(bas, ecran.hauteur),
    gauche: plafonner(zonesSures.gauche, ecran.largeur),
    droite: plafonner(zonesSures.droite, ecran.largeur),
  };
}

/** Zones sûres de l'écran en pixels CSS, lues par une sonde invisible qui prend les `env(safe-area-inset-*)`. */
export function lireZonesSures(racine: HTMLElement): Marges {
  const sonde = document.createElement('div');
  sonde.setAttribute('aria-hidden', 'true');
  sonde.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  racine.append(sonde);
  const style = getComputedStyle(sonde);
  const zones = {
    haut: positif(Number.parseFloat(style.paddingTop)),
    bas: positif(Number.parseFloat(style.paddingBottom)),
    gauche: positif(Number.parseFloat(style.paddingLeft)),
    droite: positif(Number.parseFloat(style.paddingRight)),
  };
  sonde.remove();
  return zones;
}

/**
 * Mesure dans le DOM les bandes que le HUD recouvre. Les groupes `.haut-gauche` et `.haut-droite` sont les barres du
 * haut, `.bas-gauche` et `.bas-droite` celles du bas. À appeler quand la taille de l'écran change, pas à chaque image
 * (la lecture force la mise en page).
 */
export function mesurerMarges(racineHud: HTMLElement, largeur: number, hauteur: number): Marges {
  const rectangles = (selecteur: string): Rectangle[] =>
    Array.from(racineHud.querySelectorAll<HTMLElement>(selecteur), (noeud) => noeud.getBoundingClientRect());
  return calculerMarges(
    { largeur, hauteur },
    rectangles('.groupe.haut-gauche, .groupe.haut-droite'),
    rectangles('.groupe.bas-gauche, .groupe.bas-droite'),
    lireZonesSures(racineHud),
  );
}
