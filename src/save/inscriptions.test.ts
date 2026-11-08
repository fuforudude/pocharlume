// Inscriptions des statues (sauvegarde v6) : validation stricte, gain unique, persistance après rechargement, export et import,
// fusion de deux onglets.
import { describe, expect, it } from 'vitest';
import { IDS_INSCRIPTIONS } from '../data/niveaux/statues';
import { sauvegardeRemplie } from './aides.test-utils';
import { exporterCode, importerCode, remplacerProgression } from './code';
import { Depot } from './depot';
import { sauvegardeVide, type Sauvegarde } from './format';
import { fusionnerProgressions } from './progression';
import { Session } from './session';
import { StockageMemoire } from './stockage';
import { inscriptionTrouvee, nombreInscriptionsTrouvees, trouverInscription } from './transactions-inscriptions';
import { validerSauvegarde } from './validation';
import { creerVerrouMemoire } from './verrou';

function avecInscriptions(inscriptions: unknown): unknown {
  const s = sauvegardeRemplie();
  return JSON.parse(JSON.stringify({ ...s, meta: { ...s.meta, inscriptions } }));
}

/** La sauvegarde de `s` après avoir trouvé ces inscriptions, dans l'ordre donné. */
function apresAvoirTrouve(s: Sauvegarde, ...ids: string[]): Sauvegarde {
  let courante = s;
  for (const id of ids) {
    const r = trouverInscription(courante, id);
    if (!r.ok) throw new Error(r.raison);
    courante = r.sauvegarde;
  }
  return courante;
}

describe('validation des inscriptions trouvées (v6)', () => {
  it('accepte aucune inscription, quelques-unes, les 41, et rend une copie', () => {
    expect(validerSauvegarde(avecInscriptions([])).ok).toBe(true);
    const brut = avecInscriptions(['gue', 'place']);
    const r = validerSauvegarde(brut);
    if (!r.ok) throw new Error(r.raison);
    expect(r.valeur.meta.inscriptions).toEqual(['gue', 'place']);
    expect(r.valeur.meta.inscriptions).not.toBe((brut as Sauvegarde).meta.inscriptions);
    expect(validerSauvegarde(avecInscriptions([...IDS_INSCRIPTIONS])).ok).toBe(true);
  });

  it('refuse un identifiant inconnu, même hérité d’Object', () => {
    for (const id of ['inconnue', '', 'GUE', 'inscription.gue', 'toString', '__proto__', 'constructor', 3, null, { id: 'gue' }]) {
      expect(validerSauvegarde(avecInscriptions(['chaumes', id])).ok).toBe(false);
    }
  });

  it('refuse un doublon, un désordre, une liste trop longue et ce qui n’est pas une liste', () => {
    expect(validerSauvegarde(avecInscriptions(['gue', 'gue'])).ok).toBe(false);
    expect(validerSauvegarde(avecInscriptions(['pendus', 'gue'])).ok).toBe(false);
    expect(validerSauvegarde(avecInscriptions([...IDS_INSCRIPTIONS, 'chaumes'])).ok).toBe(false);
    for (const mauvais of [null, 'gue', { gue: true }, 0]) expect(validerSauvegarde(avecInscriptions(mauvais)).ok).toBe(false);
  });

  it('refuse des inscriptions absentes', () => {
    const sans = JSON.parse(JSON.stringify(sauvegardeRemplie())) as { meta: Record<string, unknown> };
    Reflect.deleteProperty(sans.meta, 'inscriptions');
    expect(validerSauvegarde(sans).ok).toBe(false);
  });
});

describe('trouver une inscription', () => {
  it('la première fois, elle entre dans la sauvegarde ; la seconde fois rien ne change', () => {
    const vide = sauvegardeVide();
    expect(nombreInscriptionsTrouvees(vide)).toBe(0);
    const premiere = trouverInscription(vide, 'gue');
    if (!premiere.ok) throw new Error(premiere.raison);
    expect(premiere.nouvelle).toBe(true);
    expect(premiere.sauvegarde.meta.inscriptions).toEqual(['gue']);
    expect(inscriptionTrouvee(premiere.sauvegarde, 'gue')).toBe(true);
    expect(inscriptionTrouvee(vide, 'gue')).toBe(false);
    // L'original n'est pas modifié.
    expect(vide.meta.inscriptions).toEqual([]);

    const seconde = trouverInscription(premiere.sauvegarde, 'gue');
    if (!seconde.ok) throw new Error(seconde.raison);
    expect(seconde.nouvelle).toBe(false);
    expect(seconde.sauvegarde).toBe(premiere.sauvegarde);
  });

  it('ne change rien d’autre que la liste : ni monnaies, ni étoiles, ni partie', () => {
    const avant = sauvegardeRemplie();
    const apres = apresAvoirTrouve(avant, 'ruelles');
    expect(apres.meta).toEqual({ ...avant.meta, inscriptions: ['chaumes', 'pendus', 'ruelles', 'choeur'] });
    expect(apres.progression).toBe(avant.progression);
    expect(apres.partie).toBe(avant.partie);
    expect(validerSauvegarde(apres).ok).toBe(true);
  });

  it('garde l’ordre des cartes quel que soit l’ordre où on les trouve', () => {
    const s = apresAvoirTrouve(sauvegardeVide(), 'choeur', 'chaumes', 'place', 'gue');
    expect(s.meta.inscriptions).toEqual(['chaumes', 'gue', 'place', 'choeur']);
    expect(validerSauvegarde(s).ok).toBe(true);
  });

  it('refuse un identifiant inconnu sans rien changer', () => {
    for (const id of ['inconnue', '', 'toString', '__proto__']) {
      expect(trouverInscription(sauvegardeVide(), id)).toEqual({ ok: false, raison: 'inscription_inconnue' });
    }
  });

  it('les 41 inscriptions se trouvent toutes', () => {
    expect(nombreInscriptionsTrouvees(apresAvoirTrouve(sauvegardeVide(), ...IDS_INSCRIPTIONS))).toBe(41);
  });
});

