// Lecteur d'animations : joue chaque animation d'un aperçu, à taille réelle et agrandie, sur le fond du jeu.
import type { ApercuSprite } from '../types.ts';
import { canvasDe, el } from './outils.ts';

interface Joueur {
  readonly canvas: HTMLCanvasElement[];
  readonly zooms: number[];
  readonly animation: ApercuSprite['animations'][number];
  indice: number;
  depuis: number;
}

export class LecteurAnimations {
  private joueurs: Joueur[] = [];
  private image: number | null = null;
  private sprite: ApercuSprite | null = null;

  constructor(private readonly zone: HTMLElement, private fond: string, private readonly zoomsAffiches: readonly number[] = [1, 4]) {}

  /** Remplace l'aperçu affiché. Les minuteries repartent de zéro. */
  afficher(sprite: ApercuSprite, fond: string): void {
    this.sprite = sprite;
    this.fond = fond;
    this.zone.replaceChildren();
    this.joueurs = [];
    for (const animation of sprite.animations) {
      const canvas = this.zoomsAffiches.map((zoom) => {
        const c = document.createElement('canvas');
        c.width = sprite.largeur * zoom;
        c.height = sprite.hauteur * zoom;
        c.title = `${animation.nom} ×${String(zoom)}`;
        return c;
      });
      const boite = el('div', { class: 'anim' }, el('h4', { texte: `${animation.nom}${animation.boucle ? '' : ' (une fois)'} — ${String(animation.cadres.length)} cadre(s)` }), el('div', { class: 'vues' }, ...canvas));
      this.zone.append(boite);
      this.joueurs.push({ canvas, zooms: [...this.zoomsAffiches], animation, indice: 0, depuis: performance.now() });
    }
    this.dessinerTout();
    this.demarrer();
  }

  private demarrer(): void {
    if (this.image !== null) return;
    const boucle = (maintenant: number): void => {
      for (const j of this.joueurs) {
        const cadre = j.animation.cadres[j.indice];
        if (!cadre || j.animation.cadres.length < 2) continue;
        if (maintenant - j.depuis >= cadre.duree) {
          j.depuis = maintenant;
          j.indice = j.animation.boucle ? (j.indice + 1) % j.animation.cadres.length : Math.min(j.indice + 1, j.animation.cadres.length - 1);
          // Une animation jouée une fois repart au bout d'une pause, pour qu'on la revoie pendant la retouche.
          if (!j.animation.boucle && j.indice === j.animation.cadres.length - 1) setTimeout(() => { j.indice = 0; }, 700);
          this.dessiner(j);
        }
      }
      this.image = requestAnimationFrame(boucle);
    };
    this.image = requestAnimationFrame(boucle);
  }

  private dessinerTout(): void {
    for (const j of this.joueurs) this.dessiner(j);
  }

  private dessiner(j: Joueur): void {
    const cadre = j.animation.cadres[j.indice];
    if (!cadre || !this.sprite) return;
    j.canvas.forEach((c) => {
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = this.fond;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(canvasDe(cadre.image), 0, 0, c.width, c.height);
    });
  }

  arreter(): void {
    if (this.image !== null) cancelAnimationFrame(this.image);
    this.image = null;
    this.joueurs = [];
  }
}
