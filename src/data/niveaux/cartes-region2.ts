// Cartes dessinées à la main de la région 2, les Champs Brûlés (32 × 18 tuiles). Même structure que les cartes du
// Village Affamé (cartes.ts) : une ou deux entrées, des socles fixes à 2 tuiles de l'axe des chemins (leur ralliement de
// caserne est le point de l'axe le plus proche). Un niveau qui n'emprunte pas tous les chemins ne garde que les socles à portée
// des chemins utilisés (plan-region2.ts) ; le décor posé dans le couloir d'un chemin inutilisé reste affiché.
import { chemin, decor, socle, zone, type CarteModele } from './modele-carte';

/**
 * Les Sillons : un seul chemin qui remonte les rangs de labour en serpentant, des fermes calcinées au nord, un champ de gerbes brûlées au sud.
 */
export const SILLONS: CarteModele = {
  id: 'sillons',
  region: 2,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 5], [18, 5], [18, 10], [6, 10], [6, 15], [33, 15]),
  ],
  socles: [
    socle(1, 7, 1, 5), // 0
    socle(4, 3, 4, 5), // 1
    socle(8, 12, 8, 10), // 2
    socle(11, 7, 11, 5), // 3
    socle(14, 13, 14, 15), // 4
    socle(16, 7, 16, 5), // 5
    socle(18, 13, 18, 15), // 6
    socle(24, 13, 24, 15), // 7
    socle(30, 13, 30, 15), // 8
  ],
  departHeros: { x: 24, y: 15 },
  zones: [zone('boue', 1, 12, 4, 3), zone('boue', 22, 0, 8, 2), zone('paves', 20, 7, 6, 3), zone('paves', 9, 12, 4, 2)],
  decor: [
    decor('cloture-cassee', 1.5, 1.5, true),
    decor('sillon', 26, 1.5, true),
    decor('sillon', 27.5, 1.5),
    decor('sillon', 29, 1.5, true),
    decor('arbre-calcine-2', 11, 2),
    decor('tonneau', 15.5, 2, true),
    decor('tonneau', 31, 2),
    decor('cailloux', 7, 3, true),
    decor('souche-calcinee', 9, 3),
    decor('arbre-calcine-1', 24, 3),
    decor('sillon', 2, 3.5),
    decor('gerbes-brulees', 10.5, 3.5),
    decor('arbre-calcine-2', 13.5, 3.5, true),
    decor('sillon', 15.5, 3.5, true),
    decor('arbre-calcine-2', 17.5, 3.5, true),
    decor('souche-calcinee', 31, 3.5),
    decor('arbre-calcine-2', 20.5, 4),
    decor('sillon', 26, 4),
    decor('arbre-calcine-1', 28.5, 4, true),
    decor('gerbes-brulees', 22.5, 4.5),
    decor('cailloux', 30.5, 6),
    decor('arbre-calcine-2', 28, 6.5, true),
    decor('arbre-calcine-2', 21, 7),
    decor('tonneau', 6, 7.5, true),
    decor('souche-calcinee', 8.5, 7.5),
    decor('cloture-cassee', 10, 8.5, true),
    decor('souche-calcinee', 12, 8.5),
    decor('croix', 15, 8.5),
    decor('gerbes-brulees', 21, 8.5),
    decor('chariot-brise', 23.5, 8.5),
    decor('cailloux', 29, 8.5),
    decor('meule-brulee', 27, 9),
    decor('arbre-calcine-1', 1, 9.5),
    decor('arbre-calcine-2', 3.5, 10, true),
    decor('gerbes-brulees', 22.5, 10),
    decor('gerbes-brulees', 27.5, 10.5, true),
    decor('fourche-brisee', 25, 11),
    decor('chariot-brise', 29.5, 11),
    decor('crane', 1, 11.5),
    decor('arbre-calcine-2', 20.5, 11.5, true),
    decor('arbre-calcine-2', 3.5, 12.5),
    decor('cailloux', 16, 13, true),
    decor('gerbes-brulees', 21.5, 13, true),
    decor('sillon', 1.5, 13.5, true),
    decor('tonneau', 10, 13.5, true),
    decor('gerbes-brulees', 11.5, 13.5),
    decor('souche-calcinee', 20, 13.5, true),
    decor('arbre-calcine-1', 27.5, 13.5, true),
    decor('sillon', 2.5, 15, true),
    decor('sillon', 4, 15, true),
    decor('gerbes-brulees', 1.5, 17),
    decor('crane', 3.5, 17.5),
    decor('tonneau', 5.5, 17.5),
    decor('souche-calcinee', 7, 17.5, true),
    decor('fourche-brisee', 12, 17.5),
    decor('souche-calcinee', 15.5, 17.5, true),
    decor('gerbes-brulees', 19.5, 17.5, true),
  ],
};

