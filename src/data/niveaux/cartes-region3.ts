// Cartes dessinées à la main de la région 3, le Bourg des Bûchers (32 × 18 tuiles). Même structure que les cartes du
// Village Affamé (cartes.ts) : une ou deux entrées, des socles fixes à 2 tuiles de l'axe des chemins (leur ralliement de
// caserne est le point de l'axe le plus proche). Un niveau qui n'emprunte pas tous les chemins ne garde que les socles à portée
// des chemins utilisés (plan-region3.ts) ; le décor posé dans le couloir d'un chemin inutilisé reste affiché.
import { chemin, decor, socle, zone, type CarteModele } from './modele-carte';

/**
 * Les Ruelles : un seul chemin qui se faufile entre les maisons brûlées, par coudes serrés, de la porte nord-ouest au faubourg du sud-est.
 */
export const RUELLES: CarteModele = {
  id: 'ruelles',
  region: 3,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([4, -1], [4, 8], [12, 8], [12, 3], [20, 3], [20, 12], [28, 12], [28, 19]),
  ],
  socles: [
    socle(2, 2, 4, 2), // 0
    socle(6, 6, 4, 6), // 1
    socle(9, 10, 9, 8), // 2
    socle(10, 6, 10, 8), // 3
    socle(14, 5, 12, 5), // 4
    socle(18, 5, 18, 3), // 5
    socle(22, 10, 20, 10), // 6
    socle(26, 14, 26, 12), // 7
    socle(30, 16, 28, 16), // 8
  ],
  departHeros: { x: 24, y: 12 },
  zones: [zone('paves', 14, 5, 5, 4), zone('paves', 22, 5, 5, 4), zone('boue', 6, 11, 5, 4), zone('boue', 0, 11, 2, 6)],
  decor: [
    decor('fagots', 29, 1.5),
    decor('crane', 31, 1.5, true),
    decor('maison-brulee-1', 24, 3),
    decor('torche-fichee', 1.5, 3.5),
    decor('tonneau', 6, 4),
    decor('echafaud', 8, 4),
    decor('maison-brulee-1', 28.5, 4.5),
    decor('tonneau', 1.5, 5.5),
    decor('maison-brulee-1', 23.5, 6, true),
    decor('fagots', 25.5, 6),
    decor('torche-fichee', 17.5, 6.5),
    decor('tonneau', 2, 7, true),
    decor('maison-brulee-2', 30, 7),
    decor('maison-brulee-1', 15.5, 7.5, true),
    decor('fagots', 23.5, 7.5),
    decor('tonneau', 22, 8, true),
    decor('cendres', 1, 8.5),
    decor('cloche-fendue', 14, 9),
    decor('fagots', 24, 9, true),
    decor('maison-brulee-2', 26, 9),
    decor('cloture-v', 28, 9),
    decor('crane', 30, 9.5),
    decor('echafaud', 16.5, 10),
    decor('crane', 24.5, 10.5),
    decor('torche-fichee', 1.5, 11.5),
    decor('maison-brulee-1', 6.5, 11.5),
    decor('cailloux', 8.5, 11.5, true),
    decor('bucher-braises', 14, 11.5),
    decor('croix', 18, 12.5),
    decor('tonneau', 30.5, 12.5, true),
    decor('cendres', 1, 13),
    decor('maison-brulee-1', 10.5, 13, true),
    decor('cloche-fendue', 3, 13.5),
    decor('tonneau', 4.5, 13.5, true),
    decor('maison-brulee-2', 8, 14, true),
    decor('tonneau', 14, 14),
    decor('cloture-v', 30, 14, true),
    decor('cendres', 23.5, 14.5),
    decor('bucher-braises', 16, 15),
    decor('cendres', 21.5, 15),
    decor('cendres', 1.5, 15.5),
    decor('tonneau', 9, 15.5),
    decor('tonneau', 7, 16),
    decor('echafaud', 19, 16),
    decor('fagots', 24, 16, true),
    decor('fagots', 3.5, 16.5),
    decor('cendres', 5.5, 16.5, true),
    decor('maison-brulee-2', 11.5, 16.5),
    decor('cendres', 0.5, 17),
    decor('fagots', 2, 17, true),
    decor('cloture-h', 16.5, 17, true),
    decor('cendres', 22, 17, true),
    decor('croix', 14.5, 17.5, true),
  ],
};

