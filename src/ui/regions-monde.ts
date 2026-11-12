// Les régions que la carte du monde montre (les quinze : l'histoire, puis l'après-histoire ; et les trois du DLC Temps modernes) et ce qu'elles contiennent : les 10 niveaux, leurs
// nœuds sur le fond de 512 × 288, le tracé de la route, le décor de la carte et les textes des niveaux. C'est ici, et
// seulement ici, que la carte apprend l'existence d'une région : brancher une région livrée par la tâche « niveaux »
// (src/data/niveaux/) se fait en remplaçant son `contenu: null` par ses données, sans toucher aux écrans.
import { NOMBRE_REGIONS_MODERNE, type IdCampagne } from '../data/campagnes';
import { NIVEAUX_PAR_REGION, NOMBRE_REGIONS } from '../data/meta';
import { NOEUDS_REGIONS_MODERNE, REGIONS_MODERNE, TEXTES_REGIONS_MODERNE, TRACES_REGIONS_MODERNE } from '../data/niveaux/campagne-moderne';
import { REGIONS, TEXTES_REGIONS } from '../data/niveaux/campagne';
import { NOEUDS_REGIONS, TRACES_REGIONS, type NoeudNiveau } from '../data/niveaux/carte-du-monde';
import type { TextesNiveau } from '../data/niveaux/region1';
import type { NiveauCampagne } from '../data/visuel';
import type { Point } from '../engine';
import { tCle } from '../i18n';
import type { CleTexte } from '../i18n';
import { DECOR_MONDE_REGION1, type DecorMonde } from '../render/carte-monde-decor';

/** Les données d'une région livrée. Les numéros de `niveaux` et de `textes` sont ceux de la campagne (1 à 150). */
export interface ContenuRegion {
  readonly niveaux: readonly NiveauCampagne[];
  /** Un nœud par niveau, dans l'ordre ; le `numero` d'un nœud est son numéro dans la région (1 à 10). */
  readonly noeuds: readonly NoeudNiveau[];
  /** `trace[i]` va du nœud i + 1 au nœud i + 2. */
  readonly trace: readonly (readonly Point[])[];
  readonly decor: readonly DecorMonde[];
  readonly textes: readonly TextesNiveau[];
}

/** Décor de fond dessiné en CSS derrière une région du DLC (style.css, `.carte-monde[data-ambiance]`). */
export type MotifRegion = 'fac' | 'manif' | 'prefecture';

/** Les couleurs d'ambiance d'une région : le fond (le plus sombre) et la brume qui le voile. */
export interface AmbianceRegion {
  readonly fond: string;
  readonly brume: string;
  /** Décor de fond propre (régions du DLC) ; absent : le fond uni. */
  readonly motif?: MotifRegion;
}

/**
 * Ambiance des régions de `AMBIANCES` absentes : un gris neutre. Elle s'applique donc aussi aux régions 1 à 10 et 12 à 15 ; ce n'est
 * visible que sur le panneau « à venir » d'une région sans niveaux, que seules les régions 12 à 15 montrent aujourd'hui.
 */
const AMBIANCE_PROVISOIRE: AmbianceRegion = { fond: '#16161a', brume: '#2a2a31' };
/** Les Grèves Grises (région 11) : cendre et brume sur l'eau, du gris-bleu terne. */
const AMBIANCE_GREVES_GRISES: AmbianceRegion = { fond: '#15181b', brume: '#4b5258' };
const AMBIANCES: Readonly<Record<number, AmbianceRegion>> = { 11: AMBIANCE_GREVES_GRISES };

export interface RegionMonde {
  /** 1 à 15 pour l'histoire, 1 à 3 pour le DLC. */
  readonly numero: number;
  /** Campagne de la région ; absente = l'histoire. */
  readonly campagne?: IdCampagne;
  /** Clé de texte du nom de la région. */
  readonly nom: CleTexte;
  /** Numéro de campagne de son premier niveau (1, 11, 21…). */
  readonly premierNiveau: number;
  /** null : ses niveaux ne sont pas encore dans le jeu (la carte l'annonce, sans rien dessiner). */
  readonly contenu: ContenuRegion | null;
  /** Couleurs d'ambiance : celles du panneau « à venir » d'une région sans niveaux, et du fond quand elle en aura. */
  readonly ambiance?: AmbianceRegion;
}

function region(numero: number, nom: CleTexte, contenu: ContenuRegion | null): RegionMonde {
  return { numero, nom, premierNiveau: (numero - 1) * NIVEAUX_PAR_REGION + 1, contenu, ambiance: AMBIANCES[numero] ?? AMBIANCE_PROVISOIRE };
}

/**
 * Le contenu de la région `numero` (1 à 15) : ses niveaux et leurs textes (numéros de campagne), ses nœuds (numéros 1 à 10) et son
 * tracé. Rend null tant que l'une de ces données manque (région dont les niveaux ne sont pas encore livrés) : la carte
 * l'annonce alors « à venir » au lieu de planter. Le décor du fond n'existe que pour la région 1 : les autres ont un fond sans décor.
 */
