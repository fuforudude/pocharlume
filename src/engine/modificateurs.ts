// Résolution des stats d'après les modificateurs : compétences du héros, arbre d'améliorations, rangs de
// compétence d'une spécialisation. Tout est calculé à la création de la partie, à l'achat ou à la construction :
// le moteur ne relit plus ces tables pendant les pas.
import { CAPACITES_NULLES, MOD_UNITE_NUL } from '../data/capacites';
import { REGLES } from '../data/regles';
import { bonusEffectif, modBonusHeros } from './bonus';
import { defBranche, defHeros } from './contenu';
import type {
  CapacitesUnite,
  DefCompetenceTour,
  DefHeros,
  DefNiveauTour,
  EffetCoup,
  IdFamille,
  ModArbre,
  ModTour,
  ModUnite,
  StatsCombattant,
  ZoneHeros,
} from './definitions';
import type { ConfigPartie, EtatPartie } from './etat';

const AUCUN_ARBRE: ModArbre = { pvSoldats: 0, portee: 0, degats: 0, zone: 0, recharge: 0, pvHeros: 0, degatsHeros: 0 };

function plafond(valeur: number, max: number): number {
  return Math.min(max, valeur);
}

export function sommeModsUnite(mods: readonly ModUnite[]): ModUnite {
  const somme: { -readonly [K in keyof ModUnite]: ModUnite[K] } = { ...MOD_UNITE_NUL };
  for (const m of mods) for (const cle of Object.keys(somme) as (keyof ModUnite)[]) somme[cle] += m[cle];
  return somme;
}

/** Effets de l'arbre pour les branches qui visent `cible` (une famille, les sorts ou le héros). */
export function modArbre(config: ConfigPartie, cible: IdFamille | 'sorts' | 'heros'): ModArbre {
  let total = AUCUN_ARBRE;
  for (const id of Object.keys(config.ameliorations)) {
    const branche = defBranche(id);
    const rang = config.ameliorations[id] ?? 0;
    if (!branche || branche.cible !== cible || rang <= 0) continue;
    const effet = branche.effets[Math.min(rang, branche.effets.length) - 1];
    if (!effet) continue;
    const somme: { -readonly [K in keyof ModArbre]: ModArbre[K] } = { ...total };
    for (const cle of Object.keys(somme) as (keyof ModArbre)[]) somme[cle] += effet[cle];
    total = somme;
  }
  return total;
}

/** Applique un modificateur à des stats d'unité (soldat, spectre, héros). Ne modifie pas l'original. */
export function appliquerModUnite(s: StatsCombattant, m: ModUnite): StatsCombattant {
  const base = s.capacites;
  let capacites: CapacitesUnite | undefined = base;
  if (base) {
    const critique =
      base.critique || m.critique > 0
        ? {
            chance: (base.critique?.chance ?? 0) + m.critique,
            multiplicateur: base.critique?.multiplicateur ?? REGLES.multiplicateurCritique,
          }
        : null;
    capacites = {
      ...base,
      esquive: base.esquive + m.esquive,
      execution: base.execution + m.execution,
      ignoreArmure: plafond(base.ignoreArmure + m.ignoreArmure, 1),
      critique,
      rage: base.rage + m.rage,
      regeneration: base.regeneration + m.regeneration,
      soin: base.soin ? { ...base.soin, rayon: base.soin.rayon + m.zone, quantite: base.soin.quantite + m.soin } : null,
      distance: base.distance
        ? {
            ...base.distance,
            portee: base.distance.portee + m.portee,
            cadence: base.distance.cadence / (1 + m.cadence),
            degats: [base.distance.degats[0] * (1 + m.degats), base.distance.degats[1] * (1 + m.degats)],
          }
        : null,
      ouvrage: base.ouvrage
        ? {
            constructeur: base.ouvrage.constructeur
              ? {
                  ...base.ouvrage.constructeur,
                  max: base.ouvrage.constructeur.max + m.nombreOuvrages,
                  cadence: base.ouvrage.constructeur.cadence * (1 - plafond(m.cadenceOuvrages, 0.9)),
                  tourelle: {
                    ...base.ouvrage.constructeur.tourelle,
                    degats: [
                      base.ouvrage.constructeur.tourelle.degats[0] * (1 + m.degatsOuvrages),
                      base.ouvrage.constructeur.tourelle.degats[1] * (1 + m.degatsOuvrages),
                    ],
                  },
                }
              : null,
            pieges: base.ouvrage.pieges
              ? {
                  ...base.ouvrage.pieges,
                  cadence: base.ouvrage.pieges.cadence * (1 - plafond(m.cadenceOuvrages, 0.9)),
                  piege: { ...base.ouvrage.pieges.piege, degats: base.ouvrage.pieges.piege.degats * (1 + m.degatsOuvrages) },
                }
              : null,
          }
        : null,
    };
  } else if (m.esquive > 0 || m.execution > 0 || m.critique > 0 || m.regeneration > 0 || m.rage > 0 || m.ignoreArmure > 0) {
    // Une unité sans pouvoir (soldat de caserne) qui en gagne par une compétence.
    capacites = appliquerModUnite({ ...s, capacites: CAPACITES_NULLES }, m).capacites;
  }
  const stats: StatsCombattant = {
    ...s,
    pv: s.pv * (1 + m.pv),
    degats: [s.degats[0] * (1 + m.degats), s.degats[1] * (1 + m.degats)],
    cadence: s.cadence / (1 + m.cadence),
    armure: plafond(s.armure + m.armure, REGLES.paliersProtection[REGLES.paliersProtection.length - 1] ?? 0.9),
    vitesse: s.vitesse * (1 + m.vitesse),
    portee: s.portee + m.portee,
    capacite: s.capacite + m.capacite,
  };
  return capacites ? { ...stats, capacites } : stats;
}


