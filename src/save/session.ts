// Session de jeu : la sauvegarde courante en mémoire, et chaque changement écrit aussitôt dans le dépôt.
// L'interface ne parle qu'à elle : victoire, partie en cours, réglages, achats et choix de la méta-progression,
// export et import. Jamais d'exception (le dépôt n'en lève pas) ; une écriture qui échoue est signalée (`ecrite` à
// faux, ou false), le jeu continue avec la sauvegarde en mémoire.
//
// Règle multi-onglets : LE STOCKAGE FAIT FOI, ET LES OPÉRATIONS SE REJOUENT DESSUS.
// Un changement n'est pas une sauvegarde qu'on écrit en fusionnant « la plus haute gagne » (ce qui conviendrait aux
// étoiles, qui ne font que monter, mais pas aux monnaies, qui se dépensent) : c'est une opération pure
// (sauvegarde -> sauvegarde) que la session applique deux fois.
//   1. tout de suite à la sauvegarde en mémoire, pour que l'interface réagisse (et refuse sur-le-champ ce qui est
//      impossible) ;
//   2. au moment d'écrire, sous le verrou des onglets, à ce que le stockage contient *maintenant* : on relit, on
//      rejoue l'opération sur ce contenu frais, on écrit le résultat.
// Un achat fait depuis une vue périmée est donc revalidé contre la réalité : si l'autre onglet a déjà dépensé les
// braises ou acheté le disciple, l'opération est refusée (raison habituelle, ou `modifie_ailleurs` pour un rang ou
// un point visé sur une valeur qui a changé) et rien n'est débité deux fois ; si l'autre onglet a acheté autre chose,
// son achat est dans le contenu relu et notre opération s'ajoute par-dessus : rien n'est perdu. Monnaie et achat vivent
// dans le même document, écrit d'un bloc : on ne peut jamais payer sans recevoir.
// Les opérations dont l'écriture a échoué restent « en attente » et sont rejouées avec l'écriture suivante (une seule
// fois : on les retire dès qu'une écriture réussit).
// Limite : sans Web Locks (navigateur ancien), deux onglets qui écrivent à la milliseconde près peuvent s'écraser
// l'un l'autre ; l'écrasé perd alors son opération entière (monnaie et achat ensemble, donc rien de débité à tort),
// sa vue se corrige au message suivant du canal. Avec le verrou, ce cas n'existe pas.
//
// Si le stockage ne répond pas alors qu'on ne sait pas ce qu'il contient (démarrage dont la lecture avait échoué),
// ou si son contenu est illisible, rien n'est écrit (on garde ce qu'on ne sait pas relire).
import { estIdBranche, estIdHeros } from '../data/meta';
import type { ConfigPartie, EtatPartie } from '../engine/etat';
import type { CanalSauvegarde } from './canal';
import { exporterCode, importerCode, remplacerProgression, type ResultatImport } from './code';
import type { DefsMeta } from './definitions';
import type { Chargement, Depot, OrigineChargement } from './depot';
import { DIFFICULTES_SAUVEGARDE, type DifficulteSauvegarde, type Reglages, type Sauvegarde } from './format';
import { avecPartieEnCours, partieEnCours, reprendrePartie } from './partie';
import { changerReglages } from './progression';
import {
  acheterDisciple,
  acheterObjet,
  acheterRangArbre,
  choisirHeros,
  debiterObjetsDePartie,
  enregistrerFinDePartie,
  equiperObjets,
  reinitialiserArbre,
  reinitialiserPoints,
  repartirPoint,
  type BilanPartie,
  type RaisonAchatObjet,
  type RaisonArbre,
  type RaisonChoix,
  type RaisonDisciple,
  type RaisonEquipement,
  type RaisonFin,
  type RaisonPoint,
  type RaisonPoints,
  type RaisonReinitialisation,
} from './transactions';
import { ouvrirVerrouNavigateur, type VerrouSauvegarde } from './verrou';

