// Bulle de description commune à tout le jeu : sur PC elle s'ouvre au survol de la souris après un court délai, sur
// téléphone à l'appui long, au clavier quand l'élément prend le focus. Un appui long n'exécute jamais l'action de
// l'élément (le clic qui suit est avalé) ; un toucher court garde son effet. Elle se ferme quand la souris quitte
// l'élément, au prochain toucher, quand le focus part ou à Échap. Elle ne reçoit aucun toucher (le jeu continue dessous,
// sans pause) et reste toujours entièrement à l'écran, zones sûres comprises.
//
// Une seule bulle existe à la fois (`role="tooltip"`, reliée à l'élément décrit par `aria-describedby`). Son contenu est
// fabriqué à l'ouverture puis relu régulièrement tant qu'elle est ouverte (PV qui baissent, prix qui changent).
import type { IdDieu } from '../data/dieux';
import type { IdFamille, Voie } from '../engine/definitions';
import { contenuEnnemiDeDonnees, contenuTourDeDonnees, type ChoixTour, type ContenuBulle } from './bulle-contenus';
import { el } from './dom';
import { SEUIL_GLISSEMENT } from './gestes';
import { lireZonesSures, type Marges, type Rectangle } from './marges';

/** Délai de survol à la souris avant d'ouvrir la bulle (ms). */
export const DELAI_SURVOL_MS = 350;
/** Durée d'un appui long au doigt (ms). */
export const DELAI_APPUI_LONG_MS = 450;
/** Écart minimal entre la bulle et le bord de l'écran (ou de la zone sûre), en pixels CSS. */
export const MARGE_BULLE = 8;
/** Écart entre la bulle et l'élément décrit. */
const ECART_ANCRE = 6;
/** Largeur maximale de la bulle ; plus large sur un écran bas (téléphone en paysage), pour qu'elle reste moins haute. */
const LARGEUR_MAX = 320;
const LARGEUR_MAX_ECRAN_BAS = 440;
const HAUTEUR_ECRAN_BAS = 480;
/** Intervalle de relecture du contenu d'une bulle ouverte (ms). */
const RAFRAICHISSEMENT_MS = 250;

// --- Placement (pur) -----------------------------------------------------------------------------

export interface PlacementBulle {
  readonly x: number;
  readonly y: number;
  /** Taille maximale que la bulle peut prendre sans sortir de l'écran. */
  readonly largeurMax: number;
  readonly hauteurMax: number;
}

function borner(valeur: number, min: number, max: number): number {
  return Math.max(min, Math.min(valeur, max));
}

/**
 * Où mettre une bulle de `taille` qui décrit l'élément `ancre` sur un écran de `ecran` (pixels CSS), hors des zones sûres
 * (`zones`, encoche et barre système) et à `MARGE_BULLE` des bords : au-dessus de l'élément et centrée sur lui s'il y a
 * la place, sinon en dessous, sinon du côté le plus large ; toujours décalée juste ce qu'il faut pour tenir dans l'écran.
 * Une bulle plus grande que la place disponible y est bornée (`largeurMax`, `hauteurMax`).
 */
export function placerBulle(
  ancre: Rectangle,
  taille: { readonly largeur: number; readonly hauteur: number },
  ecran: { readonly largeur: number; readonly hauteur: number },
  zones: Marges,
): PlacementBulle {
  const gauche = zones.gauche + MARGE_BULLE;
  const droite = ecran.largeur - zones.droite - MARGE_BULLE;
  const haut = zones.haut + MARGE_BULLE;
  const bas = ecran.hauteur - zones.bas - MARGE_BULLE;
  const largeurMax = Math.max(0, droite - gauche);
  const hauteurMax = Math.max(0, bas - haut);
  const largeur = Math.min(taille.largeur, largeurMax);
  const hauteur = Math.min(taille.hauteur, hauteurMax);
  const x = borner((ancre.left + ancre.right) / 2 - largeur / 2, gauche, droite - largeur);
  const dessus = ancre.top - ECART_ANCRE - hauteur;
  const dessous = ancre.bottom + ECART_ANCRE;
  let y: number;
  if (dessus >= haut) y = dessus;
  else if (dessous + hauteur <= bas) y = dessous;
  else y = ancre.top - haut > bas - ancre.bottom ? haut : bas - hauteur;
  return { x, y: borner(y, haut, bas - hauteur), largeurMax, hauteurMax };
}

