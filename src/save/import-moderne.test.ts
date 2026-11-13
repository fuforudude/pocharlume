import { describe, expect, it } from 'vitest';
import { CATALOGUE_MODERNE } from '../data/recompenses-moderne';
import { FIXTURE_V8, sauvegardeRemplie } from './aides.test-utils';
import { crc32, exporterCode, importerCode, PREFIXE_CODE, remplacerProgression, versBase64Url } from './code';
import { Depot } from './depot';
import { sauvegardeVide, type Sauvegarde } from './format';
import { enregistrerVictoireModerne } from './moderne';
import { Session } from './session';
import { StockageMemoire } from './stockage';

// Règle d'import : un code sans bloc `moderne` laisse le DLC de l'appareil ; un code qui en a un le remplace.

function fabriquerCode(json: string): string {
  const corps = `j.${versBase64Url(new TextEncoder().encode(json))}`;
  return `${PREFIXE_CODE}.${corps}.${crc32(new TextEncoder().encode(corps)).toString(16).padStart(8, '0')}`;
}

/** Un appareil qui a joué au DLC : niveaux, badges, skins, titres. */
function appareilAvecDlc(): Sauvegarde {
  let s = sauvegardeVide();
  for (let n = 1; n <= 5; n++) s = enregistrerVictoireModerne(s, n, 'matou', 3);
  return {
    ...s,
    moderne: {
      ...s.moderne,
      badges: 1234,
      collection: { ...s.moderne.collection, skinsTours: [...CATALOGUE_MODERNE.skinsTours].slice(0, 2).sort(), skinsHeros: [], equipes: {} },
      titres: [...CATALOGUE_MODERNE.titres].slice(0, 1).sort(),
    },
  };
}

async function sessionAvec(appareil: Sauvegarde, stockage = new StockageMemoire()): Promise<Session> {
  const session = await Session.ouvrir(new Depot(stockage));
  await session.appliquerImport(appareil);
  return session;
}

describe('import : le DLC de l’appareil face au code', () => {
  it('un code v8 sans `moderne` : l’appareil garde badges, skins et titres, l’histoire vient du code', async () => {
    const appareil = appareilAvecDlc();
    const v8 = JSON.parse(FIXTURE_V8) as Record<string, unknown>;
    Reflect.deleteProperty(v8, 'partie');
    const lu = await importerCode(fabriquerCode(JSON.stringify(v8)));
    if (!lu.ok) throw new Error(lu.detail);
    expect(lu.avecModerne).toBe(false);

    const session = await sessionAvec(appareil);
    await session.appliquerImport(lu.sauvegarde, lu.avecModerne);
    expect(session.sauvegarde.moderne).toEqual(appareil.moderne);
    expect(session.sauvegarde.moderne.badges).toBe(1234);
    expect(session.sauvegarde.moderne.collection.skinsTours).toHaveLength(2);
    expect(session.sauvegarde.progression).toEqual(v8.progression);
    expect(session.sauvegarde.meta).toEqual(v8.meta);
  });

  it('un code v9 sans `moderne` : le DLC de l’appareil est gardé et reste écrit', async () => {
    const appareil = appareilAvecDlc();
    const stockage = new StockageMemoire();
    const session = await sessionAvec(appareil, stockage);
    const lu = await importerCode(await exporterCode(sauvegardeRemplie()));
    if (!lu.ok) throw new Error(lu.detail);
    expect(lu.avecModerne).toBe(false);
    await session.appliquerImport(lu.sauvegarde, lu.avecModerne);
    expect(session.sauvegarde.moderne).toEqual(appareil.moderne);
    const relue = await Session.ouvrir(new Depot(stockage));
    expect(relue.sauvegarde.moderne).toEqual(appareil.moderne);
  });

  it('un code avec `moderne` remplace celui de l’appareil', async () => {
    const source = appareilAvecDlc();
    const autre = { ...source, moderne: { ...source.moderne, badges: 7, titres: [] } };
    const lu = await importerCode(await exporterCode(source));
    if (!lu.ok) throw new Error(lu.detail);
    expect(lu.avecModerne).toBe(true);

    const session = await sessionAvec(autre);
    await session.appliquerImport(lu.sauvegarde, lu.avecModerne);
    expect(session.sauvegarde.moderne).toEqual(source.moderne);
    expect(session.sauvegarde.moderne.badges).toBe(1234);
  });

  it('un code dont le `moderne` est présent mais vide remplace aussi', async () => {
    const json = JSON.stringify({ ...sauvegardeRemplie(), partie: undefined, moderne: sauvegardeVide().moderne });
    const lu = await importerCode(fabriquerCode(json));
    if (!lu.ok) throw new Error(lu.detail);
    expect(lu.avecModerne).toBe(true);
    const session = await sessionAvec(appareilAvecDlc());
    await session.appliquerImport(lu.sauvegarde, lu.avecModerne);
    expect(session.sauvegarde.moderne).toEqual(sauvegardeVide().moderne);
  });

  it('remplacerProgression avec le DLC de l’appareil garde celui-ci ; sans, il prend celui du code', () => {
    const appareil = appareilAvecDlc();
    const importee = sauvegardeRemplie();
    expect(remplacerProgression(importee, appareil.moderne).moderne).toEqual(appareil.moderne);
    expect(remplacerProgression(importee).moderne).toEqual(importee.moderne);
  });
});
