// Effets visuels éphémères (impacts, ondes, fumées, cadavres, nombres flottants…) tirés d'un pool d'objets
// créé une fois : en jeu, déclencher un effet ne crée aucun objet (on réutilise un effet inactif, ou le plus
// ancien quand tout est occupé).
import type { SpriteAtlas } from './atlas';

export const TYPE_EFFET = {
  /** Animation d'atlas jouée une fois à (x, y), éventuellement agrandie d'un entier. */
  sprite: 0,
  /** Ennemi qui meurt : animation de mort jouée une fois, puis le corps s'estompe. */
  fantome: 1,
  /** Rayon instantané de (x, y) à (x2, y2). */
  rayon: 2,
  /** Nombre qui monte et s'efface (prime en arêtes). */
  texte: 3,
  /** Marque d'un ordre (héros, ralliement) : anneau qui se resserre. */
  ordre: 4,
} as const;

export class Effet {
  actif = false;
  type: number = TYPE_EFFET.sprite;
  sprite: SpriteAtlas | null = null;
  anim = 'impact';
  miroir = false;
  /** Position dans le monde en pixels logiques (au sol pour un sprite : l'ancre du sprite y est posée). */
  x = 0;
  y = 0;
  x2 = 0;
  y2 = 0;
  /** Agrandissement entier (onde de choc). */
  echelle = 1;
  /** Instant de départ et durée, en millisecondes de temps de jeu (qui s'arrête en pause). */
  debut = 0;
  duree = 0;
  /** Nombre affiché (texte) ou rayon en pixels (ordre). */
  valeur = 0;
  couleur = '#ffffff';
}

export class PoolEffets {
  readonly liste: Effet[];
  private curseur = 0;

  constructor(taille = 192) {
    this.liste = Array.from({ length: taille }, () => new Effet());
  }

  /** Un effet prêt à remplir, remis à zéro. Si tous sont occupés, le plus ancien est recyclé. */
  prendre(type: number, temps: number, duree: number): Effet {
    const n = this.liste.length;
    let choisi: Effet | undefined;
    for (let i = 0; i < n; i++) {
      const index = (this.curseur + i) % n;
      const e = this.liste[index];
      if (e && !e.actif) {
        choisi = e;
        this.curseur = index + 1;
        break;
      }
    }
    if (!choisi) {
      choisi = this.liste[this.curseur % n];
      this.curseur++;
    }
    if (!choisi) throw new Error('Pool d’effets vide');
    choisi.actif = true;
    choisi.type = type;
    choisi.sprite = null;
    choisi.anim = 'impact';
    choisi.miroir = false;
    choisi.x = 0;
    choisi.y = 0;
    choisi.x2 = 0;
    choisi.y2 = 0;
    choisi.echelle = 1;
    choisi.debut = temps;
    choisi.duree = duree;
    choisi.valeur = 0;
    choisi.couleur = '#ffffff';
    return choisi;
  }

  /** Libère les effets dont la durée est écoulée. */
  nettoyer(temps: number): void {
    for (const e of this.liste) if (e.actif && temps - e.debut >= e.duree) e.actif = false;
  }

  get actifs(): number {
    let n = 0;
    for (const e of this.liste) if (e.actif) n++;
    return n;
  }
}
