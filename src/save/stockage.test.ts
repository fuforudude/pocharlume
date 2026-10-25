import { describe, expect, it } from 'vitest';
import {
  ouvrirStockage,
  StockageIndexedDB,
  StockageLocalStorage,
  StockageMemoire,
  type Environnement,
  type Stockage,
} from './stockage';

// --- Faux IndexedDB : juste ce que StockageIndexedDB utilise, avec des rappels asynchrones comme le vrai. ----

type Rappel = (() => void) | null;

class FausseRequete {
  onsuccess: Rappel = null;
  onerror: Rappel = null;
  onblocked: Rappel = null;
  onupgradeneeded: Rappel = null;
  result: unknown;
  error: DOMException | null = null;
}

class FausseTransaction {
  oncomplete: Rappel = null;
  onerror: Rappel = null;
  onabort: Rappel = null;
  error: DOMException | null = null;

  constructor(
    private readonly donnees: Map<string, unknown>,
    private readonly mode: 'readonly' | 'readwrite',
    private readonly panne: { ecriture: boolean; lecture: boolean },
  ) {}

  objectStore(): unknown {
    const fin = (): void => {
      queueMicrotask(() => {
        if (this.panne.ecriture) {
          this.error = new DOMException('quota dépassé', 'QuotaExceededError');
          this.onabort?.();
        } else {
          this.oncomplete?.();
        }
      });
    };
    return {
      get: (cle: string) => {
        const requete = new FausseRequete();
        queueMicrotask(() => {
          if (this.panne.lecture) {
            requete.error = new DOMException('lecture impossible', 'UnknownError');
            requete.onerror?.();
          } else {
            requete.result = this.donnees.get(cle);
            requete.onsuccess?.();
          }
        });
        return requete;
      },
      put: (valeur: unknown, cle: string) => {
        if (this.mode !== 'readwrite') throw new Error('transaction en lecture seule');
        if (!this.panne.ecriture) this.donnees.set(cle, valeur);
        fin();
      },
      delete: (cle: string) => {
        if (this.mode !== 'readwrite') throw new Error('transaction en lecture seule');
        if (!this.panne.ecriture) this.donnees.delete(cle);
        fin();
      },
    };
  }
}

interface FausseBase {
  fabrique: IDBFactory;
  donnees: Map<string, unknown>;
  panne: { ecriture: boolean; lecture: boolean; ouverture: boolean; silence: boolean };
  ouvertures: number;
}

function fausseBase(): FausseBase {
  const donnees = new Map<string, unknown>();
  const panne = { ecriture: false, lecture: false, ouverture: false, silence: false };
  const etat: FausseBase = { fabrique: undefined as unknown as IDBFactory, donnees, panne, ouvertures: 0 };
  const base = {
    createObjectStore: () => ({}),
    transaction: (_nom: string, mode: 'readonly' | 'readwrite') => new FausseTransaction(donnees, mode, panne),
  };
  etat.fabrique = {
    open: () => {
      etat.ouvertures++;
      const requete = new FausseRequete();
      requete.result = base;
      queueMicrotask(() => {
        if (panne.silence) return;
        if (panne.ouverture) {
          requete.error = new DOMException('accès refusé', 'SecurityError');
          requete.onerror?.();
          return;
        }
        requete.onupgradeneeded?.();
        requete.onsuccess?.();
      });
      return requete;
    },
  } as unknown as IDBFactory;
  return etat;
}

function fauxLocalStorage(options: { refuseEcriture?: boolean } = {}): Environnement['localStorage'] & { contenu: Map<string, string> } {
  const contenu = new Map<string, string>();
  return {
    contenu,
    getItem: (cle: string) => contenu.get(cle) ?? null,
    setItem: (cle: string, valeur: string) => {
      if (options.refuseEcriture) throw new DOMException('quota', 'QuotaExceededError');
      contenu.set(cle, valeur);
    },
    removeItem: (cle: string) => {
      contenu.delete(cle);
    },
  };
}

