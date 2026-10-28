// Cartes dessinées à la main de la région 4, les Marais de l’Ordalie (32 × 18 tuiles). Même structure que les cartes du
// Village Affamé (cartes.ts) : une ou deux entrées, des socles fixes à 2 tuiles de l'axe des chemins (leur ralliement de
// caserne est le point de l'axe le plus proche). Un niveau qui n'emprunte pas tous les chemins ne garde que les socles à portée
// des chemins utilisés (plan-region4.ts) ; le décor posé dans le couloir d'un chemin inutilisé reste affiché.
import { chemin, decor, socle, zone, type CarteModele } from './modele-carte';

/**
 * Le Ponton : un seul chemin de planches pourries, qui traverse le marais en longs lacets, du ponton de l’ouest à la berge de l’est.
 */
export const PONTON: CarteModele = {
  id: 'ponton',
  region: 4,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 9], [6, 9], [6, 3], [14, 3], [14, 14], [26, 14], [26, 6], [33, 6]),
  ],
  socles: [
    socle(1, 11, 1, 9), // 0
    socle(4, 7, 4, 9), // 1
    socle(8, 5, 6, 5), // 2
    socle(12, 5, 12, 3), // 3
    socle(16, 8, 14, 8), // 4
    socle(16, 12, 14, 12), // 5
    socle(20, 16, 20, 14), // 6
    socle(24, 12, 24, 14), // 7
    socle(28, 8, 26, 8), // 8
  ],
  departHeros: { x: 20, y: 14 },
  zones: [zone('boue', 8, 5, 5, 8), zone('boue', 16, 5, 8, 6), zone('boue', 0, 13, 5, 4), zone('paves', 27, 9, 4, 3)],
  decor: [
    decor('crane', 11, 1.5, true),
    decor('feu-follet', 18, 1.5, true),
    decor('feu-follet', 16.5, 2, true),
    decor('saule-marais-1', 20, 2),
    decor('roseaux', 22, 2),
    decor('saule-marais-2', 24.5, 2.5),
    decor('roseaux', 27, 2.5),
    decor('saule-marais-1', 2, 3),
    decor('saule-marais-2', 29, 3),
    decor('cailloux', 31, 3),
    decor('tonneau', 21, 4, true),
    decor('roseaux', 25.5, 4),
    decor('barque-echouee', 17.5, 4.5, true),
    decor('souche-moussue', 27, 4.5, true),
    decor('roseaux', 28.5, 4.5),
    decor('cailloux', 30, 4.5, true),
    decor('souche-moussue', 3.5, 5),
    decor('nenuphars', 16.5, 6, true),
    decor('feu-follet', 21, 6, true),
    decor('roseaux', 22.5, 6, true),
    decor('roseaux', 12, 7.5),
    decor('saule-marais-1', 9.5, 8),
    decor('saule-marais-1', 18.5, 8, true),
    decor('barque-echouee', 21, 8.5),
    decor('roseaux', 30.5, 8.5, true),
    decor('nenuphars', 16.5, 9.5),
    decor('saule-marais-1', 23.5, 9.5, true),
    decor('roseaux', 9, 10.5, true),
    decor('roseaux', 18.5, 10.5),
    decor('crane', 30.5, 10.5),
    decor('saule-marais-2', 11.5, 11),
    decor('puits-noir', 20.5, 11),
    decor('saule-marais-1', 28.5, 11),
    decor('saule-marais-2', 7, 12.5),
    decor('roseaux', 9.5, 12.5, true),
    decor('nenuphars', 12, 12.5),
    decor('roseaux', 18.5, 12.5),
    decor('saule-marais-1', 3.5, 13),
    decor('feu-follet', 28, 13),
    decor('nenuphars', 1.5, 14),
    decor('cailloux', 6, 14),
    decor('puits-noir', 30, 14),
    decor('barque-echouee', 10, 15),
    decor('nenuphars', 3, 15.5),
    decor('feu-follet', 4.5, 15.5, true),
    decor('roseaux', 6, 15.5, true),
    decor('souche-moussue', 31, 15.5),
    decor('feu-follet', 1.5, 16.5),
    decor('souche-moussue', 11, 16.5, true),
    decor('souche-moussue', 13, 16.5),
    decor('roseaux', 15.5, 16.5),
    decor('roseaux', 27, 16.5, true),
    decor('roseaux', 3.5, 17),
    decor('roseaux', 7.5, 17, true),
    decor('souche-moussue', 24.5, 17, true),
    decor('feu-follet', 28.5, 17),
    decor('cailloux', 30, 17),
    decor('cailloux', 23, 17.5, true),
  ],
};

