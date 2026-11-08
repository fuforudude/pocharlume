// Ce que fait chaque geste du joueur : toucher une case libre ou une tour ouvre son menu, toucher le héros puis un point lui
// donne un ordre, toucher un sort puis la carte le lance. Machine à états pure (sans DOM) : elle ne modifie
// jamais l'état de la partie, elle renvoie l'action à envoyer au moteur (qui la valide et la met au journal).
import { DIEUX } from '../data/dieux';
import { OBJETS } from '../data/objets';
import type { Action, EtatPartie, LieuTour, RaisonRefus } from '../engine';
import type { CaseGrille, GimmickRadeau } from '../engine/definitions';
import { casesDuTrajet, caseSousPoint, centreCase, estCaseDeChemin, estCaseInterdite, gimmickRadeau, positionPlace, tourDuLieu, tourSurCase, validerAction } from '../engine';
import type { FamilleTour } from '../engine/etat';
import { chercherParId } from '../engine/recherche';
import { tCle } from '../i18n';
import type { Surbrillance } from '../render/rendu';
import type { ApercuConstruction, ElementMenu } from './menu-cercle';

export type Mode =
  | { readonly type: 'libre' }
  /**
   * Le menu en cercle d'une case (libre, ou portant une tour) est ouvert ; ou celui d'une place du radeau : `place` est alors son
   * numéro et `cx`, `cy` valent -1 (comme pour une tour du radeau dans le moteur).
   */
  | { readonly type: 'menu'; readonly cx: number; readonly cy: number; readonly place?: number }
  /** Le héros est sélectionné : le prochain point touché est son ordre. */
  | { readonly type: 'heros' }
  | { readonly type: 'sort'; readonly emplacement: number }
  /** Un objet emporté est sélectionné : le prochain point touché est l'endroit où l'utiliser. */
  | { readonly type: 'objet'; readonly emplacement: number }
  /** Une caserne attend son point de ralliement. */
  | { readonly type: 'ralliement'; readonly cx: number; readonly cy: number };

/** Ce que le geste demande à la partie : une action pour le moteur, ou la raison d'un refus à afficher. */
export interface Issue {
  readonly action: Action | null;
  readonly refus: RaisonRefus | null;
  /** Refus `non_debloque` d'un bouton du menu : le niveau qui ouvre l'élément, pour le dire au joueur. */
  readonly deblocage?: number | null;
}

const RIEN: Issue = { action: null, refus: null };
const LIBRE: Mode = { type: 'libre' };

export type CibleTouchee = { readonly type: 'heros' } | { readonly type: 'case'; readonly cx: number; readonly cy: number };

/** Décalage entre le pied d'une tour ou d'un personnage et le centre de son sprite, en tuiles : on touche le corps. */
const CENTRE_SPRITE = 0.5;
/**
 * Rayon (tuiles) dans lequel on touche une place du radeau : le rayon du doigt, borné. Assez large pour viser une place qui bouge,
 * assez étroit pour ne pas avaler les cases de la rive ; les places sont à une tuile l'une de l'autre, la plus proche l'emporte.
 */
const RAYON_PLACE_MIN = 0.6;
const RAYON_PLACE_MAX = 0.9;

/** Le lieu (case ou place du radeau) dont le menu est ouvert, au format des actions du moteur ; null hors du menu. */
export function lieuDuMenu(mode: Mode): LieuTour | null {
  if (mode.type !== 'menu') return null;
  return mode.place === undefined ? { cx: mode.cx, cy: mode.cy } : { place: mode.place };
}

/** Les cases que parcourt chaque radeau (clés `cx,cy`), calculées une fois : `placeTouchee` les lit à chaque image. */
const trajets = new WeakMap<GimmickRadeau, ReadonlySet<string>>();

function caseDuTrajet(g: GimmickRadeau, cx: number, cy: number): boolean {
  let cases = trajets.get(g);
  if (!cases) {
    cases = new Set(casesDuTrajet(g).map((c) => `${String(c.cx)},${String(c.cy)}`));
    trajets.set(g, cases);
  }
  return cases.has(`${String(cx)},${String(cy)}`);
}

