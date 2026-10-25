// Tours : stats (bonus du dieu compris), coûts, soldats des casernes, ciblage, tirs, ondes, projectiles.
import { REGLES } from '../data/regles';
import { tirer, tirerEntre } from './aleatoire';
import { ajusterMontant } from './argent';
import { placerSurChemin, segmentPour } from './chemins';
import { defFamille, dieuDe } from './contenu';
import { appliquerEffets, estVisible, infligerDegats } from './degats';
import type { DefNiveauTour, Voie } from './definitions';
import { facteurVitesse } from './ennemis';
import type { Ennemi, EtatPartie, FamilleTour, Projectile, Tour } from './etat';
import { chercherParId, distance2 } from './recherche';
import { enPas, PAS_PAR_SECONDE } from './temps';
import { creerUnite, libererBloques, placeEnFormation } from './unites';

/** Définition brute d'un niveau de tour (niveau 1 à 3, ou 4 avec une voie). */
export function defNiveau(etat: EtatPartie, famille: FamilleTour, niveau: number, voie: Voie | null): DefNiveauTour | undefined {
  if (famille === 'divine') return niveau === 1 ? dieuDe(etat).tourDivine : undefined;
  const def = defFamille(famille);
  if (!def) return undefined;
  if (niveau === 4) return voie === 'A' || voie === 'B' ? def.specialisations[voie] : undefined;
  return def.niveaux[niveau - 1];
}

/** Stats effectives : la définition avec le bonus de famille du dieu de la partie. */
export function statsTour(etat: EtatPartie, famille: FamilleTour, def: DefNiveauTour): DefNiveauTour {
  const bonus = dieuDe(etat).bonus;
  if (bonus.famille !== famille) return def;
  const critique = bonus.chanceCritique > 0
    ? {
        chance: (def.critique?.chance ?? 0) + bonus.chanceCritique,
        multiplicateur: def.critique?.multiplicateur ?? REGLES.multiplicateurCritique,
      }
    : def.critique;
  return {
    ...def,
    cadence: def.cadence / (1 + bonus.cadence),
    critique,
    effets: def.soldats ? def.effets : [...def.effets, ...bonus.effets],
    soldats: def.soldats
      ? { ...def.soldats, pv: def.soldats.pv * (1 + bonus.pvSoldats), effets: [...def.soldats.effets, ...bonus.effets] }
      : null,
  };
}

/** Prix d'un niveau, remise de famille du dieu comprise. */
export function prix(etat: EtatPartie, famille: FamilleTour, def: DefNiveauTour): number {
  const bonus = dieuDe(etat).bonus;
  return bonus.famille === famille ? ajusterMontant(def.cout, 1 + bonus.prix) : def.cout;
}

/** Met les soldats d'une caserne au nombre et aux stats de son niveau courant (remis à neuf). */
export function synchroniserSoldats(etat: EtatPartie, tour: Tour): void {
  const soldats = tour.stats.soldats;
  if (!soldats) return;
  let n = 0;
  for (const u of etat.unites) {
    if (u.tour !== tour.id || u.genre !== 'soldat') continue;
    u.stats = soldats;
    u.delaiReapparition = Math.max(1, enPas(soldats.reapparition));
    if (!u.mort) u.pv = soldats.pv;
    n++;
  }
  for (let i = n; i < soldats.nombre; i++) {
    const place = placeEnFormation(i, tour.ralliementX, tour.ralliementY);
    creerUnite(etat, {
      genre: 'soldat',
      tour: tour.id,
      emplacement: i,
      x: tour.x,
      y: tour.y,
      ancreX: place.x,
      ancreY: place.y,
      stats: soldats,
      delaiReapparition: Math.max(1, enPas(soldats.reapparition)),
      duree: -1,
      zone: null,
    });
  }
}

