// Scène d'essai du Village Affamé : tuiles, décor, tours, unités et ennemis posés ensemble, agrandis ×3.
// Sert seulement à juger les sprites en situation (aperçu), le jeu a ses propres cartes.
import { miroir, type Couche } from './couche.ts';
import { agrandirImage, poser } from './apercu.ts';
import type { SpriteDessine } from './dessin.ts';
import { nouvelleImage, type Image } from './png.ts';

/** `.` herbe, `=` chemin, `m` boue, `p` pavés (20 × 12 tuiles de 16 px). */
const CARTE = [
  '....................',
  '....................',
  '....................',
  '..........ppp.......',
  '==============......',
  '==============......',
  '==============......',
  '...m.......===......',
  '..mm.......===......',
  '...........====.....',
  '...........=====....',
  '...........=====....',
];

/** Objets posés : sprite, animation, cadre, position du point d'ancrage, retourné vers la gauche. */
const OBJETS: readonly (readonly [string, string, number, number, number, boolean?])[] = [
  ['potence', 'repos', 0, 300, 40],
  ['arbre-mort-1', 'repos', 0, 20, 52],
  ['maison-ruine-1', 'repos', 0, 178, 46],
  ['maison-ruine-2', 'repos', 0, 280, 120],
  ['arbre-mort-2', 'repos', 0, 300, 180],
  ['puits', 'repos', 0, 214, 58],
  ['bucher-eteint', 'repos', 0, 30, 150],
  ['cloture-h', 'repos', 0, 8, 120],
  ['cloture-h', 'repos', 0, 24, 120],
  ['cloture-cassee', 'repos', 0, 40, 120],
  ['touffe', 'repos', 0, 150, 30],
  ['touffe', 'repos', 0, 90, 178],
  ['cailloux', 'repos', 0, 250, 98],
  ['croix', 'repos', 0, 60, 178],
  ['crane', 'repos', 0, 140, 186],
  ['tonneau', 'repos', 0, 196, 62],
  ['souche', 'repos', 0, 240, 180],
  ['socle', 'repos', 0, 52, 58],
  ['tour-caserne-2', 'repos', 0, 52, 58],
  ['socle', 'repos', 0, 116, 58],
  ['tour-tir-3', 'repos', 0, 116, 58],
  ['socle', 'repos', 0, 246, 82],
  ['tour-magie-oracle', 'attaque', 0, 246, 82],
  ['socle', 'repos', 0, 96, 146],
  ['tour-artillerie-3', 'attaque', 1, 96, 146],
  ['socle', 'repos', 0, 152, 140],
  ['socle', 'repos', 0, 268, 156],
  ['tour-totem', 'repos', 0, 268, 156],
  ['paysan-affame', 'marche', 1, 34, 92],
  ['mendiant', 'marche', 3, 60, 86],
  ['chien-errant', 'marche', 0, 84, 96],
  ['paysan-affame', 'attaque', 3, 132, 90],
  ['soldat-grange', 'attaque', 1, 148, 92, true],
  ['ecorcheur', 'repos', 0, 156, 82, true],
  ['charlie', 'attaque', 2, 160, 102, true],
  ['etourdi', 'repos', 0, 132, 70],
  ['boucher-vaudrelle', 'marche', 2, 196, 170],
  ['garde-cloitre', 'repos', 1, 214, 176, true],
  ['spectre-chat', 'repos', 0, 226, 166, true],
  ['impact-cendre', 'impact', 2, 192, 140],
];

export function planScene(sprites: readonly SpriteDessine[]): Image {
  const image = nouvelleImage(320, 192);
  const parNom = new Map(sprites.map((s) => [s.nom, s]));
  const cadre = (nom: string, anim = 'repos', indice = 0): Couche | undefined =>
    parNom.get(nom)?.anims.find((a) => a.nom === anim)?.cadres[indice]?.couche;

  const tuile = (x: number, y: number): string => {
    const ligne = CARTE[Math.max(0, Math.min(CARTE.length - 1, y))] ?? '';
    return ligne[Math.max(0, Math.min(ligne.length - 1, x))] ?? '.';
  };
  const herbe = (x: number, y: number): boolean => tuile(x, y) === '.' || tuile(x, y) === 'm';
  CARTE.forEach((ligne, y) => {
    ligne.split('').forEach((c, x) => {
      const variante = ((x * 7 + y * 13) % 5);
      let nom = `herbe-${String(variante < 3 ? 1 : variante - 1)}`;
      if (c === 'm') nom = `boue-${String(1 + (x % 2))}`;
      if (c === 'p') nom = `paves-${String(1 + (x % 2))}`;
      if (c === '=') {
        const n = herbe(x, y - 1);
        const e = herbe(x + 1, y);
        const s = herbe(x, y + 1);
        const o = herbe(x - 1, y);
        nom = `chemin-${String(1 + (variante % 2))}`;
        if (n && o) nom = 'chemin-coin-ext-no';
        else if (n && e) nom = 'chemin-coin-ext-ne';
        else if (s && e) nom = 'chemin-coin-ext-se';
        else if (s && o) nom = 'chemin-coin-ext-so';
        else if (n) nom = 'chemin-bord-n';
        else if (e) nom = 'chemin-bord-e';
        else if (s) nom = 'chemin-bord-s';
        else if (o) nom = 'chemin-bord-o';
        else if (herbe(x - 1, y - 1)) nom = 'chemin-coin-int-no';
        else if (herbe(x + 1, y - 1)) nom = 'chemin-coin-int-ne';
        else if (herbe(x + 1, y + 1)) nom = 'chemin-coin-int-se';
        else if (herbe(x - 1, y + 1)) nom = 'chemin-coin-int-so';
      }
      const c2 = cadre(nom);
      if (c2) poser(image, c2, x * 16, y * 16);
    });
  });

  // Peintre : du plus haut au plus bas, pour que ce qui est devant recouvre ce qui est derrière.
  const tries = [...OBJETS].sort((a, b) => a[4] - b[4]);
  for (const [nom, anim, indice, x, y, gauche] of tries) {
    const s = parNom.get(nom);
    let c = cadre(nom, anim, indice);
    if (!s || !c) continue;
    if (gauche) c = miroir(c);
    const ax = gauche ? s.largeur - 1 - s.ancre[0] : s.ancre[0];
    poser(image, c, x - ax, y - s.ancre[1]);
    // Le chat tireur se pose sur sa tour.
    const poste = s.points.get('tireur');
    const archer = parNom.get('archer-chat');
    const cadreArcher = cadre('archer-chat');
    if (poste && archer && cadreArcher) {
      poser(image, cadreArcher, x - s.ancre[0] + poste[0] - archer.ancre[0], y - s.ancre[1] + poste[1] - archer.ancre[1]);
    }
  }
  return agrandirImage(image, 3);
}
