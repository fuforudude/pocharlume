// Foules activables : des groupes d'étudiants posés sur la carte (cases de la grille, où l'on ne construit pas) qui aident le joueur quand
// on les active. La condition (payer, y laisser le héros) et l'effet (ralentir, renforts, bloquer) sont écrits dans le niveau, chacun en
// union discriminée ; un `switch` exhaustif par union. Ce qui change en partie (recharge, utilisations, présence du héros) est dans
// `etat.dynamique.foules`.
import { REGLES } from '../../data/regles';
import type { RaisonRefus } from '../actions';
import { calculerChemin, distanceAuxChemins, pointSurChemin, projeterSurChemin } from '../chemins';
import { appliquerEffet } from '../degats';
import type { ConditionFoule, EffetFoule, Foule, Niveau, Point } from '../definitions';
import type { EtatFoule, EtatPartie } from '../etat';
import { caseExiste, caseSousPoint, centreCase } from '../grille';
import { chercherParId, distance2 } from '../recherche';
import { enPas } from '../temps';
import { ajouterBarrage, verifierCoupure } from './barrages';
import { invoquerRenforts, verifierRenforts } from './renforts';

function inconnu(valeur: never, quoi: string): never {
  throw new Error(`${quoi} inconnu : ${String((valeur as { type: unknown }).type)}`);
}

/** Centre de la zone d'une foule : la moyenne des centres de ses cases. */
export function centreFoule(foule: Foule): Point {
  let x = 0;
  let y = 0;
  for (const c of foule.cases) {
    const centre = centreCase(c.cx, c.cy);
    x += centre.x;
    y += centre.y;
  }
  const n = Math.max(1, foule.cases.length);
  return { x: x / n, y: y / n };
}

/** Vrai si le point est sur une case de la foule. */
export function pointDansFoule(niveau: Niveau, foule: Foule, x: number, y: number): boolean {
  const c = caseSousPoint(niveau.carte, x, y);
  return c !== null && foule.cases.some((f) => f.cx === c.cx && f.cy === c.cy);
}

/** Le héros peut-il se poster sur une case ? Il faut un point de la case à `distanceMaxChemin` d'un chemin (règle de `deplacerHeros`). */
function heroPeutSePoster(niveau: Niveau, cx: number, cy: number): boolean {
  const chemins = niveau.carte.chemins.map(calculerChemin);
  const t = REGLES.tailleCase;
  for (let i = 0; i <= 4; i++) {
    for (let j = 0; j <= 4; j++) {
      if (distanceAuxChemins(chemins, cx * t + (i * t) / 4, cy * t + (j * t) / 4) <= REGLES.distanceMaxChemin) return true;
    }
  }
  return false;
}

function verifierCondition(niveau: Niveau, foule: Foule, condition: ConditionFoule, quoi: string): void {
  switch (condition.type) {
    case 'payer':
      if (!Number.isInteger(condition.cout) || condition.cout < 1) throw new Error(`${quoi} : coût invalide (${String(condition.cout)})`);
      return;
    case 'heros':
      if (!(Number.isFinite(condition.duree) && condition.duree > 0)) throw new Error(`${quoi} : durée de présence du héros invalide (${String(condition.duree)})`);
      if (!foule.cases.some((c) => heroPeutSePoster(niveau, c.cx, c.cy))) throw new Error(`${quoi} : le héros ne peut se poster sur aucune case de la foule (trop loin des chemins)`);
      return;
    default:
      inconnu(condition, `${quoi} : condition`);
  }
}

function verifierEffet(niveau: Niveau, effet: EffetFoule, quoi: string): void {
  switch (effet.type) {
    case 'ralentir':
      if (!(Number.isFinite(effet.rayon) && effet.rayon > 0)) throw new Error(`${quoi} : rayon invalide (${String(effet.rayon)})`);
      if (!(Number.isFinite(effet.facteur) && effet.facteur > 0 && effet.facteur < 1)) throw new Error(`${quoi} : facteur de vitesse invalide, entre 0 et 1 (${String(effet.facteur)})`);
      if (!(Number.isFinite(effet.duree) && effet.duree > 0)) throw new Error(`${quoi} : durée invalide (${String(effet.duree)})`);
      return;
    case 'renforts':
      verifierRenforts(quoi, effet.unite, effet.nombre, effet.duree);
      return;
    case 'bloquer':
      verifierCoupure(niveau, quoi, effet.chemin, effet.debut, effet.longueur, effet.duree);
      return;
    default:
      inconnu(effet, `${quoi} : effet`);
  }
}

