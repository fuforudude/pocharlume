// Rédaction de balance-report.md à partir des évaluations. Aucune date ni durée de calcul dans le texte : le
// même équilibrage donne le même rapport, octet pour octet.
import { NIVEAU_TOUT_OUVERT, nouveautesDuNiveau } from '../data/deblocage';
import { DIEUX } from '../data/dieux';
import { DIFFICULTES } from '../data/difficultes';
import { EQUILIBRAGE } from '../data/equilibrage';
import { HEROS } from '../data/heros';
import { HEROS_PAR_DIEU } from '../data/meta';
import { FAMILLES, TOURS } from '../data/tours';
import { VERSION_DONNEES } from '../data/version';
import { t, type CleTexte } from '../i18n';
import { BANDES, correlationDeRang, courbeDifficulte, courbeMoyenne, estSuspendu, nomDuDieu, niveauxAvecPertes, verifierBandes } from './bandes';
import {
  DIEUX_EVALUES,
  DIFFICULTES_EVALUEES,
  dieuxDe,
  duDieu,
  partiesDe,
  synthetiser,
  trouver,
  type Evaluation,
  type EvaluationProfil,
  type Synthese,
} from './campagne';
import { puissancesDivines, puissancesParPalier } from './puissance';
import type { ResultatPartie } from './simulation';

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

/** Écart signé, avec un vrai signe moins. */
function signe(x: number, decimales = 1): string {
  const arrondi = Math.round(x * 10 ** decimales) / 10 ** decimales;
  return `${arrondi >= 0 ? '+' : '−'}${Math.abs(arrondi).toFixed(decimales).replace('.', ',')}`;
}

function tableau(entetes: readonly string[], lignes: readonly (readonly string[])[]): string {
  return [`| ${entetes.join(' | ')} |`, `| ${entetes.map(() => '---').join(' | ')} |`, ...lignes.map((l) => `| ${l.join(' | ')} |`)].join('\n');
}

/**
 * Le déblocage progressif des tours (src/data/deblocage.ts), tiré de la table : ce que chaque niveau de la région 1 ouvre. Les bots
 * s'y plient comme le joueur ; les chiffres des niveaux 1 à 10 plus haut se lisent avec lui.
 */
