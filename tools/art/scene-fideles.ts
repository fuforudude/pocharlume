// Planche d'aperçu des trois fidèles (Nielle, Gond, Clopin) et le gros matou des Renforts (repos, marche, attaque, compétence) et des trois symboles des
// dieux sans visage (l'Ombre, le Colosse, Trois-Pattes), sur l'herbe sombre. Sert seulement à juger les sprites en situation.
import type { Couche } from './couche.ts';
import { agrandirImage, poser } from './apercu.ts';
import type { SpriteDessine } from './dessin.ts';
import { nouvelleImage, type Image } from './png.ts';

// Le gros matou des Renforts est montré à côté de Gond, pour comparer les tailles.
const FIDELES = ['heros-plume', 'charlie', 'gros-matou', 'heros-pollen'] as const;
/** Colonne de chaque symbole et portrait (le gros matou n'en a pas). */
const COLONNES_DIEUX = [0, 1, 3] as const;
const SYMBOLES = ['icone-dieu-plume', 'icone-dieu-charlie', 'icone-dieu-pollen'] as const;
const PORTRAITS = ['icone-portrait-plume', 'icone-portrait-charlie', 'icone-portrait-pollen'] as const;
const RANGEES: readonly (readonly [string, number])[] = [['repos', 0], ['marche', 1], ['attaque', 1], ['competence', 3]];
const CASE = 40;
const RANGEE = 34;

export function planFideles(sprites: readonly SpriteDessine[], facteur = 6): Image {
  const parNom = new Map(sprites.map((s) => [s.nom, s]));
  const cadre = (nom: string, anim: string, indice: number): Couche | undefined => {
    const a = parNom.get(nom)?.anims.find((x) => x.nom === anim);
    return a?.cadres[Math.min(indice, (a.cadres.length || 1) - 1)]?.couche;
  };
  const largeur = CASE * FIDELES.length + 4;
  const image = nouvelleImage(largeur, RANGEE * RANGEES.length + 2 * 30 + 6);
  for (let y = 0; y < image.hauteur; y += 16) {
    for (let x = 0; x < image.largeur; x += 16) {
      const t = cadre(`herbe-${String(1 + (((x >> 4) * 7 + (y >> 4) * 13) % 3))}`, 'repos', 0);
      if (t) poser(image, t, x, y);
    }
  }
  const pose = (nom: string, anim: string, indice: number, x: number, y: number): void => {
    const s = parNom.get(nom);
    const c = cadre(nom, anim, indice);
    if (s && c) poser(image, c, x - s.ancre[0], y - s.ancre[1]);
  };
  RANGEES.forEach(([anim, indice], r) => {
    FIDELES.forEach((nom, i) => { pose(nom, anim, indice, 2 + i * CASE + CASE / 2, r * RANGEE + 31); });
  });
  const baseSymboles = RANGEE * RANGEES.length + 22;
  SYMBOLES.forEach((nom, i) => { pose(nom, 'repos', 0, 2 + (COLONNES_DIEUX[i] ?? i) * CASE + CASE / 2, baseSymboles); });
  PORTRAITS.forEach((nom, i) => { pose(nom, 'repos', 0, 2 + (COLONNES_DIEUX[i] ?? i) * CASE + CASE / 2, baseSymboles + 30); });
  return agrandirImage(image, facteur);
}
