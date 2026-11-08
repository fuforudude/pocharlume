// Suivi visuel des entités du moteur : le moteur ne garde ni l'image précédente d'une position, ni l'état d'une
// animation. Après chaque pas, on y note pour chaque ennemi, unité, tour et projectile : où il était, où il
// est, vers où il regarde, quelle action il joue (attaque, blessé, mort…). Le rendu interpole entre les deux
// positions. Les événements du pas (tir, impact, mort…) déclenchent animations et effets.
//
// Tout est réutilisé d'un pas à l'autre : les objets sortis du jeu rejoignent une réserve, les effets
// viennent d'un pool. Seule la création d'une entité nouvelle peut allouer (et seulement au début).
import { DIEUX } from '../data/dieux';
import { type Ennemi, type EtatPartie, type Evenement, type Projectile, type Tour, type Unite } from '../engine';
import type { Voie } from '../engine/definitions';
import type { FamilleTour } from '../engine/etat';
import { dureeAnimation } from './animations';
import type { AtlasRendu, SpriteAtlas, SpriteHabille } from './atlas';
import { TUILE } from './camera';
import { TYPE_EFFET, type Effet, type PoolEffets } from './effets';
import { DUREE_ANNEAU, DUREE_POUSSIERE, haloDe, requeteAnimationsReduites, type DefHalo } from './effets-tours';
import {
  effetObjet,
  habillageSort,
  idHerosDe,
  nomPointDeTir,
  projectileTourne,
  spriteEnnemi,
  spriteEnnemiElite,
  spriteFamilier,
  spriteImpact,
  spriteProjectile,
  spriteStructure,
  spriteTireur,
  spriteTour,
  spriteUnite,
} from './habillage';

/**
 * Une tour posée est dessinée ce nombre de pixels plus bas que le centre de sa case : l'ancre du sprite est au pied du fût, et c'est
 * l'empreinte au sol (une douzaine de pixels de profondeur sous ce pied) qui doit être centrée dans la case, pas la ligne de pied.
 * Ne vaut que pour les tours des cases (`Visuel.tour`), pas pour les tourelles qu'un héros ou une tour divine pose n'importe où.
 */
export const DECALAGE_BASE_TOUR = 6;

export const CATEGORIE = { tour: 0, ennemi: 1, unite: 2 } as const;

/**
 * Ce que le joueur a équipé dans sa collection, à donner au rendu (`Rendu.definirCollection`) : de quoi habiller les tours
 * et le héros de la partie. Rien n'est obligatoire : sans option, tout est dessiné avec les sprites de base.
 */
export interface OptionsCollection {
  /**
   * Skin équipé par cible : une famille de tours de base (`caserne`, `tir`, `magie`, `artillerie`) ou l'id d'un héros
   * (`charlie`, `brise_os`…) vers un id de skin (`skin_tir_2`). C'est la forme de `Collection.equipes.skins` de la sauvegarde.
   * Un skin qui n'habille pas sa cible est ignoré ; seul le héros de la partie est habillé.
   */
  readonly skins?: Readonly<Record<string, string | undefined>>;
  /** Id du familier du héros de la partie (`familier_rat`…), null ou absent pour aucun : `Collection.equipes.familiers[héros]`. */
  readonly familier?: string | null;
}

/** Familiers : distance (tuiles) derrière le héros, part de l'écart rattrapée à chaque pas, et écart au-delà duquel il le rejoint d'un bond. */
const FAMILIER_DERRIERE = 0.85;
const FAMILIER_SUIVI = 0.2;
const FAMILIER_BOND2 = 36;
/** Durée (ms) du déploiement du nuage toxique (animation `impact`) : le nuage qui tourne ne se pose qu'ensuite. */
export const DEPLOIEMENT_NUAGE = 360;

/** Durées en millisecondes de temps de jeu. */
const DUREE_BLESSE = 180;
const MAINTIEN_MARCHE = 160;
const DUREE_TEXTE = 900;
const DUREE_ORDRE = 500;
const DUREE_RAYON = 130;
const DUREE_FAMINE = 700;
const MAINTIEN_CADAVRE = 700;
/** Au-delà de cette distance (tuiles) entre deux pas, c'est une téléportation (réapparition) : pas d'interpolation. */
const SAUT_TUILES = 3;
/** Gerbe de plumes d'un corbeau qui sort : un peu en deçà du bord (tuiles) pour rester visible, à la hauteur où il vole (px). */
const RECUL_PLUMES = 0.5;
const ALTITUDE_PLUMES = 10;
const MOUVEMENT_MIN2 = 1e-6;
/** Rayon visible du dernier cadre de l'onde de choc, pour l'agrandir d'un entier jusqu'au rayon voulu. */
const RAYON_SPRITE_ONDE = 15;

