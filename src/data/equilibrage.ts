// Formules d'équilibrage : puissance des tours, menace des ennemis, budget de menace par vague, courbe
// d'arêtes attendue, et générateur de vagues déterministe qui remplit ce budget.
import { creerGenerateur, tirer } from '../engine/aleatoire';
import type { DefEnnemi, DefFamille, DefNiveauTour, EffetCoup, Paquet, StatsCombattant, TypeDegats, Vague } from '../engine/definitions';
import { REGLES } from './regles';

export const EQUILIBRAGE = {
  /** Cibles moyennes touchées par un coup de zone : 1 + ce facteur × rayon. */
  ciblesParRayonDeZone: 1.5,
  /** Part des maillons d'une chaîne qui trouvent en moyenne un ennemi. */
  presenceChaine: 0.6,
  /** Part du temps où un nécromancien a ses spectres sur le terrain. */
  presenceSpectres: 0.5,
  /**
   * Part de la portée d'une tour à soldats sans tir (caserne, Sanctuaire) qui n'est que de l'étendue de ralliement : jusqu'à
   * 3,5 tuiles pour qu'une caserne à une case du chemin l'atteigne quel que soit l'axe. La puissance ne la compte pas.
   */
  elargissementRalliement: 1,
  /**
   * Dans un niveau qui compte des volants ou des furtifs, nombre de fois où chaque ennemi ordinaire figure dans la liste du tirage :
   * à 2, un volant ou un furtif est tiré deux fois moins souvent qu'un ennemi ordinaire.
   */
  repetitionOrdinaires: 2,
  /** Valeur d'un point de vie (effectif) de bloqueur, en DPS équivalent. */
  valeurBlocageParPv: 0.013,
  /** Vitesse (tuiles/s) dont le facteur de menace vaut 1. */
  vitesseReference: 1,
  /** Menace de la vague 1 du niveau 1. */
  budgetBase: 260,
  /** Croissance du budget par niveau de campagne, jusqu'au niveau `niveauPleineCroissance` (la région 1). */
  croissanceNiveau: 0.15,
  /** Dernier niveau de campagne qui croît à la pleine vitesse : le boss de la région 1. */
  niveauPleineCroissance: 10,
  /**
   * Croissance du budget par niveau au-delà : plus lente, car les tours n'ont que quatre niveaux et un nombre de cases utiles
   * borné (les régions suivantes ajoutent des mécaniques d'ennemis plutôt que des armées dix fois plus grosses). Réglé avec
   * le simulateur (voir docs/architecture.md).
   */
  croissanceNiveauSuite: 0.03,
  /**
   * Croissance du budget par vague dans un niveau. Haute à dessein : une défense complète finit par tout arrêter,
   * ce sont les dernières vagues qui empêchent le héros seul (ou une défense négligée) de gagner.
   */
  croissanceVague: 1.2,
  /** Arêtes rapportées par point de menace tué. */
  aretesParMenace: 0.12,
  /** Écart de puissance toléré entre les tours d'un même palier de coût. */
  tolerancePuissance: 0.15,
  /** Taille max d'un paquet généré. */
  tailleMaxPaquet: 12,
  /**
   * Secondes entre deux ennemis d'un paquet, pour un ennemi à la vitesse de référence. Court : des colonnes serrées
   * (réglé avec le simulateur, voir docs/architecture.md), car des ennemis très espacés ne pressent jamais la défense.
   */
  intervalleReference: 0.3,
} as const;

function moyenne(f: readonly [number, number]): number {
  return (f[0] + f[1]) / 2;
}

function arrondiDixieme(x: number): number {
  return Math.round(x * 10) / 10;
}

function partApresProtection(type: TypeDegats, palier: number): number {
  return type === 'pur' ? 1 : 1 - palier;
}

