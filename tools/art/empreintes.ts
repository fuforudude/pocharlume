// Empreinte des cadres d'un sprite (SHA-256 de leurs pixels, animation par animation), pour comparer deux états de l'atlas.
import { createHash } from 'node:crypto';
import type { SpriteDessine } from './dessin.ts';

/** Une empreinte courte par animation : `anim` → hash de tous ses cadres (taille, pixels, durée). */
export function empreintesSprite(s: SpriteDessine): Record<string, string> {
  const res: Record<string, string> = {};
  for (const a of s.anims) {
    const h = createHash('sha256');
    for (const c of a.cadres) {
      h.update(`${String(c.couche.largeur)}x${String(c.couche.hauteur)}:${String(c.duree)}:`);
      h.update(c.couche.pixels);
    }
    res[a.nom] = h.digest('hex').slice(0, 16);
  }
  return res;
}
