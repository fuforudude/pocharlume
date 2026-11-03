// Ce qui se pose sur la carte et y reste un moment : pièges sur le chemin, zones qui durent, tourelles construites par
// une tour ou un héros. Générique : tout vient des données (sorts, tour divine, pouvoirs des héros).
import { REGLES } from '../data/regles';
import { tirerEntre } from './aleatoire';
import { pointSurChemin, projeterSurChemin } from './chemins';
import { premierEnnemi } from './ciblage';
import { appliquerEffet, appliquerEffets, infligerDegats, partApresBouclier } from './degats';
import type { DefPiege, DefTourelle, DefZoneDurable, Ouvrage } from './definitions';
import { EFFET, MINUTEUR, type EtatPartie, type Piege, type Structure, type ZoneDurable } from './etat';
import { distance2 } from './recherche';
import { enPas } from './temps';

// --- Pièges --------------------------------------------------------------------------------------

/** Pose un piège ; au-delà du maximum de la carte, le plus ancien disparaît. */
export function poserPiege(etat: EtatPartie, def: DefPiege, x: number, y: number): Piege {
  const piege: Piege = { id: etat.prochainId++, x, y, stats: def };
  etat.pieges.push(piege);
  if (etat.pieges.length > REGLES.piegesMax) etat.pieges.shift();
  etat.evenements.push({ type: 'piege_pose', piege: piege.id, x, y });
  return piege;
}

/**
 * Pose `nombre` pièges sur le chemin le plus proche du point, centrés sur le point du chemin le plus proche et
 * espacés de `ecart` tuiles le long du chemin.
 */
export function poserPiegesSurChemin(etat: EtatPartie, def: DefPiege, x: number, y: number, nombre: number, ecart: number): void {
  const projection = projeterSurChemin(etat.chemins, x, y);
  const chemin = projection ? etat.chemins[projection.chemin] : undefined;
  if (!projection || !chemin) return;
  for (let i = 0; i < nombre; i++) {
    const distance = Math.max(0, Math.min(chemin.longueur, projection.distance + (i - (nombre - 1) / 2) * ecart));
    const p = pointSurChemin(chemin, distance);
    poserPiege(etat, def, p.x, p.y);
  }
}

/** Les pièges attendent le premier ennemi au sol qui s'en approche et n'est pas déjà immobilisé. */
export function mettreAJourPieges(etat: EtatPartie): void {
  if (etat.pieges.length === 0) return;
  let garde = 0;
  for (const piege of etat.pieges) {
    const rayon2 = piege.stats.rayon * piege.stats.rayon;
    let pris = false;
    for (const e of etat.ennemis) {
      if (!e.vivant || e.volant || e.invulnerable > 0 || (e.effetsPas[EFFET.etourdissement] ?? 0) > 0 || distance2(e.x, e.y, piege.x, piege.y) > rayon2) continue;
      etat.evenements.push({ type: 'piege_declenche', piege: piege.id, ennemi: e.id, x: piege.x, y: piege.y });
      infligerDegats(etat, e, piege.stats.degats, piege.stats.typeDegats);
      appliquerEffet(etat, e, { type: 'etourdissement', chance: 1, duree: piege.stats.immobilisation, valeur: 0 });
      pris = true;
      break;
    }
    if (!pris) etat.pieges[garde++] = piege;
  }
  etat.pieges.length = garde;
}

// --- Zones qui durent ----------------------------------------------------------------------------

export function creerZone(etat: EtatPartie, def: DefZoneDurable, x: number, y: number, rayon: number): ZoneDurable {
  const zone: ZoneDurable = {
    id: etat.prochainId++,
    x,
    y,
    rayon,
    restant: Math.max(1, enPas(def.duree)),
    effets: def.effets,
    critique: def.critique,
    volants: def.volants,
    revele: def.revele ?? false,
    degatsAllies: def.degatsAllies ?? 0,
  };
  etat.zones.push(zone);
  etat.evenements.push({ type: 'zone', zone: zone.id, x, y, rayon, duree: def.duree });
  return zone;
}

/**
 * Les zones rafraîchissent leurs effets sur les ennemis qui s'y trouvent (et révèlent les furtifs, pour celles qui le
 * font), puis s'éteignent. Un ennemi intouchable n'est affecté par rien.
 */
export function mettreAJourZones(etat: EtatPartie): void {
  if (etat.zones.length === 0) return;
  const revelation = Math.max(1, enPas(REGLES.dureeRevelation));
  let garde = 0;
  for (const zone of etat.zones) {
    const rayon2 = zone.rayon * zone.rayon;
    for (const e of etat.ennemis) {
      if (!e.vivant || e.invulnerable > 0 || (e.volant && !zone.volants) || distance2(e.x, e.y, zone.x, zone.y) > rayon2) continue;
      appliquerEffets(etat, e, zone.effets);
      if (zone.revele && e.furtif) e.revele = Math.max(e.revele, revelation);
    }
    zone.restant--;
    if (zone.restant > 0) etat.zones[garde++] = zone;
    else etat.evenements.push({ type: 'zone_fin', zone: zone.id, x: zone.x, y: zone.y });
  }
  etat.zones.length = garde;
}

