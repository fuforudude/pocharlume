// Mise en scène vivante des cartes du DLC « Temps modernes » (spec, « Dynamique ») : des étudiants en décor qui scandent, des banderoles
// qui ondulent entre deux montants, des fumigènes d'ambiance, et des figurants sur les foules activables. Tout est dessiné en petits
// aplats de pixels (rien de l'atlas : ni les tours, ni les ennemis, ni les héros ne changent), dans le style des effets du jeu.
// Les banderoles portent des glyphes (des blocs), jamais un texte lisible.
//
// La foule réagit aux événements du moteur, qu'elle lit sans jamais rien changer : une annonce, une charge, un canon à eau, une nasse ou
// un chemin qui bouge la font s'agiter (elle scande plus vite, bras levés) ; des renforts ou une foule activée la font sauter de joie.
// Avec les animations réduites, tout reste immobile.
import { foulePrete, type EtatPartie } from '../engine';
import type { SceneVivante } from '../data/visuel';
import { TUILE } from './camera';

/** Côté d'une case de la grille, en pixels du monde. */
const CASE = 2 * TUILE;
/** Pelages des étudiants (chats) et couleurs de leurs sweats. */
const PELAGES = ['#e09a4a', '#6f6a74', '#f2e6d0', '#3b3430', '#c8c0b4'];
const SWEATS = ['#e0508c', '#40c8d8', '#7ad040', '#34467a', '#f07a20', '#7a4ab0', '#d8f040'];
/** Toiles des banderoles (fond, glyphes). */
const TOILES: readonly (readonly [string, string])[] = [
  ['#f2ede0', '#c83018'],
  ['#7a4ab0', '#f2ede0'],
  ['#2f8a4a', '#f2ede0'],
  ['#e8c840', '#2b2928'],
];
/** Couleurs des fumées (rose, verte, violette, rouge). */
const FUMEES = ['244, 168, 200', '154, 216, 154', '180, 140, 230', '230, 96, 80'];
const CONTOUR = '#2b2928';
const MONTANT = '#8a8478';

/** Durée d'une agitation et d'une joie après l'événement qui les déclenche (ms). */
const DUREE_AGITATION = 3500;
const DUREE_JOIE = 2500;
/** Cycle d'une bouffée de fumée (ms) et bouffées par fumigène. */
const VIE_FUMEE = 3200;
const BOUFFEES = 7;

