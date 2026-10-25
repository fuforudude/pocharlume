// Session de jeu : la sauvegarde courante en mémoire, et chaque changement écrit aussitôt dans le dépôt.
// L'interface ne parle qu'à elle : victoire, partie en cours, réglages, export et import. Jamais d'exception
// (le dépôt n'en lève pas) ; une écriture qui échoue rend false, le jeu continue avec la sauvegarde en mémoire.
//
// Avant chaque écriture, la session relit le stockage et fusionne la progression (la plus haute gagne) : un
// onglet ancien n'efface pas une victoire faite dans un autre, et un démarrage dont la lecture avait échoué
// n'écrase pas la sauvegarde qui existait. Si le stockage ne répond toujours pas alors qu'on ne sait pas ce
// qu'il contient, ou si son contenu est illisible, rien n'est écrit (on garde ce qu'on ne sait pas relire).
import type { ConfigPartie, EtatPartie } from '../engine/etat';
import type { CanalSauvegarde } from './canal';
import { exporterCode, importerCode, remplacerProgression, type ResultatImport } from './code';
import type { Chargement, Depot, OrigineChargement } from './depot';
import { DIFFICULTES_SAUVEGARDE, type DifficulteSauvegarde, type Reglages, type Sauvegarde } from './format';
import { avecPartieEnCours, partieEnCours, reprendrePartie } from './partie';
import { changerReglages, enregistrerVictoire, fusionnerProgressions } from './progression';

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

/** Ce que l'accueil doit savoir de la partie en cours : de quoi proposer la reprise, ou prévenir qu'elle est perdue. */
export interface ExamenPartie {
  readonly reprise: Reprise | null;
  /** Une partie était enregistrée mais ne se relit plus (autres données de jeu, état abîmé) : elle vient d'être oubliée. */
  readonly oubliee: boolean;
}

/** La difficulté de la config si c'en est une que la sauvegarde connaît. */
export function difficulteDe(config: ConfigPartie): DifficulteSauvegarde | null {
  return DIFFICULTES_SAUVEGARDE.find((d) => d === config.difficulte) ?? null;
}

export class Session {
  /** Comment la sauvegarde a été chargée (pour avertir le joueur d'une sauvegarde illisible). */
  readonly origine: OrigineChargement;
  private courante: Sauvegarde;
  /**
   * Vrai quand on sait ce que contient le stockage (lecture réussie au démarrage ou depuis). Faux après un
   * démarrage dont la lecture a échoué : tant que la relecture échoue aussi, on n'écrit rien.
   */
  private contenuConnu: boolean;
  /** Les écritures se font une par une : relire, fusionner et écrire ne s'entremêlent pas. */
  private file: Promise<unknown> = Promise.resolve();

  private constructor(
    private readonly depot: Depot,
    chargement: Chargement,
    private readonly canal: CanalSauvegarde | null,
  ) {
    this.courante = chargement.sauvegarde;
    this.origine = chargement.origine;
    this.contenuConnu = chargement.origine !== 'indisponible';
    canal?.ecouter(() => { void this.rafraichir(); });
  }

  /** `canal` : la diffusion entre onglets (voir canal.ts), absente si le navigateur ne la propose pas. */
  static async ouvrir(depot: Depot, canal: CanalSauvegarde | null = null): Promise<Session> {
    return new Session(depot, await depot.charger(), canal);
  }

  get sauvegarde(): Sauvegarde {
    return this.courante;
  }

  /** Ferme le canal de diffusion ; la session reste utilisable. */
  fermer(): void {
    this.canal?.fermer();
  }

  /**
   * Prend `suivante` comme sauvegarde courante tout de suite (l'interface la lit aussitôt), puis l'écrit à son tour
   * dans la file. `fusion` à faux (import) : on remplace sans relire, c'est voulu.
   */
  private ecrire(suivante: Sauvegarde, fusion = true): Promise<boolean> {
    if (suivante === this.courante) return Promise.resolve(true);
    this.courante = suivante;
    const ecriture = this.file.then(() => this.persister(fusion));
    this.file = ecriture;
    return ecriture;
  }

  private async persister(fusion: boolean): Promise<boolean> {
    if (fusion) {
      const lecture = await this.depot.relire();
      switch (lecture.etat) {
        case 'ok':
          this.courante = fusionnerProgressions(this.courante, lecture.sauvegarde);
          this.contenuConnu = true;
          break;
        case 'vide':
          this.contenuConnu = true;
          break;
        case 'echec':
          // On ne sait pas ce que le stockage contient : si on ne l'a jamais su, on n'écrase pas.
          if (!this.contenuConnu) return false;
          break;
        case 'illisible':
          return false;
      }
    } else {
      this.contenuConnu = true;
    }
    const ok = await this.depot.enregistrer(this.courante);
    if (ok) this.canal?.publier();
    return ok;
  }

  /** Un autre onglet a écrit : on reprend sa progression si elle va plus loin que la nôtre. Rien n'est écrit. */
  private async rafraichir(): Promise<void> {
    const lecture = await this.depot.relire();
    if (lecture.etat !== 'ok') return;
    this.contenuConnu = true;
    this.courante = fusionnerProgressions(this.courante, lecture.sauvegarde);
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
   * La partie à reprendre, si elle existe et se relit, et si une partie enregistrée a été oubliée faute de pouvoir
   * se relire (autres données de jeu, état abîmé) : elle n'est alors plus proposée à chaque démarrage.
   */
  examinerPartie(): ExamenPartie {
    const partie = this.courante.partie;
    if (!partie) return { reprise: null, oubliee: false };
    const etat = reprendrePartie(partie);
    if (!etat) {
      void this.effacerPartie();
      return { reprise: null, oubliee: true };
    }
    return { reprise: { niveau: partie.niveau, vague: partie.vague, etat }, oubliee: false };
  }

  /** La partie à reprendre, ou null (voir `examinerPartie`). */
  partieAReprendre(): Reprise | null {
    return this.examinerPartie().reprise;
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
    return this.ecrire(remplacerProgression(importee), false);
  }
}
