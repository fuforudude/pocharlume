// Carte qui bouge : des chemins prévus dans la carte s'ouvrent ou se ferment pendant la partie (barricade qui tombe, cortège qui avance).
//
// - Un chemin fermé n'accueille plus de nouveaux groupes : ceux qui devaient l'emprunter prennent son chemin de repli (`cheminEffectif`).
//   Les ennemis qui y marchent déjà vont au bout.
// - Ses cases suivent : celles d'un chemin mobile actif sont interdites à la construction, celles d'un chemin mobile fermé se bâtissent
//   (contrat des données : elles ne figurent pas dans `Niveau.casesInterdites`). Les cases des foules sont toujours interdites.
// - Une tour posée sur une case qui devient chemin est vendue d'office au prix total dépensé (événement `vente_office`).
//
// Briques réutilisables : le Pont-Levis (herse qui bascule toutes les 2 vagues) s'écrit en paires `fermer_chemin` / `ouvrir_chemin` datées ;
// la Crue pourra reprendre `casesDuChemin` et la vente d'office pour ses cases noyées.
import { tuilesDeChemin } from '../../data/niveaux/grille-niveau';
import { REGLES } from '../../data/regles';
import type { Carte, CheminCarte, EvenementFermerChemin, EvenementOuvrirChemin, Niveau } from '../definitions';
import type { EtatPartie, Tour } from '../etat';
import { colonnes, estCaseInterdite, lignes } from '../grille';
import { libererBloques } from '../unites';

/** Vérifie les chemins fermés au départ : chemin et repli existants et différents, un chemin au plus une fois. */
export function verifierCheminsFermes(niveau: Niveau): void {
  const vus = new Set<number>();
  for (const f of niveau.cheminsFermes ?? []) {
    verifierRepli(niveau, 'Chemin fermé', f.chemin, f.repli);
    if (vus.has(f.chemin)) throw new Error(`Chemin fermé : le chemin ${String(f.chemin)} est donné deux fois`);
    vus.add(f.chemin);
  }
}

function cheminExiste(niveau: Niveau, chemin: number): boolean {
  return Number.isInteger(chemin) && chemin >= 0 && chemin < niveau.carte.chemins.length;
}

function verifierRepli(niveau: Niveau, quoi: string, chemin: number, repli: number): void {
  if (!cheminExiste(niveau, chemin)) throw new Error(`${quoi} : chemin inconnu ${String(chemin)}`);
  if (!cheminExiste(niveau, repli) || repli === chemin) throw new Error(`${quoi} : repli invalide ${String(repli)} pour le chemin ${String(chemin)}`);
}

export function verifierOuvrirChemin(niveau: Niveau, e: EvenementOuvrirChemin, quoi: string): void {
  if (!cheminExiste(niveau, e.chemin)) throw new Error(`${quoi} : chemin inconnu ${String(e.chemin)}`);
}

export function verifierFermerChemin(niveau: Niveau, e: EvenementFermerChemin, quoi: string): void {
  verifierRepli(niveau, quoi, e.chemin, e.repli);
}

/** Les chemins qui peuvent bouger dans ce niveau (fermés au départ, ou visés par `ouvrir_chemin` / `fermer_chemin`), mémorisés par niveau. */
const MOBILES = new WeakMap<Niveau, readonly number[]>();

export function cheminsMobiles(niveau: Niveau): readonly number[] {
  let mobiles = MOBILES.get(niveau);
  if (!mobiles) {
    const ensemble = new Set<number>((niveau.cheminsFermes ?? []).map((f) => f.chemin));
    for (const e of niveau.evenements ?? []) if (e.type === 'ouvrir_chemin' || e.type === 'fermer_chemin') ensemble.add(e.chemin);
    mobiles = [...ensemble].sort((a, b) => a - b);
    MOBILES.set(niveau, mobiles);
  }
  return mobiles;
}

/** Cases (clé `cy * colonnes + cx`) qu'un chemin occupe, selon la règle du sol dessiné (`tuilesDeChemin`), mémorisées par chemin. */
const CASES_CHEMIN = new WeakMap<CheminCarte, ReadonlySet<number>>();

