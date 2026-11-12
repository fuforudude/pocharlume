// `npm run lore` : reporte les textes de docs/lore.md dans src/i18n/.
//   - une clé qui existe déjà est mise à jour dans son fichier, sur place ;
//   - une clé nouvelle (inscription.*, boss.r<n>.parole ou boss.m<n>.parole, ennemi.<id>.desc) va dans src/i18n/fr-lore.ts,
//     réécrit en entier à chaque passage ;
//   - toute autre clé inconnue, ou tout texte qui ne se retrouve pas à l'identique après écriture, est une erreur.
// Rejouable : `npm run lore` après chaque correction de lore.md. `npm run lore -- --verifier` ne modifie rien et
// sort en erreur si le jeu et le document diffèrent.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLE_NOUVELLE, litteral, lireLore, type TexteLore } from './lore.ts';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOSSIER_I18N = join(RACINE, 'src', 'i18n');
const FICHIER_LORE = join(DOSSIER_I18N, 'fr-lore.ts');
const LITTERAL = String.raw`'(?:[^'\\\n]|\\.)*'`;
const MARQUEUR = /\{[^}]*\}/g;

function echapperRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lireLitteral(brut: string): string {
  return brut.slice(1, -1).replace(/\\(.)/g, '$1');
}

function marqueurs(texte: string): string {
  return (texte.match(MARQUEUR) ?? []).sort().join(',');
}

/** Les fichiers de textes (hors fr-lore.ts) avec leur contenu. */
function fichiersTextes(): Map<string, string> {
  const fichiers = new Map<string, string>();
  for (const nom of readdirSync(DOSSIER_I18N)) {
    if (!/^fr(-[a-z0-9-]+)?\.ts$/.test(nom) || nom === 'fr-lore.ts') continue;
    fichiers.set(join(DOSSIER_I18N, nom), readFileSync(join(DOSSIER_I18N, nom), 'utf8'));
  }
  return fichiers;
}

function chercher(contenu: string, cle: string): RegExpExecArray | null {
  return new RegExp(`('${echapperRegex(cle)}':\\s*)(${LITTERAL})`).exec(contenu);
}

function genererFichierLore(nouveaux: readonly TexteLore[]): string {
  const lignes = [
    "// Textes de docs/lore.md qui n'ont pas d'autre place : inscriptions des statues, paroles avant les boss,",
    "// descriptions des ennemis. Fichier GÉNÉRÉ par `npm run lore` : ne pas modifier à la main, corriger docs/lore.md.",
    'export const frLore = {',
  ];
  let groupe = '';
  for (const { cle, texte } of nouveaux) {
    const g = cle.startsWith('inscription.') ? 'Inscriptions des statues' : cle.startsWith('boss.') ? 'Paroles avant les boss' : 'Descriptions des ennemis';
    if (g !== groupe) {
      if (groupe !== '') lignes.push('');
      lignes.push(`  // ${g}`);
      groupe = g;
    }
    lignes.push(`  '${cle}': ${litteral(texte)},`);
  }
  lignes.push('} as const;', '');
  return lignes.join('\n');
}

function main(): void {
  const verifier = process.argv.includes('--verifier');
  const textes = lireLore(readFileSync(join(RACINE, 'docs', 'lore.md'), 'utf8'));
  const fichiers = fichiersTextes();
  const erreurs: string[] = [];
  const nouveaux: TexteLore[] = [];
  let misAJour = 0;
  let identiques = 0;

  for (const lore of textes) {
    const trouves = [...fichiers].filter(([, contenu]) => chercher(contenu, lore.cle) !== null);
    if (trouves.length > 1) {
      erreurs.push(`${lore.cle} : la clé existe dans plusieurs fichiers (${trouves.map(([c]) => basename(c)).join(', ')})`);
      continue;
    }
    const trouve = trouves[0];
    if (trouve === undefined) {
      if (!CLE_NOUVELLE.test(lore.cle)) erreurs.push(`lore.md ligne ${String(lore.ligne)} : la clé ${lore.cle} n'existe pas dans src/i18n/ et n'est pas d'un genre autorisé`);
      else if (marqueurs(lore.texte) !== '') erreurs.push(`${lore.cle} : un texte nouveau ne peut pas contenir de marqueur {…} (${marqueurs(lore.texte)})`);
      else nouveaux.push(lore);
      continue;
    }
    const [chemin, contenu] = trouve;
    const m = chercher(contenu, lore.cle);
    if (m === null) continue;
    const ancien = lireLitteral(m[2] ?? '');
    if (ancien === lore.texte) identiques++;
    else if (marqueurs(ancien) !== marqueurs(lore.texte)) {
      erreurs.push(`${lore.cle} : les marqueurs {…} changent (${marqueurs(ancien) || 'aucun'} devient ${marqueurs(lore.texte) || 'aucun'})`);
    } else {
      fichiers.set(chemin, contenu.replace(m[0], () => `${m[1] ?? ''}${litteral(lore.texte)}`));
      misAJour++;
    }
  }

  const contenuLore = genererFichierLore(nouveaux);
  let actuel = '';
  try {
    actuel = readFileSync(FICHIER_LORE, 'utf8');
  } catch {
    // premier passage
  }

  if (!verifier && erreurs.length === 0) {
    for (const [chemin, contenu] of fichiers) writeFileSync(chemin, contenu);
    writeFileSync(FICHIER_LORE, contenuLore);

    // Relecture : chaque texte du document doit se retrouver à l'identique dans le jeu.
    const relus = new Map<string, string>();
    for (const contenu of [...fichiersTextes().values(), readFileSync(FICHIER_LORE, 'utf8')]) {
      for (const m of contenu.matchAll(new RegExp(`'([A-Za-z0-9_.]+)':\\s*(${LITTERAL})`, 'g'))) relus.set(m[1] ?? '', lireLitteral(m[2] ?? ''));
    }
    for (const { cle, texte } of textes) {
      if (relus.get(cle) !== texte) erreurs.push(`${cle} : le texte écrit ne correspond pas à lore.md`);
    }
  }

  const aEcrire = misAJour + (actuel === contenuLore ? 0 : 1);
  console.log(`${String(textes.length)} textes dans lore.md : ${String(identiques)} déjà à jour, ${String(misAJour)} mis à jour, ${String(nouveaux.length)} dans fr-lore.ts.`);
  if (erreurs.length > 0) {
    for (const e of erreurs) console.error(`ERREUR ${e}`);
    process.exit(1);
  }
  if (verifier && aEcrire > 0) {
    console.error('Le jeu ne correspond pas à docs/lore.md : lance `npm run lore`.');
    process.exit(1);
  }
}

main();
