import { describe, expect, it } from 'vitest';
import { FIXTURE_V1, FIXTURE_V2, sauvegardeRemplie, variante } from './aides.test-utils';
import { etoilesDepensees, etoilesGagnees, metaParDefaut, VERSION_SAUVEGARDE } from './format';
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
      // La méta-progression de la v3 part de son état de départ.
      meta: metaParDefaut(),
      // La partie en cours de la v1 ne se rejoue pas avec les données de la v2 : abandonnée.
      partie: null,
    });
  });

  it('la fixture v2 figée est bien une sauvegarde en version 2', () => {
    expect((JSON.parse(FIXTURE_V2) as { version: number }).version).toBe(2);
  });

  it('migre la sauvegarde v2 figée en v3 sans rien perdre : progression et réglages sont identiques, la partie reçoit les champs du jalon 2', () => {
    const v2 = JSON.parse(FIXTURE_V2) as { progression: unknown; reglages: unknown; partie: unknown };
    const r = migrer(v2);
    if (!r.ok) throw new Error(r.raison);
    expect(r.depuis).toBe(2);
    expect(r.sauvegarde.version).toBe(3);
    expect(r.sauvegarde.progression).toEqual(v2.progression);
    expect(r.sauvegarde.reglages).toEqual(v2.reglages);
    // La partie est gardée telle quelle, sa config recevant les champs du jalon 2 (valeurs neutres).
    const partie = v2.partie as { config: Record<string, unknown> } | null;
    expect(r.sauvegarde.partie).toEqual(partie && { ...partie, config: { ...partie.config, heros: partie.config.dieu, competencesHeros: {}, ameliorations: {}, objets: [] } });
    expect(r.sauvegarde.meta).toEqual({
      monnaies: { aretes: 0, braises: 0 },
      heros: { plume: { xp: 0, competences: {} }, charlie: { xp: 0, competences: {} }, pollen: { xp: 0, competences: {} } },
      arbre: { caserne: 0, tir: 0, magie: 0, artillerie: 0, sorts: 0, heros: 0 },
      objets: { fiole_soufre: 0, herbe_sabbat: 0, griffe_renfort: 0, sablier: 0 },
      choix: { dieu: 'charlie', heros: 'charlie', objets: [] },
    });
  });

  it('les étoiles déjà gagnées en v2 sont toutes disponibles pour l’arbre après la migration', () => {
    const r = migrer(JSON.parse(FIXTURE_V2));
    if (!r.ok) throw new Error(r.raison);
    expect(etoilesGagnees(r.sauvegarde.progression)).toBe(3 + 2 + 3 + 2 + 1 + 3);
    expect(etoilesDepensees(r.sauvegarde.meta.arbre)).toBe(0);
  });

  it('une sauvegarde v2 abîmée ou avec une clé en trop est refusée après migration', () => {
    const v2 = JSON.parse(FIXTURE_V2) as Record<string, unknown>;
    expect(migrer({ ...v2, extra: 1 })).toMatchObject({ ok: false, cause: 'invalide' });
    expect(migrer({ ...v2, reglages: { son: 500, musique: 0, vitesse: 1 } })).toMatchObject({ ok: false, cause: 'invalide' });
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
