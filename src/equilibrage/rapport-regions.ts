// Section du rapport d'équilibrage pour les régions 2 à 5 (jalon 3, tâche 6) et pour les défis des régions 1 à 5. Les bandes de la
// région 1 sont celles de rapport.ts ; les mêmes bandes (et celle des défis) s'imposent à chacune des régions 2 à 5 : les écarts
// listés ici font échouer `npm run balance` pour Chaton, l'absence de défense et les défis ; ceux de Matou et de Vieux Sage sont suspendus.
import { ecartsDeRegion, ecartsDefis, nomDuDieu } from './bandes';
import { DEFIS_EVALUES, DIEUX_EVALUES, DIFFICULTES_EVALUEES, dieuxDe, partiesDe, synthetiser, trouver, type Evaluation } from './campagne';

/** Niveaux par région : le numéro de campagne se range par dizaines. */
const NIVEAUX_PAR_REGION = 10;

const THEMES: Readonly<Record<number, string>> = {
  1: 'le Village Affamé',
  2: 'les Champs Brûlés',
  3: 'le Bourg des Bûchers',
  4: 'les Marais de l’Ordalie',
  5: 'la Ville Pestiférée',
};

const NOM_DIFFICULTE: Readonly<Record<string, string>> = { chaton: 'Chaton', matou: 'Matou', vieux_sage: 'Vieux Sage', heroique: 'Héroïque', fer: 'Fer' };

/** Les évaluations des niveaux d'une région (numéros de campagne, 10 par région). */
export function evaluationsDeRegion(evaluations: readonly Evaluation[], region: number): Evaluation[] {
  const premier = (region - 1) * NIVEAUX_PAR_REGION + 1;
  return evaluations.filter((e) => e.niveau >= premier && e.niveau < premier + NIVEAUX_PAR_REGION);
}

/** Les écarts aux bandes d'une région, chacun précédé de son numéro de région. */
export function ecartsDeLaRegion(evaluations: readonly Evaluation[], region: number): string[] {
  return ecartsDeRegion(evaluationsDeRegion(evaluations, region)).map((e) => `Région ${String(region)} : ${e}`);
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
    `Écarts aux bandes : ${ecarts.length === 0 ? 'aucun.' : String(ecarts.length)}`,
    ...(ecarts.length === 0 ? [] : ['', ...ecarts.map((e) => `- ${e}`)]),
  ].join('\n');
}

/**
 * Le texte de la section des régions `regions` (2 à 5), à ajouter au rapport principal. Aucune date ni durée de calcul : le
 * même équilibrage donne le même texte.
 */
export function redigerRegions(evaluations: readonly Evaluation[], regions: readonly number[]): string {
  return [
    '## Régions 2 à 5',
    '',
    'Les bandes de la région 1 (plus haut) sont mesurées sur chacune des régions 2 à 5, pour les trois dieux : mêmes bots, mêmes graines, ' +
      'mêmes difficultés, courbe de difficulté jugée sur la moyenne des dieux, écart entre dieux comme au jalon 2. Les écarts de Chaton, ' +
      'd’absence de défense et des défis font échouer `npm run balance` ; ceux de Matou et de Vieux Sage (courbe et écart entre dieux ' +
      'compris) sont suspendus (voir bandes.ts) : listés, ils ne bloquent pas.',
    '',
    ...regions.flatMap((r) => [sectionRegion(evaluations, r), '']),
  ].join('\n');
}

function sectionDefisRegion(evaluations: readonly Evaluation[], region: number): string {
  const deLaRegion = evaluationsDeRegion(evaluations, region);
  const dieux = DIEUX_EVALUES.filter((d) => dieuxDe(deLaRegion).includes(d));
  if (deLaRegion.length === 0 || dieux.length === 0) return `### Région ${String(region)}\n\nPas d’évaluation des défis pour cette région.`;
  const parDefi = DEFIS_EVALUES.flatMap((defi) => [
    ...dieux.map((dieu) => {
      const s = synthetiser(partiesDe(deLaRegion, defi, 'soigneux', dieu));
      return [NOM_DIFFICULTE[defi] ?? defi, nomDuDieu(dieu), victoires(deLaRegion, defi, 'soigneux', undefined, dieu), un(s.viesMoyennes)];
    }),
    [NOM_DIFFICULTE[defi] ?? defi, 'les trois', victoires(deLaRegion, defi, 'soigneux'), un(synthetiser(partiesDe(deLaRegion, defi, 'soigneux')).viesMoyennes)],
  ]);
  const niveaux = [...new Set(deLaRegion.map((e) => e.niveau))].sort((a, b) => a - b);
  const parNiveau = niveaux.map((niveau) => [String(niveau), ...DEFIS_EVALUES.map((defi) => victoires(deLaRegion, defi, 'soigneux', niveau))]);
  const ecarts = ecartsDefis(deLaRegion);
  return [
    `### Région ${String(region)} : ${THEMES[region] ?? ''}`,
    '',
    tableau(['Défi', 'Dieu', 'Soigneux : réussites', 'Soigneux : vies restantes'], parDefi),
    '',
    tableau(['Niveau', 'Héroïque, soigneux (trois dieux)', 'Fer, soigneux (trois dieux)'], parNiveau),
    '',
    `Écarts aux bandes des défis : ${ecarts.length === 0 ? 'aucun.' : String(ecarts.length)}`,
    ...(ecarts.length === 0 ? [] : ['', ...ecarts.map((e) => `- ${e}`)]),
  ].join('\n');
}

/** La section des défis des régions `regions` : réussite du soigneux (bande 40 à 90 % par région et par défi). */
export function redigerDefis(evaluations: readonly Evaluation[], regions: readonly number[]): string {
  return [
    '## Défis, régions 1 à 5',
    '',
    'Le bot soigneux joue les défis avec les règles de Matou, sans objet ni amélioration : Héroïque (1 vie, groupes d’élite) et Fer ' +
      '(toutes les vagues en une, deux familles de tours). Il cherche sa variante sur les graines d’entraînement du défi lui-même, ' +
      'puis joue les dix graines d’évaluation. Bande : entre 40 et 90 % de réussites pour chaque défi de chaque région, trois dieux ' +
      'confondus.',
    '',
    ...regions.flatMap((r) => [sectionDefisRegion(evaluations, r), '']),
  ].join('\n');
}