async function verifierContrat(stockage: Stockage): Promise<void> {
  expect(await stockage.get('a')).toBeNull();
  await stockage.set('a', 'un');
  await stockage.set('b', 'deux');
  expect(await stockage.get('a')).toBe('un');
  await stockage.set('a', 'trois');
  expect(await stockage.get('a')).toBe('trois');
  expect(await stockage.get('b')).toBe('deux');
  await stockage.remove('a');
  expect(await stockage.get('a')).toBeNull();
  expect(await stockage.get('b')).toBe('deux');
  await stockage.remove('inconnue');
  await stockage.set('vide', '');
  expect(await stockage.get('vide')).toBe('');
  const long = 'é'.repeat(100_000);
  await stockage.set('long', long);
  expect(await stockage.get('long')).toBe(long);
}

describe('implémentations de Stockage', () => {
  it('mémoire : respecte le contrat', async () => {
    await verifierContrat(new StockageMemoire());
  });

  it('localStorage : respecte le contrat et range sous un préfixe', async () => {
    const local = fauxLocalStorage();
    await verifierContrat(new StockageLocalStorage(local));
    expect([...local.contenu.keys()].every((cle) => cle.startsWith('pocharlume:'))).toBe(true);
  });

  it('IndexedDB : respecte le contrat', async () => {
    const base = fausseBase();
    await verifierContrat(await StockageIndexedDB.ouvrir(base.fabrique));
  });

  it('IndexedDB : une valeur qui n’est pas un texte est lue comme absente', async () => {
    const base = fausseBase();
    const idb = await StockageIndexedDB.ouvrir(base.fabrique);
    base.donnees.set('x', 42);
    expect(await idb.get('x')).toBeNull();
  });

  it('IndexedDB : les erreurs de lecture, d’écriture et d’ouverture sont des promesses rejetées', async () => {
    const base = fausseBase();
    const idb = await StockageIndexedDB.ouvrir(base.fabrique);
    base.panne.lecture = true;
    await expect(idb.get('a')).rejects.toThrow();
    base.panne.lecture = false;
    base.panne.ecriture = true;
    await expect(idb.set('a', 'x')).rejects.toThrow();
    await expect(idb.remove('a')).rejects.toThrow();
    base.panne.ouverture = true;
    await expect(StockageIndexedDB.ouvrir(base.fabrique)).rejects.toThrow();
  });

  it('localStorage : les erreurs sont des promesses rejetées, pas des exceptions', async () => {
    const local = fauxLocalStorage({ refuseEcriture: true });
    const stockage = new StockageLocalStorage(local);
    await expect(stockage.set('a', 'x')).rejects.toThrow();
  });
});

describe('choix du stockage', () => {
  it('prend IndexedDB quand il marche', async () => {
    const base = fausseBase();
    const { stockage, nom } = await ouvrirStockage({ indexedDB: base.fabrique, localStorage: fauxLocalStorage() });
    expect(nom).toBe('indexeddb');
    await stockage.set('a', 'b');
    expect(await stockage.get('a')).toBe('b');
  });

  it('se replie sur localStorage si IndexedDB est absent, refuse l’ouverture, refuse d’écrire ou ne répond pas', async () => {
    const refus = fausseBase();
    refus.panne.ouverture = true;
    const quota = fausseBase();
    quota.panne.ecriture = true;
    const muet = fausseBase();
    muet.panne.silence = true;
    for (const idb of [undefined, refus.fabrique, quota.fabrique, muet.fabrique]) {
      const local = fauxLocalStorage();
      const { stockage, nom } = await ouvrirStockage({ indexedDB: idb, localStorage: local }, 30);
      expect(nom).toBe('localstorage');
      await stockage.set('a', 'b');
      expect(await stockage.get('a')).toBe('b');
    }
  });

  it('se replie sur la mémoire quand rien ne marche, sans lever', async () => {
    const refus = fausseBase();
    refus.panne.ouverture = true;
    for (const env of [{}, { indexedDB: refus.fabrique, localStorage: fauxLocalStorage({ refuseEcriture: true }) }, { localStorage: fauxLocalStorage({ refuseEcriture: true }) }]) {
      const { stockage, nom } = await ouvrirStockage(env, 30);
      expect(nom).toBe('memoire');
      await stockage.set('a', 'b');
      expect(await stockage.get('a')).toBe('b');
    }
  });

  it('sans environnement donné, s’adapte à celui où il tourne sans lever, et rend un stockage utilisable', async () => {
    const { stockage } = await ouvrirStockage();
    await stockage.set('essai', 'ok');
    expect(await stockage.get('essai')).toBe('ok');
    await stockage.remove('essai');
  });
});