/**
 * La place du radeau touchée en (x, y) (tuiles), ou -1 : la plus proche dans le rayon du doigt (borné), mesuré au pied de la
 * place et, si une tour l'occupe, aussi au corps de la tour. La position est celle du dernier pas joué (celle des tours) : le
 * rendu montre le radeau au plus un pas plus tôt, quelques centièmes de tuile d'écart.
 *
 * Hors des cases du trajet (sur la rive), la case touchée garde la priorité : une place ne l'emporte que si le point est
 * strictement plus près d'elle que du centre de cette case, et le corps de sa tour ne compte pas si la case porte elle-même une
 * tour. Sans cela, toucher une tour de la rive quand le radeau passe dessous ouvrirait le menu (et « Vendre ») de la tour du radeau.
 */
export function placeTouchee(etat: EtatPartie, x: number, y: number, rayon: number): number {
  const g = gimmickRadeau(etat.niveau);
  if (!g) return -1;
  const r = Math.min(Math.max(rayon, RAYON_PLACE_MIN), RAYON_PLACE_MAX);
  const sous = caseSousPoint(etat.niveau.carte, x, y);
  const rive = sous !== null && !caseDuTrajet(g, sous.cx, sous.cy);
  const corps = !rive || !tourSurCase(etat, sous.cx, sous.cy);
  let limite = r * r;
  if (rive) {
    const centre = centreCase(sous.cx, sous.cy);
    limite = Math.min(limite, (centre.x - x) * (centre.x - x) + (centre.y - y) * (centre.y - y));
  }
  const pas = Math.max(0, etat.pas - 1);
  let meilleure = -1;
  let meilleureDistance = limite;
  for (let n = 0; n < g.places.length; n++) {
    const p = positionPlace(g, pas, n);
    const dx = p.x - x;
    let d = dx * dx + (p.y - y) * (p.y - y);
    if (corps && tourDuLieu(etat, { place: n })) d = Math.min(d, dx * dx + (p.y - CENTRE_SPRITE - y) * (p.y - CENTRE_SPRITE - y));
    // Sur le trajet, une égalité avec le rayon suffit ; sur la rive, il faut battre strictement le centre de la case.
    if (d < meilleureDistance || (!rive && d === meilleureDistance)) {
      meilleure = n;
      meilleureDistance = d;
    }
  }
  return meilleure;
}

/**
 * Ce qui est touché en (x, y) (tuiles) : le héros s'il est dans `rayon` tuiles (la taille de la cible tactile, 44 px CSS,
 * convertie en tuiles au zoom courant), sinon la case de la grille qui contient le point.
 */
export function cibleTouchee(etat: EtatPartie, x: number, y: number, rayon: number): CibleTouchee | null {
  const heros = chercherParId(etat.unites, etat.heros);
  if (heros && !heros.mort) {
    const dx = heros.x - x;
    const dy = heros.y - CENTRE_SPRITE - y;
    if (dx * dx + dy * dy <= rayon * rayon) return { type: 'heros' };
  }
  const touchee = caseSousPoint(etat.niveau.carte, x, y);
  return touchee ? { type: 'case', cx: touchee.cx, cy: touchee.cy } : null;
}

/** Rayon (tuiles) de l'objet d'un emplacement, 0 s'il est inconnu (ou s'il agit partout). */
export function rayonObjet(etat: EtatPartie, emplacement: number): number {
  const id = etat.config.objets[emplacement];
  return id !== undefined && Object.hasOwn(OBJETS, id) ? OBJETS[id as keyof typeof OBJETS].rayon : 0;
}

/** Rayon (tuiles) du sort d'un emplacement, 0 s'il est inconnu. */
export function rayonSort(etat: EtatPartie, emplacement: number): number {
  const dieu = Object.hasOwn(DIEUX, etat.config.dieu) ? DIEUX[etat.config.dieu as keyof typeof DIEUX] : undefined;
  return dieu?.sorts[emplacement]?.rayon ?? 0;
}

export class Interaction {
  mode: Mode = LIBRE;
  /** La case sous le pointeur (survol de la souris, ou doigt posé), null si on ne vise rien. */
  visee: CaseGrille | null = null;
  /** La place du radeau sous le pointeur, -1 si aucune (elle passe avant la case d'eau dessous). */
  viseePlace = -1;
  /** Le pointeur survole une case du chemin (qui ne s'éclaire pas) : une touche de construction ne doit pas se rabattre sur le menu ouvert. */
  private surChemin = false;
  /** Le bouton « construire » du menu survolé : sa portée et son ralliement sont montrés sur la carte. */
  private apercu: ApercuConstruction | null = null;
  /** Dernier mode dont on a rédigé l'invite : l'invite est appelée à chaque image, le texte n'est refait que si le mode change. */
  private modeInvite: Mode | null = null;
  private texteInvite: string | null = null;