/**
 * Les Meules : deux chemins, l’un par le haut, l’autre par le bas, qui se rejoignent au milieu pour finir en une longue ligne droite.
 */
export const MEULES: CarteModele = {
  id: 'meules',
  region: 2,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 5], [10, 5], [10, 12], [22, 12], [22, 7], [33, 7]),
    chemin([-1, 15], [5, 15], [5, 12], [10, 12], [22, 12], [22, 7], [33, 7]),
  ],
  socles: [
    socle(1, 13, 1, 15), // 0
    socle(2, 3, 2, 5), // 1
    socle(4, 7, 4, 5), // 2
    socle(7, 14, 5, 14), // 3
    socle(8, 7, 8, 5), // 4
    socle(12, 10, 10, 10), // 5
    socle(16, 14, 16, 12), // 6
    socle(20, 10, 20, 12), // 7
    socle(24, 9, 22, 9), // 8
    socle(27, 5, 27, 7), // 9
    socle(30, 9, 30, 7), // 10
  ],
  departHeros: { x: 16, y: 12 },
  zones: [zone('boue', 12, 2, 6, 3), zone('boue', 26, 12, 5, 4), zone('paves', 14, 7, 5, 2), zone('paves', 1, 7, 4, 2)],
  decor: [
    decor('tonneau', 14, 1.5, true),
    decor('cloture-cassee', 8, 2),
    decor('souche-calcinee', 16.5, 2),
    decor('cloture-h', 30.5, 2, true),
    decor('gerbes-brulees', 23.5, 2.5, true),
    decor('arbre-calcine-1', 4.5, 3),
    decor('arbre-calcine-2', 10.5, 3),
    decor('sillon', 13, 3, true),
    decor('meule-brulee', 19, 3),
    decor('chariot-brise', 26, 3),
    decor('cloture-cassee', 8.5, 3.5),
    decor('chariot-brise', 21.5, 3.5),
    decor('gerbes-brulees', 29.5, 3.5),
    decor('meule-brulee', 15.5, 4.5, true),
    decor('cloture-h', 17.5, 4.5, true),
    decor('croix', 25, 4.5),
    decor('gerbes-brulees', 12, 5, true),
    decor('sillon', 13.5, 5, true),
    decor('sillon', 1.5, 5.5, true),
    decor('fourche-brisee', 20, 5.5),
    decor('souche-calcinee', 22.5, 5.5),
    decor('souche-calcinee', 29.5, 5.5),
    decor('meule-brulee', 17, 7, true),
    decor('sillon', 12.5, 7.5),
    decor('arbre-calcine-2', 10.5, 8),
    decor('crane', 19, 8),
    decor('gerbes-brulees', 1.5, 8.5, true),
    decor('arbre-calcine-2', 14.5, 8.5),
    decor('arbre-calcine-2', 6, 10, true),
    decor('cloture-cassee', 15.5, 10, true),
    decor('chariot-brise', 3.5, 10.5),
    decor('tonneau', 10, 10.5, true),
    decor('meule-brulee', 17.5, 10.5),
    decor('croix', 24, 10.5),
    decor('fourche-brisee', 30.5, 10.5, true),
    decor('croix', 1.5, 11),
    decor('arbre-calcine-1', 28.5, 11.5),
    decor('tonneau', 25.5, 12.5),
    decor('sillon', 27, 13),
    decor('sillon', 29.5, 13),
    decor('gerbes-brulees', 3, 13.5),
    decor('fourche-brisee', 10, 14.5, true),
    decor('gerbes-brulees', 12.5, 14.5),
    decor('sillon', 30.5, 14.5),
    decor('souche-calcinee', 18, 15, true),
    decor('arbre-calcine-1', 24, 15, true),
    decor('crane', 0.5, 15.5),
    decor('gerbes-brulees', 3, 15.5, true),
    decor('cloture-h', 8, 15.5, true),
    decor('chariot-brise', 27.5, 16),
    decor('sillon', 30, 16),
    decor('arbre-calcine-1', 5.5, 16.5, true),
    decor('meule-brulee', 15.5, 16.5),
    decor('arbre-calcine-1', 20.5, 16.5),
    decor('arbre-calcine-2', 10.5, 17),
    decor('cloture-cassee', 13.5, 17, true),
    decor('gerbes-brulees', 18, 17, true),
    decor('cailloux', 22.5, 17, true),
    decor('souche-calcinee', 1, 17.5),
    decor('cloture-h', 25, 17.5),
  ],
};