/** Points de critique que les zones donnent aux tirs sur cet ennemi (Voile de Nuit). */
export function bonusCritiqueZones(etat: EtatPartie, x: number, y: number, volant: boolean): number {
  let bonus = 0;
  for (const z of etat.zones) {
    if (z.critique > 0 && (!volant || z.volants) && distance2(x, y, z.x, z.y) <= z.rayon * z.rayon) bonus += z.critique;
  }
  return bonus;
}

// --- Tourelles -----------------------------------------------------------------------------------

export function construireTourelle(etat: EtatPartie, origine: number, def: DefTourelle, x: number, y: number): Structure {
  const s: Structure = { id: etat.prochainId++, origine, x, y, restant: Math.max(1, enPas(def.duree)), recharge: 0, stats: def };
  etat.structures.push(s);
  etat.evenements.push({ type: 'structure', structure: s.id, origine, nom: def.nom, x, y, duree: def.duree });
  return s;
}

/** Les tourelles tirent seules sur le premier ennemi à portée, puis disparaissent à la fin de leur vie. */
export function mettreAJourStructures(etat: EtatPartie): void {
  if (etat.structures.length === 0) return;
  let garde = 0;
  for (const s of etat.structures) {
    s.restant--;
    if (s.restant <= 0) {
      etat.evenements.push({ type: 'structure_fin', structure: s.id, x: s.x, y: s.y });
      continue;
    }
    etat.structures[garde++] = s;
    if (s.recharge > 0) {
      s.recharge--;
      continue;
    }
    const cible = premierEnnemi(etat, s.x, s.y, s.stats.portee, s.stats.volants, false);
    if (!cible) continue;
    s.recharge = Math.max(1, enPas(s.stats.cadence));
    etat.evenements.push({ type: 'tir_structure', structure: s.id, ennemi: cible.id, x: s.x, y: s.y });
    infligerDegats(etat, cible, tirerEntre(etat, s.stats.degats[0], s.stats.degats[1]) * partApresBouclier(etat, cible, s.x, s.y), s.stats.typeDegats);
    appliquerEffets(etat, cible, s.stats.effets);
  }
  etat.structures.length = garde;
}

// --- Ouvrage : ce qu'une tour divine ou un héros construit autour de lui -------------------------

/** Minuteurs de départ d'un constructeur : la première tourelle et le premier piège viennent après un délai. */
export function minuteursInitiaux(ouvrage: Ouvrage | null, cadenceSoin: number): number[] {
  return [
    ouvrage?.constructeur ? Math.max(1, enPas(ouvrage.constructeur.cadence)) : 0,
    ouvrage?.pieges ? Math.max(1, enPas(ouvrage.pieges.cadence)) : 0,
    cadenceSoin > 0 ? Math.max(1, enPas(cadenceSoin)) : 0,
  ];
}

/**
 * Un pas d'ouvrage : construit une tourelle (jusqu'au maximum de tourelles vivantes) et pose un piège sur le
 * point du chemin le plus proche si celui-ci est à portée, chacun à sa cadence.
 */
export function mettreAJourOuvrage(etat: EtatPartie, origine: number, x: number, y: number, ouvrage: Ouvrage, minuteurs: number[]): void {
  const constructeur = ouvrage.constructeur;
  if (constructeur) {
    const attente = minuteurs[MINUTEUR.tourelle] ?? 0;
    if (attente > 0) minuteurs[MINUTEUR.tourelle] = attente - 1;
    else {
      let vivantes = 0;
      for (const s of etat.structures) if (s.origine === origine) vivantes++;
      if (vivantes < constructeur.max) {
        const decalage = constructeur.decalages[vivantes % Math.max(1, constructeur.decalages.length)] ?? { x: 0, y: 0 };
        construireTourelle(etat, origine, constructeur.tourelle, x + decalage.x, y + decalage.y);
        minuteurs[MINUTEUR.tourelle] = Math.max(1, enPas(constructeur.cadence));
      }
    }
  }
  const pieges = ouvrage.pieges;
  if (pieges) {
    const attente = minuteurs[MINUTEUR.piege] ?? 0;
    if (attente > 0) minuteurs[MINUTEUR.piege] = attente - 1;
    else {
      const projection = projeterSurChemin(etat.chemins, x, y);
      const chemin = projection ? etat.chemins[projection.chemin] : undefined;
      if (projection && chemin && projection.ecart <= pieges.portee) {
        const p = pointSurChemin(chemin, projection.distance);
        poserPiege(etat, pieges.piege, p.x, p.y);
        minuteurs[MINUTEUR.piege] = Math.max(1, enPas(pieges.cadence));
      } else {
        // Aucun chemin à portée : on réessaie dans une seconde.
        minuteurs[MINUTEUR.piege] = enPas(1);
      }
    }
  }
}
