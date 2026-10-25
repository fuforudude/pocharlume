// Unités alliées au corps-à-corps : soldats de caserne, héros, renforts, spectres.
// Une unité garde un point (ancre), s'engage sur les ennemis au sol proches, en bloque autant que sa
// capacité le permet (1 en général, plus avec la provocation) et les frappe.
import { REGLES } from '../data/regles';
import { tirerEntre } from './aleatoire';
import { appliquerEffets, estVisible, infligerDegats, partRestante } from './degats';
import type { StatsCombattant, TypeDegats, ZoneHeros } from './definitions';
import type { Ennemi, EtatPartie, GenreUnite, Unite } from './etat';
import { chercherParId, distance2 } from './recherche';
import { enPas, PAS_PAR_SECONDE } from './temps';

/** Distance à laquelle une unité cesse d'approcher sa cible (un peu sous la distance de blocage). */
const CONTACT = REGLES.distanceBlocage * 0.8;

export interface NouvelleUnite {
  genre: GenreUnite;
  tour: number;
  emplacement: number;
  x: number;
  y: number;
  ancreX: number;
  ancreY: number;
  stats: StatsCombattant;
  /** Pas avant réapparition après la mort, -1 si l'unité disparaît. */
  delaiReapparition: number;
  /** Pas avant de disparaître, -1 si permanente. */
  duree: number;
  zone: ZoneHeros | null;
}

export function creerUnite(etat: EtatPartie, n: NouvelleUnite): Unite {
  const u: Unite = {
    id: etat.prochainId++,
    genre: n.genre,
    tour: n.tour,
    emplacement: n.emplacement,
    x: n.x,
    y: n.y,
    ancreX: n.ancreX,
    ancreY: n.ancreY,
    pv: n.stats.pv,
    stats: n.stats,
    recharge: 0,
    cible: -1,
    bloques: 0,
    mort: false,
    reapparition: 0,
    delaiReapparition: n.delaiReapparition,
    duree: n.duree,
    enDeplacement: false,
    zone: n.zone,
  };
  etat.unites.push(u);
  return u;
}

/** Décalage de formation autour d'un point de garde. */
export function placeEnFormation(emplacement: number, x: number, y: number): { x: number; y: number } {
  const f = REGLES.formation[emplacement % REGLES.formation.length] ?? { x: 0, y: 0 };
  return { x: x + f.x, y: y + f.y };
}

/** Relâche tous les ennemis bloqués par l'unité et oublie sa cible. */
export function libererBloques(etat: EtatPartie, u: Unite): void {
  if (u.bloques > 0) {
    for (const e of etat.ennemis) if (e.bloqueur === u.id) e.bloqueur = -1;
  }
  u.bloques = 0;
  u.cible = -1;
}

/** Une unité alliée tombe à portée d'un nécromancien : il la relève en spectre s'il a de la place. */
function releverEnSpectre(etat: EtatPartie, x: number, y: number): void {
  for (const t of etat.tours) {
    const spectres = t.stats.spectres;
    if (!spectres || distance2(t.x, t.y, x, y) > t.stats.portee * t.stats.portee) continue;
    let vivants = 0;
    for (const u of etat.unites) if (u.tour === t.id && u.genre === 'spectre' && !u.mort && u.duree !== 0) vivants++;
    if (vivants >= spectres.max) continue;
    const s = creerUnite(etat, {
      genre: 'spectre',
      tour: t.id,
      emplacement: vivants,
      x,
      y,
      ancreX: x,
      ancreY: y,
      stats: spectres,
      delaiReapparition: -1,
      duree: Math.max(1, enPas(spectres.duree)),
      zone: null,
    });
    etat.evenements.push({ type: 'invocation', unite: s.id, genre: 'spectre', x, y });
    return;
  }
}

export function mourir(etat: EtatPartie, u: Unite): void {
  if (u.mort) return;
  u.mort = true;
  u.pv = 0;
  u.enDeplacement = false;
  libererBloques(etat, u);
  u.reapparition = u.delaiReapparition;
  etat.evenements.push({ type: 'mort_unite', unite: u.id, genre: u.genre, x: u.x, y: u.y });
  if (u.genre !== 'spectre') releverEnSpectre(etat, u.x, u.y);
}

/** Inflige des dégâts à une unité alliée après ses protections. */
export function blesserUnite(etat: EtatPartie, u: Unite, montant: number, type: TypeDegats): void {
  if (u.mort) return;
  u.pv -= montant * partRestante(type, u.stats.armure, u.stats.resistance);
  if (u.pv <= 0) mourir(etat, u);
}

/** Une unité à retirer de l'état : expirée, ou morte sans réapparition. */
export function estRetiree(u: Unite): boolean {
  return u.duree === 0 || (u.mort && u.delaiReapparition < 0);
}

function reapparaitre(etat: EtatPartie, u: Unite): void {
  u.mort = false;
  u.pv = u.stats.pv;
  u.recharge = 0;
  if (u.genre === 'heros') {
    const depart = etat.niveau.carte.departHeros;
    u.x = depart.x;
    u.y = depart.y;
    u.ancreX = depart.x;
    u.ancreY = depart.y;
  } else {
    const tour = chercherParId(etat.tours, u.tour);
    if (tour) {
      u.x = tour.x;
      u.y = tour.y;
    }
  }
  etat.evenements.push({ type: 'reapparition', unite: u.id, genre: u.genre });
}

