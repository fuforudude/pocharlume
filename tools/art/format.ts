// Lecture du format texte des sprites (art/sprites/*.txt) et des palettes (art/palettes/*.txt).
//
// Un fichier contient un ou plusieurs sprites. Les directives placées avant le premier `sprite` servent de
// valeurs par défaut à tous les sprites du fichier (taille, palette, ancre…), et ses calques sont partagés.
//
//   # commentaire
//   categorie unite                 tour, unite, ennemi, projectile, effet, tuile, decor, icone
//   taille 32 32                    taille d'un cadre (largeur hauteur)
//   palette commune                 palette partagée art/palettes/commune.txt (cumulable)
//   couleur z 7a1f1f                couleur propre (lettre puis RRGGBB ou RRGGBBAA)
//   ancre 16 30                     point posé sur la position de l'entité (au pied), en pixels du cadre
//   origine 8 12                    coin haut gauche où l'on pose les grilles (défaut 0 0)
//   contour oui                     ajoute la variante avec contour d'un pixel (défaut oui)
//   agrandi 2                       agrandit chaque cadre (plus proche voisin) avant le contour
//   point tireur 16 9               point nommé du cadre, recopié dans l'atlas (poste du tireur sur une tour…)
//   minifolks Without Outline/MiniSwordMan.png   planche de base pour les sources `mf`
//   recolore 4058c0=a 6098e8=#5a2a1a              table de recoloration des cadres Minifolks
//   derive soldat-grange couleurs o=u            reprend les cadres finis d'un autre sprite, transformés
//   modele soldat-grange            reprend les animations et calques d'un autre sprite comme recette : en
//                                   redéfinissant un calque (tête, arme…), tous les cadres qui l'utilisent changent
//
//   calque fourche [x y]            grille réutilisable, posée à l'origine + (x, y) (puis `decale`)
//   ..k
//   .k.
//
//   sprite paysan-affame            début d'un sprite (une grille juste après = animation `repos` d'un cadre)
//   anim marche 100 [boucle|unique] animation : durée par cadre en ms ; attaque, blesse, mort, competence
//                                   sont jouées une fois par défaut, les autres en boucle
//   cadre                           cadre dessiné entièrement par la grille qui suit
//   cadre repos.1 decale 0 -1       cadre dérivé d'un autre de ce sprite (animation.indice)
//   cadre mf 1.0-5 + fourche        cadres 0 à 5 de la ligne 1 de la planche Minifolks, plus le calque
//   cadre soldat/repos.0 miroir     cadre d'un autre sprite, retourné de gauche à droite
//   cadre repos.0 duree 400         durée propre à ce cadre
//   retouche attaque 1,2 [+ calque] grille posée sur des cadres déjà définis (`*` pour tous)
//
// `rogne x y l h` découpe le rectangle de l × h pixels dont le coin haut gauche est en (x, y) : le cadre d'un autre
// sprite de taille différente peut ainsi servir de source (portraits recadrés sur le haut d'un héros).
//
// Une expression de cadre est une suite de termes séparés par `+`, posés dans l'ordre. Chaque terme a une source
// (cadre, calque ou `mf`) suivie d'opérations : `decale dx dy`, `miroir`, `retourne`, `tourne 90|180|270`,
// `couleurs a=b c=#112233 [dans x0 y0 x1 y1]` (#00000000 rend transparent). La grille éventuelle se pose par-dessus, à l'origine.
// Dans une grille : `.` laisse voir dessous, `_` efface, toute autre lettre est une couleur de la palette.
// Une grille s'arrête à la première ligne vide ou à la première directive.

export type JetonCouleur = string;

export type Operation =
  | { readonly type: 'decale'; readonly dx: number; readonly dy: number }
  | { readonly type: 'miroir' }
  | { readonly type: 'retourne' }
  | { readonly type: 'tourne'; readonly quarts: number }
  | { readonly type: 'rogne'; readonly x: number; readonly y: number; readonly largeur: number; readonly hauteur: number }
  | {
    readonly type: 'couleurs';
    readonly paires: readonly (readonly [JetonCouleur, JetonCouleur])[];
    /** Rectangle x0 y0 x1 y1 (bornes comprises) hors duquel rien n'est recoloré. */
    readonly zone: readonly [number, number, number, number] | null;
  };

