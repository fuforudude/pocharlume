// Le cœur sert à autre chose que Pocharlume : un second adaptateur, au format `.pix`, passe par la même API.
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { traiter } from '../api.ts';
import type { ApercuSprite, DocumentSprite } from '../types.ts';
import { adaptateurPix } from './adaptateur-pix.ts';

let copie = '';
beforeEach(() => {
  copie = mkdtempSync(join(tmpdir(), 'pix-'));
  cpSync(join(import.meta.dirname, 'projet'), copie, { recursive: true });
});
afterEach(() => { rmSync(copie, { recursive: true, force: true }); });

const appeler = async (a: ReturnType<typeof adaptateurPix>, methode: string, chemin: string, corps: unknown = null): Promise<{ statut: number; corps: unknown }> => {
  const [route = '', requete = ''] = chemin.split('?');
  return traiter(a, methode, route, new URLSearchParams(requete), corps);
};

describe('adaptateur d\'exemple (.pix)', () => {
  it('liste, ouvre et joue les cadres', async () => {
    const a = adaptateurPix(copie);
    expect((await appeler(a, 'GET', '/api/info')).corps).toMatchObject({ sprites: true, palette: false, cartes: false });
    expect((await appeler(a, 'GET', '/api/sprites')).corps).toEqual([
      { id: 'gemme', nom: 'gemme', groupe: 'Sprites' },
      { id: 'slime', nom: 'slime', groupe: 'Sprites' },
    ]);
    const doc = (await appeler(a, 'GET', '/api/sprites/doc?id=slime')).corps as DocumentSprite;
    expect(doc.calques).toHaveLength(2);
    expect(doc.apercu.animations[0]?.cadres).toHaveLength(2);
  });

  it('un module absent donne 404', async () => {
    expect((await appeler(adaptateurPix(copie), 'GET', '/api/cartes')).statut).toBe(404);
  });

  it('un pixel changé ne modifie que sa ligne et l\'aperçu suit', async () => {
    const a = adaptateurPix(copie);
    const avant = readFileSync(join(copie, 'sprites', 'slime.pix'), 'utf8');
    const doc = (await appeler(a, 'GET', '/api/sprites/doc?id=slime')).corps as DocumentSprite;
    const lignes = [...(doc.calques[0]?.lignes ?? [])];
    lignes[0] = 'W.......';
    const apercu = (await appeler(a, 'POST', '/api/sprites/apercu', { id: 'slime', calques: { 0: lignes } })).corps as { apercu: ApercuSprite };
    expect(apercu.apercu.animations[0]?.cadres[0]?.image.rvba).not.toBe(doc.apercu.animations[0]?.cadres[0]?.image.rvba);
    const r = await appeler(a, 'POST', '/api/sprites/enregistrer', { id: 'slime', calques: { 0: lignes } });
    expect(r.statut).toBe(200);
    const apres = readFileSync(join(copie, 'sprites', 'slime.pix'), 'utf8');
    const l1 = avant.split('\n');
    const l2 = apres.split('\n');
    expect(l2).toHaveLength(l1.length);
    const differentes = l1.flatMap((l, i) => (l === l2[i] ? [] : [i]));
    expect(differentes).toHaveLength(1);
    expect(l2[differentes[0] ?? 0]).toBe('W.......');
  });

  it('refuse d\'écrire hors des dossiers permis', async () => {
    const a = { ...adaptateurPix(copie), ecriturePermise: ['autre/'] };
    const doc = (await appeler(a, 'GET', '/api/sprites/doc?id=slime')).corps as DocumentSprite;
    const r = await appeler(a, 'POST', '/api/sprites/enregistrer', { id: 'slime', calques: { 0: [...(doc.calques[0]?.lignes ?? []), 'W'] } });
    expect(r.statut).toBe(403);
  });
});