/** Une entité dessinée : ennemi, unité alliée ou tour. */
export class Visuel {
  id = 0;
  categorie: number = CATEGORIE.ennemi;
  sprite: SpriteAtlas | null = null;
  /** Ce qui a servi à choisir le sprite (type d'ennemi, nom des stats…) : s'il change, on le rechoisit. */
  cleSprite = '';
  /** Position précédente et courante, en tuiles. */
  xPrec = 0;
  yPrec = 0;
  x = 0;
  y = 0;
  miroir = false;
  marcheJusqua = -1e9;
  actionAnim = 'attaque';
  actionDebut = -1e9;
  actionFin = -1e9;
  blesseFin = -1e9;
  /** Instant avant lequel un halo de soin est déjà posé sur cette unité (pour ne pas en empiler un par pulsation). */
  soinFin = -1e9;
  /** Instant de la mort d'une unité, -1 si elle vit. */
  mortDebut = -1;
  pvPrec = 0;
  vu = 0;
  /** Décalage de boucle, pour que deux ennemis voisins n'animent pas en chœur. */
  phase = 0;
  /** Ordre de tri en profondeur de l'image courante, et position interpolée dans le tampon (pixels). */
  cle = 0;
  px = 0;
  py = 0;
  ennemi: Ennemi | null = null;
  unite: Unite | null = null;
  tour: Tour | null = null;
  // Tours
  famille: FamilleTour = 'caserne';
  niveau = 0;
  voie: Voie | null = null;
  tireur: SpriteAtlas | null = null;
  tireurMiroir = false;
  /** Point d'où part le tir, en pixels depuis l'ancre du sprite de la tour. */
  tirX = 0;
  tirY = -12;
  /** Nom du sprite choisi, et sa version recolorée par un skin (null : sprite de base). */
  nomSprite = '';
  habille: SpriteHabille | null = null;
  /** Version des options de collection avec laquelle `habille` a été choisi. */
  versionCollection = -1;
  /** Ennemi intouchable (à terre, plongé) à la dernière image, et instant où il l'est devenu. */
  intouchable = false;
  intouchableDebut = 0;
  /** Plus grand nombre de pas de noyade vu sur cette unité : de quoi savoir à quel point elle a coulé. */
  noyadeMax = 0;
  /** Non dessiné (familier dont le héros est tombé). */
  masque = false;
  /** Instants (temps de jeu) du sursaut et du flash blanc d'une tour qui vient d'être améliorée ; très anciens quand rien ne tourne. */
  sursautDebut = -1e9;
  flashDebut = -1e9;
  /** Lueur sous la tour (tours à feu), choisie quand la tour change d'aspect ; null si elle n'en a pas. */
  halo: DefHalo | null = null;
}

export class VisuelProjectile {
  id = 0;
  sprite: SpriteAtlas | null = null;
  xPrec = 0;
  yPrec = 0;
  x = 0;
  y = 0;
  /** Distance totale à parcourir (tuiles) et départ visuel (pixels depuis la position de la tour). */
  total = 0;
  origineX = 0;
  origineY = 0;
  /** Hauteur de l'arc (pixels) pour les tirs de zone, qui retombent du ciel. */
  arc = 0;
  /** Le projectile vise un ennemi (touche à hauteur de corps) plutôt qu'un point du sol. */
  surEnnemi = false;
  /** Le sprite pointe vers la droite et se tourne vers la cible (flèches, traits) ; les autres tournent d'eux-mêmes. */
  tourne = false;
  angle = 0;
  vu = 0;
  projectile: Projectile | null = null;
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
}

export class Suivi {
  /** Relu à chaque amélioration, donc un changement de préférence agit tout de suite (les tests le remplacent). */
  animationsReduites: () => boolean = () => this.requeteReduite.matches;
  private readonly requeteReduite = requeteAnimationsReduites();
  readonly ennemis = new Map<number, Visuel>();
  readonly unites = new Map<number, Visuel>();
  readonly tours = new Map<number, Visuel>();
  /** Tourelles construites par une tour divine ou un héros : dessinées comme des tours, dans l'ordre de profondeur. */
  readonly structures = new Map<number, Visuel>();
  readonly projectiles = new Map<number, VisuelProjectile>();
  /** Tours, ennemis et unités : l'ordre est retrié par le rendu à chaque image. */
  readonly dessinables: Visuel[] = [];
  readonly listeProjectiles: VisuelProjectile[] = [];
  /** Le familier du héros, dessiné comme une unité (null tant qu'aucun n'est équipé). */
  familier: Visuel | null = null;
  /** Instant de début de chaque nuage toxique en cours (les autres zones n'y sont pas). */
  readonly debutNuage = new Map<number, number>();

  private marque = 0;
  private version = 0;
  private skins: Readonly<Record<string, string | undefined>> = {};
  private familierId: string | null = null;
  /** Ennemis appelés par `appel` dont l'apparition reste à marquer (les `apparition` suivent l'événement). */
  private appelsRestants = 0;
  private appelType = '';
  private readonly libres: Visuel[] = [];
  private readonly libresProjectiles: VisuelProjectile[] = [];

  constructor(
    private readonly atlas: AtlasRendu,
    private readonly effets: PoolEffets,
  ) {}

  /**
   * Fixe les skins et le familier équipés. Les tours et le héros déjà suivis sont rhabillés au prochain pas : on peut donc
   * l'appeler avant la partie ou pendant.
   */
  definirCollection(options: OptionsCollection): void {
    this.skins = options.skins ?? {};
    this.familierId = options.familier ?? null;
    this.version++;
  }