export function casesDuChemin(carte: Carte, chemin: number): ReadonlySet<number> {
  const c = carte.chemins[chemin];
  if (!c) return new Set();
  let cases = CASES_CHEMIN.get(c);
  if (!cases) {
    const masque = tuilesDeChemin({ largeur: carte.largeur, hauteur: carte.hauteur, chemins: [c] });
    const t = REGLES.tailleCase;
    const n = colonnes(carte);
    const ensemble = new Set<number>();
    const m = lignes(carte);
    for (let y = 0; y < carte.hauteur; y++) {
      for (let x = 0; x < carte.largeur; x++) {
        const cx = Math.floor(x / t);
        const cy = Math.floor(y / t);
        if (masque[y * carte.largeur + x] === 1 && cx < n && cy < m) ensemble.add(cy * n + cx);
      }
    }
    cases = ensemble;
    CASES_CHEMIN.set(c, cases);
  }
  return cases;
}

/**
 * Case interdite à la construction en ce moment : interdite par le niveau, occupée par une foule, ou sous un chemin mobile ouvert. Sans
 * chemin mobile ni foule, c'est exactement `estCaseInterdite`.
 */
export function caseInterditeEnPartie(etat: Pick<EtatPartie, 'niveau' | 'dynamique'>, cx: number, cy: number): boolean {
  const niveau = etat.niveau;
  if (estCaseInterdite(niveau, cx, cy)) return true;
  for (const foule of niveau.foules ?? []) for (const c of foule.cases) if (c.cx === cx && c.cy === cy) return true;
  const cle = cy * colonnes(niveau.carte) + cx;
  for (const k of cheminsMobiles(niveau)) if (etat.dynamique.cheminsActifs[k] === true && casesDuChemin(niveau.carte, k).has(cle)) return true;
  return false;
}

/** Le chemin que prend vraiment un groupe prévu sur `chemin` : le premier chemin ouvert en suivant les replis, sinon `chemin` lui-même. */
export function cheminEffectif(etat: Pick<EtatPartie, 'dynamique'>, chemin: number): number {
  const { cheminsActifs, replis } = etat.dynamique;
  let c = chemin;
  for (let i = 0; i < cheminsActifs.length; i++) {
    if (cheminsActifs[c] !== false) return c;
    const suivant = replis[c] ?? -1;
    if (suivant < 0) break;
    c = suivant;
  }
  return chemin;
}

/** Vente d'office : la tour rend tout ce qu'elle a coûté (tour, améliorations, compétences), ses soldats et tourelles partent avec elle. */
function vendreDOffice(etat: EtatPartie, t: Tour): void {
  const aretes = t.coutCumule;
  etat.aretes += aretes;
  etat.tours = etat.tours.filter((autre) => autre !== t);
  etat.structures = etat.structures.filter((s) => s.origine !== t.id);
  const restent = [];
  for (const u of etat.unites) {
    if (u.tour === t.id && u.genre === 'soldat') libererBloques(etat, u);
    else restent.push(u);
  }
  etat.unites = restent;
  etat.evenements.push({ type: 'vente_office', tour: t.id, cx: t.cx, cy: t.cy, place: t.place, x: t.x, y: t.y, aretes });
}

export function ouvrirChemin(etat: EtatPartie, e: EvenementOuvrirChemin): void {
  etat.dynamique.cheminsActifs[e.chemin] = true;
  const cases = casesDuChemin(etat.niveau.carte, e.chemin);
  const n = colonnes(etat.niveau.carte);
  // Ordre stable : celui des tours dans l'état.
  for (const t of etat.tours.filter((tour) => tour.place < 0 && cases.has(tour.cy * n + tour.cx))) vendreDOffice(etat, t);
  etat.evenements.push({ type: 'chemin_ouvert', chemin: e.chemin });
}

export function fermerChemin(etat: EtatPartie, e: EvenementFermerChemin): void {
  etat.dynamique.cheminsActifs[e.chemin] = false;
  etat.dynamique.replis[e.chemin] = e.repli;
  etat.evenements.push({ type: 'chemin_ferme', chemin: e.chemin, repli: e.repli });
}
