// Reconnaissance des gestes à partir des événements pointeur (doigt, souris, stylet) : toucher, glisser pour
// déplacer la caméra, pincer à deux doigts pour zoomer. Logique pure : le DOM lui passe les événements.
// Coordonnées en pixels CSS.

/** Déplacement (pixels CSS) en deçà duquel un appui reste un toucher : un doigt n'est jamais parfaitement immobile. */
export const SEUIL_GLISSEMENT = 8;

export interface RappelsGestes {
  /** Appui relâché sans avoir bougé. */
  toucher(x: number, y: number): void;
  /** Le contenu suit le doigt de (dx, dy). */
  glisser(dx: number, dy: number): void;
  /** Début d'un geste à deux doigts. */
  debutPincement(): void;
  /** `facteur` : écartement actuel des doigts / écartement du début ; (x, y) : milieu des doigts. */
  pincer(facteur: number, x: number, y: number): void;
  /** La souris bouge sans appui (visée des sorts). */
  survol(x: number, y: number): void;
}

interface Pointeur {
  x: number;
  y: number;
  /** Position de l'appui. */
  x0: number;
  y0: number;
}

export class Gestes {
  private readonly pointeurs = new Map<number, Pointeur>();
  private deplace = false;
  private pince = false;
  private distanceDebut = 1;
  private milieuX = 0;
  private milieuY = 0;

  constructor(private readonly rappels: RappelsGestes) {}

  appuyer(id: number, x: number, y: number): void {
    if (this.pointeurs.size === 0) {
      this.deplace = false;
      this.pince = false;
    }
    this.pointeurs.set(id, { x, y, x0: x, y0: y });
    if (this.pointeurs.size === 2) {
      this.pince = true;
      this.distanceDebut = Math.max(1, this.ecartement());
      this.recalerMilieu();
      this.rappels.debutPincement();
    }
  }

  bouger(id: number, x: number, y: number): void {
    const p = this.pointeurs.get(id);
    if (!p) {
      if (this.pointeurs.size === 0) this.rappels.survol(x, y);
      return;
    }
    const dx = x - p.x;
    const dy = y - p.y;
    p.x = x;
    p.y = y;
    if (this.pointeurs.size >= 2) {
      if (!this.pince) return;
      const ancienX = this.milieuX;
      const ancienY = this.milieuY;
      this.recalerMilieu();
      this.rappels.glisser(this.milieuX - ancienX, this.milieuY - ancienY);
      this.rappels.pincer(this.ecartement() / this.distanceDebut, this.milieuX, this.milieuY);
      return;
    }
    if (this.pince) return;
    if (!this.deplace) {
      if (Math.hypot(x - p.x0, y - p.y0) < SEUIL_GLISSEMENT) return;
      this.deplace = true;
      // Dès que le seuil est franchi, on rattrape tout le chemin déjà fait : le contenu ne « saute » pas.
      this.rappels.glisser(x - p.x0, y - p.y0);
      return;
    }
    this.rappels.glisser(dx, dy);
  }

  relacher(id: number, x: number, y: number): void {
    const p = this.pointeurs.get(id);
    if (!p) return;
    const etaitSeul = this.pointeurs.size === 1;
    this.pointeurs.delete(id);
    if (etaitSeul && !this.pince && !this.deplace) this.rappels.toucher(x, y);
    if (this.pointeurs.size === 0) {
      this.deplace = false;
      this.pince = false;
    }
  }

  /** Geste interrompu par le système (appel entrant, changement d'application) : rien ne se déclenche. */
  annuler(id: number): void {
    this.pointeurs.delete(id);
    if (this.pointeurs.size === 0) {
      this.deplace = false;
      this.pince = false;
    }
  }

  /** Oublie tous les appuis (fenêtre qui perd le focus). */
  reinitialiser(): void {
    this.pointeurs.clear();
    this.deplace = false;
    this.pince = false;
  }

  private ecartement(): number {
    const [a, b] = [...this.pointeurs.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 1;
  }

  private recalerMilieu(): void {
    const [a, b] = [...this.pointeurs.values()];
    if (!a || !b) return;
    this.milieuX = (a.x + b.x) / 2;
    this.milieuY = (a.y + b.y) / 2;
  }
}