// --- La bulle flottante (une seule pour tout le jeu) ---------------------------------------------

type ModeOuverture = 'souris' | 'toucher' | 'clavier';

interface Ouverture {
  /** Qui l'a ouverte : seul lui la referme. */
  readonly jeton: object;
  /** L'élément décrit (relié par `aria-describedby` si `decrit`) ; la bulle se ferme s'il quitte la page. */
  readonly proprietaire: HTMLElement;
  readonly decrit: boolean;
  readonly ancre: () => Rectangle;
  readonly fabriquer: () => ContenuBulle | null;
  readonly mode: ModeOuverture;
}

let compteur = 0;
/** Dernière entrée du joueur : le clavier (le focus ouvre alors la bulle) ou un pointeur (le focus vient d'un clic). */
let entreeClavier = false;
/** Le clic qui suit un appui long est avalé : l'appui long ne déclenche jamais l'action de l'élément. */
let avalerClic = false;

class BulleFlottante {
  readonly noeud: HTMLElement;
  private ouverture: Ouverture | null = null;
  private signature = '';
  private minuteur = 0;
  private descriptionAvant: string | null = null;

  constructor() {
    this.noeud = el('div', 'bulle');
    this.noeud.id = `bulle-${String(++compteur)}`;
    this.noeud.setAttribute('role', 'tooltip');
    this.noeud.hidden = true;
    // Capture : la bulle voit le toucher avant l'élément touché (et avant le jeu).
    document.addEventListener('pointerdown', () => {
      entreeClavier = false;
      avalerClic = false;
      if (this.ouverture?.mode === 'toucher') this.fermer();
    }, true);
    window.addEventListener('click', (e) => {
      if (!avalerClic) return;
      avalerClic = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.fermer();
      else entreeClavier = true;
    }, true);
  }

  estA(jeton: object): boolean {
    return this.ouverture?.jeton === jeton;
  }

  /** Ouvre la bulle ; faux si l'élément n'a rien à dire (contenu null). */
  ouvrir(ouverture: Ouverture): boolean {
    const contenu = ouverture.fabriquer();
    if (!contenu) return false;
    this.fermer();
    if (!this.noeud.isConnected) document.body.append(this.noeud);
    this.ouverture = ouverture;
    if (ouverture.decrit) {
      this.descriptionAvant = ouverture.proprietaire.getAttribute('aria-describedby');
      ouverture.proprietaire.setAttribute('aria-describedby', this.noeud.id);
    }
    this.afficher(contenu);
    this.minuteur = window.setInterval(() => { this.rafraichir(); }, RAFRAICHISSEMENT_MS);
    return true;
  }

  /** Ferme la bulle, seulement si `jeton` l'a ouverte quand il est donné. */
  fermer(jeton?: object): void {
    const ouverture = this.ouverture;
    if (!ouverture || (jeton !== undefined && ouverture.jeton !== jeton)) return;
    this.ouverture = null;
    window.clearInterval(this.minuteur);
    this.minuteur = 0;
    this.signature = '';
    this.noeud.hidden = true;
    this.noeud.replaceChildren();
    if (ouverture.decrit) {
      if (this.descriptionAvant === null) ouverture.proprietaire.removeAttribute('aria-describedby');
      else ouverture.proprietaire.setAttribute('aria-describedby', this.descriptionAvant);
    }
  }

  private rafraichir(): void {
    const ouverture = this.ouverture;
    if (!ouverture) return;
    const contenu = ouverture.proprietaire.isConnected ? ouverture.fabriquer() : null;
    if (!contenu) {
      this.fermer();
      return;
    }
    this.afficher(contenu);
  }