function hasard(a: number, b: number): number {
  let h = Math.imul(a + 7, 374761393) + Math.imul(b + 3, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function couleur<T>(liste: readonly T[], i: number): T {
  return liste[((i % liste.length) + liste.length) % liste.length] as T;
}

/** Humeur de la foule : `calme`, `agitee` (elle scande plus fort) ou `joie` (elle saute). */
export type Humeur = 'calme' | 'agitee' | 'joie';

/** L'humeur que des événements du moteur donnent à la foule, ou null s'ils ne la touchent pas (la joie l'emporte). Pur : testé. */
export function humeurDesEvenements(evenements: EtatPartie['evenements']): Humeur | null {
  let humeur: Humeur | null = null;
  for (const ev of evenements) {
    if (ev.type === 'foule_activee' || (ev.type === 'evenement_niveau' && ev.typeEvenement === 'renforts')) return 'joie';
    if (ev.type === 'annonce_evenement' || ev.type === 'evenement_niveau' || ev.type === 'chemin_ouvert' || ev.type === 'chemin_ferme' || ev.type === 'balayage') humeur = 'agitee';
  }
  return humeur;
}

export class DessinSceneVivante {
  private agitationFin = -Infinity;
  private joieFin = -Infinity;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly scene: SceneVivante | undefined,
  ) {}

  /** Vrai s'il y a quelque chose à dessiner (une carte du DLC). */
  get active(): boolean {
    return this.scene !== undefined;
  }

  /** À appeler après chaque pas : la foule réagit aux événements du pas. */
  apresPas(etat: EtatPartie, temps: number): void {
    if (!this.scene) return;
    const humeur = humeurDesEvenements(etat.evenements);
    if (humeur === 'joie') this.joieFin = temps + DUREE_JOIE;
    else if (humeur === 'agitee') this.agitationFin = temps + DUREE_AGITATION;
  }

  /** Humeur du moment. */
  humeur(temps: number): Humeur {
    if (temps < this.joieFin) return 'joie';
    return temps < this.agitationFin ? 'agitee' : 'calme';
  }

  /** Sous les entités : banderoles, groupes d'étudiants en décor, figurants des foules activables. */
  dessinerSol(etat: EtatPartie, temps: number, reduit: boolean, ox: number, oy: number): void {
    const scene = this.scene;
    if (!scene) return;
    const t = reduit ? 0 : temps;
    const humeur = reduit ? 'calme' : this.humeur(temps);
    scene.banderoles.forEach((b, i) => {
      this.dessinerBanderole(b.cx * CASE - ox, b.cy * CASE - oy, b.largeur, b.couleur, t, i, humeur);
    });
    scene.groupes.forEach((g, i) => {
      this.dessinerGroupe(g.cx * CASE - ox, g.cy * CASE - oy, 4, t, i * 13 + 5, humeur);
    });
    // Les foules activables : des figurants sur leurs cases, qui scandent quand elles sont prêtes et attendent assis sinon.
    (etat.niveau.foules ?? []).forEach((foule, i) => {
      const suivi = etat.dynamique.foules[i];
      const prete = suivi ? foulePrete(suivi) : false;
      foule.cases.forEach((c, k) => {
        this.dessinerGroupe(c.cx * CASE - ox, c.cy * CASE - oy, 3, prete ? t : 0, 100 + i * 7 + k, prete ? humeur : 'calme', !prete);
      });
    });
  }

  /** Par-dessus les entités : les fumées des fumigènes. */
  dessinerDessus(temps: number, reduit: boolean, ox: number, oy: number): void {
    const scene = this.scene;
    if (!scene) return;
    const ctx = this.ctx;
    scene.fumigenes.forEach((f, i) => {
      const px = Math.round(f.x * TUILE) - ox;
      const py = Math.round(f.y * TUILE) - oy;
      // Le fumigène lui-même : un bâton rouge qui rougeoie.
      ctx.fillStyle = CONTOUR;
      ctx.fillRect(px - 2, py - 3, 5, 4);
      ctx.fillStyle = '#c83018';
      ctx.fillRect(px - 1, py - 2, 3, 2);
      ctx.fillStyle = (reduit ? 0 : Math.floor(temps / 120) % 2) === 0 ? '#f7f757' : '#f09128';
      ctx.fillRect(px, py - 3, 1, 1);
      const rgb = couleur(FUMEES, f.couleur);
      for (let k = 0; k < BOUFFEES; k++) {
        const phase = ((reduit ? 0 : temps) + (k * VIE_FUMEE) / BOUFFEES + i * 777) % VIE_FUMEE;
        const vie = phase / VIE_FUMEE;
        const taille = Math.round(3 + vie * 7);
        const montee = vie * 26;
        const derive = Math.sin(vie * 5 + k + i) * 4 + vie * 6;
        const alpha = 0.55 * (1 - vie);
        ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
        const x = Math.round(px + derive - taille / 2);
        const y = Math.round(py - 4 - montee - taille / 2);
        // Une bouffée « pixel » : un carré écorné.
        ctx.fillRect(x + 1, y, taille - 2, taille);
        ctx.fillRect(x, y + 1, taille, taille - 2);
      }
    });
  }

  /** Un groupe d'étudiants sur une case (coin haut gauche en pixels d'écran du tampon). */
  private dessinerGroupe(x0: number, y0: number, nombre: number, t: number, graine: number, humeur: Humeur, assis = false): void {
    const places: readonly [number, number][] = nombre >= 4 ? [[7, 14], [19, 12], [12, 26], [25, 25]] : [[9, 18], [22, 16], [15, 29]];
    places.slice(0, nombre).forEach(([dx, dy], i) => {
      this.dessinerEtudiant(x0 + dx, y0 + dy, t, graine * 5 + i, humeur, assis, i === 1 && !assis);
    });
  }

  /**
   * Un étudiant, pied en (x, y) : tête de chat (oreilles), sweat coloré, bras levés au temps fort quand il scande. `pancarte` : il porte
   * une petite pancarte à glyphes au-dessus de sa tête.
   */
  private dessinerEtudiant(x: number, y: number, t: number, graine: number, humeur: Humeur, assis: boolean, pancarte: boolean): void {
    const ctx = this.ctx;
    const periode = humeur === 'calme' ? 620 : humeur === 'agitee' ? 300 : 360;
    const phase = hasard(graine, 1) * periode;
    const temps = (t + phase) % periode;
    const fort = t !== 0 && temps < periode / 2;
    const saut = humeur === 'joie' && fort ? -3 : fort ? -1 : 0;
    const pelage = couleur(PELAGES, Math.floor(hasard(graine, 2) * PELAGES.length));
    const sweat = couleur(SWEATS, Math.floor(hasard(graine, 3) * SWEATS.length));
    const h = assis ? 7 : 10;
    const yb = y + saut;
    // Ombre au sol.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x - 3, y - 1, 7, 2);
    // Jambes, corps, tête (contour sombre d'un pixel).
    ctx.fillStyle = CONTOUR;
    ctx.fillRect(x - 3, yb - h - 5, 7, h + 3);
    if (!assis) {
      ctx.fillRect(x - 2, yb - 3, 2, 3);
      ctx.fillRect(x + 1, yb - 3, 2, 3);
    }
    ctx.fillStyle = sweat;
    ctx.fillRect(x - 2, yb - h + 1, 5, h - 4);
    ctx.fillStyle = CONTOUR;
    ctx.fillRect(x - 3, yb - h - 4, 7, 5);
    ctx.fillStyle = pelage;
    ctx.fillRect(x - 2, yb - h - 3, 5, 3);
    // Oreilles.
    ctx.fillStyle = CONTOUR;
    ctx.fillRect(x - 3, yb - h - 6, 2, 2);
    ctx.fillRect(x + 2, yb - h - 6, 2, 2);
    ctx.fillStyle = pelage;
    ctx.fillRect(x - 2, yb - h - 5, 1, 1);
    ctx.fillRect(x + 2, yb - h - 5, 1, 1);
    // Bras : levés au temps fort (on scande), le long du corps sinon.
    ctx.fillStyle = pelage;
    if (fort && !assis) {
      ctx.fillRect(x - 4, yb - h - 3, 1, 3);
      ctx.fillRect(x + 4, yb - h - 3, 1, 3);
    } else {
      ctx.fillRect(x - 4, yb - h + 1, 1, 3);
      ctx.fillRect(x + 4, yb - h + 1, 1, 3);
    }
    if (pancarte) {
      const py = yb - h - 15 + (fort ? -1 : 0);
      ctx.fillStyle = CONTOUR;
      ctx.fillRect(x, py + 6, 1, 6);
      ctx.fillRect(x - 6, py - 1, 13, 8);
      ctx.fillStyle = '#f2ede0';
      ctx.fillRect(x - 5, py, 11, 6);
      ctx.fillStyle = sweat;
      ctx.fillRect(x - 4, py + 1, 3, 1);
      ctx.fillRect(x, py + 1, 4, 1);
      ctx.fillRect(x - 4, py + 3, 6, 1);
    }
  }

  /** Une banderole sur `largeur` cases : deux montants, une toile qui ondule, des glyphes en blocs, deux porteurs. */
  private dessinerBanderole(x0: number, y0: number, largeur: number, indice: number, t: number, graine: number, humeur: Humeur): void {
    const ctx = this.ctx;
    const [fond, glyphe] = couleur(TOILES, indice);
    const gauche = x0 + 6;
    const droite = x0 + largeur * CASE - 7;
    const haut = y0 + 4;
    const amplitude = humeur === 'calme' ? 1 : 2;
    // Montants.
    ctx.fillStyle = CONTOUR;
    ctx.fillRect(gauche - 1, haut - 1, 3, 26);
    ctx.fillRect(droite - 1, haut - 1, 3, 26);
    ctx.fillStyle = MONTANT;
    ctx.fillRect(gauche, haut, 1, 24);
    ctx.fillRect(droite, haut, 1, 24);
    // Toile, colonne par colonne : elle ondule avec le vent.
    for (let x = gauche + 1; x < droite; x++) {
      const k = x - gauche;
      const dy = t === 0 ? 0 : Math.round(Math.sin(t / 380 + k / 7) * amplitude);
      ctx.fillStyle = CONTOUR;
      ctx.fillRect(x, haut + 1 + dy, 1, 13);
      ctx.fillStyle = fond;
      ctx.fillRect(x, haut + 2 + dy, 1, 11);
      // Glyphes : des blocs de 3 colonnes sur 2 ou 3 lignes, séparés d'une colonne vide ; pas de lettres.
      const bloc = Math.floor((k - 3) / 4);
      if (k >= 3 && (k - 3) % 4 !== 3 && x < droite - 3) {
        const forme = hasard(graine * 31 + bloc, 9);
        ctx.fillStyle = glyphe;
        if (forme < 0.5) ctx.fillRect(x, haut + 4 + dy, 1, 2);
        if (forme > 0.25) ctx.fillRect(x, haut + 8 + dy, 1, 2);
        if ((k - 3) % 4 === 1 && forme > 0.6) ctx.fillRect(x, haut + 5 + dy, 1, 4);
      }
    }
    // Deux porteurs au pied des montants.
    this.dessinerEtudiant(gauche + 1, y0 + CASE - 2, t, graine * 3 + 1, humeur, false, false);
    this.dessinerEtudiant(droite, y0 + CASE - 2, t, graine * 3 + 2, humeur, false, false);
  }
}