/** Ce que la session a besoin de savoir d'une partie terminée (un sous-ensemble du `ResultatPartie` de l'interface). */
export interface FinDePartie {
  readonly niveau: number;
  /** `abandon` : le joueur a quitté avant la fin (ni expérience ni récompense ; les objets non utilisés sont rendus). */
  readonly statut: 'victoire' | 'defaite' | 'abandon';
  readonly etoiles: number;
  readonly config: ConfigPartie;
  /** Héros joué, qui reçoit l'expérience. Par défaut, celui de la config du moteur (`config.heros`) s'il y en a un. */
  readonly heros?: string | null;
  /** Objets emportés. Par défaut, ceux de la config du moteur (`config.objets`). */
  readonly objetsEquipes?: readonly string[];
  /** Objets utilisés pendant la partie (un par emplacement utilisé) : consommés ; les autres objets emportés sont rendus. */
  readonly objetsUtilises?: readonly string[];
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

/**
 * Résultat d'une transaction de la méta-progression. En cas de succès, `sauvegarde` est la sauvegarde courante après
 * l'opération et `ecrite` dit si le stockage l'a prise (faux : gardée en mémoire, écrite avec la prochaine écriture
 * réussie). `modifie_ailleurs` : un autre onglet a changé la valeur visée entre-temps ; la vue est déjà à jour,
 * l'utilisateur peut réessayer. `definitions_absentes` : la session n'a pas reçu les définitions des héros.
 */
export type ResultatTransaction<R extends string> =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly ecrite: boolean }
  | { readonly ok: false; readonly raison: R };

/** Ce que rend `enregistrerFin` : toujours la partie effacée ; le bilan, ou la raison pour laquelle les gains sont refusés. */
export interface ResultatFin {
  readonly ecrite: boolean;
  readonly bilan: BilanPartie | null;
  readonly refus: RaisonFin | null;
}

export interface OptionsSession {
  /**
   * Verrou entre onglets. Par défaut Web Locks du navigateur s'il existe ; `null` : aucun (seule la file interne de la
   * session protège).
   */
  readonly verrou?: VerrouSauvegarde | null;
  /** Compétences des héros et seuils d'expérience (de `src/data/heros.ts`) : pour placer des points et valider les imports. */
  readonly defs?: DefsMeta;
}

/** La difficulté de la config si c'en est une que la sauvegarde connaît. */
export function difficulteDe(config: ConfigPartie): DifficulteSauvegarde | null {
  return DIFFICULTES_SAUVEGARDE.find((d) => d === config.difficulte) ?? null;
}

// --- Opérations -----------------------------------------------------------------------------------------------

type ResultatOp<D, R extends string> =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly detail: D }
  | { readonly ok: false; readonly raison: R };

/** Un changement pur de la sauvegarde, rejouable sur n'importe quel contenu. */
type Operation<D, R extends string> = (s: Sauvegarde) => ResultatOp<D, R>;

/** Une opération dont l'écriture n'a pas encore réussi, avec le détail qu'elle avait donné sur la vue en mémoire. */
interface EnAttente {
  readonly op: Operation<unknown, string>;
  readonly detail: unknown;
}

type Issue<D, R extends string> =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly detail: D; readonly ecrite: boolean }
  | { readonly ok: false; readonly raison: R };

function reussite(sauvegarde: Sauvegarde): ResultatOp<undefined, never> {
  return { ok: true, sauvegarde, detail: undefined };
}

function depuisTransaction<R extends string>(t: { readonly ok: true; readonly sauvegarde: Sauvegarde } | { readonly ok: false; readonly raison: R }): ResultatOp<undefined, R> {
  return t.ok ? reussite(t.sauvegarde) : t;
}

function sansDetail<R extends string>(issue: Issue<undefined, R>): ResultatTransaction<R> {
  return issue.ok ? { ok: true, sauvegarde: issue.sauvegarde, ecrite: issue.ecrite } : issue;
}

function ecrite(issue: Issue<unknown, string>): boolean {
  return issue.ok && issue.ecrite;
}

/** Un champ facultatif de la config du moteur (le jalon 2 y ajoute `heros` et `objets`), lu sans en dépendre. */
function champ(config: ConfigPartie, nom: 'heros' | 'objets'): unknown {
  return Object.hasOwn(config, nom) ? (config as unknown as Record<string, unknown>)[nom] : undefined;
}