  private afficher(contenu: ContenuBulle): void {
    const signature = JSON.stringify(contenu);
    if (signature === this.signature) return;
    this.signature = signature;
    const enfants: HTMLElement[] = [el('strong', 'bulle-titre', contenu.titre)];
    if (contenu.sousTitre) enfants.push(el('span', 'bulle-sous-titre', contenu.sousTitre));
    if (contenu.lignes.length > 0) {
      const liste = el('dl', 'bulle-lignes');
      for (const ligne of contenu.lignes) liste.append(el('dt', '', ligne.libelle), el('dd', '', ligne.valeur));
      enfants.push(liste);
    }
    if (contenu.notes.length > 0) {
      const notes = el('ul', 'bulle-notes');
      for (const note of contenu.notes) notes.append(el('li', '', note));
      enfants.push(notes);
    }
    if (contenu.texte) enfants.push(el('p', 'bulle-texte', contenu.texte));
    this.noeud.replaceChildren(...enfants);
    this.noeud.hidden = false;
    this.placer();
  }

  /** Borne la taille de la bulle à l'écran, la mesure, puis la place. Une mesure par ouverture ou changement de contenu. */
  private placer(): void {
    const ouverture = this.ouverture;
    if (!ouverture) return;
    const ecran = { largeur: window.innerWidth, hauteur: window.innerHeight };
    const zones = lireZonesSures(document.body);
    const ancre = ouverture.ancre();
    const bornes = placerBulle(ancre, { largeur: 0, hauteur: 0 }, ecran, zones);
    const style = this.noeud.style;
    style.maxWidth = `${String(Math.min(ecran.hauteur < HAUTEUR_ECRAN_BAS ? LARGEUR_MAX_ECRAN_BAS : LARGEUR_MAX, bornes.largeurMax))}px`;
    style.maxHeight = `${String(bornes.hauteurMax)}px`;
    style.left = '0px';
    style.top = '0px';
    const mesure = this.noeud.getBoundingClientRect();
    const p = placerBulle(ancre, { largeur: mesure.width, hauteur: mesure.height }, ecran, zones);
    style.left = `${String(Math.round(p.x))}px`;
    style.top = `${String(Math.round(p.y))}px`;
  }
}

let unique: BulleFlottante | null = null;

function bulle(): BulleFlottante {
  unique ??= new BulleFlottante();
  return unique;
}

/** Ferme la bulle ouverte, quelle qu'elle soit (changement d'écran). */
export function fermerBulle(): void {
  unique?.fermer();
}

// --- Appui long ----------------------------------------------------------------------------------

/**
 * Reconnaît un appui long d'un seul doigt : `DELAI_APPUI_LONG_MS` sans bouger de plus de `SEUIL_GLISSEMENT`. Un second
 * doigt (pincement), un glissement, un relâché ou une annulation du système l'abandonnent.
 */
class AppuiLong {
  private readonly appuis = new Set<number>();
  private courant = -1;
  private x0 = 0;
  private y0 = 0;
  private minuteur = 0;

  constructor(private readonly declencher: (id: number) => void) {}

  get enCours(): boolean {
    return this.minuteur !== 0;
  }

  appuyer(id: number, x: number, y: number): void {
    this.appuis.add(id);
    this.annuler();
    if (this.appuis.size > 1) return;
    this.courant = id;
    this.x0 = x;
    this.y0 = y;
    this.minuteur = window.setTimeout(() => {
      this.minuteur = 0;
      this.courant = -1;
      this.declencher(id);
    }, DELAI_APPUI_LONG_MS);
  }

  bouger(id: number, x: number, y: number): void {
    if (id === this.courant && Math.hypot(x - this.x0, y - this.y0) >= SEUIL_GLISSEMENT) this.annuler();
  }

  relacher(id: number): void {
    this.appuis.delete(id);
    if (id === this.courant) this.annuler();
  }

  annuler(): void {
    window.clearTimeout(this.minuteur);
    this.minuteur = 0;
    this.courant = -1;
  }

  oublier(): void {
    this.annuler();
    this.appuis.clear();
  }
}

// --- Bulle d'un élément du DOM -------------------------------------------------------------------

function prendLeFocus(element: HTMLElement): boolean {
  return element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement || element instanceof HTMLInputElement || element.hasAttribute('tabindex');
}

/**
 * Donne une bulle à un élément : `fabriquer` rend son contenu (lu à l'ouverture puis relu tant qu'elle est ouverte), ou
 * null s'il n'a rien à dire. L'élément perd son `title` (la bulle le remplace) et prend le focus s'il ne le prenait pas.
 * Tout est retiré quand `signal` est annulé.
 */
