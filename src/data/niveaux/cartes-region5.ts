// Cartes dessinées à la main de la région 5, la Ville Pestiférée (32 × 18 tuiles). Même structure que les cartes du
// Village Affamé (cartes.ts) : une ou deux entrées, des socles fixes à 2 tuiles de l'axe des chemins (leur ralliement de
// caserne est le point de l'axe le plus proche). Un niveau qui n'emprunte pas tous les chemins ne garde que les socles à portée
// des chemins utilisés (plan-region5.ts) ; le décor posé dans le couloir d'un chemin inutilisé reste affiché.
import { chemin, decor, socle, zone, type CarteModele } from './modele-carte';

/**
 * La Quarantaine : un seul chemin en spirale carrée, entre les maisons marquées d’une croix rouge, jusqu’à la porte de l’est.
 */
export const QUARANTAINE: CarteModele = {
  id: 'quarantaine',
  region: 5,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 3], [10, 3], [10, 9], [4, 9], [4, 15], [22, 15], [22, 8], [33, 8]),
  ],
  socles: [
    socle(1, 5, 1, 3), // 0
    socle(2, 15, 4, 15), // 1
    socle(6, 11, 6, 9), // 2
    socle(8, 5, 8, 3), // 3
    socle(9, 13, 9, 15), // 4
    socle(15, 13, 15, 15), // 5
    socle(20, 13, 20, 15), // 6
    socle(24, 10, 22, 10), // 7
    socle(30, 10, 30, 8), // 8
  ],
  departHeros: { x: 27, y: 8 },
  zones: [zone('paves', 12, 5, 6, 8), zone('boue', 24, 11, 6, 4), zone('boue', 0, 11, 2, 3), zone('paves', 14, 1, 8, 2)],
  decor: [
    decor('linceul', 6.5, 1.5, true),
    decor('tonneau', 11.5, 1.5, true),
    decor('cloture-v', 13, 1.5, true),
    decor('linceul', 30, 2),
    decor('croix-rouge', 15.5, 2.5, true),
    decor('croix-rouge', 23, 2.5, true),
    decor('lanterne-peste', 13.5, 3),
    decor('lanterne-peste', 17, 3),
    decor('croix-rouge', 21, 3),
    decor('fosse-commune', 26, 3),
    decor('croix-rouge', 12, 3.5),
    decor('maison-condamnee-1', 19, 3.5, true),
    decor('croix-rouge', 16.5, 4.5, true),
    decor('croix-rouge', 30, 4.5),
    decor('linceul', 5.5, 5.5, true),
    decor('maison-condamnee-1', 22.5, 5.5),
    decor('cloture-v', 24.5, 5.5, true),
    decor('tonneau', 3.5, 6),
    decor('maison-condamnee-1', 19.5, 6),
    decor('charrette-linceuls', 27.5, 6, true),
    decor('lanterne-peste', 12.5, 6.5),
    decor('maison-condamnee-1', 14.5, 6.5, true),
    decor('maison-condamnee-2', 17, 7),
    decor('tas-ossements', 5.5, 7.5),
    decor('croix-rouge', 7.5, 7.5),
    decor('tonneau', 19.5, 7.5),
    decor('tonneau', 2, 8.5),
    decor('lanterne-peste', 12, 9),
    decor('lanterne-peste', 20, 9.5, true),
    decor('croix-rouge', 1, 10),
    decor('fosse-commune', 14, 10),
    decor('charrette-linceuls', 17, 10.5),
    decor('croix-rouge', 28, 10.5),
    decor('lanterne-peste', 20, 11, true),
    decor('cailloux', 30.5, 11.5, true),
    decor('charrette-linceuls', 12.5, 12.5),
    decor('lanterne-peste', 17, 12.5, true),
    decor('maison-condamnee-2', 25, 12.5, true),
    decor('tas-ossements', 1.5, 13),
    decor('maison-condamnee-1', 6.5, 13.5),
    decor('linceul', 30.5, 13.5, true),
    decor('maison-condamnee-2', 28, 14),
    decor('maison-condamnee-2', 25, 15, true),
    decor('crane', 31, 15),
    decor('croix-rouge', 29.5, 15.5),
    decor('croix-rouge', 25.5, 16.5),
    decor('crane', 23.5, 17),
    decor('maison-condamnee-2', 27.5, 17),
    decor('crane', 30.5, 17),
    decor('tonneau', 3.5, 17.5),
    decor('cailloux', 17, 17.5, true),
    decor('lanterne-peste', 19.5, 17.5),
  ],
};

