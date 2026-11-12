import { describe, expect, it } from 'vitest';
import { PARTIE, FIXTURE_V1, FIXTURE_V2, FIXTURE_V3, FIXTURE_V4, FIXTURE_V5, FIXTURE_V6, FIXTURE_V7, FIXTURE_V8, sauvegardeRemplie, variante } from './aides.test-utils';
import { etoilesDepensees, etoilesGagnees, metaParDefaut, moderneParDefaut, VERSION_SAUVEGARDE } from './format';
import { MIGRATIONS, migrer } from './migrations';

/** Le bestiaire d'une sauvegarde migrée : rien de rencontré, fiches « Nouvel ennemi » activées. */
const BESTIAIRE_VIDE = { rencontres: [], fiches: true };

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
      // Ajout de la v9 : la campagne Temps modernes, vide.
      moderne: moderneParDefaut(),
    });
  });

  it('la fixture v2 figée est bien une sauvegarde en version 2', () => {
    expect((JSON.parse(FIXTURE_V2) as { version: number }).version).toBe(2);
  });

  it('migre la sauvegarde v2 figée jusqu’à la version courante sans rien perdre : progression et réglages sont identiques, la partie reçoit les champs du jalon 2', () => {
    const v2 = JSON.parse(FIXTURE_V2) as { progression: unknown; reglages: unknown; partie: unknown };
    const r = migrer(v2);
    if (!r.ok) throw new Error(r.raison);
    expect(r.depuis).toBe(2);
    expect(r.sauvegarde.version).toBe(VERSION_SAUVEGARDE);
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
      // Ajouts de la v4 : la région 1 seulement (niveau 7 débloqué), aucun défi, collection vide.
      regionMax: 1,
      defis: {},
      collection: { possedes: {}, eclats: 0, garanties: { skins: 0, familiers: 0 }, equipes: { skins: {}, familiers: {} } },
      // Ajout de la v5 : le mode infini sans record ni palier.
      infini: { records: {}, paliers: [] },
      // Ajout de la v6 : aucune inscription de statue trouvée.
      inscriptions: [],
      bestiaire: BESTIAIRE_VIDE,
    });
  });

  it('la fixture v3 figée est bien une sauvegarde en version 3', () => {
    expect((JSON.parse(FIXTURE_V3) as { version: number }).version).toBe(3);
  });

  it('migre la sauvegarde v3 figée en v4 sans rien perdre : tout est identique, la méta reçoit région, défis et collection', () => {
    const v3 = JSON.parse(FIXTURE_V3) as { progression: unknown; reglages: unknown; meta: Record<string, unknown>; partie: unknown };
    const r = migrer(v3);
    if (!r.ok) throw new Error(r.raison);
    expect(r.depuis).toBe(3);
    expect(r.sauvegarde.version).toBe(VERSION_SAUVEGARDE);
    expect(r.sauvegarde.progression).toEqual(v3.progression);
    expect(r.sauvegarde.reglages).toEqual(v3.reglages);
    expect(r.sauvegarde.partie).toEqual(v3.partie);
    // Le niveau 10 est gagné (niveauMax 11) : la région 2 est ouverte. Les monnaies, héros, arbre, stock et choix sont gardés.
    expect(r.sauvegarde.meta).toEqual({
      ...v3.meta,
      regionMax: 2,
      defis: {},
      collection: { possedes: {}, eclats: 0, garanties: { skins: 0, familiers: 0 }, equipes: { skins: {}, familiers: {} } },
      infini: { records: {}, paliers: [] },
      inscriptions: [],
      bestiaire: BESTIAIRE_VIDE,
    });
  });

  it('la fixture v4 figée est bien une sauvegarde en version 4', () => {
    expect((JSON.parse(FIXTURE_V4) as { version: number }).version).toBe(4);
  });

  it('migre la sauvegarde v4 figée en v5 sans rien perdre : tout est identique, la méta reçoit le mode infini vide', () => {
    const v4 = JSON.parse(FIXTURE_V4) as { progression: unknown; reglages: unknown; meta: Record<string, unknown>; partie: unknown };
    const r = migrer(v4);
    if (!r.ok) throw new Error(r.raison);
    expect(r.depuis).toBe(4);
    expect(r.sauvegarde.version).toBe(VERSION_SAUVEGARDE);
    expect(r.sauvegarde.progression).toEqual(v4.progression);
    expect(r.sauvegarde.reglages).toEqual(v4.reglages);
    expect(r.sauvegarde.partie).toEqual(v4.partie);
    // Monnaies, héros, arbre, stock, choix, région, défis et collection sont gardés tels quels.
    expect(r.sauvegarde.meta).toEqual({ ...v4.meta, infini: { records: {}, paliers: [] }, inscriptions: [], bestiaire: BESTIAIRE_VIDE });
    expect(r.sauvegarde.meta.defis).toEqual({ '2': { heroique: true }, '4': { heroique: true, fer: true } });
    expect(r.sauvegarde.meta.collection.eclats).toBe(77);
  });

  it('la fixture v5 figée est bien une sauvegarde en version 5', () => {
    expect((JSON.parse(FIXTURE_V5) as { version: number }).version).toBe(5);
  });

  it('migre la sauvegarde v5 figée en v6 sans rien perdre : tout est identique, la méta reçoit une liste d’inscriptions vide', () => {
    const v5 = JSON.parse(FIXTURE_V5) as { progression: unknown; reglages: unknown; meta: Record<string, unknown>; partie: unknown };
    const r = migrer(v5);
    if (!r.ok) throw new Error(r.raison);
    expect(r.depuis).toBe(5);
    expect(r.sauvegarde.version).toBe(VERSION_SAUVEGARDE);
    expect(r.sauvegarde.progression).toEqual(v5.progression);
    expect(r.sauvegarde.reglages).toEqual(v5.reglages);
    expect(r.sauvegarde.partie).toEqual(v5.partie);
    // Tout le reste de la méta, mode infini compris, est gardé tel quel ; aucune inscription n'est trouvée.
    expect(r.sauvegarde.meta).toEqual({ ...v5.meta, inscriptions: [], bestiaire: BESTIAIRE_VIDE });
    expect(r.sauvegarde.meta.infini).toEqual({ records: { chaumes: 23, gue: 12 }, paliers: [10, 20] });
  });

  it('une v5 abîmée est refusée après migration', () => {
    const v5 = JSON.parse(FIXTURE_V5) as Record<string, unknown>;
    expect(migrer({ ...v5, extra: 1 })).toMatchObject({ ok: false, cause: 'invalide' });
    expect(migrer({ ...v5, meta: { ...(v5.meta as object), infini: { records: {}, paliers: [10] } } })).toMatchObject({ ok: false, cause: 'invalide' });
  });

  it('la fixture v7 figée est bien une sauvegarde en version 7, fin de l’histoire gagnée', () => {
    const v7 = JSON.parse(FIXTURE_V7) as { version: number; progression: { niveauMax: number }; meta: { regionMax: number } };
    expect([v7.version, v7.progression.niveauMax, v7.meta.regionMax]).toEqual([7, 100, 10]);
  });

  it('migre la v7 figée en v8 : le niveau 100 gagné débloque le niveau 101 et la région 11, le reste est identique', () => {
    const v7 = JSON.parse(FIXTURE_V7) as { progression: { niveauMax: number; etoiles: unknown }; reglages: unknown; meta: Record<string, unknown>; partie: unknown };
    const r = migrer(v7);
    if (!r.ok) throw new Error(r.raison);
    expect(r.depuis).toBe(7);
    expect(r.sauvegarde.version).toBe(VERSION_SAUVEGARDE);
    expect(r.sauvegarde.progression).toEqual({ ...v7.progression, niveauMax: 101 });
    expect(r.sauvegarde.reglages).toEqual(v7.reglages);
    expect(r.sauvegarde.partie).toEqual(v7.partie);
    expect(r.sauvegarde.meta).toEqual({ ...v7.meta, regionMax: 11 });
  });

  it('une v7 avec une partie en cours est migrée en gardant la partie, et la fin de l’histoire gagnée est débloquée', () => {
    const v7 = { ...(JSON.parse(FIXTURE_V7) as Record<string, unknown>), partie: PARTIE };
    const r = migrer(v7);
    if (!r.ok) throw new Error(r.raison);
    expect(r.sauvegarde.partie).toEqual(PARTIE);
    expect(r.sauvegarde.progression.niveauMax).toBe(101);
    expect(r.sauvegarde.meta.regionMax).toBe(11);
  });

  it('une v7 dont le niveau 100 n’est pas gagné ne change pas de progression', () => {
    const v7 = JSON.parse(FIXTURE_V7) as { progression: { niveauMax: number; etoiles: Record<string, unknown> }; meta: Record<string, unknown> };
    const etoiles = { ...v7.progression.etoiles };
    Reflect.deleteProperty(etoiles, '100');
    const r = migrer({ ...v7, progression: { niveauMax: 100, etoiles }, meta: { ...v7.meta, defis: {} } });
    if (!r.ok) throw new Error(r.raison);
    expect(r.sauvegarde.progression.niveauMax).toBe(100);
    expect(r.sauvegarde.meta.regionMax).toBe(10);
  });

  it('la sauvegarde courante accepte les niveaux jusqu’à 150 et les régions jusqu’à 15, pas au-delà', () => {
    const v7 = JSON.parse(FIXTURE_V7) as { progression: { etoiles: Record<string, unknown> }; meta: Record<string, unknown> };
    const etoiles: Record<string, unknown> = { ...v7.progression.etoiles };
    for (let n = 101; n <= 150; n++) etoiles[String(n)] = { matou: 1 };
    const complete = { ...v7, version: 8, progression: { niveauMax: 150, etoiles }, meta: { ...v7.meta, regionMax: 15 } };
    const rc = migrer(complete);
    expect(rc.ok ? '' : rc.raison).toBe('');
    expect(migrer({ ...complete, progression: { niveauMax: 151, etoiles } })).toMatchObject({ ok: false, cause: 'invalide' });
    expect(migrer({ ...complete, meta: { ...v7.meta, regionMax: 16 } })).toMatchObject({ ok: false, cause: 'invalide' });
    // Une région ne s'ouvre pas sans son niveau : niveauMax 120 veut dire région 12.
    expect(migrer({ ...complete, progression: { niveauMax: 120, etoiles } })).toMatchObject({ ok: false, cause: 'invalide' });
  });

  it('la chaîne complète v1 à v8 aboutit à la version courante valide, avec la campagne du DLC vide', () => {
    for (const fixture of [FIXTURE_V1, FIXTURE_V2, FIXTURE_V3, FIXTURE_V4, FIXTURE_V5, FIXTURE_V6, FIXTURE_V7, FIXTURE_V8]) {
      const r = migrer(JSON.parse(fixture));
      expect(r.ok && r.sauvegarde.version).toBe(VERSION_SAUVEGARDE);
      expect(r.ok && r.sauvegarde.moderne).toEqual(moderneParDefaut());
      if (fixture !== FIXTURE_V8) expect(r.ok && r.sauvegarde.meta.bestiaire).toEqual({ rencontres: [], fiches: true });
    }
  });

  it('la fixture v8 figée est bien une sauvegarde en version 8, au-delà de l’histoire, avec une partie en cours', () => {
    const v8 = JSON.parse(FIXTURE_V8) as { version: number; progression: { niveauMax: number }; meta: { regionMax: number }; partie: { niveau: number } | null };
    expect([v8.version, v8.progression.niveauMax, v8.meta.regionMax, v8.partie?.niveau]).toEqual([8, 112, 12, 105]);
  });

  it('migre la v8 figée en v9 sans rien perdre : tout est identique, la campagne Temps modernes est ajoutée vide', () => {
    const v8 = JSON.parse(FIXTURE_V8) as { progression: unknown; reglages: unknown; meta: unknown; partie: unknown };
    const r = migrer(v8);
    if (!r.ok) throw new Error(r.raison);
    expect(r.depuis).toBe(8);
    expect(r.sauvegarde).toEqual({ version: 9, progression: v8.progression, reglages: v8.reglages, meta: v8.meta, partie: v8.partie, moderne: moderneParDefaut() });
    // La campagne du DLC : sa progression vide (niveau 1 ouvert), 0 badge, rien en collection, aucun titre, sticker déplié.
    expect(r.sauvegarde.moderne).toEqual({
      progression: { niveauMax: 1, etoiles: {} },
      defis: {},
      records: {},
      badges: 0,
      collection: { skinsTours: [], skinsHeros: [], garantie: 0 },
      titres: [],
      stickerReplie: false,
    });
  });

  it('une v9 obtenue par migration, relue, est acceptée telle quelle (aller-retour de la validation, sans nouvelle migration)', () => {
    const r = migrer(JSON.parse(FIXTURE_V8));
    if (!r.ok) throw new Error(r.raison);
    const relue = migrer(JSON.parse(JSON.stringify(r.sauvegarde)));
    expect(relue.ok && relue.depuis).toBe(VERSION_SAUVEGARDE);
    expect(relue.ok && relue.sauvegarde).toEqual(r.sauvegarde);
  });

  it('la migration v8 vers v9 est idempotente : appliquée à une sauvegarde qui a déjà sa campagne du DLC, elle la garde', () => {
    const r = migrer(JSON.parse(FIXTURE_V8));
    if (!r.ok) throw new Error(r.raison);
    // Appliquer la migration à une v9 déjà migrée ne change rien non plus (elle ne remplace pas une campagne existante).
    const avecDlc = { ...r.sauvegarde, version: 8, moderne: { ...moderneParDefaut(), badges: 5 } };
    expect(MIGRATIONS[8]?.(avecDlc)).toMatchObject({ version: 9, moderne: { badges: 5 } });
  });

  it('une v8 abîmée est refusée après migration', () => {
    const v8 = JSON.parse(FIXTURE_V8) as Record<string, unknown>;
    expect(migrer({ ...v8, extra: 1 })).toMatchObject({ ok: false, cause: 'invalide' });
    expect(migrer({ ...v8, progression: { niveauMax: 151, etoiles: {} } })).toMatchObject({ ok: false, cause: 'invalide' });
  });

  it('une v4 abîmée est refusée après migration', () => {
    const v4 = JSON.parse(FIXTURE_V4) as Record<string, unknown>;
    expect(migrer({ ...v4, extra: 1 })).toMatchObject({ ok: false, cause: 'invalide' });
    expect(migrer({ ...v4, meta: { ...(v4.meta as object), monnaies: { aretes: -1, braises: 0 } } })).toMatchObject({ ok: false, cause: 'invalide' });
  });

  it('migrer la v3 ne donne ni éclats, ni objets, ni défis rétroactifs, et garde l’arbre acheté', () => {
    const r = migrer(JSON.parse(FIXTURE_V3));
    if (!r.ok) throw new Error(r.raison);
    expect(r.sauvegarde.meta.collection.eclats).toBe(0);
    expect(r.sauvegarde.meta.defis).toEqual({});
    expect(etoilesDepensees(r.sauvegarde.meta.arbre)).toBe(10);
    expect(r.sauvegarde.meta.monnaies).toEqual({ aretes: 345, braises: 42 });
  });

  it('la région ouverte de la v4 se déduit du plus haut niveau débloqué de la v3', () => {
    const v3 = JSON.parse(FIXTURE_V3) as { progression: { niveauMax: number; etoiles: Record<string, unknown> } };
    const regionPour = (niveauMax: number): number | undefined => {
      const r = migrer({ ...v3, progression: { niveauMax, etoiles: {} }, meta: { ...(v3 as unknown as { meta: object }).meta, arbre: { caserne: 0, tir: 0, magie: 0, artillerie: 0, sorts: 0, heros: 0 } }, partie: null });
      return r.ok ? r.sauvegarde.meta.regionMax : undefined;
    };
    expect([1, 9, 10, 11, 20, 21, 51, 100].map(regionPour)).toEqual([1, 1, 1, 2, 2, 3, 6, 10]);
  });

  it('une v3 abîmée est refusée après migration (la v4 est validée strictement)', () => {
    const v3 = JSON.parse(FIXTURE_V3) as Record<string, unknown>;
    expect(migrer({ ...v3, extra: 1 })).toMatchObject({ ok: false, cause: 'invalide' });
    expect(migrer({ ...v3, meta: { ...(v3.meta as object), monnaies: { aretes: -1, braises: 0 } } })).toMatchObject({ ok: false, cause: 'invalide' });
    expect(migrer({ ...v3, progression: { niveauMax: 'x', etoiles: {} } })).toMatchObject({ ok: false, cause: 'invalide' });
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