export class Session {
  /** Comment la sauvegarde a été chargée (pour avertir le joueur d'une sauvegarde illisible). */
  readonly origine: OrigineChargement;
  /** La sauvegarde en mémoire : le dernier contenu connu du stockage (`base`) avec par-dessus les opérations en attente. */
  private courante: Sauvegarde;
  /** Écouteurs de `surChangement`. */
  private readonly ecouteurs = new Set<() => void>();
  /** Le dernier contenu connu du stockage (lu ou écrit par cette session). */
  private base: Sauvegarde;
  /** Opérations appliquées en mémoire dont l'écriture n'a pas (encore) réussi, dans l'ordre. */
  private enAttente: EnAttente[] = [];
  /**
   * Vrai quand on sait ce que contient le stockage (lecture réussie au démarrage ou depuis). Faux après un
   * démarrage dont la lecture a échoué : tant que la relecture échoue aussi, on n'écrit rien.
   */
  private contenuConnu: boolean;
  /** Les écritures se font une par une : relire, rejouer et écrire ne s'entremêlent pas. */
  private file: Promise<unknown> = Promise.resolve();
  private readonly verrou: VerrouSauvegarde | null;
  private readonly defs: DefsMeta | undefined;

  private constructor(
    private readonly depot: Depot,
    chargement: Chargement,
    private readonly canal: CanalSauvegarde | null,
    options: OptionsSession,
  ) {
    this.courante = chargement.sauvegarde;
    this.base = chargement.sauvegarde;
    this.origine = chargement.origine;
    this.contenuConnu = chargement.origine !== 'indisponible';
    this.verrou = options.verrou === undefined ? ouvrirVerrouNavigateur() : options.verrou;
    this.defs = options.defs;
    canal?.ecouter(() => { this.rafraichir().catch(() => undefined); });
  }

  /** `canal` : la diffusion entre onglets (voir canal.ts), absente si le navigateur ne la propose pas. */
  static async ouvrir(depot: Depot, canal: CanalSauvegarde | null = null, options: OptionsSession = {}): Promise<Session> {
    return new Session(depot, await depot.charger(), canal, options);
  }

  get sauvegarde(): Sauvegarde {
    return this.courante;
  }

  /**
   * Appelle `ecouteur` chaque fois que la sauvegarde en mémoire change (opération de cette session, écriture ou
   * message d'un autre onglet). Rend la fonction qui retire l'écouteur. Un écouteur qui lève n'arrête personne.
   */
  surChangement(ecouteur: () => void): () => void {
    this.ecouteurs.add(ecouteur);
    return () => {
      this.ecouteurs.delete(ecouteur);
    };
  }

  private definirCourante(sauvegarde: Sauvegarde): void {
    this.courante = sauvegarde;
    for (const ecouteur of [...this.ecouteurs]) {
      try {
        ecouteur();
      } catch (erreur) {
        console.error(erreur);
      }
    }
  }

  /** Ferme le canal de diffusion ; la session reste utilisable. */
  fermer(): void {
    this.canal?.fermer();
  }

  // --- Mécanique d'écriture -----------------------------------------------------------------------------------

  /** La base avec les opérations en attente rejouées par-dessus (celles qui ne tiennent plus sont ignorées). */
  private rejouer(base: Sauvegarde): Sauvegarde {
    let etat = base;
    for (const { op } of this.enAttente) {
      const r = op(etat);
      if (r.ok) etat = r.sauvegarde;
    }
    return etat;
  }

  private sousVerrou<T>(travail: () => Promise<T>): Promise<T> {
    return this.verrou ? this.verrou.executer(travail) : travail();
  }