/** Rang (0 à rangMax) d'une compétence de héros dans la config ; 0 si absente. */
function rangDe(rangs: Readonly<Record<string, number>>, id: string): number {
  return Object.hasOwn(rangs, id) ? (rangs[id] ?? 0) : 0;
}

export interface HerosResolu {
  readonly stats: StatsCombattant;
  readonly zone: ZoneHeros | null;
}

/** Stats du héros de la config : base, niveau, rangs de compétence, arbre. */
export function resoudreHeros(config: ConfigPartie): HerosResolu {
  const def = defHeros(config.heros);
  if (!def) throw new Error(`Héros inconnu : ${config.heros}`);
  return resoudreDef(def, config);
}

function resoudreDef(def: DefHeros, config: ConfigPartie): HerosResolu {
  const montees = config.niveauHeros - 1;
  const arbre = modArbre(config, 'heros');
  const mods: ModUnite[] = [{ ...MOD_UNITE_NUL, pv: arbre.pvHeros, degats: arbre.degatsHeros }];
  for (const c of def.competences) {
    const rang = rangDe(config.competencesHeros, c.id);
    const mod = rang > 0 ? c.rangs[Math.min(rang, c.rangs.length) - 1] : undefined;
    if (mod) mods.push(mod);
  }
  // Bonus de collection (familier) : PV, dégâts, cadence et régénération ; rien en défi Fer.
  const collection = modBonusHeros(bonusEffectif(config).heros);
  if (collection) mods.push(collection);
  const mod = sommeModsUnite(mods);
  // Le gain par niveau vaut aussi pour l'attaque à distance (les tireurs n'ont pas de dégâts au corps-à-corps).
  const distance = def.capacites.distance
    ? {
        ...def.capacites.distance,
        degats: [def.capacites.distance.degats[0] + montees * def.degatsParNiveau, def.capacites.distance.degats[1] + montees * def.degatsParNiveau] as const,
      }
    : null;
  const melee = def.degats[1] > 0;
  const base: StatsCombattant = {
    nom: def.nom,
    pv: def.pv + montees * def.pvParNiveau,
    degats: melee ? [def.degats[0] + montees * def.degatsParNiveau, def.degats[1] + montees * def.degatsParNiveau] : def.degats,
    cadence: def.cadence,
    coups: 1,
    armure: def.armure,
    resistance: def.resistance,
    vitesse: def.vitesse,
    portee: def.portee,
    capacite: def.capacite,
    effets: def.effets,
    capacites: { ...def.capacites, distance },
  };
  const stats = appliquerModUnite(base, mod);
  const arrondi: StatsCombattant = { ...stats, pv: Math.round(stats.pv) };
  const zone = def.zone ? { ...def.zone, rayon: def.zone.rayon + mod.zone } : null;
  return { stats: arrondi, zone };
}

// --- Tours ---------------------------------------------------------------------------------------

