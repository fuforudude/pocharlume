// Caméra : quelle partie de la carte on voit, à quel zoom. Logique pure, sans DOM.
//
// Unités : le monde se mesure en pixels logiques (une tuile = 16 px, la carte fait 512 × 288) ; l'écran en
// pixels physiques (taille du canvas, `devicePixelRatio` compris). Le zoom est un entier : un pixel logique
// couvre exactement `zoom` pixels d'écran, donc le pixel art reste net. Le jeu se dessine dans un tampon
// de `vueL × vueH` pixels logiques, que l'affichage agrandit du facteur `zoom` sans lissage.
export const TUILE = 16;

/** Paliers de zoom au-dessus du plus petit (celui qui montre toute la carte). */
const PALIERS_AU_DESSUS = 3;
/** Défilement de molette (en pixels) pour un palier de zoom : une molette à crans en fait 100 d'un coup. */
const MOLETTE_PAR_PALIER = 60;

function borner(valeur: number, min: number, max: number): number {
  return Math.min(Math.max(valeur, min), max);
}

export class Camera {
  zoom = 1;
  zoomMin = 1;
  zoomMax = 1 + PALIERS_AU_DESSUS;
  /** Coin haut gauche de la vue, en pixels logiques (peut être négatif si la carte est plus petite que la vue). */
  x = 0;
  y = 0;
  /** Taille de l'écran en pixels physiques. */
  ecranL = 1;
  ecranH = 1;
  /**
   * Bandes de l'écran recouvertes par l'interface (barres du HUD, encoche), en pixels physiques. La vue peut
   * dépasser la carte de cette largeur de chaque côté, pour qu'une case collée au bord puisse être amenée dans la
   * zone libre au lieu de rester sous un bouton.
   */
  private margeHaut = 0;
  private margeBas = 0;
  private margeGauche = 0;
  private margeDroite = 0;

  /** Zoom en dessous duquel on ne descend pas (cases assez grandes pour le doigt), 1 si aucun. */
  private plancher = 1;
  private pret = false;
  private zoomDebutPincement = 1;
  private cumulMolette = 0;

  constructor(
    /** Taille de la carte en pixels logiques. */
    readonly mondeL: number,
    readonly mondeH: number,
  ) {}

  /** Largeur et hauteur du tampon de dessin, en pixels logiques (arrondies au-dessus pour couvrir l'écran). */
  get vueL(): number {
    return Math.ceil(this.ecranL / this.zoom);
  }

  get vueH(): number {
    return Math.ceil(this.ecranH / this.zoom);
  }

  /** Décalage entier du monde dans le tampon : on dessine le point (wx, wy) en (wx - decalageX, wy - decalageY). */
  get decalageX(): number {
    return Math.round(this.x);
  }

  get decalageY(): number {
    return Math.round(this.y);
  }

  /**
   * Prend en compte la taille de l'écran. Le plus petit zoom est le plus grand entier qui montre toute la
   * carte (des bandes noires restent autour) ; au premier appel, on part de ce zoom, sauf s'il vaut 1 et
   * que 2 est possible : à 1 la carte serait minuscule. Aux appels suivants, le zoom choisi est gardé.
   */
  redimensionner(ecranL: number, ecranH: number): void {
    this.ecranL = Math.max(1, Math.round(ecranL));
    this.ecranH = Math.max(1, Math.round(ecranH));
    const ajuste = Math.min(this.ecranL / this.mondeL, this.ecranH / this.mondeH);
    this.zoomMin = Math.max(1, Math.floor(ajuste), this.plancher);
    this.zoomMax = this.zoomMin + PALIERS_AU_DESSUS;
    if (this.pret) {
      this.zoom = borner(this.zoom, this.zoomMin, this.zoomMax);
    } else {
      this.zoom = Math.max(this.zoomMin, Math.min(2, Math.ceil(ajuste)));
      this.x = (this.mondeL - this.vueL) / 2;
      this.y = (this.mondeH - this.vueH) / 2;
      this.pret = true;
    }
    this.contraindre();
  }