export function attacherBulle(element: HTMLElement, fabriquer: () => ContenuBulle | null, signal?: AbortSignal): void {
  if (signal?.aborted) return;
  // Crée la bulle tout de suite : ses écouteurs (clavier, toucher suivant, clic à avaler) doivent voir la première entrée.
  bulle();
  const jeton = {};
  const options = signal ? { signal } : undefined;
  element.removeAttribute('title');
  if (!prendLeFocus(element)) element.tabIndex = 0;
  element.classList.add('a-bulle');
  let minuteur = 0;
  const annulerSurvol = (): void => {
    window.clearTimeout(minuteur);
    minuteur = 0;
  };
  const ouvrir = (mode: ModeOuverture): boolean =>
    element.isConnected && bulle().ouvrir({ jeton, proprietaire: element, decrit: true, ancre: () => element.getBoundingClientRect(), fabriquer, mode });
  const appui = new AppuiLong(() => {
    if (ouvrir('toucher')) avalerClic = true;
  });

  element.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    annulerSurvol();
    minuteur = window.setTimeout(() => {
      minuteur = 0;
      ouvrir('souris');
    }, DELAI_SURVOL_MS);
  }, options);
  element.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    annulerSurvol();
    bulle().fermer(jeton);
  }, options);
  element.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') {
      // Un clic garde son effet et referme la bulle : son contenu (prix, niveau) va sans doute changer.
      annulerSurvol();
      bulle().fermer(jeton);
      return;
    }
    appui.appuyer(e.pointerId, e.clientX, e.clientY);
  }, options);
  element.addEventListener('pointermove', (e) => { appui.bouger(e.pointerId, e.clientX, e.clientY); }, options);
  element.addEventListener('pointerup', (e) => { appui.relacher(e.pointerId); }, options);
  element.addEventListener('pointercancel', (e) => { appui.relacher(e.pointerId); }, options);
  // Au doigt, l'appui long ouvrirait aussi le menu du système (Android) : la bulle le remplace.
  element.addEventListener('contextmenu', (e) => {
    if (appui.enCours || bulle().estA(jeton)) e.preventDefault();
  }, options);
  element.addEventListener('focus', () => {
    if (entreeClavier) ouvrir('clavier');
  }, options);
  element.addEventListener('blur', () => { bulle().fermer(jeton); }, options);
  signal?.addEventListener('abort', () => {
    annulerSurvol();
    appui.oublier();
    bulle().fermer(jeton);
  }, { once: true });
}

/** Bulle d'une tour décrite par les données (collection, fiche d'un niveau, nouvelles découvertes). */
export function attacherBulleTour(element: HTMLElement, famille: IdFamille | 'divine', choix: ChoixTour = {}, signal?: AbortSignal): void {
  attacherBulle(element, () => contenuTourDeDonnees(famille, choix), signal);
}

/** Bulle d'un ennemi décrit par les données (id de src/data/ennemis.ts). */
export function attacherBulleEnnemi(element: HTMLElement, id: string, signal?: AbortSignal): void {
  attacherBulle(element, () => contenuEnnemiDeDonnees(id), signal);
}

const FAMILLES_BULLE: readonly string[] = ['caserne', 'tir', 'magie', 'artillerie'];
const DIEUX_BULLE: readonly string[] = ['plume', 'charlie', 'pollen'];

/**
 * Donne leur bulle à tous les éléments de `racine` qui portent `data-bulle-tour` (« tir », « tir:2 », « tir:4:B »,
 * « divine:charlie ») ou `data-bulle-ennemi` (id de l'ennemi). Une valeur inconnue est ignorée.
 */