  /** Un point de la carte a été touché (coordonnées en tuiles). */
  toucher(etat: EtatPartie, x: number, y: number, rayon: number): Issue {
    const mode = this.mode;
    const cible = cibleTouchee(etat, x, y, rayon);
    switch (mode.type) {
      case 'heros':
        if (cible?.type === 'heros') return this.annuler();
        return this.ordonner(etat, { type: 'deplacerHeros', x, y });
      case 'sort':
        return this.ordonner(etat, { type: 'lancerSort', emplacement: mode.emplacement, x, y });
      case 'objet':
        return this.ordonner(etat, { type: 'utiliserObjet', emplacement: mode.emplacement, x, y });
      case 'ralliement':
        return this.ordonner(etat, { type: 'deplacerRalliement', cx: mode.cx, cy: mode.cy, x, y });
      default:
        break;
    }
    if (cible?.type === 'heros') return this.selectionnerHeros(etat);
    // Une place du radeau passe avant la case d'eau sous elle (sur la rive, seulement si elle est plus près que le centre de la
    // case touchée : voir placeTouchee) : on y construit comme sur une case libre.
    const place = placeTouchee(etat, x, y, rayon);
    if (place >= 0) {
      this.mode = mode.type === 'menu' && mode.place === place ? LIBRE : { type: 'menu', cx: -1, cy: -1, place };
      return RIEN;
    }
    if (!cible) return this.annuler();
    // Une case du chemin n'offre aucune pose : le toucher referme seulement le menu ouvert (le héros s'y envoie par son mode).
    if (estCaseDeChemin(etat.niveau.carte, cible.cx, cible.cy)) return this.annuler();
    // Une case interdite (décor) sans tour ne s'ouvre pas : le joueur sait pourquoi.
    if (estCaseInterdite(etat.niveau, cible.cx, cible.cy) && !tourSurCase(etat, cible.cx, cible.cy)) return { action: null, refus: 'case_interdite' };
    this.mode = mode.type === 'menu' && mode.place === undefined && mode.cx === cible.cx && mode.cy === cible.cy ? LIBRE : { type: 'menu', cx: cible.cx, cy: cible.cy };
    return RIEN;
  }

  /**
   * Le pointeur est en (x, y) (tuiles) : la case dessous s'éclaire. On ne vise une case que lorsqu'un geste de cases est possible :
   * pendant la visée du héros, d'un sort, d'un objet ou d'un ralliement, c'est un point libre qu'on désigne.
   */
  viser(etat: EtatPartie, x: number, y: number): void {
    const mode = this.mode.type;
    const libre = mode === 'libre' || mode === 'menu';
    this.viseePlace = libre ? placeTouchee(etat, x, y, 0) : -1;
    const sous = libre && this.viseePlace < 0 ? caseSousPoint(etat.niveau.carte, x, y) : null;
    // Le chemin ne s'éclaire pas : on n'y construit rien.
    this.surChemin = sous !== null && estCaseDeChemin(etat.niveau.carte, sous.cx, sous.cy);
    this.visee = this.surChemin ? null : sous;
  }

  /** Le pointeur a quitté la carte, ou le doigt s'est levé : plus aucune case n'est éclairée. */
  cesserDeViser(): void {
    this.visee = null;
    this.viseePlace = -1;
    this.surChemin = false;
  }

  /** Un bouton du menu en cercle est survolé (ou rendu actif au clavier) ; null quand le pointeur le quitte. */
  survolerElement(element: ElementMenu | null): void {
    this.apercu = element?.apercu ?? null;
  }

  /** Envoie l'action visée ; si le moteur la refuse, on reste en visée pour que le joueur retouche ailleurs. */
  private ordonner(etat: EtatPartie, action: Action): Issue {
    const refus = validerAction(etat, action);
    if (refus !== null) return { action: null, refus };
    this.mode = LIBRE;
    return { action, refus: null };
  }

