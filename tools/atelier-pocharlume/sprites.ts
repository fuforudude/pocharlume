// Module « sprites » de l'adaptateur Pocharlume : les calques éditables sont les grilles de lettres de
// art/sprites/*.txt (calques nommés, cadres dessinés, retouches). Les cadres repris d'une planche Minifolks ou d'un autre
// sprite se voient dans l'aperçu mais ne s'éditent pas ici.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { remplacerGrilles, type BlocGrille } from '../atelier/ecriture-texte.ts';
import type { SpriteSource } from '../art/format.ts';
import { empreinte } from '../atelier/empreinte.ts';
import { ErreurConflit, ErreurIntrouvable, ErreurRequete, type CalqueSprite, type CalquesModifies, type DocumentSprite, type EntreePalette, type Ecriture, type ModuleSprites } from '../atelier/types.ts';
import { apercuDe, charger, cleGrille, dependants, grillesDe, indexParNom, rendre, type Sources } from './sources.ts';

interface PlaceGrille {
  readonly fichier: string;
  readonly debut: number;
  readonly lignes: readonly string[];
  readonly proprietaire: SpriteSource;
  /** Tous les sprites qui contiennent la grille (ses lettres peuvent venir de la palette de l'un ou de l'autre). */
  readonly utilisateurs: SpriteSource[];
  readonly x: number;
  readonly y: number;
}

/** Toutes les grilles du dépôt par clé, avec le sprite qui les rend (pour la taille du cadre et la palette). */
function placesDesGrilles(sources: Sources): Map<string, PlaceGrille> {
  const parNom = indexParNom(sources.sprites);
  const places = new Map<string, PlaceGrille>();
  for (const s of sources.sprites) {
    for (const g of grillesDe(s, parNom)) {
      const connue = places.get(g.cle);
      if (connue) connue.utilisateurs.push(s);
      else places.set(g.cle, { fichier: g.fichier, debut: g.grille.ligneFichier, lignes: g.grille.lignes, proprietaire: s, utilisateurs: [s], x: s.origine[0] + g.grille.x, y: s.origine[1] + g.grille.y });
    }
  }
  return places;
}

/** Une grille ne contient que `.`, `_` et des lettres de la palette de son sprite, et tient dans le cadre. */
function validerLignes(cle: string, place: PlaceGrille, lignes: readonly string[], sources: Sources): void {
  if (lignes.length === 0) throw new ErreurRequete(`Grille vide : ${cle}`);
  const permises = new Set(['.', '_', ...place.utilisateurs.flatMap((u) => paletteDe(u, sources).map((p) => p.lettre))]);
  lignes.forEach((ligne, j) => {
    for (const c of ligne) {
      if (!permises.has(c)) throw new ErreurRequete(`Ligne ${String(j + 1)} de ${cle} : caractère « ${c} » interdit (permis : . _ et les lettres de la palette)`);
    }
    if (place.x + ligne.length > place.proprietaire.largeur) throw new ErreurRequete(`Ligne ${String(j + 1)} de ${cle} : déborde du cadre (${String(place.proprietaire.largeur)} de large)`);
  });
  if (place.y + lignes.length > place.proprietaire.hauteur) throw new ErreurRequete(`${cle} : ${String(lignes.length)} lignes débordent du cadre (${String(place.proprietaire.hauteur)} de haut)`);
}

/** Empreinte des fichiers que l'enregistrement d'un sprite peut réécrire : ceux qui contiennent ses grilles. */
function empreinteSprite(racine: string, s: SpriteSource, sources: Sources): string {
  const parNom = indexParNom(sources.sprites);
  const fichiers = [...new Set(grillesDe(s, parNom).map((g) => g.fichier))].sort();
  return empreinte(fichiers.map((f) => `${f}\n${readFileSync(join(racine, f), 'utf8')}`));
}

/** Couleur de l'herbe du jeu, pour jouer les animations sur un sol qui ressemble au vrai. */
export const FOND_SOL = '#47573a';

/** Couleurs d'un sprite : ses palettes dans l'ordre, puis ses couleurs propres (qui passent devant). */
export function paletteDe(s: SpriteSource, sources: Sources): EntreePalette[] {
  const couleurs = new Map<string, EntreePalette>();
  for (const nom of s.palettes) {
    for (const [lettre, hex] of sources.palettes.get(nom) ?? []) couleurs.set(lettre, { lettre, couleur: `#${hex}`, commentaire: `palette ${nom}` });
  }
  for (const [lettre, hex] of s.couleurs) couleurs.set(lettre, { lettre, couleur: `#${hex}`, commentaire: 'couleur propre' });
  return [...couleurs.values()];
}

