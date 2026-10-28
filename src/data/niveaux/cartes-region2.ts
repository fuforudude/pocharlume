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
    socle(7, 14, 5, 14), // 2
    socle(8, 7, 8, 5), // 3
    socle(12, 10, 10, 10), // 4
    socle(16, 14, 16, 12), // 5
    socle(20, 10, 20, 12), // 6
    socle(24, 9, 22, 9), // 7
    socle(30, 9, 30, 7), // 8
  ],
  departHeros: { x: 16, y: 12 },
  zones: [zone('boue', 12, 2, 6, 3), zone('boue', 26, 12, 5, 4), zone('paves', 14, 7, 5, 2), zone('paves', 1, 7, 4, 2)],
  decor: [
    decor('gerbes-brulees', 28, 1.5),
    decor('gerbes-brulees', 9.5, 2),
    decor('gerbes-brulees', 30, 2, true),
    decor('meule-brulee', 7, 2.5, true),
    decor('souche-calcinee', 14.5, 2.5),
    decor('chariot-brise', 24.5, 2.5),
    decor('cloture-h', 5, 3),
    decor('meule-brulee', 19, 3),
    decor('arbre-calcine-2', 22, 3),
    decor('meule-brulee', 12.5, 3.5),
    decor('cloture-h', 30.5, 3.5),
    decor('chariot-brise', 27, 4),
    decor('cailloux', 29, 4, true),
    decor('gerbes-brulees', 1, 5, true),
    decor('sillon', 12.5, 5),
    decor('arbre-calcine-2', 15.5, 5),
    decor('gerbes-brulees', 18.5, 5, true),
    decor('gerbes-brulees', 20.5, 5, true),
    decor('sillon', 4, 5.5, true),
    decor('souche-calcinee', 22, 5.5),
    decor('gerbes-brulees', 24, 5.5),
    decor('cailloux', 26, 5.5),
    decor('sillon', 28.5, 5.5, true),
    decor('arbre-calcine-1', 10.5, 6.5),
    decor('cailloux', 16.5, 7.5),
    decor('arbre-calcine-2', 19, 7.5, true),
    decor('gerbes-brulees', 4, 8.5),
    decor('souche-calcinee', 8, 8.5),
    decor('arbre-calcine-2', 14.5, 8.5),
    decor('meule-brulee', 6, 9.5, true),
    decor('meule-brulee', 2, 10, true),
    decor('sillon', 14, 10),
    decor('meule-brulee', 17, 10, true),
    decor('cailloux', 25, 11),
    decor('arbre-calcine-1', 28.5, 11.5),
    decor('gerbes-brulees', 6, 12, true),
    decor('cailloux', 30, 13),
    decor('arbre-calcine-1', 25, 13.5, true),
    decor('sillon', 27, 13.5),
    decor('sillon', 28.5, 14),
    decor('fourche-brisee', 18, 14.5, true),
    decor('sillon', 30.5, 14.5, true),
    decor('sillon', 5, 15, true),
    decor('cloture-h', 11, 15),
    decor('cailloux', 13, 15),
    decor('cloture-h', 22.5, 15, true),
    decor('sillon', 25, 15, true),
    decor('arbre-calcine-1', 1, 15.5, true),
    decor('tonneau', 20.5, 15.5, true),
    decor('cailloux', 29.5, 16, true),
    decor('souche-calcinee', 8, 16.5),
    decor('meule-brulee', 15.5, 16.5),
    decor('cloture-cassee', 22.5, 16.5),
    decor('crane', 24, 16.5, true),
    decor('sillon', 9.5, 17, true),
    decor('chariot-brise', 18.5, 17, true),
    decor('fourche-brisee', 21, 17, true),
    decor('meule-brulee', 27, 17),
    decor('souche-calcinee', 6, 17.5),
    decor('gerbes-brulees', 11.5, 17.5, true),
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
    socle(14, 10, 14, 12), // 2
    socle(17, 14, 17, 12), // 3
    socle(18, 4, 16, 4), // 4
    socle(20, 10, 20, 12), // 5
    socle(24, 4, 24, 6), // 6
    socle(24, 10, 26, 10), // 7
    socle(28, 13, 28, 15), // 8
  ],
  departHeros: { x: 14, y: 12 },
  zones: [zone('paves', 10, 1, 5, 4), zone('paves', 18, 8, 6, 2), zone('boue', 0, 2, 5, 5), zone('boue', 12, 14, 8, 3)],
  decor: [
    decor('tonneau', 18.5, 1.5),
    decor('sillon', 22.5, 1.5),
    decor('cloture-cassee', 24.5, 1.5),
    decor('souche-calcinee', 1.5, 2, true),
    decor('arbre-calcine-2', 3.5, 2, true),
    decor('souche-calcinee', 5.5, 2),
    decor('tonneau', 12, 2),
    decor('cloture-h', 21, 2, true),
    decor('fourche-brisee', 7, 2.5, true),
    decor('tonneau', 13.5, 2.5, true),
    decor('cloture-h', 26, 2.5),
    decor('arbre-calcine-1', 29, 3),
    decor('sillon', 1, 3.5),
    decor('cailloux', 2.5, 3.5),
    decor('meule-brulee', 9.5, 3.5, true),
    decor('souche-calcinee', 22, 3.5),
    decor('arbre-calcine-1', 4.5, 4.5),
    decor('gerbes-brulees', 11.5, 4.5),
    decor('gerbes-brulees', 20.5, 4.5),
    decor('croix', 26, 4.5, true),
    decor('sillon', 0.5, 5),
    decor('cailloux', 2.5, 5),
    decor('meule-brulee', 13.5, 5.5),
    decor('arbre-calcine-2', 9.5, 6, true),
    decor('souche-calcinee', 23.5, 6),
    decor('meule-brulee', 29.5, 6, true),
    decor('sillon', 1.5, 6.5),
    decor('sillon', 3.5, 6.5, true),
    decor('gerbes-brulees', 19, 6.5),
    decor('arbre-calcine-1', 5.5, 7, true),
    decor('arbre-calcine-2', 26, 7),
    decor('souche-calcinee', 9.5, 7.5),
    decor('crane', 11.5, 7.5, true),
    decor('gerbes-brulees', 14, 8),
    decor('fourche-brisee', 28, 8, true),
    decor('croix', 6, 8.5, true),
    decor('arbre-calcine-2', 2, 9),
    decor('meule-brulee', 30, 9),
    decor('tonneau', 11, 9.5),
    decor('fourche-brisee', 22, 9.5, true),
    decor('sillon', 28, 9.5),
    decor('meule-brulee', 8, 10.5, true),
    decor('arbre-calcine-2', 17, 10.5),
    decor('arbre-calcine-1', 4.5, 11),
    decor('cloture-cassee', 2.5, 11.5),
    decor('sillon', 30, 11.5, true),
    decor('meule-brulee', 3, 14),
    decor('cloture-cassee', 22.5, 14.5),
    decor('souche-calcinee', 26, 14.5),
    decor('cailloux', 13, 15),
    decor('croix', 1, 15.5),
    decor('souche-calcinee', 10.5, 15.5),
    decor('sillon', 18.5, 15.5, true),
    decor('chariot-brise', 20.5, 15.5),
    decor('croix', 24, 15.5),
    decor('arbre-calcine-1', 29, 15.5),
    decor('fourche-brisee', 22.5, 16),
    decor('fourche-brisee', 26.5, 16),
    decor('meule-brulee', 3, 16.5),
    decor('sillon', 12.5, 16.5, true),
    decor('arbre-calcine-1', 15.5, 16.5, true),
    decor('cailloux', 17.5, 17, true),
    decor('sillon', 19.5, 17, true),
    decor('gerbes-brulees', 22, 17.5),
    decor('gerbes-brulees', 23.5, 17.5, true),
    decor('cloture-h', 26.5, 17.5),
    decor('cailloux', 29.5, 17.5),
  ],
};
