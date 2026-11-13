// Garde-fous des workflows : même découpage par région que le déploiement, repli sur GitHub, délais, actions épinglées
// par SHA, clé de déploiement réservée à l'environnement production. Lecture par motifs : pas de dépendance YAML.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function lire(nom: string): string {
  // Sous Windows, git peut rendre les fichiers en fins de ligne \r\n : les motifs attendent \n.
  return readFileSync(new URL(`../../.github/workflows/${nom}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
}

/**
 * Défauts d'indentation des blocs `run: |` : toute ligne non vide d'un bloc doit être indentée au moins autant que sa
 * première ligne. Un retour à la ligne littéral dans un `printf` fait sortir le texte du bloc et rend le YAML invalide.
 * Le bloc se termine à la prochaine clé ou entrée de liste placée au plus au niveau de `run:`.
 */
function defautsBlocsRun(flux: string): string[] {
  const defauts: string[] = [];
  const lignes = flux.split('\n');
  for (let i = 0; i < lignes.length; i++) {
    const debut = /^(\s*)(?:- )?run:\s*[|>][+-]?\s*$/.exec(lignes[i] ?? '');
    if (debut?.[1] === undefined) continue;
    const niveauCle = debut[1].length;
    let base: number | null = null;
    for (let j = i + 1; j < lignes.length; j++) {
      const ligne = lignes[j] ?? '';
      if (ligne.trim() === '') continue;
      const indentation = ligne.length - ligne.trimStart().length;
      base ??= indentation;
      if (indentation >= base) continue;
      if (indentation <= niveauCle && /^\s*(?:- |[\w.-]+:)/.test(ligne)) break;
      defauts.push(`ligne ${String(j + 1)} : ${ligne.trim()}`);
    }
  }
  return defauts;
}

function regions(flux: string): number[] {
  const matrice = /region:\s*\[([^\]]*)\]/.exec(flux)?.[1] ?? '';
  return matrice.split(',').map((r) => Number(r.trim()));
}

/** Le texte de chaque job (clé à deux espaces sous `jobs:`), par identifiant. */
function jobs(flux: string): Map<string, string> {
  const section = flux.slice(flux.indexOf('\njobs:\n') + 7);
  const resultat = new Map<string, string>();
  let courant: string | null = null;
  let lignes: string[] = [];
  for (const ligne of section.split('\n')) {
    const entete = /^ {2}([a-z][a-z0-9-]*):\s*$/.exec(ligne);
    if (entete?.[1] !== undefined) {
      if (courant !== null) resultat.set(courant, lignes.join('\n'));
      courant = entete[1];
      lignes = [];
    } else lignes.push(ligne);
  }
  if (courant !== null) resultat.set(courant, lignes.join('\n'));
  return resultat;
}

function job(flux: string, nom: string): string {
  const texte = jobs(flux).get(nom);
  if (texte === undefined) throw new Error(`job ${nom} introuvable`);
  return texte;
}

const tests = lire('tests.yml');
const deploiement = lire('deploiement.yml');

describe('workflow des tests distants', () => {
  it('a la même matrice de régions que le déploiement', () => {
    const attendue = regions(deploiement);
    expect(attendue.length).toBeGreaterThan(0);
    expect(regions(tests)).toEqual(attendue);
  });

  it('part sur tout push sauf main, et à la demande', () => {
    expect(tests).toMatch(/branches-ignore:\s*\[main\]/);
    expect(tests).toContain('workflow_dispatch:');
  });

  it('entrée machine : auto, github ou vps, auto par défaut, transmise au choix', () => {
    expect(tests).toMatch(/ {6}machine:\n(?: {8}.*\n)*? {8}type: choice\n/);
    expect(tests).toMatch(/options: \[auto, github, vps\]/);
    expect(tests).toMatch(/ {6}machine:\n(?: {8}.*\n)*? {8}default: auto\n/);
    expect(job(tests, 'choisir')).toContain('MACHINE: ${{ inputs.machine }}');
    expect(job(tests, 'choisir')).toContain('ACTEUR: ${{ github.actor }}');
  });

  it('annule le run précédent de la même branche, dans un groupe distinct pour l’équilibrage', () => {
    expect(tests).toMatch(/group:\s*tests-\$\{\{ github\.ref \}\}-\$\{\{ .*'equilibrage' \|\| 'verif' \}\}/);
    expect(tests).toMatch(/cancel-in-progress:\s*true/);
  });

  it('chaque job a un délai', () => {
    for (const flux of [tests, deploiement]) {
      for (const [nom, texte] of jobs(flux)) expect(texte, nom).toMatch(/\n {4}timeout-minutes: \d+/);
    }
  });

  it('repli sur GitHub même si le job de choix échoue : vérification et équilibrage ne dépendent pas de son succès', () => {
    expect(job(tests, 'verifier')).toContain('if: ${{ !cancelled() }}');
    for (const nom of ['equilibrage', 'equilibrage-infini']) expect(job(tests, nom)).toMatch(/if: \$\{\{ !cancelled\(\) && \(.*\[equilibrage\].*\) \}\}/);
  });

  it('le rapport d’équilibrage reste sur GitHub (il ne fait que réunir des journaux)', () => {
    expect(job(tests, 'rapport-equilibrage')).toMatch(/runs-on: ubuntu-latest\n/);
  });
});

describe('workflow de déploiement', () => {
  it('la clé du VPS n’est lue que dans l’environnement production', () => {
    expect(job(deploiement, 'vps')).toMatch(/\n {4}environment: production\n/);
    const code = (texte: string): string =>
      texte
        .split('\n')
        .filter((l) => !/^\s*#/.test(l))
        .join('\n');
    expect(code(job(deploiement, 'vps'))).toContain('secrets.VPS_DEPLOY_KEY');
    for (const [nom, texte] of jobs(deploiement)) if (nom !== 'vps') expect(code(texte), nom).not.toContain('VPS_DEPLOY_KEY');
    for (const texte of jobs(tests).values()) expect(code(texte)).not.toContain('VPS_DEPLOY_KEY');
  });
});

describe('syntaxe des blocs run', () => {
  for (const nom of ['tests.yml', 'deploiement.yml']) {
    it(`${nom} : aucune ligne d'un bloc run: | ne sort de son indentation`, () => {
      expect(defautsBlocsRun(lire(nom))).toEqual([]);
    });
  }

  it('repère un retour à la ligne littéral dans un printf', () => {
    const casse = "jobs:\n  a:\n    steps:\n      - run: |\n          printf 'x\n\n_(suite)_\n'\n      - uses: y\n";
    expect(defautsBlocsRun(casse)).toHaveLength(2);
  });
});

describe('actions tierces', () => {
  it('épinglées par SHA de commit, avec l’étiquette en commentaire', () => {
    for (const flux of [tests, deploiement]) {
      const usages = flux.split('\n').filter((l) => /^\s*-?\s*uses:/.test(l));
      expect(usages.length).toBeGreaterThan(0);
      for (const ligne of usages) expect(ligne).toMatch(/uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
    }
  });
});
