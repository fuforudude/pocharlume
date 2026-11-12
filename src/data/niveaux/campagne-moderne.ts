// La campagne « Temps modernes » (le DLC) : 3 régions de 10 niveaux, numérotés de 1 à 30 dans leur campagne. Les trois sont livrées : la Fac
// (plan-moderne-r1.ts, cartes-moderne-r1.ts, vagues-moderne-r1.ts), la Manif (…-r2) et la Préfecture (…-r3). Ici, leurs niveaux sont assemblés
// (chacun marqué `campagne: 'moderne'`, lui et son `niveau`), avec leurs nœuds, leur tracé et leurs textes sur la carte du monde. Tant qu'une
// région n'a pas ses 10 niveaux, ses 10 nœuds, son tracé et ses textes, la carte du DLC l'annonce « à venir » (src/ui/regions-monde.ts),
// sans planter.
import type { Point } from '../../engine/definitions';
import { NIVEAUX_PAR_REGION } from '../meta';
import { NOMBRE_REGIONS_MODERNE } from '../campagnes';
import type { NiveauCampagne } from '../visuel';
import type { NoeudNiveau } from './carte-du-monde';
import type { TextesNiveau } from './region1';
import { assemblerNiveauModerne } from './assemblage-moderne';
import { PLANS_MODERNE_R1 } from './plan-moderne-r1';
import { PLANS_MODERNE_R3 } from './plan-moderne-r3';
import { VAGUES_MODERNE_R1 } from './vagues-moderne-r1';
import { PLANS_MODERNE_R2 } from './plan-moderne-r2';
import { VAGUES_MODERNE_R2 } from './vagues-moderne-r2';
import { VAGUES_MODERNE_R3 } from './vagues-moderne-r3';

/** Les niveaux de la Fac (région 1 du DLC), assemblés depuis leur plan et leurs vagues figées. */
const REGION1_MODERNE: readonly NiveauCampagne[] = PLANS_MODERNE_R1.map((plan, i) => {
  const vagues = VAGUES_MODERNE_R1[i];
  if (!vagues) throw new Error(`Vagues figées manquantes pour le niveau moderne ${String(plan.numero)} : relancer npm run niveaux -- moderne`);
  return assemblerNiveauModerne(plan, vagues);
});

/** Les niveaux de la Manif (région 2 du DLC), assemblés depuis leur plan et leurs vagues figées. */
const REGION2_MODERNE: readonly NiveauCampagne[] = PLANS_MODERNE_R2.map((plan, i) => {
  const vagues = VAGUES_MODERNE_R2[i];
  if (!vagues) throw new Error(`Vagues figées manquantes pour le niveau moderne ${String(plan.numero)} : relancer npm run niveaux -- moderne`);
  return assemblerNiveauModerne(plan, vagues);
});

/** Les niveaux de la Préfecture (région 3 du DLC, niveaux 21 à 30), assemblés depuis leur plan et leurs vagues figées. */
const REGION3_MODERNE: readonly NiveauCampagne[] = PLANS_MODERNE_R3.map((plan, i) => {
  const vagues = VAGUES_MODERNE_R3[i];
  if (!vagues) throw new Error(`Vagues figées manquantes pour le niveau moderne ${String(plan.numero)} : relancer npm run niveaux -- moderne`);
  return assemblerNiveauModerne(plan, vagues);
});

/** Les niveaux du DLC, dans l'ordre (indice 0 = niveau 1). */
export const CAMPAGNE_MODERNE: readonly NiveauCampagne[] = [...REGION1_MODERNE, ...REGION2_MODERNE, ...REGION3_MODERNE];

/** Les niveaux de chaque région du DLC (indice 0 = la Fac), d'après leur numéro. */
export const REGIONS_MODERNE: readonly (readonly NiveauCampagne[])[] = Array.from({ length: NOMBRE_REGIONS_MODERNE }, (_, i) =>
  CAMPAGNE_MODERNE.filter((n) => Math.floor((n.numero - 1) / NIVEAUX_PAR_REGION) === i),
);

function noeud(numero: number, x: number, y: number): NoeudNiveau {
  return { numero, x, y, boss: numero === 10 };
}

function route(...points: [number, number][]): readonly Point[] {
  return points.map(([x, y]) => ({ x, y }));
}

/**
 * La Fac sur le fond de 512 × 288 : la route part de l'amphi (sud-ouest), longe les couloirs, traverse la cour et la bibliothèque, passe
 * par le resto U et le parvis, puis remonte par le piquet, l'AG et le hall jusqu'au rectorat (nord-est).
 */
const NOEUDS_FAC: readonly NoeudNiveau[] = [
  noeud(1, 48, 236),
  noeud(2, 120, 244),
  noeud(3, 184, 208),
  noeud(4, 132, 160),
  noeud(5, 196, 120),
  noeud(6, 268, 150),
  noeud(7, 336, 200),
  noeud(8, 404, 176),
  noeud(9, 372, 112),
  noeud(10, 444, 64),
];