/** Le rang atteint d'une compétence de tour donne l'effet total de ce rang ; les compétences s'ajoutent. */
export function sommeModsTour(competences: readonly DefCompetenceTour[], rangs: readonly number[]): ModTour {
  const unites: ModUnite[] = [];
  let total: { -readonly [K in keyof ModTour]: ModTour[K] } = {
    pvSoldats: 0,
    degats: 0,
    cadence: 0,
    portee: 0,
    zone: 0,
    critique: 0,
    ignoreArmure: 0,
    chaine: 0,
    spectres: 0,
    effets: [],
    unites: MOD_UNITE_NUL,
    nappe: null,
  };
  competences.forEach((c, i) => {
    const rang = rangs[i] ?? 0;
    const m = rang > 0 ? c.rangs[Math.min(rang, c.rangs.length) - 1] : undefined;
    if (!m) return;
    total = {
      pvSoldats: total.pvSoldats + m.pvSoldats,
      degats: total.degats + m.degats,
      cadence: total.cadence + m.cadence,
      portee: total.portee + m.portee,
      zone: total.zone + m.zone,
      critique: total.critique + m.critique,
      ignoreArmure: total.ignoreArmure + m.ignoreArmure,
      chaine: total.chaine + m.chaine,
      spectres: total.spectres + m.spectres,
      effets: fusionnerEffets(total.effets, m.effets),
      unites: MOD_UNITE_NUL,
      nappe: m.nappe ?? total.nappe,
    };
    unites.push(m.unites);
  });
  total.unites = sommeModsUnite(unites);
  return total;
}

/**
 * Ajoute des effets à une liste : un effet du même type est renforcé (chance et durée au maximum, valeur au maximum,
 * ou au minimum pour le ralentissement dont la valeur est un facteur de vitesse).
 */
export function fusionnerEffets(base: readonly EffetCoup[], ajouts: readonly EffetCoup[]): readonly EffetCoup[] {
  if (ajouts.length === 0) return base;
  const resultat = [...base];
  for (const ajout of ajouts) {
    const i = resultat.findIndex((e) => e.type === ajout.type);
    const present = resultat[i];
    if (!present) {
      resultat.push(ajout);
      continue;
    }
    resultat[i] = {
      type: present.type,
      chance: Math.max(present.chance, ajout.chance),
      duree: Math.max(present.duree, ajout.duree),
      valeur: present.type === 'ralentissement' ? Math.min(present.valeur, ajout.valeur) : Math.max(present.valeur, ajout.valeur),
    };
  }
  return resultat;
}

/**
 * Applique l'effet total des compétences d'une spécialisation et de l'arbre à la définition d'un niveau de tour.
 * Les PV des soldats (`pvSoldats`) s'additionnent au bonus du dieu : c'est `statsTour` qui les applique.
 */
export function appliquerModsTour(def: DefNiveauTour, mod: ModTour, arbre: ModArbre): DefNiveauTour {
  const fois = (valeur: number, fraction: number): number => valeur * (1 + fraction);
  const critique =
    mod.critique > 0
      ? { chance: (def.critique?.chance ?? 0) + mod.critique, multiplicateur: def.critique?.multiplicateur ?? REGLES.multiplicateurCritique }
      : def.critique;
  const soldats = def.soldats
    ? {
        ...appliquerModUnite(def.soldats, mod.unites),
        nombre: def.soldats.nombre,
        reapparition: def.soldats.reapparition,
        effets: fusionnerEffets(def.soldats.effets, mod.effets),
      }
    : null;
  const spectres = def.spectres
    ? { ...appliquerModUnite(def.spectres, mod.unites), max: def.spectres.max + mod.spectres, duree: def.spectres.duree }
    : null;
  return {
    ...def,
    degats: [fois(def.degats[0], mod.degats + arbre.degats), fois(def.degats[1], mod.degats + arbre.degats)],
    cadence: def.cadence / (1 + mod.cadence),
    portee: fois(def.portee, arbre.portee) + mod.portee,
    zone: def.zone > 0 ? fois(def.zone, arbre.zone) + mod.zone : 0,
    critique,
    ignoreArmure: plafond(def.ignoreArmure + mod.ignoreArmure, 1),
    chaine: def.chaine ? { ...def.chaine, nombre: def.chaine.nombre + mod.chaine } : null,
    effets: def.soldats ? def.effets : fusionnerEffets(def.effets, mod.effets),
    soldats,
    spectres,
    nappe: mod.nappe ?? def.nappe,
  };
}

/** Pour l'état : stats d'une famille d'après la config. */
export function arbrePourFamille(etat: EtatPartie, famille: IdFamille): ModArbre {
  return modArbre(etat.config, famille);
}

export { AUCUN_ARBRE };
