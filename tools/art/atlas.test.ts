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

  it('contient les sprites du jalon 2', () => {
    const heros = ['plume', 'suie', 'corbeau', 'mastoc', 'brise-os', 'pollen', 'rouage', 'lanterne'];
    const attendus = [
      // Les 9 héros : Charlie garde son nom historique `charlie`, les 8 autres sont `heros-<id avec des tirets>`.
      ...heros.map((h) => `heros-${h}`),
      'tour-sanctuaire', 'tour-atelier', 'assassin-ombre', 'tourelle-atelier', 'piege',
      'effet-voile-nuit', 'effet-voile-nuit-tuile', 'effet-griffes', 'effet-ingeniosite', 'effet-soufre', 'effet-sabbat',
      'effet-sablier', 'effet-gel', 'effet-soin', 'effet-rage', 'effet-execution', 'effet-ombre',
      'icone-voile-nuit', 'icone-griffes-ombre', 'icone-pieges-ressort', 'icone-ingeniosite',
      'icone-fiole-soufre', 'icone-herbe-sabbat', 'icone-griffe-renfort', 'icone-sablier',
      ...['caserne', 'tir', 'magie', 'artillerie', 'sorts', 'heros'].map((b) => `icone-branche-${b}`),
      'icone-competence', 'icone-dieu-plume', 'icone-dieu-charlie', 'icone-dieu-pollen', 'icone-cadenas',
      ...[...heros, 'charlie'].map((h) => `icone-portrait-${h}`),
    ];
    expect(attendus.filter((n) => !(n in commite.sprites))).toEqual([]);
  });

  it('donne aux 9 héros les six animations jouées en partie', () => {
    for (const nom of ['charlie', ...['plume', 'suie', 'corbeau', 'mastoc', 'brise-os', 'pollen', 'rouage', 'lanterne'].map((h) => `heros-${h}`)]) {
      expect(Object.keys(commite.sprites[nom]?.animations ?? {}), nom)
        .toEqual(expect.arrayContaining(['repos', 'marche', 'attaque', 'competence', 'blesse', 'mort']));
    }
  });

  it('donne à la tourelle et au piège les animations de leur cycle de vie', () => {
    expect(Object.keys(commite.sprites['tourelle-atelier']?.animations ?? {}))
      .toEqual(expect.arrayContaining(['repos', 'attaque', 'apparition', 'destruction']));
    expect(Object.keys(commite.sprites.piege?.animations ?? {})).toEqual(['repos', 'declenche']);
    expect(commite.sprites['tourelle-atelier']?.points?.tir).toBeDefined();
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
    // La tourelle de l'Atelier Boiteux sort de terre et se disloque : deux animations de plus que les autres tours.
    const sansCycleDeVie = (nom: string): boolean => nom !== 'tourelle-atelier';
    for (const [nom, sprite] of Object.entries(commite.sprites)) {
      if (sprite.categorie === 'tour' && sansCycleDeVie(nom)) expect(Object.keys(sprite.animations), nom).toEqual(['repos', 'attaque']);
    }
  });

  it('respecte les tailles prévues : 32×32 (tours hautes en 32×48, boss en 64×64), tuiles et icônes en 16×16 (portraits en 24×24)', () => {
    for (const [nom, s] of Object.entries(commite.sprites)) {
      const taille = `${String(s.largeur)}×${String(s.hauteur)}`;
      if (nom.startsWith('icone-portrait-')) expect(taille, nom).toBe('24×24');
      else if (s.categorie === 'tuile' || s.categorie === 'icone' || s.categorie === 'projectile') expect(taille, nom).toBe('16×16');
      else if (nom === 'boucher-vaudrelle') expect(taille).toBe('64×64');
      else if (s.categorie === 'tour') expect(['32×32', '32×48'], nom).toContain(taille);
      else if (nom === 'piege') expect(taille).toBe('16×16');
      else if (s.categorie === 'unite' || s.categorie === 'ennemi') expect(taille, nom).toBe('32×32');
    }
  });

  it('place les tireurs des tours de tir', () => {
    for (const [nom, s] of Object.entries(commite.sprites)) {
      if (nom.startsWith('tour-tir')) expect(s.points?.tireur, nom).toBeDefined();
    }
  });
});