  /**
   * À appeler après chaque pas du moteur (`avancer` ou `step`), avec le temps de jeu en millisecondes.
   * `avecEvenements` à faux synchronise seulement les entités avec l'état, sans déclencher les effets des
   * événements du pas : pour montrer une partie reprise, dont le dernier pas a déjà été joué.
   */
  apresPas(etat: EtatPartie, temps: number, avecEvenements = true): void {
    this.marque++;
    const marque = this.marque;
    this.suivreTours(etat, marque);
    this.suivreEnnemis(etat, temps, marque);
    this.suivreUnites(etat, temps, marque);
    this.suivreFamilier(etat, temps);
    this.suivreProjectiles(etat, marque);
    this.suivreStructures(etat, temps, marque);
    this.appelsRestants = 0;
    if (avecEvenements) for (const evenement of etat.evenements) this.evenement(etat, evenement, temps);
    if (this.tours.size !== etat.tours.length) this.retirer(this.tours, marque);
    if (this.structures.size !== etat.structures.length) this.retirer(this.structures, marque);
    if (this.ennemis.size !== etat.ennemis.length) this.retirer(this.ennemis, marque);
    if (this.unites.size !== etat.unites.length) this.retirer(this.unites, marque);
    if (this.projectiles.size !== etat.projectiles.length) this.retirerProjectiles(marque);
  }

  // --- Création et suppression ---

  private creer(categorie: number, id: number, x: number, y: number): Visuel {
    const v = this.libres.pop() ?? new Visuel();
    v.id = id;
    v.categorie = categorie;
    v.sprite = null;
    v.cleSprite = '';
    v.xPrec = x;
    v.yPrec = y;
    v.x = x;
    v.y = y;
    v.miroir = false;
    v.marcheJusqua = -1e9;
    v.actionAnim = 'attaque';
    v.actionDebut = -1e9;
    v.actionFin = -1e9;
    v.blesseFin = -1e9;
    v.soinFin = -1e9;
    v.mortDebut = -1;
    v.pvPrec = 0;
    v.vu = 0;
    v.phase = (id * 137) % 997;
    v.cle = 0;
    v.px = 0;
    v.py = 0;
    v.ennemi = null;
    v.unite = null;
    v.tour = null;
    v.famille = 'caserne';
    v.niveau = 0;
    v.sursautDebut = -1e9;
    v.flashDebut = -1e9;
    v.halo = null;
    v.voie = null;
    v.tireur = null;
    v.tireurMiroir = false;
    v.tirX = 0;
    v.tirY = -12;
    v.nomSprite = '';
    v.habille = null;
    v.versionCollection = -1;
    v.intouchable = false;
    v.intouchableDebut = 0;
    v.noyadeMax = 0;
    v.masque = false;
    this.dessinables.push(v);
    return v;
  }

  private retirer(carte: Map<number, Visuel>, marque: number): void {
    for (const [id, v] of carte) {
      if (v.vu === marque) continue;
      carte.delete(id);
      const i = this.dessinables.indexOf(v);
      const dernier = this.dessinables.pop();
      if (i !== -1 && dernier && dernier !== v) this.dessinables[i] = dernier;
      v.ennemi = null;
      v.unite = null;
      v.tour = null;
      v.habille = null;
      this.libres.push(v);
    }
  }

  private retirerProjectiles(marque: number): void {
    for (const [id, v] of this.projectiles) {
      if (v.vu === marque) continue;
      this.projectiles.delete(id);
      const i = this.listeProjectiles.indexOf(v);
      const dernier = this.listeProjectiles.pop();
      if (i !== -1 && dernier && dernier !== v) this.listeProjectiles[i] = dernier;
      v.projectile = null;
      this.libresProjectiles.push(v);
    }
  }

  // --- Synchronisation avec l'état ---

  private deplacer(v: Visuel, x: number, y: number, temps: number): void {
    const dx = x - v.x;
    const dy = y - v.y;
    if (dx * dx + dy * dy > SAUT_TUILES * SAUT_TUILES) {
      v.xPrec = x;
      v.yPrec = y;
    } else {
      v.xPrec = v.x;
      v.yPrec = v.y;
      if (dx * dx + dy * dy > MOUVEMENT_MIN2) {
        v.marcheJusqua = temps + MAINTIEN_MARCHE;
        if (dx > 0.001) v.miroir = false;
        else if (dx < -0.001) v.miroir = true;
      }
    }
    v.x = x;
    v.y = y;
  }

  private suivreTours(etat: EtatPartie, marque: number): void {
    for (const t of etat.tours) {
      let v = this.tours.get(t.id);
      if (!v) {
        v = this.creer(CATEGORIE.tour, t.id, t.x, t.y);
        this.tours.set(t.id, v);
      }
      if (v.niveau !== t.niveau || v.voie !== t.voie || v.sprite === null || v.versionCollection !== this.version) this.habillerTour(v, t, etat.config.dieu);
      // Une tour du radeau suit sa place : le moteur recopie la position de la place dans t.x, t.y à chaque pas, le rendu
      // interpole entre le pas précédent et celui-ci (halo, tireur, portée et anneaux suivent son visuel).
      if (t.place >= 0) {
        v.xPrec = v.x;
        v.yPrec = v.y;
        v.x = t.x;
        v.y = t.y;
      }
      v.tour = t;
      v.vu = marque;
    }
  }

