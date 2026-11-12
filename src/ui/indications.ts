// Indications de départ et d'arrivée en partie : à chaque entrée de chemin un panneau (fanion à crâne) qui annonce les
// ennemis de la prochaine vague, à chaque sortie la porte de ce qu'on défend (elle tremble et rougit quand un ennemi
// passe), et une traînée lumineuse qui parcourt chaque chemin au début du niveau puis la première fois qu'il sert.
// Vol de Corbeaux : un panneau par couloir au bord gauche (à la hauteur du couloir), et au bord droit une marque qui
// rougit et tremble comme la porte quand un corbeau sort.
//
// Affichage seulement : rien ici n'écrit dans l'état ni dans le journal, et le moteur n'est pas modifié. La composition
// annoncée est lue dans les vagues figées du niveau (ou, en mode infini, dans la vague que le générateur produira).
// Rien dans le calque ne capte le toucher : la bulle d'une pastille s'ouvre depuis le canvas (`puceSous`, branché sur
// `BulleSurCarte` par la partie), si bien qu'un toucher court atteint toujours la case dessous.
import { ENNEMIS } from '../data/ennemis';
import { cheminEffectif, genererVagueInfinie } from '../engine';
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
/** Écart entre un panneau de couloir et ce qu'il évite (panneau d'entrée, autre couloir), pixels CSS. */
const ECART_PANNEAUX = 2;
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

/** Une pastille sous le pointeur : de quoi ouvrir sa bulle depuis le canvas. */
export interface PuceSous {
  /** Négatif, pour ne jamais se confondre avec l'id d'un ennemi du canvas. */
  readonly cle: number;
  /** `ennemi` : une pastille d'ennemi (`type` est son identifiant) ; `couloir` : le repère d'un couloir du Vol de Corbeaux. */
  readonly genre: 'ennemi' | 'couloir';
  readonly type: string;
  ancre(): { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number };
  /** Faux dès que la pastille a disparu (vague partie, panneau masqué) : la bulle se referme. */
  encore(): boolean;
}

/** Un rectangle de l'écran, pixels CSS. */
export interface RectEcran {
  readonly gauche: number;
  readonly haut: number;
  readonly droite: number;
  readonly bas: number;
}

function ajouterGroupe(groupes: GroupeEntree[], type: string, nombre: number): void {
  const i = groupes.findIndex((g) => g.type === type);
  const present = groupes[i];
  if (present) groupes[i] = { type: present.type, nombre: present.nombre + nombre };
  else groupes.push({ type, nombre });
}

/**
 * La composition d'une vague par chemin : pour chaque indice de chemin, les types d'ennemis qui y sortent et leur
 * nombre, dans l'ordre d'apparition. Les élites comptent avec leur type. Un groupe d'un couloir (Vol de Corbeaux) ne
 * suit aucun chemin : il n'est pas compté ici (voir `compositionParCouloir`). `effectif` : le chemin que le groupe prend vraiment
 * (chemin fermé : son repli) ; par défaut, le chemin prévu.
 */
export function compositionParChemin(vague: Vague, chemins: number, effectif: (chemin: number) => number = (c) => c): GroupeEntree[][] {
  const resultat: GroupeEntree[][] = Array.from({ length: chemins }, () => []);
  for (const paquet of vague.paquets) {
    if (paquet.couloir !== undefined) continue;
    const groupes = resultat[effectif(paquet.chemin)];
    if (groupes) ajouterGroupe(groupes, paquet.ennemi, paquet.nombre);
  }
  return resultat;
}

/** La composition d'une vague par couloir du Vol de Corbeaux : pour chaque indice de couloir, ses types d'ennemis et leur nombre. */
export function compositionParCouloir(vague: Vague, couloirs: number): GroupeEntree[][] {
  const resultat: GroupeEntree[][] = Array.from({ length: couloirs }, () => []);
  for (const paquet of vague.paquets) {
    if (paquet.couloir === undefined) continue;
    const groupes = resultat[paquet.couloir];
    if (groupes) ajouterGroupe(groupes, paquet.ennemi, paquet.nombre);
  }
  return resultat;
}

/** Les chemins qu'une vague emprunte (ses groupes de couloir n'en suivent aucun). */
export function cheminsDeLaVague(vague: Vague | null, effectif: (chemin: number) => number = (c) => c): number[] {
  const chemins = new Set<number>();
  for (const paquet of vague?.paquets ?? []) if (paquet.couloir === undefined) chemins.add(effectif(paquet.chemin));
  return [...chemins];
}