export type SourceCadre =
  | { readonly type: 'cadre'; readonly sprite: string | null; readonly anim: string; readonly indice: number }
  | { readonly type: 'calque'; readonly nom: string }
  | { readonly type: 'minifolks'; readonly ligne: number; readonly indice: number };

export interface Terme {
  readonly source: SourceCadre;
  readonly operations: readonly Operation[];
}

export interface Grille {
  readonly lignes: readonly string[];
  readonly ligneFichier: number;
  /** Position de la grille par rapport à l'origine du sprite (calques seulement, 0 0 sinon). */
  readonly x: number;
  readonly y: number;
}

export interface CadreSource {
  readonly termes: readonly Terme[];
  readonly grille: Grille | null;
  readonly duree: number | null;
  readonly ligne: number;
}

export interface AnimSource {
  readonly nom: string;
  readonly duree: number;
  readonly boucle: boolean;
  readonly cadres: CadreSource[];
  readonly ligne: number;
}

export interface RetoucheSource {
  readonly anim: string;
  readonly indices: readonly number[] | 'tous';
  readonly termes: readonly Terme[];
  readonly grille: Grille | null;
  readonly ligne: number;
}

export interface Reglages {
  categorie: string;
  largeur: number;
  hauteur: number;
  ancre: readonly [number, number];
  origine: readonly [number, number];
  contour: boolean;
  agrandi: number;
  palettes: string[];
  couleurs: Map<string, string>;
  minifolks: string | null;
  recolore: (readonly [JetonCouleur, JetonCouleur])[];
  derive: { readonly sprite: string; readonly operations: readonly Operation[] } | null;
  modele: string | null;
  /** Points nommés du cadre (poste du tireur, départ des projectiles…), en pixels du cadre. */
  points: Map<string, readonly [number, number]>;
}

export interface SpriteSource extends Reglages {
  readonly nom: string;
  readonly fichier: string;
  readonly ligne: number;
  readonly calques: Map<string, Grille>;
  readonly anims: AnimSource[];
  readonly retouches: RetoucheSource[];
}

/** Durée par défaut d'un cadre, en millisecondes. */
export const DUREE_DEFAUT = 120;
/** Animations jouées une seule fois sauf mention contraire. */
const ANIMS_UNIQUES = new Set(['attaque', 'blesse', 'mort', 'competence', 'impact']);
const MOTS_CLES = new Set([
  'categorie', 'taille', 'palette', 'couleur', 'ancre', 'origine', 'contour', 'agrandi', 'point', 'minifolks', 'recolore',
  'derive', 'modele', 'calque', 'sprite', 'anim', 'cadre', 'retouche',
]);
const REGLAGES = new Set(['categorie', 'taille', 'palette', 'couleur', 'ancre', 'origine', 'contour', 'agrandi', 'point']);
const CATEGORIES = new Set(['tour', 'unite', 'ennemi', 'projectile', 'effet', 'tuile', 'decor', 'icone']);
/** Caractères réservés : ils ne peuvent pas désigner une couleur de palette. */
export const TRANSPARENT = '.';
export const EFFACE = '_';
const RESERVES = new Set([TRANSPARENT, EFFACE, '#', '+', '=', ' ', '\t']);

export class ErreurFormat extends Error {
  constructor(fichier: string, ligne: number, message: string) {
    super(`${fichier}:${String(ligne)} : ${message}`);
    this.name = 'ErreurFormat';
  }
}

function reglagesParDefaut(): Reglages {
  return {
    categorie: 'unite',
    largeur: 32,
    hauteur: 32,
    ancre: [16, 30],
    origine: [0, 0],
    contour: true,
    agrandi: 1,
    palettes: [],
    couleurs: new Map(),
    minifolks: null,
    recolore: [],
    derive: null,
    modele: null,
    points: new Map(),
  };
}

function copierReglages(r: Reglages): Reglages {
  return { ...r, palettes: [...r.palettes], couleurs: new Map(r.couleurs), recolore: [...r.recolore], points: new Map(r.points) };
}

