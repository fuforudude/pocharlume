// Lecture des sources graphiques de Pocharlume avec l'analyseur et le rendu de tools/art (réutilisés, pas recopiés), et
// substitution des grilles modifiées par l'éditeur avant le rendu. Une grille est identifiée par sa place dans le
// fichier (`art/sprites/x.txt:42`) : c'est aussi ce qui permet de ne réécrire que ses lignes.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lireSources } from '../art/construire.ts';
import { dessinerSprites, type SpriteDessine } from '../art/dessin.ts';
import type { AnimSource, CadreSource, Grille, RetoucheSource, SpriteSource, Terme } from '../art/format.ts';
import { decoderPng, type Image } from '../art/png.ts';
import type { ApercuSprite, ImageRvba } from '../atelier/types.ts';

export interface Sources {
  readonly sprites: readonly SpriteSource[];
  readonly palettes: ReadonlyMap<string, ReadonlyMap<string, string>>;
}

export const cleGrille = (g: Grille, fichier: string): string => `${fichier}:${String(g.ligneFichier)}`;

export function charger(racine: string): Sources {
  return lireSources(racine);
}

const planches = new Map<string, Image>();
function planche(racine: string, chemin: string): Image {
  const cle = `${racine}|${chemin}`;
  let image = planches.get(cle);
  if (!image) {
    image = decoderPng(readFileSync(join(racine, 'art', 'minifolks', chemin)));
    planches.set(cle, image);
  }
  return image;
}

// --- Références entre sprites ---------------------------------------------------------------------------------

function termesDe(s: SpriteSource): Terme[] {
  return [...s.anims.flatMap((a) => a.cadres.flatMap((c) => c.termes)), ...s.retouches.flatMap((r) => r.termes)];
}

/** Sprites dont celui-ci dépend directement pour son rendu : modèle, base d'un `derive`, cadres repris. */
export function dependancesDirectes(s: SpriteSource): string[] {
  const noms = new Set<string>();
  if (s.modele) noms.add(s.modele);
  if (s.derive) noms.add(s.derive.sprite);
  for (const t of termesDe(s)) if (t.source.type === 'cadre' && t.source.sprite && t.source.sprite !== s.nom) noms.add(t.source.sprite);
  return [...noms];
}

/** Le sprite et tout ce dont son rendu a besoin, transitivement. */
export function fermeture(parNom: ReadonlyMap<string, SpriteSource>, noms: Iterable<string>): Set<string> {
  const vus = new Set<string>();
  const pile = [...noms];
  for (let nom = pile.pop(); nom !== undefined; nom = pile.pop()) {
    if (vus.has(nom)) continue;
    const s = parNom.get(nom);
    if (!s) continue;
    vus.add(nom);
    pile.push(...dependancesDirectes(s));
  }
  return vus;
}

export const indexParNom = (sprites: readonly SpriteSource[]): Map<string, SpriteSource> => new Map(sprites.map((s) => [s.nom, s]));

/** Sprites qui dépendent (transitivement) de ceux donnés, hors eux-mêmes. */
export function dependants(sprites: readonly SpriteSource[], cibles: ReadonlySet<string>): string[] {
  const parNom = indexParNom(sprites);
  return sprites.filter((s) => !cibles.has(s.nom) && [...fermeture(parNom, [s.nom])].some((n) => cibles.has(n))).map((s) => s.nom);
}

// --- Grilles ---------------------------------------------------------------------------------------------------

export interface GrilleDeSprite {
  readonly cle: string;
  /** Fichier qui contient la grille (celui du modèle pour une grille héritée). */
  readonly fichier: string;
  readonly nom: string;
  readonly grille: Grille;
  readonly contexte: { readonly animation: string; readonly indice: number } | null;
  /** Sprite d'où vient la grille quand ce n'est pas le sprite lui-même (modèle). */
  readonly heritee: string | null;
}

/** Sprite et modèles en chaîne (le sprite d'abord), pour les calques, animations et retouches hérités. */
function chaineModeles(s: SpriteSource, parNom: ReadonlyMap<string, SpriteSource>): SpriteSource[] {
  const chaine = [s];
  for (let m = s.modele ? parNom.get(s.modele) : undefined; m && !chaine.includes(m); m = m.modele ? parNom.get(m.modele) : undefined) chaine.push(m);
  return chaine;
}

