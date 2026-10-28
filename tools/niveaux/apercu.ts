// `npm run niveaux:apercu -- <n>` : dessine en texte le niveau de campagne n (1 à 10), une lettre par tuile.
// `npm run niveaux:apercu -- carte <id>` : dessine une carte avec tous ses chemins, socles et décors.
// `npm run niveaux:apercu -- planche [région]` : planche PNG des cartes des régions 2 à 5 (docs/cartes/regions-2-a-5.png), ou
// des cartes d'une seule région (art/apercu/cartes-region<N>.png, non suivi par git), avec le vrai sol et les vrais sprites.
// # chemin (couloir de 2 tuiles) · S pierre d'un socle · R ralliement · H départ du héros
// m maison · a arbre · p puits · b bûcher · t potence/échafaud · c clôture · T tonneau · x croix · k crâne/ossements · s souche
// o cailloux · ' touffe · M meule · C chariot/charrette/barque · F fosse · ~ boue · + pavés · ! décor qui mord sur un chemin ou un socle
// (les petits décors des régions 2 à 5 ont chacun une lettre, voir LETTRES ; ? = sprite sans lettre)
import { CARTES, type IdCarte } from '../../src/data/niveaux/cartes-toutes.ts';
import { empriseDecor, empriseSocle, empriseSprite, DEMI_LARGEUR_CHEMIN, MARGE_DECOR } from '../../src/data/niveaux/habillage.ts';
import { distanceRectChemin, distancePointChemin, rectsSeChevauchent } from '../../src/data/niveaux/geometrie.ts';
import { REGION1 } from '../../src/data/niveaux/region1.ts';
import type { Carte } from '../../src/engine/definitions.ts';
import type { VisuelCarte } from '../../src/data/visuel.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encoderPng } from '../art/png.ts';
import { planche } from './planche.ts';

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
  // Régions 2 à 5 : mêmes lettres pour les mêmes rôles (maison, arbre, bûcher/brasier, fosse…)
  'arbre-calcine-1': 'a',
  'arbre-calcine-2': 'a',
  'saule-marais-1': 'a',
  'saule-marais-2': 'a',
  'meule-brulee': 'M',
  'chariot-brise': 'C',
  'charrette-linceuls': 'C',
  'barque-echouee': 'C',
  'gerbes-brulees': 'g',
  sillon: 'l',
  'fourche-brisee': 'f',
  'souche-calcinee': 's',
  'souche-moussue': 's',
  'bucher-braises': 'b',
  echafaud: 't',
  'maison-brulee-1': 'm',
  'maison-brulee-2': 'm',
  'maison-condamnee-1': 'm',
  'maison-condamnee-2': 'm',
  'puits-noir': 'p',
  'fosse-commune': 'F',
  cendres: 'e',
  fagots: 'f',
  'torche-fichee': 'i',
  'cloche-fendue': 'K',
  roseaux: 'r',
  nenuphars: 'n',
  'feu-follet': 'w',
  'croix-rouge': 'x',
  linceul: 'u',
  'lanterne-peste': 'i',
  'tas-ossements': 'k',
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
if (mode === 'planche') {
  const region = arg === undefined ? undefined : Number(arg);
  const modeles = Object.values(CARTES).filter((m) => (region === undefined ? m.region >= 2 : m.region === region));
  if (modeles.length === 0) {
    console.error('Usage : apercu.ts planche [région 1 à 5]');
    process.exit(1);
  }
  const sortie = fileURLToPath(new URL(region === undefined ? '../../docs/cartes/regions-2-a-5.png' : `../../art/apercu/cartes-region${String(region)}.png`, import.meta.url));
  mkdirSync(dirname(sortie), { recursive: true });
  writeFileSync(sortie, encoderPng(planche(modeles, 3)));
  console.log(`${String(modeles.length)} cartes dessinées dans ${sortie}`);
} else if (mode === 'carte' && arg && arg in CARTES) {
  const m = CARTES[arg as IdCarte];
  console.log(dessiner({ largeur: m.largeur, hauteur: m.hauteur, chemins: m.chemins, socles: m.socles, departHeros: m.departHeros }, { region: m.region, zones: m.zones, decor: m.decor }));
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