  /**
   * Applique `op` à la sauvegarde en mémoire tout de suite (l'interface la lit aussitôt), puis la met en file pour être
   * rejouée sur le stockage et écrite. Un refus sur la vue en mémoire est rendu sans rien mettre en file. `fusion` à
   * faux (import) : on n'a pas besoin de relire, l'opération remplace tout.
   */
  private lancer<D, R extends string>(op: Operation<D, R>, fusion = true): Promise<Issue<D, R>> {
    const optimiste = op(this.courante);
    if (!optimiste.ok) return Promise.resolve(optimiste);
    if (optimiste.sauvegarde === this.courante) return Promise.resolve({ ok: true, sauvegarde: this.courante, detail: optimiste.detail, ecrite: true });
    const entree: EnAttente = { op, detail: optimiste.detail };
    this.enAttente.push(entree);
    this.definirCourante(optimiste.sauvegarde);
    const ecriture = this.file.then(() => this.sousVerrou(() => this.persister<D, R>(entree, fusion)));
    // La file continue même si une écriture lève (verrou, stockage) : le rejet va à l'appelant, jamais aux suivantes.
    this.file = ecriture.catch(() => undefined);
    return ecriture;
  }

  private async persister<D, R extends string>(entree: EnAttente, fusion: boolean): Promise<Issue<D, R>> {
    const indice = this.enAttente.indexOf(entree);
    const nonEcrite = (): Issue<D, R> => ({ ok: true, sauvegarde: this.courante, detail: entree.detail as D, ecrite: false });
    if (indice < 0) return nonEcrite();

    let base = this.base;
    let vide = false;
    if (fusion) {
      const lecture = await this.depot.relire();
      switch (lecture.etat) {
        case 'ok':
          base = lecture.sauvegarde;
          this.contenuConnu = true;
          break;
        case 'vide':
          vide = true;
          this.contenuConnu = true;
          break;
        case 'echec':
          // On ne sait pas ce que le stockage contient : si on ne l'a jamais su, on n'écrase pas.
          if (!this.contenuConnu) return nonEcrite();
          break;
        case 'illisible':
          return nonEcrite();
      }
    } else {
      this.contenuConnu = true;
    }

    // Rejouer sur le contenu frais les opérations qui ne sont pas encore écrites, jusqu'à celle-ci comprise (les
    // suivantes ont leur propre passage : les rejouer ici les appliquerait deux fois).
    const jusquIci = this.enAttente.slice(0, indice + 1);
    let etat = base;
    let propre: ResultatOp<unknown, string> | null = null;
    const retenues: EnAttente[] = [];
    for (const suivante of jusquIci) {
      const r = suivante.op(etat);
      if (suivante === entree) propre = r;
      if (r.ok) {
        etat = r.sauvegarde;
        retenues.push(suivante);
      }
    }

    const rien = etat === base && !vide;
    const enregistree = rien ? true : await this.depot.enregistrer(etat);
    const suite = this.enAttente.slice(indice + 1);
    if (enregistree) {
      this.base = etat;
      this.enAttente = suite;
      if (!rien) this.canal?.publier();
    } else {
      this.base = base;
      this.enAttente = [...retenues, ...suite];
    }
    this.definirCourante(this.rejouer(this.base));

    if (!propre || !propre.ok) return { ok: false, raison: (propre?.ok === false ? propre.raison : 'modifie_ailleurs') as R };
    return { ok: true, sauvegarde: this.courante, detail: propre.detail as D, ecrite: enregistree };
  }

  /** Un autre onglet a écrit : on repart de son contenu et on y rejoue nos opérations en attente. Rien n'est écrit. */
  private rafraichir(): Promise<void> {
    const travail = this.file.then(async () => {
      const lecture = await this.depot.relire();
      if (lecture.etat !== 'ok') return;
      this.contenuConnu = true;
      this.base = lecture.sauvegarde;
      this.definirCourante(this.rejouer(this.base));
    });
    this.file = travail.catch(() => undefined);
    return travail;
  }

  // --- Partie ------------------------------------------------------------------------------------------------

  /**
   * Une partie est finie : une victoire enregistre le meilleur résultat et débloque le niveau suivant ; dans tous les
   * cas la partie en cours est effacée (elle n'a plus rien à reprendre). Rend true si c'est écrit. La méta-progression
   * (arêtes, braises, expérience, objets) est aussi enregistrée : `enregistrerFin` en donne le bilan.
   */
  async terminerPartie(fin: FinDePartie): Promise<boolean> {
    return (await this.enregistrerFin(fin)).ecrite;
  }