  /**
   * Zoom minimal imposé par le joueur ou l'appareil (écran tactile : voir `zoomPourCase`), même si la carte entière tiendrait
   * à un zoom plus petit. Prend effet au prochain `redimensionner`.
   */
  definirPlancherZoom(zoom: number): void {
    this.plancher = Number.isFinite(zoom) && zoom > 1 ? Math.floor(zoom) : 1;
  }

  /** Marges de l'interface (pixels physiques) ; une valeur négative ou qui n'est pas un nombre fini compte pour 0. */
  definirMarges(haut: number, bas: number, gauche: number, droite: number): void {
    const propre = (v: number): number => (Number.isFinite(v) && v > 0 ? v : 0);
    this.margeHaut = propre(haut);
    this.margeBas = propre(bas);
    this.margeGauche = propre(gauche);
    this.margeDroite = propre(droite);
    this.contraindre();
  }

  /**
   * Garde la vue sur la carte, à ceci près qu'elle peut dépasser de la largeur des marges de l'interface. Si la
   * carte tient en entier dans la zone libre, elle y est centrée.
   */
  contraindre(): void {
    this.x = this.borne(this.x, this.mondeL, this.vueL, this.margeGauche, this.margeDroite);
    this.y = this.borne(this.y, this.mondeH, this.vueH, this.margeHaut, this.margeBas);
  }

  private borne(valeur: number, monde: number, vue: number, margeAvant: number, margeApres: number): number {
    const avant = margeAvant / this.zoom;
    const apres = margeApres / this.zoom;
    const libre = vue - avant - apres;
    if (monde <= libre) return (monde - libre) / 2 - avant;
    return borner(valeur, 0 - avant, monde - vue + apres);
  }

  /** Glisser : le contenu suit le doigt de (dx, dy) pixels d'écran. */
  deplacer(dx: number, dy: number): void {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
    this.contraindre();
  }

  /**
   * Passe au zoom entier demandé (borné aux paliers), en gardant sous (foyerX, foyerY) le point du monde qui
   * s'y trouvait. Renvoie vrai si le zoom a changé.
   */
  definirZoom(zoom: number, foyerX: number, foyerY: number): boolean {
    const cible = borner(Math.round(zoom), this.zoomMin, this.zoomMax);
    if (cible === this.zoom) return false;
    const mx = foyerX / this.zoom + this.decalageX;
    const my = foyerY / this.zoom + this.decalageY;
    this.zoom = cible;
    this.x = mx - foyerX / cible;
    this.y = my - foyerY / cible;
    this.contraindre();
    return true;
  }

  /** Molette ou pavé tactile : un palier par tranche de défilement, vers le haut pour zoomer. */
  molette(deltaY: number, foyerX: number, foyerY: number): boolean {
    this.cumulMolette += deltaY;
    let change = false;
    while (Math.abs(this.cumulMolette) >= MOLETTE_PAR_PALIER) {
      const sens = this.cumulMolette < 0 ? 1 : -1;
      this.cumulMolette += sens * MOLETTE_PAR_PALIER;
      change = this.definirZoom(this.zoom + sens, foyerX, foyerY) || change;
    }
    return change;
  }

  /** Début d'un geste à deux doigts. */
  debutPincement(): void {
    this.zoomDebutPincement = this.zoom;
  }

  /** `facteur` : écartement actuel des doigts divisé par l'écartement initial. */
  pincement(facteur: number, foyerX: number, foyerY: number): boolean {
    return this.definirZoom(this.zoomDebutPincement * facteur, foyerX, foyerY);
  }

  /** Point de l'écran (pixels physiques) vers le monde (pixels logiques). */
  versMondeX(ecranX: number): number {
    return ecranX / this.zoom + this.decalageX;
  }

  versMondeY(ecranY: number): number {
    return ecranY / this.zoom + this.decalageY;
  }

  /** Point du monde (pixels logiques) vers l'écran (pixels physiques). */
  versEcranX(mondeX: number): number {
    return (mondeX - this.decalageX) * this.zoom;
  }

  versEcranY(mondeY: number): number {
    return (mondeY - this.decalageY) * this.zoom;
  }
}