/**
 * Où poser un panneau de couloir (coin haut gauche, pixels CSS) : collé au bord gauche de la zone libre, centré sur la hauteur
 * `y` du couloir. S'il chevauche un obstacle (panneau d'entrée, panneau d'un autre couloir déjà posé), il se pousse juste en
 * dessous, ou juste au-dessus si la place manque en bas ; il reste toujours dans la zone libre.
 */
export function placerPanneauCouloir(y: number, largeur: number, hauteur: number, zone: RectEcran, obstacles: readonly RectEcran[]): { gauche: number; haut: number } {
  const gauche = zone.gauche;
  const borner = (h: number): number => Math.min(Math.max(h, zone.haut), Math.max(zone.haut, zone.bas - hauteur));
  const chevauche = (haut: number): RectEcran | undefined =>
    obstacles.find((o) => gauche < o.droite && gauche + largeur > o.gauche && haut < o.bas && haut + hauteur > o.haut);
  let haut = borner(y - hauteur / 2);
  for (let essai = 0; essai < obstacles.length * 2 + 1; essai++) {
    const obstacle = chevauche(haut);
    if (!obstacle) return { gauche, haut };
    const dessous = obstacle.bas + ECART_PANNEAUX;
    const dessus = obstacle.haut - hauteur - ECART_PANNEAUX;
    // On garde le côté où le couloir reste le plus proche, tant qu'il tient dans la zone.
    const candidats = [dessous, dessus].filter((h) => h >= zone.haut && h + hauteur <= zone.bas).sort((a, b) => Math.abs(a + hauteur / 2 - y) - Math.abs(b + hauteur / 2 - y));
    const choisi = candidats.find((h) => !chevauche(h)) ?? candidats[0];
    if (choisi === undefined) return { gauche, haut };
    haut = choisi;
  }
  return { gauche, haut };
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
  readonly genre: 'ennemi' | 'couloir';
  readonly type: string;
}

/** Un panneau d'annonce : à une entrée de chemin, ou au bord gauche pour un couloir. */
interface Panneau {
  readonly noeud: HTMLElement;
  readonly puces: PuceAffichee[];
  signature: string;
  largeur: number;
  hauteur: number;
}

interface Entree extends Panneau {
  readonly point: Point;
  /** Indices des chemins qui partent de ce point. */
  readonly chemins: readonly number[];
}

interface PanneauCouloir extends Panneau {
  /** Indice du couloir (`etat.couloirs`). */
  readonly couloir: number;
  /** Hauteur du couloir, en tuiles. */
  readonly y: number;
}

/** Une marque qui réagit aux fuites : la porte d'un chemin, ou le bout d'un couloir au bord droit. */
interface Reaction {
  readonly noeud: HTMLElement;
  readonly image: HTMLImageElement;
  /** Fin de la réaction, en ms de l'horloge réelle ; -1 : calme. */
  secoueJusque: number;
  etat: string;
}

interface Sortie extends Reaction {
  readonly point: Point;
  readonly chemins: readonly number[];
}

