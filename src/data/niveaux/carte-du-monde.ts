// Cartes du monde des régions livrées (1 à 11) : où se trouvent les 10 niveaux de la région et le chemin qui les relie. Une route par
// région, chacune sur son fond de 512 × 288 pixels logiques (le rendu choisit le zoom entier). L'écran de la carte du monde
// dessine le fond, le tracé et les nœuds de la région affichée (qui dépend de `regionMax` de la sauvegarde) ; il ne contient
// aucune position en dur. `noeudsDeRegion` et `traceDeRegion` donnent la route d'une région.
import type { Point } from '../../engine/definitions';

export const LARGEUR_CARTE_MONDE = 512;
export const HAUTEUR_CARTE_MONDE = 288;

export interface NoeudNiveau extends Point {
  /** Numéro du niveau dans la région, 1 à 10. */
  readonly numero: number;
  readonly boss: boolean;
}

function noeud(numero: number, x: number, y: number): NoeudNiveau {
  return { numero, x, y, boss: numero === 10 };
}

/** Le Village Affamé : la route part du sud-ouest, serpente d'est en ouest jusqu'à Vaudrelle, au nord-est. */
export const NOEUDS_REGION1: readonly NoeudNiveau[] = [
  noeud(1, 40, 236),
  noeud(2, 92, 196),
  noeud(3, 148, 230),
  noeud(4, 206, 190),
  noeud(5, 256, 232),
  noeud(6, 310, 186),
  noeud(7, 366, 226),
  noeud(8, 414, 176),
  noeud(9, 452, 128),
  noeud(10, 468, 70),
];

function route(...points: [number, number][]): readonly Point[] {
  return points.map(([x, y]) => ({ x, y }));
}

/**
 * Le chemin entre deux niveaux consécutifs : `TRACE_REGION1[i]` va du nœud i + 1 au nœud i + 2 (9 tronçons).
 * Chaque tronçon commence et finit exactement sur un nœud ; on dessine les tronçons jusqu'au dernier niveau
 * débloqué, le reste en pointillé.
 */
export const TRACE_REGION1: readonly (readonly Point[])[] = [
  route([40, 236], [58, 226], [74, 206], [92, 196]),
  route([92, 196], [112, 200], [130, 222], [148, 230]),
  route([148, 230], [170, 226], [190, 206], [206, 190]),
  route([206, 190], [222, 198], [238, 222], [256, 232]),
  route([256, 232], [280, 226], [296, 206], [310, 186]),
  route([310, 186], [330, 196], [348, 222], [366, 226]),
  route([366, 226], [388, 214], [402, 196], [414, 176]),
  route([414, 176], [430, 164], [446, 150], [452, 128]),
  route([452, 128], [462, 112], [468, 92], [468, 70]),
];

/** Les Champs Brûlés : la route traverse les champs d’ouest en est par le haut, redescend le long de la lisière et revient vers l’ouest jusqu’à la Faim, au sud. */
export const NOEUDS_REGION2: readonly NoeudNiveau[] = [
  noeud(1, 40, 56),
  noeud(2, 116, 84),
  noeud(3, 192, 52),
  noeud(4, 268, 82),
  noeud(5, 344, 52),
  noeud(6, 420, 84),
  noeud(7, 456, 156),
  noeud(8, 388, 208),
  noeud(9, 300, 184),
  noeud(10, 212, 236),
];

/** Les 9 tronçons de la région 2, comme TRACE_REGION1. */
export const TRACE_REGION2: readonly (readonly Point[])[] = [
  route([40, 56], [62, 75], [94, 65], [116, 84]),
  route([116, 84], [137, 64], [171, 72], [192, 52]),
  route([192, 52], [214, 71], [246, 63], [268, 82]),
  route([268, 82], [290, 63], [322, 71], [344, 52]),
  route([344, 52], [365, 72], [399, 64], [420, 84]),
  route([420, 84], [441, 104], [435, 136], [456, 156]),
  route([456, 156], [427, 165], [417, 199], [388, 208]),
  route([388, 208], [356, 210], [332, 182], [300, 184]),
  route([300, 184], [266, 193], [246, 227], [212, 236]),
];