/**
 * Le Faubourg : deux rues, l’une par le haut et l’autre par le bas, convergent vers la porte de l’est où la peste s’est installée.
 */
export const FAUBOURG: CarteModele = {
  id: 'faubourg',
  region: 5,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 8], [12, 8], [12, 3], [24, 3], [24, 12], [33, 12]),
    chemin([-1, 15], [18, 15], [18, 12], [24, 12], [33, 12]),
  ],
  socles: [
    socle(2, 10, 2, 8), // 0
    socle(4, 13, 4, 15), // 1
    socle(8, 13, 8, 15), // 2
    socle(10, 6, 10, 8), // 3
    socle(14, 5, 12, 5), // 4
    socle(16, 13, 16, 15), // 5
    socle(18, 5, 18, 3), // 6
    socle(21, 14, 21, 12), // 7
    socle(22, 5, 22, 3), // 8
    socle(26, 10, 24, 10), // 9
    socle(31, 14, 31, 12), // 10
  ],
  departHeros: { x: 29, y: 12 },
  zones: [zone('paves', 14, 5, 8, 5), zone('boue', 1, 10, 6, 3), zone('boue', 26, 4, 5, 5), zone('paves', 5, 16, 6, 2)],
  decor: [
    decor('tonneau', 2.5, 1.5, true),
    decor('croix-rouge', 7.5, 1.5),
    decor('cailloux', 14, 1.5),
    decor('crane', 16.5, 1.5),
    decor('cailloux', 19, 1.5),
    decor('linceul', 20.5, 1.5),
    decor('cailloux', 23, 1.5),
    decor('tas-ossements', 26, 1.5, true),
    decor('cloture-v', 30, 1.5),
    decor('maison-condamnee-2', 9.5, 2.5),
    decor('fosse-commune', 28, 2.5),
    decor('fosse-commune', 5, 3),
    decor('croix-rouge', 30.5, 3, true),
    decor('crane', 1.5, 4),
    decor('tas-ossements', 8, 4),
    decor('tas-ossements', 9.5, 4),
    decor('lanterne-peste', 4, 4.5),
    decor('linceul', 26.5, 4.5),
    decor('tas-ossements', 28.5, 5, true),
    decor('tas-ossements', 30, 5),
    decor('maison-condamnee-1', 6, 6, true),
    decor('linceul', 8, 6, true),
    decor('tas-ossements', 27, 6),
    decor('croix-rouge', 1.5, 6.5, true),
    decor('linceul', 3, 6.5),
    decor('fosse-commune', 14.5, 7.5),
    decor('linceul', 22, 7.5, true),
    decor('charrette-linceuls', 20, 8),
    decor('crane', 26.5, 8, true),
    decor('maison-condamnee-2', 29, 8),
    decor('tas-ossements', 7.5, 8.5, true),
    decor('crane', 9, 8.5),
    decor('charrette-linceuls', 17.5, 8.5),
    decor('cloture-h', 31, 8.5),
    decor('maison-condamnee-1', 4.5, 9.5),
    decor('croix-rouge', 16.5, 10, true),
    decor('linceul', 8, 10.5),
    decor('lanterne-peste', 12.5, 10.5, true),
    decor('maison-condamnee-1', 14.5, 10.5),
    decor('charrette-linceuls', 20, 10.5, true),
    decor('maison-condamnee-2', 28.5, 10.5),
    decor('crane', 4, 11, true),
    decor('crane', 6, 11),
    decor('maison-condamnee-2', 10.5, 11.5),
    decor('tas-ossements', 14, 12),
    decor('linceul', 2, 12.5),
    decor('croix-rouge', 12.5, 12.5),
    decor('linceul', 6, 13, true),
    decor('tonneau', 11, 13.5, true),
    decor('croix-rouge', 14, 13.5),
    decor('cailloux', 6.5, 15),
    decor('tonneau', 14, 15),
    decor('maison-condamnee-1', 28.5, 15.5),
    decor('maison-condamnee-2', 10, 16, true),
    decor('maison-condamnee-1', 24.5, 16),
    decor('crane', 31, 16),
    decor('maison-condamnee-1', 20.5, 16.5, true),
    decor('tas-ossements', 22.5, 17, true),
    decor('cloture-h', 29.5, 17),
    decor('tonneau', 3, 17.5),
    decor('lanterne-peste', 6, 17.5),
    decor('lanterne-peste', 7.5, 17.5),
    decor('lanterne-peste', 9.5, 17.5),
    decor('linceul', 15.5, 17.5),
  ],
};

/**
 * Le Marché Muet : un chemin traverse les étals par le nord, un autre vient de l’est ; ils se rejoignent au centre et sortent par le bas.
 */
