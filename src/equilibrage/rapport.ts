// Rédaction de balance-report.md à partir des évaluations. Aucune date ni durée de calcul dans le texte : le
// même équilibrage donne le même rapport, octet pour octet.
import { DIFFICULTES } from '../data/difficultes';
import { EQUILIBRAGE } from '../data/equilibrage';
import { FAMILLES, TOURS } from '../data/tours';
import { VERSION_DONNEES } from '../data/version';
import { t, type CleTexte } from '../i18n';
import { BANDES, correlationDeRang, courbeDifficulte, verifierBandes } from './bandes';
import { DIFFICULTES_EVALUEES, synthetiser, trouver, type Evaluation, type IdBot } from './campagne';
import { puissancesParPalier } from './puissance';

const NOM_DIFFICULTE: Readonly<Record<string, string>> = { chaton: 'Chaton', matou: 'Matou', vieux_sage: 'Vieux Sage' };

function nomDifficulte(d: string): string {
  return NOM_DIFFICULTE[d] ?? d;
}

function pct(x: number): string {
  return `${String(Math.round(x * 100))} %`;
}

/** Un chiffre après la virgule, à la française. */
function un(x: number): string {
  return (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
}

function entier(x: number): string {
  return String(Math.round(x));
}

function tableau(entetes: readonly string[], lignes: readonly (readonly string[])[]): string {
  return [`| ${entetes.join(' | ')} |`, `| ${entetes.map(() => '---').join(' | ')} |`, ...lignes.map((l) => `| ${l.join(' | ')} |`)].join('\n');
}

function victoires(e: Evaluation | undefined): string {
  if (!e) return '—';
  const s = synthetiser(e.parties);
  return `${pct(s.tauxVictoire)} (${String(s.victoires)}/${String(s.parties)})`;
}

function vagueMeurtriere(e: Evaluation | undefined): string {
  if (!e) return '—';
  const s = synthetiser(e.parties);
  return s.vagueMeurtriere === null ? 'aucune' : `${String(s.vagueMeurtriere)} (${un(s.viesPerduesVagueMeurtriere)} vies)`;
}

interface LigneChoix {
  readonly libelle: string;
  readonly fois: number;
}

/** Constructions par famille et spécialisations par voie du bot soigneux, tous niveaux d'une difficulté confondus. */
function compterChoix(evaluations: readonly Evaluation[], difficulte: string): LigneChoix[] {
  const compte = new Map<string, number>();
  for (const e of evaluations) {
    if (e.bot !== 'soigneux' || e.difficulte !== difficulte) continue;
    for (const p of e.parties) {
      for (const c of p.choix) {
        const clef = c.voie === undefined ? c.famille : `${c.famille} ${c.voie}`;
        compte.set(clef, (compte.get(clef) ?? 0) + 1);
      }
    }
  }
  const lignes = FAMILLES.flatMap((f) => {
    const famille = TOURS[f];
    return [
      { clef: f, libelle: `${t(famille.niveaux[0].nom as CleTexte)} (construction)` },
      { clef: `${f} A`, libelle: `${t(famille.specialisations.A.nom as CleTexte)} (spécialisation A)` },
      { clef: `${f} B`, libelle: `${t(famille.specialisations.B.nom as CleTexte)} (spécialisation B)` },
    ].map(({ clef, libelle }) => ({ libelle, fois: compte.get(clef) ?? 0 }));
  });
  return lignes.sort((a, b) => b.fois - a.fois);
}

export function redigerRapport(evaluations: readonly Evaluation[], graines: number): string {
  const sortie: string[] = [];
  const ecarts = verifierBandes(evaluations);
  sortie.push(
    '# Rapport d’équilibrage',
    '',
    'Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau de la région 1 est rejoué sans',
    `affichage dans les trois difficultés par deux bots, sur ${String(graines)} graines chacun (version des données ${String(VERSION_DONNEES)}).`,
    '',
    '- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (socle, famille, niveau,',
    '  spécialisation), après une petite recherche entre dix variantes (5 préférences × 2 diversités) jouées sur des graines d’entraînement ; place le',
    '  héros dans la zone de feu de ses tours, lance la Chute du Colosse sur les grappes d’ennemis et les Renforts devant ses tours,',
    '  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter.',
    '- **Naïf** : construit sur les socles proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans',
    '  sorts ni ordres au héros, sans appel de vague en avance.',
    '- **Sans défense** : aucune action, seul le héros à son poste.',
    '',
    '## Bandes cibles',
    '',
    ecarts.length === 0 ? 'Toutes les bandes sont respectées.' : `**${String(ecarts.length)} écart(s)** :\n\n${ecarts.map((e) => `- ${e}`).join('\n')}`,
    '',
  );

  const taux = (difficulte: string, bot: IdBot): string => {
    const parties = evaluations.filter((e) => e.difficulte === difficulte && e.bot === bot).flatMap((e) => [...e.parties]);
    return pct(synthetiser(parties).tauxVictoire);
  };
  sortie.push(
    tableau(
      ['Difficulté', 'Naïf', 'Bande naïf', 'Soigneux', 'Bande soigneux', 'Sans défense'],
      DIFFICULTES_EVALUEES.map((d) => [
        nomDifficulte(d),
        taux(d, 'naif'),
        d === 'chaton' ? '100 %' : d === 'matou' ? `${pct(BANDES.matou.naifMin)} à ${pct(BANDES.matou.naifMax)}` : '—',
        taux(d, 'soigneux'),
        d === 'chaton' ? '—' : d === 'matou' ? '100 %' : `au moins ${pct(BANDES.vieux_sage.soigneuxMin)}`,
        taux(d, 'inactif'),
      ]),
    ),
    '',
    `Vies de départ : ${DIFFICULTES_EVALUEES.map((d) => `${nomDifficulte(d)} ${String(DIFFICULTES[d].vies)}`).join(', ')}. ` +
      `Facteur sur les arêtes de départ des niveaux : ${DIFFICULTES_EVALUEES.map((d) => `${nomDifficulte(d)} ×${String(DIFFICULTES[d].aretesDepart)}`).join(', ')}.`,
    '',
  );

  const niveaux = [...new Set(evaluations.map((e) => e.niveau))].sort((a, b) => a - b);
  for (const d of DIFFICULTES_EVALUEES) {
    sortie.push(
      `## ${nomDifficulte(d)}`,
      '',
      'Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).',
      'Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.',
      '',
      tableau(
        ['Niveau', 'Naïf : victoires', 'Naïf : vies', 'Soigneux : victoires', 'Soigneux : vies', 'Arêtes inutilisées (naïf / soigneux)', 'Vague la plus meurtrière (naïf / soigneux)', 'Durée (naïf / soigneux)', 'Sans défense'],
        niveaux.map((n) => {
          const naif = trouver(evaluations, n, d, 'naif');
          const soigneux = trouver(evaluations, n, d, 'soigneux');
          const inactif = trouver(evaluations, n, d, 'inactif');
          const sn = naif ? synthetiser(naif.parties) : null;
          const ss = soigneux ? synthetiser(soigneux.parties) : null;
          const si = inactif ? synthetiser(inactif.parties) : null;
          return [
            String(n),
            victoires(naif),
            sn ? un(sn.viesMoyennes) : '—',
            victoires(soigneux),
            ss ? un(ss.viesMoyennes) : '—',
            `${sn ? entier(sn.aretesFinMoyennes) : '—'} / ${ss ? entier(ss.aretesFinMoyennes) : '—'}`,
            `${vagueMeurtriere(naif)} / ${vagueMeurtriere(soigneux)}`,
            `${sn ? entier(sn.secondesMoyennes) : '—'} / ${ss ? entier(ss.secondesMoyennes) : '—'}`,
            si ? (si.victoires > 0 ? `gagné ${String(si.victoires)}/${String(si.parties)}` : `perdu en ${entier(si.secondesMoyennes)} s`) : '—',
          ];
        }),
      ),
      '',
    );
  }

  const courbe = courbeDifficulte(evaluations);
  const rho = correlationDeRang(courbe);
  const plusDur = courbe.reduce((a, c) => (c.vies < a.vies ? c : a), courbe[0] ?? { niveau: 0, vies: 0 });
  sortie.push(
    '## Courbe de difficulté',
    '',
    'Vies restantes moyennes du bot naïf en Matou, niveau par niveau : elle doit globalement décroître, le niveau 10 étant le plus dur.',
    '',
    tableau(['Niveau', ...courbe.map((c) => String(c.niveau))], [['Vies restantes', ...courbe.map((c) => un(c.vies))]]),
    '',
    `Corrélation de rang (Spearman) entre le niveau et les vies restantes : ${un(rho)} (−1 = décroissance parfaite). ` +
      `Niveau le plus dur : ${String(plusDur.niveau)} (${un(plusDur.vies)} vies).`,
    '',
    '## Variante choisie par le bot soigneux',
    '',
    'La recherche en amont garde, pour chaque niveau et chaque difficulté, la préférence de famille qui joue le mieux sur les graines d’entraînement.',
    '',
    tableau(
      ['Niveau', ...DIFFICULTES_EVALUEES.map(nomDifficulte)],
      niveaux.map((n) => [String(n), ...DIFFICULTES_EVALUEES.map((d) => trouver(evaluations, n, d, 'soigneux')?.variante?.nom ?? '—')]),
    ),
    '',
    '## Tours choisies par le bot soigneux',
    '',
    'Constructions par famille et spécialisations par voie, sur toutes les parties du bot soigneux, de la plus à la moins choisie.',
    '',
  );
  for (const d of DIFFICULTES_EVALUEES) {
    const lignes = compterChoix(evaluations, d);
    const plus = lignes[0];
    const moins = lignes[lignes.length - 1];
    sortie.push(
      `**${nomDifficulte(d)}** : la plus choisie, ${plus?.libelle ?? '—'} (${String(plus?.fois ?? 0)} fois) ; la moins choisie, ${moins?.libelle ?? '—'} (${String(moins?.fois ?? 0)} fois).`,
      '',
      tableau(['Choix', 'Fois'], lignes.map((l) => [l.libelle, String(l.fois)])),
      '',
    );
  }

  sortie.push(
    '## Puissance des tours par palier de coût',
    '',
    `Puissance = DPS efficace moyen × portée ÷ coût cumulé. Chaque tour doit rester à ±${pct(EQUILIBRAGE.tolerancePuissance)} de la moyenne de son palier (palier 4 : les spécialisations).`,
    '',
    tableau(
      ['Palier', 'Tour', 'Coût cumulé', 'Puissance', 'Écart à la moyenne'],
      puissancesParPalier().map((p) => [
        String(p.palier),
        t(p.nom as CleTexte),
        String(p.coutCumule),
        un(p.puissance),
        `${p.ecart >= 0 ? '+' : '−'}${un(Math.abs(p.ecart) * 100)} %`,
      ]),
    ),
    '',
  );
  return sortie.join('\n');
}
