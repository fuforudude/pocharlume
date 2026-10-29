// La statue des cartes dans l'atelier : lue dans src/data/niveaux/statues.ts, déplacée selon les règles de
// src/data/niveaux/statues.test.ts (refaites ici à part, comme le fait ce test, pour juger l'adaptateur), réécrite sans perte.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { caseExiste, estCaseDeChemin, estCaseInterdite } from '../../src/engine/grille';
import { REGLES } from '../../src/data/regles';
import { CAMPAGNE } from '../../src/data/niveaux/campagne';
import { CARTES, type IdCarte } from '../../src/data/niveaux/cartes-toutes';
import { rectsSeChevauchent } from '../../src/data/niveaux/geometrie';
import { tuilesDeChemin } from '../../src/data/niveaux/grille-niveau';
import { empriseDecor, GRANDS_DECORS } from '../../src/data/niveaux/habillage';
import { PLANS_REGIONS } from '../../src/data/niveaux/plans';
import { SPRITE_STATUE, STATUES } from '../../src/data/niveaux/statues';
import { ecrireFichiers, ErreurChemin } from '../atelier/chemins.ts';
import { ErreurConflit, type DocumentCarte, type Ecriture } from '../atelier/types.ts';
import { ECRITURE_PERMISE, adaptateurPocharlume } from './adaptateur.ts';

const SOURCE = join(import.meta.dirname, '..', '..');
const STATUES_TS = 'src/data/niveaux/statues.ts';
const TAILLE = REGLES.tailleCase;
const PLANS = PLANS_REGIONS.flat();
const a = adaptateurPocharlume(SOURCE);

/** Les règles de src/data/niveaux/statues.test.ts pour une statue posée en (x, y) sur la carte `id`, décors du fichier. */
function permiseParLesTests(id: IdCarte, x: number, y: number): boolean {
  const niveaux = CAMPAGNE.filter((n) => PLANS[n.numero - 1]?.carte === id);
  if (niveaux.length === 0) throw new Error(`aucun niveau sur ${id}`);
  const statue = STATUES[id];
  return niveaux.every((n) => {
    const carte = n.niveau.carte;
    const emprise = empriseDecor({ sprite: 'statue', x, y });
    if (!(emprise.x0 >= 0 && emprise.y0 >= 0 && emprise.x1 <= carte.largeur && emprise.y1 <= carte.hauteur)) return false;
    const cx = Math.floor(x / TAILLE);
    const cy = Math.floor((y - 0.5) / TAILLE);
    if (!(Math.floor(emprise.x0 / TAILLE) === cx && Math.floor((emprise.x1 - 1e-9) / TAILLE) === cx)) return false;
    if (!(Math.floor(emprise.y0 / TAILLE) === cy && Math.floor((emprise.y1 - 1e-9) / TAILLE) === cy)) return false;
    if (!caseExiste(carte, cx, cy) || estCaseDeChemin(carte, cx, cy)) return false;
    const masque = tuilesDeChemin(carte);
    for (let dy = 0; dy < TAILLE; dy++) {
      for (let dx = 0; dx < TAILLE; dx++) if (masque[(cy * TAILLE + dy) * carte.largeur + cx * TAILLE + dx] !== 0) return false;
    }
    if (!estCaseInterdite(n.niveau, cx, cy)) return false;
    // Les décors du niveau, sans la statue d'origine (le dernier, ajouté par l'assemblage).
    const decors = n.visuel.decor.filter((d) => !(d.sprite === SPRITE_STATUE[statue.origine] && d.x === statue.x && d.y === statue.y));
    return decors.every((d) => !rectsSeChevauchent(emprise, empriseDecor(d)));
  });
}

async function ouvrir(id: string, adaptateur = a): Promise<DocumentCarte> {
  return (await adaptateur.cartes?.ouvrir(id)) as DocumentCarte;
}

/** Enregistre la statue déplacée comme le fait l'interface : position d'origine et empreinte de l'ouverture. */
async function sauverStatue(id: string, x: number, y: number, adaptateur = a): Promise<readonly Ecriture[]> {
  const doc = await ouvrir(id, adaptateur);
  const s = doc.objets.find((o) => o.id === 'statue');
  if (!s) throw new Error(`pas de statue sur ${id}`);
  return (await adaptateur.cartes?.enregistrer(id, { statue: { x, y, origine: { libelle: s.libelle, x: s.x, y: s.y } } }, doc.empreinte)) ?? [];
}