/** Vérifie les foules du niveau à la création de la partie (lève une erreur si l'une est mal formée). */
export function verifierFoules(niveau: Niveau): void {
  (niveau.foules ?? []).forEach((foule, i) => {
    const quoi = `Foule ${String(i)}`;
    if (foule.cases.length === 0) throw new Error(`${quoi} : au moins une case attendue`);
    for (const c of foule.cases) if (!caseExiste(niveau.carte, c.cx, c.cy)) throw new Error(`${quoi} : case hors de la grille (${String(c.cx)}, ${String(c.cy)})`);
    const { recharge, utilisations } = foule;
    if (recharge !== undefined && !(Number.isFinite(recharge) && recharge >= 0)) throw new Error(`${quoi} : recharge invalide (${String(recharge)})`);
    if (utilisations !== undefined && (!Number.isInteger(utilisations) || utilisations < 1)) throw new Error(`${quoi} : nombre d'utilisations invalide (${String(utilisations)})`);
    if (utilisations === undefined && !(recharge !== undefined && recharge > 0)) throw new Error(`${quoi} : une recharge ou un nombre d'utilisations est attendu`);
    verifierCondition(niveau, foule, foule.condition, quoi);
    verifierEffet(niveau, foule.effet, quoi);
  });
}

export function creerEtatFoules(niveau: Niveau): EtatFoule[] {
  return (niveau.foules ?? []).map((f) => ({ recharge: 0, utilisations: f.utilisations ?? -1, presence: 0 }));
}

/** La foule peut servir : pas en recharge, et des utilisations restantes. */
export function foulePrete(suivi: EtatFoule): boolean {
  return suivi.recharge === 0 && suivi.utilisations !== 0;
}

/** Pourquoi la commande `activerFoule` est refusée (null si elle est permise) ; la forme de l'action est déjà vérifiée. */
export function validerActivationFoule(etat: EtatPartie, index: number): RaisonRefus | null {
  const foule = etat.niveau.foules?.[index];
  const suivi = etat.dynamique.foules[index];
  if (index < 0 || !foule || !suivi) return 'foule_inconnue';
  if (foule.condition.type !== 'payer') return 'foule_sans_paiement';
  if (suivi.utilisations === 0) return 'foule_epuisee';
  if (suivi.recharge > 0) return 'foule_en_recharge';
  return foule.condition.cout > etat.aretes ? 'aretes_insuffisantes' : null;
}

function appliquerEffetFoule(etat: EtatPartie, foule: Foule, centre: Point): void {
  const effet = foule.effet;
  switch (effet.type) {
    case 'ralentir': {
      const rayon2 = effet.rayon * effet.rayon;
      // Une foule ralentit ceux qui marchent : les volants passent au-dessus.
      for (const e of etat.ennemis) {
        if (!e.vivant || e.volant || distance2(e.x, e.y, centre.x, centre.y) > rayon2) continue;
        appliquerEffet(etat, e, { type: 'ralentissement', chance: 1, duree: effet.duree, valeur: effet.facteur });
      }
      return;
    }
    case 'renforts': {
      // Au point du chemin le plus proche du centre de la foule : les étudiants descendent dans la rue.
      const proche = projeterSurChemin(etat.chemins, centre.x, centre.y);
      const chemin = proche ? etat.chemins[proche.chemin] : undefined;
      const point = proche && chemin ? pointSurChemin(chemin, proche.distance) : centre;
      invoquerRenforts(etat, effet.unite, effet.nombre, effet.duree, point.x, point.y);
      return;
    }
    case 'bloquer':
      ajouterBarrage(etat, effet.chemin, effet.debut, effet.longueur, effet.duree);
      return;
    default:
      inconnu(effet, 'Effet de foule');
  }
}

function activerFoule(etat: EtatPartie, index: number): void {
  const foule = etat.niveau.foules?.[index];
  const suivi = etat.dynamique.foules[index];
  if (!foule || !suivi) return;
  const centre = centreFoule(foule);
  suivi.recharge = enPas(foule.recharge ?? 0);
  if (suivi.utilisations > 0) suivi.utilisations--;
  suivi.presence = 0;
  etat.evenements.push({ type: 'foule_activee', foule: index, x: centre.x, y: centre.y });
  appliquerEffetFoule(etat, foule, centre);
}

/** Exécute la commande `activerFoule` déjà validée : paie la foule et l'active. */
export function payerFoule(etat: EtatPartie, index: number): void {
  const foule = etat.niveau.foules?.[index];
  if (foule?.condition.type !== 'payer') return;
  etat.aretes -= foule.condition.cout;
  activerFoule(etat, index);
}

/** Le pas des foules : recharges, et présence du héros dans les foules qui demandent qu'il y reste. */
export function mettreAJourFoules(etat: EtatPartie): void {
  const foules = etat.niveau.foules;
  if (!foules) return;
  const heros = chercherParId(etat.unites, etat.heros);
  foules.forEach((foule, index) => {
    const suivi = etat.dynamique.foules[index];
    if (!suivi) return;
    if (suivi.recharge > 0) {
      suivi.recharge--;
      if (suivi.recharge === 0 && suivi.utilisations !== 0) etat.evenements.push({ type: 'foule_prete', foule: index });
    }
    const condition = foule.condition;
    switch (condition.type) {
      case 'payer':
        return;
      case 'heros': {
        const present = foulePrete(suivi) && heros !== undefined && !heros.mort && pointDansFoule(etat.niveau, foule, heros.x, heros.y);
        suivi.presence = present ? suivi.presence + 1 : 0;
        if (suivi.presence >= Math.max(1, enPas(condition.duree))) activerFoule(etat, index);
        return;
      }
      default:
        inconnu(condition, 'Condition de foule');
    }
  });
}
