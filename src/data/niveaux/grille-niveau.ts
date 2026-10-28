// Cases interdites d'un niveau : le moteur ne lit pas l'habillage, alors on les calcule ici, à l'assemblage, depuis les
// chemins du niveau et les grands décors qu'il affiche. Une case de la grille (2×2 tuiles) est interdite si l'une de ses
// tuiles est du chemin ou porte un grand décor. L'herbe, les fleurs, les petits cailloux et tout décor de 16×16 ne bloquent pas.
import { REGLES } from '../regles';
import type { Carte, CaseGrille } from '../../engine/definitions';
import type { Decor } from '../visuel';
import { DEMI_LARGEUR_CHEMIN, GRANDS_DECORS, empriseDecor, RECOUVREMENT_MIN_DECOR } from './habillage';
import type { Rect } from './geometrie';

type CarteChemins = Pick<Carte, 'largeur' | 'hauteur' | 'chemins'>;

function distanceSegment2(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const longueur2 = dx * dx + dy * dy;
  const t = longueur2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / longueur2));
  const ex = px - (ax + t * dx);
  const ey = py - (ay + t * dy);
  return ex * ex + ey * ey;
}

/**
 * Tuiles du chemin, rangées par ligne : celles dont le centre est à `DEMI_LARGEUR_CHEMIN` tuile ou moins de l'axe d'un
 * chemin. C'est la règle du sol dessiné (`masqueChemin` de src/render/sol.ts), un test les garde identiques.
 */
export function tuilesDeChemin(carte: CarteChemins): Uint8Array {
  const masque = new Uint8Array(carte.largeur * carte.hauteur);
  const limite2 = DEMI_LARGEUR_CHEMIN * DEMI_LARGEUR_CHEMIN;
  for (let y = 0; y < carte.hauteur; y++) {
    for (let x = 0; x < carte.largeur; x++) {
      const dedans = carte.chemins.some((chemin) =>
        chemin.points.some((b, i) => {
          const a = chemin.points[i - 1];
          return a !== undefined && distanceSegment2(x + 0.5, y + 0.5, a.x, a.y, b.x, b.y) <= limite2;
        }),
      );
      masque[y * carte.largeur + x] = dedans ? 1 : 0;
    }
  }
  return masque;
}

/** Longueur de recouvrement de [a0, a1] et [b0, b1]. */
function recouvrement(a0: number, a1: number, b0: number, b1: number): number {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

/** Tuiles couvertes par un grand décor : celles que son emprise recouvre de plus de `RECOUVREMENT_MIN_DECOR` dans les deux sens. */
function tuilesDeGrandDecor(emprise: Rect): [number, number][] {
  const tuiles: [number, number][] = [];
  for (let y = Math.floor(emprise.y0); y < Math.ceil(emprise.y1); y++) {
    for (let x = Math.floor(emprise.x0); x < Math.ceil(emprise.x1); x++) {
      if (recouvrement(x, x + 1, emprise.x0, emprise.x1) > RECOUVREMENT_MIN_DECOR && recouvrement(y, y + 1, emprise.y0, emprise.y1) > RECOUVREMENT_MIN_DECOR) {
        tuiles.push([x, y]);
      }
    }
  }
  return tuiles;
}

/**
 * Les cases de la grille interdites : chemin du niveau ou grand décor visible sur l'une de leurs tuiles. Ordre : ligne
 * par ligne. Les décors passés doivent être ceux que le niveau affiche (`decorVisible`).
 */
export function casesInterditesDuNiveau(carte: CarteChemins, decors: readonly Decor[]): CaseGrille[] {
  const taille = REGLES.tailleCase;
  const bloquee = tuilesDeChemin(carte);
  for (const d of decors) {
    if (!GRANDS_DECORS.has(d.sprite)) continue;
    for (const [x, y] of tuilesDeGrandDecor(empriseDecor(d))) {
      if (x >= 0 && y >= 0 && x < carte.largeur && y < carte.hauteur) bloquee[y * carte.largeur + x] = 1;
    }
  }
  const interdites: CaseGrille[] = [];
  for (let cy = 0; cy < Math.floor(carte.hauteur / taille); cy++) {
    for (let cx = 0; cx < Math.floor(carte.largeur / taille); cx++) {
      let interdite = false;
      for (let dy = 0; dy < taille && !interdite; dy++) {
        for (let dx = 0; dx < taille; dx++) {
          if (bloquee[(cy * taille + dy) * carte.largeur + cx * taille + dx]) interdite = true;
        }
      }
      if (interdite) interdites.push({ cx, cy });
    }
  }
  return interdites;
}