const erreursStatue = async (id: string, x: number, y: number): Promise<string[]> =>
  ((await a.cartes?.verifier(id, { statue: { x, y } }))?.erreurs ?? []).filter((e) => e.objet === 'statue').map((e) => e.message);

/** Les positions du pied au demi-tuile où le sprite tient dans une seule case : 3 colonnes × 2 lignes par case de la grille. */
function piedsDesCases(id: IdCarte): { x: number; y: number }[] {
  const c = CARTES[id];
  const sortie: { x: number; y: number }[] = [];
  for (let cy = 0; cy < c.hauteur / TAILLE; cy++) {
    for (let cx = 0; cx < c.largeur / TAILLE; cx++) {
      for (const dy of [1, 1.5]) for (const dx of [0.5, 1, 1.5]) sortie.push({ x: cx * TAILLE + dx, y: cy * TAILLE + dy });
    }
  }
  return sortie;
}

/** Une autre position valide pour la statue de la carte (selon les tests du jeu). */
function autrePositionValide(id: IdCarte): { x: number; y: number } {
  const p = piedsDesCases(id).find((c) => permiseParLesTests(id, c.x, c.y) && (c.x !== STATUES[id].x || c.y !== STATUES[id].y));
  if (!p) throw new Error(`aucune autre position valide sur ${id}`);
  return p;
}

describe('statue : lecture', () => {
  it('chaque carte montre sa statue, active, à sa position, avec le sprite de son origine et l\'emprise d\'un petit décor', async () => {
    for (const id of Object.keys(CARTES) as IdCarte[]) {
      const doc = await ouvrir(id);
      const genre = doc.genres.find((g) => g.id === 'statue');
      expect(genre?.actif, id).toBe(true);
      const statues = doc.objets.filter((o) => o.genre === 'statue');
      expect(statues, id).toHaveLength(1);
      expect(statues[0], id).toEqual({ id: 'statue', genre: 'statue', libelle: SPRITE_STATUE[STATUES[id].origine], x: STATUES[id].x, y: STATUES[id].y, emprise: { gauche: 0.5, haut: 0.9375, droite: 0.5, bas: 0.0625 } });
      expect(doc.verification.erreurs, id).toEqual([]);
    }
  });
});

describe('statue : déplacement selon les règles de statues.test.ts', () => {
  for (const id of ['chaumes', 'nef'] as const) {
    it(`${id} : sur chaque case, l'atelier accepte la statue exactement là où les tests l'acceptent`, async () => {
      const refus = new Set<string>();
      let acceptees = 0;
      for (const { x, y } of piedsDesCases(id)) {
        const erreurs = await erreursStatue(id, x, y);
        expect(erreurs.length === 0, `${id} (${String(x)}, ${String(y)}) : ${erreurs.join(' ; ')}`).toBe(permiseParLesTests(id, x, y));
        if (erreurs.length === 0) acceptees++;
        for (const e of erreurs) refus.add(/chemin/.test(e) ? 'chemin' : /constructible/.test(e) ? 'constructible' : /recouvrirait/.test(e) ? 'occupée' : e);
      }
      expect(acceptees).toBeGreaterThan(0);
      expect([...refus].sort()).toEqual(['chemin', 'constructible', 'occupée']);
    });
  }

  it('refuse une statue hors de la carte ou à cheval sur deux cases, avec un message', async () => {
    expect((await erreursStatue('chaumes', -2, 7)).join()).toMatch(/sortirait de la carte/);
    expect((await erreursStatue('chaumes', 19, 40)).join()).toMatch(/sortirait de la carte/);
    // x pair : le sprite (1 tuile de large) déborde sur la case voisine ; y = 8 : le pied est sur la ligne de la grille.
    expect((await erreursStatue('chaumes', 20, 7)).join()).toMatch(/à cheval sur deux cases/);
    expect((await erreursStatue('chaumes', 19, 8)).join()).toMatch(/à cheval sur deux cases/);
  });

  it('les messages nomment la statue, sa position et les niveaux concernés', async () => {
    const chemin = piedsDesCases('chaumes').find((p) => !permiseParLesTests('chaumes', p.x, p.y));
    if (!chemin) throw new Error('aucune position refusée');
    const [message] = await erreursStatue('chaumes', chemin.x, chemin.y);
    expect(message).toMatch(new RegExp(`^Statue \\(statue-colosse\\) en \\(${String(chemin.x)}, ${String(chemin.y)}\\) .*\\(niveaux? [0-9, ]+\\)$`));
  });

  it('un décor posé sur la statue est refusé, et c\'est au décor que l\'erreur revient', async () => {
    const doc = await ouvrir('chaumes');
    const petit = doc.objets.find((o) => o.genre === 'decor') as DocumentCarte['objets'][number];
    const v = await a.cartes?.verifier('chaumes', { [petit.id]: { x: STATUES.chaumes.x, y: STATUES.chaumes.y } });
    expect(v?.erreurs.some((e) => e.objet === petit.id && /^Statue .*recouvrirait/.test(e.message))).toBe(true);
    expect(v?.erreurs.some((e) => e.objet === 'statue')).toBe(false);
  });

  it('retirer le grand décor qui interdit la case de la statue est refusé (la case deviendrait constructible)', async () => {
    let trouve = false;
    for (const id of Object.keys(CARTES) as IdCarte[]) {
      const doc = await ouvrir(id);
      for (const g of doc.objets.filter((o) => o.genre === 'grand-decor')) {
        const v = await a.cartes?.verifier(id, { [g.id]: { x: 100, y: 100 } });
        if (v?.erreurs.some((e) => e.objet === g.id && /^Statue .*constructible/.test(e.message))) { trouve = true; break; }
      }
      if (trouve) break;
    }
    expect(trouve).toBe(true);
  });

  it('enregistrer une statue mal placée est refusé', async () => {
    await expect(sauverStatue('chaumes', 20, 7)).rejects.toThrow(/refusée.*à cheval/);
  });
});

