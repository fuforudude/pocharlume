// Indications de départ et d'arrivée en partie : à chaque entrée de chemin un panneau (fanion à crâne) qui annonce les
// ennemis de la prochaine vague, à chaque sortie la porte de ce qu'on défend (elle tremble et rougit quand un ennemi
// passe), et une traînée lumineuse qui parcourt chaque chemin au début du niveau puis la première fois qu'il sert.
//
// Affichage seulement : rien ici n'écrit dans l'état ni dans le journal, et le moteur n'est pas modifié. La composition
// annoncée est lue dans les vagues figées du niveau (ou, en mode infini, dans la vague que le générateur produira).
import { ENNEMIS } from '../data/ennemis';
import { genererVagueInfinie } from '../engine';
import type { Ennemi, EtatPartie, Evenement, Vague } from '../engine';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { spriteEnnemi } from '../render/habillage';
import { attacherBulleEnnemi } from './bulle';
import { el } from './dom';

/** Un type d'ennemi et le nombre qui sortira par une entrée. */
export interface GroupeEntree {
  readonly type: string;
  readonly nombre: number;
}

/** Durée de la traînée lumineuse le long d'un chemin (ms de temps de jeu). */
export const DUREE_TRAINEE_MS = 2000;
/** Durée de la réaction de la porte à une fuite (ms de temps de jeu). */
export const DUREE_SECOUSSE_MS = 500;
/** Au plus ce nombre de types d'ennemis par panneau ; les autres sont résumés par « +n ». */
export const TYPES_MAX_PAR_PANNEAU = 4;
/** Longueur de la queue de la traînée, en tuiles. */
const QUEUE_TUILES = 5;
const TRANCHES_TRAINEE = 14;
const MARGE_BORD = 6;

/** Ce que voit le rendu : la conversion tuiles vers pixels CSS du canvas (satisfait par `Rendu`). */
export interface ProjectionIndications {
  readonly pixelsCssParTuile: number;
  enCssX(tuilesX: number): number;
  enCssY(tuilesY: number): number;
}