/**
 * L’Étang Noir : deux chemins contournent l’étang, l’un par le nord-ouest, l’autre par l’est ; ils se joignent sur la berge sud avant de s’enfoncer dans les roseaux.
 */
export const ETANG: CarteModele = {
  id: 'etang',
  region: 4,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([-1, 5], [8, 5], [8, 14], [28, 14], [28, 19]),
    chemin([33, 8], [20, 8], [20, 14], [28, 14], [28, 19]),
  ],
  socles: [
    socle(1, 3, 1, 5), // 0
    socle(6, 7, 6, 5), // 1
    socle(10, 12, 8, 12), // 2
    socle(12, 16, 12, 14), // 3
    socle(16, 12, 16, 14), // 4
    socle(20, 16, 20, 14), // 5
    socle(22, 6, 22, 8), // 6
    socle(22, 12, 22, 14), // 7
    socle(26, 16, 26, 14), // 8
    socle(27, 10, 27, 8), // 9
    socle(31, 10, 31, 8), // 10
  ],
  departHeros: { x: 24, y: 14 },
  zones: [zone('boue', 10, 6, 8, 6), zone('boue', 22, 1, 8, 5), zone('paves', 1, 8, 4, 4), zone('paves', 12, 15, 6, 2)],
  decor: [
    decor('souche-moussue', 27.5, 1.5, true),
    decor('souche-moussue', 10, 2, true),
    decor('saule-marais-2', 15, 2),
    decor('feu-follet', 23, 2),
    decor('cailloux', 24.5, 2),
    decor('feu-follet', 29, 2, true),
    decor('saule-marais-1', 4.5, 2.5),
    decor('souche-moussue', 17.5, 2.5, true),
    decor('saule-marais-2', 20, 2.5),
    decor('tonneau', 11.5, 3),
    decor('feu-follet', 13, 3),
    decor('saule-marais-2', 8, 3.5),
    decor('roseaux', 24, 3.5),
    decor('souche-moussue', 22, 4),
    decor('saule-marais-1', 26.5, 4),
    decor('feu-follet', 12, 4.5, true),
    decor('saule-marais-1', 29.5, 4.5),
    decor('croix', 10, 5.5, true),
    decor('saule-marais-1', 14, 5.5),
    decor('saule-marais-2', 17, 5.5),
    decor('cailloux', 19.5, 5.5),
    decor('roseaux', 11.5, 6),
    decor('nenuphars', 24, 6),
    decor('nenuphars', 28, 6),
    decor('saule-marais-1', 26, 6.5, true),
    decor('feu-follet', 29.5, 6.5),
    decor('feu-follet', 31, 6.5),
    decor('nenuphars', 15, 7.5),
    decor('nenuphars', 17, 8),
    decor('puits-noir', 2.5, 8.5, true),
    decor('saule-marais-2', 10.5, 8.5),
    decor('roseaux', 21, 8.5),
    decor('tonneau', 4.5, 9),
    decor('barque-echouee', 13, 9),
    decor('cailloux', 6, 9.5),
    decor('roseaux', 15.5, 9.5),
    decor('tonneau', 2, 10, true),
    decor('feu-follet', 8, 10, true),
    decor('nenuphars', 17, 10),
    decor('roseaux', 13, 11),
    decor('saule-marais-1', 19.5, 11),
    decor('saule-marais-1', 24.5, 11.5),
    decor('cailloux', 27, 11.5),
    decor('tonneau', 2, 12, true),
    decor('saule-marais-1', 5, 12),
    decor('roseaux', 12, 12.5, true),
    decor('crane', 19.5, 12.5),
    decor('saule-marais-1', 29.5, 12.5),
    decor('crane', 15.5, 14),
    decor('cailloux', 31, 14, true),
    decor('feu-follet', 1.5, 14.5),
    decor('souche-moussue', 8.5, 14.5),
    decor('puits-noir', 4, 15),
    decor('roseaux', 6, 15, true),
    decor('roseaux', 1.5, 16, true),
    decor('croix', 9.5, 16.5),
    decor('tonneau', 17, 16.5),
    decor('tonneau', 30.5, 16.5),
    decor('roseaux', 3, 17),
    decor('souche-moussue', 5, 17),
    decor('roseaux', 7, 17),
    decor('cailloux', 14, 17, true),
    decor('cailloux', 15.5, 17, true),
    decor('feu-follet', 11.5, 17.5, true),
    decor('roseaux', 22, 17.5, true),
    decor('tonneau', 24, 17.5, true),
  ],
};

