// Les défis réussis, marqués sur les nœuds de la carte du monde (icônes `icone-defi-heroique` et `icone-defi-fer`).
// Le rendu de la carte (src/render/carte-monde.ts) dessine les nœuds dans son tampon ; ces petites icônes sont posées par
// l'interface juste après, directement sur le canvas, à l'échelle entière de la caméra (pixels nets).
import type { AtlasRendu } from '../render/atlas';
import { iconesDefis, type VueNoeud } from './carte-monde-logique';

/** Ce que le dessin lit de la caméra de la carte (zoom entier, coin haut gauche de la vue en pixels du fond). */
export interface VueCamera {
  readonly zoom: number;
  readonly decalageX: number;
  readonly decalageY: number;
}

export function dessinerIconesDefis(ctx: CanvasRenderingContext2D, atlas: AtlasRendu, camera: VueCamera, noeuds: readonly VueNoeud[]): void {
  for (const n of noeuds) {
    if (!n.visible) continue;
    for (const icone of iconesDefis(n.defis)) {
      const sprite = atlas.sprite(icone.sprite);
      const cadre = sprite ? atlas.cadre(sprite, 'repos', 0) : undefined;
      if (!sprite || !cadre) continue;
      const x = (Math.round(n.x) + icone.dx - camera.decalageX) * camera.zoom;
      const y = (Math.round(n.y) + icone.dy - camera.decalageY) * camera.zoom;
      atlas.dessinerEchelle(ctx, sprite, cadre, x, y, camera.zoom);
    }
  }
}
