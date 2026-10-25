// `npm run niveaux:apercu -- <n>` : dessine en texte le niveau de campagne n (1 à 10), une lettre par tuile.
// `npm run niveaux:apercu -- carte <id>` : dessine une carte avec tous ses chemins, socles et décors.
// # chemin (couloir de 2 tuiles) · S pierre d'un socle · R ralliement · H départ du héros
// m maison · a arbre · p puits · b bûcher · t potence · c clôture · T tonneau · x croix · k crâne · s souche
// o cailloux · ' touffe · ~ boue · + pavés · ! décor qui mord sur un chemin ou un socle
import { CARTES, type IdCarte } from '../../src/data/niveaux/cartes.ts';
import { empriseDecor, empriseSocle, empriseSprite, DEMI_LARGEUR_CHEMIN, MARGE_DECOR } from '../../src/data/niveaux/habillage.ts';
import { distanceRectChemin, distancePointChemin, rectsSeChevauchent } from '../../src/data/niveaux/geometrie.ts';
import { REGION1 } from '../../src/data/niveaux/region1.ts';
import type { Carte } from '../../src/engine/definitions.ts';
import type { VisuelCarte } from '../../src/data/visuel.ts';

const LETTRES: Record<string, string> = {
  'maison-ruine-1': 'm',
  'maison-ruine-2': 'm',
  'arbre-mort-1': 'a',
  'arbre-mort-2': 'a',
  puits: 'p',
  'bucher-eteint': 'b',
  potence: 't',
  'cloture-h': 'c',
  'cloture-v': 'c',
  'cloture-cassee': 'c',
  tonneau: 'T',
  croix: 'x',
  crane: 'k',
  souche: 's',
  cailloux: 'o',
  touffe: "'",
};

function dessiner(carte: Carte, visuel: VisuelCarte): string {
  const grille: string[][] = [];
  for (let j = 0; j < carte.hauteur; j++) {
    const ligne: string[] = [];
    for (let i = 0; i < carte.largeur; i++) ligne.push('.');
    grille[j] = ligne;
  }
  const poser = (i: number, j: number, c: string): void => {
    const ligne = grille[j];
    if (ligne && i >= 0 && i < carte.largeur) ligne[i] = c;
  };
  for (const z of visuel.zones) {
    for (let j = z.y; j < z.y + z.hauteur; j++) for (let i = z.x; i < z.x + z.largeur; i++) poser(i, j, z.sol === 'boue' ? '~' : '+');
  }
  for (let j = 0; j < carte.hauteur; j++) {
    for (let i = 0; i < carte.largeur; i++) {
      for (const c of carte.chemins) {
        if (distancePointChemin(i + 0.5, j + 0.5, c.points) <= DEMI_LARGEUR_CHEMIN) poser(i, j, '#');
      }
    }
  }
  for (const d of visuel.decor) {
    const r = empriseDecor(d);
    const mord =
      carte.chemins.some((c) => distanceRectChemin(r, c.points) < DEMI_LARGEUR_CHEMIN + MARGE_DECOR) ||
      carte.socles.some((s) => rectsSeChevauchent(r, empriseSprite(s.x, s.y)));
    for (let j = 0; j < carte.hauteur; j++) {
      for (let i = 0; i < carte.largeur; i++) {
        if (i + 0.5 > r.x0 && i + 0.5 < r.x1 && j + 0.5 > r.y0 && j + 0.5 < r.y1) poser(i, j, mord ? '!' : (LETTRES[d.sprite] ?? '?'));
      }
    }
  }
  for (const s of carte.socles) {
    const r = empriseSocle(s.x, s.y);
    for (let j = 0; j < carte.hauteur; j++) {
      for (let i = 0; i < carte.largeur; i++) if (i + 0.5 > r.x0 && i + 0.5 < r.x1 && j + 0.5 > r.y0 && j + 0.5 < r.y1) poser(i, j, 'S');
    }
  }
  for (const s of carte.socles) poser(Math.floor(s.ralliement.x), Math.floor(s.ralliement.y), 'R');
  poser(Math.floor(carte.departHeros.x), Math.floor(carte.departHeros.y), 'H');
  const entete = '   ' + Array.from({ length: carte.largeur }, (_, i) => String(i % 10)).join('');
  return [entete, ...grille.map((l, j) => `${String(j).padStart(2)} ${l.join('')}`)].join('\n');
}

const [mode, arg] = process.argv.slice(2);
if (mode === 'carte' && arg && arg in CARTES) {
  const m = CARTES[arg as IdCarte];
  console.log(dessiner({ largeur: m.largeur, hauteur: m.hauteur, chemins: m.chemins, socles: m.socles, departHeros: m.departHeros }, { region: 1, zones: m.zones, decor: m.decor }));
} else {
  const n = Number(mode);
  const niveau = REGION1.find((c) => c.numero === n);
  if (!niveau) {
    console.error('Usage : apercu.ts <1 à 10> | carte <chaumes|gue|pendus|carrefour>');
    process.exit(1);
  }
  console.log(`Niveau ${String(n)} (${niveau.niveau.id}) : ${String(niveau.niveau.carte.chemins.length)} chemin(s), ${String(niveau.niveau.carte.socles.length)} socles, ${String(niveau.niveau.vagues.length)} vagues`);
  console.log(dessiner(niveau.niveau.carte, niveau.visuel));
}
