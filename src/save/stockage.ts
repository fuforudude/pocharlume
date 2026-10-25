// Couche de stockage unique : un magasin de textes à clés, asynchrone. Le reste de la sauvegarde ne connaît que
// l'interface `Stockage`. Implémentations :
// - IndexedDB (navigateur, choix par défaut) ;
// - localStorage (repli si IndexedDB est indisponible : navigation privée ancienne, accès refusé) ;
// - mémoire (tests, et dernier repli : le jeu marche, la progression ne survit pas au rechargement).
// Plus tard : une implémentation sur Capacitor Preferences pour l'appli Android, qui implémente la même interface
// (get / set / remove) et se branche dans `ouvrirStockage` sans que le reste du code change.
//
// Les implémentations peuvent lever des erreurs (quota, accès refusé) : c'est le dépôt (depot.ts) qui les
// attrape, un stockage en panne ne doit jamais casser le jeu.

export interface Stockage {
  /** Rend le texte rangé sous cette clé, ou null s'il n'y en a pas. */
  get(cle: string): Promise<string | null>;
  set(cle: string, valeur: string): Promise<void>;
  remove(cle: string): Promise<void>;
}

/** Stockage en mémoire : tests et dernier repli. */
export class StockageMemoire implements Stockage {
  private readonly donnees = new Map<string, string>();

  get(cle: string): Promise<string | null> {
    return Promise.resolve(this.donnees.get(cle) ?? null);
  }

  set(cle: string, valeur: string): Promise<void> {
    this.donnees.set(cle, valeur);
    return Promise.resolve();
  }

  remove(cle: string): Promise<void> {
    this.donnees.delete(cle);
    return Promise.resolve();
  }
}

/** Stockage sur localStorage (ou tout objet de même forme). */
export class StockageLocalStorage implements Stockage {
  constructor(
    private readonly depot: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
    private readonly prefixe = 'pocharlume:',
  ) {}

  get(cle: string): Promise<string | null> {
    return new Promise((resolve) => {
      resolve(this.depot.getItem(this.prefixe + cle));
    });
  }

  set(cle: string, valeur: string): Promise<void> {
    return new Promise((resolve) => {
      this.depot.setItem(this.prefixe + cle, valeur);
      resolve();
    });
  }

  remove(cle: string): Promise<void> {
    return new Promise((resolve) => {
      this.depot.removeItem(this.prefixe + cle);
      resolve();
    });
  }
}

const NOM_BASE = 'pocharlume';
const NOM_MAGASIN = 'sauvegarde';

/** Stockage sur IndexedDB : une base, un magasin d'objets, les clés du `Stockage` comme clés. */
export class StockageIndexedDB implements Stockage {
  private constructor(private readonly base: IDBDatabase) {}

  /** Ouvre (et crée au besoin) la base. Échoue si IndexedDB refuse ou ne répond pas. */
  static ouvrir(fabrique: IDBFactory, nomBase = NOM_BASE): Promise<StockageIndexedDB> {
    return new Promise((resolve, reject) => {
      const requete = fabrique.open(nomBase, 1);
      requete.onupgradeneeded = () => {
        requete.result.createObjectStore(NOM_MAGASIN);
      };
      requete.onsuccess = () => {
        resolve(new StockageIndexedDB(requete.result));
      };
      requete.onerror = () => {
        reject(requete.error ?? new Error('IndexedDB : ouverture impossible'));
      };
      requete.onblocked = () => {
        reject(new Error('IndexedDB : ouverture bloquée'));
      };
    });
  }

  get(cle: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const requete = this.base.transaction(NOM_MAGASIN, 'readonly').objectStore(NOM_MAGASIN).get(cle);
      requete.onsuccess = () => {
        const valeur: unknown = requete.result;
        resolve(typeof valeur === 'string' ? valeur : null);
      };
      requete.onerror = () => {
        reject(requete.error ?? new Error('IndexedDB : lecture impossible'));
      };
    });
  }

  private ecrire(action: (magasin: IDBObjectStore) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.base.transaction(NOM_MAGASIN, 'readwrite');
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('IndexedDB : écriture impossible'));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('IndexedDB : écriture annulée'));
      };
      action(transaction.objectStore(NOM_MAGASIN));
    });
  }

  set(cle: string, valeur: string): Promise<void> {
    return this.ecrire((magasin) => {
      magasin.put(valeur, cle);
    });
  }

  remove(cle: string): Promise<void> {
    return this.ecrire((magasin) => {
      magasin.delete(cle);
    });
  }
}

/** Ce que `ouvrirStockage` essaie d'utiliser, dans l'ordre. Les tests le remplacent. */
export interface Environnement {
  readonly indexedDB?: IDBFactory | undefined;
  readonly localStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined;
}

function environnementDuNavigateur(): Environnement {
  // Lire ces globales peut elle-même lever (accès au stockage refusé par le navigateur).
  let idb: IDBFactory | undefined;
  let local: Storage | undefined;
  try {
    idb = typeof indexedDB === 'undefined' ? undefined : indexedDB;
  } catch {
    idb = undefined;
  }
  try {
    local = typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    local = undefined;
  }
  return { indexedDB: idb, localStorage: local };
}

/** Sonde d'écriture : un stockage qui ne sait ni écrire, ni relire, ni effacer n'est pas utilisable. */
async function sonde(stockage: Stockage): Promise<boolean> {
  try {
    await stockage.set('sonde', '1');
    const relu = await stockage.get('sonde');
    await stockage.remove('sonde');
    return relu === '1';
  } catch {
    return false;
  }
}

function avecDelai<T>(promesse: Promise<T>, delaiMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const minuteur = setTimeout(() => {
      reject(new Error('délai dépassé'));
    }, delaiMs);
    promesse.then(
      (valeur) => {
        clearTimeout(minuteur);
        resolve(valeur);
      },
      (erreur: unknown) => {
        clearTimeout(minuteur);
        reject(erreur instanceof Error ? erreur : new Error(String(erreur)));
      },
    );
  });
}

export type NomStockage = 'indexeddb' | 'localstorage' | 'memoire';

/**
 * Choisit le meilleur stockage disponible : IndexedDB, sinon localStorage, sinon mémoire. Ne lève jamais.
 * `nom` dit lequel a été retenu (pour avertir le joueur que sa progression ne sera pas gardée).
 */
export async function ouvrirStockage(env: Environnement = environnementDuNavigateur(), delaiMs = 3000): Promise<{ stockage: Stockage; nom: NomStockage }> {
  if (env.indexedDB) {
    const fabrique = env.indexedDB;
    try {
      // Certains navigateurs ne répondent jamais quand IndexedDB est désactivé : on n'attend pas indéfiniment.
      const idb = await avecDelai(
        (async () => {
          const ouvert = await StockageIndexedDB.ouvrir(fabrique);
          if (!(await sonde(ouvert))) throw new Error('IndexedDB inutilisable');
          return ouvert;
        })(),
        delaiMs,
      );
      return { stockage: idb, nom: 'indexeddb' };
    } catch {
      // On passe au repli suivant.
    }
  }
  if (env.localStorage) {
    const local = new StockageLocalStorage(env.localStorage);
    if (await sonde(local)) return { stockage: local, nom: 'localstorage' };
  }
  return { stockage: new StockageMemoire(), nom: 'memoire' };
}