export const MARCHE: CarteModele = {
  id: 'marche',
  region: 5,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([8, -1], [8, 6], [20, 6], [20, 12], [8, 12], [8, 19]),
    chemin([33, 3], [26, 3], [26, 9], [20, 9], [20, 12], [8, 12], [8, 19]),
  ],
  socles: [
    socle(6, 2, 8, 2), // 0
    socle(6, 16, 8, 16), // 1
    socle(10, 4, 8, 4), // 2
    socle(10, 14, 10, 12), // 3
    socle(14, 14, 14, 12), // 4
    socle(15, 4, 15, 6), // 5
    socle(18, 10, 20, 10), // 6
    socle(19, 4, 19, 6), // 7
    socle(22, 11, 20, 11), // 8
    socle(24, 7, 26, 7), // 9
    socle(28, 5, 28, 3), // 10
  ],
  departHeros: { x: 14, y: 12 },
  zones: [zone('paves', 10, 7, 8, 4), zone('boue', 22, 13, 8, 4), zone('boue', 0, 8, 4, 4), zone('paves', 12, 0, 6, 3)],
  decor: [
    decor('croix-rouge', 17, 1),
    decor('crane', 10, 1.5),
    decor('tas-ossements', 19, 1.5, true),
    decor('croix-rouge', 24, 1.5, true),
    decor('cailloux', 26, 1.5, true),
    decor('cloture-h', 30, 1.5),
    decor('tas-ossements', 1, 2),
    decor('maison-condamnee-2', 13.5, 2),
    decor('lanterne-peste', 15.5, 2, true),
    decor('tonneau', 20.5, 2, true),
    decor('cloture-h', 22.5, 2),
    decor('lanterne-peste', 17, 2.5),
    decor('maison-condamnee-1', 3, 3.5),
    decor('lanterne-peste', 5.5, 3.5, true),
    decor('maison-condamnee-1', 31, 4),
    decor('lanterne-peste', 13, 4.5, true),
    decor('maison-condamnee-1', 22.5, 4.5),
    decor('croix-rouge', 25.5, 5),
    decor('croix-rouge', 5, 5.5),
    decor('tas-ossements', 8.5, 5.5),
    decor('crane', 1, 6, true),
    decor('cailloux', 19, 6),
    decor('cloture-h', 22, 6, true),
    decor('cailloux', 31, 6, true),
    decor('tas-ossements', 13, 6.5),
    decor('fosse-commune', 3, 7, true),
    decor('maison-condamnee-2', 29, 8),
    decor('tonneau', 31, 8),
    decor('croix-rouge', 14, 8.5, true),
    decor('croix-rouge', 16, 9),
    decor('linceul', 2.5, 9.5, true),
    decor('croix-rouge', 5, 9.5, true),
    decor('maison-condamnee-2', 11.5, 9.5, true),
    decor('maison-condamnee-2', 25.5, 9.5, true),
    decor('tas-ossements', 1, 10, true),
    decor('lanterne-peste', 9.5, 10),
    decor('crane', 29.5, 10, true),
    decor('maison-condamnee-2', 7.5, 10.5),
    decor('lanterne-peste', 13.5, 10.5),
    decor('croix-rouge', 15, 10.5),
    decor('tas-ossements', 2, 11.5, true),
    decor('crane', 0.5, 12),
    decor('maison-condamnee-2', 4.5, 12),
    decor('cailloux', 25, 12.5),
    decor('croix-rouge', 26.5, 12.5),
    decor('charrette-linceuls', 29.5, 12.5, true),
    decor('fosse-commune', 23, 13.5),
    decor('charrette-linceuls', 3.5, 14.5),
    decor('lanterne-peste', 16.5, 14.5),
    decor('tonneau', 19, 15),
    decor('tas-ossements', 20.5, 15),
    decor('fosse-commune', 26, 15),
    decor('linceul', 28.5, 15, true),
    decor('linceul', 10.5, 15.5),
    decor('croix-rouge', 14.5, 16, true),
    decor('maison-condamnee-1', 12.5, 16.5),
    decor('tas-ossements', 19, 16.5, true),
    decor('maison-condamnee-1', 23, 16.5, true),
    decor('crane', 26, 16.5),
    decor('linceul', 29.5, 16.5, true),
    decor('linceul', 2, 17, true),
    decor('cailloux', 4, 17),
    decor('croix-rouge', 10.5, 17),
    decor('maison-condamnee-1', 16.5, 17, true),
    decor('linceul', 20.5, 17),
  ],
};