/** Nouveau point de ralliement : les soldats lâchent leurs ennemis et rejoignent leur place. */
export function deplacerSoldats(etat: EtatPartie, tour: Tour): void {
  for (const u of etat.unites) {
    if (u.tour !== tour.id || u.genre !== 'soldat') continue;
    const place = placeEnFormation(u.emplacement, tour.ralliementX, tour.ralliementY);
    u.ancreX = place.x;
    u.ancreY = place.y;
    libererBloques(etat, u);
  }
}

/** Premier ennemi sur le chemin (le moins de distance restante) à portée et visible. */
function premierEnnemi(etat: EtatPartie, t: Tour): Ennemi | undefined {
  const s = t.stats;
  const portee2 = s.portee * s.portee;
  let meilleur: Ennemi | undefined;
  let restantMin = Infinity;
  for (const e of etat.ennemis) {
    if (!e.vivant || (e.volant && !s.volants) || !estVisible(e, s.revele)) continue;
    if (distance2(e.x, e.y, t.x, t.y) > portee2) continue;
    const restant = (etat.chemins[e.chemin]?.longueur ?? 0) - e.distance;
    if (restant < restantMin) {
      restantMin = restant;
      meilleur = e;
    }
  }
  return meilleur;
}

/** Ennemis déjà touchés par une chaîne en cours (tampon réutilisé, hors état). */
const dejaTouches: number[] = [];

/** Coup au but sur une cible : dégâts, effets, puis chaîne vers les voisins visibles (pas les furtifs cachés). */
function toucher(etat: EtatPartie, s: DefNiveauTour, cible: Ennemi, degats: number): void {
  const x = cible.x;
  const y = cible.y;
  infligerDegats(etat, cible, degats, s.typeDegats);
  appliquerEffets(etat, cible, s.effets);
  const chaine = s.chaine;
  if (!chaine) return;
  dejaTouches.length = 0;
  dejaTouches.push(cible.id);
  let px = x;
  let py = y;
  const rayon2 = chaine.rayon * chaine.rayon;
  for (let n = 0; n < chaine.nombre; n++) {
    let suivant: Ennemi | undefined;
    let min = rayon2;
    for (const e of etat.ennemis) {
      if (!e.vivant || (e.volant && !s.volants) || !estVisible(e, s.revele) || dejaTouches.includes(e.id)) continue;
      const d = distance2(e.x, e.y, px, py);
      if (d <= min) {
        min = d;
        suivant = e;
      }
    }
    if (!suivant) return;
    dejaTouches.push(suivant.id);
    px = suivant.x;
    py = suivant.y;
    infligerDegats(etat, suivant, degats * chaine.facteur, s.typeDegats);
    appliquerEffets(etat, suivant, s.effets);
  }
}

function frapperZone(etat: EtatPartie, s: DefNiveauTour, x: number, y: number, rayon: number, degats: number): void {
  const rayon2 = rayon * rayon;
  for (const e of etat.ennemis) {
    if (!e.vivant || (e.volant && !s.volants) || !estVisible(e, s.revele) || distance2(e.x, e.y, x, y) > rayon2) continue;
    infligerDegats(etat, e, degats, s.typeDegats);
    appliquerEffets(etat, e, s.effets);
  }
}

const visee = { x: 0, y: 0 };

/** Point d'impact visé par un tir au sol : position prévue de la cible à l'arrivée du projectile. */
function anticiper(etat: EtatPartie, t: Tour, e: Ennemi, vitesse: number): void {
  visee.x = e.x;
  visee.y = e.y;
  const c = etat.chemins[e.chemin];
  if (!c || e.bloqueur !== -1) return;
  const vol = Math.sqrt(distance2(t.x, t.y, e.x, e.y)) / vitesse;
  const distance = Math.min(c.longueur, e.distance + e.vitesse * facteurVitesse(e) * vol);
  placerSurChemin(c, distance, segmentPour(c, distance, e.segment), e.decalage, visee);
}

