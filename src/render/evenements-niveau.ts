// Rendu minimal des événements datés et des foules (DLC Temps modernes). Il lit l'état du moteur et ne le modifie jamais. La mise en
// scène riche (foule animée, slogans, banderoles) viendra plus tard ; ici, du simple et lisible :
// - foules : leurs cases teintées (jaune quand elle est prête, gris en recharge ou épuisée), un repère (pièce : elle se paie ; point
//   bleu : il faut y poster le héros) et une barre (recharge qui remonte, ou présence du héros qui monte) ;
// - chemin mobile fermé : des pavés sombres en pointillé le long de son axe ;
// - coupure (nasse, foule qui bloque) : des rayures rouges et blanches le long de la portion coupée ;
// - canon à eau : une bande bleue qui traverse la ligne balayée et s'efface.
import { REGLES } from '../data/regles';
import { cheminsMobiles, enPas, foulePrete, pointSurChemin, type EtatPartie } from '../engine';
import type { Foule } from '../engine/definitions';
import { TUILE } from './camera';

const PRETE = 'rgba(244, 196, 64, 0.30)';
const PRETE_BORD = 'rgba(244, 196, 64, 0.85)';
const REPOS = 'rgba(130, 130, 140, 0.22)';
const REPOS_BORD = 'rgba(150, 150, 160, 0.6)';
const PIECE = '#f4c440';
const HEROS = '#6ab0ff';
const BARRE_FOND = 'rgba(0, 0, 0, 0.55)';
const BARRE = '#f4c440';
const FERME = 'rgba(16, 14, 20, 0.5)';
const RAYURE_A = 'rgba(214, 48, 48, 0.9)';
const RAYURE_B = 'rgba(240, 240, 240, 0.9)';
const EAU = 'rgba(96, 170, 255, ';
/** Durée (ms) de la bande du canon à eau à l'écran. */
const DUREE_BALAYAGE = 700;

export class DessinEvenementsNiveau {
  /** Balayages en cours d'affichage : ligne de la grille, sens et instant (ms de jeu) du jet. */
  private balayages: { cy: number; sens: number; debut: number }[] = [];

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** À appeler après chaque pas : retient les balayages du canon à eau pour les montrer un instant. */
  apresPas(etat: EtatPartie, temps: number): void {
    for (const ev of etat.evenements) if (ev.type === 'balayage') this.balayages.push({ cy: ev.cy, sens: ev.sens, debut: temps });
    this.balayages = this.balayages.filter((b) => temps - b.debut < DUREE_BALAYAGE);
  }

  /** Sur le sol, sous les entités : chemins fermés, coupures et zones des foules. */
  dessinerSol(etat: EtatPartie, ox: number, oy: number): void {
    this.dessinerCheminsFermes(etat, ox, oy);
    this.dessinerBarrages(etat, ox, oy);
    const foules = etat.niveau.foules ?? [];
    foules.forEach((foule, i) => {
      this.dessinerFoule(etat, foule, i, ox, oy);
    });
  }

  /** Par-dessus les entités : la bande d'eau du canon. */
  dessinerDessus(etat: EtatPartie, temps: number, ox: number, oy: number): void {
    if (this.balayages.length === 0) return;
    const ctx = this.ctx;
    const largeur = etat.niveau.carte.largeur * TUILE;
    const cote = REGLES.tailleCase * TUILE;
    for (const b of this.balayages) {
      const t = Math.min(1, Math.max(0, (temps - b.debut) / DUREE_BALAYAGE));
      // Le jet traverse la carte dans la première moitié, puis la bande s'efface.
      const front = Math.min(1, t * 2) * largeur;
      const x0 = b.sens >= 0 ? 0 : largeur - front;
      ctx.fillStyle = `${EAU}${String(0.5 * (1 - t))})`;
      ctx.fillRect(Math.round(x0) - ox, b.cy * cote - oy + 2, Math.round(front), cote - 4);
    }
  }

  private dessinerCheminsFermes(etat: EtatPartie, ox: number, oy: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = FERME;
    for (const k of cheminsMobiles(etat.niveau)) {
      if (etat.dynamique.cheminsActifs[k] !== false) continue;
      const c = etat.chemins[k];
      if (!c) continue;
      for (let d = 0.5; d < c.longueur; d += 1) {
        const p = pointSurChemin(c, d);
        ctx.fillRect(Math.round(p.x * TUILE) - ox - 3, Math.round(p.y * TUILE) - oy - 3, 6, 6);
      }
    }
  }

  private dessinerBarrages(etat: EtatPartie, ox: number, oy: number): void {
    const ctx = this.ctx;
    for (const b of etat.dynamique.barrages) {
      const c = etat.chemins[b.chemin];
      if (!c) continue;
      let n = 0;
      for (let d = b.debut; d <= Math.min(b.fin, c.longueur); d += 0.5) {
        const p = pointSurChemin(c, d);
        ctx.fillStyle = n++ % 2 === 0 ? RAYURE_A : RAYURE_B;
        ctx.fillRect(Math.round(p.x * TUILE) - ox - 4, Math.round(p.y * TUILE) - oy - 4, 8, 8);
      }
    }
  }

  private dessinerFoule(etat: EtatPartie, foule: Foule, index: number, ox: number, oy: number): void {
    const suivi = etat.dynamique.foules[index];
    if (!suivi) return;
    const ctx = this.ctx;
    const cote = REGLES.tailleCase * TUILE;
    const prete = foulePrete(suivi);
    let gauche = Infinity;
    let haut = Infinity;
    let droite = -Infinity;
    let bas = -Infinity;
    for (const c of foule.cases) {
      const x = c.cx * cote - ox;
      const y = c.cy * cote - oy;
      ctx.fillStyle = prete ? PRETE : REPOS;
      ctx.fillRect(x, y, cote, cote);
      ctx.fillStyle = prete ? PRETE_BORD : REPOS_BORD;
      ctx.fillRect(x, y, cote, 1);
      ctx.fillRect(x, y + cote - 1, cote, 1);
      ctx.fillRect(x, y, 1, cote);
      ctx.fillRect(x + cote - 1, y, 1, cote);
      gauche = Math.min(gauche, x);
      haut = Math.min(haut, y);
      droite = Math.max(droite, x + cote);
      bas = Math.max(bas, y + cote);
    }
    if (gauche === Infinity) return;
    // Repère de la condition, au coin haut gauche.
    ctx.fillStyle = foule.condition.type === 'payer' ? PIECE : HEROS;
    ctx.fillRect(gauche + 3, haut + 3, 4, 4);
    // Barre : la recharge qui remonte, ou la présence du héros qui monte.
    let part = -1;
    if (!prete && suivi.utilisations !== 0 && foule.recharge !== undefined && foule.recharge > 0) part = 1 - suivi.recharge / Math.max(1, enPas(foule.recharge));
    else if (prete && foule.condition.type === 'heros' && suivi.presence > 0) part = suivi.presence / Math.max(1, enPas(foule.condition.duree));
    if (part < 0) return;
    const largeur = droite - gauche - 6;
    ctx.fillStyle = BARRE_FOND;
    ctx.fillRect(gauche + 3, bas - 6, largeur, 3);
    ctx.fillStyle = BARRE;
    ctx.fillRect(gauche + 3, bas - 6, Math.round(largeur * Math.min(1, part)), 3);
  }
}
