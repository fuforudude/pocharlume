// Export et import de la méta-progression : tout voyage dans le code, et un code piégé est refusé avant d'avoir touché à rien.
import { describe, expect, it } from 'vitest';
import { IDS_COLLECTION } from '../data/collection';
import { BRANCHES_ARBRE, IDS_HEROS } from '../data/meta';
import { DEFS_TEST, FIXTURE_V2, FIXTURE_V3, sauvegardeRemplie, SUPPRIME, variante } from './aides.test-utils';
import { crc32, exporterCode, importerCode, PREFIXE_CODE, remplacerProgression, TAILLE_MAX_CODE, versBase64Url } from './code';
import type { DefsMeta } from './definitions';
import { Depot } from './depot';
import { metaParDefaut, sauvegardeVide, VERSION_SAUVEGARDE, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';
import { Session } from './session';
import { StockageMemoire } from './stockage';
import { validerSauvegarde } from './validation';

/** Fabrique un code valide (somme comprise) autour de données quelconques. */
function fabriquerCode(json: string): string {
  const corps = `j.${versBase64Url(new TextEncoder().encode(json))}`;
  return `${PREFIXE_CODE}.${corps}.${crc32(new TextEncoder().encode(corps)).toString(16).padStart(8, '0')}`;
}

/** Les données d'une sauvegarde remplie telles qu'un code les porte (sans la partie en cours). */
function donneesExportees(changements: Record<string, unknown> = {}): string {
  const brut = variante(changements);
  Reflect.deleteProperty(brut, 'partie');
  return JSON.stringify(brut);
}

/** Un joueur qui a tout : campagne terminée, les neuf héros au niveau maximal, arbre au maximum, stocks pleins. */
function joueurComplet(): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= 100; n++) s = enregistrerVictoire(s, n, 'vieux_sage', 3);
  const competences = (h: string) => ({ [`${h}_a`]: 3, [`${h}_b`]: 3, [`${h}_c`]: 3, [`${h}_ultime`]: 1 });
  return {
    ...s,
    meta: {
      monnaies: { aretes: 99_999_999, braises: 99_999_999 },
      heros: Object.fromEntries(IDS_HEROS.map((h) => [h, { xp: 1_000_000, competences: competences(h) }])),
      arbre: Object.fromEntries(BRANCHES_ARBRE.map((b) => [b, 5])) as Sauvegarde['meta']['arbre'],
      objets: { fiole_soufre: 10, herbe_sabbat: 10, griffe_renfort: 10, sablier: 10 },
      choix: { dieu: 'pollen', heros: 'lanterne', objets: ['sablier', 'herbe_sabbat', 'griffe_renfort'] },
      regionMax: 10,
      // Les deux défis réussis sur les 100 niveaux (tous à 3 étoiles).
      defis: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [String(i + 1), { heroique: true as const, fer: true as const }])),
      collection: {
        possedes: Object.fromEntries(IDS_COLLECTION.map((id) => [id, 5])),
        eclats: 99_999_999,
        garanties: { skins: 9, familiers: 9 },
        equipes: {
          skins: { caserne: 'skin_caserne_3', tir: 'skin_tir_3', magie: 'skin_magie_3', artillerie: 'skin_artillerie_3', lanterne: 'skin_lanterne' },
          familiers: Object.fromEntries(IDS_HEROS.map((h) => [h, 'familier_salamandre'])),
        },
      },
    },
  };
}