export function sectionDeblocage(): string[] {
  const lignes: string[][] = [];
  for (let niveau = 1; niveau < NIVEAU_TOUT_OUVERT; niveau++) {
    const ouverts = nouveautesDuNiveau(niveau).map((d) => {
      const nom = t(`famille.${d.famille}`);
      if (d.famille === 'divine') return nom;
      return d.palier === 4 ? `${nom} (spécialisations A et B)` : `${nom} (niveau ${String(d.palier)})`;
    });
    if (ouverts.length > 0) lignes.push([String(niveau), ouverts.join(', ')]);
  }
  return [
    '## Déblocage progressif des tours',
    '',
    `Ce qu’on peut construire dépend du seul numéro du niveau joué, défis compris (src/data/deblocage.ts) : les niveaux 1 à ${String(NIVEAU_TOUT_OUVERT - 1)} se jouent avec moins d’outils, et les bots s’y plient comme le joueur (le soigneux n’économise pas pour un achat encore fermé). Tout est ouvert à partir du niveau ${String(NIVEAU_TOUT_OUVERT)} et en mode infini. La tour divine coûte ${String(DIEUX.plume.tourDivine.cout)} arêtes et une seule se dresse à la fois.`,
    '',
    tableau(['Niveau', 'Débloque'], lignes),
  ];
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

/** Constructions par famille et spécialisations par voie du bot soigneux pour un dieu, tous niveaux d'une difficulté confondus. */
function compterChoix(evaluations: readonly Evaluation[], dieu: string, difficulte: string): LigneChoix[] {
  const compte = new Map<string, number>();
  for (const e of evaluations) {
    if (e.bot !== 'soigneux' || e.difficulte !== difficulte || e.dieu !== dieu) continue;
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

function syntheseDe(evaluations: readonly Evaluation[], difficulte: string, bot: 'naif' | 'soigneux' | 'inactif', dieu: string): Synthese {
  return synthetiser(partiesDe(evaluations, difficulte, bot, dieu));
}

/** Lancers d'un sort que la partie permettait : un à la fin de la recharge initiale, puis un par recharge. */
function lancersPossibles(secondes: number, recharge: number, rechargeInitiale: number): number {
  return secondes < rechargeInitiale ? 0 : Math.floor((secondes - rechargeInitiale) / recharge) + 1;
}

function moyenne(valeurs: readonly number[]): number {
  return valeurs.length === 0 ? 0 : valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
}

function partiesDuProfil(profils: readonly EvaluationProfil[], profil: string, dieu: string, difficulte: string, bot: 'naif' | 'soigneux'): ResultatPartie[] {
  return profils.filter((p) => p.profil === profil && p.dieu === dieu && p.difficulte === difficulte && p.bot === bot).flatMap((p) => [...p.parties]);
}

function sortsUtilises(parties: readonly ResultatPartie[], emplacement: number, recharge: number, rechargeInitiale: number): string {
  if (parties.length === 0) return '—';
  const lances = moyenne(parties.map((p) => p.sorts[emplacement] ?? 0));
  const possibles = moyenne(parties.map((p) => lancersPossibles(p.secondes, recharge, rechargeInitiale)));
  return `${un(lances)} sur ${un(possibles)} (${pct(possibles > 0 ? lances / possibles : 0)})`;
}

/** Le texte du rapport. `profils` : les vérifications supplémentaires (disciples, arbre, héros de niveau 10, sans tour divine), si elles ont été jouées. */
export function redigerRapport(evaluations: readonly Evaluation[], graines: number, profils: readonly EvaluationProfil[] = []): string {
  const sortie: string[] = [];
  const ecarts = verifierBandes(evaluations);
  const dieux = DIEUX_EVALUES.filter((d) => dieuxDe(evaluations).includes(d));
  sortie.push(
    '# Rapport d’équilibrage',
    '',
    'Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau des régions 1 à 11 (la région 1 en détail dans cette partie, les régions 2 à 11, les défis et le mode infini plus bas) est rejoué sans',
    `affichage dans les trois difficultés, avec chacun des trois dieux jouant son avatar (sans amélioration ni objet), par deux bots, sur ${String(graines)} graines chacun (version des données ${String(VERSION_DONNEES)}).`,
    '',
    '- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (case de la grille, famille, niveau,',
    '  spécialisation, bonus et remise de famille du dieu compris), après une petite recherche entre douze variantes (6 préférences × 2 diversités, dont « bloquer puis zone ») jouées sur des graines d’entraînement ;',
    '  place le héros dans la zone de feu de ses tours ; joue les sorts de son dieu selon leur effet (Chute du Colosse sur les grappes, Renforts et Voile de Nuit devant la zone de feu,',
    '  Griffes d’Ombre sur la plus grosse grappe, Pièges à Ressort un peu avant la zone de feu, Ingéniosité au cœur de ses tours) ; construit la tour divine de son dieu dès la troisième tour ;',
    '  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter. Il lit la composition des vagues futures, ce qu’un joueur ne voit pas : il est un peu optimiste.',
    '- **Naïf** : construit sur les cases de la grille proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans',
    '  sorts ni ordres au héros, sans tour divine, sans appel de vague en avance.',
    '- **Sans défense** : aucune action, seul le héros à son poste.',
    '',
    '## Bandes cibles',
    '',
    ecarts.length === 0 ? 'Toutes les bandes sont respectées.' : `**${String(ecarts.length)} écart(s)**, dont ${String(ecarts.filter(estSuspendu).length)} aux bandes suspendues de Matou et de Vieux Sage (elles ne bloquent pas : voir bandes.ts) :\n\n${ecarts.map((e) => `- ${e}`).join('\n')}`,
    '',
    `Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins ${String(BANDES.matou.pertesParNiveauMin)} vie sur ${pct(BANDES.matou.partNiveauxAvecPertesMin)} des niveaux et en laissant moins de ${String(BANDES.matou.aretesInutiliseesMax)} arêtes inutilisées par niveau, le naïf gagne ${pct(BANDES.matou.naifMin)} à ${pct(BANDES.matou.naifMax)} ;`,
    `Vieux Sage, le soigneux gagne ${pct(BANDES.vieux_sage.soigneuxMin)} à ${pct(BANDES.vieux_sage.soigneuxMax)} ; sans défense on perd. Entre dieux : en Vieux Sage, au plus ${un(BANDES.vieux_sage.ecartVictoiresEntreDieuxMax * 100)} points d’écart de taux de victoire du soigneux ; en Matou, au plus ${String(BANDES.matou.ecartViesEntreDieuxMax)} vies d’écart de vies moyennes du soigneux.`,
    '',
    '### Dieu × difficulté',
    '',
    'Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie',
    `(bande en Matou pour le soigneux : moins de ${String(BANDES.matou.aretesInutiliseesMax)} dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins ${String(BANDES.matou.pertesParNiveauMin)} vie.`,
    '',
    tableau(
      ['Difficulté', 'Dieu', 'Naïf : victoires', 'Soigneux : victoires', 'Bande du soigneux', 'Naïf : vies', 'Soigneux : vies', 'Soigneux : arêtes inutilisées (moyenne / pire niveau)', 'Soigneux : niveaux avec perte', 'Sans défense'],
      DIFFICULTES_EVALUEES.flatMap((d) =>
        dieux.map((dieu) => {
          const naif = syntheseDe(evaluations, d, 'naif', dieu);
          const soigneux = syntheseDe(evaluations, d, 'soigneux', dieu);
          const inactif = syntheseDe(evaluations, d, 'inactif', dieu);
          const niveauxSoigneux = evaluations.filter((e) => e.difficulte === d && e.bot === 'soigneux' && e.dieu === dieu);
          const pire = Math.max(0, ...niveauxSoigneux.map((e) => synthetiser(e.parties).aretesFinMoyennes));
          return [
            nomDifficulte(d),
            nomDuDieu(dieu),
            pct(naif.tauxVictoire),
            pct(soigneux.tauxVictoire),
            d === 'chaton' ? '—' : d === 'matou' ? '100 %' : `${pct(BANDES.vieux_sage.soigneuxMin)} à ${pct(BANDES.vieux_sage.soigneuxMax)}`,
            un(naif.viesMoyennes),
            un(soigneux.viesMoyennes),
            `${entier(soigneux.aretesFinMoyennes)} / ${entier(pire)}`,
            `${String(niveauxAvecPertes(evaluations, d, dieu).length)}/${String(niveauxSoigneux.length)}`,
            pct(inactif.tauxVictoire),
          ];
        }),
      ),
    ),
    '',
    `Bande du naïf : Chaton ${pct(BANDES.chaton.naifMin)}, Matou ${pct(BANDES.matou.naifMin)} à ${pct(BANDES.matou.naifMax)}. Matou : au moins ${pct(BANDES.matou.partNiveauxAvecPertesMin)} des niveaux avec perte. ` +
      `Vies de départ : ${DIFFICULTES_EVALUEES.map((d) => `${nomDifficulte(d)} ${String(DIFFICULTES[d].vies)}`).join(', ')}. ` +
      `Facteur sur les arêtes de départ des niveaux : ${DIFFICULTES_EVALUEES.map((d) => `${nomDifficulte(d)} ×${String(DIFFICULTES[d].aretesDepart)}`).join(', ')}.`,
    '',
    '### Écarts entre dieux',
    '',
  );

  const tauxVieuxSage = dieux.map((dieu) => syntheseDe(evaluations, 'vieux_sage', 'soigneux', dieu).tauxVictoire);
  const viesMatou = dieux.map((dieu) => syntheseDe(evaluations, 'matou', 'soigneux', dieu).viesMoyennes);
  const ecart = (valeurs: readonly number[]): number => Math.max(...valeurs) - Math.min(...valeurs);
  sortie.push(
    tableau(
      ['Mesure du soigneux', ...dieux.map(nomDuDieu), 'Écart maximal', 'Écart permis'],
      [
        [
          'Vieux Sage : taux de victoire',
          ...tauxVieuxSage.map(pct),
          `${un(ecart(tauxVieuxSage) * 100)} points`,
          `${un(BANDES.vieux_sage.ecartVictoiresEntreDieuxMax * 100)} points`,
        ],
        ['Matou : vies moyennes', ...viesMatou.map(un), `${un(ecart(viesMatou))} vies`, `${String(BANDES.matou.ecartViesEntreDieuxMax)} vies`],
      ],
    ),
    '',
  );

  const niveaux = [...new Set(evaluations.map((e) => e.niveau))].sort((a, b) => a - b);

  // --- Un dieu par section ---
  for (const dieu of dieux) {
    const def = DIEUX[dieu];
    const evalsDieu = duDieu(evaluations, dieu);
    sortie.push(
      `## ${nomDuDieu(dieu)}`,
      '',
      `Héros : ${t(def.heros.nom as CleTexte)}. Bonus de famille : ${t(`famille.${def.bonus.famille}` as CleTexte)} — PV des soldats ${signe(def.bonus.pvSoldats * 100, 0)} %, cadence ${signe(def.bonus.cadence * 100, 0)} %, critique ${signe(def.bonus.chanceCritique * 100, 0)} points, prix ${signe(def.bonus.prix * 100, 0)} %. ` +
        `Sorts : ${def.sorts.map((s) => `${t(s.nom as CleTexte)} (recharge ${String(s.recharge)} s)`).join(', ')}. Tour divine : ${t(def.tourDivine.nom as CleTexte)} (${String(def.tourDivine.cout)} arêtes).`,
      '',
    );
    for (const d of DIFFICULTES_EVALUEES) {
      sortie.push(
        `### ${nomDuDieu(dieu)} : ${nomDifficulte(d)}`,
        '',
        'Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).',
        'Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.',
        '',
        tableau(
          ['Niveau', 'Naïf : victoires', 'Naïf : vies', 'Soigneux : victoires', 'Soigneux : vies', 'Arêtes inutilisées (naïf / soigneux)', 'Vague la plus meurtrière (naïf / soigneux)', 'Durée (naïf / soigneux)', 'Sans défense'],
          niveaux.map((n) => {
            const naif = trouver(evalsDieu, n, d, 'naif');
            const soigneux = trouver(evalsDieu, n, d, 'soigneux');
            const inactif = trouver(evalsDieu, n, d, 'inactif');
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
    const lignes = compterChoix(evaluations, dieu, 'matou');
    const plus = lignes[0];
    const moins = lignes[lignes.length - 1];
    sortie.push(
      `Tours choisies par le soigneux en Matou avec ${nomDuDieu(dieu)} : la plus choisie, ${plus?.libelle ?? '—'} (${String(plus?.fois ?? 0)} fois) ; la moins choisie, ${moins?.libelle ?? '—'} (${String(moins?.fois ?? 0)} fois).`,
      '',
      tableau(
        ['Niveau', ...DIFFICULTES_EVALUEES.map((d) => `Variante en ${nomDifficulte(d)}`)],
        niveaux.map((n) => [String(n), ...DIFFICULTES_EVALUEES.map((d) => trouver(evalsDieu, n, d, 'soigneux')?.variante?.nom ?? '—')]),
      ),
      '',
    );
  }

  // --- Courbe de difficulté ---
  const moyenneCourbe = courbeMoyenne(evaluations);
  const plusDurMoyen = moyenneCourbe.reduce((a, c) => (c.vies < a.vies ? c : a), moyenneCourbe[0] ?? { niveau: 0, vies: 0 });
  sortie.push(
    '## Courbe de difficulté',
    '',
    `Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus ${un(BANDES.courbeCorrelationMax)}) et le niveau 10 figurer parmi les ${String(BANDES.courbeRangDuDernierMax)} plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus ${un(BANDES.courbeCorrelationDieuMax)}) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.`,
    '',
    tableau(
      ['Dieu', ...niveaux.map(String), 'Corrélation de rang', 'Niveau le plus dur'],
      [
        ...dieux.map((dieu) => {
          const courbe = courbeDifficulte(evaluations, 'matou', dieu);
          const plusDur = courbe.reduce((a, c) => (c.vies < a.vies ? c : a), courbe[0] ?? { niveau: 0, vies: 0 });
          return [nomDuDieu(dieu), ...courbe.map((c) => un(c.vies)), un(correlationDeRang(courbe)), `${String(plusDur.niveau)} (${un(plusDur.vies)} vies)`];
        }),
        ['**Moyenne des dieux**', ...moyenneCourbe.map((c) => un(c.vies)), un(correlationDeRang(moyenneCourbe)), `${String(plusDurMoyen.niveau)} (${un(plusDurMoyen.vies)} vies)`],
      ],
    ),
    '',
    'Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).',
    '',
  );

  // --- Sorts ---
  sortie.push(
    '## Usage des sorts par le soigneux',
    '',
    'Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).',
    '',
    tableau(
      ['Dieu', 'Sort', 'Recharge', ...DIFFICULTES_EVALUEES.map(nomDifficulte)],
      dieux.flatMap((dieu) =>
        DIEUX[dieu].sorts.map((sort, emplacement) => [
          nomDuDieu(dieu),
          t(sort.nom as CleTexte),
          `${String(sort.recharge)} s`,
          ...DIFFICULTES_EVALUEES.map((d) => sortsUtilises(partiesDe(evaluations, d, 'soigneux', dieu), emplacement, sort.recharge, sort.rechargeInitiale)),
        ]),
      ),
    ),
    '',
  );

  // --- Tours divines ---
  sortie.push(
    '## Tours divines',
    '',
    'Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 400 arêtes avant la fin du niveau ; une seule par partie, et pas avant le niveau 10 où elle se débloque).',
    'Sans tour divine : le même soigneux, mêmes graines, dépense ces 400 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.',
    '',
  );
  const lignesDivines: string[][] = [];
  for (const dieu of dieux) {
    const def = DIEUX[dieu];
    for (const d of ['matou', 'vieux_sage']) {
      const avec = partiesDe(evaluations, d, 'soigneux', dieu);
      const sans = partiesDuProfil(profils, 'sans_divine', dieu, d, 'soigneux');
      if (avec.length === 0) continue;
      const sa = synthetiser(avec);
      const ss = synthetiser(sans);
      lignesDivines.push([
        nomDuDieu(dieu),
        t(def.tourDivine.nom as CleTexte),
        nomDifficulte(d),
        pct(avec.filter((p) => p.tourDivine).length / avec.length),
        `${pct(sa.tauxVictoire)} / ${un(sa.viesMoyennes)}`,
        sans.length === 0 ? '—' : `${pct(ss.tauxVictoire)} / ${un(ss.viesMoyennes)}`,
        sans.length === 0 ? '—' : `${signe((sa.tauxVictoire - ss.tauxVictoire) * 100, 0)} points / ${signe(sa.viesMoyennes - ss.viesMoyennes)} vies`,
      ]);
    }
  }
  sortie.push(
    tableau(['Dieu', 'Tour divine', 'Difficulté', 'Construite', 'Avec : victoires / vies', 'Sans : victoires / vies', 'Gain de la tour divine'], lignesDivines),
    '',
    'Puissance par la formule des tours communes (DPS efficace moyen × portée ÷ coût), comptant en plus l’onde du Totem (cibles d’une zone d’une tuile de rayon) et les tourelles et pièges de l’Atelier ; elle ne chiffre ni l’étourdissement du Totem, ni les assassins non ciblables du Sanctuaire, ni l’immobilisation des pièges, ce qui explique que les tours divines ressortent en dessous des tours communes de coût voisin alors que le test de partie montre leur effet.',
    '',
    tableau(
      ['Dieu', 'Tour divine', 'Coût', 'Puissance (formule)', 'Tours communes de coût voisin', 'Puissance moyenne de ces tours', 'Rapport'],
      puissancesDivines()
        .filter((p) => dieux.some((d) => d === p.dieu))
        .map((p) => [nomDuDieu(p.dieu), t(p.nom as CleTexte), String(p.cout), un(p.puissance), p.tours.map((v) => `${t(v.nom as CleTexte)} (palier ${String(v.palier)}, coût cumulé ${String(v.coutCumule)})`).join(', '), un(p.reference), `×${un(p.reference > 0 ? p.puissance / p.reference : 0)}`]),
    ),
    '',
  );

  // --- Déblocage progressif ---
  sortie.push(...sectionDeblocage(), '');

  // --- Disciples ---
  const disciples = profils.filter((p) => p.difficulte === 'matou' && (HEROS_PAR_DIEU as Readonly<Record<string, readonly string[]>>)[p.dieu]?.some((h) => h === p.profil && h !== p.dieu));
  if (disciples.length > 0) {
    sortie.push(
      '## Disciples comparés à leur avatar (Matou)',
      '',
      'Chaque disciple est joué au niveau 1 avec son dieu (sans amélioration ni objet), dans les 10 niveaux de Matou. Écart : vies restantes moyennes du soigneux, disciple moins avatar (au plus 3 vies d’écart, en plus ou en moins).',
      '',
      tableau(
        ['Dieu', 'Héros', 'Rôle', 'Soigneux : victoires', 'Soigneux : vies', 'Écart à l’avatar', 'Naïf : victoires', 'Naïf : vies', 'Écart à l’avatar (naïf)'],
        dieux.flatMap((dieu) =>
          HEROS_PAR_DIEU[dieu].map((heros) => {
            const estAvatar = heros === dieu;
            const soigneux = estAvatar ? partiesDe(evaluations, 'matou', 'soigneux', dieu) : partiesDuProfil(profils, heros, dieu, 'matou', 'soigneux');
            const naif = estAvatar ? partiesDe(evaluations, 'matou', 'naif', dieu) : partiesDuProfil(profils, heros, dieu, 'matou', 'naif');
            const avatarSoigneux = synthetiser(partiesDe(evaluations, 'matou', 'soigneux', dieu));
            const avatarNaif = synthetiser(partiesDe(evaluations, 'matou', 'naif', dieu));
            const ss = synthetiser(soigneux);
            const sn = synthetiser(naif);
            return [
              nomDuDieu(dieu),
              t((estAvatar ? HEROS[dieu as keyof typeof HEROS].nom : HEROS[heros].nom) as CleTexte) + (estAvatar ? ' (avatar)' : ''),
              t(HEROS[heros].role as CleTexte),
              pct(ss.tauxVictoire),
              un(ss.viesMoyennes),
              estAvatar ? '—' : `${signe(ss.viesMoyennes - avatarSoigneux.viesMoyennes)} vies`,
              pct(sn.tauxVictoire),
              un(sn.viesMoyennes),
              estAvatar ? '—' : `${signe(sn.viesMoyennes - avatarNaif.viesMoyennes)} vies`,
            ];
          }),
        ),
      ),
      '',
    );
  }

  // --- Progression ---
  const progression = profils.filter((p) => p.difficulte === 'vieux_sage' && ['arbre', 'heros10', 'tout'].includes(p.profil));
  if (progression.length > 0) {
    const cellule = (parties: readonly ResultatPartie[]): string => {
      const s = synthetiser(parties);
      return `${pct(s.tauxVictoire)} / ${un(s.viesMoyennes)}`;
    };
    sortie.push(
      '## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)',
      '',
      'L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.',
      'La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.',
      '',
      tableau(
        ['Dieu', 'Bot', 'De base', 'Arbre au maximum', 'Héros niveau 10', 'Tout au maximum'],
        dieux.flatMap((dieu) =>
          (['soigneux', 'naif'] as const).map((bot) => [
            nomDuDieu(dieu),
            bot === 'soigneux' ? 'Soigneux' : 'Naïf',
            cellule(partiesDe(evaluations, 'vieux_sage', bot, dieu)),
            cellule(partiesDuProfil(profils, 'arbre', dieu, 'vieux_sage', bot)),
            cellule(partiesDuProfil(profils, 'heros10', dieu, 'vieux_sage', bot)),
            cellule(partiesDuProfil(profils, 'tout', dieu, 'vieux_sage', bot)),
          ]),
        ),
      ),
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
