// Cartes dessinées à la main du Village Affamé (32 × 18 tuiles). Chaque carte propose plusieurs chemins : un niveau
// choisit ses entrées (plan-region1.ts), et le décor posé sur un chemin inutilisé reste affiché (assemblage.ts écarte
// le reste). Pas de socles : les tours se posent sur la grille de construction (cases de 2×2 tuiles), dont les cases
// interdites viennent du chemin et des grands décors (grille-niveau.ts).
// Les chemins vont d'une entrée hors de la carte à une sortie hors de la carte ; les chemins d'une même carte
// peuvent partager leur fin.
// Les cartes des régions 2 à 5 sont dans cartes-region2.ts à cartes-region5.ts, même structure (modele-carte.ts) ;
// `CARTES` (cartes-toutes.ts) les rassemble.
import { chemin, decor, zone, type CarteModele } from './modele-carte';

/**
 * Les Chaumes : un grand serpent. Le chemin 0 descend du nord-ouest, le chemin 1 arrive du sud-ouest et le
 * rejoint au milieu de la première descente ; ils partagent la fin du parcours.
 */
export const CHAUMES: CarteModele = {
  id: 'chaumes',
  region: 1,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 4], [12, 4], [12, 13], [24, 13], [24, 7], [33, 7]),
    chemin([-1, 16], [6, 16], [6, 10], [12, 10], [12, 13], [24, 13], [24, 7], [33, 7]),
  ],
  departHeros: { x: 16, y: 13 },
  zones: [zone('boue', 13, 15, 6, 2), zone('boue', 0, 8, 3, 3), zone('paves', 17, 8, 4, 2), zone('paves', 16, 5, 6, 1)],
  decor: [
    // Les ruines du hameau, au nord-est, autour du puits.
    decor('maison-ruine-1', 17, 5),
    decor('maison-ruine-2', 21, 4),
    decor('puits', 19, 9),
    decor('tonneau', 16, 7),
    decor('tonneau', 23, 6),
    decor('cailloux', 20, 7),
    decor('crane', 18, 6.5),
    // Arbres morts.
    decor('arbre-mort-1', 26, 3),
    decor('arbre-mort-2', 31, 4, true),
    decor('arbre-mort-1', 3, 10),
    decor('arbre-mort-2', 15, 2),
    decor('arbre-mort-1', 11, 2, true),
    // Le bûcher éteint et sa clôture, à l'est.
    decor('bucher-eteint', 31, 12),
    decor('cloture-h', 27, 12),
    decor('cloture-h', 28, 12),
    decor('cloture-h', 29, 12),
    decor('cloture-cassee', 26, 12),
    decor('croix', 29, 15),
    decor('croix', 31, 16),
    decor('crane', 30, 14),
    // Le coin des croix, à l'ouest.
    decor('croix', 2, 8),
    decor('croix', 4, 9),
    decor('croix', 1, 11),
    decor('souche', 8, 8),
    decor('touffe', 8, 6.5),
    // Le sud : souches et pierres.
    decor('souche', 12, 16),
    decor('souche', 14, 17),
    decor('cailloux', 11, 17),
    decor('touffe', 20, 17),
    decor('touffe', 24, 16),
    decor('cailloux', 26, 17),
    // Ce qui occupe le couloir du chemin 1 quand on ne l'emprunte pas.
    decor('maison-ruine-2', 3, 16),
    decor('arbre-mort-1', 9, 13),
    decor('cloture-v', 6, 12),
    decor('cloture-v', 6, 13),
    decor('tonneau', 10, 10),
  ],
};

/**
 * Le Gué : un chemin qui s'enroule autour d'un îlot. Le chemin 0 arrive du nord, le chemin 1 de l'est, le
 * chemin 2 du sud-est ; tous finissent par la même descente vers le sud.
 */
