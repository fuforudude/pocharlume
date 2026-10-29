// Tests de l'adaptateur Pocharlume : aller-retour sans perte des 66 fichiers de sprites, édition ciblée, aperçus qui
// suivent les retouches, palette, cartes et règles d'écriture.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lireSprites } from '../art/format.ts';
import { estPermis, normaliser } from '../atelier/chemins.ts';
import { remplacerGrilles, type BlocGrille } from '../atelier/ecriture-texte.ts';
import type { DocumentCarte, DocumentSprite } from '../atelier/types.ts';
import { ECRITURE_PERMISE, adaptateurPocharlume } from './adaptateur.ts';
import { charger, grillesDe, indexParNom } from './sources.ts';

const RACINE = join(import.meta.dirname, '..', '..');
const DOSSIER_SPRITES = join(RACINE, 'art', 'sprites');
const FICHIERS = readdirSync(DOSSIER_SPRITES).filter((f) => f.endsWith('.txt')).sort();
const a = adaptateurPocharlume(RACINE);

describe('sources de sprites : aller-retour sans perte', () => {
  it('compte les 66 fichiers de sprites', () => {
    expect(FICHIERS).toHaveLength(66);
  });

  it('réécrire toutes les grilles de chaque fichier avec leur propre contenu le laisse identique à l\'octet près', () => {
    for (const f of FICHIERS) {
      const texte = readFileSync(join(DOSSIER_SPRITES, f), 'utf8');
      const sprites = lireSprites(texte, `art/sprites/${f}`);
      const blocs = new Map<number, BlocGrille>();
      const lignesFichier = texte.split('\n').map((l) => l.replace(/\r$/, '').trim());
      for (const s of sprites) {
        for (const g of grillesDe(s, indexParNom(sprites))) {
          blocs.set(g.grille.ligneFichier, { debut: g.grille.ligneFichier, longueur: g.grille.lignes.length, lignes: g.grille.lignes });
          // La grille occupe bien des lignes contiguës du fichier : sinon l'édition ciblée toucherait autre chose.
          expect(lignesFichier.slice(g.grille.ligneFichier - 1, g.grille.ligneFichier - 1 + g.grille.lignes.length), `${f}:${String(g.grille.ligneFichier)}`).toEqual(g.grille.lignes);
        }
      }
      expect(remplacerGrilles(texte, [...blocs.values()]), f).toBe(texte);
    }
  });

  it('enregistrer sans rien changer (via l\'adaptateur) rend chaque fichier identique', async () => {
    const sources = charger(RACINE);
    const parNom = indexParNom(sources.sprites);
    for (const f of FICHIERS) {
      const fichier = `art/sprites/${f}`;
      const sprite = sources.sprites.find((s) => s.fichier === fichier);
      if (!sprite) continue;
      const modifs: Record<string, readonly string[]> = {};
      for (const g of grillesDe(sprite, parNom)) modifs[g.cle] = g.grille.lignes;
      const ecritures = await a.sprites?.enregistrer(sprite.nom, modifs);
      for (const e of ecritures ?? []) expect(e.contenu, e.chemin).toBe(readFileSync(join(RACINE, e.chemin), 'utf8'));
    }
  });

  it('la palette réécrite avec ses propres couleurs reste identique', async () => {
    const doc = await a.palette?.ouvrir('commune');
    const changements = Object.fromEntries((doc?.couleurs ?? []).map((c) => [c.lettre, c.couleur]));
    const [e] = (await a.palette?.enregistrer('commune', changements)) ?? [];
    expect(e?.contenu).toBe(readFileSync(join(RACINE, 'art', 'palettes', 'commune.txt'), 'utf8'));
  });
});

describe('édition d\'un sprite', () => {
  it('un pixel changé ne modifie qu\'une ligne du fichier, et l\'aperçu et les dérivés suivent', async () => {
    const doc = (await a.sprites?.ouvrir('paysan-affame')) as DocumentSprite;
    const calque = doc.calques[0];
    expect(calque).toBeDefined();
    const lettre = doc.palette.find((p) => p.lettre !== 'K')?.lettre ?? 'W';
    const lignes = [...(calque?.lignes ?? [])];
    lignes[0] = lettre + (lignes[0] ?? '').slice(1);
    const modifs = { [calque?.id ?? '']: lignes };

    const [e] = (await a.sprites?.enregistrer('paysan-affame', modifs)) ?? [];
    const avant = readFileSync(join(RACINE, e?.chemin ?? ''), 'utf8').split('\n');
    const apres = (e?.contenu ?? '').split('\n');
    expect(apres).toHaveLength(avant.length);
    expect(avant.filter((l, i) => l !== apres[i])).toHaveLength(1);

    const nouveau = await a.sprites?.apercu('paysan-affame', modifs);
    const meme = (x: string | undefined, y: string | undefined): boolean => x === y;
    expect(meme(nouveau?.apercu.animations[0]?.cadres[0]?.image.rvba, doc.apercu.animations[0]?.cadres[0]?.image.rvba)).toBe(false);
    expect(nouveau?.derives.map((d) => d.nom)).toContain('paysan-affame-elite');
  });

  it('refuse une grille inconnue', async () => {
    await expect((async () => a.sprites?.enregistrer('paysan-affame', { 'art/sprites/x.txt:1': ['a'] }))()).rejects.toThrow(/inconnue/);
  });
});

