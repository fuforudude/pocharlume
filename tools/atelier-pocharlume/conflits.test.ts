// Écritures concurrentes : un enregistrement ne doit jamais écrire sur une autre grille ni annuler une modification
// externe du fichier. Les tests travaillent sur une copie des sources dans un dossier temporaire.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ecrireFichiers } from '../atelier/chemins.ts';
import { ErreurConflit, ErreurIntrouvable, ErreurRequete, type DocumentCarte, type DocumentSprite } from '../atelier/types.ts';
import { ECRITURE_PERMISE, adaptateurPocharlume } from './adaptateur.ts';

const SOURCE = join(import.meta.dirname, '..', '..');
let racine = '';

beforeEach(() => {
  racine = mkdtempSync(join(tmpdir(), 'pocharlume-'));
  cpSync(join(SOURCE, 'art'), join(racine, 'art'), { recursive: true });
  mkdirSync(join(racine, 'src', 'data', 'niveaux'), { recursive: true });
  for (const f of ['cartes.ts', 'cartes-region2.ts']) cpSync(join(SOURCE, 'src', 'data', 'niveaux', f), join(racine, 'src', 'data', 'niveaux', f));
});
afterEach(() => { rmSync(racine, { recursive: true, force: true }); });

const ecrire = (e: readonly { chemin: string; contenu: string }[] | undefined): void => { ecrireFichiers(racine, e ?? [], ECRITURE_PERMISE); };

describe('sprites : grille allongée puis nouvel enregistrement', () => {
  it('refuse d\'écrire avec les clés d\'avant l\'enregistrement et marche après réouverture', async () => {
    const a = adaptateurPocharlume(racine);
    const doc = (await a.sprites?.ouvrir('charlie-ancien')) as DocumentSprite;
    const tete = doc.calques.find((c) => c.nom === 'calque tete') as DocumentSprite['calques'][number];
    const corps = doc.calques.find((c) => c.nom === 'calque corps') as DocumentSprite['calques'][number];
    const allongee = [...tete.lignes, '.', '.', 'a'];
    ecrire(await a.sprites?.enregistrer('charlie-ancien', { [tete.id]: allongee }, { origine: { [tete.id]: tete.lignes }, empreinte: doc.empreinte }));

    const retouche = [...corps.lignes];
    retouche[0] = `a${(retouche[0] ?? '').slice(1)}`;
    // Le client qui n'a pas rechargé envoie encore les anciennes clés et l'ancienne empreinte.
    await expect((async () => a.sprites?.enregistrer('charlie-ancien', { [corps.id]: retouche }, { origine: { [corps.id]: corps.lignes }, empreinte: doc.empreinte }))()).rejects.toBeInstanceOf(ErreurConflit);
    await expect((async () => a.sprites?.apercu('charlie-ancien', { [corps.id]: retouche }, { [corps.id]: corps.lignes }))()).rejects.toBeInstanceOf(ErreurConflit);

    const neuf = (await a.sprites?.ouvrir('charlie-ancien')) as DocumentSprite;
    const corps2 = neuf.calques.find((c) => c.nom === 'calque corps') as DocumentSprite['calques'][number];
    const avant = readFileSync(join(racine, 'art', 'sprites', 'ancien-charlie.txt'), 'utf8').split('\n');
    const retouche2 = [...corps2.lignes];
    retouche2[0] = `a${(retouche2[0] ?? '').slice(1)}`;
    const [e] = (await a.sprites?.enregistrer('charlie-ancien', { [corps2.id]: retouche2 }, { origine: { [corps2.id]: corps2.lignes }, empreinte: neuf.empreinte })) ?? [];
    const apres = (e?.contenu ?? '').split('\n');
    expect(apres).toHaveLength(avant.length);
    expect(avant.filter((l, i) => l !== apres[i])).toHaveLength(1);
  });

  it('refuse un fichier modifié à la main entre l\'ouverture et l\'enregistrement', async () => {
    const a = adaptateurPocharlume(racine);
    const doc = (await a.sprites?.ouvrir('charlie-ancien')) as DocumentSprite;
    const calque = doc.calques[0] as DocumentSprite['calques'][number];
    const chemin = join(racine, 'art', 'sprites', 'ancien-charlie.txt');
    writeFileSync(chemin, `# ajout externe\n${readFileSync(chemin, 'utf8')}`);
    await expect((async () => a.sprites?.enregistrer('charlie-ancien', { [calque.id]: [...calque.lignes, 'a'] }, { origine: { [calque.id]: calque.lignes }, empreinte: doc.empreinte }))()).rejects.toBeInstanceOf(ErreurConflit);
  });

  it('refuse des lignes invalides (caractère, lettre inconnue, débordement du cadre)', async () => {
    const a = adaptateurPocharlume(racine);
    const doc = (await a.sprites?.ouvrir('charlie-ancien')) as DocumentSprite;
    const c = doc.calques[0] as DocumentSprite['calques'][number];
    const essai = async (lignes: string[]): Promise<unknown> => a.sprites?.enregistrer('charlie-ancien', { [c.id]: lignes }, { origine: { [c.id]: c.lignes }, empreinte: doc.empreinte });
    await expect(essai(['a b'])).rejects.toBeInstanceOf(ErreurRequete);
    await expect(essai(['#'])).rejects.toBeInstanceOf(ErreurRequete);
    await expect(essai(['!'])).rejects.toBeInstanceOf(ErreurRequete);
    await expect(essai(['.'.repeat(200)])).rejects.toBeInstanceOf(ErreurRequete);
    await expect(essai(Array.from({ length: 200 }, () => '.'))).rejects.toBeInstanceOf(ErreurRequete);
  });

  it('un id inconnu est un 404', async () => {
    const a = adaptateurPocharlume(racine);
    await expect((async () => a.sprites?.ouvrir('nexiste-pas'))()).rejects.toBeInstanceOf(ErreurIntrouvable);
    await expect((async () => a.cartes?.ouvrir('nexiste_pas'))()).rejects.toBeInstanceOf(ErreurIntrouvable);
    await expect((async () => a.palette?.ouvrir('nexiste-pas'))()).rejects.toBeInstanceOf(ErreurIntrouvable);
  });
});