  /**
   * Comme `terminerPartie`, avec le bilan de la partie (gains, niveau du héros, objets consommés) pour l'écran de fin,
   * ou la raison du refus des gains (la partie en cours est effacée dans tous les cas).
   */
  async enregistrerFin(fin: FinDePartie): Promise<ResultatFin> {
    const heros = fin.heros !== undefined ? fin.heros : champ(fin.config, 'heros');
    const equipes = fin.objetsEquipes ?? champ(fin.config, 'objets');
    const operation: Operation<{ bilan: BilanPartie | null; refus: RaisonFin | null }, never> = (s) => {
      const r = enregistrerFinDePartie(
        s,
        {
          niveau: fin.niveau,
          statut: fin.statut,
          difficulte: fin.config.difficulte,
          etoiles: fin.etoiles,
          heros: typeof heros === 'string' ? heros : null,
          objetsEquipes: Array.isArray(equipes) ? equipes : [],
          objetsUtilises: fin.objetsUtilises ?? [],
        },
        this.defs,
      );
      const apres = r.ok ? r.sauvegarde : s;
      // Un abandon n'efface que la partie sauvegardée qui est la sienne : quitter une partie neuve, jamais rangée,
      // garde la partie plus ancienne que le joueur pourrait encore reprendre.
      const sienne = apres.partie !== null && apres.partie.niveau === fin.niveau && apres.partie.config.graine === fin.config.graine;
      return {
        ok: true,
        sauvegarde: fin.statut === 'abandon' && !sienne ? apres : avecPartieEnCours(apres, null),
        detail: r.ok ? { bilan: r.bilan, refus: null } : { bilan: null, refus: r.raison },
      };
    };
    const issue = await this.lancer(operation);
    return issue.ok ? { ecrite: issue.ecrite, ...issue.detail } : { ecrite: false, bilan: null, refus: null };
  }

  /**
   * Lance une partie : les objets emportés sont débités du stock tout de suite (voir `debiterObjetsDePartie`). Comme un
   * achat, l'opération est rejouée sous verrou sur le contenu frais du stockage : si le stock ne couvre plus le choix
   * (autre onglet, autre partie), elle est refusée et la partie ne doit pas démarrer. À appeler pour chaque nouvelle
   * partie, « Rejouer » compris, jamais pour la reprise d'une partie sauvegardée (ses objets sont déjà débités).
   */
  async lancerPartie(objets: readonly string[]): Promise<ResultatTransaction<RaisonEquipement>> {
    return sansDetail(await this.lancer((s) => depuisTransaction(debiterObjetsDePartie(s, objets))));
  }

  /**
   * Range l'instantané de la partie, à appeler au début d'une vague et juste après chaque utilisation d'objet (sans
   * quoi une reprise rendrait l'objet utilisable une seconde fois). Rien n'est écrit si la partie n'a pas d'instantané
   * valide (aucune vague lancée encore).
   */
  async rangerPartie(etat: EtatPartie, numeroNiveau: number): Promise<boolean> {
    const partie = partieEnCours(etat, numeroNiveau);
    if (!partie) return false;
    return ecrite(await this.lancer((s) => reussite(avecPartieEnCours(s, partie))));
  }

