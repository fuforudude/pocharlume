// Habillage de la carte du monde de la région 1 : décor posé sur le fond de 512 × 288, en pixels logiques, par
// l'ancre (le pied) de chaque sprite. Loin du chemin et des nœuds (un test le vérifie) : la route et les
// pastilles des niveaux restent lisibles. Le moteur ne lit jamais ce fichier.
export interface DecorMonde {
  readonly sprite: string;
  readonly x: number;
  readonly y: number;
  readonly miroir?: boolean;
}

export const DECOR_MONDE_REGION1: readonly DecorMonde[] = [
  // Le cimetière sur la colline, au nord-ouest
  { sprite: 'arbre-mort-1', x: 22, y: 44 },
  { sprite: 'arbre-mort-2', x: 118, y: 36, miroir: true },
  { sprite: 'croix', x: 44, y: 66 },
  { sprite: 'croix', x: 62, y: 78 },
  { sprite: 'croix', x: 78, y: 62 },
  { sprite: 'croix', x: 34, y: 92 },
  { sprite: 'crane', x: 92, y: 84 },
  { sprite: 'souche', x: 104, y: 66 },
  { sprite: 'touffe', x: 14, y: 76 },
  { sprite: 'cailloux', x: 56, y: 104 },
  // Le village mangé de ruines, au centre
  { sprite: 'maison-ruine-1', x: 150, y: 108 },
  { sprite: 'maison-ruine-2', x: 190, y: 92, miroir: true },
  { sprite: 'puits', x: 172, y: 132 },
  { sprite: 'tonneau', x: 138, y: 128 },
  { sprite: 'tonneau', x: 150, y: 134 },
  { sprite: 'cloture-h', x: 208, y: 126 },
  { sprite: 'cloture-cassee', x: 224, y: 126 },
  { sprite: 'arbre-mort-1', x: 228, y: 56 },
  { sprite: 'arbre-mort-2', x: 166, y: 52 },
  { sprite: 'touffe', x: 124, y: 98 },
  // Le bûcher et la potence, sur la lande
  { sprite: 'bucher-eteint', x: 268, y: 126 },
  { sprite: 'potence', x: 322, y: 118 },
  { sprite: 'crane', x: 306, y: 132 },
  { sprite: 'arbre-mort-1', x: 290, y: 58, miroir: true },
  { sprite: 'souche', x: 252, y: 92 },
  { sprite: 'cailloux', x: 344, y: 142 },
  { sprite: 'arbre-mort-2', x: 354, y: 76 },
  { sprite: 'touffe', x: 330, y: 94 },
  // La lande entre le cimetière et la route
  { sprite: 'arbre-mort-1', x: 30, y: 150 },
  { sprite: 'croix', x: 62, y: 156 },
  { sprite: 'croix', x: 74, y: 148 },
  { sprite: 'touffe', x: 102, y: 152 },
  { sprite: 'cailloux', x: 132, y: 162 },
  { sprite: 'arbre-mort-2', x: 160, y: 158 },
  { sprite: 'souche', x: 192, y: 148 },
  { sprite: 'touffe', x: 236, y: 158 },
  { sprite: 'crane', x: 252, y: 164 },
  { sprite: 'arbre-mort-1', x: 282, y: 152, miroir: true },
  { sprite: 'croix', x: 332, y: 162 },
  { sprite: 'croix', x: 344, y: 154 },
  { sprite: 'touffe', x: 374, y: 150 },
  { sprite: 'cailloux', x: 392, y: 144 },
  { sprite: 'touffe', x: 62, y: 256 },
  { sprite: 'cailloux', x: 112, y: 262 },
  { sprite: 'croix', x: 196, y: 252 },
  // Les abords de Vaudrelle, au nord-est
  { sprite: 'arbre-mort-2', x: 404, y: 44 },
  { sprite: 'potence', x: 428, y: 100 },
  { sprite: 'croix', x: 400, y: 120 },
  { sprite: 'croix', x: 412, y: 108 },
  { sprite: 'arbre-mort-1', x: 496, y: 130, miroir: true },
  { sprite: 'crane', x: 500, y: 100 },
  { sprite: 'cloture-v', x: 496, y: 56 },
  { sprite: 'cloture-v', x: 496, y: 44 },
  // Le sud : champs vides et fermes
  { sprite: 'cloture-h', x: 70, y: 276 },
  { sprite: 'cloture-h', x: 86, y: 276 },
  { sprite: 'cloture-cassee', x: 102, y: 276 },
  { sprite: 'tonneau', x: 30, y: 274 },
  { sprite: 'maison-ruine-1', x: 206, y: 270 },
  { sprite: 'arbre-mort-1', x: 300, y: 270 },
  { sprite: 'maison-ruine-2', x: 330, y: 272 },
  { sprite: 'bucher-eteint', x: 412, y: 266 },
  { sprite: 'arbre-mort-2', x: 468, y: 262 },
  { sprite: 'souche', x: 440, y: 232 },
  { sprite: 'touffe', x: 166, y: 268 },
  { sprite: 'touffe', x: 260, y: 276 },
  { sprite: 'cailloux', x: 490, y: 220 },
  { sprite: 'cailloux', x: 18, y: 214 },
  { sprite: 'arbre-mort-2', x: 12, y: 168 },
  { sprite: 'touffe', x: 120, y: 170 },
];