export function contenuDeRegion(
  numero: number,
  donnees: {
    readonly niveaux: readonly (readonly NiveauCampagne[])[];
    readonly noeuds: readonly (readonly NoeudNiveau[])[];
    readonly traces: readonly (readonly (readonly Point[])[])[];
    readonly textes: readonly (readonly TextesNiveau[])[];
    /** Décor du fond de chaque région ; absent : celui de la région 1 de l'histoire, aucun pour les autres. */
    readonly decors?: readonly (readonly DecorMonde[])[];
  } = { niveaux: REGIONS, noeuds: NOEUDS_REGIONS, traces: TRACES_REGIONS, textes: TEXTES_REGIONS },
): ContenuRegion | null {
  const niveaux = donnees.niveaux[numero - 1];
  const noeuds = donnees.noeuds[numero - 1];
  const trace = donnees.traces[numero - 1];
  const textes = donnees.textes[numero - 1];
  const complet = (l: readonly unknown[] | undefined): l is readonly unknown[] => l !== undefined && l.length === NIVEAUX_PAR_REGION;
  if (!niveaux || !noeuds || !trace || !textes || !complet(niveaux) || !complet(noeuds) || !complet(textes) || trace.length !== NIVEAUX_PAR_REGION - 1) {
    return null;
  }
  const decor = donnees.decors ? (donnees.decors[numero - 1] ?? []) : numero === 1 ? DECOR_MONDE_REGION1 : [];
  return { niveaux, noeuds, trace, decor, textes };
}

export const REGIONS_MONDE: readonly RegionMonde[] = Array.from({ length: NOMBRE_REGIONS }, (_, i) =>
  region(i + 1, `region.${String(i + 1)}` as CleTexte, contenuDeRegion(i + 1)),
);

/** La Fac (occupation, AG) : murs de fac défraîchis, affiches et tags, un beige grisé. */
const AMBIANCE_FAC: AmbianceRegion = { fond: '#24201c', brume: '#6b5d4a', motif: 'fac' };
/** La Manif (cortège, boulevards) : bitume et pavés, gris froid. */
const AMBIANCE_MANIF: AmbianceRegion = { fond: '#18191c', brume: '#4a4d55', motif: 'manif' };
/** La Préfecture (le siège final) : façade préfectorale de pierre claire, bleu ardoise. */
const AMBIANCE_PREFECTURE: AmbianceRegion = { fond: '#1a1d24', brume: '#5d6678', motif: 'prefecture' };
const AMBIANCES_MODERNE: readonly AmbianceRegion[] = [AMBIANCE_FAC, AMBIANCE_MANIF, AMBIANCE_PREFECTURE];

/**
 * Les 3 régions de la carte du monde du DLC « Temps modernes », numérotées 1 à 3, aux niveaux numérotés dans leur campagne (1, 11, 21).
 * Leur contenu vient de src/data/niveaux/campagne-moderne.ts : tant qu'il est vide, chacune s'annonce « à venir ».
 */
export const REGIONS_MONDE_MODERNE: readonly RegionMonde[] = Array.from({ length: NOMBRE_REGIONS_MODERNE }, (_, i) => ({
  numero: i + 1,
  campagne: 'moderne',
  nom: `region_moderne.${String(i + 1)}` as CleTexte,
  premierNiveau: i * NIVEAUX_PAR_REGION + 1,
  contenu: contenuDeRegion(i + 1, { niveaux: REGIONS_MODERNE, noeuds: NOEUDS_REGIONS_MODERNE, traces: TRACES_REGIONS_MODERNE, textes: TEXTES_REGIONS_MODERNE, decors: [] }),
  ambiance: AMBIANCES_MODERNE[i] ?? AMBIANCE_PROVISOIRE,
}));

/** Les niveaux qui existent vraiment (ceux des régions livrées, 110 avec la région 11) : le compteur d'étoiles en vise 3 chacun. */
export function nombreNiveauxLivres(regions: readonly RegionMonde[] = REGIONS_MONDE): number {
  return regions.reduce((total, r) => total + (r.contenu?.niveaux.length ?? 0), 0);
}

/** Niveaux des régions d'avant : ce qu'on ajoute au numéro d'un nœud de la région pour avoir le niveau de campagne. */
export function decalageDeRegion(r: RegionMonde): number {
  return r.premierNiveau - 1;
}

/** Le niveau de campagne de ce numéro (1 à 150), dans les régions livrées ; undefined sinon. */
export function niveauDeCampagne(numero: number, regions: readonly RegionMonde[] = REGIONS_MONDE): NiveauCampagne | undefined {
  for (const r of regions) {
    const trouve = r.contenu?.niveaux.find((n) => n.numero === numero);
    if (trouve) return trouve;
  }
  return undefined;
}

/** Nom et phrase d'ambiance d'un niveau de campagne, ou null s'il n'est pas livré. */
export function textesDuNiveau(numero: number, regions: readonly RegionMonde[] = REGIONS_MONDE): { nom: string; ambiance: string } | null {
  for (const r of regions) {
    const textes = r.contenu?.textes.find((x) => x.numero === numero);
    if (textes) return { nom: tCle(textes.nom), ambiance: tCle(textes.ambiance) };
  }
  return null;
}