interface SortieCouloir extends Reaction {
  readonly couloir: number;
  readonly y: number;
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

function nomEnnemi(type: string): string {
  return Object.hasOwn(ENNEMIS, type) ? tCle(ENNEMIS[type as keyof typeof ENNEMIS].nom) : type;
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
  private readonly couloirs: PanneauCouloir[] = [];
  private readonly sorties: Sortie[] = [];
  private readonly sortiesCouloirs: SortieCouloir[] = [];
  private readonly trainees: Trainee[] = [];
  /** Chemins déjà annoncés ou utilisés : leur traînée a eu lieu. */
  private readonly servis = new Set<number>();
  /** Chemin de chaque ennemi vivant au dernier pas : à la fuite, l'ennemi n'est déjà plus dans `etat.ennemis`. */
  private readonly cheminDe = new Map<number, number>();
  /** Couloir de chaque ennemi vivant qui vole dans un couloir (Vol de Corbeaux), au dernier pas. */
  private readonly couloirDe = new Map<number, number>();
  private readonly reduit: () => boolean;
  private readonly maintenant: () => number;
  private compositionCle = '';
  private composition: GroupeEntree[][] = [];
  private compositionCouloirs: GroupeEntree[][] = [];
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
    etat.couloirs.forEach((couloir, k) => {
      const y = couloir.points[0]?.y ?? 0;
      // Le bout du couloir : rien tant qu'aucun corbeau ne sort, puis une marque qui rougit et tremble comme la porte.
      const noeud = el('div', 'sortie-couloir');
      noeud.setAttribute('role', 'img');
      noeud.setAttribute('aria-label', t('indications.sortie_couloir', { n: k + 1 }));
      noeud.style.pointerEvents = 'none';
      noeud.hidden = true;
      const image = el('img', 'marque');
      image.alt = '';
      image.src = atlas.iconeUrl('icone-sortie-couloir', 2);
      noeud.append(image);
      this.racine.append(noeud);
      this.sortiesCouloirs.push({ noeud, image, couloir: k, y, secoueJusque: -1, etat: '' });
      const panneau = el('div', 'entree-couloir');
      panneau.style.pointerEvents = 'none';
      panneau.hidden = true;
      this.racine.append(panneau);
      this.couloirs.push({ noeud: panneau, couloir: k, y, puces: [], signature: '', largeur: 0, hauteur: 0 });
    });
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
    else for (const chemin of cheminsDeLaVague(prochaineVague(etat), (c) => cheminEffectif(etat, c))) this.servis.add(chemin);
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
    this.couloirDe.clear();
    for (const e of etat.ennemis) {
      // Un ennemi en couloir garde `chemin` à 0 par convention : on ne le prend pas pour un ennemi du chemin 0.
      if (e.couloir >= 0) this.couloirDe.set(e.id, e.couloir);
      else this.cheminDe.set(e.id, e.chemin);
    }
  }