/**
 * Les Saules : un chemin entre dans le marais par le nord, un autre le longe par l’est ; ils se rejoignent à la sortie, sous les grands saules.
 */
export const SAULES: CarteModele = {
  id: 'saules',
  region: 4,
  largeur: 32,
  hauteur: 18,
  chemins: [
    chemin([16, -1], [16, 5], [6, 5], [6, 11], [18, 11], [18, 19]),
    chemin([33, 8], [24, 8], [24, 14], [18, 14], [18, 19]),
  ],
  socles: [
    socle(4, 5, 6, 5), // 0
    socle(8, 3, 8, 5), // 1
    socle(8, 9, 6, 9), // 2
    socle(12, 9, 12, 11), // 3
    socle(14, 3, 16, 3), // 4
    socle(16, 13, 16, 11), // 5
    socle(20, 16, 18, 16), // 6
    socle(22, 12, 24, 12), // 7
    socle(26, 10, 26, 8), // 8
    socle(27, 6, 27, 8), // 9
    socle(31, 6, 31, 8), // 10
  ],
  departHeros: { x: 18, y: 16 },
  zones: [zone('boue', 8, 7, 8, 3), zone('boue', 22, 8, 8, 4), zone('paves', 1, 13, 5, 4), zone('paves', 19, 1, 8, 4)],
  decor: [
    decor('feu-follet', 10, 1.5),
    decor('cailloux', 5, 2.5, true),
    decor('souche-moussue', 18, 2.5),
    decor('crane', 23, 2.5),
    decor('roseaux', 27, 2.5, true),
    decor('saule-marais-1', 3, 3),
    decor('croix', 10.5, 3),
    decor('tonneau', 12, 3),
    decor('puits-noir', 20, 4),
    decor('tonneau', 23, 4),
    decor('saule-marais-1', 25, 4),
    decor('puits-noir', 29, 4),
    decor('feu-follet', 15.5, 5.5),
    decor('souche-moussue', 18, 5.5),
    decor('feu-follet', 20, 5.5, true),
    decor('roseaux', 1.5, 6),
    decor('cailloux', 21.5, 6, true),
    decor('cailloux', 29, 6, true),
    decor('puits-noir', 13, 6.5),
    decor('saule-marais-1', 23.5, 6.5),
    decor('souche-moussue', 19, 7, true),
    decor('roseaux', 10, 7.5),
    decor('roseaux', 21, 7.5),
    decor('saule-marais-2', 2, 8.5),
    decor('roseaux', 10, 9),
    decor('saule-marais-1', 15.5, 9, true),
    decor('feu-follet', 24, 9),
    decor('saule-marais-1', 21, 10),
    decor('saule-marais-2', 2.5, 11),
    decor('saule-marais-2', 13.5, 12),
    decor('nenuphars', 27, 12),
    decor('saule-marais-1', 30, 12, true),
    decor('souche-moussue', 26, 13.5),
    decor('roseaux', 5.5, 14, true),
    decor('souche-moussue', 7, 14),
    decor('roseaux', 9, 14, true),
    decor('roseaux', 14, 14),
    decor('roseaux', 22, 14),
    decor('roseaux', 30.5, 14, true),
    decor('saule-marais-1', 2, 14.5),
    decor('cailloux', 4, 14.5),
    decor('saule-marais-2', 11.5, 14.5),
    decor('barque-echouee', 24, 14.5),
    decor('saule-marais-1', 28.5, 14.5),
    decor('souche-moussue', 15, 15.5, true),
    decor('crane', 2, 16, true),
    decor('crane', 3.5, 16),
    decor('barque-echouee', 6, 16.5),
    decor('feu-follet', 22.5, 16.5),
    decor('croix', 9.5, 17, true),
    decor('saule-marais-2', 13, 17),
    decor('roseaux', 15.5, 17, true),
    decor('barque-echouee', 26, 17),
    decor('roseaux', 2, 17.5),
    decor('cailloux', 8, 17.5, true),
    decor('souche-moussue', 24, 17.5, true),
    decor('crane', 30, 17.5, true),
  ],
};