  /** Abandon : la partie en cours est oubliée. */
  async effacerPartie(): Promise<boolean> {
    if (this.courante.partie === null) return true;
    return ecrite(await this.lancer((s) => reussite(s.partie === null ? s : avecPartieEnCours(s, null))));
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

  async changerReglages(changements: Partial<Reglages>): Promise<boolean> {
    return ecrite(await this.lancer((s) => reussite(changerReglages(s, changements))));
  }

  // --- Méta-progression ---------------------------------------------------------------------------------------

  /**
   * Achète le rang suivant d'une branche de l'arbre. L'achat vise le rang vu à l'écran : si un autre onglet a déjà
   * changé cette branche, il est refusé (`modifie_ailleurs`) plutôt que d'acheter un rang de plus par surprise.
   */
  async acheterRangArbre(branche: string): Promise<ResultatTransaction<RaisonArbre | 'modifie_ailleurs'>> {
    const vu = estIdBranche(branche) ? this.courante.meta.arbre[branche] : null;
    return sansDetail(
      await this.lancer<undefined, RaisonArbre | 'modifie_ailleurs'>((s) => {
        if (estIdBranche(branche) && vu !== null && s.meta.arbre[branche] !== vu) return { ok: false, raison: 'modifie_ailleurs' };
        return depuisTransaction(acheterRangArbre(s, branche));
      }),
    );
  }

  /** Remet l'arbre à zéro : toutes les étoiles dépensées reviennent. */
  async reinitialiserArbre(): Promise<ResultatTransaction<RaisonReinitialisation>> {
    return sansDetail(await this.lancer((s) => depuisTransaction(reinitialiserArbre(s))));
  }

  /** Achète un disciple (30 braises). */
  async acheterDisciple(heros: string): Promise<ResultatTransaction<RaisonDisciple>> {
    return sansDetail(await this.lancer((s) => depuisTransaction(acheterDisciple(s, heros))));
  }

  /** Achète des exemplaires d'un objet consommable (arêtes ; stock de 10 au plus). */
  async acheterObjet(objet: string, quantite = 1): Promise<ResultatTransaction<RaisonAchatObjet>> {
    return sansDetail(await this.lancer((s) => depuisTransaction(acheterObjet(s, objet, quantite))));
  }

  /** Choisit les objets emportés dans la prochaine partie (3 emplacements). */
  async equiperObjets(objets: readonly string[]): Promise<ResultatTransaction<RaisonEquipement>> {
    return sansDetail(await this.lancer((s) => depuisTransaction(equiperObjets(s, objets))));
  }

  /** Retient le dieu et le héros choisis. */
  async choisirHeros(dieu: string, heros: string): Promise<ResultatTransaction<RaisonChoix>> {
    return sansDetail(await this.lancer((s) => depuisTransaction(choisirHeros(s, dieu, heros))));
  }

  /**
   * Place un point de compétence (demande les définitions des héros). Vise le rang vu à l'écran, comme
   * `acheterRangArbre`.
   */
  async repartirPoint(heros: string, competence: string): Promise<ResultatTransaction<RaisonPoint | 'modifie_ailleurs' | 'definitions_absentes'>> {
    const defs = this.defs;
    if (!defs) return { ok: false, raison: 'definitions_absentes' };
    const rangDe = (s: Sauvegarde): number | null => {
      if (!estIdHeros(heros)) return null;
      const competences = s.meta.heros[heros]?.competences;
      return competences && Object.hasOwn(competences, competence) ? (competences[competence] ?? 0) : 0;
    };
    const vu = rangDe(this.courante);
    return sansDetail(
      await this.lancer<undefined, RaisonPoint | 'modifie_ailleurs'>((s) => {
        if (rangDe(s) !== vu) return { ok: false, raison: 'modifie_ailleurs' };
        return depuisTransaction(repartirPoint(s, heros, competence, defs));
      }),
    );
  }

  /** Reprend tous les points placés d'un héros. */
  async reinitialiserPoints(heros: string): Promise<ResultatTransaction<RaisonPoints>> {
    return sansDetail(await this.lancer((s) => depuisTransaction(reinitialiserPoints(s, heros))));
  }

  // --- Export et import ---------------------------------------------------------------------------------------

  /** Le code qui redonne la progression, les réglages et la méta-progression. */
  exporter(): Promise<string> {
    return exporterCode(this.courante);
  }

  /** Lit un code sans rien changer : à l'appelant de demander confirmation, puis d'appeler `appliquerImport`. */
  importer(code: string): Promise<ResultatImport> {
    return importerCode(code, this.defs);
  }

  /** Remplace la progression, les réglages et la méta-progression par ceux d'un import réussi (la partie en cours est abandonnée). */
  async appliquerImport(importee: Sauvegarde): Promise<boolean> {
    return ecrite(await this.lancer(() => reussite(remplacerProgression(importee)), false));
  }
}
