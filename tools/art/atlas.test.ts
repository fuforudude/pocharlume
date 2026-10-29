// Garde-fou du pipeline graphique : l'atlas commité doit être exactement celui que produisent les sources,
// et il doit contenir tout ce que le rendu attend.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { AtlasJson } from './atlas.ts';
import { construire, DOSSIER_SORTIE, lireSources, type Construction } from './construire.ts';
import { decoderPng } from './png.ts';

/** Les cinq boss des régions 1 à 5 : cadres de 64×64. */
const BOSS = ['boucher-vaudrelle', 'la-faim', 'juge-flammes', 'dame-puits', 'mere-rats', 'roi-fosses', 'prince-croise', 'grand-inquisiteur', 'roi-fou', 'soleil-bleme'];

let resultat: Construction;
let commite: AtlasJson;

// Construire l'atlas complet prend plusieurs secondes, davantage quand la machine est chargée.
beforeAll(() => {
  resultat = construire();
  commite = JSON.parse(readFileSync(join(DOSSIER_SORTIE, 'atlas.json'), 'utf8')) as AtlasJson;
}, 60_000);

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

  describe('jalon 3 (index : art/sprites/jalon3-noms.txt)', () => {
    const ENNEMIS_J3 = ['glaneur', 'corbeau-noir', 'epouvantail', 'porteur-torche', 'chasseur-sorcieres', 'delateur', 'noyeur',
      'pelerin-voile', 'sangsue', 'rat-peste', 'pestifere', 'medecin-peste',
      // Les trois ennemis de la région 1 n'avaient pas d'élite dessinée : le jalon 3 leur en donne une (directive `sombre`).
      'paysan-affame', 'mendiant', 'chien-errant'];
    const FAMILIERS = ['rat', 'crapaud', 'chouette', 'chauve-souris', 'luciole', 'lezard', 'araignee', 'corneille', 'furet', 'escargot',
      'papillon-nuit', 'salamandre'];
    const BASES_TUILES = ['herbe-1', 'herbe-2', 'herbe-3', 'chemin-1', 'chemin-2', 'boue-1', 'boue-2', 'paves-1', 'paves-2',
      ...['n', 'e', 's', 'o'].map((c) => `chemin-bord-${c}`),
      ...['no', 'ne', 'se', 'so'].flatMap((c) => [`chemin-coin-ext-${c}`, `chemin-coin-int-${c}`])];
    const DECORS_J3 = ['arbre-calcine-1', 'arbre-calcine-2', 'meule-brulee', 'chariot-brise', 'gerbes-brulees', 'sillon', 'fourche-brisee',
      'souche-calcinee', 'bucher-braises', 'echafaud', 'maison-brulee-1', 'maison-brulee-2', 'cendres', 'fagots', 'torche-fichee',
      'cloche-fendue', 'saule-marais-1', 'saule-marais-2', 'barque-echouee', 'puits-noir', 'roseaux', 'nenuphars', 'souche-moussue',
      'feu-follet', 'maison-condamnee-1', 'maison-condamnee-2', 'charrette-linceuls', 'fosse-commune', 'croix-rouge', 'linceul',
      'lanterne-peste', 'tas-ossements'];

    it('contient les 12 ennemis, leurs élites, les 4 boss, les effets, les icônes, les familiers, les tuiles et le décor', () => {
      const attendus = [
        ...ENNEMIS_J3, ...ENNEMIS_J3.map((n) => `${n}-elite`),
        'la-faim', 'juge-flammes', 'dame-puits', 'mere-rats',
        'effet-nuage-toxique', 'effet-brulure', 'effet-tour-feu', 'effet-tour-affamee', 'effet-plongee',
        'icone-caisse-skins', 'icone-caisse-familiers', 'icone-eclat', 'icone-defi-heroique', 'icone-defi-fer',
        ...['commun', 'rare', 'epique', 'legendaire', 'mythique'].map((r) => `icone-rarete-${r}`),
        ...FAMILIERS.map((f) => `familier-${f}`),
        ...[2, 3, 4, 5].flatMap((r) => BASES_TUILES.map((b) => `r${String(r)}-${b}`)),
        ...DECORS_J3,
      ];
      expect(attendus.filter((n) => !(n in commite.sprites))).toEqual([]);
    });

    it('donne à chaque ennemi et à chaque boss les animations du rendu, et à chaque élite celles de son ennemi, cadre pour cadre', () => {
      for (const nom of [...ENNEMIS_J3, ...BOSS.slice(1)]) {
        expect(Object.keys(commite.sprites[nom]?.animations ?? {}), nom).toEqual(expect.arrayContaining(['repos', 'marche', 'attaque', 'blesse', 'mort']));
      }
      for (const nom of ENNEMIS_J3) {
        const base = commite.sprites[nom];
        const elite = commite.sprites[`${nom}-elite`];
        expect(elite?.categorie, nom).toBe('ennemi');
        expect(Object.keys(elite?.animations ?? {}), nom).toEqual(Object.keys(base?.animations ?? {}));
        for (const [anim, a] of Object.entries(base?.animations ?? {})) {
          expect(elite?.animations[anim]?.cadres.length, `${nom}-elite/${anim}`).toBe(a.cadres.length);
          expect(elite?.animations[anim]?.boucle, `${nom}-elite/${anim}`).toBe(a.boucle);
        }
      }
    });

    it('rend l’élite plus sombre que l’ennemi : même silhouette, pixels plus foncés, un peu de rouge pour les yeux', () => {
      const image = decoderPng(readFileSync(join(DOSSIER_SORTIE, 'atlas.png')));
      const luminance = (c: { x: number; y: number; largeur: number; hauteur: number }): number => {
        let somme = 0;
        let n = 0;
        for (let y = c.y; y < c.y + c.hauteur; y++) {
          for (let x = c.x; x < c.x + c.largeur; x++) {
            const i = (y * image.largeur + x) * 4;
            if ((image.pixels[i + 3] ?? 0) === 0) continue;
            somme += ((image.pixels[i] ?? 0) + (image.pixels[i + 1] ?? 0) + (image.pixels[i + 2] ?? 0)) / 3;
            n++;
          }
        }
        return somme / n;
      };
      for (const nom of ENNEMIS_J3) {
        const base = commite.sprites[nom]?.animations.repos?.cadres[0];
        const elite = commite.sprites[`${nom}-elite`]?.animations.repos?.cadres[0];
        expect(base && elite, nom).toBeTruthy();
        if (!base || !elite) continue;
        expect(elite.largeur, nom).toBe(base.largeur);
        expect(elite.hauteur, nom).toBe(base.hauteur);
        expect(luminance(elite), nom).toBeLessThan(luminance(base) * 0.85);
      }
    });

    it('donne à chaque familier une animation d’attente en boucle de plusieurs cadres, en 16×16', () => {
      for (const f of FAMILIERS) {
        const s = commite.sprites[`familier-${f}`];
        expect(`${String(s?.largeur)}×${String(s?.hauteur)}`, f).toBe('16×16');
        expect(s?.animations.repos?.boucle, f).toBe(true);
        expect(s?.animations.repos?.cadres.length, f).toBeGreaterThanOrEqual(2);
      }
    });

    it('fait la plongée de la Dame du Puits en deux animations jouées une fois, et la relève de l’épouvantail une fois', () => {
      expect(commite.sprites['dame-puits']?.animations.plonge?.boucle).toBe(false);
      expect(commite.sprites['dame-puits']?.animations.emerge?.boucle).toBe(false);
      expect(commite.sprites.epouvantail?.animations.releve?.boucle).toBe(false);
    });

    it('fait des effets sans contour dont `repos` boucle et `impact` est joué une fois', () => {
      for (const nom of ['effet-nuage-toxique', 'effet-brulure', 'effet-tour-feu', 'effet-tour-affamee', 'effet-plongee']) {
        const s = commite.sprites[nom];
        expect(s?.categorie, nom).toBe('effet');
        expect(s?.sansContour, nom).toBeUndefined();
        expect(s?.animations.repos?.boucle, nom).toBe(true);
        if (s?.animations.impact) expect(s.animations.impact.boucle, nom).toBe(false);
      }
      expect(commite.sprites['effet-nuage-toxique']?.animations.impact).toBeDefined();
      expect(commite.sprites['effet-plongee']?.animations.impact).toBeDefined();
    });

    it('garde l’atlas raisonnable (planche sous 1 Mo et moins de 2 048 px de haut : taille de texture sûre sur mobile)', () => {
      expect(resultat.png.length).toBeLessThan(1024 * 1024);
      expect(resultat.image.hauteur).toBeLessThan(2048);
    });

    it('jalon 4 : sprites des régions 6 à 10 (14 ennemis et leurs élites, 5 boss), tuiles et décor, sans l’illustration de fin (hors atlas)', () => {
      const ennemis = ['fossoyeur', 'creux', 'chauve-souris', 'fantassin', 'porte-banniere', 'cavalier', 'flagellant', 'inquisiteur', 'exorciste',
        'garde-royal', 'arbaletrier-elite', 'chevalier', 'acolyte-cendre', 'ange-cendre'];
      for (const nom of ennemis) {
        for (const n of [nom, `${nom}-elite`]) {
          expect(commite.sprites[n]?.categorie, n).toBe('ennemi');
          expect(Object.keys(commite.sprites[n]?.animations ?? {}), n).toEqual(expect.arrayContaining(['repos', 'marche', 'attaque', 'blesse', 'mort']));
        }
      }
      for (const nom of BOSS.slice(5)) expect(commite.sprites[nom]?.categorie, nom).toBe('ennemi');
      for (const r of [6, 7, 8, 9, 10]) expect(Object.keys(commite.sprites).filter((n) => n.startsWith(`r${String(r)}-`)), String(r)).toHaveLength(21);
      expect(commite.sprites['fin-campagne']).toBeUndefined();
    });
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
      else if (BOSS.includes(nom)) expect(taille, nom).toBe('64×64');
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
