// Habillage de la carte de test (NIVEAU_TEST) : décor du Village Affamé, boue et pavés. Sert à jouer de bout
// en bout avant que les vrais niveaux de la région 1 (src/data/niveaux/) n'aient leur propre habillage.
import { NIVEAU_TEST } from '../data/niveaux/region1';
import type { NiveauCampagne, VisuelCarte } from '../data/visuel';

export const VISUEL_TEST: VisuelCarte = {
  region: 1,
  zones: [
    { sol: 'boue', x: 2, y: 6, largeur: 3, hauteur: 2 },
    { sol: 'boue', x: 14, y: 15, largeur: 3, hauteur: 2 },
    { sol: 'paves', x: 27, y: 12, largeur: 4, hauteur: 2 },
  ],
  decor: [
    { sprite: 'arbre-mort-1', x: 2, y: 2.5 },
    { sprite: 'arbre-mort-2', x: 6.5, y: 1.8 },
    { sprite: 'arbre-mort-1', x: 19.5, y: 2.6 },
    { sprite: 'arbre-mort-2', x: 29.5, y: 2.8, miroir: true },
    { sprite: 'arbre-mort-1', x: 1.5, y: 17.5 },
    { sprite: 'arbre-mort-2', x: 12.5, y: 17.7 },
    { sprite: 'maison-ruine-1', x: 4, y: 10 },
    { sprite: 'maison-ruine-2', x: 29, y: 12 },
    { sprite: 'puits', x: 6.5, y: 14.5 },
    { sprite: 'potence', x: 17, y: 8 },
    { sprite: 'bucher-eteint', x: 27.5, y: 16.8 },
    { sprite: 'cloture-h', x: 14.5, y: 17 },
    { sprite: 'cloture-h', x: 15.5, y: 17 },
    { sprite: 'cloture-cassee', x: 16.5, y: 17 },
    { sprite: 'cloture-v', x: 21.5, y: 5.5 },
    { sprite: 'cloture-v', x: 21.5, y: 4.7 },
    { sprite: 'tonneau', x: 9.2, y: 12.4 },
    { sprite: 'tonneau', x: 10.1, y: 12.8 },
    { sprite: 'croix', x: 5.2, y: 6.6 },
    { sprite: 'croix', x: 3.4, y: 8 },
    { sprite: 'croix', x: 27, y: 9.5 },
    { sprite: 'crane', x: 13.8, y: 7.2 },
    { sprite: 'souche', x: 25.5, y: 2.8 },
    { sprite: 'souche', x: 8.5, y: 14.2 },
    { sprite: 'touffe', x: 0.8, y: 12 },
    { sprite: 'touffe', x: 17.5, y: 5.6 },
    { sprite: 'touffe', x: 31, y: 9.5 },
    { sprite: 'touffe', x: 22, y: 17.6 },
    { sprite: 'cailloux', x: 12.5, y: 15.8 },
    { sprite: 'cailloux', x: 20.5, y: 10.8 },
    { sprite: 'cailloux', x: 1.5, y: 5 },
  ],
};

export const NIVEAU_CAMPAGNE_TEST: NiveauCampagne = {
  numero: 1,
  niveau: NIVEAU_TEST,
  visuel: VISUEL_TEST,
  boss: false,
};