function ondeDeChoc(etat: EtatPartie, t: Tour): boolean {
  const s = t.stats;
  const portee2 = s.portee * s.portee;
  let present = false;
  for (const e of etat.ennemis) {
    if (e.vivant && !e.volant && estVisible(e, s.revele) && distance2(e.x, e.y, t.x, t.y) <= portee2) {
      present = true;
      break;
    }
  }
  if (!present) return false;
  etat.evenements.push({ type: 'onde', tour: t.id, x: t.x, y: t.y, rayon: s.portee });
  for (const e of etat.ennemis) {
    if (!e.vivant || e.volant || !estVisible(e, s.revele) || distance2(e.x, e.y, t.x, t.y) > portee2) continue;
    infligerDegats(etat, e, tirerEntre(etat, s.degats[0], s.degats[1]), s.typeDegats);
    appliquerEffets(etat, e, s.effets);
  }
  return true;
}

function tirerSur(etat: EtatPartie, t: Tour, cible: Ennemi): void {
  const s = t.stats;
  let degats = tirerEntre(etat, s.degats[0], s.degats[1]);
  const critique = s.critique !== null && tirer(etat) < s.critique.chance;
  if (critique) degats *= s.critique.multiplicateur;
  if (s.projectile <= 0) {
    etat.evenements.push({ type: 'tir', tour: t.id, cible: cible.id, projectile: -1, x: t.x, y: t.y, critique });
    toucher(etat, s, cible, degats);
    return;
  }
  const vitesse = s.projectile / PAS_PAR_SECONDE;
  const auSol = s.zone > 0;
  if (auSol) anticiper(etat, t, cible, vitesse);
  const p: Projectile = {
    id: etat.prochainId++,
    tour: t.id,
    x: t.x,
    y: t.y,
    cible: auSol ? -1 : cible.id,
    cx: auSol ? visee.x : cible.x,
    cy: auSol ? visee.y : cible.y,
    vitesse,
    degats,
    critique,
    stats: s,
  };
  etat.projectiles.push(p);
  etat.evenements.push({ type: 'tir', tour: t.id, cible: cible.id, projectile: p.id, x: t.x, y: t.y, critique });
}

export function mettreAJourTours(etat: EtatPartie): void {
  for (const t of etat.tours) {
    if (t.recharge > 0) t.recharge--;
    const s = t.stats;
    if (t.recharge > 0 || s.soldats) continue;
    if (s.onde) {
      if (ondeDeChoc(etat, t)) t.recharge = Math.max(1, enPas(s.cadence));
      continue;
    }
    const cible = premierEnnemi(etat, t);
    if (!cible) continue;
    tirerSur(etat, t, cible);
    t.recharge = Math.max(1, enPas(s.cadence));
  }
}

/** Fait voler les projectiles ; à l'arrivée, dégâts sur la cible suivie ou dans la zone d'impact. */
export function mettreAJourProjectiles(etat: EtatPartie): void {
  const liste = etat.projectiles;
  let garde = 0;
  for (const p of liste) {
    let cible: Ennemi | undefined;
    if (p.cible >= 0) {
      cible = chercherParId(etat.ennemis, p.cible);
      if (cible?.vivant) {
        p.cx = cible.x;
        p.cy = cible.y;
      } else {
        // Cible perdue : le projectile finit sa course et se perd.
        cible = undefined;
        p.cible = -2;
      }
    }
    const dx = p.cx - p.x;
    const dy = p.cy - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > p.vitesse) {
      p.x += (dx / d) * p.vitesse;
      p.y += (dy / d) * p.vitesse;
      liste[garde++] = p;
      continue;
    }
    p.x = p.cx;
    p.y = p.cy;
    const s = p.stats;
    etat.evenements.push({ type: 'impact', projectile: p.id, tour: p.tour, x: p.x, y: p.y, zone: s.zone });
    if (s.zone > 0) frapperZone(etat, s, p.x, p.y, s.zone, p.degats);
    else if (cible) toucher(etat, s, cible, p.degats);
  }
  liste.length = garde;
}