/** Toutes les grilles qui entrent dans le rendu du sprite lui-même (calques, cadres dessinés, retouches), héritage compris. */
export function grillesDe(s: SpriteSource, parNom: ReadonlyMap<string, SpriteSource>): GrilleDeSprite[] {
  const sortie: GrilleDeSprite[] = [];
  const vues = new Set<string>();
  const ajouter = (g: Grille, fichier: string, nom: string, contexte: GrilleDeSprite['contexte'], heritee: string | null): void => {
    const cle = cleGrille(g, fichier);
    if (vues.has(cle)) return;
    vues.add(cle);
    sortie.push({ cle, fichier, nom, grille: g, contexte, heritee });
  };
  const noms = new Set<string>();
  for (const [rang, source] of chaineModeles(s, parNom).entries()) {
    const heritee = rang === 0 ? null : source.nom;
    const propres = new Set(s.anims.map((a) => a.nom));
    for (const [nom, g] of source.calques) {
      if (noms.has(nom)) continue;
      noms.add(nom);
      ajouter(g, source.fichier, `calque ${nom}`, null, heritee);
    }
    for (const a of source.anims) {
      if (rang > 0 && propres.has(a.nom)) continue;
      a.cadres.forEach((c: CadreSource, i) => {
        if (c.grille) {
          const meme = a.cadres.filter((x) => x.grille === c.grille);
          const premier = a.cadres.indexOf(meme[0] as CadreSource);
          ajouter(c.grille, source.fichier, meme.length > 1 ? `${a.nom} ${String(premier)}-${String(premier + meme.length - 1)}` : `${a.nom} ${String(i)}`, { animation: a.nom, indice: i }, heritee);
        }
      });
    }
    for (const r of source.retouches) {
      if (r.grille) ajouter(r.grille, source.fichier, `retouche ${r.anim} ${r.indices === 'tous' ? '*' : r.indices.join(',')}`, { animation: r.anim, indice: r.indices === 'tous' ? 0 : (r.indices[0] ?? 0) }, heritee);
    }
  }
  return sortie;
}

/** Remplace par leurs nouvelles lignes les grilles modifiées (par clé), dans une copie des sources. */
export function substituer(sprites: readonly SpriteSource[], modifs: Readonly<Record<string, readonly string[]>>): SpriteSource[] {
  if (Object.keys(modifs).length === 0) return [...sprites];
  const nouvelle = (g: Grille, fichier: string): Grille => {
    const lignes = modifs[cleGrille(g, fichier)];
    return lignes ? { ...g, lignes } : g;
  };
  const cache = new Map<Grille, Grille>();
  const unique = (g: Grille, fichier: string): Grille => {
    let n = cache.get(g);
    if (!n) { n = nouvelle(g, fichier); cache.set(g, n); }
    return n;
  };
  return sprites.map((s) => ({
    ...s,
    calques: new Map([...s.calques].map(([nom, g]) => [nom, unique(g, s.fichier)])),
    anims: s.anims.map((a): AnimSource => ({ ...a, cadres: a.cadres.map((c): CadreSource => (c.grille ? { ...c, grille: unique(c.grille, s.fichier) } : c)) })),
    retouches: s.retouches.map((r): RetoucheSource => (r.grille ? { ...r, grille: unique(r.grille, s.fichier) } : r)),
  }));
}

// --- Rendu -----------------------------------------------------------------------------------------------------

/** Dessine les sprites demandés (et ce dont ils dépendent). Une palette peut être remplacée par ses couleurs modifiées. */
export function rendre(
  racine: string,
  sources: Sources,
  demandes: Iterable<string>,
  options: { readonly modifs?: Readonly<Record<string, readonly string[]>>; readonly couleurs?: { readonly palette: string; readonly changements: Readonly<Record<string, string>> } } = {},
): Map<string, SpriteDessine> {
  const tous = substituer(sources.sprites, options.modifs ?? {});
  const parNom = indexParNom(tous);
  const retenus = fermeture(parNom, demandes);
  const aRendre = tous.filter((s) => retenus.has(s.nom));
  let palettes = sources.palettes;
  if (options.couleurs) {
    const { palette, changements } = options.couleurs;
    const base = sources.palettes.get(palette);
    if (base) {
      const copie = new Map(base);
      for (const [lettre, hex] of Object.entries(changements)) copie.set(lettre, hex.slice(1));
      palettes = new Map(sources.palettes).set(palette, copie);
    }
  }
  const dessines = dessinerSprites({ sprites: aRendre, palettes, planche: (chemin) => planche(racine, chemin) });
  return new Map(dessines.map((d) => [d.nom, d]));
}

export function imageRvba(couche: { readonly largeur: number; readonly hauteur: number; readonly pixels: Uint8Array }): ImageRvba {
  return { largeur: couche.largeur, hauteur: couche.hauteur, rvba: Buffer.from(couche.pixels.buffer, couche.pixels.byteOffset, couche.pixels.byteLength).toString('base64') };
}

export function apercuDe(d: SpriteDessine): ApercuSprite {
  return {
    id: d.nom,
    nom: d.nom,
    largeur: d.largeur,
    hauteur: d.hauteur,
    ancre: { x: d.ancre[0], y: d.ancre[1] },
    animations: d.anims.map((a) => ({ nom: a.nom, boucle: a.boucle, cadres: a.cadres.map((c) => ({ image: imageRvba(c.couche), duree: c.duree })) })),
  };
}