describe('palette', () => {
  it('compte les sprites concernés, avertit à partir du seuil et prévisualise tous les sprites touchés', async () => {
    const doc = await a.palette?.ouvrir('commune');
    const k = doc?.couleurs.find((c) => c.lettre === 'K');
    expect(k?.utilisations).toBeGreaterThanOrEqual(doc?.seuilAvertissement ?? Infinity);
    const vignettes = (await a.palette?.apercu('commune', { K: '#ff0000' })) ?? [];
    expect(vignettes.length).toBeGreaterThanOrEqual(k?.utilisations ?? Infinity);
    const sans = (await a.palette?.apercu('commune', {})) ?? [];
    expect(sans).toHaveLength(0);
  });

  it('ne change que la ligne de la lettre', async () => {
    const [e] = (await a.palette?.enregistrer('commune', { K: '#ff0000' })) ?? [];
    const avant = readFileSync(join(RACINE, 'art', 'palettes', 'commune.txt'), 'utf8').split('\n');
    const apres = (e?.contenu ?? '').split('\n');
    expect(avant.filter((l, i) => l !== apres[i])).toEqual(['K 2b2928  contour et ombre la plus sombre (pack)']);
    expect(apres.find((l) => l.startsWith('K '))).toBe('K ff0000  contour et ombre la plus sombre (pack)');
  });
});

describe('cartes', () => {
  it('les cartes du jeu s\'ouvrent sans erreur de règle, statue désactivée avec un message', async () => {
    for (const c of (await a.cartes?.lister()) ?? []) {
      const doc = (await a.cartes?.ouvrir(c.id)) as DocumentCarte;
      expect(doc.verification.erreurs, c.id).toEqual([]);
      expect(doc.objets.length).toBeGreaterThan(20);
    }
    const doc = (await a.cartes?.ouvrir('chaumes')) as DocumentCarte;
    const statue = doc.genres.find((g) => g.id === 'statue');
    expect(statue?.actif).toBe(false);
    expect(statue?.raison).toMatch(/statues\.ts/);
  });

  it('refuse un décor sur le chemin ou hors de la carte', async () => {
    const doc = (await a.cartes?.ouvrir('chaumes')) as DocumentCarte;
    const arbre = doc.objets.find((o) => o.libelle === 'arbre-mort-1') as DocumentCarte['objets'][number];
    // Le chemin 0 passe par (12, 4) : un arbre posé dessus est refusé.
    const surChemin = await a.cartes?.verifier('chaumes', { [arbre.id]: { x: 12, y: 8 } });
    expect(surChemin?.erreurs.some((e) => e.objet === arbre.id && /chemin/.test(e.message))).toBe(true);
    const dehors = await a.cartes?.verifier('chaumes', { [arbre.id]: { x: 40, y: 8 } });
    expect(dehors?.erreurs.some((e) => e.objet === arbre.id && /sortirait/.test(e.message))).toBe(true);
    await expect((async () => a.cartes?.enregistrer('chaumes', { [arbre.id]: { x: 12, y: 8 } }))()).rejects.toThrow(/refusée/);
  });

  it('un décor déplacé sur une case libre ne modifie qu\'une ligne du fichier et change le décompte des cases', async () => {
    const doc = (await a.cartes?.ouvrir('chaumes')) as DocumentCarte;
    const grand = doc.objets.find((o) => o.genre === 'grand-decor' && o.libelle === 'arbre-mort-1') as DocumentCarte['objets'][number];
    let trouve = false;
    // Cherche une position libre où l'arbre bloque d'autres cases que là où il est.
    for (let y = 3; y <= 17 && !trouve; y += 0.5) {
      for (let x = 1; x <= 31 && !trouve; x += 0.5) {
        const v = await a.cartes?.verifier('chaumes', { [grand.id]: { x, y } });
        if (v?.erreurs.length === 0 && v.bilan.some((l) => l.avant !== l.apres)) {
          trouve = true;
          const [e] = (await a.cartes?.enregistrer('chaumes', { [grand.id]: { x, y } })) ?? [];
          expect(e?.chemin).toBe('src/data/niveaux/cartes.ts');
          const avant = readFileSync(join(RACINE, e?.chemin ?? ''), 'utf8').split('\n');
          const apres = (e?.contenu ?? '').split('\n');
          expect(apres).toHaveLength(avant.length);
          const diff = avant.flatMap((l, i) => (l === apres[i] ? [] : [apres[i]]));
          expect(diff).toHaveLength(1);
          expect(diff[0]).toContain(`decor('arbre-mort-1', ${String(x)}, ${String(y)}`);
        }
      }
    }
    expect(trouve).toBe(true);
  });

  it('enregistrer sans déplacement ne change pas le fichier', async () => {
    const [e] = (await a.cartes?.enregistrer('sillons', {})) ?? [];
    expect(e?.contenu).toBe(readFileSync(join(RACINE, e?.chemin ?? ''), 'utf8'));
  });
});

describe('droits d\'écriture', () => {
  it('permet les sources graphiques et les fichiers de cartes, rien d\'autre', () => {
    for (const ok of ['art/sprites/charlie.txt', 'art/palettes/commune.txt', 'src/data/niveaux/cartes.ts', 'src/data/niveaux/cartes-region2.ts']) {
      expect(estPermis(normaliser(ok), ECRITURE_PERMISE), ok).toBe(true);
    }
    for (const non of ['src/engine/avancer.ts', 'src/data/niveaux/plan-region1.ts', 'src/data/niveaux/cartes-toutes.ts', 'package.json', 'tools/art/format.ts', 'public/sprites/atlas.png', 'artefact/x.txt']) {
      expect(estPermis(normaliser(non), ECRITURE_PERMISE), non).toBe(false);
    }
  });
});