/**
 * La Place du Bûcher : un chemin fait le tour de la place par l’ouest et le sud, un autre y tombe du nord ; ils se rejoignent à l’est.
 */
export const PLACE: CarteModele = {
  id: 'place',
  region: 3,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 6], [8, 6], [8, 14], [24, 14], [24, 9], [33, 9]),
    chemin([16, -1], [16, 9], [24, 9], [33, 9]),
  ],
  socles: [
    socle(1, 4, 1, 6), // 0
    socle(6, 8, 6, 6), // 1
    socle(10, 12, 8, 12), // 2
    socle(14, 2, 16, 2), // 3
    socle(16, 16, 16, 14), // 4
    socle(18, 7, 16, 7), // 5
    socle(20, 16, 20, 14), // 6
    socle(22, 7, 22, 9), // 7
    socle(22, 12, 22, 14), // 8
    socle(26, 11, 24, 11), // 9
    socle(30, 11, 30, 9), // 10
  ],
  departHeros: { x: 28, y: 9 },
  zones: [zone('paves', 10, 7, 5, 5), zone('paves', 17, 10, 6, 3), zone('boue', 0, 10, 5, 6), zone('boue', 25, 1, 6, 5)],
  decor: [
    decor('maison-brulee-1', 3, 2),
    decor('maison-brulee-1', 5.5, 2, true),
    decor('crane', 18, 2),
    decor('cendres', 30.5, 2, true),
    decor('maison-brulee-2', 8, 2.5, true),
    decor('maison-brulee-1', 11, 2.5, true),
    decor('crane', 19.5, 2.5, true),
    decor('cendres', 24, 2.5, true),
    decor('maison-brulee-1', 21.5, 3, true),
    decor('maison-brulee-1', 27.5, 3.5),
    decor('cendres', 30, 3.5),
    decor('fagots', 4, 4, true),
    decor('crane', 5.5, 4.5),
    decor('torche-fichee', 21, 4.5, true),
    decor('cloture-h', 22.5, 4.5, true),
    decor('echafaud', 19, 5),
    decor('crane', 30, 5),
    decor('maison-brulee-2', 11.5, 5.5),
    decor('maison-brulee-1', 25, 5.5, true),
    decor('cendres', 1.5, 6, true),
    decor('fagots', 14, 6),
    decor('tonneau', 25, 7),
    decor('maison-brulee-2', 27.5, 7),
    decor('croix', 20, 7.5, true),
    decor('fagots', 30, 7.5, true),
    decor('cailloux', 16, 8, true),
    decor('cloture-h', 10, 8.5),
    decor('fagots', 14, 8.5),
    decor('bucher-braises', 12, 9),
    decor('cendres', 19, 9),
    decor('maison-brulee-1', 3.5, 9.5),
    decor('cloche-fendue', 6, 9.5),
    decor('cloture-h', 20.5, 9.5, true),
    decor('fagots', 12, 10.5, true),
    decor('torche-fichee', 13.5, 10.5, true),
    decor('cendres', 1.5, 11, true),
    decor('cendres', 4, 11.5),
    decor('tonneau', 17.5, 11.5),
    decor('croix', 5.5, 12),
    decor('cloche-fendue', 13, 12),
    decor('croix', 16, 12, true),
    decor('tonneau', 19, 12),
    decor('torche-fichee', 27, 12.5, true),
    decor('tonneau', 29, 12.5),
    decor('crane', 1, 13.5, true),
    decor('echafaud', 3, 14),
    decor('torche-fichee', 5.5, 14),
    decor('fagots', 19.5, 14, true),
    decor('tonneau', 8.5, 14.5),
    decor('cailloux', 26, 14.5),
    decor('cendres', 30.5, 14.5),
    decor('maison-brulee-2', 28, 15),
    decor('cendres', 1.5, 15.5),
    decor('torche-fichee', 30, 16, true),
    decor('maison-brulee-1', 5, 16.5),
    decor('cendres', 22.5, 16.5),
    decor('tonneau', 3, 17, true),
    decor('torche-fichee', 9, 17),
    decor('cendres', 13, 17),
    decor('crane', 26.5, 17),
    decor('cloche-fendue', 28.5, 17),
    decor('cloture-h', 16.5, 17.5),
    decor('cloture-h', 20.5, 17.5),
    decor('crane', 31, 17.5),
  ],
};