/** Palette partagée : une ligne par couleur, `lettre RRGGBB[AA] [commentaire]`. */
export function lirePalette(texte: string, fichier: string): Map<string, string> {
  const palette = new Map<string, string>();
  texte.split(/\r?\n/).forEach((brute, i) => {
    const ligne = brute.trim();
    if (ligne === '' || ligne.startsWith('#')) return;
    const [lettre = '', hex = ''] = ligne.split(/\s+/);
    verifierLettre(lettre, fichier, i + 1);
    if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) throw new ErreurFormat(fichier, i + 1, `couleur invalide « ${hex} »`);
    if (palette.has(lettre)) throw new ErreurFormat(fichier, i + 1, `lettre « ${lettre} » déjà définie`);
    palette.set(lettre, hex.toLowerCase());
  });
  return palette;
}

function verifierLettre(lettre: string, fichier: string, ligne: number): void {
  if (lettre.length !== 1 || RESERVES.has(lettre)) {
    throw new ErreurFormat(fichier, ligne, `« ${lettre} » ne peut pas désigner une couleur`);
  }
}

/** Un jeton de couleur est une lettre de palette, ou RRGGBB[AA] avec ou sans #. */
function lireJetonCouleur(jeton: string, fichier: string, ligne: number): JetonCouleur {
  const hex = jeton.replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) return `#${hex.toLowerCase()}`;
  verifierLettre(jeton, fichier, ligne);
  return jeton;
}

function lirePaires(jetons: readonly string[], fichier: string, ligne: number): (readonly [JetonCouleur, JetonCouleur])[] {
  return jetons.map((j) => {
    const morceaux = j.split('=');
    const [de, vers] = morceaux;
    if (morceaux.length !== 2 || de === undefined || vers === undefined || de === '' || vers === '') {
      throw new ErreurFormat(fichier, ligne, `paire de couleurs invalide « ${j} » (attendu a=b)`);
    }
    return [lireJetonCouleur(de, fichier, ligne), lireJetonCouleur(vers, fichier, ligne)] as const;
  });
}

function entier(jeton: string | undefined, fichier: string, ligne: number): number {
  if (jeton === undefined || !/^-?\d+$/.test(jeton)) throw new ErreurFormat(fichier, ligne, `nombre attendu, lu « ${jeton ?? ''} »`);
  return Number(jeton);
}

/** Indices `3`, `1-4` ou `0,2,5`. */
function lireIndices(jeton: string, fichier: string, ligne: number): number[] {
  const indices: number[] = [];
  for (const morceau of jeton.split(',')) {
    const plage = /^(\d+)-(\d+)$/.exec(morceau);
    if (plage) {
      const debut = Number(plage[1]);
      const fin = Number(plage[2]);
      if (fin < debut) throw new ErreurFormat(fichier, ligne, `plage décroissante « ${morceau} »`);
      for (let i = debut; i <= fin; i++) indices.push(i);
    } else {
      indices.push(entier(morceau, fichier, ligne));
    }
  }
  return indices;
}

interface ExpressionLue {
  /** Une liste de termes par cadre : une plage d'indices produit plusieurs cadres. */
  readonly variantes: Terme[][];
  readonly duree: number | null;
}

/** Lit des opérations tant qu'il y en a ; renvoie la position du premier jeton non lu. */
function lireOperations(jetons: readonly string[], debut: number, fichier: string, ligne: number): [Operation[], number] {
  const operations: Operation[] = [];
  let i = debut;
  while (i < jetons.length) {
    const mot = jetons[i];
    if (mot === 'decale') {
      operations.push({ type: 'decale', dx: entier(jetons[i + 1], fichier, ligne), dy: entier(jetons[i + 2], fichier, ligne) });
      i += 3;
    } else if (mot === 'miroir') {
      operations.push({ type: 'miroir' });
      i += 1;
    } else if (mot === 'retourne') {
      operations.push({ type: 'retourne' });
      i += 1;
    } else if (mot === 'tourne') {
      const angle = entier(jetons[i + 1], fichier, ligne);
      if (angle % 90 !== 0) throw new ErreurFormat(fichier, ligne, 'rotation par quarts de tour seulement');
      operations.push({ type: 'tourne', quarts: angle / 90 });
      i += 2;
    } else if (mot === 'rogne') {
      const [x, y, largeur, hauteur] = [1, 2, 3, 4].map((k) => entier(jetons[i + k], fichier, ligne)) as [number, number, number, number];
      if (largeur <= 0 || hauteur <= 0) throw new ErreurFormat(fichier, ligne, 'rogne : largeur et hauteur positives attendues');
      operations.push({ type: 'rogne', x, y, largeur, hauteur });
      i += 5;
    } else if (mot === 'couleurs') {
      let fin = i + 1;
      while (fin < jetons.length && (jetons[fin] ?? '').includes('=')) fin++;
      const paires = lirePaires(jetons.slice(i + 1, fin), fichier, ligne);
      let zone: [number, number, number, number] | null = null;
      if (jetons[fin] === 'dans') {
        zone = [1, 2, 3, 4].map((k) => entier(jetons[fin + k], fichier, ligne)) as [number, number, number, number];
        fin += 5;
      }
      operations.push({ type: 'couleurs', paires, zone });
      i = fin;
    } else {
      break;
    }
  }
  return [operations, i];
}

