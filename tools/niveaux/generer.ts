// `npm run niveaux` : régénère src/data/niveaux/vagues-region<N>.ts, les vagues figées des 10 niveaux de chacune des 5
// régions, avec le générateur d'équilibrage (budget b(L, w) et ennemis débloqués par niveau, voir les plans
// src/data/niveaux/plan-region<N>.ts). Même plan, même graine : même fichier, octet pour octet.
// Les fichiers sont écrits au format compact de src/data/niveaux/format-vagues.ts (le jeu livré en dépend pour son poids).
// Un niveau marqué `retouchees: true` dans le plan garde les vagues déjà présentes dans le fichier.
// `npm run niveaux -- 3` ne régénère que la région 3.
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Vague } from '../../src/engine/definitions.ts';
import { ENNEMIS } from '../../src/data/ennemis.ts';
import { budgetVague, menaceVague } from '../../src/data/equilibrage.ts';
import { CHAMPS_PAR_GROUPE, encoderVagues, type VagueCompacte } from '../../src/data/niveaux/format-vagues.ts';
import { vaguesDuPlan } from '../../src/data/niveaux/generation.ts';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans.ts';

const NOMS_REGION = ['du Village Affamé', 'des Champs Brûlés', 'du Bourg des Bûchers', 'des Marais de l’Ordalie', 'de la Ville Pestiférée'] as const;

/** Une vague : ses nombres à la suite, un groupe par ligne. */
function ecrireVague(vague: VagueCompacte): string {
  const lignes: string[] = [];
  for (let i = 0; i < vague.length; i += CHAMPS_PAR_GROUPE) lignes.push(`      ${vague.slice(i, i + CHAMPS_PAR_GROUPE).map(String).join(', ')},`);
  return ['    [', ...lignes, '    ],'].join('\n');
}

async function vaguesExistantes(sortie: string, nom: string): Promise<readonly (readonly Vague[])[]> {
  if (!existsSync(sortie)) return [];
  const module = (await import(pathToFileURL(sortie).href)) as Record<string, readonly (readonly Vague[])[]>;
  return module[nom] ?? [];
}

async function texteFichier(region: number, sortie: string): Promise<string> {
  const plans = PLANS_REGIONS[region - 1] ?? [];
  const nom = `VAGUES_REGION${String(region)}`;
  // Les vagues déjà figées ne se lisent que pour les niveaux retouchés à la main.
  const existantes = plans.some((p) => p.vagues.retouchees === true) ? await vaguesExistantes(sortie, nom) : [];
  const niveaux = plans.map((plan, i) => {
    const retouchees = plan.vagues.retouchees === true ? existantes[i] : undefined;
    if (plan.vagues.retouchees === true && !retouchees) throw new Error(`Niveau ${String(plan.numero)} : vagues retouchées introuvables dans le fichier`);
    return retouchees ?? vaguesDuPlan(plan);
  });
  const compact = encoderVagues(niveaux);
  const blocs = plans.map((plan, i) => {
    const vagues = niveaux[i] ?? [];
    const detail = vagues.map((v, w) => `${String(Math.round(menaceVague(v, ENNEMIS)))}/${String(Math.round(budgetVague(plan.numero, w + 1)))}`).join(' ');
    const retouche = plan.vagues.retouchees === true ? ' (retouchées à la main)' : '';
    return [
      `  // Niveau ${String(plan.numero)} : ${String(vagues.length)} vagues, menace/budget : ${detail}${retouche}.`,
      '  [',
      ...(compact.niveaux[i] ?? []).map(ecrireVague),
      '  ],',
    ].join('\n');
  });
  return [
    `// Vagues figées des 10 niveaux de la région ${String(region)}, ${NOMS_REGION[region - 1] ?? ''}.`,
    `// GÉNÉRÉ par \`npm run niveaux\` (tools/niveaux/generer.ts) depuis plan-region${String(region)}.ts : ne pas modifier à la main.`,
    "// Pour retoucher les vagues d'un niveau, marquer `retouchees: true` dans son plan : le script les conserve.",
    "// Format compact (format-vagues.ts) : cinq nombres par groupe, indice de l'ennemi dans LEGENDE, nombre, intervalle, chemin, délai.",
    "import type { Vague } from '../../engine/definitions';",
    "import { decoderVagues } from './format-vagues';",
    '',
    "/** Les ennemis des vagues de la région : l'indice d'un groupe est sa position ici. */",
    `const LEGENDE = [${compact.legende.map((e) => `'${e}'`).join(', ')}] as const;`,
    '',
    `export const ${nom}: readonly (readonly Vague[])[] = decoderVagues(LEGENDE, [`,
    ...blocs,
    ']);',
    '',
  ].join('\n');
}

const voulue = process.argv[2] === undefined ? undefined : Number(process.argv[2]);
for (let region = 1; region <= PLANS_REGIONS.length; region++) {
  if (voulue !== undefined && voulue !== region) continue;
  const sortie = fileURLToPath(new URL(`../../src/data/niveaux/vagues-region${String(region)}.ts`, import.meta.url));
  writeFileSync(sortie, await texteFichier(region, sortie));
  console.log(`Vagues de ${String(PLANS_REGIONS[region - 1]?.length ?? 0)} niveaux écrites dans src/data/niveaux/vagues-region${String(region)}.ts.`);
}