/** Le Bourg des Bûchers : la route monte les ruelles de la porte sud-ouest vers la colline, redescend vers la place, puis grimpe au tribunal du Juge, au nord-est. */
export const NOEUDS_REGION3: readonly NoeudNiveau[] = [
  noeud(1, 40, 240),
  noeud(2, 56, 176),
  noeud(3, 40, 112),
  noeud(4, 88, 56),
  noeud(5, 168, 90),
  noeud(6, 176, 160),
  noeud(7, 212, 226),
  noeud(8, 300, 196),
  noeud(9, 340, 128),
  noeud(10, 420, 76),
];

/** Les 9 tronçons de la région 3, comme TRACE_REGION1. */
export const TRACE_REGION3: readonly (readonly Point[])[] = [
  route([40, 240], [53, 221], [43, 195], [56, 176]),
  route([56, 176], [43, 157], [53, 131], [40, 112]),
  route([40, 112], [62, 99], [66, 69], [88, 56]),
  route([88, 56], [118, 60], [138, 86], [168, 90]),
  route([168, 90], [163, 114], [181, 136], [176, 160]),
  route([176, 160], [195, 178], [193, 208], [212, 226]),
  route([212, 226], [244, 224], [268, 198], [300, 196]),
  route([300, 196], [306, 169], [334, 155], [340, 128]),
  route([340, 128], [371, 117], [389, 87], [420, 76]),
];

/** Les Marais de l’Ordalie : la route part du nord-est et s’enfonce dans le marais en lacets, vers l’ouest, jusqu’au puits de la Dame. */
export const NOEUDS_REGION4: readonly NoeudNiveau[] = [
  noeud(1, 452, 48),
  noeud(2, 380, 72),
  noeud(3, 320, 120),
  noeud(4, 388, 160),
  noeud(5, 448, 208),
  noeud(6, 372, 246),
  noeud(7, 284, 220),
  noeud(8, 212, 176),
  noeud(9, 150, 132),
  noeud(10, 80, 84),
];

/** Les 9 tronçons de la région 4, comme TRACE_REGION1. */
export const TRACE_REGION4: readonly (readonly Point[])[] = [
  route([452, 48], [424, 45], [408, 75], [380, 72]),
  route([380, 72], [367, 97], [333, 95], [320, 120]),
  route([320, 120], [337, 144], [371, 136], [388, 160]),
  route([388, 160], [415, 167], [421, 201], [448, 208]),
  route([448, 208], [417, 210], [403, 244], [372, 246]),
  route([372, 246], [339, 249], [317, 217], [284, 220]),
  route([284, 220], [266, 195], [230, 201], [212, 176]),
  route([212, 176], [184, 171], [178, 137], [150, 132]),
  route([150, 132], [133, 106], [97, 110], [80, 84]),
];

/** La Ville Pestiférée : une route en rues à angle droit, qui monte et descend d’îlot en îlot jusqu’au quartier de la Mère des Rats, au nord-est. */
export const NOEUDS_REGION5: readonly NoeudNiveau[] = [
  noeud(1, 40, 248),
  noeud(2, 120, 248),
  noeud(3, 120, 176),
  noeud(4, 200, 176),
  noeud(5, 200, 248),
  noeud(6, 280, 248),
  noeud(7, 280, 176),
  noeud(8, 360, 176),
  noeud(9, 360, 104),
  noeud(10, 440, 48),
];

/** Les 9 tronçons de la région 5, comme TRACE_REGION1. */
export const TRACE_REGION5: readonly (readonly Point[])[] = [
  route([40, 248], [120, 248]),
  route([120, 248], [120, 176]),
  route([120, 176], [200, 176]),
  route([200, 176], [200, 248]),
  route([200, 248], [280, 248]),
  route([280, 248], [280, 176]),
  route([280, 176], [360, 176]),
  route([360, 176], [360, 104]),
  route([360, 104], [440, 104], [440, 48]),
];

/** Le Charnier : la route zigzague de fosse en fosse depuis le nord-ouest, redescend vers les ossuaires du sud, puis remonte vers le trône du Roi des Fosses, au nord-est. */
export const NOEUDS_REGION6: readonly NoeudNiveau[] = [
  noeud(1, 40, 60),
  noeud(2, 110, 96),
  noeud(3, 60, 150),
  noeud(4, 130, 196),
  noeud(5, 80, 244),
  noeud(6, 190, 236),
  noeud(7, 250, 180),
  noeud(8, 320, 226),
  noeud(9, 390, 160),
  noeud(10, 452, 80),
];