/** DPS pur des effets sur la durée, selon la fréquence des coups qui les entretiennent. */
function dpsEffets(effets: readonly EffetCoup[], cadence: number): number {
  let total = 0;
  for (const e of effets) {
    if (e.type === 'brulure' || e.type === 'saignement' || e.type === 'poison') {
      total += e.valeur * Math.min(1, (e.chance * e.duree) / cadence);
    }
  }
  return total;
}

/** DPS au corps-à-corps d'une unité contre un palier d'armure (les unités frappent en physique). */
function dpsCombattant(s: StatsCombattant, palier: number): number {
  return (moyenne(s.degats) * s.coups * (1 - palier)) / s.cadence + dpsEffets(s.effets, s.cadence / s.coups);
}

function valeurBlocage(s: StatsCombattant): number {
  return (s.pv / (1 - s.armure)) * s.capacite * EQUILIBRAGE.valeurBlocageParPv;
}

/** DPS efficace d'un niveau de tour pour chaque palier de protection (0 / 30 / 60 / 90 %). */
export function dpsEfficace(def: DefNiveauTour): number[] {
  return REGLES.paliersProtection.map((palier) => {
    let dps = 0;
    if (def.soldats) {
      const s = def.soldats;
      dps += s.nombre * (dpsCombattant(s, palier) + valeurBlocage(s));
    }
    if (def.cadence > 0) {
      const critique = def.critique ? 1 + def.critique.chance * (def.critique.multiplicateur - 1) : 1;
      let cibles = def.zone > 0 ? 1 + EQUILIBRAGE.ciblesParRayonDeZone * def.zone : 1;
      if (def.chaine) cibles += def.chaine.nombre * def.chaine.facteur * EQUILIBRAGE.presenceChaine;
      dps += ((moyenne(def.degats) * critique * partApresProtection(def.typeDegats, palier)) / def.cadence) * cibles;
      dps += dpsEffets(def.effets, def.cadence) * cibles;
    }
    if (def.spectres) {
      const s = def.spectres;
      dps += s.max * EQUILIBRAGE.presenceSpectres * (dpsCombattant(s, palier) + valeurBlocage(s));
    }
    return dps;
  });
}

/** Portée comptée dans la puissance : celle de la tour, moins l'élargissement du ralliement pour une tour à soldats sans tir. */
export function porteePourPuissance(def: DefNiveauTour): number {
  return def.soldats && def.cadence === 0 ? def.portee - EQUILIBRAGE.elargissementRalliement : def.portee;
}

/** Puissance = DPS efficace moyen sur les paliers × portée ÷ coût cumulé. */
export function puissanceTour(def: DefNiveauTour, coutCumule: number): number {
  const dps = dpsEfficace(def);
  return ((dps.reduce((a, b) => a + b, 0) / dps.length) * porteePourPuissance(def)) / coutCumule;
}

export interface PalierTour {
  def: DefNiveauTour;
  /** 1 à 3, ou 4 pour une spécialisation. */
  palier: number;
  coutCumule: number;
}

/** Les niveaux d'une famille avec leur coût cumulé (les spécialisations au palier 4). */
export function paliersFamille(famille: DefFamille): PalierTour[] {
  const paliers: PalierTour[] = [];
  let cumul = 0;
  famille.niveaux.forEach((def, i) => {
    cumul += def.cout;
    paliers.push({ def, palier: i + 1, coutCumule: cumul });
  });
  for (const def of [famille.specialisations.A, famille.specialisations.B]) {
    paliers.push({ def, palier: 4, coutCumule: cumul + def.cout });
  }
  return paliers;
}

export function facteurVitesse(vitesse: number): number {
  return Math.sqrt(vitesse / EQUILIBRAGE.vitesseReference);
}

/** Menace = PV ÷ (1 − protection moyenne) × facteur de vitesse × coût en vies. */
export function menaceEnnemi(def: DefEnnemi): number {
  const protection = (def.armure + def.resistance) / 2;
  return (def.pv / (1 - protection)) * facteurVitesse(def.vitesse) * def.coutVies;
}