/**
 * L’Aire de Battage : on descend du nord par une aire brûlée ; un second chemin arrive de l’est et les deux se rejoignent avant la sortie, au sud.
 */
export const AIRE: CarteModele = {
  id: 'aire',
  region: 2,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([16, -1], [16, 6], [26, 6], [26, 12], [8, 12], [8, 19]),
    chemin([33, 15], [26, 15], [26, 12], [8, 12], [8, 19]),
  ],
  socles: [
    socle(6, 16, 8, 16), // 0
    socle(10, 14, 10, 12), // 1
    socle(14, 2, 16, 2), // 2
    socle(14, 10, 14, 12), // 3
    socle(17, 14, 17, 12), // 4
    socle(18, 4, 16, 4), // 5
    socle(20, 10, 20, 12), // 6
    socle(24, 4, 24, 6), // 7
    socle(24, 10, 26, 10), // 8
    socle(28, 8, 26, 8), // 9
    socle(28, 13, 28, 15), // 10
  ],
  departHeros: { x: 14, y: 12 },
  zones: [zone('paves', 10, 1, 5, 4), zone('paves', 18, 8, 6, 2), zone('boue', 0, 2, 5, 5), zone('boue', 12, 14, 8, 3)],
  decor: [
    decor('sillon', 16.5, 1),
    decor('cailloux', 7.5, 2),
    decor('croix', 22.5, 2),
    decor('arbre-calcine-1', 10.5, 2.5),
    decor('arbre-calcine-2', 20.5, 2.5),
    decor('souche-calcinee', 26.5, 2.5),
    decor('arbre-calcine-1', 3.5, 3, true),
    decor('sillon', 5.5, 3),
    decor('arbre-calcine-1', 29, 3),
    decor('sillon', 31, 3, true),
    decor('sillon', 1.5, 3.5, true),
    decor('sillon', 16, 3.5, true),
    decor('gerbes-brulees', 11, 4),
    decor('crane', 26.5, 4),
    decor('sillon', 20.5, 4.5),
    decor('cloture-h', 22, 4.5, true),
    decor('sillon', 1.5, 5),
    decor('sillon', 3.5, 5, true),
    decor('arbre-calcine-1', 8, 5),
    decor('arbre-calcine-1', 13.5, 5.5, true),
    decor('arbre-calcine-1', 5.5, 6),
    decor('souche-calcinee', 28.5, 6),
    decor('fourche-brisee', 30, 6),
    decor('sillon', 1, 6.5),
    decor('cailloux', 3, 6.5),
    decor('arbre-calcine-2', 10.5, 7),
    decor('cloture-h', 21, 7),
    decor('sillon', 8, 7.5, true),
    decor('arbre-calcine-2', 13, 8, true),
    decor('meule-brulee', 30.5, 8.5),
    decor('arbre-calcine-2', 2, 9),
    decor('meule-brulee', 4.5, 9.5),
    decor('gerbes-brulees', 12, 9.5, true),
    decor('sillon', 16, 9.5),
    decor('fourche-brisee', 18, 9.5, true),
    decor('meule-brulee', 8, 10),
    decor('tonneau', 22, 10),
    decor('cloture-cassee', 30.5, 10.5),
    decor('cloture-cassee', 1.5, 11, true),
    decor('crane', 3, 11),
    decor('cloture-h', 28.5, 11),
    decor('cloture-cassee', 6, 11.5, true),
    decor('sillon', 30.5, 12),
    decor('cloture-h', 5, 13),
    decor('meule-brulee', 3, 14),
    decor('fourche-brisee', 25.5, 14.5, true),
    decor('sillon', 14.5, 15, true),
    decor('cloture-cassee', 28.5, 15, true),
    decor('gerbes-brulees', 10, 15.5),
    decor('chariot-brise', 20.5, 15.5),
    decor('sillon', 30, 15.5, true),
    decor('sillon', 13, 16),
    decor('chariot-brise', 23.5, 16),
    decor('fourche-brisee', 2, 16.5, true),
    decor('souche-calcinee', 4, 17),
    decor('souche-calcinee', 10, 17, true),
    decor('sillon', 15, 17),
    decor('arbre-calcine-1', 17, 17),
    decor('cloture-h', 21, 17),
    decor('cloture-cassee', 11.5, 17.5),
    decor('cloture-h', 13.5, 17.5),
    decor('fourche-brisee', 24.5, 17.5, true),
    decor('sillon', 30, 17.5),
  ],
};