describe('cartes : modification externe et décors identifiés par rang', () => {
  const deplacement = (doc: DocumentCarte, libelle: string): { id: string; depart: { x: number; y: number } } => {
    const o = doc.objets.find((x) => x.libelle === libelle) as DocumentCarte['objets'][number];
    return { id: o.id, depart: { x: o.x, y: o.y } };
  };

  it('refuse l\'enregistrement si le fichier a changé depuis l\'ouverture (décor inséré)', async () => {
    const a = adaptateurPocharlume(racine);
    const doc = (await a.cartes?.ouvrir('chaumes')) as DocumentCarte;
    const { id, depart } = deplacement(doc, 'tonneau');
    const chemin = join(racine, 'src', 'data', 'niveaux', 'cartes.ts');
    const texte = readFileSync(chemin, 'utf8');
    writeFileSync(chemin, texte.replace(/^(\s*)decor\('maison-ruine-1'/m, "$1decor('cailloux', 2, 2),\n$1decor('maison-ruine-1'"));
    await expect((async () => a.cartes?.enregistrer('chaumes', { [id]: { x: 10, y: 16.5, origine: { libelle: 'tonneau', ...depart } } }, doc.empreinte))()).rejects.toBeInstanceOf(ErreurConflit);
  });

  it('refuse un décor dont l\'origine annoncée n\'est pas celle du fichier, même avec la bonne empreinte', async () => {
    const a = adaptateurPocharlume(racine);
    const doc = (await a.cartes?.ouvrir('chaumes')) as DocumentCarte;
    const { id, depart } = deplacement(doc, 'tonneau');
    await expect((async () => a.cartes?.enregistrer('chaumes', { [id]: { x: 10, y: 16.5, origine: { libelle: 'puits', ...depart } } }, doc.empreinte))()).rejects.toBeInstanceOf(ErreurConflit);
  });

  it('n\'écrit que le décor déplacé, laisse le reste du fichier (même modifié avant l\'ouverture) intact', async () => {
    const a = adaptateurPocharlume(racine);
    const chemin = join(racine, 'src', 'data', 'niveaux', 'cartes.ts');
    writeFileSync(chemin, readFileSync(chemin, 'utf8').replace('decor(\'croix\', 2, 8)', 'decor(\'croix\', 2.5, 8)'));
    const doc = (await a.cartes?.ouvrir('chaumes')) as DocumentCarte;
    const { id, depart } = deplacement(doc, 'tonneau');
    const [e] = (await a.cartes?.enregistrer('chaumes', { [id]: { x: 10, y: 16.5, origine: { libelle: 'tonneau', ...depart } } }, doc.empreinte)) ?? [];
    const avant = readFileSync(chemin, 'utf8').split('\n');
    const apres = (e?.contenu ?? '').split('\n');
    expect(avant.filter((l, i) => l !== apres[i])).toHaveLength(1);
  });
});