describe('statue : écriture sans perte', () => {
  it('seule la ligne de la carte change dans statues.ts, positions écrites sans reste de calcul', async () => {
    const cible = autrePositionValide('chaumes');
    const ecritures = await sauverStatue('chaumes', cible.x + 1e-9, cible.y - 1e-9);
    const statues = ecritures.find((e) => e.chemin === STATUES_TS);
    expect(statues).toBeDefined();
    // Le fichier de la carte n'est pas modifié (rien n'est écrit s'il est identique).
    for (const e of ecritures.filter((x) => x.chemin !== STATUES_TS)) expect(e.contenu).toBe(readFileSync(join(SOURCE, e.chemin), 'utf8'));
    const avant = readFileSync(join(SOURCE, STATUES_TS), 'utf8').split('\n');
    const apres = (statues?.contenu ?? '').split('\n');
    expect(apres).toHaveLength(avant.length);
    const changees = avant.flatMap((l, i) => (l === apres[i] ? [] : [i]));
    expect(changees).toHaveLength(1);
    const i = changees[0] ?? 0;
    expect(apres[i]).toBe((avant[i] ?? '').replace('x: 19, y: 7', `x: ${String(cible.x)}, y: ${String(cible.y)}`));
  });

  it('enregistrer la statue à sa place rend statues.ts identique à l\'octet près, sur toutes les cartes', async () => {
    const texte = readFileSync(join(SOURCE, STATUES_TS), 'utf8');
    for (const id of Object.keys(CARTES) as IdCarte[]) {
      const ecritures = await sauverStatue(id, STATUES[id].x, STATUES[id].y);
      expect(ecritures.find((e) => e.chemin === STATUES_TS)?.contenu, id).toBe(texte);
    }
  });
});

