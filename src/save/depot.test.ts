import { describe, expect, it } from 'vitest';
import { FIXTURE_V1, sauvegardeRemplie, StockageTruque, variante } from './aides.test-utils';
import { CLE_AVANT_MIGRATION, CLE_SAUVEGARDE, CLE_SECOURS, Depot } from './depot';
import { sauvegardeVide, VERSION_SAUVEGARDE } from './format';
import { enregistrerVictoire } from './progression';
import { StockageMemoire } from './stockage';

describe('dépôt de la sauvegarde', () => {
  it('un nouveau joueur reçoit une sauvegarde vide, sans que rien ne soit écrit', async () => {
    const stockage = new StockageTruque();
    const { sauvegarde, origine } = await new Depot(stockage).charger();
    expect(origine).toBe('neuve');
    expect(sauvegarde).toEqual(sauvegardeVide());
    expect(stockage.ecritures).toBe(0);
  });

  it('la progression survit à un rechargement (nouveau dépôt sur le même stockage)', async () => {
    const stockage = new StockageMemoire();
    let s = (await new Depot(stockage).charger()).sauvegarde;
    s = enregistrerVictoire(s, 1, 'matou', 3);
    s = enregistrerVictoire(s, 2, 'chaton', 2);
    expect(await new Depot(stockage).enregistrer(s)).toBe(true);
    const relue = await new Depot(stockage).charger();
    expect(relue.origine).toBe('chargee');
    expect(relue.sauvegarde).toEqual(s);
    expect(relue.sauvegarde.progression.niveauMax).toBe(3);
  });

  it('range et relit aussi la partie en cours et les réglages', async () => {
    const stockage = new StockageMemoire();
    const s = sauvegardeRemplie();
    await new Depot(stockage).enregistrer(s);
    expect((await new Depot(stockage).charger()).sauvegarde).toEqual(s);
  });

  describe('sauvegarde corrompue', () => {
    const corrompues: [string, string][] = [
      ['du texte quelconque', 'pas du json {{'],
      ['du JSON tronqué', JSON.stringify(sauvegardeRemplie()).slice(0, 100)],
      ['du JSON qui n’est pas une sauvegarde', '[1,2,3]'],
      ['du JSON null', 'null'],
      ['une sauvegarde aux valeurs hors bornes', JSON.stringify(variante({ 'reglages.son': 900 }))],
      ['une sauvegarde sans version', JSON.stringify(variante({ version: undefined }))],
      ['une v1 abîmée', '{"version":1,"progression":{"niveauMax":"x","etoiles":{}},"reglages":{},"partie":null}'],
      ['une chaîne vide', ''],
    ];
    for (const [nom, contenu] of corrompues) {
      it(`${nom} : copie de secours, puis on repart d’une sauvegarde vide`, async () => {
        const stockage = new StockageTruque();
        stockage.donnees.set(CLE_SAUVEGARDE, contenu);
        const depot = new Depot(stockage);
        const { sauvegarde, origine } = await depot.charger();
        expect(origine).toBe('corrompue');
        expect(sauvegarde).toEqual(sauvegardeVide());
        expect(stockage.donnees.get(CLE_SECOURS)).toBe(contenu);
        expect(await depot.lireSecours()).toBe(contenu);
        // Le rechargement suivant repart proprement, sans nouvel incident.
        const suite = await new Depot(stockage).charger();
        expect(suite.origine).toBe('chargee');
        expect(suite.sauvegarde).toEqual(sauvegardeVide());
        expect(stockage.donnees.get(CLE_SECOURS)).toBe(contenu);
      });
    }

    it('garde la copie de secours même si on ne peut pas réécrire la sauvegarde propre', async () => {
      const stockage = new StockageTruque();
      stockage.donnees.set(CLE_SAUVEGARDE, 'abîmée');
      stockage.panneEcriture = true;
      const { sauvegarde, origine } = await new Depot(stockage).charger();
      expect(origine).toBe('corrompue');
      expect(sauvegarde).toEqual(sauvegardeVide());
    });
  });

  it('une sauvegarde écrite par un jeu plus récent est mise de côté, jamais perdue', async () => {
    const stockage = new StockageTruque();
    const future = JSON.stringify({ version: VERSION_SAUVEGARDE + 1, donnees: 'nouvelles' });
    stockage.donnees.set(CLE_SAUVEGARDE, future);
    const { origine, sauvegarde } = await new Depot(stockage).charger();
    expect(origine).toBe('trop_recente');
    expect(sauvegarde).toEqual(sauvegardeVide());
    expect(stockage.donnees.get(CLE_SECOURS)).toBe(future);
  });

  it('migre une sauvegarde v1, garde l’original, et réécrit la version courante', async () => {
    const stockage = new StockageTruque();
    stockage.donnees.set(CLE_SAUVEGARDE, FIXTURE_V1);
    const { sauvegarde, origine } = await new Depot(stockage).charger();
    expect(origine).toBe('migree');
    expect(sauvegarde.version).toBe(VERSION_SAUVEGARDE);
    expect(sauvegarde.progression.niveauMax).toBe(4);
    expect(stockage.donnees.get(CLE_AVANT_MIGRATION)).toBe(FIXTURE_V1);
    const stockee = JSON.parse(stockage.donnees.get(CLE_SAUVEGARDE) ?? '') as { version: number };
    expect(stockee.version).toBe(VERSION_SAUVEGARDE);
    const suite = await new Depot(stockage).charger();
    expect(suite.origine).toBe('chargee');
    expect(suite.sauvegarde).toEqual(sauvegarde);
  });

  it('migre quand même si on ne peut pas réécrire (le stockage est en lecture seule)', async () => {
    const stockage = new StockageTruque();
    stockage.donnees.set(CLE_SAUVEGARDE, FIXTURE_V1);
    stockage.panneEcriture = true;
    const { sauvegarde, origine } = await new Depot(stockage).charger();
    expect(origine).toBe('migree');
    expect(sauvegarde.progression.niveauMax).toBe(4);
    expect(stockage.donnees.get(CLE_SAUVEGARDE)).toBe(FIXTURE_V1);
  });

  describe('stockage en panne : le jeu continue', () => {
    it('lecture impossible : sauvegarde vide, origine « indisponible », rien n’est écrasé', async () => {
      const stockage = new StockageTruque();
      stockage.donnees.set(CLE_SAUVEGARDE, JSON.stringify(sauvegardeRemplie()));
      stockage.panneLecture = true;
      const depot = new Depot(stockage);
      const { sauvegarde, origine } = await depot.charger();
      expect(origine).toBe('indisponible');
      expect(sauvegarde).toEqual(sauvegardeVide());
      expect(stockage.ecritures).toBe(0);
      expect(await depot.lireSecours()).toBeNull();
    });

    it('écriture impossible : enregistrer rend false sans lever', async () => {
      const stockage = new StockageTruque();
      stockage.panneEcriture = true;
      const depot = new Depot(stockage);
      expect(await depot.enregistrer(sauvegardeRemplie())).toBe(false);
      expect(await depot.reinitialiser()).toBe(false);
      stockage.panneEcriture = false;
      expect(await depot.enregistrer(sauvegardeRemplie())).toBe(true);
    });

    it('un stockage qui lève de façon synchrone est aussi attrapé', async () => {
      const depot = new Depot({
        get: () => {
          throw new Error('boum');
        },
        set: () => {
          throw new Error('boum');
        },
        remove: () => {
          throw new Error('boum');
        },
      });
      expect((await depot.charger()).origine).toBe('indisponible');
      expect(await depot.enregistrer(sauvegardeVide())).toBe(false);
      expect(await depot.reinitialiser()).toBe(false);
      expect(await depot.lireSecours()).toBeNull();
    });
  });

  it('refuse d’écrire une sauvegarde invalide, sans rien toucher au stockage', async () => {
    const stockage = new StockageTruque();
    const depot = new Depot(stockage);
    await depot.enregistrer(sauvegardeRemplie());
    const avant = stockage.donnees.get(CLE_SAUVEGARDE);
    const mauvaise = { ...sauvegardeRemplie(), reglages: { son: 1000, musique: 0, vitesse: 1 as const } };
    expect(await depot.enregistrer(mauvaise)).toBe(false);
    expect(stockage.donnees.get(CLE_SAUVEGARDE)).toBe(avant);
  });

  it('réinitialiser efface la sauvegarde mais garde la copie de secours', async () => {
    const stockage = new StockageTruque();
    stockage.donnees.set(CLE_SAUVEGARDE, 'abîmée');
    const depot = new Depot(stockage);
    await depot.charger();
    expect(await depot.reinitialiser()).toBe(true);
    expect(stockage.donnees.has(CLE_SAUVEGARDE)).toBe(false);
    expect(stockage.donnees.get(CLE_SECOURS)).toBe('abîmée');
    expect((await depot.charger()).origine).toBe('neuve');
  });

  it('range les écritures dans l’ordre, même lancées sans attendre : la dernière gagne', async () => {
    const stockage = new StockageMemoire();
    const depot = new Depot(stockage);
    let s = sauvegardeVide();
    const promesses: Promise<boolean>[] = [];
    for (let n = 1; n <= 10; n++) {
      s = enregistrerVictoire(s, n, 'matou', 3);
      promesses.push(depot.enregistrer(s));
    }
    expect(await Promise.all(promesses)).toEqual(Array.from({ length: 10 }, () => true));
    expect((await depot.charger()).sauvegarde.progression.niveauMax).toBe(11);
  });
});