export const GUE: CarteModele = {
  id: 'gue',
  region: 1,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([6, -1], [6, 5], [18, 5], [18, 12], [8, 12], [8, 19]),
    chemin([33, 9], [18, 9], [18, 12], [8, 12], [8, 19]),
    chemin([33, 15], [14, 15], [14, 12], [8, 12], [8, 19]),
  ],
  departHeros: { x: 12, y: 12 },
  zones: [zone('boue', 9, 6, 8, 5), zone('boue', 19, 16, 8, 2), zone('paves', 13, 8, 3, 2)],
  decor: [
    // L'îlot au centre, de boue et de croix, avec son puits.
    decor('puits', 14, 9),
    decor('croix', 10, 8),
    decor('croix', 11.5, 9),
    decor('croix', 10, 10),
    decor('crane', 17, 9.5),
    decor('souche', 9.5, 7.5),
    decor('cailloux', 13, 10.5),
    // Le nord-est : ruines et arbres.
    decor('maison-ruine-1', 24, 3),
    decor('maison-ruine-2', 28, 4),
    decor('arbre-mort-1', 21, 2),
    decor('arbre-mort-2', 31, 2, true),
    decor('tonneau', 26, 5),
    decor('tonneau', 27, 5),
    decor('cailloux', 22, 4),
    decor('cloture-h', 20, 1),
    decor('cloture-h', 21, 1),
    // Le bûcher éteint, à l'ouest.
    decor('bucher-eteint', 3, 9),
    decor('croix', 1, 11),
    decor('croix', 5, 11),
    decor('crane', 3, 11.5),
    decor('arbre-mort-1', 2, 14),
    decor('arbre-mort-2', 3, 17),
    // Le sud.
    decor('arbre-mort-1', 12, 17, true),
    decor('souche', 14, 17),
    decor('cailloux', 15, 16),
    decor('touffe', 11, 15),
    decor('tonneau', 30, 17),
    decor('cloture-h', 28, 17),
    decor('cloture-h', 29, 17),
    decor('cloture-cassee', 27, 17),
    decor('touffe', 29, 12),
    decor('souche', 30, 11),
    decor('cailloux', 31, 13),
    // Ce qui occupe les couloirs des chemins 1 et 2 quand on ne les emprunte pas.
    decor('maison-ruine-1', 27, 9),
    decor('arbre-mort-2', 22, 9),
    decor('arbre-mort-1', 30, 15),
    decor('cloture-v', 20, 15),
    decor('cloture-v', 24, 15),
  ],
};

/**
 * La Route des Pendus : une arche. Le chemin 0 longe le bas puis monte sur la gauche, le chemin 1 arrive du
 * nord-ouest et le chemin 2 du nord-est ; tous finissent par la descente de droite.
 */
export const PENDUS: CarteModele = {
  id: 'pendus',
  region: 1,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 14], [10, 14], [10, 4], [22, 4], [22, 14], [33, 14]),
    chemin([4, -1], [4, 9], [10, 9], [10, 4], [22, 4], [22, 14], [33, 14]),
    chemin([28, -1], [28, 9], [22, 9], [22, 14], [33, 14]),
  ],
  departHeros: { x: 16, y: 4 },
  zones: [zone('paves', 14, 8, 5, 2), zone('boue', 0, 17, 10, 1), zone('boue', 23, 9, 8, 2)],
  decor: [
    // Les potences au centre de l'arche.
    decor('potence', 15, 10),
    decor('potence', 18, 12),
    decor('crane', 16.5, 8.5),
    decor('crane', 13, 13),
    decor('cailloux', 19, 9.5),
    decor('croix', 14, 12),
    decor('croix', 13, 8.5),
    // Le sud de l'arche : une maison et le bûcher éteint.
    decor('maison-ruine-1', 13, 16),
    decor('maison-ruine-2', 19, 16, true),
    decor('bucher-eteint', 16, 16),
    decor('tonneau', 12, 14.5),
    decor('tonneau', 21, 14.5),
    // Les arbres morts des marges.
    decor('arbre-mort-1', 1, 4),
    decor('arbre-mort-2', 1, 8, true),
    decor('arbre-mort-1', 25, 2),
    decor('arbre-mort-2', 31, 9),
    decor('arbre-mort-1', 31, 3, true),
    decor('souche', 25, 6),
    decor('souche', 1, 12),
    decor('cailloux', 2, 11),
    decor('touffe', 12, 2),
    decor('touffe', 20, 2),
    // Une clôture et des croix à l'est.
    decor('cloture-h', 25, 11),
    decor('cloture-h', 26, 11),
    decor('croix', 27, 12),
    decor('croix', 29, 12),
    decor('croix', 31, 12),
    decor('crane', 28, 12.5),
    // Ce qui occupe les couloirs des chemins 1 et 2 quand on ne les emprunte pas.
    decor('maison-ruine-1', 3, 5),
    decor('arbre-mort-2', 7, 8),
    decor('cloture-v', 4, 2),
    decor('cloture-v', 4, 3),
    decor('arbre-mort-1', 28, 3),
    decor('cloture-v', 28, 6),
    decor('tonneau', 26, 8),
  ],
};