function lireExpression(jetons: readonly string[], fichier: string, ligne: number): ExpressionLue {
  const termes: { sources: SourceCadre[]; operations: Operation[] }[] = [];
  let duree: number | null = null;
  let i = 0;
  while (i < jetons.length) {
    const mot = jetons[i] ?? '';
    if (mot === '+') {
      i++;
      continue;
    }
    if (mot === 'duree') {
      duree = entier(jetons[i + 1], fichier, ligne);
      i += 2;
      continue;
    }
    let sources: SourceCadre[];
    if (mot === 'mf') {
      const ref = /^(\d+)\.([\d,-]+)$/.exec(jetons[i + 1] ?? '');
      if (!ref) throw new ErreurFormat(fichier, ligne, 'source Minifolks attendue : mf ligne.indice');
      const ligneMf = Number(ref[1]);
      sources = lireIndices(ref[2] ?? '', fichier, ligne).map((indice) => ({ type: 'minifolks', ligne: ligneMf, indice }));
      i += 2;
    } else {
      const ref = /^(?:([\w-]+)\/)?([\w-]+)\.([\d,-]+)$/.exec(mot);
      if (ref) {
        const sprite = ref[1] ?? null;
        const anim = ref[2] ?? '';
        sources = lireIndices(ref[3] ?? '', fichier, ligne).map((indice) => ({ type: 'cadre', sprite, anim, indice }));
      } else if (/^[\w-]+$/.test(mot)) {
        sources = [{ type: 'calque', nom: mot }];
      } else {
        throw new ErreurFormat(fichier, ligne, `source de cadre inconnue « ${mot} »`);
      }
      i += 1;
    }
    const [operations, suite] = lireOperations(jetons, i, fichier, ligne);
    i = suite;
    termes.push({ sources, operations });
    const suivant = jetons[i];
    if (suivant !== undefined && suivant !== '+' && suivant !== 'duree') {
      throw new ErreurFormat(fichier, ligne, `« ${suivant} » inattendu (opération inconnue ou + manquant)`);
    }
  }
  const multiples = termes.filter((t) => t.sources.length > 1);
  if (multiples.length > 1) throw new ErreurFormat(fichier, ligne, 'une seule plage d’indices par cadre');
  const nombre = multiples[0]?.sources.length ?? 1;
  const variantes: Terme[][] = [];
  for (let n = 0; n < nombre; n++) {
    variantes.push(termes.map((t) => ({ source: t.sources[t.sources.length > 1 ? n : 0] as SourceCadre, operations: t.operations })));
  }
  return { variantes, duree };
}

