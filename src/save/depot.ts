// Dépôt de la sauvegarde : lit et écrit le document unique dans un `Stockage`, en toute sécurité.
// Règles : aucune méthode ne lève (un stockage en panne ne casse jamais le jeu) ; une sauvegarde illisible n'est
// jamais détruite sans copie de secours ; une sauvegarde d'une ancienne version est migrée après avoir gardé
// l'original ; les écritures sont mises en file pour ne pas s'entremêler.
import { sauvegardeVide, VERSION_SAUVEGARDE, type Sauvegarde } from './format';
import { migrer } from './migrations';
import type { Stockage } from './stockage';
import { validerSauvegarde } from './validation';

export const CLE_SAUVEGARDE = 'sauvegarde';
/** Copie du dernier contenu illisible (corrompu ou plus récent que le jeu), écrasée à chaque nouvel incident. */
export const CLE_SECOURS = 'sauvegarde.secours';
/** Copie de la dernière sauvegarde telle qu'elle était avant sa migration vers la version courante. */
export const CLE_AVANT_MIGRATION = 'sauvegarde.avant-migration';

/**
 * Comment s'est passé le chargement :
 * - `neuve` : rien n'était enregistré, nouveau joueur ;
 * - `chargee` : sauvegarde relue telle quelle ;
 * - `migree` : sauvegarde d'une ancienne version, migrée et réécrite ;
 * - `corrompue` : contenu illisible, gardé en copie de secours, on repart d'une sauvegarde vide ;
 * - `trop_recente` : écrite par une version plus récente du jeu, gardée en copie de secours, on repart de zéro ;
 * - `indisponible` : le stockage ne répond pas, on joue avec une sauvegarde vide qui ne sera sans doute pas gardée.
 */
export type OrigineChargement = 'neuve' | 'chargee' | 'migree' | 'corrompue' | 'trop_recente' | 'indisponible';

export interface Chargement {
  readonly sauvegarde: Sauvegarde;
  readonly origine: OrigineChargement;
}

/**
 * Ce que rend une relecture (`relire`) :
 * - `ok` : la sauvegarde enregistrée, migrée en mémoire si elle est ancienne ;
 * - `vide` : rien n'est enregistré ;
 * - `echec` : le stockage ne répond pas, on ne sait pas ce qu'il contient ;
 * - `illisible` : un contenu existe mais on ne sait pas le lire (corrompu, ou écrit par une version plus récente).
 */
export type Relecture =
  | { readonly etat: 'ok'; readonly sauvegarde: Sauvegarde }
  | { readonly etat: 'vide' }
  | { readonly etat: 'echec' }
  | { readonly etat: 'illisible' };

export class Depot {
  private file: Promise<unknown> = Promise.resolve();

  constructor(private readonly stockage: Stockage) {}

  /** Lit la sauvegarde. Rend toujours une sauvegarde valide. */
  async charger(): Promise<Chargement> {
    let brut: string | null;
    try {
      brut = await this.stockage.get(CLE_SAUVEGARDE);
    } catch {
      return { sauvegarde: sauvegardeVide(), origine: 'indisponible' };
    }
    if (brut === null) return { sauvegarde: sauvegardeVide(), origine: 'neuve' };

    let analyse: unknown;
    try {
      analyse = JSON.parse(brut);
    } catch {
      return this.repartir(brut, 'corrompue');
    }
    const migration = migrer(analyse);
    if (!migration.ok) return this.repartir(brut, migration.cause === 'trop_recente' ? 'trop_recente' : 'corrompue');
    if (migration.depuis < VERSION_SAUVEGARDE) {
      await this.essayer(() => this.stockage.set(CLE_AVANT_MIGRATION, brut));
      await this.essayer(() => this.stockage.set(CLE_SAUVEGARDE, JSON.stringify(migration.sauvegarde)));
      return { sauvegarde: migration.sauvegarde, origine: 'migree' };
    }
    return { sauvegarde: migration.sauvegarde, origine: 'chargee' };
  }

  /**
   * Relit l'état actuel du stockage, sans rien écrire ni mettre de côté (contrairement à `charger`). Sert à
   * fusionner avant une écriture, quand un autre onglet a pu écrire entre-temps.
   */
  async relire(): Promise<Relecture> {
    let brut: string | null;
    try {
      brut = await this.stockage.get(CLE_SAUVEGARDE);
    } catch {
      return { etat: 'echec' };
    }
    if (brut === null) return { etat: 'vide' };
    let analyse: unknown;
    try {
      analyse = JSON.parse(brut);
    } catch {
      return { etat: 'illisible' };
    }
    const migration = migrer(analyse);
    return migration.ok ? { etat: 'ok', sauvegarde: migration.sauvegarde } : { etat: 'illisible' };
  }

  /** Écrit la sauvegarde. Rend false si elle est invalide ou si le stockage refuse ; ne lève jamais. */
  enregistrer(sauvegarde: Sauvegarde): Promise<boolean> {
    if (!validerSauvegarde(sauvegarde).ok) return Promise.resolve(false);
    const texte = JSON.stringify(sauvegarde);
    return this.enfiler(() => this.stockage.set(CLE_SAUVEGARDE, texte));
  }

  /** Efface la sauvegarde (la copie de secours reste). */
  reinitialiser(): Promise<boolean> {
    return this.enfiler(() => this.stockage.remove(CLE_SAUVEGARDE));
  }

  /** Le contenu mis de côté lors du dernier incident, ou null. */
  async lireSecours(): Promise<string | null> {
    try {
      return await this.stockage.get(CLE_SECOURS);
    } catch {
      return null;
    }
  }

  private async repartir(brut: string, origine: 'corrompue' | 'trop_recente'): Promise<Chargement> {
    await this.essayer(() => this.stockage.set(CLE_SECOURS, brut));
    const vide = sauvegardeVide();
    await this.essayer(() => this.stockage.set(CLE_SAUVEGARDE, JSON.stringify(vide)));
    return { sauvegarde: vide, origine };
  }

  private async essayer(action: () => Promise<void>): Promise<boolean> {
    try {
      await action();
      return true;
    } catch {
      return false;
    }
  }

  private enfiler(action: () => Promise<void>): Promise<boolean> {
    const suite = this.file.then(() => this.essayer(action));
    this.file = suite;
    return suite;
  }
}
