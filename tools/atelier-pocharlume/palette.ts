// Module « palette » de l'adaptateur Pocharlume : les palettes partagées art/palettes/*.txt (`lettre RRGGBB commentaire`).
// Changer une couleur ne réécrit que le code couleur de sa ligne.
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { SpriteSource } from '../art/format.ts';
import type { DocumentPalette, Ecriture, ModulePalette, VignetteSprite } from '../atelier/types.ts';
import { apercuDe, charger, dependants, grillesDe, indexParNom, rendre, type Sources } from './sources.ts';

/** À partir de ce nombre de sprites touchés, le changement d'une couleur mérite un avertissement. */
export const SEUIL_AVERTISSEMENT = 8;

/** Sprites qui emploient directement la lettre de cette palette (dans une grille ou une recoloration). */
function utilisateursDirects(sources: Sources, palette: string, lettre: string): SpriteSource[] {
  const parNom = indexParNom(sources.sprites);
  const dansPaires = (s: SpriteSource): boolean =>
    s.recolore.some(([a, b]) => a === lettre || b === lettre)
    || s.anims.some((a) => a.cadres.some((c) => c.termes.some((t) => t.operations.some((o) => o.type === 'couleurs' && o.paires.some(([a, b]) => a === lettre || b === lettre)))))
    || (s.derive?.operations.some((o) => o.type === 'couleurs' && o.paires.some(([a, b]) => a === lettre || b === lettre)) ?? false);
  return sources.sprites.filter((s) => {
    if (!s.palettes.includes(palette) || s.couleurs.has(lettre)) return false;
    return dansPaires(s) || grillesDe(s, parNom).some((g) => g.grille.lignes.some((l) => l.includes(lettre)));
  });
}

/** Sprites dont le rendu change quand cette lettre change : ses utilisateurs et tout ce qui en dépend. */
function concernes(sources: Sources, palette: string, lettre: string): Set<string> {
  const directs = new Set(utilisateursDirects(sources, palette, lettre).map((s) => s.nom));
  return new Set([...directs, ...dependants(sources.sprites, directs)]);
}

export function modulePalette(racine: string): ModulePalette {
  const dossier = join(racine, 'art', 'palettes');
  const cheminDe = (nom: string): string => {
    if (!/^[\w-]+$/.test(nom)) throw new Error(`Palette inconnue : ${nom}`);
    return join(dossier, `${nom}.txt`);
  };
  return {
    lister: () => Promise.resolve(readdirSync(dossier).filter((f) => f.endsWith('.txt')).map((f) => basename(f, '.txt')).sort()),

    ouvrir: (nom): Promise<DocumentPalette> => {
      const texte = readFileSync(cheminDe(nom), 'utf8');
      const sources = charger(racine);
      const couleurs = texte.split(/\r?\n/).flatMap((brute) => {
        const ligne = brute.trim();
        if (ligne === '' || ligne.startsWith('#')) return [];
        const [lettre = '', hex = '', ...reste] = ligne.split(/\s+/);
        return [{ lettre, couleur: `#${hex.toLowerCase()}`, commentaire: reste.join(' '), utilisations: concernes(sources, nom, lettre).size }];
      });
      return Promise.resolve({ nom, couleurs, seuilAvertissement: SEUIL_AVERTISSEMENT });
    },

    apercu: (nom, changements): Promise<readonly VignetteSprite[]> => {
      const sources = charger(racine);
      const touches = new Set<string>();
      for (const lettre of Object.keys(changements)) for (const n of concernes(sources, nom, lettre)) touches.add(n);
      const rendus = rendre(racine, sources, touches, { couleurs: { palette: nom, changements } });
      return Promise.resolve([...touches].sort().flatMap((n) => {
        const d = rendus.get(n);
        if (!d) return [];
        const anim = apercuDe(d).animations.find((a) => a.nom === 'repos') ?? apercuDe(d).animations[0];
        const cadre = anim?.cadres[0];
        return cadre ? [{ id: n, nom: n, image: cadre.image }] : [];
      }));
    },

    enregistrer: (nom, changements): Promise<readonly Ecriture[]> => {
      const chemin = cheminDe(nom);
      const lignes = readFileSync(chemin, 'utf8').split('\n');
      const restantes = new Set(Object.keys(changements));
      const sortie = lignes.map((brute) => {
        const m = /^(\s*)(\S)(\s+)([0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)(.*)$/s.exec(brute);
        if (!m || m[2] === '#') return brute;
        const lettre = m[2] ?? '';
        const nouvelle = changements[lettre];
        if (nouvelle === undefined) return brute;
        restantes.delete(lettre);
        return `${m[1] ?? ''}${lettre}${m[3] ?? ''}${nouvelle.slice(1)}${m[5] ?? ''}`;
      });
      if (restantes.size > 0) throw new Error(`Lettre absente de la palette : ${[...restantes].join(', ')}`);
      return Promise.resolve([{ chemin: `art/palettes/${nom}.txt`, contenu: sortie.join('\n') }]);
    },
  };
}
