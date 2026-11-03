// Indications de départ et d'arrivée en partie : à chaque entrée de chemin un panneau (fanion à crâne) qui annonce les
// ennemis de la prochaine vague, à chaque sortie la porte de ce qu'on défend (elle tremble et rougit quand un ennemi
// passe), et une traînée lumineuse qui parcourt chaque chemin au début du niveau puis la première fois qu'il sert.
//
// Affichage seulement : rien ici n'écrit dans l'état ni dans le journal, et le moteur n'est pas modifié. La composition
// annoncée est lue dans les vagues figées du niveau (ou, en mode infini, dans la vague que le générateur produira).
// Rien dans le calque ne capte le toucher : la bulle d'une pastille s'ouvre depuis le canvas (`puceSous`, branché sur
// `BulleSurCarte` par la partie), si bien qu'un toucher court atteint toujours la case dessous.
import { ENNEMIS } from '../data/ennemis';
import { genererVagueInfinie } from '../engine';
import type { EtatPartie, Evenement, Vague } from '../engine';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { spriteEnnemi } from '../render/habillage';
import { el } from './dom';

/** Un type d'ennemi et le nombre qui sortira par une entrée. */
export interface GroupeEntree {
  readonly type: string;
  readonly nombre: number;
}

/** Durée de la traînée lumineuse le long d'un chemin (ms de temps de jeu). */
export const DUREE_TRAINEE_MS = 2000;
/** Durée de la réaction de la porte à une fuite (ms réelles : la même à la vitesse ×1 et ×2). */
export const DUREE_SECOUSSE_MS = 500;
/** Au plus ce nombre de types d'ennemis par panneau ; les autres sont résumés par « +n ». */
export const TYPES_MAX_PAR_PANNEAU = 4;
/** Longueur de la queue de la traînée, en tuiles. */
const QUEUE_TUILES = 5;
const TRANCHES_TRAINEE = 14;
const MARGE_BORD = 6;
/** Les pastilles se touchent un peu à côté : un doigt n'est pas précis. */
const TOLERANCE_PUCE = 4;

/** La requête « réduire les animations » du système (le jeu n'a pas de réglage à lui), créée une seule fois par partie. */
function requeteAnimationsReduites(): MediaQueryList | null {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)');
  } catch {
    return null;
  }
}

/** Les bandes de l'écran que le HUD recouvre (pixels CSS), comme `Marges` de marges.ts. */
export interface MargesEcran {
  readonly haut: number;
  readonly bas: number;
  readonly gauche: number;
  readonly droite: number;
}

/** Une pastille d'ennemi sous le pointeur : de quoi ouvrir sa bulle depuis le canvas. */
export interface PuceSous {
  /** Négatif, pour ne jamais se confondre avec l'id d'un ennemi du canvas. */
  readonly cle: number;
  readonly type: string;
  ancre(): { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number };
  /** Faux dès que la pastille a disparu (vague partie, panneau masqué) : la bulle se referme. */
  encore(): boolean;
}

/**
 * La composition d'une vague par chemin : pour chaque indice de chemin, les types d'ennemis qui y sortent et leur
 * nombre, dans l'ordre d'apparition. Les élites comptent avec leur type.
 */
export function compositionParChemin(vague: Vague, chemins: number): GroupeEntree[][] {
  const resultat: GroupeEntree[][] = Array.from({ length: chemins }, () => []);
  for (const paquet of vague.paquets) {
    const groupes = resultat[paquet.chemin];
    if (!groupes) continue;
    const i = groupes.findIndex((g) => g.type === paquet.ennemi);
    const present = groupes[i];
    if (present) groupes[i] = { type: present.type, nombre: present.nombre + paquet.nombre };
    else groupes.push({ type: paquet.ennemi, nombre: paquet.nombre });
  }
  return resultat;
}

/** La vague d'indice `index` (0 pour la première), lue dans sa définition : les vagues figées, ou le générateur en infini. */
export function vagueDefinie(etat: EtatPartie, index: number): Vague | null {
  if (etat.config.infini) return genererVagueInfinie(etat.config, etat.chemins.length, index + 1);
  return etat.niveau.vagues[index] ?? null;
}