/** Le réglage « réduire les animations » du système (le jeu n'a pas de réglage à lui). */
export function animationsReduitesDuSysteme(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
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

/** La prochaine vague à lancer, ou null s'il n'en reste plus. En mode infini, c'est celle que le générateur va produire. */
export function prochaineVague(etat: EtatPartie): Vague | null {
  const index = etat.vagues.lancees;
  if (etat.config.infini) return genererVagueInfinie(etat.config, etat.chemins.length, index + 1);
  return etat.niveau.vagues[index] ?? null;
}

/** Vrai quand les panneaux d'entrée sont à montrer : la vague en cours a fini d'apparaître, la suivante n'est pas partie. */
export function panneauxVisibles(etat: EtatPartie): boolean {
  return etat.statut === 'en_cours' && etat.vagues.paquets.length === 0;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Entree {
  readonly noeud: HTMLElement;
  readonly point: Point;
  /** Indices des chemins qui partent de ce point. */
  readonly chemins: readonly number[];
  signature: string;
  controleur: AbortController | null;
  largeur: number;
  hauteur: number;
}

interface Sortie {
  readonly noeud: HTMLElement;
  readonly image: HTMLImageElement;
  readonly point: Point;
  readonly chemins: readonly number[];
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
  private readonly reduit: () => boolean;
  private compositionIndex = -2;
  private composition: GroupeEntree[][] = [];
  private tailleCanvas = '';

  constructor(
    parent: HTMLElement,
    private readonly atlas: AtlasRendu,
    private readonly projection: ProjectionIndications,
    etat: EtatPartie,
    private readonly signal: AbortSignal,
    temps: number,
    options: OptionsIndications = {},
  ) {
    this.reduit = options.reduit ?? animationsReduitesDuSysteme;
    this.racine = el('div', 'indications');
    this.canvas = el('canvas', 'trace');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.racine.append(this.canvas);

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
      // Le conteneur laisse passer les clics (la construction reste possible dessous) ; seules les pastilles les captent.
      const noeud = el('div', 'entree-chemin');
      noeud.style.pointerEvents = 'none';
      noeud.hidden = true;
      this.racine.append(noeud);
      this.entrees.push({ noeud, point, chemins, signature: '', controleur: null, largeur: 0, hauteur: 0 });
    }
    parent.append(this.racine);

    // Une partie reprise ne rejoue pas l'annonce des chemins déjà servis ; une nouvelle partie annonce ceux de la 1re vague.
    if (etat.vagues.lancees > 0) etat.chemins.forEach((_, i) => this.servis.add(i));
    else {
      const premiere = prochaineVague(etat);
      if (premiere) premiere.paquets.forEach((p) => this.servis.add(p.chemin));
    }
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

  /** À appeler pour chaque événement du pas : une vague qui part annonce ses chemins neufs, une fuite fait réagir la porte. */
  evenement(etat: EtatPartie, evenement: Evenement, temps: number): void {
    if (evenement.type === 'vague') {
      const neufs = new Set<number>();
      for (const paquet of etat.vagues.paquets) {
        if (paquet.vague === evenement.index && !this.servis.has(paquet.chemin)) neufs.add(paquet.chemin);
      }
      for (const chemin of neufs) this.servis.add(chemin);
      this.lancerTrainees([...neufs], temps);
    } else if (evenement.type === 'fuite') {
      // L'ennemi est encore dans la liste au pas de sa fuite ; sinon, toutes les portes réagissent.
      const ennemi: Ennemi | undefined = etat.ennemis.find((e) => e.id === evenement.ennemi);
      for (const sortie of this.sorties) {
        if (!ennemi || sortie.chemins.includes(ennemi.chemin)) sortie.secoueJusque = temps + DUREE_SECOUSSE_MS;
      }
    }
  }

  private viewport(): { largeur: number; hauteur: number } {
    return {
      largeur: this.racine.parentElement?.clientWidth || window.innerWidth,
      hauteur: this.racine.parentElement?.clientHeight || window.innerHeight,
    };
  }

  mettreAJour(etat: EtatPartie, temps: number): void {
    const reduit = this.reduit();
    this.racine.classList.toggle('animations-reduites', reduit);
    const { largeur, hauteur } = this.viewport();
    this.mettreAJourEntrees(etat, largeur, hauteur);
    this.mettreAJourSorties(temps, reduit, largeur, hauteur);
    this.dessinerTrainees(etat, temps, reduit, largeur, hauteur);
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

  private mettreAJourEntrees(etat: EtatPartie, largeur: number, hauteur: number): void {
    const visible = panneauxVisibles(etat);
    const composition = visible ? this.compositionCourante(etat) : [];
    for (const entree of this.entrees) {
      const groupes = visible ? this.groupesDe(entree, composition) : [];
      entree.noeud.hidden = groupes.length === 0;
      if (groupes.length === 0) continue;
      const signature = groupes.map((g) => `${g.type}:${String(g.nombre)}`).join('|');
      if (signature !== entree.signature) this.reconstruire(entree, groupes, signature);
      const x = this.projection.enCssX(entree.point.x);
      const y = this.projection.enCssY(entree.point.y);
      // Posé juste au-dessus du point d'entrée, ramené dans l'écran.
      const demi = entree.largeur / 2;
      const gauche = Math.min(Math.max(x, demi + MARGE_BORD), Math.max(demi + MARGE_BORD, largeur - demi - MARGE_BORD));
      const haut = Math.min(Math.max(y, entree.hauteur + MARGE_BORD), Math.max(entree.hauteur + MARGE_BORD, hauteur - MARGE_BORD));
      entree.noeud.style.left = `${String(Math.round(gauche))}px`;
      entree.noeud.style.top = `${String(Math.round(haut))}px`;
    }
  }

  private reconstruire(entree: Entree, groupes: readonly GroupeEntree[], signature: string): void {
    entree.signature = signature;
    entree.controleur?.abort();
    const controleur = new AbortController();
    entree.controleur = controleur;
    this.signal.addEventListener('abort', () => { controleur.abort(); }, { once: true });
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
      puce.style.pointerEvents = 'auto';
      const nom = Object.hasOwn(ENNEMIS, groupe.type) ? tCle(ENNEMIS[groupe.type as keyof typeof ENNEMIS].nom) : groupe.type;
      puce.setAttribute('aria-label', t('indications.entree_ennemi', { nom, nombre: groupe.nombre }));
      const icone = el('img', 'icone-ennemi');
      icone.alt = '';
      icone.src = this.atlas.iconeUrl(spriteEnnemi(groupe.type), 2);
      puce.append(icone, el('span', 'nombre-ennemi', `×${String(groupe.nombre)}`));
      if (Object.hasOwn(ENNEMIS, groupe.type)) attacherBulleEnnemi(puce, groupe.type, { signal: controleur.signal, focus: false });
      puces.append(puce);
    }
    if (groupes.length > montres.length) {
      const autres = el('span', 'puce-ennemi autres', `+${String(groupes.length - montres.length)}`);
      autres.setAttribute('aria-label', t('indications.autres', { n: groupes.length - montres.length }));
      puces.append(autres);
    }
    noeud.append(puces);
    // Mesuré une fois par contenu : sert à ramener le panneau dans l'écran sans lire le DOM à chaque image.
    noeud.hidden = false;
    entree.largeur = noeud.offsetWidth || 24 + 36 * montres.length;
    entree.hauteur = noeud.offsetHeight || 34;
  }

  private mettreAJourSorties(temps: number, reduit: boolean, largeur: number, hauteur: number): void {
    const cote = Math.round(Math.min(56, Math.max(28, this.projection.pixelsCssParTuile * 2.4)));
    for (const sortie of this.sorties) {
      const secoue = temps < sortie.secoueJusque;
      const etat = `${secoue ? 'r' : '-'}${reduit ? 'm' : '-'}${String(cote)}`;
      if (etat !== sortie.etat) {
        sortie.etat = etat;
        sortie.noeud.classList.toggle('rougit', secoue);
        sortie.noeud.classList.toggle('secoue', secoue && !reduit);
        sortie.image.style.width = `${String(cote)}px`;
        sortie.image.style.height = `${String(cote)}px`;
      }
      const demi = cote / 2;
      const x = Math.min(Math.max(this.projection.enCssX(sortie.point.x), demi + MARGE_BORD), Math.max(demi + MARGE_BORD, largeur - demi - MARGE_BORD));
      const y = Math.min(Math.max(this.projection.enCssY(sortie.point.y), demi + MARGE_BORD), Math.max(demi + MARGE_BORD, hauteur - demi - MARGE_BORD));
      sortie.noeud.style.left = `${String(Math.round(x))}px`;
      sortie.noeud.style.top = `${String(Math.round(y))}px`;
    }
  }

  private dessinerTrainees(etat: EtatPartie, temps: number, reduit: boolean, largeur: number, hauteur: number): void {
    const ctx = this.ctx;
    if (reduit) this.trainees.length = 0;
    for (let i = this.trainees.length - 1; i >= 0; i--) {
      const tr = this.trainees[i];
      if (tr && temps - tr.debut >= DUREE_TRAINEE_MS) this.trainees.splice(i, 1);
    }
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const taille = `${String(largeur)}x${String(hauteur)}@${String(dpr)}`;
    if (taille !== this.tailleCanvas) {
      this.tailleCanvas = taille;
      this.canvas.width = Math.round(largeur * dpr);
      this.canvas.height = Math.round(hauteur * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, largeur, hauteur);
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
    for (const entree of this.entrees) entree.controleur?.abort();
    this.racine.remove();
  }
}
