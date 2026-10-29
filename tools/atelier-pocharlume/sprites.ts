// Module « sprites » de l'adaptateur Pocharlume : les calques éditables sont les grilles de lettres de
// art/sprites/*.txt (calques nommés, cadres dessinés, retouches). Les cadres repris d'une planche Minifolks ou d'un autre
// sprite se voient dans l'aperçu mais ne s'éditent pas ici.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { remplacerGrilles, type BlocGrille } from '../atelier/ecriture-texte.ts';
import type { SpriteSource } from '../art/format.ts';
import type { CalqueSprite, CalquesModifies, DocumentSprite, EntreePalette, Ecriture, ModuleSprites } from '../atelier/types.ts';
import { apercuDe, charger, cleGrille, dependants, grillesDe, indexParNom, rendre, type Sources } from './sources.ts';

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
      if (!s) throw new Error(`Sprite inconnu : ${id}`);
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
        ...(calques.length === 0
          ? { remarque: 'Ce sprite n\'a aucune grille à retoucher : il est composé de cadres repris d\'une planche ou d\'autres sprites.' }
          : nonEditable ? { remarque: 'Certains cadres viennent d\'une planche ou d\'un autre sprite : ils se voient dans les animations mais ne se retouchent pas ici.' } : {}),
      });
    },

    apercu: (id, modifs: CalquesModifies) => {
      const sources = lireTout();
      const dependantsNoms = dependants(sources.sprites, new Set([id]));
      const rendus = rendre(racine, sources, [id, ...dependantsNoms], { modifs });
      const dessine = rendus.get(id);
      if (!dessine) throw new Error(`Sprite inconnu : ${id}`);
      return Promise.resolve({ apercu: apercuDe(dessine), derives: dependantsNoms.flatMap((n) => { const d = rendus.get(n); return d ? [apercuDe(d)] : []; }) });
    },

    enregistrer: (id, modifs: CalquesModifies): Promise<readonly Ecriture[]> => {
      const sources = lireTout();
      const parNom = indexParNom(sources.sprites);
      if (!parNom.has(id)) throw new Error(`Sprite inconnu : ${id}`);
      // Toutes les grilles du dépôt, par clé : une clé inconnue est refusée avant d'écrire quoi que ce soit.
      const connues = new Map<string, { fichier: string; debut: number; longueur: number }>();
      for (const s of sources.sprites) for (const g of grillesDe(s, parNom)) connues.set(g.cle, { fichier: g.fichier, debut: g.grille.ligneFichier, longueur: g.grille.lignes.length });
      const parFichier = new Map<string, BlocGrille[]>();
      for (const [cle, lignes] of Object.entries(modifs)) {
        const place = connues.get(cle);
        if (!place) throw new Error(`Grille inconnue : ${cle}`);
        if (lignes.length === 0) throw new Error(`Grille vide : ${cle}`);
        parFichier.set(place.fichier, [...(parFichier.get(place.fichier) ?? []), { debut: place.debut, longueur: place.longueur, lignes }]);
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
