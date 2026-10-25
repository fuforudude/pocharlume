// Transforme les sources lues par format.ts en cadres RVBA : palettes, calques, cadres dérivés, planches Minifolks.
import {
  agrandir, contourner, coucheVide, decaler, decouper, ecrirePixel, miroir, recolorer, retourner, superposer, tourner,
  type Couche,
} from './couche.ts';
import { EFFACE, ErreurFormat, TRANSPARENT, type JetonCouleur, type Grille, type Operation, type SpriteSource, type Terme } from './format.ts';
import type { Image } from './png.ts';

export interface CadreDessine {
  readonly couche: Couche;
  readonly duree: number;
}

export interface AnimDessinee {
  readonly nom: string;
  readonly boucle: boolean;
  readonly cadres: readonly CadreDessine[];
}

export interface SpriteDessine {
  readonly nom: string;
  readonly categorie: string;
  readonly largeur: number;
  readonly hauteur: number;
  readonly ancre: readonly [number, number];
  /** Animations telles qu'affichées en jeu (avec contour si le sprite en a un). */
  readonly points: ReadonlyMap<string, readonly [number, number]>;
  readonly anims: readonly AnimDessinee[];
  /** Mêmes animations sans contour, seulement pour les sprites qui ont un contour. */
  readonly animsSansContour: readonly AnimDessinee[] | null;
}

export interface Sources {
  readonly sprites: readonly SpriteSource[];
  readonly palettes: ReadonlyMap<string, ReadonlyMap<string, string>>;
  /** Charge une planche du pack, par chemin relatif à art/minifolks/. */
  readonly planche: (chemin: string) => Image;
}

function hexVersRvba(hex: string): number {
  const complet = hex.length === 6 ? `${hex}ff` : hex;
  return Number.parseInt(complet, 16) >>> 0;
}

interface AnimBrute {
  nom: string;
  boucle: boolean;
  cadres: { couche: Couche; duree: number }[];
}

/** Dessine tous les sprites, en résolvant les références entre sprites à la demande. */
export function dessinerSprites(sources: Sources): SpriteDessine[] {
  const parNom = new Map<string, SpriteSource>();
  for (const s of sources.sprites) {
    const autre = parNom.get(s.nom);
    if (autre) throw new ErreurFormat(s.fichier, s.ligne, `sprite « ${s.nom} » déjà défini dans ${autre.fichier}`);
    parNom.set(s.nom, s);
  }
  const bruts = new Map<string, AnimBrute[]>();
  const enCours = new Set<string>();

  const brut = (nom: string, depuis: SpriteSource, ligne: number): AnimBrute[] => {
    const deja = bruts.get(nom);
    if (deja) return deja;
    const source = parNom.get(nom);
    if (!source) throw new ErreurFormat(depuis.fichier, ligne, `sprite inconnu « ${nom} »`);
    if (enCours.has(nom)) throw new ErreurFormat(source.fichier, source.ligne, `référence circulaire autour de « ${nom} »`);
    enCours.add(nom);
    const anims = dessinerBrut(appliquerModele(source, parNom), sources, brut);
    enCours.delete(nom);
    bruts.set(nom, anims);
    return anims;
  };

  return sources.sprites.map((s): SpriteDessine => {
    const anims = brut(s.nom, s, s.ligne);
    const finaliser = (avecContour: boolean): AnimDessinee[] => anims.map((a) => ({
      nom: a.nom,
      boucle: a.boucle,
      cadres: a.cadres.map((c) => {
        let couche = s.agrandi > 1 ? agrandir(c.couche, s.agrandi) : c.couche;
        if (avecContour) couche = contourner(couche);
        return { couche: { ...couche, efface: new Uint8Array(couche.largeur * couche.hauteur) }, duree: c.duree };
      }),
    }));
    return {
      nom: s.nom,
      categorie: s.categorie,
      points: new Map([...s.points].map(([n, [x, y]]) => [n, [x * s.agrandi, y * s.agrandi] as const])),
      largeur: s.largeur * s.agrandi,
      hauteur: s.hauteur * s.agrandi,
      // Le pied agrandi occupe plusieurs lignes : l’ancre descend sur la dernière.
      ancre: [s.ancre[0] * s.agrandi, s.ancre[1] * s.agrandi + s.agrandi - 1],
      anims: finaliser(s.contour),
      animsSansContour: s.contour ? finaliser(false) : null,
    };
  });
}

/**
 * Un sprite à modèle hérite des calques, animations et retouches de son modèle (récursivement) ; les siens
 * passent devant. Les expressions sont réévaluées avec ses propres calques.
 */