/**
 * Le Beffroi : un chemin descend de l’est autour du beffroi, un autre vient de l’ouest ; ils se rejoignent au pied de la tour avant de sortir par le sud.
 */
export const BEFFROI: CarteModele = {
  id: 'beffroi',
  region: 3,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([33, 4], [22, 4], [22, 10], [10, 10], [10, 19]),
    chemin([-1, 6], [10, 6], [10, 10], [10, 19]),
  ],
  socles: [
    socle(1, 8, 1, 6), // 0
    socle(3, 4, 3, 6), // 1
    socle(7, 4, 7, 6), // 2
    socle(8, 8, 8, 6), // 3
    socle(8, 16, 10, 16), // 4
    socle(12, 12, 12, 10), // 5
    socle(16, 8, 16, 10), // 6
    socle(20, 8, 22, 8), // 7
    socle(24, 6, 24, 4), // 8
    socle(28, 2, 28, 4), // 9
    socle(31, 6, 31, 4), // 10
  ],
  departHeros: { x: 10, y: 14 },
  zones: [zone('paves', 12, 6, 8, 3), zone('paves', 24, 11, 6, 4), zone('boue', 0, 12, 6, 4), zone('boue', 14, 13, 6, 4)],
  decor: [
    decor('fagots', 2, 1.5, true),
    decor('cloture-v', 8.5, 1.5, true),
    decor('cloche-fendue', 22.5, 1.5),
    decor('torche-fichee', 3.5, 2),
    decor('maison-brulee-2', 16, 2),
    decor('croix', 25, 2),
    decor('cendres', 5, 2.5),
    decor('cloche-fendue', 30, 2.5, true),
    decor('bucher-braises', 19.5, 3),
    decor('torche-fichee', 14, 3.5, true),
    decor('maison-brulee-1', 12, 5),
    decor('maison-brulee-2', 16.5, 5),
    decor('cloture-v', 20, 5),
    decor('tonneau', 18.5, 5.5),
    decor('cloche-fendue', 8.5, 6),
    decor('tonneau', 22, 6),
    decor('maison-brulee-1', 5, 6.5),
    decor('fagots', 18, 7),
    decor('maison-brulee-1', 13.5, 7.5, true),
    decor('fagots', 22, 7.5, true),
    decor('cloture-h', 10, 8, true),
    decor('bucher-braises', 27, 8),
    decor('fagots', 18, 8.5, true),
    decor('tonneau', 30, 8.5),
    decor('echafaud', 3.5, 9.5),
    decor('echafaud', 24.5, 9.5, true),
    decor('fagots', 27, 9.5),
    decor('torche-fichee', 1.5, 10),
    decor('tonneau', 16.5, 10.5, true),
    decor('maison-brulee-1', 6.5, 11, true),
    decor('echafaud', 30, 11),
    decor('crane', 27, 11.5),
    decor('fagots', 25.5, 12, true),
    decor('cloche-fendue', 15.5, 12.5),
    decor('croix', 17.5, 13),
    decor('tonneau', 23, 13, true),
    decor('cendres', 4.5, 13.5),
    decor('fagots', 7, 13.5, true),
    decor('croix', 19, 13.5),
    decor('fagots', 25, 13.5),
    decor('cloche-fendue', 31, 13.5, true),
    decor('cendres', 0.5, 14),
    decor('maison-brulee-1', 2.5, 14),
    decor('maison-brulee-2', 21, 14),
    decor('maison-brulee-1', 28, 14),
    decor('tonneau', 12, 14.5, true),
    decor('crane', 15, 14.5),
    decor('fagots', 26, 15),
    decor('cendres', 1.5, 15.5),
    decor('cendres', 19, 15.5, true),
    decor('torche-fichee', 23, 15.5, true),
    decor('cendres', 4, 16, true),
    decor('crane', 5.5, 16),
    decor('fagots', 13.5, 16, true),
    decor('maison-brulee-2', 17, 16),
    decor('cloture-h', 28, 16),
    decor('cloture-h', 30, 16, true),
    decor('crane', 15, 16.5, true),
    decor('cloche-fendue', 1.5, 17),
    decor('fagots', 12, 17),
    decor('cendres', 19, 17),
    decor('maison-brulee-1', 21, 17),
    decor('cloche-fendue', 25.5, 17),
    decor('cloche-fendue', 8, 17.5, true),
    decor('fagots', 13.5, 17.5, true),
    decor('croix', 17.5, 17.5),
  ],
};
