// Scène d'aperçu du jalon 2 : les 9 héros côte à côte (repos, marche, attaque, compétence) sur l'herbe sombre,
// puis les deux tours divines avec leurs unités. Sert seulement à juger les sprites en situation.
import type { Couche } from './couche.ts';
import { agrandirImage, poser } from './apercu.ts';
import type { SpriteDessine } from './dessin.ts';
import { nouvelleImage, type Image } from './png.ts';

/** Les 9 héros, du dieu Plume au dieu Pollen (le sprite de Charlie garde son nom historique). */
export const HEROS_J2 = [
  'heros-plume', 'heros-suie', 'heros-corbeau', 'charlie', 'heros-mastoc', 'heros-brise-os',
  'heros-pollen', 'heros-rouage', 'heros-lanterne',
] as const;

/** Rangées de héros : animation et indice de cadre montrés. */
const RANGEES: readonly (readonly [string, number])[] = [['repos', 0], ['marche', 1], ['attaque', 1], ['competence', 3]];
const LARGEUR_CASE = 34;
const HAUTEUR_RANGEE = 34;

export function planHerosJ2(sprites: readonly SpriteDessine[], facteur = 3): Image {
  const parNom = new Map(sprites.map((s) => [s.nom, s]));
  const cadre = (nom: string, anim: string, indice: number): Couche | undefined => {
    const a = parNom.get(nom)?.anims.find((x) => x.nom === anim);
    return a?.cadres[Math.min(indice, (a.cadres.length || 1) - 1)]?.couche;
  };
  const largeur = LARGEUR_CASE * HEROS_J2.length + 4;
  const hautTours = 60;
  const image = nouvelleImage(largeur, HAUTEUR_RANGEE * RANGEES.length + hautTours + 6);
  for (let y = 0; y < image.hauteur; y += 16) {
    for (let x = 0; x < image.largeur; x += 16) {
      const t = cadre(`herbe-${String(1 + (((x >> 4) * 7 + (y >> 4) * 13) % 3))}`, 'repos', 0);
      if (t) poser(image, t, x, y);
    }
  }
  RANGEES.forEach(([anim, indice], r) => {
    HEROS_J2.forEach((nom, i) => {
      const s = parNom.get(nom);
      const c = cadre(nom, anim, indice);
      if (!s || !c) return;
      poser(image, c, 2 + i * LARGEUR_CASE + 1 - s.ancre[0] + 16, r * HAUTEUR_RANGEE + 32 - s.ancre[1] - 1 + 1);
    });
  });
  // Tours divines, leurs unités et leurs pièges, sur un socle.
  const base = HAUTEUR_RANGEE * RANGEES.length + 52;
  const pose = (nom: string, anim: string, indice: number, x: number, y: number): void => {
    const s = parNom.get(nom);
    const c = cadre(nom, anim, indice);
    if (s && c) poser(image, c, x - s.ancre[0], y - s.ancre[1]);
  };
  pose('socle', 'repos', 0, 40, base);
  pose('tour-sanctuaire', 'repos', 0, 40, base);
  pose('assassin-ombre', 'repos', 0, 66, base - 2);
  pose('assassin-ombre', 'attaque', 1, 84, base + 2);
  pose('socle', 'repos', 0, 140, base);
  pose('tour-atelier', 'repos', 0, 140, base);
  pose('tourelle-atelier', 'repos', 0, 170, base - 2);
  pose('tourelle-atelier', 'attaque', 1, 192, base - 2);
  pose('piege', 'repos', 0, 222, base);
  pose('piege', 'declenche', 0, 244, base);
  pose('tour-totem', 'repos', 0, 280, base);
  return agrandirImage(image, facteur);
}
