// Carte qui bouge : des chemins prévus dans la carte s'ouvrent ou se ferment pendant la partie (barricade qui tombe, cortège qui avance).
//
// - Un chemin fermé n'accueille plus de nouveaux groupes : ceux qui devaient l'emprunter prennent son chemin de repli (`cheminEffectif`).
//   Les ennemis qui y marchent déjà vont au bout.
// - Les cases d'un chemin mobile (fermé au départ, ou visé par un événement) sont TOUJOURS interdites à la construction, qu'il soit ouvert
//   ou fermé (contrat des données : elles ne figurent pas dans `Niveau.casesInterdites`, le moteur les ajoute). Aucune tour ne peut donc se
//   trouver sur un chemin qui s'ouvre : pas de vente d'office. Les cases des foules sont, elles aussi, toujours interdites.
// - Un niveau qui referme tous ses chemins, ou dont les replis bouclent, est refusé à la création de la partie (`verifierReplis`) ; à
//   l'exécution, un groupe ne prend jamais un chemin fermé tant qu'un autre est ouvert (`cheminEffectif`).
//
// Briques réutilisables : le Pont-Levis (herse qui bascule toutes les 2 vagues) s'écrit en paires `fermer_chemin` / `ouvrir_chemin` datées ;
// la Crue pourra reprendre `casesDuChemin` pour ses cases noyées.
import { EVENEMENTS_NIVEAU } from '../../data/evenements-niveau';
import { tuilesDeChemin } from '../../data/niveaux/grille-niveau';
import { REGLES } from '../../data/regles';
import type { Carte, CaseGrille, CheminCarte, EvenementFermerChemin, EvenementOuvrirChemin, Niveau } from '../definitions';
import type { EtatPartie } from '../etat';
import { colonnes, estCaseInterdite, lignes, tourSurCase, toutesLesCases } from '../grille';

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

/**
 * Vérifie la cohérence des replis en rejouant les événements de changement de chemin dans l'ordre (vague, délai, rang) : à chaque étape, tout
 * chemin doit mener à un chemin ouvert en suivant ses replis. Refuse un cycle (0 se replie sur 1 qui se replie sur 0) et un niveau dont
 * tous les chemins seraient fermés. L'ordre exact des événements de même moment ne change pas le diagnostic des niveaux bien écrits.
 */
export function verifierReplis(niveau: Niveau): void {
  const n = niveau.carte.chemins.length;
  const actifs = niveau.carte.chemins.map(() => true);
  const replis = niveau.carte.chemins.map(() => -1);
  const controler = (quand: string): void => {
    for (let c = 0; c < n; c++) {
      if (resoudreStrict(actifs, replis, c) < 0) throw new Error(`Chemins mobiles ${quand} : le chemin ${String(c)} ne mène à aucun chemin ouvert (replis qui bouclent, ou tous les chemins fermés)`);
    }
  };
  for (const f of niveau.cheminsFermes ?? []) {
    actifs[f.chemin] = false;
    replis[f.chemin] = f.repli;
  }
  controler('au départ');
  const mobiles = (niveau.evenements ?? [])
    .map((e, i) => ({ e, i }))
    .filter((x) => x.e.type === 'ouvrir_chemin' || x.e.type === 'fermer_chemin')
    .sort((a, b) => a.e.vague - b.e.vague || (a.e.delai ?? EVENEMENTS_NIVEAU.annonce) - (b.e.delai ?? EVENEMENTS_NIVEAU.annonce) || a.i - b.i);
  for (const { e, i } of mobiles) {
    if (e.type === 'ouvrir_chemin') actifs[e.chemin] = true;
    else if (e.type === 'fermer_chemin') {
      actifs[e.chemin] = false;
      replis[e.chemin] = e.repli;
    }
    controler(`après l'événement ${String(i)}`);
  }
}

/** Le chemin ouvert au bout des replis de `chemin`, ou -1 s'il n'y en a pas (cycle, ou repli absent). */
function resoudreStrict(actifs: readonly boolean[], replis: readonly number[], chemin: number): number {
  let c = chemin;
  for (let i = 0; i <= actifs.length; i++) {
    if (actifs[c] !== false) return c;
    const suivant = replis[c] ?? -1;
    if (suivant < 0) return -1;
    c = suivant;
  }
  return -1;
}

/**
 * Le chemin que prend un groupe prévu sur `chemin` selon les chemins ouverts et les replis donnés : le premier chemin ouvert en suivant
 * les replis. Garde-fou : si les replis ne mènent nulle part (cycle), le premier chemin ouvert ; s'il n'y en a aucun, `chemin` lui-même.
 */
export function cheminOuvertPour(actifs: readonly boolean[], replis: readonly number[], chemin: number): number {
  const direct = resoudreStrict(actifs, replis, chemin);
  if (direct >= 0) return direct;
  const premier = actifs.findIndex((a) => a);
  return premier >= 0 ? premier : chemin;
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
 * Case interdite à la construction : interdite par le niveau, occupée par une foule, ou sous un chemin mobile (ouvert ou fermé). Sans
 * chemin mobile ni foule, c'est exactement `estCaseInterdite`. La règle ne change pas en cours de partie.
 */
export function caseInterditeEnPartie(etat: Pick<EtatPartie, 'niveau'>, cx: number, cy: number): boolean {
  const niveau = etat.niveau;
  if (estCaseInterdite(niveau, cx, cy)) return true;
  for (const foule of niveau.foules ?? []) for (const c of foule.cases) if (c.cx === cx && c.cy === cy) return true;
  const cle = cy * colonnes(niveau.carte) + cx;
  for (const k of cheminsMobiles(niveau)) if (casesDuChemin(niveau.carte, k).has(cle)) return true;
  return false;
}

/**
 * Les cases où l'on peut construire : celles de `casesLibres` (grille.ts) moins les cases des foules et des chemins mobiles. Les bots
 * ne visent que celles-ci ; sans chemin mobile ni foule, c'est exactement `casesLibres`.
 */
export function casesLibresEnPartie(etat: Pick<EtatPartie, 'niveau' | 'tours'>): CaseGrille[] {
  return toutesLesCases(etat.niveau.carte).filter((c) => !caseInterditeEnPartie(etat, c.cx, c.cy) && !tourSurCase(etat, c.cx, c.cy));
}

/** Le chemin que prend vraiment un groupe prévu sur `chemin` : le premier chemin ouvert en suivant les replis (voir `cheminOuvertPour`). */
export function cheminEffectif(etat: Pick<EtatPartie, 'dynamique'>, chemin: number): number {
  return cheminOuvertPour(etat.dynamique.cheminsActifs, etat.dynamique.replis, chemin);
}

export function ouvrirChemin(etat: EtatPartie, e: EvenementOuvrirChemin): void {
  etat.dynamique.cheminsActifs[e.chemin] = true;
  etat.evenements.push({ type: 'chemin_ouvert', chemin: e.chemin });
}

export function fermerChemin(etat: EtatPartie, e: EvenementFermerChemin): void {
  etat.dynamique.cheminsActifs[e.chemin] = false;
  etat.dynamique.replis[e.chemin] = e.repli;
  etat.evenements.push({ type: 'chemin_ferme', chemin: e.chemin, repli: e.repli });
}