/** Découpe un fichier de sprites en sources structurées, sans rien dessiner. */
export function lireSprites(texte: string, fichier: string): SpriteSource[] {
  const lignes = texte.split(/\r?\n/);
  const defauts = reglagesParDefaut();
  const calquesFichier = new Map<string, Grille>();
  const sprites: SpriteSource[] = [];
  let sprite: SpriteSource | null = null;
  let anim: AnimSource | null = null;
  /** Où ranger la grille qui suit la directive courante. */
  let recevoir: ((g: Grille) => void) | null = null;
  let grille: string[] = [];
  let debutGrille = 0;

  const fermerGrille = (): void => {
    if (grille.length > 0) {
      if (!recevoir) throw new ErreurFormat(fichier, debutGrille, 'grille sans cadre, calque ni retouche');
      recevoir({ lignes: grille, ligneFichier: debutGrille, x: 0, y: 0 });
    }
    grille = [];
    recevoir = null;
  };

  for (let n = 0; n < lignes.length; n++) {
    const numero = n + 1;
    const brute = lignes[n] ?? '';
    const ligne = brute.trim();
    if (ligne.startsWith('#')) continue;
    const jetons = ligne.split(/\s+/).filter((j) => j !== '');
    const mot = jetons[0] ?? '';
    // Une directive de réglage (origine, taille…) entre `sprite` et sa grille ne coupe pas le lien avec la grille.
    const enAttente: ((g: Grille) => void) | null = grille.length === 0 && REGLAGES.has(mot) ? recevoir : null;
    if (ligne === '' || MOTS_CLES.has(mot)) {
      fermerGrille();
      if (ligne === '') continue;
      recevoir = enAttente;
    } else {
      if (/\s/.test(ligne)) throw new ErreurFormat(fichier, numero, `directive inconnue « ${mot} »`);
      if (!recevoir) throw new ErreurFormat(fichier, numero, `ligne de grille sans cadre, calque ni retouche`);
      if (grille.length === 0) debutGrille = numero;
      grille.push(ligne);
      continue;
    }

    const reglages: Reglages = sprite ?? defauts;
    const args = jetons.slice(1);
    const enCours = (): SpriteSource => {
      if (!sprite) throw new ErreurFormat(fichier, numero, `« ${mot} » hors d’un sprite`);
      return sprite;
    };
    switch (mot) {
      case 'categorie': {
        const categorie = args[0] ?? '';
        if (!CATEGORIES.has(categorie)) throw new ErreurFormat(fichier, numero, `catégorie inconnue « ${categorie} »`);
        reglages.categorie = categorie;
        break;
      }
      case 'taille':
        reglages.largeur = entier(args[0], fichier, numero);
        reglages.hauteur = entier(args[1], fichier, numero);
        break;
      case 'ancre':
        reglages.ancre = [entier(args[0], fichier, numero), entier(args[1], fichier, numero)];
        break;
      case 'origine':
        reglages.origine = [entier(args[0], fichier, numero), entier(args[1], fichier, numero)];
        break;
      case 'contour':
        if (args[0] !== 'oui' && args[0] !== 'non') throw new ErreurFormat(fichier, numero, 'contour oui ou non');
        reglages.contour = args[0] === 'oui';
        break;
      case 'point':
        reglages.points.set(args[0] ?? '', [entier(args[1], fichier, numero), entier(args[2], fichier, numero)]);
        break;
      case 'agrandi':
        reglages.agrandi = entier(args[0], fichier, numero);
        break;
      case 'palette':
        reglages.palettes.push(...args);
        break;
      case 'couleur': {
        const [lettre = '', hex = ''] = args;
        verifierLettre(lettre, fichier, numero);
        const jeton = lireJetonCouleur(hex, fichier, numero);
        if (!jeton.startsWith('#')) throw new ErreurFormat(fichier, numero, 'couleur attendue en RRGGBB');
        reglages.couleurs.set(lettre, jeton.slice(1));
        break;
      }
      case 'minifolks':
        reglages.minifolks = ligne.slice('minifolks'.length).trim();
        break;
      case 'recolore':
        reglages.recolore.push(...lirePaires(args, fichier, numero));
        break;
      case 'derive': {
        const [base = '', ...reste] = args;
        const [operations, fin] = lireOperations(reste, 0, fichier, numero);
        if (fin < reste.length) throw new ErreurFormat(fichier, numero, `« ${reste[fin] ?? ''} » inattendu`);
        enCours().derive = { sprite: base, operations };
        break;
      }
      case 'modele':
        enCours().modele = args[0] ?? '';
        break;
      case 'calque': {
        const nom = args[0] ?? '';
        if (!/^[\w-]+$/.test(nom)) throw new ErreurFormat(fichier, numero, `nom de calque invalide « ${nom} »`);
        const cible = sprite ? sprite.calques : calquesFichier;
        const x = args[1] === undefined ? 0 : entier(args[1], fichier, numero);
        const y = args[2] === undefined ? 0 : entier(args[2], fichier, numero);
        recevoir = (g) => cible.set(nom, { ...g, x, y });
        break;
      }
      case 'sprite': {
        const nom = args[0] ?? '';
        if (!/^[a-z0-9-]+$/.test(nom)) throw new ErreurFormat(fichier, numero, `nom de sprite invalide « ${nom} » (a-z, 0-9, -)`);
        sprite = { ...copierReglages(defauts), nom, fichier, ligne: numero, calques: new Map(calquesFichier), anims: [], retouches: [] };
        sprites.push(sprite);
        anim = null;
        const courant = sprite;
        // Une grille juste après `sprite` décrit un sprite immobile d'un seul cadre (tuile, icône, décor).
        recevoir = (g) => {
          courant.anims.push({ nom: 'repos', duree: DUREE_DEFAUT, boucle: true, ligne: numero, cadres: [{ termes: [], grille: g, duree: null, ligne: numero }] });
        };
        break;
      }
      case 'anim': {
        const s = enCours();
        const nom = args[0] ?? '';
        if (!/^[a-z-]+$/.test(nom)) throw new ErreurFormat(fichier, numero, `nom d'animation invalide « ${nom} »`);
        if (s.anims.some((a) => a.nom === nom)) throw new ErreurFormat(fichier, numero, `animation « ${nom} » déjà définie`);
        let boucle = !ANIMS_UNIQUES.has(nom);
        if (args.includes('boucle')) boucle = true;
        if (args.includes('unique')) boucle = false;
        const duree = args[1] !== undefined && /^\d+$/.test(args[1]) ? Number(args[1]) : DUREE_DEFAUT;
        anim = { nom, duree, boucle, cadres: [], ligne: numero };
        s.anims.push(anim);
        break;
      }
      case 'cadre': {
        enCours();
        if (!anim) throw new ErreurFormat(fichier, numero, '« cadre » hors d’une animation');
        const expression = lireExpression(args, fichier, numero);
        const cadres = expression.variantes.map((termes): CadreSource => ({ termes, grille: null, duree: expression.duree, ligne: numero }));
        if (cadres.length === 0 || (cadres.length === 1 && args.length === 0)) {
          // `cadre` seul : la grille qui suit est obligatoire.
          const liste = anim.cadres;
          const position = liste.length;
          liste.push({ termes: [], grille: null, duree: expression.duree, ligne: numero });
          recevoir = (g) => {
            liste[position] = { termes: [], grille: g, duree: expression.duree, ligne: numero };
          };
        } else {
          const liste = anim.cadres;
          const debut = liste.length;
          liste.push(...cadres);
          recevoir = (g) => {
            // Une grille après une plage se pose sur chacun des cadres de la plage.
            for (let k = debut; k < liste.length; k++) {
              const c = liste[k];
              if (c) liste[k] = { ...c, grille: g };
            }
          };
        }
        break;
      }
      case 'retouche': {
        const s = enCours();
        const [nomAnim = '', indices = '', ...reste] = args;
        const expression = lireExpression(reste, fichier, numero);
        if (expression.variantes.length > 1) throw new ErreurFormat(fichier, numero, 'pas de plage dans une retouche');
        const retouche: RetoucheSource = {
          anim: nomAnim,
          indices: indices === '*' ? 'tous' : lireIndices(indices, fichier, numero),
          termes: expression.variantes[0] ?? [],
          grille: null,
          ligne: numero,
        };
        s.retouches.push(retouche);
        const position = s.retouches.length - 1;
        recevoir = (g) => {
          s.retouches[position] = { ...retouche, grille: g };
        };
        break;
      }
      default:
        throw new ErreurFormat(fichier, numero, `directive inconnue « ${mot} »`);
    }
  }
  fermerGrille();
  for (const s of sprites) {
    for (const a of s.anims) {
      for (const c of a.cadres) {
        if (c.termes.length === 0 && !c.grille) throw new ErreurFormat(fichier, c.ligne, 'cadre vide : grille ou source attendue');
      }
    }
  }
  return sprites;
}