  private habillerTour(v: Visuel, t: Tour, dieu: string): void {
    v.famille = t.famille;
    v.niveau = t.niveau;
    v.voie = t.voie;
    v.nomSprite = spriteTour(t.famille, t.niveau, t.voie, dieu);
    v.sprite = this.atlas.sprite(v.nomSprite) ?? null;
    v.habille = this.habiller(v.nomSprite, t.famille);
    v.halo = haloDe(t.famille, t.niveau, t.voie, v.habille?.skin ?? null);
    v.versionCollection = this.version;
    const nomTireur = spriteTireur(t.famille, t.niveau, t.voie);
    v.tireur = nomTireur ? (this.atlas.sprite(nomTireur) ?? null) : null;
    const nomPoint = nomPointDeTir(t.famille);
    const point = nomPoint ? v.sprite?.points?.[nomPoint] : undefined;
    if (point && v.sprite) {
      v.tirX = point.x - v.sprite.ancre.x;
      v.tirY = point.y - v.sprite.ancre.y;
    } else {
      v.tirX = 0;
      v.tirY = -12;
    }
  }

  /** Le sprite recoloré du skin équipé pour cette cible (famille de tours ou id de héros), null s'il n'y en a pas ou s'il ne l'habille pas. */
  private habiller(nomSprite: string, cible: string): SpriteHabille | null {
    if (!Object.hasOwn(this.skins, cible)) return null;
    const skin = this.skins[cible];
    return skin ? this.atlas.habiller(nomSprite, skin) : null;
  }

  /** Une tourelle qui apparaît joue son « apparition » ; celle qui disparaît est jouée par l'événement `structure_fin`. */
  private suivreStructures(etat: EtatPartie, temps: number, marque: number): void {
    for (const s of etat.structures) {
      let v = this.structures.get(s.id);
      if (!v) {
        v = this.creer(CATEGORIE.tour, s.id, s.x, s.y);
        v.sprite = this.atlas.sprite(spriteStructure(s.stats.nom)) ?? null;
        const point = v.sprite?.points?.tir;
        if (point && v.sprite) {
          v.tirX = point.x - v.sprite.ancre.x;
          v.tirY = point.y - v.sprite.ancre.y;
        }
        this.lancerAction(v, 'apparition', temps);
        this.structures.set(s.id, v);
      }
      v.vu = marque;
    }
  }

  /** Sprite d'un ennemi : sa version d'élite si c'en est une et qu'elle est dessinée, sinon celui de l'ennemi ordinaire. */
  private spriteDeEnnemi(type: string, elite: boolean): SpriteAtlas | null {
    const sprite = elite ? this.atlas.sprite(spriteEnnemiElite(type)) : undefined;
    return sprite ?? this.atlas.sprite(spriteEnnemi(type)) ?? null;
  }

  /**
   * Un ennemi intouchable (à terre après sa chute, plongé) joue sa chute ou sa plongée, puis reste sur le dernier cadre ; quand il
   * cesse de l'être, il se relève (`releve`) ou émerge (`emerge`) et, pour une plongée, apparaît d'un bond à son nouvel endroit.
   */
  private suivreIntouchable(v: Visuel, e: Ennemi, temps: number): void {
    const intouchable = e.invulnerable > 0;
    if (intouchable === v.intouchable) return;
    v.intouchable = intouchable;
    if (intouchable) {
      v.intouchableDebut = temps;
      return;
    }
    // La plongée mène plus loin sur le chemin : pas d'interpolation sur ce trajet.
    v.xPrec = v.x;
    v.yPrec = v.y;
    this.lancerAction(v, e.pouvoirs?.relevement ? 'releve' : 'emerge', temps);
  }

  private suivreEnnemis(etat: EtatPartie, temps: number, marque: number): void {
    for (const e of etat.ennemis) {
      let v = this.ennemis.get(e.id);
      if (!v) {
        v = this.creer(CATEGORIE.ennemi, e.id, e.x, e.y);
        v.cleSprite = e.type;
        v.sprite = this.spriteDeEnnemi(e.type, e.elite);
        v.pvPrec = e.pv;
        this.ennemis.set(e.id, v);
      } else {
        this.deplacer(v, e.x, e.y, temps);
        if (e.pv < v.pvPrec - 1e-6 && temps >= v.actionFin) v.blesseFin = temps + DUREE_BLESSE;
        v.pvPrec = e.pv;
      }
      this.suivreIntouchable(v, e, temps);
      v.ennemi = e;
      v.vu = marque;
    }
  }

  private suivreUnites(etat: EtatPartie, temps: number, marque: number): void {
    for (const u of etat.unites) {
      let v = this.unites.get(u.id);
      if (!v) {
        v = this.creer(CATEGORIE.unite, u.id, u.x, u.y);
        this.unites.set(u.id, v);
      }
      if (v.cleSprite !== u.stats.nom) {
        v.cleSprite = u.stats.nom;
        v.nomSprite = spriteUnite(u.genre, u.stats.nom);
        v.sprite = this.atlas.sprite(v.nomSprite) ?? null;
        v.versionCollection = -1;
      }
      if (v.versionCollection !== this.version) {
        v.versionCollection = this.version;
        // Seul le héros de la partie porte le skin de sa collection.
        const idHeros = u.id === etat.heros ? idHerosDe(u.stats.nom) : null;
        v.habille = idHeros === null ? null : this.habiller(v.nomSprite, idHeros);
      }
      v.noyadeMax = u.noyade > 0 ? Math.max(v.noyadeMax, u.noyade) : 0;
      if (u.mort) {
        if (v.mortDebut < 0) v.mortDebut = temps;
      } else {
        if (v.mortDebut >= 0) {
          v.mortDebut = -1;
          v.xPrec = u.x;
          v.yPrec = u.y;
          v.x = u.x;
          v.y = u.y;
        } else {
          this.deplacer(v, u.x, u.y, temps);
        }
        if (u.pv < v.pvPrec - 1e-6 && temps >= v.actionFin) v.blesseFin = temps + DUREE_BLESSE;
      }
      v.pvPrec = u.pv;
      v.unite = u;
      v.vu = marque;
    }
  }