  /**
   * À appeler pour chaque événement du pas, puis `apresPas` une fois le pas fini : une vague qui part annonce ses chemins
   * neufs, une fuite fait réagir la porte (ou le bout du couloir, pour un corbeau).
   */
  evenement(etat: EtatPartie, evenement: Evenement, temps: number): void {
    if (evenement.type === 'vague') {
      // Lue dans sa définition : un paquet d'un seul ennemi sans délai est déjà sorti de `etat.vagues.paquets` à ce pas.
      const neufs = cheminsDeLaVague(vagueDefinie(etat, evenement.index), (c) => cheminEffectif(etat, c)).filter((chemin) => !this.servis.has(chemin));
      for (const chemin of neufs) this.servis.add(chemin);
      this.lancerTrainees(neufs, temps);
    } else if (evenement.type === 'fuite') {
      const fin = this.maintenant() + DUREE_SECOUSSE_MS;
      const couloir = this.couloirDe.get(evenement.ennemi);
      if (couloir !== undefined) {
        for (const sortie of this.sortiesCouloirs) if (sortie.couloir === couloir) sortie.secoueJusque = fin;
        return;
      }
      // L'ennemi a déjà quitté `etat.ennemis` : son chemin vient de la table du pas précédent. Inconnu : toutes les portes réagissent.
      const chemin = this.cheminDe.get(evenement.ennemi);
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
    for (const panneau of this.couloirs) panneau.signature = '';
  }

  mettreAJour(etat: EtatPartie, temps: number): void {
    const reduit = this.reduit();
    this.racine.classList.toggle('animations-reduites', reduit);
    const obstacles = this.mettreAJourEntrees(etat);
    this.mettreAJourCouloirs(etat, obstacles);
    this.mettreAJourSorties(reduit);
    this.dessinerTrainees(etat, temps, reduit);
  }

  private zone(): RectEcran {
    const m = this.marges;
    return {
      gauche: m.gauche + MARGE_BORD,
      haut: m.haut + MARGE_BORD,
      droite: this.largeur - m.droite - MARGE_BORD,
      bas: this.hauteur - m.bas - MARGE_BORD,
    };
  }

  private compositionCourante(etat: EtatPartie): void {
    // La composition suit aussi les chemins ouverts : un chemin qui s'ouvre ou se ferme change où les groupes sortent.
    const cle = `${String(etat.vagues.lancees)}:${etat.dynamique.cheminsActifs.map((a) => (a ? 1 : 0)).join('')}`;
    if (cle === this.compositionCle) return;
    const vague = prochaineVague(etat);
    this.composition = vague ? compositionParChemin(vague, etat.chemins.length, (c) => cheminEffectif(etat, c)) : [];
    this.compositionCouloirs = vague ? compositionParCouloir(vague, etat.couloirs.length) : [];
    this.compositionCle = cle;
  }

  /** Les groupes annoncés à une entrée (les chemins qui partent du même point sont réunis). */
  private groupesDe(entree: Entree): GroupeEntree[] {
    const cumul = new Map<string, number>();
    for (const chemin of entree.chemins) {
      for (const g of this.composition[chemin] ?? []) cumul.set(g.type, (cumul.get(g.type) ?? 0) + g.nombre);
    }
    return [...cumul.entries()].map(([type, nombre]) => ({ type, nombre }));
  }

  /** Place les panneaux d'entrée ; rend leurs rectangles, que les panneaux de couloir évitent. */
  private mettreAJourEntrees(etat: EtatPartie): RectEcran[] {
    const visible = panneauxVisibles(etat);
    if (visible) this.compositionCourante(etat);
    const zone = this.zone();
    const rects: RectEcran[] = [];
    for (const entree of this.entrees) {
      const groupes = visible ? this.groupesDe(entree) : [];
      if (groupes.length === 0) {
        this.masquer(entree);
        continue;
      }
      const signature = groupes.map((g) => `${g.type}:${String(g.nombre)}`).join('|');
      if (signature !== entree.signature) {
        this.reconstruire(entree, groupes, signature, 'icone-entree', t('indications.entree', { n: entree.chemins.map((c) => c + 1).join(', ') }), 'indications.entree_ennemi');
      }
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
      rects.push({ gauche, haut, droite: gauche + w, bas: haut + h });
    }
    return rects;
  }

  /** Les panneaux des couloirs, au bord gauche à la hauteur de chaque couloir que la prochaine vague emprunte. */
  private mettreAJourCouloirs(etat: EtatPartie, obstacles: RectEcran[]): void {
    if (this.couloirs.length === 0) return;
    const visible = panneauxVisibles(etat);
    if (visible) this.compositionCourante(etat);
    const zone = this.zone();
    for (const panneau of this.couloirs) {
      const groupes = visible ? (this.compositionCouloirs[panneau.couloir] ?? []) : [];
      if (groupes.length === 0) {
        this.masquer(panneau);
        continue;
      }
      const signature = groupes.map((g) => `${g.type}:${String(g.nombre)}`).join('|');
      if (signature !== panneau.signature) {
        this.reconstruire(panneau, groupes, signature, 'icone-couloir', t('indications.couloir', { n: panneau.couloir + 1 }), 'indications.couloir_ennemi');
      }
      const { gauche, haut } = placerPanneauCouloir(this.projection.enCssY(panneau.y), panneau.largeur, panneau.hauteur, zone, obstacles);
      panneau.noeud.style.left = `${String(Math.round(gauche))}px`;
      panneau.noeud.style.top = `${String(Math.round(haut))}px`;
      obstacles.push({ gauche, haut, droite: gauche + panneau.largeur, bas: haut + panneau.hauteur });
    }
  }

  private masquer(panneau: Panneau): void {
    panneau.noeud.hidden = true;
    panneau.puces.length = 0;
    panneau.signature = '';
  }

  private reconstruire(panneau: Panneau, groupes: readonly GroupeEntree[], signature: string, repere: string, libelle: string, cleEnnemi: 'indications.entree_ennemi' | 'indications.couloir_ennemi'): void {
    panneau.signature = signature;
    panneau.puces.length = 0;
    const noeud = panneau.noeud;
    noeud.replaceChildren();
    noeud.setAttribute('role', 'group');
    noeud.setAttribute('aria-label', libelle);
    const fanion = el('img', repere === 'icone-entree' ? 'fanion' : 'fanion repere-couloir');
    fanion.alt = '';
    fanion.src = this.atlas.iconeUrl(repere, 2);
    noeud.append(fanion);
    // Le repère d'un couloir a sa bulle (ce qu'est un couloir de corbeaux) ; le fanion d'une entrée n'en a pas.
    if (repere !== 'icone-entree') panneau.puces.push({ noeud: fanion, genre: 'couloir', type: '' });
    const puces = el('div', 'puces-entree');
    const montres = groupes.slice(0, TYPES_MAX_PAR_PANNEAU);
    for (const groupe of montres) {
      const puce = el('span', 'puce-ennemi');
      puce.dataset['type'] = groupe.type;
      puce.dataset['nombre'] = String(groupe.nombre);
      puce.setAttribute('role', 'img');
      puce.setAttribute('aria-label', t(cleEnnemi, { nom: nomEnnemi(groupe.type), nombre: groupe.nombre }));
      const icone = el('img', 'icone-ennemi');
      icone.alt = '';
      icone.src = this.atlas.iconeUrl(spriteEnnemi(groupe.type), 2);
      puce.append(icone, el('span', 'nombre-ennemi', `×${String(groupe.nombre)}`));
      puces.append(puce);
      panneau.puces.push({ noeud: puce, genre: 'ennemi', type: groupe.type });
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
    panneau.largeur = noeud.offsetWidth || 24 + 36 * montres.length;
    panneau.hauteur = noeud.offsetHeight || 34;
  }

  /**
   * La pastille d'ennemi (ou le repère d'un couloir) sous le point (x, y) de l'écran (pixels CSS), ou null. Les pastilles ne
   * captent aucun événement : la partie interroge ce test depuis les événements du canvas pour ouvrir la bulle (survol, appui long).
   */
  puceSous(x: number, y: number): PuceSous | null {
    const panneaux: Panneau[] = [...this.entrees, ...this.couloirs];
    // Un panneau a au plus TYPES_MAX pastilles et un repère : les clés ne se chevauchent pas d'un panneau à l'autre.
    const parPanneau = TYPES_MAX_PAR_PANNEAU + 1;
    for (let p = 0; p < panneaux.length; p++) {
      const panneau = panneaux[p];
      if (!panneau || panneau.noeud.hidden) continue;
      for (let i = 0; i < panneau.puces.length; i++) {
        const puce = panneau.puces[i];
        if (!puce) continue;
        const r = puce.noeud.getBoundingClientRect();
        if (r.right <= r.left || r.bottom <= r.top) continue;
        if (x < r.left - TOLERANCE_PUCE || x > r.right + TOLERANCE_PUCE || y < r.top - TOLERANCE_PUCE || y > r.bottom + TOLERANCE_PUCE) continue;
        return {
          cle: -(1 + p * parPanneau + i),
          genre: puce.genre,
          type: puce.type,
          ancre: () => puce.noeud.getBoundingClientRect(),
          encore: () => !panneau.noeud.hidden && panneau.puces.includes(puce) && puce.noeud.isConnected,
        };
      }
    }
    return null;
  }

  private reagir(reaction: Reaction, maintenant: number, reduit: boolean, cote: number): boolean {
    const secoue = maintenant < reaction.secoueJusque;
    const etat = `${secoue ? 'r' : '-'}${reduit ? 'm' : '-'}${String(cote)}`;
    if (etat !== reaction.etat) {
      reaction.etat = etat;
      reaction.noeud.classList.toggle('rougit', secoue);
      reaction.noeud.classList.toggle('secoue', secoue && !reduit);
      reaction.image.style.width = `${String(cote)}px`;
      reaction.image.style.height = `${String(cote)}px`;
    }
    return secoue;
  }

  private mettreAJourSorties(reduit: boolean): void {
    const cote = Math.round(Math.min(56, Math.max(28, this.projection.pixelsCssParTuile * 2.4)));
    const demi = cote / 2;
    const zone = this.zone();
    const maintenant = this.maintenant();
    for (const sortie of this.sorties) {
      this.reagir(sortie, maintenant, reduit, cote);
      const x = Math.min(Math.max(this.projection.enCssX(sortie.point.x), zone.gauche + demi), Math.max(zone.gauche + demi, zone.droite - demi));
      const y = Math.min(Math.max(this.projection.enCssY(sortie.point.y), zone.haut + demi), Math.max(zone.haut + demi, zone.bas - demi));
      sortie.noeud.style.left = `${String(Math.round(x))}px`;
      sortie.noeud.style.top = `${String(Math.round(y))}px`;
    }
    // Le bout d'un couloir ne se montre que le temps de la réaction, au bord droit de la zone libre, à la hauteur du couloir.
    const coteCouloir = Math.round(cote * 0.75);
    const demiCouloir = coteCouloir / 2;
    for (const sortie of this.sortiesCouloirs) {
      const secoue = this.reagir(sortie, maintenant, reduit, coteCouloir);
      sortie.noeud.hidden = !secoue;
      if (!secoue) continue;
      const x = Math.max(zone.gauche + demiCouloir, zone.droite - demiCouloir);
      const y = Math.min(Math.max(this.projection.enCssY(sortie.y), zone.haut + demiCouloir), Math.max(zone.haut + demiCouloir, zone.bas - demiCouloir));
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