/** Les 9 tronçons de la région 6, comme TRACE_REGION1. */
export const TRACE_REGION6: readonly (readonly Point[])[] = [
  route([40, 60], [59, 81], [91, 75], [110, 96]),
  route([110, 96], [101, 121], [69, 125], [60, 150]),
  route([60, 150], [78, 174], [112, 172], [130, 196]),
  route([130, 196], [120, 219], [90, 221], [80, 244]),
  route([80, 244], [117, 251], [153, 229], [190, 236]),
  route([190, 236], [203, 210], [237, 206], [250, 180]),
  route([250, 180], [268, 204], [302, 202], [320, 226]),
  route([320, 226], [336, 197], [374, 189], [390, 160]),
  route([390, 160], [419, 139], [423, 101], [452, 80]),
];

/** La Croisade : la route du camp avance en dents de scie d’ouest en est, descend vers l’arrière-garde, puis revient vers l’ouest jusqu’à la tente du Prince Croisé, au sud. */
export const NOEUDS_REGION7: readonly NoeudNiveau[] = [
  noeud(1, 40, 150),
  noeud(2, 96, 100),
  noeud(3, 160, 140),
  noeud(4, 216, 90),
  noeud(5, 280, 140),
  noeud(6, 336, 90),
  noeud(7, 400, 150),
  noeud(8, 452, 210),
  noeud(9, 380, 248),
  noeud(10, 250, 246),
];

/** Les 9 tronçons de la région 7, comme TRACE_REGION1. */
export const TRACE_REGION7: readonly (readonly Point[])[] = [
  route([40, 150], [65, 141], [71, 109], [96, 100]),
  route([96, 100], [123, 105], [133, 135], [160, 140]),
  route([160, 140], [185, 131], [191, 99], [216, 90]),
  route([216, 90], [243, 99], [253, 131], [280, 140]),
  route([280, 140], [305, 131], [311, 99], [336, 90]),
  route([336, 90], [364, 103], [372, 137], [400, 150]),
  route([400, 150], [410, 177], [442, 183], [452, 210]),
  route([452, 210], [433, 232], [399, 226], [380, 248]),
  route([380, 248], [337, 237], [293, 257], [250, 246]),
];

/** Le Monastère Noir : une route de galeries à angle droit longe le cloître par le nord, redescend par l’est, revient par le sud et rentre au cœur du monastère, chez le Grand Inquisiteur. */
export const NOEUDS_REGION8: readonly NoeudNiveau[] = [
  noeud(1, 40, 48),
  noeud(2, 140, 48),
  noeud(3, 240, 48),
  noeud(4, 340, 48),
  noeud(5, 440, 48),
  noeud(6, 440, 136),
  noeud(7, 440, 240),
  noeud(8, 340, 240),
  noeud(9, 240, 240),
  noeud(10, 240, 140),
];

/** Les 9 tronçons de la région 8, comme TRACE_REGION1. */
export const TRACE_REGION8: readonly (readonly Point[])[] = [
  route([40, 48], [140, 48]),
  route([140, 48], [240, 48]),
  route([240, 48], [340, 48]),
  route([340, 48], [440, 48]),
  route([440, 48], [440, 136]),
  route([440, 136], [440, 240]),
  route([440, 240], [340, 240]),
  route([340, 240], [240, 240]),
  route([240, 240], [240, 140]),
];

/** La Cité du Roi : la route monte les avenues en arcs successifs, de la porte du sud-ouest jusqu’aux remparts du nord, puis redescend vers la salle du trône du Roi Fou, au sud-est. */
export const NOEUDS_REGION9: readonly NoeudNiveau[] = [
  noeud(1, 40, 250),
  noeud(2, 110, 200),
  noeud(3, 60, 140),
  noeud(4, 130, 90),
  noeud(5, 200, 140),
  noeud(6, 270, 90),
  noeud(7, 340, 140),
  noeud(8, 410, 90),
  noeud(9, 450, 160),
  noeud(10, 440, 240),
];