  /**
   * Le familier du héros : un petit sprite d'attente (`familier-<bête>`, animation `repos` en boucle) qui trottine derrière lui,
   * se rapproche d'une part de l'écart à chaque pas et le rejoint d'un bond si le héros s'éloigne (réapparition). Il regarde du
   * côté où il marche, puis du côté du héros quand il s'arrête. Masqué tant que le héros est à terre.
   */
  private suivreFamilier(etat: EtatPartie, temps: number): void {
    const nom = this.familierId === null ? '' : spriteFamilier(this.familierId);
    const sprite = nom === '' ? null : (this.atlas.sprite(nom) ?? null);
    const heros = this.unites.get(etat.heros);
    if (!sprite || !heros) {
      if (this.familier) this.familier.masque = true;
      return;
    }
    const cibleX = heros.x + (heros.miroir ? FAMILIER_DERRIERE : -FAMILIER_DERRIERE);
    const cibleY = heros.y + 0.1;
    let f = this.familier;
    if (!f) {
      f = this.creer(CATEGORIE.unite, -1, cibleX, cibleY);
      this.familier = f;
    }
    if (f.cleSprite !== nom) {
      f.cleSprite = nom;
      f.nomSprite = nom;
      f.sprite = sprite;
    }
    f.masque = heros.mortDebut >= 0;
    const dx = cibleX - f.x;
    const dy = cibleY - f.y;
    if (dx * dx + dy * dy > FAMILIER_BOND2) {
      f.xPrec = cibleX;
      f.yPrec = cibleY;
      f.x = cibleX;
      f.y = cibleY;
      return;
    }
    const x = f.x + dx * FAMILIER_SUIVI;
    const y = f.y + dy * FAMILIER_SUIVI;
    const bouge = (x - f.x) * (x - f.x) + (y - f.y) * (y - f.y) > MOUVEMENT_MIN2;
    this.deplacer(f, x, y, temps);
    if (!bouge) f.miroir = heros.miroir;
  }

  private suivreProjectiles(etat: EtatPartie, marque: number): void {
    for (const p of etat.projectiles) {
      let v = this.projectiles.get(p.id);
      if (!v) {
        v = this.libresProjectiles.pop() ?? new VisuelProjectile();
        v.id = p.id;
        const nomSprite = spriteProjectile(p.stats.nom);
        v.sprite = this.atlas.sprite(nomSprite) ?? null;
        v.xPrec = p.x;
        v.yPrec = p.y;
        v.x = p.x;
        v.y = p.y;
        v.total = Math.max(0.01, distance(p.x, p.y, p.cx, p.cy));
        const tour = this.tours.get(p.tour);
        v.origineX = tour ? tour.tirX : 0;
        v.origineY = tour ? tour.tirY + (tour.tour ? DECALAGE_BASE_TOUR : 0) : -12;
        v.surEnnemi = p.cible >= 0;
        v.arc = p.stats.zone > 0 ? Math.min(40, Math.round(v.total * TUILE * 0.35)) : 0;
        v.tourne = projectileTourne(nomSprite);
        v.angle = Math.atan2(p.cy - p.y, p.cx - p.x);
        this.projectiles.set(p.id, v);
        this.listeProjectiles.push(v);
      } else {
        v.xPrec = v.x;
        v.yPrec = v.y;
        v.x = p.x;
        v.y = p.y;
        const dx = p.cx - p.x;
        const dy = p.cy - p.y;
        if (dx * dx + dy * dy > 1e-6) v.angle = Math.atan2(dy, dx);
      }
      v.projectile = p;
      v.vu = marque;
    }
  }

  // --- Événements du moteur ---

  private lancerAction(v: Visuel | undefined, anim: string, temps: number): void {
    if (!v?.sprite) return;
    const a = this.atlas.animation(v.sprite, anim);
    v.actionAnim = anim;
    v.actionDebut = temps;
    v.actionFin = temps + (a ? dureeAnimation(a) : 200);
  }

  private regarder(v: Visuel | undefined, versX: number): void {
    if (!v) return;
    if (versX < v.x - 0.001) v.miroir = true;
    else if (versX > v.x + 0.001) v.miroir = false;
  }

  /** Joue une animation d'atlas une fois, centrée sur un point du monde (en tuiles). */
  private effetSprite(nom: string, xTuiles: number, yTuiles: number, temps: number, echelle = 1, decalageY = 0, animation = 'impact'): Effet | null {
    const sprite = this.atlas.sprite(nom);
    if (!sprite) return null;
    const anim = this.atlas.animation(sprite, animation);
    const e = this.effets.prendre(TYPE_EFFET.sprite, temps, anim ? dureeAnimation(anim) : 300);
    e.sprite = sprite;
    e.anim = animation;
    e.x = Math.round(xTuiles * TUILE);
    e.y = Math.round(yTuiles * TUILE + decalageY);
    e.echelle = echelle;
    return e;
  }