describe('export et import de la méta-progression', () => {
  it('le code redonne les monnaies, les héros, l’arbre, les objets et le dernier choix', async () => {
    const source = sauvegardeRemplie();
    const r = await importerCode(await exporterCode(source), DEFS_TEST);
    if (!r.ok) throw new Error(r.detail);
    expect(r.depuis).toBe(VERSION_SAUVEGARDE);
    expect(r.sauvegarde.meta).toEqual(source.meta);
    expect(remplacerProgression(r.sauvegarde).meta).toEqual(source.meta);
    expect(remplacerProgression(r.sauvegarde).partie).toBeNull();
  });

  it('un joueur qui a tout tient largement dans la taille maximale d’un code', async () => {
    const complet = joueurComplet();
    const code = await exporterCode(complet);
    expect(code.length).toBeLessThan(TAILLE_MAX_CODE / 4);
    const r = await importerCode(code);
    expect(r.ok && r.sauvegarde.meta).toEqual(complet.meta);
    expect((await importerCode(code, DEFS_TEST)).ok).toBe(true);
  });

  it('un code d’une sauvegarde v2 donne une méta-progression de départ et garde la progression', async () => {
    const v2 = JSON.parse(FIXTURE_V2) as Record<string, unknown>;
    Reflect.deleteProperty(v2, 'partie');
    const r = await importerCode(fabriquerCode(JSON.stringify(v2)));
    if (!r.ok) throw new Error(r.detail);
    expect(r.depuis).toBe(2);
    expect(r.sauvegarde.meta).toEqual(metaParDefaut());
    expect(r.sauvegarde.progression).toEqual(v2.progression);
  });

  it('un code d’une sauvegarde v3 est migré : la méta est gardée, la collection part vide', async () => {
    const v3 = JSON.parse(FIXTURE_V3) as { progression: unknown; meta: object; partie: unknown };
    Reflect.deleteProperty(v3, 'partie');
    const r = await importerCode(fabriquerCode(JSON.stringify(v3)), DEFS_TEST);
    if (!r.ok) throw new Error(r.detail);
    expect(r.depuis).toBe(3);
    expect(r.sauvegarde.progression).toEqual(v3.progression);
    expect(r.sauvegarde.meta).toEqual({ ...v3.meta, regionMax: 2, defis: {}, collection: metaParDefaut().collection });
  });

  it('un code v3 sans méta est refusé', async () => {
    expect(await importerCode(fabriquerCode(donneesExportees({ meta: SUPPRIME })))).toMatchObject({ ok: false, raison: 'donnees' });
  });

  describe('refuse des données v3 piégées', () => {
    const piegees: [string, Record<string, unknown>][] = [
      ['arêtes négatives', { 'meta.monnaies.aretes': -5 }],
      ['arêtes démesurées', { 'meta.monnaies.aretes': 1e12 }],
      ['braises en texte', { 'meta.monnaies.braises': '999' }],
      ['braises fractionnaires', { 'meta.monnaies.braises': 0.5 }],
      ['stock au-delà de 10', { 'meta.objets.sablier': 11 }],
      ['objet inconnu', { 'meta.objets.potion_magique': 3 }],
      ['rang d’arbre au-delà de 5', { 'meta.arbre.tir': 6 }],
      ['plus d’étoiles dépensées que gagnées', { 'meta.arbre': { caserne: 5, tir: 5, magie: 5, artillerie: 5, sorts: 5, heros: 5 } }],
      ['branche inconnue', { 'meta.arbre.piege': 1 }],
      ['héros inconnu', { 'meta.heros.zeus': { xp: 0, competences: {} } }],
      ['avatar absent', { 'meta.heros.plume': SUPPRIME }],
      ['expérience démesurée', { 'meta.heros.plume.xp': 1e15 }],
      ['expérience négative', { 'meta.heros.plume.xp': -1 }],
      ['rang de compétence à 9', { 'meta.heros.plume.competences': { plume_a: 9 } }],
      ['compétence au nom hérité', { 'meta.heros.plume.competences': { constructor: 1 } }],
      ['plus de 4 compétences', { 'meta.heros.plume.competences': { a: 1, b: 1, c: 1, d: 1, e: 1 } }],
      ['dieu inconnu choisi', { 'meta.choix.dieu': 'zeus' }],
      ['héros choisi d’un autre dieu', { 'meta.choix.heros': 'charlie' }],
      ['quatre objets emportés', { 'meta.choix.objets': ['sablier', 'sablier', 'sablier', 'sablier'] }],
      ['clé en trop dans la méta', { 'meta.cadeau': 1000 }],
    ];
    for (const [nom, changements] of piegees) {
      it(nom, async () => {
        expect(await importerCode(fabriquerCode(donneesExportees(changements))), nom).toMatchObject({ ok: false, raison: 'donnees' });
      });
    }

    it('clés héritées dans la méta', async () => {
      const json = donneesExportees();
      for (const piege of [
        json.replace('"monnaies":{', '"monnaies":{"__proto__":{"polluee":1},'),
        json.replace('"choix":{', '"choix":{"constructor":{"prototype":{"polluee":1}},'),
        json.replace('"arbre":{', '"arbre":{"__proto__":5,'),
        json.replace('"heros":{"plume"', '"heros":{"__proto__":{"xp":1,"competences":{}},"plume"'),
        json.replace('"competences":{}', '"competences":{"__proto__":2}'),
      ]) {
        expect(piege).not.toBe(json);
        expect(await importerCode(fabriquerCode(piege)), piege.slice(0, 80)).toMatchObject({ ok: false, raison: 'donnees' });
      }
      expect(Reflect.get({}, 'polluee')).toBeUndefined();
    });

  });

  describe('normalise au lieu de refuser ce que les définitions d’aujourd’hui ne permettent plus', () => {
    it('plus de points que de niveaux, ultime trop tôt, compétence inconnue : le héros récupère ses points, garde son expérience', async () => {
      const cas: [string, string, Record<string, number>][] = [
        ['pollen', 'meta.heros.pollen.competences', { pollen_a: 1, pollen_b: 1 }], // niveau 1 : un seul point
        ['charlie', 'meta.heros.charlie.competences', { charlie_ultime: 1 }], // niveau 4 : pas d'ultime
        ['plume', 'meta.heros.plume.competences', { vol: 1 }],
        ['charlie', 'meta.heros.charlie.competences', { charlie_a: 3, charlie_b: 3 }], // 6 points au niveau 4
        ['charlie', 'meta.heros.charlie.competences', { charlie_a: 3 }], // valable : intact
      ];
      for (const [heros, chemin, competences] of cas) {
        const code = fabriquerCode(donneesExportees({ [chemin]: competences }));
        const r = await importerCode(code, DEFS_TEST);
        if (!r.ok) throw new Error(`${heros} ${JSON.stringify(competences)} : ${r.detail}`);
        const lu = r.sauvegarde.meta.heros[heros as keyof Sauvegarde['meta']['heros']];
        const xp = sauvegardeRemplie().meta.heros[heros as keyof Sauvegarde['meta']['heros']]?.xp;
        const valable = competences.charlie_a === 3 && Object.keys(competences).length === 1;
        expect(lu, JSON.stringify(competences)).toEqual({ xp, competences: valable ? competences : {} });
        expect(validerSauvegarde(JSON.parse(JSON.stringify(r.sauvegarde)), DEFS_TEST).ok).toBe(true);
      }
      // Sans définitions, les compétences ne se jugent pas : le code passe tel quel.
      const sans = await importerCode(fabriquerCode(donneesExportees({ 'meta.heros.pollen.competences': { pollen_a: 1, pollen_b: 1 } })));
      expect(sans.ok && sans.sauvegarde.meta.heros.pollen?.competences).toEqual({ pollen_a: 1, pollen_b: 1 });
    });

    it('un code écrit avant un changement de SEUILS_XP est corrigé : les héros devenus trop bas rendent leurs points', async () => {
      const source = sauvegardeRemplie();
      const code = await exporterCode(source);
      // Mêmes compétences qu'avant, mais les niveaux sont devenus beaucoup plus chers à atteindre.
      const durcies: DefsMeta = { ...DEFS_TEST, seuilsXp: DEFS_TEST.seuilsXp.map((seuil) => seuil * 10) };
      const r = await importerCode(code, durcies);
      if (!r.ok) throw new Error(r.detail);
      expect(r.sauvegarde.meta.heros.charlie).toEqual({ xp: 500, competences: {} }); // niveau 1 au lieu de 4 : 3 points placés
      expect(r.sauvegarde.meta.heros.suie).toEqual({ xp: 2000, competences: {} }); // niveau 2 au lieu de 6, plus d'ultime
      expect(r.sauvegarde.meta.heros.plume).toEqual(source.meta.heros.plume); // rien à corriger
      expect(r.sauvegarde.meta.monnaies).toEqual(source.meta.monnaies);
      expect(r.sauvegarde.meta.arbre).toEqual(source.meta.arbre);
      expect(r.sauvegarde.progression).toEqual(source.progression);
      expect(validerSauvegarde(JSON.parse(JSON.stringify(r.sauvegarde)), durcies).ok).toBe(true);
      // Avec les définitions d'origine, le même code reste intact.
      const intact = await importerCode(code, DEFS_TEST);
      expect(intact.ok && intact.sauvegarde.meta).toEqual(source.meta);
    });

    it('un héros choisi qui n’est pas possédé est remplacé par l’avatar de son dieu', async () => {
      const code = fabriquerCode(donneesExportees({ 'meta.heros.suie': SUPPRIME, 'meta.choix.dieu': 'plume', 'meta.choix.heros': 'suie' }));
      for (const defs of [DEFS_TEST, undefined]) {
        const r = await importerCode(code, defs);
        if (!r.ok) throw new Error(r.detail);
        expect(r.sauvegarde.meta.choix).toMatchObject({ dieu: 'plume', heros: 'plume' });
        expect(r.sauvegarde.meta.heros.suie).toBeUndefined();
      }
      // Un héros choisi qui est possédé ne bouge pas.
      const possede = await importerCode(await exporterCode(sauvegardeRemplie()), DEFS_TEST);
      expect(possede.ok && possede.sauvegarde.meta.choix).toMatchObject({ dieu: 'plume', heros: 'suie' });
    });

    it('la structure impossible reste refusée avec les définitions', async () => {
      const code = fabriquerCode(donneesExportees({ 'meta.arbre.tir': 6 }));
      expect(await importerCode(code, DEFS_TEST)).toMatchObject({ ok: false, raison: 'donnees' });
    });
  });

  it('un import appliqué par la session remplace aussi la méta-progression, sans toucher à rien tant qu’il n’est pas appliqué', async () => {
    const source = sauvegardeRemplie();
    const code = await exporterCode(source);
    const stockage = new StockageMemoire();
    const session = await Session.ouvrir(new Depot(stockage), null, { verrou: null, defs: DEFS_TEST });
    const lu = await session.importer(code);
    if (!lu.ok) throw new Error(lu.detail);
    expect(session.sauvegarde.meta).toEqual(sauvegardeVide().meta);
    expect(await session.appliquerImport(lu.sauvegarde)).toBe(true);
    expect(session.sauvegarde.meta).toEqual(source.meta);
    const relue = await Session.ouvrir(new Depot(stockage), null, { verrou: null });
    expect(relue.sauvegarde.meta).toEqual(source.meta);
    expect(relue.sauvegarde.partie).toBeNull();
  });

  it('la session normalise à l’import ce que ses définitions ne permettent plus, puis l’écrit corrigé', async () => {
    const stockage = new StockageMemoire();
    const session = await Session.ouvrir(new Depot(stockage), null, { verrou: null, defs: DEFS_TEST });
    const code = fabriquerCode(donneesExportees({ 'meta.heros.pollen.competences': { pollen_a: 1, pollen_b: 1 } }));
    const lu = await session.importer(code);
    if (!lu.ok) throw new Error(lu.detail);
    expect(lu.sauvegarde.meta.heros.pollen).toEqual({ xp: 0, competences: {} });
    expect(await session.appliquerImport(lu.sauvegarde)).toBe(true);
    const relue = await Session.ouvrir(new Depot(stockage), null, { verrou: null, defs: DEFS_TEST });
    expect(relue.sauvegarde.meta.heros.pollen).toEqual({ xp: 0, competences: {} });
  });
});
