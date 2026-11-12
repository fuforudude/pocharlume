// Les foules activables (DLC Temps modernes) vues par les bots de l'équilibrage. Règles volontairement simples :
//
// - Foule « payer » : le bot l'active dès qu'elle est prête, qu'il a les arêtes, et que son effet touche maintenant au moins
//   `SEUIL_FOULE` ennemis au sol (ou un boss) : `ralentir`, ceux qui sont dans son rayon ; `renforts`, ceux qui sont à
//   `PORTEE_RENFORTS` tuiles du point où les étudiants descendent ; `bloquer`, ceux qui marchent vers la coupure et en sont à moins de
//   `APPROCHE_BLOCAGE` tuiles. Une foule rentable passe avant les achats de tours : elle sert pendant qu'elle a des cibles.
// - Foule « héros » : le bot y envoie son héros quand elle est prête et qu'au moins `SEUIL_FOULE` ennemis au sol (ou un boss) arrivent
//   à `APPROCHE_HEROS` tuiles du point où son effet porte : le temps que le héros y reste, ils seront là. Sinon, le héros garde son
//   poste habituel.
//
// Les événements datés, eux, ne demandent rien aux bots : le moteur refuse sans rien changer ce qui n'est plus possible (case devenue
// chemin, passage coupé), et les bots passent au choix suivant.
import { centreFoule, foulePrete, pointSurChemin, validerAction } from '../engine';
import type { Action, EffetFoule, Ennemi, EtatPartie, Foule, Point } from '../engine';
import { REGLES } from '../data/regles';

/** Ennemis au sol (ou un boss) qu'un effet de foule doit toucher pour que le bot la juge utile. */
export const SEUIL_FOULE = 3;
/** Rayon (tuiles) autour du point des renforts où l'on compte les ennemis. */
const PORTEE_RENFORTS = 4;
/** Distance (tuiles, le long du chemin) en deçà de la coupure où l'on compte les ennemis qui arrivent. */
const APPROCHE_BLOCAGE = 8;
/** Distance (tuiles) au point de l'effet d'une foule « héros » où l'on compte les ennemis qui arrivent. */
const APPROCHE_HEROS = 8;

/** Le point où porte l'effet d'une foule (centre, point du chemin des renforts, entrée de la coupure). */
function pointDeLEffet(etat: EtatPartie, foule: Foule, effet: EffetFoule): Point {
  const centre = centreFoule(foule);
  switch (effet.type) {
    case 'ralentir':
      return centre;
    case 'renforts': {
      let meilleur: Point = centre;
      let ecart = Infinity;
      for (const c of etat.chemins) {
        for (let d = 0; d <= c.longueur; d += 0.5) {
          const p = pointSurChemin(c, d);
          const e = (p.x - centre.x) * (p.x - centre.x) + (p.y - centre.y) * (p.y - centre.y);
          if (e < ecart) {
            ecart = e;
            meilleur = p;
          }
        }
      }
      return meilleur;
    }
    case 'bloquer': {
      const c = etat.chemins[effet.chemin];
      return c ? pointSurChemin(c, effet.debut) : centre;
    }
    default:
      return centre;
  }
}

function auSol(e: Ennemi): boolean {
  return e.vivant && !e.volant && e.couloir < 0;
}

function proche(e: Ennemi, p: Point, rayon: number): boolean {
  return (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y) <= rayon * rayon;
}

/** Assez de cibles : `SEUIL_FOULE` ennemis, ou un boss. */
function assez(cibles: readonly Ennemi[]): boolean {
  return cibles.length >= SEUIL_FOULE || cibles.some((e) => e.boss);
}

/** Les ennemis que l'effet de la foule toucherait maintenant. */
function ciblesMaintenant(etat: EtatPartie, foule: Foule): Ennemi[] {
  const effet = foule.effet;
  const point = pointDeLEffet(etat, foule, effet);
  switch (effet.type) {
    case 'ralentir':
      return etat.ennemis.filter((e) => auSol(e) && proche(e, point, effet.rayon));
    case 'renforts':
      return etat.ennemis.filter((e) => auSol(e) && proche(e, point, PORTEE_RENFORTS));
    case 'bloquer':
      return etat.ennemis.filter((e) => auSol(e) && e.chemin === effet.chemin && e.distance <= effet.debut && e.distance >= effet.debut - APPROCHE_BLOCAGE);
    default:
      return [];
  }
}

/** La commande `activerFoule` d'une foule « payer » rentable maintenant (règle en tête du fichier), ou null. */
export function activationRentable(etat: EtatPartie): Action | null {
  const foules = etat.niveau.foules ?? [];
  for (let i = 0; i < foules.length; i++) {
    const foule = foules[i];
    if (foule?.condition.type !== 'payer') continue;
    const action: Action = { type: 'activerFoule', foule: i };
    if (validerAction(etat, action) !== null) continue;
    if (assez(ciblesMaintenant(etat, foule))) return action;
  }
  return null;
}

/**
 * Un point d'une foule « héros » prête où envoyer le héros (règle en tête du fichier), ou null. Le point est sur une case de la foule et
 * accepté par le moteur (`deplacerHeros`).
 */
export function posteDansFoule(etat: EtatPartie): Point | null {
  const foules = etat.niveau.foules ?? [];
  for (let i = 0; i < foules.length; i++) {
    const foule = foules[i];
    const suivi = etat.dynamique.foules[i];
    if (foule?.condition.type !== 'heros' || !suivi || !foulePrete(suivi)) continue;
    const point = pointDeLEffet(etat, foule, foule.effet);
    if (!assez(etat.ennemis.filter((e) => auSol(e) && proche(e, point, APPROCHE_HEROS)))) continue;
    const t = REGLES.tailleCase;
    for (const c of foule.cases) {
      for (let j = 0; j < 5; j++) {
        for (let k = 0; k < 5; k++) {
          const x = c.cx * t + (t * (k + 0.5)) / 5;
          const y = c.cy * t + (t * (j + 0.5)) / 5;
          if (validerAction(etat, { type: 'deplacerHeros', x, y }) === null) return { x, y };
        }
      }
    }
  }
  return null;
}