  /**
   * Amélioration ou spécialisation d'une tour : bouffée de poussière aux deux coins de la base ; sauf si l'on réduit les animations,
   * anneau de lumière au pied, flash blanc sur le nouveau sprite et sursaut de la tour (dessinés par le rendu d'après les instants notés).
   */
  private effetsAmelioration(tour: Visuel, temps: number): void {
    const demiBase = Math.min(14, Math.max(6, Math.round((tour.sprite?.largeur ?? 24) * 0.3)));
    const x = Math.round(tour.x * TUILE);
    const y = Math.round(tour.y * TUILE + DECALAGE_BASE_TOUR);
    const poussiere = this.effets.prendre(TYPE_EFFET.poussiere, temps, DUREE_POUSSIERE);
    poussiere.x = x;
    poussiere.y = y;
    poussiere.valeur = demiBase;
    // Sur le radeau, la tour bouge pendant l'effet : poussière et anneau la suivent.
    const suit = (tour.tour?.place ?? -1) >= 0 ? tour.id : -1;
    poussiere.suitTour = suit;
    // echelle : 1 = poussière et éclats, 0 = poussière seule (animations réduites).
    const reduit = this.animationsReduites();
    poussiere.echelle = reduit ? 0 : 1;
    if (reduit) return;
    const anneau = this.effets.prendre(TYPE_EFFET.anneau, temps, DUREE_ANNEAU);
    anneau.x = x;
    anneau.y = y;
    anneau.valeur = demiBase;
    anneau.suitTour = suit;
    tour.sursautDebut = temps;
    tour.flashDebut = temps;
  }

  /** Trait instantané d'un point du monde (pixels logiques) à un autre : tir d'un héros à distance ou d'une tourelle. */
  private traitDeTir(x1: number, y1: number, x2: number, y2: number, temps: number, couleur: string): void {
    const e = this.effets.prendre(TYPE_EFFET.rayon, temps, DUREE_RAYON);
    e.x = Math.round(x1);
    e.y = Math.round(y1);
    e.x2 = Math.round(x2);
    e.y2 = Math.round(y2);
    e.couleur = couleur;
  }

  private marqueOrdre(x: number, y: number, temps: number, couleur: string): void {
    const e = this.effets.prendre(TYPE_EFFET.ordre, temps, DUREE_ORDRE);
    e.x = Math.round(x * TUILE);
    e.y = Math.round(y * TUILE);
    e.valeur = 9;
    e.couleur = couleur;
  }

