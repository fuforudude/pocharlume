// `npm run niveaux` : régénère src/data/niveaux/vagues-region<N>.ts, les vagues figées des 10 niveaux de chacune des
// régions livrées, avec le générateur d'équilibrage (budget b(L, w) et ennemis débloqués par niveau, voir les plans
// src/data/niveaux/plan-region<N>.ts). Même plan, même graine : même fichier, octet pour octet.
// Les fichiers sont écrits au format compact de src/data/niveaux/format-vagues.ts (le jeu livré en dépend pour son poids).
// Un niveau marqué `retouchees: true` dans le plan garde les vagues déjà présentes dans le fichier.
// `npm run niveaux -- 3` ne régénère que la région 3 ; `npm run niveaux -- moderne` seulement les régions du DLC « Temps modernes »
// (src/data/niveaux/vagues-moderne-r<N>.ts, depuis plan-moderne-r<N>.ts).
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Vague } from '../../src/engine/definitions.ts';
import { ENNEMIS } from '../../src/data/ennemis.ts';
import { budgetVague, menaceVague } from '../../src/data/equilibrage.ts';
import { CHAMPS_PAR_GROUPE, encoderVagues, type VagueCompacte } from '../../src/data/niveaux/format-vagues.ts';
import { vaguesDuPlan, vaguesDuPlanModerne } from '../../src/data/niveaux/generation.ts';
import { PLANS_MODERNE_R1 } from '../../src/data/niveaux/plan-moderne-r1.ts';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans.ts';

const NOMS_REGION = ['du Village Affamé', 'des Champs Brûlés', 'du Bourg des Bûchers', 'des Marais de l’Ordalie', 'de la Ville Pestiférée', 'du Charnier', 'de la Croisade', 'du Monastère Noir', 'de la Cité du Roi', 'de la Cathédrale du Soleil Blême', 'des Grèves Grises'] as const;

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
    const detail = vagues.map((v, w) => `${String(Math.round(menaceVague(v, ENNEMIS)))}/${String(Math.round(budgetVague(plan.numero, w + 1) * (plan.vagues.facteurBudget ?? 1)))}`).join(' ');
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
    "// Format compact (format-vagues.ts) : six nombres par groupe, indice de l'ennemi dans LEGENDE, nombre, intervalle, chemin, délai, facteur de PV.",
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

/** Les vagues figées d'une région du DLC (même format compact, sans niveau retouché à la main pour l'instant). */
function texteFichierModerne(region: number): string {
  const plans = [PLANS_MODERNE_R1][region - 1] ?? [];
  const niveaux = plans.map((plan) => vaguesDuPlanModerne(plan));
  const compact = encoderVagues(niveaux);
  const blocs = plans.map((plan, i) => {
    const vagues = niveaux[i] ?? [];
    const detail = vagues.map((v, w) => `${String(Math.round(menaceVague(v, ENNEMIS)))}/${String(Math.round(budgetVague(plan.vagues.niveauBudget, w + 1) * (plan.vagues.facteurBudget ?? 1)))}`).join(' ');
    return [`  // Niveau ${String(plan.numero)} : ${String(vagues.length)} vagues, menace/budget : ${detail}.`, '  [', ...(compact.niveaux[i] ?? []).map(ecrireVague), '  ],'].join('\n');
  });
  const nom = `VAGUES_MODERNE_R${String(region)}`;
  return [
    `// Vagues figées des 10 niveaux de la région ${String(region)} du DLC « Temps modernes ».`,
    `// GÉNÉRÉ par \`npm run niveaux -- moderne\` (tools/niveaux/generer.ts) depuis plan-moderne-r${String(region)}.ts : ne pas modifier à la main.`,
    "// Format compact (format-vagues.ts) : six nombres par groupe, indice de l'ennemi dans LEGENDE, nombre, intervalle, chemin, délai, facteur de PV.",
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

const argument = process.argv[2];
if (argument === undefined || argument === 'moderne') {
  const sortie = fileURLToPath(new URL('../../src/data/niveaux/vagues-moderne-r1.ts', import.meta.url));
  writeFileSync(sortie, texteFichierModerne(1));
  console.log(`Vagues de ${String(PLANS_MODERNE_R1.length)} niveaux écrites dans src/data/niveaux/vagues-moderne-r1.ts.`);
}
const voulue = argument === undefined ? undefined : argument === 'moderne' ? 0 : Number(argument);
for (let region = 1; region <= PLANS_REGIONS.length; region++) {
  if (voulue !== undefined && voulue !== region) continue;
  const sortie = fileURLToPath(new URL(`../../src/data/niveaux/vagues-region${String(region)}.ts`, import.meta.url));
  writeFileSync(sortie, await texteFichier(region, sortie));
  console.log(`Vagues de ${String(PLANS_REGIONS[region - 1]?.length ?? 0)} niveaux écrites dans src/data/niveaux/vagues-region${String(region)}.ts.`);
}
