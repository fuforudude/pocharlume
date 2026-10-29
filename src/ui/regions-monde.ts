// Les régions que la carte du monde montre (les dix de la campagne) et ce qu'elles contiennent : les 10 niveaux, leurs
// nœuds sur le fond de 512 × 288, le tracé de la route, le décor de la carte et les textes des niveaux. C'est ici, et
// seulement ici, que la carte apprend l'existence d'une région : brancher une région livrée par la tâche « niveaux »
// (src/data/niveaux/) se fait en remplaçant son `contenu: null` par ses données, sans toucher aux écrans.
import { NIVEAUX_PAR_REGION, NOMBRE_REGIONS } from '../data/meta';
import { REGIONS, TEXTES_REGIONS } from '../data/niveaux/campagne';
import { NOEUDS_REGIONS, TRACES_REGIONS, type NoeudNiveau } from '../data/niveaux/carte-du-monde';
import type { TextesNiveau } from '../data/niveaux/region1';
import type { NiveauCampagne } from '../data/visuel';
import type { Point } from '../engine';
import { tCle } from '../i18n';
import type { CleTexte } from '../i18n';
import { DECOR_MONDE_REGION1, type DecorMonde } from '../render/carte-monde-decor';

/** Les données d'une région livrée. Les numéros de `niveaux` et de `textes` sont ceux de la campagne (1 à 100). */
export interface ContenuRegion {
  readonly niveaux: readonly NiveauCampagne[];
  /** Un nœud par niveau, dans l'ordre ; le `numero` d'un nœud est son numéro dans la région (1 à 10). */
  readonly noeuds: readonly NoeudNiveau[];
  /** `trace[i]` va du nœud i + 1 au nœud i + 2. */
  readonly trace: readonly (readonly Point[])[];
  readonly decor: readonly DecorMonde[];
  readonly textes: readonly TextesNiveau[];
}

export interface RegionMonde {
  /** 1 à 10. */
  readonly numero: number;
  /** Clé de texte du nom de la région. */
  readonly nom: CleTexte;
  /** Numéro de campagne de son premier niveau (1, 11, 21…). */
  readonly premierNiveau: number;
  /** null : ses niveaux ne sont pas encore dans le jeu (la carte l'annonce, sans rien dessiner). */
  readonly contenu: ContenuRegion | null;
}

function region(numero: number, nom: CleTexte, contenu: ContenuRegion | null): RegionMonde {
  return { numero, nom, premierNiveau: (numero - 1) * NIVEAUX_PAR_REGION + 1, contenu };
}

/**
 * Le contenu de la région `numero` (1 à 10) : ses niveaux et leurs textes (numéros de campagne), ses nœuds (numéros 1 à 10) et son
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
  return { niveaux, noeuds, trace, decor: numero === 1 ? DECOR_MONDE_REGION1 : [], textes };
}

export const REGIONS_MONDE: readonly RegionMonde[] = Array.from({ length: NOMBRE_REGIONS }, (_, i) =>
  region(i + 1, `region.${String(i + 1)}` as CleTexte, contenuDeRegion(i + 1)),
);

/** Niveaux des régions d'avant : ce qu'on ajoute au numéro d'un nœud de la région pour avoir le niveau de campagne. */
export function decalageDeRegion(r: RegionMonde): number {
  return r.premierNiveau - 1;
}

/** Le niveau de campagne de ce numéro (1 à 100), dans les régions livrées ; undefined sinon. */
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
