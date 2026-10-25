// Export et import de la méta-progression : tout voyage dans le code, et un code piégé est refusé avant d'avoir touché à rien.
import { describe, expect, it } from 'vitest';
import { BRANCHES_ARBRE, IDS_HEROS } from '../data/meta';
import { DEFS_TEST, FIXTURE_V2, sauvegardeRemplie, SUPPRIME, variante } from './aides.test-utils';
import { crc32, exporterCode, importerCode, PREFIXE_CODE, remplacerProgression, TAILLE_MAX_CODE, versBase64Url } from './code';
import { Depot } from './depot';
import { metaParDefaut, sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoire } from './progression';
import { Session } from './session';
import { StockageMemoire } from './stockage';

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
    },
  };
}

describe('export et import de la méta-progression', () => {
  it('le code redonne les monnaies, les héros, l’arbre, les objets et le dernier choix', async () => {
    const source = sauvegardeRemplie();
    const r = await importerCode(await exporterCode(source), DEFS_TEST);
    if (!r.ok) throw new Error(r.detail);
    expect(r.depuis).toBe(3);
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

    it('avec les définitions : plus de points que de niveaux, ultime trop tôt, compétence inconnue', async () => {
      const cas: Record<string, unknown>[] = [
        { 'meta.heros.pollen.competences': { pollen_a: 1, pollen_b: 1 } }, // niveau 1 : un seul point
        { 'meta.heros.charlie.competences': { charlie_ultime: 1 } }, // niveau 4 : pas d'ultime
        { 'meta.heros.plume.competences': { vol: 1 } },
      ];
      for (const changements of cas) {
        const code = fabriquerCode(donneesExportees(changements));
        expect((await importerCode(code, DEFS_TEST)).ok, JSON.stringify(changements)).toBe(false);
      }
      // La première est acceptée sans définitions (le niveau n'est pas connu) : c'est bien `defs` qui la refuse.
      expect((await importerCode(fabriquerCode(donneesExportees(cas[0] ?? {})))).ok).toBe(true);
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

  it('la session refuse à l’import ce que ses définitions refusent', async () => {
    const session = await Session.ouvrir(new Depot(new StockageMemoire()), null, { verrou: null, defs: DEFS_TEST });
    const code = fabriquerCode(donneesExportees({ 'meta.heros.pollen.competences': { pollen_a: 1, pollen_b: 1 } }));
    expect(await session.importer(code)).toMatchObject({ ok: false, raison: 'donnees' });
  });
});
