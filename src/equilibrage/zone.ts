// Ce que vaut la zone (jalon 5) : mesure du taux de victoire du bot soigneux avec quatre compositions de tours, sur un niveau, pour un
// dieu. La zone, c'est la famille artillerie (catapulte, mortier, baliste à chaînes). Les compositions :
//   - `sansZone`     : tir et magie seulement ;
//   - `zoneSeule`    : tir, magie et artillerie, sans caserne (rien n'arrête les ennemis) ;
//   - `caserne`      : caserne, tir et magie (des soldats qui bloquent, sans zone) ;
//   - `casernePlusZone` : les quatre familles (bloquer, puis frapper en zone).
// Sans la tour divine du dieu (elle suit la famille du dieu : elle fausserait la comparaison). Un taux de victoire sature à 100 %
// quand le niveau est facile : on joue donc avec une part des arêtes de départ (`partAretes`) et dans la difficulté demandée, et on
// donne aussi les vies restantes moyennes, qui, elles, ne saturent pas.
import type { IdFamille, Niveau } from '../engine';
import { creerBotSoigneux, optimiserBot, VARIANTES } from './bot-soigneux';
import { GRAINES_ENTRAINEMENT, GRAINES_EVALUATION } from './campagne';
import { jouerPartie } from './simulation';

export type Composition = 'sansZone' | 'zoneSeule' | 'caserne' | 'casernePlusZone';

export const FAMILLES_COMPOSITION: Readonly<Record<Composition, readonly IdFamille[]>> = {
  sansZone: ['tir', 'magie'],
  zoneSeule: ['tir', 'magie', 'artillerie'],
  caserne: ['caserne', 'tir', 'magie'],
  casernePlusZone: ['caserne', 'tir', 'magie', 'artillerie'],
};

export const COMPOSITIONS = Object.keys(FAMILLES_COMPOSITION) as Composition[];

export interface MesureComposition {
  readonly composition: Composition;
  readonly parties: number;
  readonly victoires: number;
  readonly tauxVictoire: number;
  /** Vies restantes moyennes (0 pour une défaite). */
  readonly viesMoyennes: number;
}

export interface OptionsMesureZone {
  readonly dieu: string;
  readonly difficulte?: string;
  /** Part des arêtes de départ du niveau (1 par défaut) : sous 1, le niveau ne se gagne plus à tout coup et les compositions se distinguent. */
  readonly partAretes?: number;
  readonly graines?: readonly number[];
  readonly grainesEntrainement?: readonly number[];
}

/** Taux de victoire du soigneux de chaque composition sur ce niveau. */
export function mesurerZone(niveau: Niveau, o: OptionsMesureZone): MesureComposition[] {
  const graines = o.graines ?? GRAINES_EVALUATION;
  const entrainement = o.grainesEntrainement ?? GRAINES_ENTRAINEMENT;
  const difficulte = o.difficulte ?? 'matou';
  const joue: Niveau = { ...niveau, aretesDepart: Math.round(niveau.aretesDepart * (o.partAretes ?? 1)) };
  return COMPOSITIONS.map((composition) => {
    const options = { tourDivine: false, familles: FAMILLES_COMPOSITION[composition] };
    const { variante } = optimiserBot(joue, difficulte, entrainement, { dieu: o.dieu }, options, VARIANTES);
    const resultats = graines.map((graine) => jouerPartie(joue, creerBotSoigneux({ ...options, variante }), { graine, difficulte, dieu: o.dieu }));
    const victoires = resultats.filter((r) => r.statut === 'victoire').length;
    return {
      composition,
      parties: resultats.length,
      victoires,
      tauxVictoire: victoires / resultats.length,
      viesMoyennes: resultats.reduce((somme, r) => somme + r.vies, 0) / resultats.length,
    };
  });
}
