// `npm run niveaux` : régénère src/data/niveaux/vagues-region1.ts, les vagues figées des 10 niveaux du Village
// Affamé, avec le générateur d'équilibrage (budget b(L, w) et ennemis débloqués par niveau, voir
// src/data/niveaux/plan-region1.ts). Même plan, même graine : même fichier, octet pour octet.
// Un niveau marqué `retouchees: true` dans le plan garde les vagues déjà présentes dans le fichier.
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Vague } from '../../src/engine/definitions.ts';
import { ENNEMIS } from '../../src/data/ennemis.ts';
import { budgetVague, menaceVague } from '../../src/data/equilibrage.ts';
import { vaguesDuPlan } from '../../src/data/niveaux/generation.ts';
import { PLANS_REGION1 } from '../../src/data/niveaux/plan-region1.ts';

const SORTIE = fileURLToPath(new URL('../../src/data/niveaux/vagues-region1.ts', import.meta.url));

function ecrireVague(vague: Vague): string {
  const paquets = vague.paquets.map(
    (p) =>
      `        { ennemi: '${p.ennemi}', nombre: ${String(p.nombre)}, intervalle: ${String(p.intervalle)}, chemin: ${String(p.chemin)}, delai: ${String(p.delai)} },`,
  );
  return `    {\n      paquets: [\n${paquets.join('\n')}\n      ],\n    },`;
}

async function vaguesExistantes(): Promise<readonly (readonly Vague[])[]> {
  if (!existsSync(SORTIE)) return [];
  const module = (await import(pathToFileURL(SORTIE).href)) as { VAGUES_REGION1: readonly (readonly Vague[])[] };
  return module.VAGUES_REGION1;
}

async function texteFichier(): Promise<string> {
  const existantes = await vaguesExistantes();
  const blocs = PLANS_REGION1.map((plan, i) => {
    const retouchees = plan.vagues.retouchees === true ? existantes[i] : undefined;
    if (plan.vagues.retouchees === true && !retouchees) throw new Error(`Niveau ${String(plan.numero)} : vagues retouchées introuvables dans le fichier`);
    const vagues = retouchees ?? vaguesDuPlan(plan);
    const detail = vagues.map((v, w) => `${String(Math.round(menaceVague(v, ENNEMIS)))}/${String(Math.round(budgetVague(plan.numero, w + 1)))}`).join(' ');
    return `  // Niveau ${String(plan.numero)} : ${String(vagues.length)} vagues, menace/budget : ${detail}${retouchees ? ' (retouchées à la main)' : ''}.\n  [\n${vagues.map(ecrireVague).join('\n')}\n  ],`;
  });
  return [
    '// Vagues figées des 10 niveaux du Village Affamé.',
    '// GÉNÉRÉ par `npm run niveaux` (tools/niveaux/generer.ts) depuis plan-region1.ts : ne pas modifier à la main.',
    "// Pour retoucher les vagues d'un niveau, marquer `retouchees: true` dans son plan : le script les conserve.",
    "import type { Vague } from '../../engine/definitions';",
    '',
    'export const VAGUES_REGION1: readonly (readonly Vague[])[] = [',
    ...blocs,
    '];',
    '',
  ].join('\n');
}

writeFileSync(SORTIE, await texteFichier());
console.log(`Vagues de ${String(PLANS_REGION1.length)} niveaux écrites dans src/data/niveaux/vagues-region1.ts.`);
