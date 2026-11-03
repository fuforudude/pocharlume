// Un sprite de l'atlas dessiné et animé dans un petit canvas du DOM (fiche du Bestiaire, fiche « Nouvel ennemi »). Le canvas boucle sur
// l'animation demandée jusqu'à ce que `signal` soit annulé ; `silhouette` le montre en ombre (ennemi jamais rencontré), sans l'animer.
import { cadreA } from '../render/animations';
import type { AtlasRendu } from '../render/atlas';
import { el } from './dom';

export interface OptionsSpriteAnime {
  /** Agrandissement entier (2 : deux pixels écran par pixel du sprite). */
  readonly echelle: number;
  /** Animation jouée en boucle (`marche` pour un ennemi) ; `repos` si le sprite n'a pas celle-ci. */
  readonly animation: string;
  /** Ombre noire, immobile. */
  readonly silhouette?: boolean;
  /** Arrête l'animation (écran fermé). */
  readonly signal: AbortSignal;
}

/**
 * Le canvas d'un sprite. Si l'atlas ne connaît pas ce sprite (ou si le contexte 2D manque), le canvas reste vide : l'écran dit déjà le
 * nom de l'ennemi, l'image est un plus qui ne doit jamais faire échouer une fiche.
 */
export function creerSpriteAnime(atlas: AtlasRendu, nomSprite: string, options: OptionsSpriteAnime): HTMLCanvasElement {
  const canvas = el('canvas', options.silhouette === true ? 'sprite-anime silhouette' : 'sprite-anime');
  canvas.setAttribute('aria-hidden', 'true');
  const sprite = atlas.sprite(nomSprite);
  if (!sprite) return canvas;
  const { echelle } = options;
  canvas.width = sprite.largeur * echelle;
  canvas.height = sprite.hauteur * echelle;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  const animation = atlas.animation(sprite, options.animation);
  if (!animation) return canvas;
  let indiceDessine = -1;
  const dessiner = (ms: number): void => {
    const cadre = cadreA(animation, ms);
    // Ne redessine que si le cadre change : une fiche ouverte ne coûte presque rien.
    const indice = animation.cadres.indexOf(cadre);
    if (indice === indiceDessine) return;
    indiceDessine = indice;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    atlas.dessinerEchelle(ctx, sprite, cadre, sprite.ancre.x * echelle, sprite.ancre.y * echelle, echelle);
  };
  dessiner(0);
  if (options.silhouette === true || animation.cadres.length <= 1 || options.signal.aborted) return canvas;
  const debut = performance.now();
  let image = 0;
  const boucle = (maintenant: number): void => {
    dessiner(maintenant - debut);
    image = requestAnimationFrame(boucle);
  };
  image = requestAnimationFrame(boucle);
  options.signal.addEventListener('abort', () => { cancelAnimationFrame(image); }, { once: true });
  return canvas;
}
