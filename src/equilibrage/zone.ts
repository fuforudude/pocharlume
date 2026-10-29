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

/** Part des arêtes de départ jouée par les mesures de zone, la difficulté et les graines : celles des tests et du rapport. */
export const PART_ARETES_ZONE = 0.45;
export const DIFFICULTE_ZONE = 'vieux_sage';
const GRAINES_ZONE: readonly number[] = [101, 102, 103, 104, 105, 106];
/** Niveaux ordinaires (régions 1 à 3) et niveaux de horde de l'échantillon, un échantillon de la campagne. */
export const NIVEAUX_ZONE_ORDINAIRES: readonly number[] = [4, 6, 8, 14, 15, 18, 22, 25];
export const NIVEAUX_ZONE_HORDE: readonly number[] = [7, 13, 17];

/** Taux de victoire moyen de chaque composition sur ces niveaux (trois dieux, `niveaux` numéros de campagne). */
export function moyennesZone(niveaux: readonly number[], niveauDe: (numero: number) => Niveau | undefined, dieux: readonly string[]): Record<Composition, number> {
  const taux: Record<Composition, number[]> = { sansZone: [], zoneSeule: [], caserne: [], casernePlusZone: [] };
  for (const numero of niveaux) {
    const niveau = niveauDe(numero);
    if (!niveau) throw new Error(`Niveau ${String(numero)} absent`);
    for (const dieu of dieux) {
      for (const m of mesurerZone(niveau, { dieu, difficulte: DIFFICULTE_ZONE, partAretes: PART_ARETES_ZONE, graines: GRAINES_ZONE, grainesEntrainement: [9001] })) taux[m.composition].push(m.tauxVictoire);
    }
  }
  const moyenne = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
  return Object.fromEntries(COMPOSITIONS.map((c) => [c, moyenne(taux[c])])) as Record<Composition, number>;
}

/** Section « La zone » du rapport d'équilibrage. */
export function redigerZone(ordinaires: Record<Composition, number>, hordes: Record<Composition, number>): string {
  const pct = (x: number): string => `${String(Math.round(x * 100))} %`;
  const ligne = (nom: string, m: Record<Composition, number>): string => `| ${nom} | ${pct(m.sansZone)} | ${pct(m.zoneSeule)} | ${pct(m.caserne)} | ${pct(m.casernePlusZone)} |`;
  return [
    '## La zone (jalon 5)',
    '',
    `Taux de victoire du soigneux, trois dieux, sans tour divine, ${String(Math.round(PART_ARETES_ZONE * 100))} % des arêtes de départ en Vieux Sage (sans quoi tout se gagne), avec quatre compositions de tours : sans zone (tir, magie), zone sans caserne (tir, magie, artillerie), caserne sans zone (caserne, tir, magie), caserne et zone. Niveaux ordinaires : ${NIVEAUX_ZONE_ORDINAIRES.join(', ')} ; niveaux de horde : ${NIVEAUX_ZONE_HORDE.join(', ')}.`,
    '',
    '| Niveaux | Sans zone | Zone, sans caserne | Caserne, sans zone | Caserne et zone |',
    '| --- | --- | --- | --- | --- |',
    ligne('Ordinaires', ordinaires),
    ligne('Horde', hordes),
    '',
    `Critères : ordinaires, la zone sans caserne ne gagne pas plus que sans zone (écart ${String(Math.round((ordinaires.zoneSeule - ordinaires.sansZone) * 100))} points, au plus 6 tolérés) ; avec caserne, la zone gagne ${String(Math.round((ordinaires.casernePlusZone - ordinaires.caserne) * 100))} points de plus (au moins 10) ; en horde, la zone gagne ${String(Math.round((hordes.zoneSeule - hordes.sansZone) * 100))} points de plus (au moins 20).`,
    '',
  ].join('\n');
}