/** La prochaine vague à lancer, ou null s'il n'en reste plus. */
export function prochaineVague(etat: EtatPartie): Vague | null {
  return vagueDefinie(etat, etat.vagues.lancees);
}

/** Vrai quand les panneaux d'entrée sont à montrer : la vague en cours a fini d'apparaître, la suivante n'est pas partie. */
export function panneauxVisibles(etat: EtatPartie): boolean {
  return etat.statut === 'en_cours' && etat.vagues.paquets.length === 0;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

interface PuceAffichee {
  readonly noeud: HTMLElement;
  readonly type: string;
}

interface Entree {
  readonly noeud: HTMLElement;
  readonly point: Point;
  /** Indices des chemins qui partent de ce point. */
  readonly chemins: readonly number[];
  readonly puces: PuceAffichee[];
  signature: string;
  largeur: number;
  hauteur: number;
}

interface Sortie {
  readonly noeud: HTMLElement;
  readonly image: HTMLImageElement;
  readonly point: Point;
  readonly chemins: readonly number[];
  /** Fin de la réaction, en ms de l'horloge réelle ; -1 : calme. */
  secoueJusque: number;
  etat: string;
}

interface Trainee {
  readonly chemin: number;
  readonly debut: number;
}

function cleDe(p: Point): string {
  return `${String(Math.round(p.x * 100))},${String(Math.round(p.y * 100))}`;
}

function groupesParPoint(etat: EtatPartie, bout: 'debut' | 'fin'): { point: Point; chemins: number[] }[] {
  const resultat = new Map<string, { point: Point; chemins: number[] }>();
  etat.chemins.forEach((chemin, i) => {
    const point = bout === 'debut' ? chemin.points[0] : chemin.points[chemin.points.length - 1];
    if (!point) return;
    const cle = cleDe(point);
    const connu = resultat.get(cle);
    if (connu) connu.chemins.push(i);
    else resultat.set(cle, { point: { x: point.x, y: point.y }, chemins: [i] });
  });
  return [...resultat.values()];
}

export interface OptionsIndications {
  /** Vrai : pas de mouvement (ni traînée, ni pulsation, ni tremblement). Par défaut, la préférence du système. */
  readonly reduit?: () => boolean;
  /** Horloge réelle en ms (la porte tremble le même temps à toutes les vitesses). Par défaut `performance.now`. */
  readonly maintenant?: () => number;
}

export class Indications {
  readonly racine: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly entrees: Entree[] = [];
  private readonly sorties: Sortie[] = [];
  private readonly trainees: Trainee[] = [];
  /** Chemins déjà annoncés ou utilisés : leur traînée a eu lieu. */
  private readonly servis = new Set<number>();
  /** Chemin de chaque ennemi vivant au dernier pas : à la fuite, l'ennemi n'est déjà plus dans `etat.ennemis`. */
  private readonly cheminDe = new Map<number, number>();
  private readonly reduit: () => boolean;
  private readonly maintenant: () => number;
  private compositionIndex = -2;
  private composition: GroupeEntree[][] = [];
  private tailleCanvas = '';
  private canvasDessine = false;
  private largeur: number;
  private hauteur: number;
  private marges: MargesEcran = { haut: 0, bas: 0, gauche: 0, droite: 0 };

  constructor(
    private readonly parent: HTMLElement,
    private readonly atlas: AtlasRendu,
    private readonly projection: {
      readonly pixelsCssParTuile: number;
      enCssX(tuilesX: number): number;
      enCssY(tuilesY: number): number;
    },
    etat: EtatPartie,
    signal: AbortSignal,
    temps: number,
    options: OptionsIndications = {},
  ) {
    const requete = options.reduit ? null : requeteAnimationsReduites();
    this.reduit = options.reduit ?? ((): boolean => requete?.matches === true);
    this.maintenant = options.maintenant ?? ((): number => performance.now());
    this.racine = el('div', 'indications');
    this.canvas = el('canvas', 'trace');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.canvas.hidden = true;
    this.ctx = this.canvas.getContext('2d');
    this.racine.append(this.canvas);
    this.largeur = parent.clientWidth || window.innerWidth;
    this.hauteur = parent.clientHeight || window.innerHeight;

    for (const { point, chemins } of groupesParPoint(etat, 'fin')) {
      const noeud = el('div', 'sortie-chemin');
      noeud.setAttribute('role', 'img');
      noeud.setAttribute('aria-label', t('indications.sortie'));
      noeud.style.pointerEvents = 'none';
      const image = el('img', 'porte');
      image.alt = '';
      image.src = atlas.iconeUrl('porte-sortie', 4);
      noeud.append(image);
      this.racine.append(noeud);
      this.sorties.push({ noeud, image, point, chemins, secoueJusque: -1, etat: '' });
    }
    for (const { point, chemins } of groupesParPoint(etat, 'debut')) {
      const noeud = el('div', 'entree-chemin');
      noeud.style.pointerEvents = 'none';
      noeud.hidden = true;
      this.racine.append(noeud);
      this.entrees.push({ noeud, point, chemins, puces: [], signature: '', largeur: 0, hauteur: 0 });
    }
    parent.append(this.racine);
    this.memoriserEnnemis(etat);

    // Une partie reprise ne rejoue pas l'annonce des chemins déjà servis ; une nouvelle partie annonce ceux de la 1re vague.
    if (etat.vagues.lancees > 0) etat.chemins.forEach((_, i) => this.servis.add(i));
    else prochaineVague(etat)?.paquets.forEach((p) => this.servis.add(p.chemin));
    this.lancerTrainees(etat.chemins.map((_, i) => i), temps);
    signal.addEventListener('abort', () => { this.detruire(); }, { once: true });
  }

  /** Les chemins dont la traînée est en cours (pour les tests). */
  get cheminsEnTrainee(): readonly number[] {
    return this.trainees.map((tr) => tr.chemin);
  }

  private lancerTrainees(chemins: readonly number[], temps: number): void {
    if (this.reduit()) return;
    for (const chemin of chemins) {
      const i = this.trainees.findIndex((tr) => tr.chemin === chemin);
      if (i >= 0) this.trainees.splice(i, 1);
      this.trainees.push({ chemin, debut: temps });
    }
  }

  private memoriserEnnemis(etat: EtatPartie): void {
    this.cheminDe.clear();
    for (const e of etat.ennemis) this.cheminDe.set(e.id, e.chemin);
  }

  /**
   * À appeler pour chaque événement du pas, puis `apresPas` une fois le pas fini : une vague qui part annonce ses chemins
   * neufs, une fuite fait réagir la porte.
   */
  evenement(etat: EtatPartie, evenement: Evenement, temps: number): void {
    if (evenement.type === 'vague') {
      // Lue dans sa définition : un paquet d'un seul ennemi sans délai est déjà sorti de `etat.vagues.paquets` à ce pas.
      const vague = vagueDefinie(etat, evenement.index);
      const neufs = new Set<number>();
      for (const paquet of vague?.paquets ?? []) if (!this.servis.has(paquet.chemin)) neufs.add(paquet.chemin);
      for (const chemin of neufs) this.servis.add(chemin);
      this.lancerTrainees([...neufs], temps);
    } else if (evenement.type === 'fuite') {
      // L'ennemi a déjà quitté `etat.ennemis` : son chemin vient de la table du pas précédent. Inconnu : toutes les portes réagissent.
      const chemin = this.cheminDe.get(evenement.ennemi);
      const fin = this.maintenant() + DUREE_SECOUSSE_MS;
      for (const sortie of this.sorties) {
        if (chemin === undefined || sortie.chemins.includes(chemin)) sortie.secoueJusque = fin;
      }
    }
  }

  /** À appeler après les événements de chaque pas : retient les ennemis vivants et leur chemin. */
  apresPas(etat: EtatPartie): void {
    this.memoriserEnnemis(etat);
  }

  /** Les bandes que le HUD recouvre : les panneaux restent dans la zone libre. */
  definirMarges(marges: MargesEcran): void {
    this.marges = marges;
  }

  /** L'écran a changé de taille (redimensionnement, rotation) : taille relue, largeur des panneaux remesurée. */
  redimensionner(): void {
    this.largeur = this.parent.clientWidth || window.innerWidth;
    this.hauteur = this.parent.clientHeight || window.innerHeight;
    for (const entree of this.entrees) entree.signature = '';
  }

  mettreAJour(etat: EtatPartie, temps: number): void {
    const reduit = this.reduit();
    this.racine.classList.toggle('animations-reduites', reduit);
    this.mettreAJourEntrees(etat);
    this.mettreAJourSorties(reduit);
    this.dessinerTrainees(etat, temps, reduit);
  }

  private zone(): { gauche: number; haut: number; droite: number; bas: number } {
    const m = this.marges;
    return {
      gauche: m.gauche + MARGE_BORD,
      haut: m.haut + MARGE_BORD,
      droite: this.largeur - m.droite - MARGE_BORD,
      bas: this.hauteur - m.bas - MARGE_BORD,
    };
  }

  private compositionCourante(etat: EtatPartie): GroupeEntree[][] {
    const index = etat.vagues.lancees;
    if (index !== this.compositionIndex) {
      const vague = prochaineVague(etat);
      this.composition = vague ? compositionParChemin(vague, etat.chemins.length) : [];
      this.compositionIndex = index;
    }
    return this.composition;
  }

  /** Les groupes annoncés à une entrée (les chemins qui partent du même point sont réunis). */
  private groupesDe(entree: Entree, composition: readonly GroupeEntree[][]): GroupeEntree[] {
    const cumul = new Map<string, number>();
    for (const chemin of entree.chemins) {
      for (const g of composition[chemin] ?? []) cumul.set(g.type, (cumul.get(g.type) ?? 0) + g.nombre);
    }
    return [...cumul.entries()].map(([type, nombre]) => ({ type, nombre }));
  }

  private mettreAJourEntrees(etat: EtatPartie): void {
    const visible = panneauxVisibles(etat);
    const composition = visible ? this.compositionCourante(etat) : [];
    const zone = this.zone();
    for (const entree of this.entrees) {
      const groupes = visible ? this.groupesDe(entree, composition) : [];
      if (groupes.length === 0) {
        entree.noeud.hidden = true;
        entree.puces.length = 0;
        entree.signature = '';
        continue;
      }
      const signature = groupes.map((g) => `${g.type}:${String(g.nombre)}`).join('|');
      if (signature !== entree.signature) this.reconstruire(entree, groupes, signature);
      const x = this.projection.enCssX(entree.point.x);
      const y = this.projection.enCssY(entree.point.y);
      // Posé au-dessus du point d'entrée ; sans place au-dessus (entrée en haut de la carte, sous la barre du HUD),
      // en dessous. Toujours dans la zone libre.
      const w = entree.largeur;
      const h = entree.hauteur;
      let haut = y - h;
      if (haut < zone.haut) haut = y;
      const gauche = Math.min(Math.max(x - w / 2, zone.gauche), Math.max(zone.gauche, zone.droite - w));
      haut = Math.min(Math.max(haut, zone.haut), Math.max(zone.haut, zone.bas - h));
      entree.noeud.style.left = `${String(Math.round(gauche))}px`;
      entree.noeud.style.top = `${String(Math.round(haut))}px`;
    }
  }

  private reconstruire(entree: Entree, groupes: readonly GroupeEntree[], signature: string): void {
    entree.signature = signature;
    entree.puces.length = 0;
    const noeud = entree.noeud;
    noeud.replaceChildren();
    noeud.setAttribute('role', 'group');
    noeud.setAttribute('aria-label', t('indications.entree', { n: entree.chemins.map((c) => c + 1).join(', ') }));
    const fanion = el('img', 'fanion');
    fanion.alt = '';
    fanion.src = this.atlas.iconeUrl('icone-entree', 2);
    noeud.append(fanion);
    const puces = el('div', 'puces-entree');
    const montres = groupes.slice(0, TYPES_MAX_PAR_PANNEAU);
    for (const groupe of montres) {
      const puce = el('span', 'puce-ennemi');
      puce.dataset['type'] = groupe.type;
      puce.dataset['nombre'] = String(groupe.nombre);
      const nom = Object.hasOwn(ENNEMIS, groupe.type) ? tCle(ENNEMIS[groupe.type as keyof typeof ENNEMIS].nom) : groupe.type;
      puce.setAttribute('role', 'img');
      puce.setAttribute('aria-label', t('indications.entree_ennemi', { nom, nombre: groupe.nombre }));
      const icone = el('img', 'icone-ennemi');
      icone.alt = '';
      icone.src = this.atlas.iconeUrl(spriteEnnemi(groupe.type), 2);
      puce.append(icone, el('span', 'nombre-ennemi', `×${String(groupe.nombre)}`));
      puces.append(puce);
      entree.puces.push({ noeud: puce, type: groupe.type });
    }
    if (groupes.length > montres.length) {
      const autres = el('span', 'puce-ennemi autres', `+${String(groupes.length - montres.length)}`);
      autres.setAttribute('role', 'img');
      autres.setAttribute('aria-label', t('indications.autres', { n: groupes.length - montres.length }));
      puces.append(autres);
    }
    noeud.append(puces);
    // Mesuré une fois par contenu (et à chaque redimensionnement) : sert à placer le panneau sans lire le DOM à chaque image.
    noeud.hidden = false;
    entree.largeur = noeud.offsetWidth || 24 + 36 * montres.length;
    entree.hauteur = noeud.offsetHeight || 34;
  }

  /**
   * La pastille d'ennemi sous le point (x, y) de l'écran (pixels CSS), ou null. Les pastilles ne captent aucun événement :
   * la partie interroge ce test depuis les événements du canvas pour ouvrir la bulle (survol, appui long).
   */
  puceSous(x: number, y: number): PuceSous | null {
    for (let e = 0; e < this.entrees.length; e++) {
      const entree = this.entrees[e];
      if (!entree || entree.noeud.hidden) continue;
      for (let i = 0; i < entree.puces.length; i++) {
        const puce = entree.puces[i];
        if (!puce) continue;
        const r = puce.noeud.getBoundingClientRect();
        if (r.right <= r.left || r.bottom <= r.top) continue;
        if (x < r.left - TOLERANCE_PUCE || x > r.right + TOLERANCE_PUCE || y < r.top - TOLERANCE_PUCE || y > r.bottom + TOLERANCE_PUCE) continue;
        return {
          cle: -(1 + e * TYPES_MAX_PAR_PANNEAU + i),
          type: puce.type,
          ancre: () => puce.noeud.getBoundingClientRect(),
          encore: () => !entree.noeud.hidden && entree.puces.includes(puce) && puce.noeud.isConnected,
        };
      }
    }
    return null;
  }

  private mettreAJourSorties(reduit: boolean): void {
    const cote = Math.round(Math.min(56, Math.max(28, this.projection.pixelsCssParTuile * 2.4)));
    const demi = cote / 2;
    const zone = this.zone();
    const maintenant = this.maintenant();
    for (const sortie of this.sorties) {
      const secoue = maintenant < sortie.secoueJusque;
      const etat = `${secoue ? 'r' : '-'}${reduit ? 'm' : '-'}${String(cote)}`;
      if (etat !== sortie.etat) {
        sortie.etat = etat;
        sortie.noeud.classList.toggle('rougit', secoue);
        sortie.noeud.classList.toggle('secoue', secoue && !reduit);
        sortie.image.style.width = `${String(cote)}px`;
        sortie.image.style.height = `${String(cote)}px`;
      }
      const x = Math.min(Math.max(this.projection.enCssX(sortie.point.x), zone.gauche + demi), Math.max(zone.gauche + demi, zone.droite - demi));
      const y = Math.min(Math.max(this.projection.enCssY(sortie.point.y), zone.haut + demi), Math.max(zone.haut + demi, zone.bas - demi));
      sortie.noeud.style.left = `${String(Math.round(x))}px`;
      sortie.noeud.style.top = `${String(Math.round(y))}px`;
    }
  }

  private dessinerTrainees(etat: EtatPartie, temps: number, reduit: boolean): void {
    if (reduit) this.trainees.length = 0;
    for (let i = this.trainees.length - 1; i >= 0; i--) {
      const tr = this.trainees[i];
      if (tr && temps - tr.debut >= DUREE_TRAINEE_MS) this.trainees.splice(i, 1);
    }
    const ctx = this.ctx;
    const actif = this.trainees.length > 0;
    // Le canvas n'est effacé que s'il a dessiné à l'image précédente, et masqué quand aucune traînée ne tourne.
    this.canvas.hidden = !actif;
    if (!actif && !this.canvasDessine) return;
    if (!ctx) {
      this.canvasDessine = false;
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const taille = `${String(this.largeur)}x${String(this.hauteur)}@${String(dpr)}`;
    if (taille !== this.tailleCanvas) {
      this.tailleCanvas = taille;
      this.canvas.width = Math.round(this.largeur * dpr);
      this.canvas.height = Math.round(this.hauteur * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.largeur, this.hauteur);
    this.canvasDessine = actif;
    for (const tr of this.trainees) {
      const chemin = etat.chemins[tr.chemin];
      if (!chemin) continue;
      this.dessinerTrainee(ctx, chemin.points, (temps - tr.debut) / DUREE_TRAINEE_MS);
    }
  }

  private dessinerTrainee(ctx: CanvasRenderingContext2D, points: readonly Point[], avancement: number): void {
    const px = points.map((p) => ({ x: this.projection.enCssX(p.x), y: this.projection.enCssY(p.y) }));
    const cumul = [0];
    for (let i = 1; i < px.length; i++) {
      const a = px[i - 1];
      const b = px[i];
      if (a && b) cumul.push((cumul[i - 1] ?? 0) + Math.hypot(b.x - a.x, b.y - a.y));
    }
    const longueur = cumul[cumul.length - 1] ?? 0;
    if (longueur <= 0) return;
    const queue = Math.min(QUEUE_TUILES * this.projection.pixelsCssParTuile, longueur);
    const tete = avancement * (longueur + queue);
    const pointA = (d: number): Point => {
      const dd = Math.min(Math.max(d, 0), longueur);
      let s = 1;
      while (s < cumul.length - 1 && dd > (cumul[s] ?? 0)) s++;
      const a = px[s - 1];
      const b = px[s];
      if (!a || !b) return { x: 0, y: 0 };
      const l = (cumul[s] ?? 0) - (cumul[s - 1] ?? 0);
      const f = l > 0 ? (dd - (cumul[s - 1] ?? 0)) / l : 0;
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    };
    // Fondu d'entrée et de sortie : la traînée apparaît à l'entrée et s'éteint sur la porte.
    const fondu = Math.min(1, avancement * 8, (1 - avancement) * 8 + 0.2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let k = 0; k < TRANCHES_TRAINEE; k++) {
      const d0 = tete - queue + (queue * k) / TRANCHES_TRAINEE;
      const d1 = tete - queue + (queue * (k + 1)) / TRANCHES_TRAINEE;
      if (d1 <= 0 || d0 >= longueur) continue;
      const a = pointA(d0);
      const b = pointA(d1);
      const force = ((k + 1) / TRANCHES_TRAINEE) * fondu;
      ctx.strokeStyle = `rgba(255, 190, 70, ${(0.28 * force).toFixed(3)})`;
      ctx.lineWidth = 3 + 7 * force;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 245, 190, ${(0.9 * force).toFixed(3)})`;
      ctx.lineWidth = 1 + 3 * force;
      ctx.stroke();
    }
  }

  detruire(): void {
    this.racine.remove();
  }
}