function appliquerModele(s: SpriteSource, parNom: ReadonlyMap<string, SpriteSource>, vus = new Set<string>()): SpriteSource {
  if (!s.modele) return s;
  if (vus.has(s.nom)) throw new ErreurFormat(s.fichier, s.ligne, `modèle circulaire autour de « ${s.nom} »`);
  vus.add(s.nom);
  const brute = parNom.get(s.modele);
  if (!brute) throw new ErreurFormat(s.fichier, s.ligne, `modèle inconnu « ${s.modele} »`);
  const modele = appliquerModele(brute, parNom, vus);
  const propres = new Set(s.anims.map((a) => a.nom));
  return {
    ...s,
    calques: new Map([...modele.calques, ...s.calques]),
    anims: [...modele.anims.filter((a) => !propres.has(a.nom)), ...s.anims],
    retouches: [...modele.retouches, ...s.retouches],
  };
}

type ChercherSprite = (nom: string, depuis: SpriteSource, ligne: number) => AnimBrute[];

function dessinerBrut(s: SpriteSource, sources: Sources, chercher: ChercherSprite): AnimBrute[] {
  const palette = new Map<string, number>();
  for (const nom of s.palettes) {
    const p = sources.palettes.get(nom);
    if (!p) throw new ErreurFormat(s.fichier, s.ligne, `palette inconnue « ${nom} »`);
    for (const [lettre, hex] of p) palette.set(lettre, hexVersRvba(hex));
  }
  for (const [lettre, hex] of s.couleurs) palette.set(lettre, hexVersRvba(hex));

  const couleur = (jeton: JetonCouleur, ligne: number): number => {
    if (jeton.startsWith('#')) return hexVersRvba(jeton.slice(1));
    const rvba = palette.get(jeton);
    if (rvba === undefined) throw new ErreurFormat(s.fichier, ligne, `couleur « ${jeton} » absente de la palette`);
    return rvba;
  };
  const table = (paires: readonly (readonly [JetonCouleur, JetonCouleur])[], ligne: number): Map<number, number> =>
    new Map(paires.map(([de, vers]) => [couleur(de, ligne), couleur(vers, ligne)]));

  const poserGrille = (g: Grille): Couche => {
    const couche = coucheVide(s.largeur, s.hauteur);
    const ox = s.origine[0] + g.x;
    const oy = s.origine[1] + g.y;
    g.lignes.forEach((texte, j) => {
      texte.split('').forEach((car, i) => {
        const x = ox + i;
        const y = oy + j;
        if (x >= s.largeur || y >= s.hauteur) {
          throw new ErreurFormat(s.fichier, g.ligneFichier + j, `la grille déborde du cadre ${String(s.largeur)}×${String(s.hauteur)} (origine ${String(ox)} ${String(oy)})`);
        }
        if (car === TRANSPARENT) return;
        if (car === EFFACE) {
          couche.efface[y * s.largeur + x] = 1;
          return;
        }
        ecrirePixel(couche, x, y, couleur(car, g.ligneFichier + j));
      });
    });
    return couche;
  };

  const appliquer = (c: Couche, operations: readonly Operation[], ligne: number): Couche => {
    let sortie = c;
    for (const op of operations) {
      switch (op.type) {
        case 'decale': sortie = decaler(sortie, op.dx, op.dy); break;
        case 'miroir': sortie = miroir(sortie); break;
        case 'retourne': sortie = retourner(sortie); break;
        case 'tourne': sortie = tourner(sortie, op.quarts); break;
        case 'couleurs': sortie = recolorer(sortie, table(op.paires, ligne), op.zone); break;
      }
    }
    return sortie;
  };

  let planche: Image | null = null;
  const recoloreMf = table(s.recolore, s.ligne);
  const cadreMinifolks = (ligneMf: number, indice: number, ligne: number): Couche => {
    if (!s.minifolks) throw new ErreurFormat(s.fichier, ligne, 'source « mf » sans directive « minifolks »');
    planche ??= sources.planche(s.minifolks);
    const x = indice * s.largeur;
    const y = ligneMf * s.hauteur;
    if (x + s.largeur > planche.largeur || y + s.hauteur > planche.hauteur) {
      throw new ErreurFormat(s.fichier, ligne, `cadre ${String(ligneMf)}.${String(indice)} hors de la planche ${s.minifolks}`);
    }
    return recolorer(decouper(planche, x, y, s.largeur, s.hauteur), recoloreMf);
  };

  // Animations déclarées : celles du sprite de base (`derive`), remplacées ou complétées par les siennes.
  const anims: AnimBrute[] = [];
  if (s.derive) {
    const { sprite: base, operations } = s.derive;
    for (const a of chercher(base, s, s.ligne)) {
      anims.push({ nom: a.nom, boucle: a.boucle, cadres: a.cadres.map((c) => ({ couche: appliquer(c.couche, operations, s.ligne), duree: c.duree })) });
    }
  }
  const propres = new Map(s.anims.map((a) => [a.nom, a]));
  const dessinees = new Map<string, AnimBrute>();
  /** Animations en cours de dessin : leurs cadres déjà faits peuvent servir aux suivants. */
  const enCours = new Map<string, AnimBrute>();

  const cadreDe = (sprite: string | null, nomAnim: string, indice: number, ligne: number): Couche => {
    let liste: AnimBrute[];
    if (sprite === null || sprite === s.nom) {
      const a = animPropre(nomAnim, ligne);
      liste = [a];
    } else {
      liste = chercher(sprite, s, ligne);
    }
    const anim = liste.find((a) => a.nom === nomAnim);
    const cadre = anim?.cadres[indice];
    if (!cadre) throw new ErreurFormat(s.fichier, ligne, `cadre introuvable : ${sprite ?? s.nom}/${nomAnim}.${String(indice)}`);
    if (cadre.couche.largeur !== s.largeur || cadre.couche.hauteur !== s.hauteur) {
      throw new ErreurFormat(s.fichier, ligne, `le cadre ${sprite ?? s.nom}/${nomAnim} n'a pas la taille de ce sprite`);
    }
    return cadre.couche;
  };

  const terme = (t: Terme, ligne: number): Couche => {
    let c: Couche;
    switch (t.source.type) {
      case 'minifolks': c = cadreMinifolks(t.source.ligne, t.source.indice, ligne); break;
      case 'cadre': c = cadreDe(t.source.sprite, t.source.anim, t.source.indice, ligne); break;
      case 'calque': {
        const g = s.calques.get(t.source.nom);
        if (!g) throw new ErreurFormat(s.fichier, ligne, `calque inconnu « ${t.source.nom} »`);
        c = poserGrille(g);
        break;
      }
    }
    return appliquer(c, t.operations, ligne);
  };

  const composer = (base: Couche, termes: readonly Terme[], grille: Grille | null, ligne: number): Couche => {
    let c = base;
    for (const t of termes) c = superposer(c, terme(t, ligne));
    if (grille) c = superposer(c, poserGrille(grille));
    // Un cadre terminé n'efface plus rien : seuls les calques et les grilles gardent leur masque.
    return { ...c, efface: new Uint8Array(c.largeur * c.hauteur) };
  };

  // Animation propre au sprite, dessinée à la demande pour que l'ordre des déclarations n'importe pas.
  function animPropre(nom: string, ligne: number): AnimBrute {
    const deja = dessinees.get(nom);
    if (deja) return deja;
    const source = propres.get(nom);
    if (!source) {
      const derivee = anims.find((a) => a.nom === nom);
      if (derivee) return derivee;
      throw new ErreurFormat(s.fichier, ligne, `animation inconnue « ${nom} » dans ${s.nom}`);
    }
    // Un cadre peut reprendre un cadre précédent de sa propre animation (pas un suivant : il n'existe pas encore).
    const partielle = enCours.get(nom);
    if (partielle) return partielle;
    const anim: AnimBrute = { nom, boucle: source.boucle, cadres: [] };
    enCours.set(nom, anim);
    for (const c of source.cadres) {
      anim.cadres.push({ couche: composer(coucheVide(s.largeur, s.hauteur), c.termes, c.grille, c.ligne), duree: c.duree ?? source.duree });
    }
    enCours.delete(nom);
    dessinees.set(nom, anim);
    return anim;
  }

  for (const a of s.anims) {
    const dessinee = animPropre(a.nom, a.ligne);
    const position = anims.findIndex((b) => b.nom === a.nom);
    if (position >= 0) anims[position] = dessinee;
    else anims.push(dessinee);
  }

  for (const r of s.retouches) {
    const anim = anims.find((a) => a.nom === r.anim);
    if (!anim) throw new ErreurFormat(s.fichier, r.ligne, `retouche d'une animation inconnue « ${r.anim} »`);
    const indices = r.indices === 'tous' ? anim.cadres.map((_, i) => i) : r.indices;
    const cadres = [...anim.cadres];
    for (const i of indices) {
      const cadre = cadres[i];
      if (!cadre) throw new ErreurFormat(s.fichier, r.ligne, `retouche du cadre ${String(i)} absent de « ${r.anim} »`);
      cadres[i] = { ...cadre, couche: composer(cadre.couche, r.termes, r.grille, r.ligne) };
    }
    anim.cadres = cadres;
  }

  for (const a of anims) {
    if (a.cadres.length === 0) throw new ErreurFormat(s.fichier, s.ligne, `animation « ${a.nom} » sans cadre`);
  }
  return anims;
}
