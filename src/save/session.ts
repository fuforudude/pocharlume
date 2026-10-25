// Session de jeu : la sauvegarde courante en mémoire, et chaque changement écrit aussitôt dans le dépôt.
// L'interface ne parle qu'à elle : victoire, partie en cours, réglages, export et import. Jamais d'exception
// (le dépôt n'en lève pas) ; une écriture qui échoue rend false, le jeu continue avec la sauvegarde en mémoire.
import type { ConfigPartie, EtatPartie } from '../engine/etat';
import { exporterCode, importerCode, remplacerProgression, type ResultatImport } from './code';
import type { Chargement, Depot, OrigineChargement } from './depot';
import { DIFFICULTES_SAUVEGARDE, type DifficulteSauvegarde, type Reglages, type Sauvegarde } from './format';
import { avecPartieEnCours, partieEnCours, reprendrePartie } from './partie';
import { changerReglages, enregistrerVictoire } from './progression';

/** Ce que la session a besoin de savoir d'une partie terminée (un sous-ensemble du `ResultatPartie` de l'interface). */
export interface FinDePartie {
  readonly niveau: number;
  readonly statut: 'victoire' | 'defaite';
  readonly etoiles: number;
  readonly config: ConfigPartie;
}

/** Une partie sauvegardée qu'on peut relancer. */
export interface Reprise {
  readonly niveau: number;
  /** Numéro de la vague à laquelle la partie reprend. */
  readonly vague: number;
  readonly etat: EtatPartie;
}

/** La difficulté de la config si c'en est une que la sauvegarde connaît. */
export function difficulteDe(config: ConfigPartie): DifficulteSauvegarde | null {
  return DIFFICULTES_SAUVEGARDE.find((d) => d === config.difficulte) ?? null;
}

export class Session {
  /** Comment la sauvegarde a été chargée (pour avertir le joueur d'une sauvegarde illisible). */
  readonly origine: OrigineChargement;
  private courante: Sauvegarde;

  private constructor(
    private readonly depot: Depot,
    chargement: Chargement,
  ) {
    this.courante = chargement.sauvegarde;
    this.origine = chargement.origine;
  }

  static async ouvrir(depot: Depot): Promise<Session> {
    return new Session(depot, await depot.charger());
  }

  get sauvegarde(): Sauvegarde {
    return this.courante;
  }

  private ecrire(suivante: Sauvegarde): Promise<boolean> {
    if (suivante === this.courante) return Promise.resolve(true);
    this.courante = suivante;
    return this.depot.enregistrer(suivante);
  }

  /**
   * Une partie est finie : une victoire enregistre le meilleur résultat et débloque le niveau suivant ; dans
   * tous les cas la partie en cours est effacée (elle n'a plus rien à reprendre).
   */
  terminerPartie(fin: FinDePartie): Promise<boolean> {
    let suivante = this.courante;
    const difficulte = difficulteDe(fin.config);
    if (fin.statut === 'victoire' && difficulte) suivante = enregistrerVictoire(suivante, fin.niveau, difficulte, fin.etoiles);
    return this.ecrire(avecPartieEnCours(suivante, null));
  }

  /** Range l'instantané de la partie, à appeler au début d'une vague. Rien n'est écrit si la partie n'a pas d'instantané valide. */
  rangerPartie(etat: EtatPartie, numeroNiveau: number): Promise<boolean> {
    const partie = partieEnCours(etat, numeroNiveau);
    return partie ? this.ecrire(avecPartieEnCours(this.courante, partie)) : Promise.resolve(false);
  }

  /** Abandon : la partie en cours est oubliée. */
  effacerPartie(): Promise<boolean> {
    if (this.courante.partie === null) return Promise.resolve(true);
    return this.ecrire(avecPartieEnCours(this.courante, null));
  }

  /**
   * La partie à reprendre, si elle existe et se relit. Une partie illisible (autres données de jeu, état
   * abîmé) est oubliée pour ne pas être proposée à chaque démarrage.
   */
  partieAReprendre(): Reprise | null {
    const partie = this.courante.partie;
    if (!partie) return null;
    const etat = reprendrePartie(partie);
    if (!etat) {
      void this.effacerPartie();
      return null;
    }
    return { niveau: partie.niveau, vague: partie.vague, etat };
  }

  changerReglages(changements: Partial<Reglages>): Promise<boolean> {
    return this.ecrire(changerReglages(this.courante, changements));
  }

  /** Le code qui redonne la progression et les réglages. */
  exporter(): Promise<string> {
    return exporterCode(this.courante);
  }

  /** Lit un code sans rien changer : à l'appelant de demander confirmation, puis d'appeler `appliquerImport`. */
  importer(code: string): Promise<ResultatImport> {
    return importerCode(code);
  }

  /** Remplace la progression et les réglages par ceux d'un import réussi (la partie en cours est abandonnée). */
  appliquerImport(importee: Sauvegarde): Promise<boolean> {
    return this.ecrire(remplacerProgression(importee));
  }
}