/** Les 9 tronçons de la région 9, comme TRACE_REGION1. */
export const TRACE_REGION9: readonly (readonly Point[])[] = [
  route([40, 250], [69, 241], [81, 209], [110, 200]),
  route([110, 200], [86, 186], [84, 154], [60, 140]),
  route([60, 140], [89, 131], [101, 99], [130, 90]),
  route([130, 90], [159, 99], [171, 131], [200, 140]),
  route([200, 140], [229, 131], [241, 99], [270, 90]),
  route([270, 90], [299, 99], [311, 131], [340, 140]),
  route([340, 140], [369, 131], [381, 99], [410, 90]),
  route([410, 90], [432, 108], [428, 142], [450, 160]),
  route([450, 160], [437, 185], [453, 215], [440, 240]),
];

/** La Cathédrale du Soleil Blême : la route suit la nef d’ouest en est, tourne dans le transept, serpente jusqu’au chœur et s’élève vers l’autel du Soleil Blême, au nord-est. */
export const NOEUDS_REGION10: readonly NoeudNiveau[] = [
  noeud(1, 40, 144),
  noeud(2, 120, 144),
  noeud(3, 200, 144),
  noeud(4, 280, 144),
  noeud(5, 280, 70),
  noeud(6, 360, 70),
  noeud(7, 360, 144),
  noeud(8, 360, 220),
  noeud(9, 440, 220),
  noeud(10, 440, 56),
];

/** Les 9 tronçons de la région 10, comme TRACE_REGION1. */
export const TRACE_REGION10: readonly (readonly Point[])[] = [
  route([40, 144], [120, 144]),
  route([120, 144], [200, 144]),
  route([200, 144], [280, 144]),
  route([280, 144], [280, 70]),
  route([280, 70], [360, 70]),
  route([360, 70], [360, 144]),
  route([360, 144], [360, 220]),
  route([360, 220], [440, 220]),
  route([440, 220], [440, 56]),
];

/**
 * Les Grèves Grises (après l'histoire) : la route longe la grève d'ouest en est (Vol de Corbeaux, niveaux 1 à 5 de la région), remonte
 * vers les pontons, puis file vers le large où attend le Passeur, au sud-est.
 */
export const NOEUDS_REGION11: readonly NoeudNiveau[] = [
  noeud(1, 40, 220),
  noeud(2, 120, 220),
  noeud(3, 200, 220),
  noeud(4, 200, 140),
  noeud(5, 120, 140),
  noeud(6, 120, 60),
  noeud(7, 200, 60),
  noeud(8, 280, 60),
  noeud(9, 360, 120),
  noeud(10, 450, 200),
];

/** Les 9 tronçons de la région 11, comme TRACE_REGION1. */
export const TRACE_REGION11: readonly (readonly Point[])[] = [
  route([40, 220], [120, 220]),
  route([120, 220], [200, 220]),
  route([200, 220], [200, 140]),
  route([200, 140], [120, 140]),
  route([120, 140], [120, 60]),
  route([120, 60], [200, 60]),
  route([200, 60], [280, 60]),
  route([280, 60], [360, 120]),
  route([360, 120], [450, 200]),
];

/** Les nœuds de chaque région livrée, dans l'ordre (indice 0 = région 1). */
export const NOEUDS_REGIONS: readonly (readonly NoeudNiveau[])[] = [NOEUDS_REGION1, NOEUDS_REGION2, NOEUDS_REGION3, NOEUDS_REGION4, NOEUDS_REGION5, NOEUDS_REGION6, NOEUDS_REGION7, NOEUDS_REGION8, NOEUDS_REGION9, NOEUDS_REGION10, NOEUDS_REGION11];

/** Les tronçons de chaque région livrée, dans l'ordre (indice 0 = région 1). */
export const TRACES_REGIONS: readonly (readonly (readonly Point[])[])[] = [TRACE_REGION1, TRACE_REGION2, TRACE_REGION3, TRACE_REGION4, TRACE_REGION5, TRACE_REGION6, TRACE_REGION7, TRACE_REGION8, TRACE_REGION9, TRACE_REGION10, TRACE_REGION11];

/** Les nœuds de la région `region` (1 à 11), ou `undefined` si elle n'a pas de carte. */
export function noeudsDeRegion(region: number): readonly NoeudNiveau[] | undefined {
  return Number.isInteger(region) ? NOEUDS_REGIONS[region - 1] : undefined;
}

/** Les tronçons de la région `region` (1 à 11), ou `undefined` si elle n'a pas de carte. */
export function traceDeRegion(region: number): readonly (readonly Point[])[] | undefined {
  return Number.isInteger(region) ? TRACES_REGIONS[region - 1] : undefined;
}
