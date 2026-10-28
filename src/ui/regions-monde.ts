// Les régions que la carte du monde montre (jalon 3 : les cinq premières) et ce qu'elles contiennent : les 10 niveaux, leurs
// nœuds sur le fond de 512 × 288, le tracé de la route, le décor de la carte et les textes des niveaux. C'est ici, et
// seulement ici, que la carte apprend l'existence d'une région : brancher une région livrée par la tâche « niveaux »
// (src/data/niveaux/) se fait en remplaçant son `contenu: null` par ses données, sans toucher aux écrans.
import { NIVEAUX_PAR_REGION } from '../data/meta';
import { NOEUDS_REGION1, TRACE_REGION1, type NoeudNiveau } from '../data/niveaux/carte-du-monde';
import { REGION1, TEXTES_REGION1, type TextesNiveau } from '../data/niveaux/region1';
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
  /** 1 à 5. */
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

export const REGIONS_MONDE: readonly RegionMonde[] = [
  region(1, 'region.1', { niveaux: REGION1, noeuds: NOEUDS_REGION1, trace: TRACE_REGION1, decor: DECOR_MONDE_REGION1, textes: TEXTES_REGION1 }),
  // Régions 2 à 5 : à brancher quand la tâche « niveaux » du jalon 3 livre leurs 40 niveaux, leurs cartes du monde et leurs textes.
  region(2, 'region.2', null),
  region(3, 'region.3', null),
  region(4, 'region.4', null),
  region(5, 'region.5', null),
];

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