  /** Un bouton du menu en cercle a été touché. */
  choisirElement(element: ElementMenu): Issue {
    const mode = this.mode;
    if (mode.type !== 'menu') return RIEN;
    if (element.refus !== null) return { action: null, refus: element.refus, ...(element.deblocage === null ? {} : { deblocage: element.deblocage }) };
    if (element.id === 'ralliement') {
      this.mode = { type: 'ralliement', cx: mode.cx, cy: mode.cy };
      return RIEN;
    }
    this.mode = LIBRE;
    return { action: element.action, refus: null };
  }

  private selectionnerHeros(etat: EtatPartie): Issue {
    const heros = chercherParId(etat.unites, etat.heros);
    if (!heros || heros.mort) return { action: null, refus: 'heros_mort' };
    this.mode = { type: 'heros' };
    return RIEN;
  }

  /** Bouton du héros ou touche E : sélectionne le héros, ou annule la sélection. */
  basculerHeros(etat: EtatPartie): Issue {
    if (this.mode.type === 'heros') return this.annuler();
    return this.selectionnerHeros(etat);
  }

  /** Bouton d'un sort ou touche Q/W : passe en visée, ou annule si ce sort était déjà en visée. */
  basculerSort(etat: EtatPartie, emplacement: number): Issue {
    if (this.mode.type === 'sort' && this.mode.emplacement === emplacement) return this.annuler();
    const sort = etat.sorts[emplacement];
    if (!sort) return { action: null, refus: 'sort_inconnu' };
    if (sort.recharge > 0) return { action: null, refus: 'sort_en_recharge' };
    this.mode = { type: 'sort', emplacement };
    return RIEN;
  }

  /** Bouton d'un objet ou touche A/Z/R : passe en visée, ou annule si cet objet était déjà en visée. */
  basculerObjet(etat: EtatPartie, emplacement: number): Issue {
    if (this.mode.type === 'objet' && this.mode.emplacement === emplacement) return this.annuler();
    if (etat.config.objets[emplacement] === undefined) return { action: null, refus: 'objet_inconnu' };
    if (etat.objetsUtilises[emplacement]) return { action: null, refus: 'objet_utilise' };
    // Un objet qui agit partout (Sablier, Herbe de Sabbat) s'utilise tout de suite : il n'y a rien à viser. Le point
    // envoyé est le centre de la carte, là où le rendu pose son effet.
    const id = etat.config.objets[emplacement];
    if (Object.hasOwn(OBJETS, id) && OBJETS[id as keyof typeof OBJETS].global) {
      const { largeur, hauteur } = etat.niveau.carte;
      return this.ordonner(etat, { type: 'utiliserObjet', emplacement, x: largeur / 2, y: hauteur / 2 });
    }
    this.mode = { type: 'objet', emplacement };
    return RIEN;
  }

  /**
   * Touches 1 à 5 : construit sur la case survolée par la souris ; sans survol, sur celle dont le menu est ouvert. Une case qui
   * porte déjà une tour ne fait rien ; une case interdite ou un prix trop haut disent pourquoi (le moteur valide).
   */
  construireSurSelection(etat: EtatPartie, famille: FamilleTour): Issue {
    const mode = this.mode;
    // Souris sur le chemin : rien ne se construit, ni là ni sur la case du menu ouvert ailleurs.
    if (this.surChemin) return { action: null, refus: 'case_interdite' };
    const lieu: LieuTour | null = this.viseePlace >= 0 ? { place: this.viseePlace } : this.visee ? { cx: this.visee.cx, cy: this.visee.cy } : lieuDuMenu(mode);
    if (!lieu || tourDuLieu(etat, lieu)) return RIEN;
    return this.ordonner(etat, { type: 'construire', tour: famille, ...lieu });
  }

  /** Échap, ou un toucher dans le vide : ferme les menus et abandonne la visée. */
  annuler(): Issue {
    this.mode = LIBRE;
    this.apercu = null;
    return RIEN;
  }

