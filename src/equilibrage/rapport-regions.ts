// Section du rapport d'équilibrage pour les régions 2 à 5 : premier passage du jalon 3 (tâche 4). Les bandes de la région 1
// s'appliquent au rapport principal (rapport.ts) ; celles des régions 2 à 5 ne sont pas encore imposées (tâche 6, équilibrage
// fin) : on donne les chiffres par région, difficulté et dieu, et les écarts aux bandes à titre d'information.
import {
  ecartsChaton,
  ecartsCourbe,
  ecartsEntreDieux,
  ecartsMatou,
  ecartsSansDefense,
  ecartsVieuxSage,
  nomDuDieu,
} from './bandes';
import { DIEUX_EVALUES, DIFFICULTES_EVALUEES, dieuxDe, partiesDe, synthetiser, trouver, type Evaluation } from './campagne';

/** Niveaux par région : le numéro de campagne se range par dizaines. */
const NIVEAUX_PAR_REGION = 10;

const THEMES: Readonly<Record<number, string>> = {
  1: 'le Village Affamé',
  2: 'les Champs Brûlés',
  3: 'le Bourg des Bûchers',
  4: 'les Marais de l’Ordalie',
  5: 'la Ville Pestiférée',
};

const NOM_DIFFICULTE: Readonly<Record<string, string>> = { chaton: 'Chaton', matou: 'Matou', vieux_sage: 'Vieux Sage' };

/** Les évaluations des niveaux d'une région (numéros de campagne, 10 par région). */
export function evaluationsDeRegion(evaluations: readonly Evaluation[], region: number): Evaluation[] {
  const premier = (region - 1) * NIVEAUX_PAR_REGION + 1;
  return evaluations.filter((e) => e.niveau >= premier && e.niveau < premier + NIVEAUX_PAR_REGION);
}

/** Les écarts aux bandes d'une région, sans la puissance des tours (qui ne dépend pas de la région). */
export function ecartsDeRegion(evaluations: readonly Evaluation[]): string[] {
  return [
    ...ecartsChaton(evaluations),
    ...ecartsMatou(evaluations),
    ...ecartsCourbe(evaluations),
    ...ecartsVieuxSage(evaluations),
    ...ecartsEntreDieux(evaluations),
    ...ecartsSansDefense(evaluations),
  ];
}

function pct(x: number): string {
  return `${String(Math.round(x * 100))} %`;
}

function un(x: number): string {
  return (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
}

function tableau(entetes: readonly string[], lignes: readonly (readonly string[])[]): string {
  return [`| ${entetes.join(' | ')} |`, `| ${entetes.map(() => '---').join(' | ')} |`, ...lignes.map((l) => `| ${l.join(' | ')} |`)].join('\n');
}

function victoires(evaluations: readonly Evaluation[], difficulte: string, bot: 'naif' | 'soigneux' | 'inactif', niveau?: number, dieu?: string): string {
  const parties = evaluations
    .filter((e) => e.difficulte === difficulte && e.bot === bot && (niveau === undefined || e.niveau === niveau) && (dieu === undefined || e.dieu === dieu))
    .flatMap((e) => [...e.parties]);
  if (parties.length === 0) return '—';
  const s = synthetiser(parties);
  return `${pct(s.tauxVictoire)} (${String(s.victoires)}/${String(s.parties)})`;
}

function sectionRegion(evaluations: readonly Evaluation[], region: number): string {
  const titre = `### Région ${String(region)} : ${THEMES[region] ?? ''}`;
  const deLaRegion = evaluationsDeRegion(evaluations, region);
  if (deLaRegion.length === 0) return `${titre}\n\nPas d’évaluation pour cette région.`;
  const dieux = DIEUX_EVALUES.filter((d) => dieuxDe(deLaRegion).includes(d));
  const parDieu = DIFFICULTES_EVALUEES.flatMap((difficulte) =>
    dieux.map((dieu) => {
      const soigneux = synthetiser(partiesDe(deLaRegion, difficulte, 'soigneux', dieu));
      return [
        NOM_DIFFICULTE[difficulte] ?? difficulte,
        nomDuDieu(dieu),
        victoires(deLaRegion, difficulte, 'soigneux', undefined, dieu),
        victoires(deLaRegion, difficulte, 'naif', undefined, dieu),
        un(soigneux.viesMoyennes),
        String(Math.round(soigneux.aretesFinMoyennes)),
        victoires(deLaRegion, difficulte, 'inactif', undefined, dieu),
      ];
    }),
  );
  const niveaux = [...new Set(deLaRegion.map((e) => e.niveau))].sort((a, b) => a - b);
  const parNiveau = niveaux.map((niveau) => {
    const soigneux = trouver(deLaRegion, niveau, 'matou', 'soigneux');
    const naif = synthetiser(partiesDe(deLaRegion.filter((e) => e.niveau === niveau), 'matou', 'naif'));
    const sage = synthetiser(partiesDe(deLaRegion.filter((e) => e.niveau === niveau), 'vieux_sage', 'soigneux'));
    return [
      String(niveau),
      victoires(deLaRegion, 'matou', 'soigneux', niveau),
      victoires(deLaRegion, 'matou', 'naif', niveau),
      un(naif.viesMoyennes),
      soigneux ? String(Math.round(synthetiser(partiesDe(deLaRegion.filter((e) => e.niveau === niveau), 'matou', 'soigneux')).aretesFinMoyennes)) : '—',
      victoires(deLaRegion, 'vieux_sage', 'soigneux', niveau),
      un(sage.viesMoyennes),
      victoires(deLaRegion, 'matou', 'inactif', niveau),
    ];
  });
  const ecarts = ecartsDeRegion(deLaRegion);
  return [
    titre,
    '',
    'Par difficulté et par dieu (tous les niveaux de la région) :',
    '',
    tableau(['Difficulté', 'Dieu', 'Soigneux : victoires', 'Naïf : victoires', 'Soigneux : vies restantes', 'Soigneux : arêtes en fin', 'Sans défense : victoires'], parDieu),
    '',
    'Par niveau (trois dieux ensemble) :',
    '',
    tableau(['Niveau', 'Matou, soigneux', 'Matou, naïf', 'Matou, naïf : vies restantes', 'Matou, soigneux : arêtes en fin', 'Vieux Sage, soigneux', 'Vieux Sage, soigneux : vies restantes', 'Matou, sans défense'], parNiveau),
    '',
    `Écarts aux bandes (à titre d’information) : ${ecarts.length === 0 ? 'aucun.' : String(ecarts.length)}`,
    ...(ecarts.length === 0 ? [] : ['', ...ecarts.map((e) => `- ${e}`)]),
  ].join('\n');
}

/**
 * Le texte de la section des régions `regions` (2 à 5), à ajouter au rapport principal. Aucune date ni durée de calcul : le
 * même équilibrage donne le même texte.
 */
export function redigerRegions(evaluations: readonly Evaluation[], regions: readonly number[]): string {
  return [
    '## Régions 2 à 5 : premier passage',
    '',
    'Les bandes de la région 1 (plus haut) sont imposées. Celles des régions 2 à 5 ne le sont pas encore : c’est le premier passage du ' +
      'simulateur sur ces niveaux (arêtes de départ réglées grossièrement, rien d’absurde), l’équilibrage fin et l’ajout des bandes ' +
      'viennent à la tâche 6 du jalon 3. Chiffres de ce passage, mêmes dieux, mêmes bots et mêmes graines que pour la région 1.',
    '',
    ...regions.flatMap((r) => [sectionRegion(evaluations, r), '']),
  ].join('\n');
}