/** Budget de menace b(L, w) de la vague w (1, 2…) du niveau de campagne L (1 à 100). */
export function budgetVague(niveau: number, vague: number): number {
  const { croissanceNiveau, croissanceNiveauSuite, niveauPleineCroissance } = EQUILIBRAGE;
  const pleine = Math.min(niveau, niveauPleineCroissance) - 1;
  const suite = Math.max(0, niveau - niveauPleineCroissance);
  return EQUILIBRAGE.budgetBase * (1 + croissanceNiveau * pleine + croissanceNiveauSuite * suite) * (1 + EQUILIBRAGE.croissanceVague * (vague - 1));
}

/** Arêtes attendues des primes de la vague w du niveau L. */
export function aretesAttenduesVague(niveau: number, vague: number): number {
  return budgetVague(niveau, vague) * EQUILIBRAGE.aretesParMenace;
}

/** Arêtes cumulées attendues après la vague w (arêtes de départ comprises). */
export function aretesCumuleesAttendues(niveau: number, vague: number, aretesDepart: number): number {
  let total = aretesDepart;
  for (let w = 1; w <= vague; w++) total += aretesAttenduesVague(niveau, w);
  return total;
}

export interface OptionsGeneration {
  niveau: number;
  vague: number;
  /** Ennemis débloqués, dans un ordre fixe (l'ordre compte pour le déterminisme). */
  ennemis: readonly (readonly [string, DefEnnemi])[];
  graine: number;
  /** Nombre de chemins de la carte. */
  chemins: number;
  /** Autorise les boss dans le tirage. */
  boss?: boolean;
}

/**
 * Remplit le budget b(L, w) avec des paquets d'ennemis tirés au hasard (générateur à graine) : même
 * entrée, même vague. S'arrête quand plus aucun ennemi ne rentre dans le budget restant.
 */
export function genererVague(o: OptionsGeneration): Vague {
  const g = creerGenerateur((o.graine ^ Math.imul(o.niveau, 0x9e3779b1) ^ Math.imul(o.vague, 0x85ebca6b)) >>> 0);
  const candidats = o.ennemis
    .filter(([, def]) => o.boss === true || !def.boss)
    // `groupe` : un essaim n'arrive que par groupes de cette taille (1 = un ennemi ordinaire).
    .map(([id, def]) => ({ id, def, menace: menaceEnnemi(def), groupe: def.pouvoirs?.essaim ?? 1 }));
  let restant = budgetVague(o.niveau, o.vague);
  let delai = 0;
  const paquets: Paquet[] = [];
  for (;;) {
    const abordables = candidats.filter((c) => c.menace * c.groupe <= restant);
    const choix = abordables[Math.floor(tirer(g) * abordables.length)];
    if (!choix) break;
    const max = Math.min(Math.floor(restant / choix.menace), EQUILIBRAGE.tailleMaxPaquet);
    const nombre =
      choix.groupe === 1
        ? 1 + Math.floor(tirer(g) * max)
        : choix.groupe * (1 + Math.floor(tirer(g) * Math.max(1, Math.floor(max / choix.groupe))));
    const intervalle = arrondiDixieme(EQUILIBRAGE.intervalleReference / facteurVitesse(choix.def.vitesse));
    paquets.push({ ennemi: choix.id, nombre, intervalle, chemin: Math.floor(tirer(g) * o.chemins), delai });
    restant -= nombre * choix.menace;
    delai = arrondiDixieme(delai + (nombre * intervalle) / 2);
  }
  return { paquets };
}

/** Menace totale d'une vague. */
export function menaceVague(vague: Vague, ennemis: Readonly<Record<string, DefEnnemi | undefined>>): number {
  let total = 0;
  for (const p of vague.paquets) {
    const def = ennemis[p.ennemi];
    if (def) total += p.nombre * menaceEnnemi(def);
  }
  return total;
}