  /** Ramène le mode à un état valide quand la partie a changé sous lui (héros mort, tour vendue…). */
  rafraichir(etat: EtatPartie): void {
    const mode = this.mode;
    if (etat.statut !== 'en_cours') {
      this.mode = LIBRE;
      return;
    }
    if (mode.type === 'heros') {
      const heros = chercherParId(etat.unites, etat.heros);
      if (!heros || heros.mort) this.mode = LIBRE;
    } else if (mode.type === 'sort') {
      if ((etat.sorts[mode.emplacement]?.recharge ?? 1) > 0) this.mode = LIBRE;
    } else if (mode.type === 'objet') {
      if (etat.objetsUtilises[mode.emplacement] === true) this.mode = LIBRE;
    } else if (mode.type === 'ralliement') {
      if (!tourSurCase(etat, mode.cx, mode.cy)?.stats.soldats) this.mode = LIBRE;
    }
  }

  /** Recopie le mode dans ce que le rendu met en valeur sur la carte. */
  surbrillance(etat: EtatPartie, surb: Surbrillance): void {
    const mode = this.mode;
    surb.cx = -1;
    surb.cy = -1;
    surb.place = -1;
    surb.viseePlace = -1;
    surb.portee = 0;
    surb.viseeCx = -1;
    surb.viseeCy = -1;
    surb.viseeInterdite = false;
    surb.apercuPortee = 0;
    surb.apercuRalliement = false;
    surb.heros = mode.type === 'heros';
    surb.sortRayon = mode.type === 'sort' ? rayonSort(etat, mode.emplacement) : mode.type === 'objet' ? rayonObjet(etat, mode.emplacement) : 0;
    const lieu = lieuDuMenu(mode);
    if (mode.type === 'menu' && lieu?.place !== undefined) {
      surb.place = lieu.place;
      surb.portee = tourDuLieu(etat, lieu)?.stats.portee ?? 0;
    } else if (mode.type === 'menu' || mode.type === 'ralliement') {
      surb.cx = mode.cx;
      surb.cy = mode.cy;
      surb.portee = tourSurCase(etat, mode.cx, mode.cy)?.stats.portee ?? 0;
    }
    if (this.viseePlace >= 0 && etat.statut === 'en_cours') surb.viseePlace = this.viseePlace;
    const visee = this.visee;
    if (visee && etat.statut === 'en_cours') {
      surb.viseeCx = visee.cx;
      surb.viseeCy = visee.cy;
      // Rouge : un grand décor (le chemin, lui, ne s'éclaire pas). Une case qui porte une tour s'ouvre (améliorer, vendre) : elle reste claire.
      surb.viseeInterdite = estCaseInterdite(etat.niveau, visee.cx, visee.cy) && !tourSurCase(etat, visee.cx, visee.cy);
    }
    // La portée d'une tour qu'on s'apprête à construire se mesure depuis la case (ou la place) du menu, qui l'accueillerait.
    const apercu = lieu && !tourDuLieu(etat, lieu) ? this.apercu : null;
    if (apercu) {
      surb.apercuPortee = apercu.portee;
      if (apercu.ralliement) {
        surb.apercuRalliement = true;
        surb.apercuRalliementX = apercu.ralliement.x;
        surb.apercuRalliementY = apercu.ralliement.y;
      }
    }
  }

  /** Invite affichée pendant une visée (« Touche un point du chemin… »), ou null. */
  invite(etat: EtatPartie): string | null {
    const mode = this.mode;
    if (mode === this.modeInvite) return this.texteInvite;
    this.modeInvite = mode;
    this.texteInvite = this.rediger(etat, mode);
    return this.texteInvite;
  }

  private rediger(etat: EtatPartie, mode: Mode): string | null {
    switch (mode.type) {
      case 'heros':
        return tCle('invite.heros');
      case 'ralliement':
        return tCle('invite.ralliement');
      case 'objet': {
        const id = etat.config.objets[mode.emplacement];
        return id !== undefined && Object.hasOwn(OBJETS, id) ? tCle('invite.objet', { nom: tCle(OBJETS[id as keyof typeof OBJETS].nom) }) : null;
      }
      case 'sort': {
        const dieu = Object.hasOwn(DIEUX, etat.config.dieu) ? DIEUX[etat.config.dieu as keyof typeof DIEUX] : undefined;
        const sort = dieu?.sorts[mode.emplacement];
        return sort ? tCle('invite.sort', { nom: tCle(sort.nom) }) : null;
      }
      default:
        return null;
    }
  }
}