/** Les 9 tronçons de la Fac : `TRACE_FAC[i]` va du nœud i + 1 au nœud i + 2, en couloirs à angle droit. */
const TRACE_FAC: readonly (readonly Point[])[] = [
  route([48, 236], [84, 236], [84, 244], [120, 244]),
  route([120, 244], [184, 244], [184, 208]),
  route([184, 208], [132, 208], [132, 160]),
  route([132, 160], [132, 120], [196, 120]),
  route([196, 120], [268, 120], [268, 150]),
  route([268, 150], [268, 200], [336, 200]),
  route([336, 200], [404, 200], [404, 176]),
  route([404, 176], [404, 140], [372, 140], [372, 112]),
  route([372, 112], [372, 64], [444, 64]),
];

/**
 * La Manif sur le fond de 512 × 288 : le cortège part du rendez-vous (ouest), suit le boulevard et ses carrefours, passe les abribus et la
 * nasse, fait le tour de la place de la République, puis remonte derrière le cortège de tête et les camionnettes jusqu'au grand carrefour
 * (est), où attend le Centaure.
 */
const NOEUDS_MANIF: readonly NoeudNiveau[] = [
  noeud(1, 40, 152),
  noeud(2, 104, 120),
  noeud(3, 156, 168),
  noeud(4, 112, 228),
  noeud(5, 196, 236),
  noeud(6, 264, 196),
  noeud(7, 252, 116),
  noeud(8, 332, 84),
  noeud(9, 392, 152),
  noeud(10, 468, 120),
];

/** Les 9 tronçons de la Manif : `TRACE_MANIF[i]` va du nœud i + 1 au nœud i + 2, en boulevards à angle droit. */
const TRACE_MANIF: readonly (readonly Point[])[] = [
  route([40, 152], [72, 152], [72, 120], [104, 120]),
  route([104, 120], [156, 120], [156, 168]),
  route([156, 168], [156, 200], [112, 200], [112, 228]),
  route([112, 228], [112, 236], [196, 236]),
  route([196, 236], [264, 236], [264, 196]),
  route([264, 196], [264, 156], [252, 156], [252, 116]),
  route([252, 116], [252, 84], [332, 84]),
  route([332, 84], [392, 84], [392, 152]),
  route([392, 152], [432, 152], [432, 120], [468, 120]),
];

/**
 * La Préfecture sur le fond de 512 × 288 : la route part des grilles (sud-ouest), traverse la cour d'honneur et les jardins, gravit le
 * perron, passe sous la colonnade, recule vers le parking des fourgons, puis monte par les archives, la salle des fêtes et les toits
 * jusqu'au bureau du préfet (nord-est).
 */
const NOEUDS_PREFECTURE: readonly NoeudNiveau[] = [
  noeud(1, 56, 240),
  noeud(2, 132, 216),
  noeud(3, 212, 244),
  noeud(4, 276, 196),
  noeud(5, 204, 152),
  noeud(6, 116, 124),
  noeud(7, 176, 72),
  noeud(8, 268, 96),
  noeud(9, 356, 136),
  noeud(10, 444, 64),
];

/** Les 9 tronçons de la Préfecture : `TRACE_PREFECTURE[i]` va du nœud i + 1 au nœud i + 2, en couloirs à angle droit. */
const TRACE_PREFECTURE: readonly (readonly Point[])[] = [
  route([56, 240], [96, 240], [96, 216], [132, 216]),
  route([132, 216], [172, 216], [172, 244], [212, 244]),
  route([212, 244], [276, 244], [276, 196]),
  route([276, 196], [276, 152], [204, 152]),
  route([204, 152], [116, 152], [116, 124]),
  route([116, 124], [116, 72], [176, 72]),
  route([176, 72], [268, 72], [268, 96]),
  route([268, 96], [268, 136], [356, 136]),
  route([356, 136], [444, 136], [444, 64]),
];

/** Nœuds de la carte du monde de chaque région du DLC (numéros 1 à 10 dans la région) : vides tant que le contenu n'est pas livré. */
export const NOEUDS_REGIONS_MODERNE: readonly (readonly NoeudNiveau[])[] = [NOEUDS_FAC, NOEUDS_MANIF, NOEUDS_PREFECTURE];
/** Tracé de la route de chaque région du DLC (9 tronçons par région livrée). */
export const TRACES_REGIONS_MODERNE: readonly (readonly (readonly Point[])[])[] = [TRACE_FAC, TRACE_MANIF, TRACE_PREFECTURE];
/** Nom et phrase d'ambiance de chaque niveau, par région (numéros du DLC, 1 à 30). */
export const TEXTES_REGIONS_MODERNE: readonly (readonly TextesNiveau[])[] = [
  PLANS_MODERNE_R1.map((p) => ({ numero: p.numero, nom: p.nom, ambiance: p.ambiance })),
  PLANS_MODERNE_R2.map((p) => ({ numero: p.numero, nom: p.nom, ambiance: p.ambiance })),
  PLANS_MODERNE_R3.map((p) => ({ numero: p.numero, nom: p.nom, ambiance: p.ambiance })),
];

/** Le niveau du DLC de ce numéro (1 à 30), ou `undefined` s'il n'est pas livré. */
export function niveauModerne(numero: number): NiveauCampagne | undefined {
  return CAMPAGNE_MODERNE.find((n) => n.numero === numero);
}