/** Avance vers un point ; renvoie vrai une fois arrivé (à `arret` près). */
function avancerVers(u: Unite, x: number, y: number, arret: number): boolean {
  const dx = x - u.x;
  const dy = y - u.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d <= arret) return true;
  const pas = u.stats.vitesse / PAS_PAR_SECONDE;
  if (d - arret <= pas) {
    u.x = x - (dx / d) * arret;
    u.y = y - (dy / d) * arret;
    return true;
  }
  u.x += (dx / d) * pas;
  u.y += (dy / d) * pas;
  return false;
}

function engageable(e: Ennemi): boolean {
  return e.vivant && !e.volant && estVisible(e, false);
}

/**
 * Cherche une cible dans le rayon d'engagement autour de l'ancre : d'abord un ennemi qu'elle bloque déjà,
 * sinon le plus proche des ennemis libres (qu'elle bloque), sinon elle aide contre un ennemi déjà bloqué.
 */
function choisirCible(etat: EtatPartie, u: Unite): Ennemi | undefined {
  const rayon2 = u.stats.portee * u.stats.portee;
  let libre: Ennemi | undefined;
  let dLibre = Infinity;
  let aide: Ennemi | undefined;
  let dAide = Infinity;
  for (const e of etat.ennemis) {
    if (!engageable(e) || distance2(e.x, e.y, u.ancreX, u.ancreY) > rayon2) continue;
    if (e.bloqueur === u.id) {
      u.cible = e.id;
      return e;
    }
    const d = distance2(e.x, e.y, u.x, u.y);
    if (e.bloqueur === -1) {
      if (d < dLibre) {
        dLibre = d;
        libre = e;
      }
    } else if (d < dAide) {
      dAide = d;
      aide = e;
    }
  }
  if (libre && u.bloques < u.stats.capacite) {
    libre.bloqueur = u.id;
    u.bloques++;
    u.cible = libre.id;
    return libre;
  }
  if (aide && u.bloques === 0) {
    u.cible = aide.id;
    return aide;
  }
  return undefined;
}

/** Provocation : une unité de capacité > 1 bloque aussi les ennemis libres qui passent à son contact. */
function provoquer(etat: EtatPartie, u: Unite): void {
  const portee2 = REGLES.distanceBlocage * REGLES.distanceBlocage;
  for (const e of etat.ennemis) {
    if (u.bloques >= u.stats.capacite) return;
    if (e.bloqueur !== -1 || !engageable(e) || distance2(e.x, e.y, u.x, u.y) > portee2) continue;
    e.bloqueur = u.id;
    u.bloques++;
  }
}

function frapper(etat: EtatPartie, u: Unite, cible: Ennemi): void {
  const s = u.stats;
  etat.evenements.push({ type: 'coup', unite: u.id, ennemi: cible.id });
  for (let i = 0; i < s.coups; i++) {
    infligerDegats(etat, cible, tirerEntre(etat, s.degats[0], s.degats[1]), 'physique');
    appliquerEffets(etat, cible, s.effets);
  }
  const zone = u.zone;
  if (!zone) return;
  const rayon2 = zone.rayon * zone.rayon;
  const cx = cible.x;
  const cy = cible.y;
  appliquerEffets(etat, cible, zone.effets);
  for (const e of etat.ennemis) {
    if (e === cible || !engageable(e) || distance2(e.x, e.y, cx, cy) > rayon2) continue;
    infligerDegats(etat, e, tirerEntre(etat, s.degats[0], s.degats[1]), 'physique');
    appliquerEffets(etat, e, zone.effets);
  }
}

function mettreAJourUnite(etat: EtatPartie, u: Unite): void {
  if (u.mort) {
    if (u.reapparition > 0) u.reapparition--;
    else if (u.delaiReapparition >= 0) reapparaitre(etat, u);
    return;
  }
  if (u.duree > 0) {
    u.duree--;
    if (u.duree === 0) {
      libererBloques(etat, u);
      return;
    }
  }
  if (u.recharge > 0) u.recharge--;

  if (u.enDeplacement) {
    if (avancerVers(u, u.ancreX, u.ancreY, 0)) u.enDeplacement = false;
    return;
  }

  let cible = u.cible === -1 ? undefined : chercherParId(etat.ennemis, u.cible);
  if (cible) {
    const laisse = u.stats.portee * REGLES.laisseEngagement;
    if (!cible.vivant || distance2(cible.x, cible.y, u.ancreX, u.ancreY) > laisse * laisse) {
      if (cible.bloqueur === u.id) {
        cible.bloqueur = -1;
        u.bloques = Math.max(0, u.bloques - 1);
      }
      cible = undefined;
    }
  }
  if (cible && cible.bloqueur !== u.id) {
    // Elle aide contre un ennemi bloqué par une autre : elle reprend le blocage s'il se libère,
    // sinon elle passe à un ennemi libre dès qu'il y en a un.
    if (cible.bloqueur === -1 && u.bloques < u.stats.capacite) {
      cible.bloqueur = u.id;
      u.bloques++;
    } else {
      cible = choisirCible(etat, u) ?? cible;
    }
  }
  if (!cible) {
    u.cible = -1;
    cible = choisirCible(etat, u);
  }
  if (!cible) {
    avancerVers(u, u.ancreX, u.ancreY, 0);
    return;
  }
  if (u.stats.capacite > 1 && u.bloques > 0) provoquer(etat, u);
  avancerVers(u, cible.x, cible.y, CONTACT);
  const blocage = REGLES.distanceBlocage;
  if (u.recharge === 0 && distance2(cible.x, cible.y, u.x, u.y) <= blocage * blocage) {
    u.recharge = Math.max(1, enPas(u.stats.cadence));
    frapper(etat, u, cible);
  }
}

export function mettreAJourUnites(etat: EtatPartie): void {
  for (const u of etat.unites) mettreAJourUnite(etat, u);
}