/**
 * Le Carrefour : trois chemins (deux à l'ouest, un au nord) se rejoignent sur une longue ligne droite, puis
 * descendent d'un cran vers la sortie à l'est.
 */
export const CARREFOUR: CarteModele = {
  id: 'carrefour',
  region: 1,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 5], [8, 5], [8, 9], [20, 9], [20, 13], [33, 13]),
    chemin([-1, 15], [8, 15], [8, 9], [20, 9], [20, 13], [33, 13]),
    chemin([16, -1], [16, 9], [20, 9], [20, 13], [33, 13]),
  ],
  departHeros: { x: 18, y: 9 },
  zones: [zone('paves', 10, 1, 5, 4), zone('boue', 11, 13, 7, 4), zone('boue', 25, 0, 6, 3)],
  decor: [
    // Le bûcher éteint de la place, au nord-ouest, et ses murs en ruine.
    decor('bucher-eteint', 12, 3),
    decor('maison-ruine-1', 10, 2, true),
    decor('tonneau', 14, 1.5),
    decor('croix', 10, 4),
    decor('crane', 13.5, 4.5),
    decor('cailloux', 11, 5),
    // Le nord-est : un hameau mort.
    decor('maison-ruine-2', 24, 4),
    decor('maison-ruine-1', 28, 3, true),
    decor('puits', 24, 7),
    decor('tonneau', 26, 6),
    decor('tonneau', 22, 3),
    decor('arbre-mort-1', 30, 8),
    decor('arbre-mort-2', 21, 2),
    decor('cloture-h', 26, 9),
    decor('cloture-h', 27, 9),
    decor('cloture-h', 28, 9),
    // Le sud, entre les deux branches.
    decor('maison-ruine-2', 14, 16),
    decor('croix', 12, 15),
    decor('croix', 17, 15),
    decor('croix', 15, 14),
    decor('crane', 16, 16.5),
    decor('souche', 11, 14.5),
    decor('arbre-mort-1', 18, 17),
    decor('arbre-mort-2', 30, 16),
    decor('arbre-mort-1', 27, 17, true),
    decor('cailloux', 22, 17),
    decor('touffe', 31, 15),
    decor('touffe', 3, 10),
    decor('souche', 1, 11),
    decor('arbre-mort-2', 1, 12),
    decor('cloture-h', 5, 10),
    decor('cloture-h', 6, 10),
    // Ce qui occupe les couloirs des chemins 1 et 2 quand on ne les emprunte pas.
    decor('maison-ruine-1', 3, 15),
    decor('arbre-mort-2', 6, 16),
    decor('arbre-mort-1', 16, 3),
    decor('cloture-v', 16, 6),
    decor('cloture-v', 16, 7),
    decor('tonneau', 15, 1.5),
  ],
};