export function moduleSprites(racine: string): ModuleSprites {
  const lireTout = (): Sources => charger(racine);

  return {
    lister: () => {
      const { sprites } = lireTout();
      return Promise.resolve(sprites.map((s) => ({ id: s.nom, nom: s.nom, groupe: s.fichier.replace(/^art\/sprites\//, '').replace(/\.txt$/, '') })));
    },

    ouvrir: (id): Promise<DocumentSprite> => {
      const sources = lireTout();
      const parNom = indexParNom(sources.sprites);
      const s = parNom.get(id);
      if (!s) throw new ErreurIntrouvable(`Sprite inconnu : ${id}`);
      const dependantsNoms = dependants(sources.sprites, new Set([id]));
      const rendus = rendre(racine, sources, [id, ...dependantsNoms]);
      const grilles = grillesDe(s, parNom);
      // Qui d'autre contient ces grilles ? (calques de fichier, calques d'un modèle)
      const contenus = new Map<string, string[]>();
      for (const autre of sources.sprites) {
        if (autre.nom === id) continue;
        for (const g of grillesDe(autre, parNom)) contenus.set(g.cle, [...(contenus.get(g.cle) ?? []), autre.nom]);
      }
      const calques: CalqueSprite[] = grilles.map((g): CalqueSprite => {
        const partage = [...new Set(contenus.get(g.cle) ?? [])];
        return {
          id: g.cle,
          nom: g.heritee ? `${g.nom} (hérité de ${g.heritee})` : g.nom,
          x: s.origine[0] + g.grille.x,
          y: s.origine[1] + g.grille.y,
          lignes: g.grille.lignes,
          ...(partage.length > 0 ? { partageAvec: partage } : {}),
          ...(g.contexte ? { contexte: g.contexte } : {}),
        };
      });
      const dessine = rendus.get(id);
      if (!dessine) throw new Error(`Rendu impossible : ${id}`);
      const nonEditable = s.anims.some((a) => a.cadres.some((c) => !c.grille));
      return Promise.resolve({
        id,
        nom: id,
        largeur: s.largeur,
        hauteur: s.hauteur,
        calques,
        palette: paletteDe(s, sources),
        apercu: apercuDe(dessine),
        derives: dependantsNoms.flatMap((n) => { const d = rendus.get(n); return d ? [apercuDe(d)] : []; }),
        fond: FOND_SOL,
        empreinte: empreinteSprite(racine, s, sources),
        ...(calques.length === 0
          ? { remarque: 'Ce sprite n\'a aucune grille à retoucher : il est composé de cadres repris d\'une planche ou d\'autres sprites.' }
          : nonEditable ? { remarque: 'Certains cadres viennent d\'une planche ou d\'un autre sprite : ils se voient dans les animations mais ne se retouchent pas ici.' } : {}),
      });
    },

    apercu: (id, modifs: CalquesModifies, origine: CalquesModifies) => {
      const sources = lireTout();
      if (!sources.sprites.some((s) => s.nom === id)) throw new ErreurIntrouvable(`Sprite inconnu : ${id}`);
      const places = placesDesGrilles(sources);
      for (const [cle, lignes] of Object.entries(modifs)) {
        const place = places.get(cle);
        if (!place || JSON.stringify(origine[cle]) !== JSON.stringify(place.lignes)) throw new ErreurConflit(`La grille ${cle} a changé depuis l'ouverture du sprite : le rouvrir`);
        validerLignes(cle, place, lignes, sources);
      }
      const dependantsNoms = dependants(sources.sprites, new Set([id]));
      const rendus = rendre(racine, sources, [id, ...dependantsNoms], { modifs });
      const dessine = rendus.get(id);
      if (!dessine) throw new ErreurIntrouvable(`Sprite inconnu : ${id}`);
      return Promise.resolve({ apercu: apercuDe(dessine), derives: dependantsNoms.flatMap((n) => { const d = rendus.get(n); return d ? [apercuDe(d)] : []; }) });
    },

    enregistrer: (id, modifs: CalquesModifies, base): Promise<readonly Ecriture[]> => {
      const sources = lireTout();
      const sprite = indexParNom(sources.sprites).get(id);
      if (!sprite) throw new ErreurIntrouvable(`Sprite inconnu : ${id}`);
      const conflit = 'Le fichier a changé depuis l\'ouverture du sprite : rouvrir le sprite avant d\'enregistrer (rien n\'a été écrit).';
      if (base.empreinte !== empreinteSprite(racine, sprite, sources)) throw new ErreurConflit(conflit);
      const places = placesDesGrilles(sources);
      const parFichier = new Map<string, BlocGrille[]>();
      for (const [cle, lignes] of Object.entries(modifs)) {
        const place = places.get(cle);
        if (!place) throw new ErreurConflit(conflit);
        const origine = base.origine[cle];
        if (!origine) throw new ErreurRequete(`Lignes d'origine absentes pour ${cle}`);
        if (JSON.stringify(origine) !== JSON.stringify(place.lignes)) throw new ErreurConflit(conflit);
        validerLignes(cle, place, lignes, sources);
        parFichier.set(place.fichier, [...(parFichier.get(place.fichier) ?? []), { debut: place.debut, longueur: place.lignes.length, lignes, attendues: place.lignes }]);
      }
      const ecritures: Ecriture[] = [];
      for (const [fichier, blocs] of parFichier) {
        const texte = readFileSync(join(racine, fichier), 'utf8');
        ecritures.push({ chemin: fichier, contenu: remplacerGrilles(texte, blocs) });
      }
      return Promise.resolve(ecritures);
    },
  };
}

export { cleGrille };