describe('persistance des inscriptions', () => {
  it('survit à un rechargement : la session rouverte sur le même stockage les retrouve, et le gain reste unique', async () => {
    const stockage = new StockageMemoire();
    const verrou = creerVerrouMemoire();
    const ouvrir = (): Promise<Session> => Session.ouvrir(new Depot(stockage), null, { verrou });
    const session = await ouvrir();
    expect(await session.trouverInscription('sillons')).toMatchObject({ ok: true, ecrite: true, detail: true });
    // Relue : rien de nouveau.
    expect(await session.trouverInscription('sillons')).toMatchObject({ ok: true, detail: false });
    expect(await session.trouverInscription('inconnue')).toEqual({ ok: false, raison: 'inscription_inconnue' });

    const rouverte = await ouvrir();
    expect(rouverte.sauvegarde.meta.inscriptions).toEqual(['sillons']);
    expect(await rouverte.trouverInscription('sillons')).toMatchObject({ ok: true, detail: false });
    expect(rouverte.sauvegarde.meta.inscriptions).toEqual(['sillons']);
  });

  it('deux onglets qui trouvent chacun une inscription les gardent toutes les deux', async () => {
    const stockage = new StockageMemoire();
    const verrou = creerVerrouMemoire();
    const a = await Session.ouvrir(new Depot(stockage), null, { verrou });
    const b = await Session.ouvrir(new Depot(stockage), null, { verrou });
    await a.trouverInscription('pendus');
    await b.trouverInscription('chaumes');
    const relue = await Session.ouvrir(new Depot(stockage), null, { verrou });
    expect(relue.sauvegarde.meta.inscriptions).toEqual(['chaumes', 'pendus']);
  });

  it('survit à l’export et à l’import du code de sauvegarde', async () => {
    const source = apresAvoirTrouve(sauvegardeRemplie(), 'etang');
    const importee = await importerCode(await exporterCode(source));
    if (!importee.ok) throw new Error(importee.detail);
    expect(importee.sauvegarde.meta.inscriptions).toEqual(['chaumes', 'pendus', 'etang', 'choeur']);
    expect(remplacerProgression(importee.sauvegarde).meta.inscriptions).toEqual(source.meta.inscriptions);

    // Par la session : le code importé puis appliqué remplace la liste, qui reste ensuite dans le stockage.
    const stockage = new StockageMemoire();
    const verrou = creerVerrouMemoire();
    const session = await Session.ouvrir(new Depot(stockage), null, { verrou });
    expect(session.sauvegarde.meta.inscriptions).toEqual([]);
    const lue = await session.importer(await exporterCode(source));
    if (!lue.ok) throw new Error(lue.detail);
    expect(await session.appliquerImport(lue.sauvegarde)).toBe(true);
    const rouverte = await Session.ouvrir(new Depot(stockage), null, { verrou });
    expect(rouverte.sauvegarde.meta.inscriptions).toEqual(['chaumes', 'pendus', 'etang', 'choeur']);
  });

  it('un code dont les inscriptions sont inconnues est refusé', async () => {
    const forge = { ...sauvegardeRemplie(), partie: null };
    forge.meta = { ...forge.meta, inscriptions: ['chaumes', 'inconnue'] as unknown as Sauvegarde['meta']['inscriptions'] };
    expect(await importerCode(await exporterCode(forge))).toMatchObject({ ok: false, raison: 'donnees' });
  });
});

describe('fusion de deux sauvegardes', () => {
  it('réunit les inscriptions trouvées de part et d’autre', () => {
    const a = apresAvoirTrouve(sauvegardeVide(), 'gue');
    const b = apresAvoirTrouve(sauvegardeVide(), 'transept');
    const m = fusionnerProgressions(a, b);
    expect(m.meta.inscriptions).toEqual(['gue', 'transept']);
    expect(validerSauvegarde(m).ok).toBe(true);
  });

  it('ne change rien (même objet) quand la seconde n’apporte aucune inscription', () => {
    const a = apresAvoirTrouve(sauvegardeVide(), 'gue');
    expect(fusionnerProgressions(a, sauvegardeVide())).toBe(a);
  });
});
