// Garde-fou du pipeline graphique : l'atlas commité doit être exactement celui que produisent les sources,
// et il doit contenir tout ce que le rendu attend.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { AtlasJson } from './atlas.ts';
import { construire, DOSSIER_SORTIE, lireSources, type Construction } from './construire.ts';
import { decoderPng } from './png.ts';

let resultat: Construction;
let commite: AtlasJson;

beforeAll(() => {
  resultat = construire();
  commite = JSON.parse(readFileSync(join(DOSSIER_SORTIE, 'atlas.json'), 'utf8')) as AtlasJson;
});

describe('atlas commité', () => {
  it('est à jour par rapport aux sources (sinon : npm run art)', () => {
    const texte = readFileSync(join(DOSSIER_SORTIE, 'atlas.json'), 'utf8').replace(/\r\n/g, '\n');
    expect(texte).toBe(resultat.texteJson);
    const image = decoderPng(readFileSync(join(DOSSIER_SORTIE, 'atlas.png')));
    expect([image.largeur, image.hauteur]).toEqual([resultat.image.largeur, resultat.image.hauteur]);
    // Comparaison des pixels plutôt que des octets : zlib peut compresser autrement selon la version de Node.
    expect(Buffer.from(image.pixels).equals(Buffer.from(resultat.image.pixels))).toBe(true);
  });

  it('déclare chaque animation des sources avec ses cadres', () => {
    for (const source of lireSources().sprites) {
      const sprite = commite.sprites[source.nom];
      expect(sprite, source.nom).toBeDefined();
      for (const anim of source.anims) {
        expect(sprite?.animations[anim.nom]?.cadres.length, `${source.nom}/${anim.nom}`).toBe(anim.cadres.length);
      }
    }
  });

  it('a des cadres non vides, dans l’image et dans leur cadre logique', () => {
    for (const [nom, sprite] of Object.entries(commite.sprites)) {
      const variantes = [sprite.animations, ...(sprite.sansContour ? [sprite.sansContour] : [])];
      expect(Object.keys(sprite.animations).length, nom).toBeGreaterThan(0);
      for (const animations of variantes) {
        for (const [nomAnim, anim] of Object.entries(animations)) {
          expect(anim.cadres.length, `${nom}/${nomAnim}`).toBeGreaterThan(0);
          for (const c of anim.cadres) {
            expect(c.largeur * c.hauteur, `${nom}/${nomAnim}`).toBeGreaterThan(0);
            expect(c.duree).toBeGreaterThan(0);
            expect(c.x + c.largeur).toBeLessThanOrEqual(commite.largeur);
            expect(c.y + c.hauteur).toBeLessThanOrEqual(commite.hauteur);
            expect(c.dx + c.largeur).toBeLessThanOrEqual(sprite.largeur);
            expect(c.dy + c.hauteur).toBeLessThanOrEqual(sprite.hauteur);
          }
        }
      }
      // La variante sans contour a les mêmes animations que la variante affichée.
      if (sprite.sansContour) expect(Object.keys(sprite.sansContour)).toEqual(Object.keys(sprite.animations));
    }
  });

  it('contient les sprites du jalon 1', () => {
    const familles = ['caserne', 'tir', 'magie', 'artillerie'];
    const specialisations = ['caserne-cloitre', 'caserne-ecorcheurs', 'tir-guetteurs', 'tir-beffroi', 'magie-oracle',
      'magie-necromancien', 'artillerie-mortier', 'artillerie-baliste'];
    const attendus = [
      ...familles.flatMap((f) => [1, 2, 3].map((n) => `tour-${f}-${String(n)}`)),
      ...specialisations.map((s) => `tour-${s}`),
      'tour-totem', 'socle',
      'soldat-grange', 'garde-cloitre', 'ecorcheur', 'archer-chat', 'guetteur-chat', 'arbaletrier-chat',
      'charlie', 'gros-matou', 'spectre-chat',
      'paysan-affame', 'mendiant', 'chien-errant', 'boucher-vaudrelle',
      'fleche', 'carreau', 'boule-cendre', 'pierre', 'onde-choc', 'impact', 'fumee', 'etourdi', 'sang',
      'herbe-1', 'chemin-1', 'chemin-bord-n', 'chemin-coin-ext-no', 'chemin-coin-int-no', 'boue-1', 'paves-1',
      'cloture-h', 'maison-ruine-1', 'arbre-mort-1', 'puits', 'potence', 'bucher-eteint',
      'icone-arete', 'icone-etoile', 'icone-vie', 'icone-braise', 'icone-chute-colosse', 'icone-renforts',
      'icone-caserne', 'icone-tir', 'icone-magie', 'icone-artillerie', 'icone-vendre', 'icone-ameliorer',
      'icone-ralliement',
    ];
    expect(attendus.filter((n) => !(n in commite.sprites))).toEqual([]);
  });

  it('donne aux unités et aux ennemis les animations dont le rendu a besoin', () => {
    for (const [nom, sprite] of Object.entries(commite.sprites)) {
      if (sprite.categorie !== 'unite' && sprite.categorie !== 'ennemi') continue;
      expect(Object.keys(sprite.animations), nom).toEqual(expect.arrayContaining(['repos', 'attaque']));
      if (!nom.endsWith('-chat') || nom === 'spectre-chat') {
        expect(Object.keys(sprite.animations), nom).toEqual(expect.arrayContaining(['marche', 'blesse', 'mort']));
      }
    }
    expect(Object.keys(commite.sprites.charlie?.animations ?? {})).toContain('competence');
    for (const [nom, sprite] of Object.entries(commite.sprites)) {
      if (sprite.categorie === 'tour') expect(Object.keys(sprite.animations), nom).toEqual(['repos', 'attaque']);
    }
  });

  it('respecte les tailles prévues : 32×32 (tours hautes en 32×48, boss en 64×64), tuiles et icônes en 16×16', () => {
    for (const [nom, s] of Object.entries(commite.sprites)) {
      const taille = `${String(s.largeur)}×${String(s.hauteur)}`;
      if (s.categorie === 'tuile' || s.categorie === 'icone' || s.categorie === 'projectile') expect(taille, nom).toBe('16×16');
      else if (nom === 'boucher-vaudrelle') expect(taille).toBe('64×64');
      else if (s.categorie === 'tour') expect(['32×32', '32×48'], nom).toContain(taille);
      else if (s.categorie === 'unite' || s.categorie === 'ennemi') expect(taille, nom).toBe('32×32');
    }
  });

  it('place les tireurs des tours de tir', () => {
    for (const [nom, s] of Object.entries(commite.sprites)) {
      if (nom.startsWith('tour-tir')) expect(s.points?.tireur, nom).toBeDefined();
    }
  });
});
