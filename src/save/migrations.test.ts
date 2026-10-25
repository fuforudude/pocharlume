import { describe, expect, it } from 'vitest';
import { FIXTURE_V1, sauvegardeRemplie, variante } from './aides.test-utils';
import { VERSION_SAUVEGARDE } from './format';
import { MIGRATIONS, migrer } from './migrations';

describe('migrations de format', () => {
  it('la fixture v1 figée est bien une sauvegarde en version 1', () => {
    expect((JSON.parse(FIXTURE_V1) as { version: number }).version).toBe(1);
  });

  it('migre la sauvegarde v1 figée vers la version courante, valeur par valeur', () => {
    const r = migrer(JSON.parse(FIXTURE_V1));
    if (!r.ok) throw new Error(r.raison);
    expect(r.depuis).toBe(1);
    expect(r.sauvegarde).toEqual({
      version: VERSION_SAUVEGARDE,
      progression: {
        niveauMax: 4,
        // Les étoiles de la v1, sans difficulté, deviennent celles de Matou.
        etoiles: { '1': { matou: 3 }, '2': { matou: 2 }, '3': { matou: 1 } },
      },
      // Les volumes passent de fractions à des pourcentages ; la vitesse par défaut est ×1.
      reglages: { son: 50, musique: 25, vitesse: 1 },
      // La partie en cours de la v1 ne se rejoue pas avec les données de la v2 : abandonnée.
      partie: null,
    });
  });

  it('ne modifie pas l’objet qu’on lui donne', () => {
    const brut = JSON.parse(FIXTURE_V1) as unknown;
    migrer(brut);
    expect(brut).toEqual(JSON.parse(FIXTURE_V1));
  });

  it('une sauvegarde déjà à jour passe telle quelle', () => {
    const s = sauvegardeRemplie();
    const r = migrer(JSON.parse(JSON.stringify(s)));
    expect(r.ok && r.depuis).toBe(VERSION_SAUVEGARDE);
    expect(r.ok && r.sauvegarde).toEqual(s);
  });

  it('chaque version avant la courante a sa migration, enchaînées une à une', () => {
    for (let v = 1; v < VERSION_SAUVEGARDE; v++) expect(typeof MIGRATIONS[v]).toBe('function');
    expect(Object.keys(MIGRATIONS).map(Number).sort((a, b) => a - b)).toEqual(Array.from({ length: VERSION_SAUVEGARDE - 1 }, (_, i) => i + 1));
  });

  it('refuse une sauvegarde plus récente que le jeu, sans la modifier', () => {
    const r = migrer({ version: VERSION_SAUVEGARDE + 1, progression: {} });
    expect(r).toMatchObject({ ok: false, cause: 'trop_recente' });
  });

  it('refuse ce qui n’a pas de version lisible', () => {
    for (const x of [null, 3, 'v1', [], {}, { version: 0 }, { version: -1 }, { version: 1.5 }, { version: '1' }]) {
      expect(migrer(x), JSON.stringify(x)).toMatchObject({ ok: false, cause: 'illisible' });
    }
  });

  it('refuse une v1 abîmée, après migration, par la validation stricte', () => {
    const v1 = JSON.parse(FIXTURE_V1) as Record<string, unknown>;
    const abimees: Record<string, unknown>[] = [
      { ...v1, progression: { niveauMax: 'beaucoup', etoiles: {} } },
      { ...v1, progression: { niveauMax: 4, etoiles: { '1': 9 } } },
      { ...v1, progression: { niveauMax: 4, etoiles: { '7': 2 } } },
      { ...v1, reglages: { son: 'fort', musique: 0.2 } },
      { ...v1, reglages: { musique: 0.2 } },
      { ...v1, progression: null },
      JSON.parse('{"version":1,"progression":{"niveauMax":3,"etoiles":{"__proto__":2}},"reglages":{"son":0.5,"musique":0.5},"partie":null}') as Record<string, unknown>,
    ];
    for (const x of abimees) expect(migrer(x), JSON.stringify(x)).toMatchObject({ ok: false, cause: 'invalide' });
    expect(Reflect.get({}, 'matou')).toBeUndefined();
  });

  it('refuse une v2 invalide', () => {
    expect(migrer(variante({ 'reglages.vitesse': 5 }))).toMatchObject({ ok: false, cause: 'invalide' });
  });
});