export function brancherBulles(racine: ParentNode, signal?: AbortSignal): void {
  for (const element of racine.querySelectorAll<HTMLElement>('[data-bulle-tour]')) {
    const [famille = '', second = '', voie = ''] = (element.dataset.bulleTour ?? '').split(':');
    if (famille === 'divine' && DIEUX_BULLE.includes(second)) {
      attacherBulleTour(element, 'divine', { dieu: second as IdDieu }, signal);
    } else if (FAMILLES_BULLE.includes(famille)) {
      const niveau = Number(second || '1');
      if (![1, 2, 3, 4].includes(niveau) || (niveau === 4 && voie !== 'A' && voie !== 'B')) continue;
      attacherBulleTour(element, famille as IdFamille, { niveau: niveau as 1 | 2 | 3 | 4, ...(niveau === 4 ? { voie: voie as Voie } : {}) }, signal);
    }
  }
  for (const element of racine.querySelectorAll<HTMLElement>('[data-bulle-ennemi]')) {
    const id = element.dataset.bulleEnnemi ?? '';
    try {
      contenuEnnemiDeDonnees(id);
    } catch {
      continue;
    }
    attacherBulleEnnemi(element, id, signal);
  }
}

// --- Bulle sur la carte d'une partie (ennemis du canvas) -----------------------------------------

/** Une chose désignée sur la carte : où elle est à l'écran, et ce qu'on en dit (null quand elle n'est plus là). */
export interface CibleCarte {
  readonly ancre: () => Rectangle;
  readonly fabriquer: () => ContenuBulle | null;
}

/** Une cible survolée, avec ce qui l'identifie d'une image à l'autre (l'id d'un ennemi). */
export interface CibleCarteSurvolee extends CibleCarte {
  readonly cle: number;
}

/**
 * Bulle des choses dessinées sur le canvas (les ennemis), qui ne sont pas des éléments du DOM : la partie lui passe les
 * mouvements de la souris et les appuis du doigt, avec ce qui se trouve sous le pointeur (conversion écran → tuiles de
 * la partie). Le jeu n'est jamais mis en pause.
 */
export class BulleSurCarte {
  private readonly jeton = {};
  private cleSurvol: number | null = null;
  private minuteur = 0;
  private readonly appui: AppuiLong;
  private chercher: () => CibleCarte | null = () => null;
  private surPris: (id: number) => void = () => undefined;

  /** `racine` : l'élément de la partie (la bulle se ferme s'il quitte la page). */
  constructor(private readonly racine: HTMLElement) {
    bulle();
    this.appui = new AppuiLong((id) => {
      const cible = this.chercher();
      if (cible && this.ouvrir(cible, 'toucher')) this.surPris(id);
    });
  }

  private ouvrir(cible: CibleCarte, mode: ModeOuverture): boolean {
    return bulle().ouvrir({ jeton: this.jeton, proprietaire: this.racine, decrit: false, ancre: cible.ancre, fabriquer: cible.fabriquer, mode });
  }

  /** La souris est au-dessus de `cible` (identifiée par `cle`, l'id d'un ennemi), ou de rien (null). */
  survoler(cible: CibleCarteSurvolee | null): void {
    const cle = cible?.cle ?? null;
    if (cle === this.cleSurvol) return;
    this.cleSurvol = cle;
    window.clearTimeout(this.minuteur);
    this.minuteur = 0;
    bulle().fermer(this.jeton);
    if (!cible) return;
    this.minuteur = window.setTimeout(() => {
      this.minuteur = 0;
      this.ouvrir(cible, 'souris');
    }, DELAI_SURVOL_MS);
  }

  /**
   * Un doigt se pose en (x, y). Au bout de l'appui long, `chercher` dit ce qu'il y a dessous : s'il y a quelque chose,
   * la bulle s'ouvre et `surPris(id)` prévient la partie, qui abandonne le geste (pas de toucher au relâché).
   */
  appuyer(id: number, x: number, y: number, chercher: () => CibleCarte | null, surPris: (id: number) => void): void {
    this.chercher = chercher;
    this.surPris = surPris;
    this.appui.appuyer(id, x, y);
  }

  bouger(id: number, x: number, y: number): void {
    this.appui.bouger(id, x, y);
  }

  relacher(id: number): void {
    this.appui.relacher(id);
  }

  /** Tous les appuis sont oubliés (fenêtre qui perd le focus). */
  oublier(): void {
    this.appui.oublier();
  }

  detruire(): void {
    window.clearTimeout(this.minuteur);
    this.minuteur = 0;
    this.cleSurvol = null;
    this.appui.oublier();
    bulle().fermer(this.jeton);
  }
}