describe('statue : modification externe et droits d\'écriture', () => {
  let racine = '';
  beforeEach(() => {
    racine = mkdtempSync(join(tmpdir(), 'pocharlume-statues-'));
    mkdirSync(join(racine, 'src', 'data', 'niveaux'), { recursive: true });
    for (const f of ['cartes.ts', 'statues.ts']) cpSync(join(SOURCE, 'src', 'data', 'niveaux', f), join(racine, 'src', 'data', 'niveaux', f));
  });
  afterEach(() => { rmSync(racine, { recursive: true, force: true }); });

  const cible = (): { x: number; y: number } => autrePositionValide('chaumes');

  it('refuse (409) si statues.ts ou le fichier de la carte a changé depuis l\'ouverture', async () => {
    for (const [fichier, avant, apres] of [['statues.ts', "gue: { x: 3.5", "gue: { x: 2.5"], ['cartes.ts', "decor('croix', 2, 8)", "decor('croix', 2.5, 8)"]] as const) {
      const ad = adaptateurPocharlume(racine);
      const doc = await ouvrir('chaumes', ad);
      const chemin = join(racine, 'src', 'data', 'niveaux', fichier);
      const texte = readFileSync(chemin, 'utf8');
      expect(texte, fichier).toContain(avant);
      writeFileSync(chemin, texte.replace(avant, apres));
      const { x, y } = cible();
      await expect((async () => ad.cartes?.enregistrer('chaumes', { statue: { x, y, origine: { libelle: 'statue-colosse', x: 19, y: 7 } } }, doc.empreinte))(), fichier).rejects.toBeInstanceOf(ErreurConflit);
      writeFileSync(chemin, texte);
    }
  });

  it('refuse (409) une statue dont l\'origine annoncée n\'est pas celle du fichier', async () => {
    const ad = adaptateurPocharlume(racine);
    const doc = await ouvrir('chaumes', ad);
    const { x, y } = cible();
    for (const origine of [{ libelle: 'statue-ombre', x: 19, y: 7 }, { libelle: 'statue-colosse', x: 19.5, y: 7 }]) {
      await expect((async () => ad.cartes?.enregistrer('chaumes', { statue: { x, y, origine } }, doc.empreinte))()).rejects.toBeInstanceOf(ErreurConflit);
    }
  });

  it('écrit la statue sur disque sans toucher au reste du fichier (fins de ligne comprises)', async () => {
    const ad = adaptateurPocharlume(racine);
    const chemin = join(racine, 'src', 'data', 'niveaux', 'statues.ts');
    const avant = readFileSync(chemin, 'utf8');
    const { x, y } = cible();
    const ecrits = ecrireFichiers(racine, await sauverStatue('chaumes', x, y, ad), ECRITURE_PERMISE);
    expect(ecrits).toEqual([STATUES_TS]);
    const lignesAvant = avant.split('\n');
    const lignesApres = readFileSync(chemin, 'utf8').split('\n');
    expect(lignesApres).toHaveLength(lignesAvant.length);
    expect(lignesAvant.filter((l, i) => l !== lignesApres[i])).toEqual([lignesAvant.find((l) => l.includes('chaumes: {'))]);
    expect(lignesApres.find((l) => l.includes('chaumes: {'))).toMatch(new RegExp(`^  chaumes: \\{ x: ${String(x)}, y: ${String(y)}, origine: 'colosse' \\},${avant.includes('\r\n') ? '\\r' : ''}$`));
  });

  it('le cœur refuse d\'écrire tout autre fichier de statues', () => {
    for (const chemin of ['src/data/niveaux/statues.test.ts', 'src/data/niveaux/statues2.ts', 'src/data/statues.ts']) {
      expect(() => ecrireFichiers(racine, [{ chemin, contenu: 'x' }], ECRITURE_PERMISE), chemin).toThrow(ErreurChemin);
    }
  });

  it('sans statues.ts, la statue est montrée désactivée avec un message et les décors restent modifiables', async () => {
    rmSync(join(racine, 'src', 'data', 'niveaux', 'statues.ts'));
    const ad = adaptateurPocharlume(racine);
    const doc = await ouvrir('chaumes', ad);
    const genre = doc.genres.find((g) => g.id === 'statue');
    expect(genre?.actif).toBe(false);
    expect(genre?.raison).toMatch(/statues\.ts/);
    expect(doc.objets.some((o) => o.genre === 'statue')).toBe(false);
    const tonneau = doc.objets.find((o) => o.libelle === 'tonneau') as DocumentCarte['objets'][number];
    const [e] = (await ad.cartes?.enregistrer('chaumes', { [tonneau.id]: { x: 10, y: 16.5, origine: { libelle: 'tonneau', x: tonneau.x, y: tonneau.y } } }, doc.empreinte)) ?? [];
    expect(e?.chemin).toBe('src/data/niveaux/cartes.ts');
  });
});

it('les statues ne sont pas de grands décors (emprise d\'une case)', () => {
  for (const s of Object.values(SPRITE_STATUE)) expect(GRANDS_DECORS.has(s)).toBe(false);
});
