// Mécaniques d'ennemis du DLC « Temps modernes », génériques et pilotées par les données (aucun ennemi n'est nommé ici) :
//   - repousse (action `repousser`) : les unités alliées devant l'ennemi sont poussées dans le sens de sa marche et étourdies ;
//   - tir sur les tours (action `tirer_tour`) : un projectile vole vers une tour et la met hors service à l'arrivée ; un Perchoir
//     qui a la capacité « Renvoi » (campagne) en renvoie une partie au tireur, qui est blessé ;
//   - binôme (pouvoir `binome`) : la liaison est posée par `ajouterEnnemi` (ennemis.ts), l'accélération par la chute de l'autre dans
//     `tuer` (degats.ts) et `facteurVitesse` (ennemis.ts).
import { renvoiDuTir } from './capacites-campagne';
import { trajetEnnemi } from './chemins';
import { infligerDegats } from './degats';
import type { ActionEnnemi } from './definitions';
import type { Ennemi, EtatPartie, Tour, TirEnnemi } from './etat';
import { chercherParId, distance2 } from './recherche';
import { enPas, PAS_PAR_SECONDE } from './temps';
import { libererBloques } from './unites';

/** Direction de marche de l'ennemi (unitaire), le long de son chemin ou de son couloir ; (1, 0) à défaut. */
function directionDe(etat: EtatPartie, e: Ennemi): { x: number; y: number } {
  const c = trajetEnnemi(etat, e);
  const x = c?.dirX[e.segment] ?? 1;
  const y = c?.dirY[e.segment] ?? 0;
  return x === 0 && y === 0 ? { x: 1, y: 0 } : { x, y };
}

/**
 * Repousse : les unités alliées ciblables vivantes devant l'ennemi (produit scalaire avec sa direction de marche positif), à moins de
 * `portee` tuiles, sont poussées de `distance` tuiles dans cette direction, étourdies et lâchent leurs ennemis. Faux s'il n'y en a aucune.
 */
export function repousser(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'repousser' }>): boolean {
  const dir = directionDe(etat, e);
  const portee2 = action.portee * action.portee;
  const pas = Math.max(1, enPas(action.etourdissement));
  let nombre = 0;
  for (const u of etat.unites) {
    if (u.mort || u.stats.capacites?.ciblable === false) continue;
    const dx = u.x - e.x;
    const dy = u.y - e.y;
    if (dx * dir.x + dy * dir.y <= 0 || dx * dx + dy * dy > portee2) continue;
    u.x += dir.x * action.distance;
    u.y += dir.y * action.distance;
    u.etourdi = Math.max(u.etourdi, pas);
    u.enDeplacement = false;
    libererBloques(etat, u);
    nombre++;
  }
  if (nombre === 0) return false;
  etat.evenements.push({ type: 'repousse', ennemi: e.id, x: e.x, y: e.y, dx: dir.x, dy: dir.y, portee: action.portee, nombre });
  return true;
}

/** La tour la plus proche de l'ennemi à moins de `portee` tuiles (la première construite en cas d'égalité). */
function tourLaPlusProche(etat: EtatPartie, e: Ennemi, portee: number): Tour | undefined {
  let proche: Tour | undefined;
  let min = portee * portee;
  for (const t of etat.tours) {
    const d = distance2(t.x, t.y, e.x, e.y);
    if (d <= min) {
      min = d;
      proche = t;
    }
  }
  return proche;
}

/** Tir sur les tours : un projectile part vers la tour la plus proche à portée. Faux s'il n'y en a aucune (l'action est retentée). */
export function tirerSurTour(etat: EtatPartie, e: Ennemi, action: Extract<ActionEnnemi, { type: 'tirer_tour' }>): boolean {
  const tour = tourLaPlusProche(etat, e, action.portee);
  if (!tour) return false;
  const tir: TirEnnemi = {
    id: etat.prochainId++,
    ennemi: e.id,
    tour: tour.id,
    x: e.x,
    y: e.y,
    cx: tour.x,
    cy: tour.y,
    vitesse: action.vitesse / PAS_PAR_SECONDE,
    duree: Math.max(1, enPas(action.duree)),
    renvoye: false,
    degats: 0,
  };
  etat.tirsEnnemis.push(tir);
  etat.evenements.push({ type: 'tir_tour', tir: tir.id, ennemi: e.id, tour: tour.id, x: e.x, y: e.y });
  return true;
}

/** Le tir arrive sur sa tour : renvoyé par un Perchoir (il repart vers le tireur), ou la tour est hors service. Vrai s'il continue sa route. */
function arriverSurTour(etat: EtatPartie, tir: TirEnnemi, tour: Tour): boolean {
  const renvoi = renvoiDuTir(etat, tour);
  const tireur = renvoi ? chercherParId(etat.ennemis, tir.ennemi) : undefined;
  if (renvoi && tireur?.vivant) {
    tir.renvoye = true;
    tir.degats = renvoi.capacite.degats;
    etat.evenements.push({ type: 'renvoi', tir: tir.id, tour: renvoi.tour.id, ennemi: tireur.id, x: tir.x, y: tir.y });
    return true;
  }
  if (renvoi) return false;
  tour.desactivee = Math.max(tour.desactivee, tir.duree);
  etat.evenements.push({ type: 'tour_desactivee', ennemi: tir.ennemi, tour: tour.id, duree: tir.duree / PAS_PAR_SECONDE });
  return false;
}

/**
 * Fait voler les tirs des ennemis. Vers une tour : il suit la tour (une tour vendue entre-temps le perd) ; à l'arrivée, elle est hors
 * service, sauf renvoi. Renvoyé : il suit le tireur, qui est blessé à l'arrivée ; un tireur mort entre-temps le perd.
 */
export function mettreAJourTirsEnnemis(etat: EtatPartie): void {
  const liste = etat.tirsEnnemis;
  if (liste.length === 0) return;
  let garde = 0;
  for (const tir of liste) {
    const tour = tir.renvoye ? undefined : chercherParId(etat.tours, tir.tour);
    const tireur = tir.renvoye ? chercherParId(etat.ennemis, tir.ennemi) : undefined;
    if (tir.renvoye ? !tireur?.vivant : !tour) continue;
    const cible = tour ?? tireur;
    if (cible) {
      tir.cx = cible.x;
      tir.cy = cible.y;
    }
    const dx = tir.cx - tir.x;
    const dy = tir.cy - tir.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > tir.vitesse) {
      tir.x += (dx / d) * tir.vitesse;
      tir.y += (dy / d) * tir.vitesse;
      liste[garde++] = tir;
      continue;
    }
    tir.x = tir.cx;
    tir.y = tir.cy;
    if (tour) {
      if (arriverSurTour(etat, tir, tour)) liste[garde++] = tir;
    } else if (tireur) {
      infligerDegats(etat, tireur, tir.degats, 'physique');
      etat.evenements.push({ type: 'tir_renvoye_touche', tir: tir.id, ennemi: tireur.id, x: tir.x, y: tir.y });
    }
  }
  liste.length = garde;
}
