// Adaptateur d'EXEMPLE : des sprites dans un format texte trivial (`.pix`), pour montrer que le cœur de l'atelier ne
// dépend d'aucun projet. Un fichier = un sprite ; chaque `cadre` est une grille de lettres, un calque éditable.
//
//   taille 8 8          taille du cadre de dessin
//   duree 250           durée d'un cadre en ms
//   fond 2d3a24         couleur du sol de l'aperçu (RRGGBB)
//   couleur G 40c040    lettre de palette
//   cadre               début d'un cadre ; les lignes qui suivent (jusqu'à une ligne vide) sont sa grille
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { remplacerGrilles } from '../ecriture-texte.ts';
import { empreinte } from '../empreinte.ts';
import { ErreurConflit, ErreurIntrouvable, type Adaptateur, type ApercuSprite, type CalquesModifies, type DocumentSprite, type EntreePalette, type Ecriture } from '../types.ts';

interface CadrePix { readonly debut: number; readonly lignes: string[] }
interface SpritePix {
  largeur: number;
  hauteur: number;
  duree: number;
  fond: string;
  readonly palette: EntreePalette[];
  readonly cadres: CadrePix[];
}

export function lirePix(texte: string): SpritePix {
  const sprite: SpritePix = { largeur: 8, hauteur: 8, duree: 200, fond: '#222222', palette: [], cadres: [] };
  let courant: CadrePix | null = null;
  texte.split(/\r?\n/).forEach((brute, n) => {
    const ligne = brute.trim();
    if (ligne === '') { courant = null; return; }
    if (ligne.startsWith('#')) return;
    const [mot = '', ...args] = ligne.split(/\s+/);
    if (courant) { courant.lignes.push(ligne); return; }
    switch (mot) {
      case 'taille': sprite.largeur = Number(args[0]); sprite.hauteur = Number(args[1]); break;
      case 'duree': sprite.duree = Number(args[0]); break;
      case 'fond': sprite.fond = `#${args[0] ?? '222222'}`; break;
      case 'couleur': sprite.palette.push({ lettre: args[0] ?? '?', couleur: `#${args[1] ?? '000000'}` }); break;
      case 'cadre': courant = { debut: n + 2, lignes: [] }; sprite.cadres.push(courant); break;
      default: throw new Error(`Directive inconnue « ${mot} » ligne ${String(n + 1)}`);
    }
  });
  return sprite;
}

function rendre(id: string, sprite: SpritePix, cadres: readonly (readonly string[])[]): ApercuSprite {
  const couleurs = new Map(sprite.palette.map((p) => [p.lettre, p.couleur]));
  const images = cadres.map((lignes) => {
    const octets = new Uint8Array(sprite.largeur * sprite.hauteur * 4);
    lignes.forEach((ligne, y) => {
      ligne.split('').forEach((lettre, x) => {
        const hex = couleurs.get(lettre);
        if (!hex || x >= sprite.largeur || y >= sprite.hauteur) return;
        octets.set([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255], (y * sprite.largeur + x) * 4);
      });
    });
    return { largeur: sprite.largeur, hauteur: sprite.hauteur, rvba: Buffer.from(octets).toString('base64') };
  });
  return {
    id, nom: id, largeur: sprite.largeur, hauteur: sprite.hauteur, ancre: { x: sprite.largeur / 2, y: sprite.hauteur },
    animations: [{ nom: 'defaut', boucle: true, cadres: images.map((image) => ({ image, duree: sprite.duree })) }],
  };
}

/** Adaptateur des fichiers `sprites/*.pix` du dossier `racine`. */
export function adaptateurPix(racine: string): Adaptateur {
  const dossier = join(racine, 'sprites');
  const lire = (id: string): { texte: string; sprite: SpritePix } => {
    if (!/^[\w-]+$/.test(id) || !existsSync(join(dossier, `${id}.pix`))) throw new ErreurIntrouvable(`Sprite inconnu : ${id}`);
    const texte = readFileSync(join(dossier, `${id}.pix`), 'utf8');
    return { texte, sprite: lirePix(texte) };
  };
  return {
    nom: 'Exemple (.pix)',
    racine,
    ecriturePermise: ['sprites/'],
    sprites: {
      lister: () => Promise.resolve(readdirSync(dossier).filter((f) => f.endsWith('.pix')).sort().map((f) => ({ id: basename(f, '.pix'), nom: basename(f, '.pix'), groupe: 'Sprites' }))),
      ouvrir: (id): Promise<DocumentSprite> => {
        const { sprite, texte } = lire(id);
        return Promise.resolve({
          empreinte: empreinte([texte]),
          id, nom: id, largeur: sprite.largeur, hauteur: sprite.hauteur, palette: sprite.palette, fond: sprite.fond,
          calques: sprite.cadres.map((c, i) => ({ id: String(i), nom: `cadre ${String(i + 1)}`, x: 0, y: 0, lignes: c.lignes })),
          apercu: rendre(id, sprite, sprite.cadres.map((c) => c.lignes)), derives: [],
        });
      },
      apercu: (id, calques: CalquesModifies) => {
        const { sprite } = lire(id);
        return Promise.resolve({ apercu: rendre(id, sprite, sprite.cadres.map((c, i) => calques[String(i)] ?? c.lignes)), derives: [] });
      },
      enregistrer: (id, calques, base): Promise<readonly Ecriture[]> => {
        const { texte, sprite } = lire(id);
        if (base.empreinte !== empreinte([texte])) throw new ErreurConflit('Le fichier a changé depuis l\'ouverture : rouvrir le sprite.');
        const blocs = Object.entries(calques).map(([cle, lignes]) => {
          const cadre = sprite.cadres[Number(cle)];
          if (!cadre) throw new Error(`Calque inconnu : ${cle}`);
          return { debut: cadre.debut, longueur: cadre.lignes.length, lignes };
        });
        return Promise.resolve([{ chemin: `sprites/${id}.pix`, contenu: remplacerGrilles(texte, blocs) }]);
      },
    },
  };
}