  private evenement(etat: EtatPartie, ev: Evenement, temps: number): void {
    switch (ev.type) {
      case 'tir': {
        const tour = this.tours.get(ev.tour);
        const cible = this.ennemis.get(ev.cible);
        this.lancerAction(tour, 'attaque', temps);
        if (tour && cible) tour.tireurMiroir = cible.x < tour.x;
        if (ev.projectile === -1 && tour && cible) {
          const e = this.effets.prendre(TYPE_EFFET.rayon, temps, DUREE_RAYON);
          e.x = Math.round(tour.x * TUILE + tour.tirX);
          e.y = Math.round(tour.y * TUILE + tour.tirY + DECALAGE_BASE_TOUR);
          e.x2 = Math.round(cible.x * TUILE);
          e.y2 = Math.round(cible.y * TUILE - 8);
          e.couleur = '#ff9a4a';
        }
        return;
      }
      case 'impact': {
        const nom = this.tours.get(ev.tour)?.tour?.stats.nom ?? '';
        this.effetSprite(spriteImpact(nom), ev.x, ev.y, temps, ev.zone > 0 ? 2 : 1, ev.zone > 0 ? 0 : -6);
        return;
      }
      case 'onde': {
        this.lancerAction(this.tours.get(ev.tour), 'attaque', temps);
        this.effetSprite('onde-choc', ev.x, ev.y, temps, Math.max(1, Math.round((ev.rayon * TUILE) / RAYON_SPRITE_ONDE)), -2);
        return;
      }
      case 'coup': {
        const unite = this.unites.get(ev.unite);
        const ennemi = this.ennemis.get(ev.ennemi);
        this.lancerAction(unite, 'attaque', temps);
        if (ennemi) {
          this.regarder(unite, ennemi.x);
          this.effetSprite('sang', ennemi.x, ennemi.y, temps, 1, -8);
        }
        return;
      }
      case 'coup_ennemi': {
        const ennemi = this.ennemis.get(ev.ennemi);
        const unite = this.unites.get(ev.unite);
        this.lancerAction(ennemi, 'attaque', temps);
        if (unite) this.regarder(ennemi, unite.x);
        return;
      }
      case 'devore': {
        const ennemi = this.ennemis.get(ev.ennemi);
        const unite = this.unites.get(ev.unite);
        this.lancerAction(ennemi, 'attaque', temps);
        if (unite) {
          this.regarder(ennemi, unite.x);
          this.effetSprite('sang', unite.x, unite.y, temps, 1, -8);
        }
        return;
      }
      case 'mort': {
        const v = this.ennemis.get(ev.ennemi);
        // Le cadavre garde le sprite de l'ennemi qui meurt : sa version d'élite, le cas échéant.
        const sprite = v?.sprite ?? this.atlas.sprite(spriteEnnemi(ev.typeEnnemi));
        if (sprite) {
          const anim = this.atlas.animation(sprite, 'mort');
          const f = this.effets.prendre(TYPE_EFFET.fantome, temps, (anim ? dureeAnimation(anim) : 0) + MAINTIEN_CADAVRE);
          f.sprite = sprite;
          f.anim = 'mort';
          f.miroir = v?.miroir ?? false;
          f.x = Math.round(ev.x * TUILE);
          f.y = Math.round(ev.y * TUILE);
        }
        if (ev.prime > 0) {
          const e = this.effets.prendre(TYPE_EFFET.texte, temps, DUREE_TEXTE);
          e.x = Math.round(ev.x * TUILE);
          e.y = Math.round(ev.y * TUILE) - 18;
          e.valeur = ev.prime;
          e.couleur = '#e8c860';
        }
        return;
      }
      case 'mort_unite': {
        const v = this.unites.get(ev.unite);
        if (v && v.mortDebut < 0) v.mortDebut = temps;
        this.effetSprite('sang', ev.x, ev.y, temps, 1, -8);
        return;
      }
      case 'reapparition': {
        const v = this.unites.get(ev.unite);
        if (v?.unite?.stats.capacites?.ciblable === false) this.effetSprite('effet-ombre', v.x, v.y, temps, 1, -2);
        return;
      }
      case 'apparition': {
        // Un ennemi appelé sort de la fumée : l'événement `appel` précède les `apparition` des appelés.
        if (this.appelsRestants > 0 && ev.typeEnnemi === this.appelType) {
          this.appelsRestants--;
          const v = this.ennemis.get(ev.ennemi);
          if (v) this.effetSprite('fumee', v.x, v.y, temps, 1, -4);
        }
        return;
      }
      case 'fuite': {
        // Un corbeau sort de son couloir au bord droit : une gerbe de plumes là où il quitte la carte (le bout du couloir rougit
        // et tremble dans les indications, comme la porte d'un chemin). L'ennemi n'est déjà plus dans l'état, son visuel si.
        const v = this.ennemis.get(ev.ennemi);
        if (v?.ennemi && v.ennemi.couloir >= 0) this.effetSprite('effet-plumes', v.x - RECUL_PLUMES, v.y, temps, 1, -ALTITUDE_PLUMES);
        return;
      }
      case 'vague':
      case 'fin':
      case 'regain_vies':
      case 'structure':
      case 'boost':
      case 'releve':
      case 'brulure':
      case 'tour_desactivee':
      case 'enterre':
      case 'renversement':
      case 'tour_gelee':
      case 'aveuglement':
      case 'bannissement':
      case 'resurrection':
      case 'charge':
      case 'invulnerabilite':
      case 'explosion':
      case 'bond':
      case 'vol':
      case 'division':
      case 'derniere_lueur':
      case 'purification':
      case 'terreur':
      case 'desamorcage':
      case 'inversion':
        // Mécaniques des régions 6 à 10 et de la variété des ennemis : leurs effets visuels viennent avec la tâche d'interface (rien à dessiner pour l'instant).
        // La zone, les structures, les tours boostées ou en feu, les unités qui brûlent et l'ennemi à terre se dessinent d'après
        // l'état, tant qu'ils durent.
        return;
      case 'zone': {
        // Un nuage toxique se déploie (animation `impact`) avant de tourner ; les autres zones se dessinent d'après l'état.
        const zone = etat.zones.find((z) => z.id === ev.zone);
        if (zone && zone.degatsAllies > 0) {
          this.debutNuage.set(ev.zone, temps);
          this.effetSprite('effet-nuage-toxique', ev.x, ev.y, temps, 1, 0, 'impact');
        }
        return;
      }
      case 'zone_fin':
        this.debutNuage.delete(ev.zone);
        return;
      case 'plongee':
        // Un boss plonge : éclaboussure (deux fois la taille du sprite d'effet, qui est fait pour un ennemi ordinaire).
        this.effetSprite('effet-plongee', ev.x, ev.y, temps, this.ennemis.get(ev.ennemi)?.ennemi?.boss ? 2 : 1, 0, 'impact');
        return;
      case 'emergence': {
        // Il refait surface plus loin (une plongée) : éclaboussure. L'ennemi qui se relève n'en fait pas.
        const v = this.ennemis.get(ev.ennemi);
        if (v?.ennemi && !v.ennemi.pouvoirs?.relevement) this.effetSprite('effet-plongee', ev.x, ev.y, temps, v.ennemi.boss ? 2 : 1, 0, 'impact');
        return;
      }
      case 'noyade': {
        // Le noyeur attaque et entraîne le soldat sous l'eau : éclaboussure sur lui, le reste se lit sur l'unité (`noyade`).
        this.lancerAction(this.ennemis.get(ev.ennemi), 'attaque', temps);
        const unite = this.unites.get(ev.unite);
        if (unite) this.effetSprite('effet-plongee', unite.x, unite.y, temps, 1, 0, 'impact');
        return;
      }
      case 'soin_ennemi': {
        // Le halo de soin des alliés, posé sur l'ennemi soigné (pas un nouveau à chaque pulsation).
        const v = this.ennemis.get(ev.ennemi);
        if (v && temps >= v.soinFin) {
          const e = this.effetSprite('effet-soin', v.x, v.y, temps, 1, -2, 'repos');
          if (e) v.soinFin = temps + e.duree;
        }
        return;
      }
      case 'famine': {
        // Le boss hurle ; un anneau gris se resserre sur la zone où les tours maigrissent (leur état se lit ensuite sur chaque tour).
        this.lancerAction(this.ennemis.get(ev.ennemi), 'attaque', temps);
        const anneau = this.effets.prendre(TYPE_EFFET.ordre, temps, DUREE_FAMINE);
        anneau.x = Math.round(ev.x * TUILE);
        anneau.y = Math.round(ev.y * TUILE);
        anneau.valeur = Math.max(2, Math.round(ev.rayon * TUILE));
        anneau.couleur = '#b0a89a';
        return;
      }
      case 'appel':
        this.lancerAction(this.ennemis.get(ev.ennemi), 'attaque', temps);
        this.appelsRestants = ev.nombre;
        this.appelType = ev.typeEnnemi;
        return;
      case 'piege_pose':
        this.effetSprite('fumee', ev.x, ev.y, temps, 1, -2);
        return;
      case 'piege_desamorce':
      case 'piege_declenche':
        // Le piège a déjà quitté l'état : son animation de déclenchement (mâchoires qui se ferment) se joue ici.
        this.effetSprite('piege', ev.x, ev.y, temps, 1, 0, 'declenche');
        return;
      case 'structure_fin':
        this.effetSprite(spriteStructure(''), ev.x, ev.y, temps, 1, 0, 'destruction');
        return;
      case 'tir_structure': {
        const tourelle = this.structures.get(ev.structure);
        const cible = this.ennemis.get(ev.ennemi);
        if (!tourelle || !cible) return;
        this.regarder(tourelle, cible.x);
        this.lancerAction(tourelle, 'attaque', temps);
        const decalage = tourelle.miroir ? -tourelle.tirX : tourelle.tirX;
        this.traitDeTir(ev.x * TUILE + decalage, ev.y * TUILE + tourelle.tirY, cible.x * TUILE, cible.y * TUILE - 8, temps, '#ffd28a');
        return;
      }
      case 'tir_unite': {
        const tireur = this.unites.get(ev.unite);
        const cible = this.ennemis.get(ev.ennemi);
        if (!tireur || !cible) return;
        this.regarder(tireur, cible.x);
        this.lancerAction(tireur, 'attaque', temps);
        this.traitDeTir(tireur.x * TUILE, tireur.y * TUILE - 10, cible.x * TUILE, cible.y * TUILE - 8, temps, ev.critique ? '#ffe070' : '#d8c8a0');
        return;
      }
      case 'esquive': {
        // Le coup rate : un souffle d'ombre à l'endroit où l'unité était.
        const v = this.unites.get(ev.unite);
        if (v) this.effetSprite('effet-ombre', v.x, v.y, temps, 1, -2);
        return;
      }
      case 'soin': {
        const v = this.unites.get(ev.unite);
        if (v && temps >= v.soinFin) {
          const e = this.effetSprite('effet-soin', v.x, v.y, temps, 1, -2, 'repos');
          if (e) v.soinFin = temps + e.duree;
        }
        return;
      }
      case 'execution':
        this.effetSprite('effet-execution', ev.x, ev.y, temps, 1, -8);
        return;
      case 'objet':
        this.effetSprite(effetObjet(ev.objet), ev.x, ev.y, temps, 1, -2);
        return;
      case 'competence_tour': {
        const tour = this.tours.get(ev.tour);
        if (tour) this.effetSprite('impact', tour.x, tour.y, temps, 2, -14 + DECALAGE_BASE_TOUR);
        return;
      }
      case 'invocation': {
        const invoque = this.unites.get(ev.unite)?.unite;
        // Un assassin du Sanctuaire sort de l'ombre ; les autres renforts sortent de la fumée.
        this.effetSprite(invoque?.stats.capacites?.ciblable === false ? 'effet-ombre' : 'fumee', ev.x, ev.y, temps, 1, -4);
        return;
      }
      case 'construction':
        // À la position de la tour à cet instant (sur le radeau, celle de sa place).
        this.effetSprite('fumee', ev.x, ev.y, temps, 2, -6 + DECALAGE_BASE_TOUR);
        return;
      case 'amelioration': {
        const tour = this.tours.get(ev.tour);
        if (tour) this.effetsAmelioration(tour, temps);
        return;
      }
      case 'vente':
        // La tour a déjà quitté l'état : fumée là où elle était (la case, ou la place du radeau au moment de la vente).
        this.effetSprite('fumee', ev.x, ev.y, temps, 2, -6);
        return;
      case 'ralliement':
        this.marqueOrdre(ev.x, ev.y, temps, '#7fc6f0');
        return;
      case 'ordre_heros':
        this.marqueOrdre(ev.x, ev.y, temps, '#e8d9a0');
        return;
      case 'sort': {
        const def = Object.hasOwn(DIEUX, etat.config.dieu) ? DIEUX[etat.config.dieu as keyof typeof DIEUX].sorts[ev.emplacement] : undefined;
        const habillage = habillageSort(etat.config.dieu, ev.emplacement);
        const echelle = def ? Math.max(1, Math.round((def.rayon * TUILE) / RAYON_SPRITE_ONDE)) : 1;
        this.effetSprite(habillage.effet, ev.x, ev.y, temps, habillage.effet === 'onde-choc' ? echelle : 1, -2);
        if (habillage.animationHeros) this.lancerAction(this.unites.get(etat.heros), habillage.animationHeros, temps);
        return;
      }
    }
  }
}
