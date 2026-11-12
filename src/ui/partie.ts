// Une partie à l'écran : relie le moteur (src/engine), le rendu (src/render) et l'interface (HUD, gestes,
// clavier). C'est le point d'entrée que l'écran de carte du monde appelle : `lancerNiveau`.
//
// Règles de cette couche :
// - toutes les actions du joueur passent par `avancer` (donc par le journal) : on les met dans une file que
//   la boucle donne au prochain pas, on n'écrit jamais dans l'état ;
// - la simulation avance par pas fixes (PasFixes), le rendu interpole entre deux pas ;
// - tout ce que la partie installe (événements, DOM, boucle) est retiré par `arreter()`.
import { audio, jouerInterface } from '../audio';
import { NIVEAUX_PAR_REGION } from '../data/meta';
import type { NiveauCampagne } from '../data/visuel';
import { avancer, caseExiste, centreCase, creerPartie, derniereVagueTerminee, validerAction } from '../engine';
import type { Action, ConfigPartie, EntreeJournal, EtatPartie, ResultatAction } from '../engine';
import { t } from '../i18n';
import type { IdInscription } from '../data/niveaux/statues';
import { campagneDe } from '../engine/capacites-campagne';
import { chargerAtlas } from '../render/atlas';
import type { BilanPartie, RaisonFin } from '../save';
import type { AtlasRendu } from '../render/atlas';
import type { EcranBestiaire } from './bestiaire';
import { ECART_MAX_MS, PasFixes } from '../render/pas-fixes';
import { Rendu, Surbrillance } from '../render/rendu';
import { apparenceDeLaPartie, campagneDeLAtlas, type Equipes, type SkinsModernes } from './apparence';
import { BulleSurCarte, fermerBulle, type CibleCarteSurvolee } from './bulle';
import { contenuElementMenu, contenuEnnemi, contenuEnnemiDeDonnees, contenuHerosEnPartie, ennemiSous } from './bulle-contenus';
import { commandeClavier, type Commande } from './clavier';
import { afficherFin, creerAvisPaysage, creerPause } from './ecrans';
import { Gestes } from './gestes';
import { Hud } from './hud';
import { Indications } from './indications';
import { afficherInscription, type InscriptionOuverte } from './inscription-partie';
import { Interaction, lieuDuMenu, placeTouchee, type Issue, type Mode } from './interaction';
import { mesurerMarges } from './marges';
import { afficherNouvelEnnemi, type NouvelEnnemiOuvert } from './nouvel-ennemi';
import { elementsMenu, type ElementMenu } from './menu-cercle';
import { afficherNouvelleParticularite } from './nouvelle-particularite';
import { contenuParticularite, contenuRadeau, type TypeParticularite } from './particularites';
import { centreRadeauAffiche, placeAffichee } from '../render/gimmicks';
import { cleParoleBoss } from './parole-boss';
import { texteRefus } from './refus';
import { fouleVisee, reunirParoles, texteBandeau, toucherFoule } from './evenements-niveau';
import { statueTouchee } from './statue';
import { el } from './dom';
import { EVENEMENT_SECOURS } from './notes';

/** Résultat d'une partie terminée, transmis à `surFin` (étoiles, vies, journal pour une future vérification). */
export interface ResultatPartie {
  /** Numéro du niveau de campagne (1 à 150), ou du DLC (1 à 30) si `campagne` vaut `moderne`. */
  readonly niveau: number;
  /** Campagne du niveau joué : `moderne` pour le DLC « Temps modernes » ; absent = l'histoire. */
  readonly campagne?: 'moderne';
  /** `abandon` : le joueur a quitté avant la fin (rendu seulement à `surQuitter`, jamais à `surFin`). */
  readonly statut: 'victoire' | 'defaite' | 'abandon';
  /** 0 en cas de défaite ou d'abandon, 1 à 3 en cas de victoire. */
  readonly etoiles: number;
  readonly vies: number;
  readonly viesDepart: number;
  /** Durée en pas de simulation (30 par seconde). */
  readonly pas: number;
  readonly config: ConfigPartie;
  readonly journal: readonly EntreeJournal[];
  /** Objets emportés que le joueur a utilisés (un par emplacement utilisé), à retirer du stock. */
  readonly objetsUtilises: readonly string[];
  /** Dernière vague terminée (0 si la première ne l'est pas) : le score d'une partie du mode infini. */
  readonly vagueTerminee: number;
}

/** Ce que l'enregistrement d'une fin de partie rend à l'écran de fin : le butin, ou la raison pour laquelle il est refusé. */
export interface RetourFin {
  readonly bilan: BilanPartie | null;
  readonly refus: RaisonFin | null;
  /** Mode infini : les lignes du bilan (voir `ButinFin`), à la place de `bilan` ; null : gains non enregistrés. */
  readonly lignesInfini?: readonly string[] | null;
}

export interface OptionsPartie {
  /** Où monter la partie ; par défaut `document.body`. */
  parent?: HTMLElement;
  /**
   * Appelée par les boutons « Quitter » (pause et fin). Absente : ces boutons n'apparaissent pas. `abandon` est le
   * résultat (statut `abandon`) quand la partie n'était pas finie (à enregistrer : ni expérience ni récompense, objets non
   * utilisés rendus), null quand elle l'était (déjà enregistrée par `surFin`).
   */
  surQuitter?: (abandon: ResultatPartie | null) => void;
  /**
   * Config d'une nouvelle tentative (« Rejouer »), d'après celle de la partie. Par défaut : la même, avec une autre graine.
   * Peut être asynchrone (le lancement débite les objets sous verrou) ; `null` : le lancement est refusé, l'appelant a
   * dit pourquoi et l'écran de fin reste en place.
   */
  nouvelleConfig?: (precedente: ConfigPartie) => ConfigPartie | null | Promise<ConfigPartie | null>;
  /**
   * Appelée juste après chaque utilisation d'un objet, avec l'état courant : c'est le moment de sauvegarder la partie
   * en cours, pour qu'une reprise ne rende pas l'objet de nouveau disponible. L'appelant ne doit pas modifier l'état.
   */
  surObjet?: (etat: EtatPartie) => void;
  /**
   * Partie du mode infini : le HUD montre « Vague N » et le record de la carte (relu à chaque image, il change quand une
   * partie est enregistrée), et l'écran de fin est celui de l'infini (vague atteinte, record, paliers).
   */
  infini?: { readonly record: () => number };
  /** Appelée dès que la partie tourne, y compris après « Rejouer » (qui lance une nouvelle partie). */
  surDemarrage?: (partie: PartieEnCours) => void;
  /**
   * Appelée juste après le lancement de chaque vague (événement `vague` du moteur) avec l'état courant : c'est
   * le moment de sauvegarder la partie en cours. L'appelant ne doit pas modifier l'état.
   */
  surVague?: (etat: EtatPartie) => void;
  /**
   * Reprend une partie sauvegardée au lieu d'en créer une : l'état est celui que rend `deserialiser`, `config`
   * doit être la sienne. La partie démarre en pause. « Rejouer » relance, lui, une nouvelle partie du niveau.
   */
  reprise?: EtatPartie;
  /** Vitesse au lancement (réglage « vitesse par défaut »), 1 par défaut. */
  vitesse?: 1 | 2;
  /**
   * Après une victoire, « Continuer » (retour à la carte) devient le bouton principal de l'écran de fin, à la
   * place de « Quitter ».
   */
  surContinuer?: () => void;
  /**
   * Skins et familiers équipés dans la collection (`meta.collection.equipes`) : le rendu habille les tours et le héros
   * (`apparenceDeLaPartie`, branché sur le 5e argument de `Rendu`). Absent : sprites de base. L'apparence ne dépend pas du défi
   * (en Fer les skins restent visibles, seul le bonus est ignoré).
   */
  equipes?: Equipes;
  /** Skins du DLC portés (`moderne.collection.equipes`) : ils habillent aussi l'histoire ; l'atlas du DLC est alors chargé. */
  skinsModernes?: SkinsModernes;
  /**
   * Une vieille statue de la carte a été touchée (`niveau.visuel.statue`) : l'appelant range son inscription dans la sauvegarde et
   * répond vrai si elle est nouvelle, faux si elle était déjà trouvée, null s'il n'y a rien à en dire (partie hors sauvegarde).
   * La partie, elle, ne change pas : elle se met en pause le temps de la lecture, sans rien écrire dans le journal du moteur.
   */
  surInscription?: (id: string) => boolean | null;
  /**
   * Des ennemis viennent de paraître pour la première fois dans CETTE partie (leurs identifiants, dans l'ordre). L'appelant les range dans
   * le bestiaire et rend ceux dont il faut montrer la fiche « Nouvel ennemi » : ceux que le joueur n'avait jamais rencontrés, si l'option est
   * active. La partie se met en pause le temps de chaque fiche, sans rien écrire dans le journal du moteur. Absent : aucune fiche.
   */
  surNouveauxEnnemis?: (ids: string[]) => string[];
  /**
   * Le niveau a une particularité (gimmick) : appelée une fois au démarrage de la partie. L'appelant la range dans la sauvegarde et
   * répond vrai s'il faut montrer la fiche « Nouvelle particularité » (première rencontre, option active). La partie se met en pause le
   * temps de la fiche, comme pour « Nouvel ennemi ». Absent : aucune fiche.
   */
  surNouvelleParticularite?: (type: TypeParticularite) => boolean;
  /**
   * « Bestiaire » dans l'écran de pause : l'appelant monte l'écran dans `parent`, par-dessus la pause, et rend de quoi le retirer. C'est la
   * PARTIE qui possède l'écran : elle reste en pause tant qu'il est ouvert (ni P ni un blur ne la relancent), n'en ouvre qu'un seul, et le
   * retire à `arreter()`. `surFermer` est à appeler quand le joueur le ferme. Absent : pas de bouton.
   */
  surBestiaire?: (parent: HTMLElement, atlas: AtlasRendu, surFermer: () => void) => EcranBestiaire;
}

/** Temps passé dans la partie, pour mesurer le rendu (voir `PartieEnCours.mesures`). */
export interface Mesures {
  images: number;
  /** Millisecondes cumulées passées à dessiner (hors attente du navigateur). */
  msDessin: number;
  /** Millisecondes cumulées passées à simuler. */
  msSimulation: number;
  pasSimules: number;
}

export interface PartieEnCours {
  /** L'état courant : en lecture seule pour l'appelant (tests, outils de mesure). */
  readonly etat: EtatPartie;
  readonly rendu: Rendu;
  readonly mesures: Mesures;
  /** Ce que le joueur est en train de faire (menu ouvert, visée d'un sort…), pour les tests et les mesures. */
  readonly mode: Mode;
  /** Fait entrer une action dans la file du prochain pas, comme le ferait un geste du joueur. */
  envoyer(action: Action): void;
  /** Retire tout ce que la partie a installé (boucle, écouteurs, DOM). */
  arreter(): void;
}

/** Zone de toucher autour du héros : 44 px CSS de large au moins, soit un rayon de 22 px. */
const RAYON_TOUCHE_CSS = 24;
const RAYON_TOUCHE_MIN_TUILES = 0.9;
/** Côté minimal d'une case de construction à l'écran sur un écran tactile (pixels CSS) : un doigt. */
const CIBLE_TACTILE_CSS = 44;
/** Clé de la bulle du radeau : négative et loin de celles des pastilles des panneaux (voir `PuceSous`). */
const CLE_BULLE_RADEAU = -10_000;
/** Moitiés de la plateforme du radeau, en tuiles (le sprite `radeau` fait 48 × 32 pixels logiques, une tuile = 16). */
const DEMI_LARGEUR_RADEAU = 1.5;
const DEMI_HAUTEUR_RADEAU = 1;
/** Délai avant l'écran de fin, pour laisser voir la dernière mort. */
const DELAI_ECRAN_FIN_MS = 1100;
const LIGNE_PIXELS = 40;
const PAGE_PIXELS = 400;

/** Graine d'une nouvelle tentative : dérivée de la précédente, donc reproductible mais différente. */
export function graineSuivante(graine: number): number {
  return (Math.imul(graine >>> 0, 1664525) + 1013904223) >>> 0;
}

/**
 * Lance un niveau : charge les sprites, crée la partie, monte l'interface et démarre la boucle.
 * `surFin` est appelée une seule fois, à la fin de la partie (victoire ou défaite), avec son résultat ; si elle rend une
 * promesse, l'écran de fin montre le butin qu'elle donne (arêtes, braises, expérience, niveau du héros).
 * L'écran de fin propose « Rejouer » (nouvelle partie de ce niveau) et, si `options.surQuitter` existe, « Quitter ».
 */
export async function lancerNiveau(
  niveau: NiveauCampagne,
  config: ConfigPartie,
  surFin: (resultat: ResultatPartie) => unknown,
  options: OptionsPartie = {},
): Promise<PartieEnCours> {
  // Une partie du DLC « Temps modernes » charge aussi l'atlas à part du DLC ; l'histoire seulement si un skin du DLC est porté.
  const atlas = await chargerAtlas(campagneDeLAtlas(campagneDe(options.reprise?.niveau ?? niveau.niveau), options.skinsModernes));
  const etat = options.reprise ?? creerPartie(niveau.niveau, config);
  const parent = options.parent ?? document.body;
  const controleur = new AbortController();
  const { signal } = controleur;

  const racine = el('div', 'partie');
  const canvas = el('canvas', 'jeu');
  racine.append(canvas);
  parent.append(racine);
  document.body.classList.add('en-partie');
  creerAvisPaysage(racine);

  let rendu: Rendu;
  try {
    rendu = new Rendu(canvas, atlas, etat.niveau.carte, niveau.visuel, apparenceDeLaPartie(options.equipes, etat.config.heros, options.skinsModernes));
  } catch (erreur) {
    // Pas de contexte 2D : on ne laisse pas un écran noir derrière soi, l'appelant revient à l'écran précédent.
    racine.remove();
    document.body.classList.remove('en-partie');
    throw erreur;
  }
  const surbrillance = new Surbrillance();
  const interaction = new Interaction();
  const pas = new PasFixes();
  pas.vitesse = options.vitesse ?? 1;
  const actions: Action[] = [];
  const mesures: Mesures = { images: 0, msDessin: 0, msSimulation: 0, pasSimules: 0 };
  let temps = 0;
  let arretee = false;
  let finie = false;
  let finVue = 0;
  let ecranFinAffiche = false;
  let relanceEnCours = false;
  /** Le butin de la partie, quand `surFin` en promet un. */
  let retourFin: Promise<RetourFin | null> | null = null;
  let identifiantImage = 0;
  /** La fenêtre d'une inscription de statue, tant qu'elle est ouverte : la simulation attend, comme en pause. */
  let inscription: InscriptionOuverte | null = null;
  /** La fiche ouverte (« Nouvel ennemi » ou « Nouvelle particularité », une à la fois), et celles qui attendent leur tour. */
  let ficheEnnemi: NouvelEnnemiOuvert | null = null;
  const fichesEnAttente: ({ readonly genre: 'ennemi'; readonly id: string } | { readonly genre: 'particularite'; readonly type: TypeParticularite })[] = [];
  /** Le Bestiaire ouvert depuis la pause, tant qu'il l'est : la simulation attend, comme pour une fiche. */
  let bestiaire: EcranBestiaire | null = null;
  /** Un écran est ouvert par-dessus la partie (inscription, fiche, Bestiaire) : elle attend, et la pause ne lui vole pas le focus. */
  const ecranDessus = (): boolean => inscription !== null || ficheEnnemi !== null || bestiaire !== null;
  /** Les types d'ennemis déjà signalés à `surNouveauxEnnemis` dans cette partie. */
  const ennemisVus = new Set<string>();
  /** La pause demandée par le joueur (bouton, touche P, onglet caché…), à retrouver à la fermeture de l'inscription. */
  let pauseDemandee = false;
  let pasMenu = -1;
  let elementsDuMenu: ElementMenu[] | null = null;
  let caseMenu = '';
  /** Où le menu d'une place du radeau s'est ouvert (tuiles) : il y reste, même si le radeau s'éloigne. */
  let ancreMenu: { x: number; y: number } | null = null;
  /** Change chaque fois que le contenu du menu est recalculé : le HUD ne compare ses boutons qu'à ce moment. */
  let versionMenu = 0;

  const envoyer = (action: Action): void => {
    actions.push(action);
  };
  /** Un appel de vague déjà en file pour le prochain pas n'est pas doublé : le second serait refusé et ferait un message parasite. */
  const demanderVague = (): void => {
    if (actions.some((action) => action.type === 'appelerVague')) return;
    const refus = validerAction(etat, { type: 'appelerVague' });
    if (refus === null) envoyer({ type: 'appelerVague' });
    else {
      jouerInterface('refus');
      hud.afficherMessage(texteRefus(refus));
    }
  };
  const traiter = (issue: Issue): void => {
    if (issue.action) envoyer(issue.action);
    if (issue.refus !== null) {
      jouerInterface('refus');
      hud.afficherMessage(texteRefus(issue.refus, issue.deblocage ?? null));
    }
  };
  const definirPause = (pause: boolean): void => {
    if (finie) return;
    if (pause && !pas.pause) interaction.annuler();
    pauseDemandee = pause;
    // Une inscription ouverte garde la partie en pause, même si l'écran de pause se ferme par-dessus.
    pas.pause = pause || ecranDessus();
    ecranPause.afficher(pause, !ecranDessus());
  };
  /** Touche d'une statue : la partie attend, la fenêtre montre l'inscription, la fermer relance la partie là où elle était. */
  const lireInscription = (id: string): void => {
    if (finie || inscription) return;
    interaction.annuler();
    const nouvelle = options.surInscription?.(id) ?? null;
    pas.pause = true;
    inscription = afficherInscription(racine, {
      id: id as IdInscription,
      nouvelle,
      surFermer: () => {
        inscription = null;
        pas.pause = pauseDemandee || ecranDessus();
      },
    });
  };
  /** Montre la fiche du prochain ennemi en attente (une seule à la fois) ; la partie attend, comme pour une inscription. */
  const montrerFicheSuivante = (): void => {
    if (finie || arretee || ficheEnnemi || inscription) return;
    const suivante = fichesEnAttente.shift();
    if (suivante === undefined) return;
    interaction.annuler();
    pas.pause = true;
    const surFermer = (): void => {
      ficheEnnemi = null;
      if (fichesEnAttente.length > 0) montrerFicheSuivante();
      else pas.pause = pauseDemandee || ecranDessus();
    };
    ficheEnnemi = suivante.genre === 'ennemi'
      ? afficherNouvelEnnemi(racine, { atlas, id: suivante.id, surFermer })
      : afficherNouvelleParticularite(racine, { atlas, type: suivante.type, surFermer });
  };
  /**
   * Des ennemis viennent de paraître (événements `apparition` du moteur, ou ceux d'une partie reprise) : ceux qu'on n'avait pas encore
   * signalés vont à `surNouveauxEnnemis`, et les fiches utiles s'ouvrent. Une partie finie ne signale rien : l'ennemi reste « jamais rencontré »
   * et sa fiche s'ouvrira à la partie suivante.
   */
  const signalerNouveauxEnnemis = (types: Iterable<string>): void => {
    if (finie || arretee || !options.surNouveauxEnnemis) return;
    const nouveaux: string[] = [];
    for (const type of types) {
      if (ennemisVus.has(type)) continue;
      ennemisVus.add(type);
      nouveaux.push(type);
    }
    if (nouveaux.length === 0) return;
    fichesEnAttente.push(...options.surNouveauxEnnemis(nouveaux).map((id) => ({ genre: 'ennemi' as const, id })));
    montrerFicheSuivante();
  };
  /** Ouvre le Bestiaire depuis la pause (un seul à la fois) ; la partie attend tant qu'il est ouvert. */
  const ouvrirBestiaire = (): void => {
    const monter = options.surBestiaire;
    if (!monter || finie || arretee || bestiaire) return;
    interaction.annuler();
    pas.pause = true;
    bestiaire = monter(racine, atlas, () => {
      bestiaire = null;
      pas.pause = pauseDemandee || ecranDessus();
    });
  };
  /** Les objets emportés que la partie a utilisés, un par emplacement utilisé. */
  const objetsUtilises = (): string[] => etat.config.objets.filter((_, i) => etat.objetsUtilises[i] === true);
  const resultatDe = (statut: 'victoire' | 'defaite' | 'abandon'): ResultatPartie => ({
    niveau: niveau.numero,
    ...(niveau.niveau.campagne === 'moderne' ? { campagne: 'moderne' as const } : {}),
    statut,
    etoiles: statut === 'victoire' ? etat.etoiles : 0,
    vies: etat.vies,
    viesDepart: etat.viesDepart,
    pas: etat.pas,
    config: etat.config,
    journal: etat.journal,
    objetsUtilises: objetsUtilises(),
    vagueTerminee: derniereVagueTerminee(etat),
  });
  const quitter = options.surQuitter
    ? (): void => {
        // Partir avant la fin n'est pas perdre : l'appelant enregistre un abandon (ni expérience ni récompense, objets
        // utilisés consommés, les autres rendus). Seules les vies à 0 font une défaite.
        const abandon = finie ? null : resultatDe('abandon');
        arreter();
        options.surQuitter?.(abandon);
      }
    : undefined;
  // Panneaux d'entrée, portes de sortie et traînée des chemins : sous le HUD, au-dessus du canvas.
  const indications = new Indications(racine, atlas, rendu, etat, signal, temps);
  const ecranPause = creerPause(racine, () => { definirPause(false); }, quitter, options.surBestiaire ? ouvrirBestiaire : undefined);
  const hud = new Hud(racine, atlas, etat, {
    appelerVague: demanderVague,
    changerVitesse: () => {
      pas.vitesse = pas.vitesse === 1 ? 2 : 1;
    },
    basculerPause: () => { if (!bestiaire) definirPause(!pauseDemandee); },
    basculerSort: (emplacement) => { traiter(interaction.basculerSort(etat, emplacement)); },
    basculerObjet: (emplacement) => { traiter(interaction.basculerObjet(etat, emplacement)); },
    basculerHeros: () => { traiter(interaction.basculerHeros(etat)); },
    choisirElement: (element) => { traiter(interaction.choisirElement(element)); },
    survolerElement: (element) => { interaction.survolerElement(element); },
    decrireElement: (element) => {
      const lieu = lieuDuMenu(interaction.mode);
      return lieu ? contenuElementMenu(etat, lieu, element) : null;
    },
    decrireHeros: () => contenuHerosEnPartie(etat),
  }, signal, options.infini);

  // La carte peut dépasser de l'écran de la largeur des barres du HUD : une case collée au bord reste atteignable.
  const mesurerInterface = (): void => {
    const marges = mesurerMarges(hud.racine, canvas.clientWidth, canvas.clientHeight);
    rendu.definirMarges(marges);
    indications.definirMarges(marges);
  };
  mesurerInterface();

  // --- Entrées : toucher, glisser, pincer, molette, clavier ---

  // Écran tactile : une case fait au moins 44 px CSS (la caméra ne dézoome pas en dessous, la carte défile).
  if (window.matchMedia('(pointer: coarse)').matches) rendu.definirCibleCase(CIBLE_TACTILE_CSS);

  /** Un glissé de caméra est en cours : la case sous le doigt ne s'éclaire pas, on ne vise pas. */
  let enGlissement = false;
  /**
   * La souris survole la carte sans appui (en `sourisX`, `sourisY`) : sur un niveau à radeau, la visée est refaite à chaque image,
   * car le radeau passe sous une souris immobile (les touches 1 à 5 visent ce qui est vraiment dessous).
   */
  let sourisSurCarte = false;
  const pointeurSurTuiles = (x: number, y: number): void => {
    const tx = rendu.enTuilesX(x);
    const ty = rendu.enTuilesY(y);
    surbrillance.curseurX = tx;
    surbrillance.curseurY = ty;
    surbrillance.curseurActif = true;
    if (!enGlissement && !finie) interaction.viser(etat, tx, ty);
  };
  const gestes = new Gestes({
    toucher: (x, y) => {
      if (finie || pas.pause) return;
      const rayon = Math.max(RAYON_TOUCHE_MIN_TUILES, RAYON_TOUCHE_CSS / rendu.pixelsCssParTuile);
      const tx = rendu.enTuilesX(x);
      const ty = rendu.enTuilesY(y);
      // Une vieille statue : l'inscription s'ouvre (méta : rien n'entre dans la file d'actions du moteur).
      const statue = niveau.visuel.statue;
      if (statue && statueTouchee(etat, interaction.mode, statue, tx, ty, rayon)) {
        lireInscription(statue.id);
        return;
      }
      // Une foule (DLC) touchée sans rien d'autre en cours : on l'active si elle se paie, sinon la bulle explique.
      // Le héros posté dans la foule passe avant elle (voir `fouleVisee`) : le toucher le sélectionne.
      const foule = interaction.mode.type === 'libre' ? fouleVisee(etat, tx, ty, rayon) : -1;
      if (foule >= 0) {
        const geste = toucherFoule(etat, foule);
        if (geste.action) envoyer(geste.action);
        if (geste.refus !== null) jouerInterface('refus');
        if (geste.message !== null) hud.afficherMessage(geste.message);
        return;
      }
      traiter(interaction.toucher(etat, tx, ty, rayon));
    },
    glisser: (dx, dy) => {
      enGlissement = true;
      interaction.cesserDeViser();
      rendu.camera.deplacer(dx * rendu.ratio, dy * rendu.ratio);
    },
    debutPincement: () => {
      enGlissement = true;
      interaction.cesserDeViser();
      rendu.camera.debutPincement();
    },
    pincer: (facteur, x, y) => { rendu.camera.pincement(facteur, x * rendu.ratio, y * rendu.ratio); },
    // La souris bouge sans appui : le glissé précédent est fini, on vise de nouveau.
    survol: (x, y) => {
      enGlissement = false;
      sourisSurCarte = true;
      pointeurSurTuiles(x, y);
    },
  });
  // Bulle d'un ennemi : survol à la souris, appui long au doigt ; la partie continue dessous.
  const bulleCarte = new BulleSurCarte(racine);
  /** Dernière position de la souris sur le canvas (pixels CSS) : une souris immobile peut voir l'ennemi s'éloigner. */
  let sourisX = Number.NaN;
  let sourisY = Number.NaN;
  /** Type du dernier pointeur posé sur le canvas : le menu contextuel qui suit vient de la souris ou d'un appui long. */
  let dernierPointeur = '';
  const rayonToucheTuiles = (): number => Math.max(RAYON_TOUCHE_MIN_TUILES, RAYON_TOUCHE_CSS / rendu.pixelsCssParTuile);
  /** `souris` : la bulle se ferme quand l'ennemi n'est plus sous la souris (survol) ; au doigt, elle reste jusqu'au toucher suivant. */
  const ennemiPointe = (x: number, y: number, souris: boolean): CibleCarteSurvolee | null => {
    // Une pastille d'un panneau d'entrée : ses bulles passent par le canvas, les pastilles elles-mêmes ne captent rien.
    const puce = indications.puceSous(x, y);
    if (puce) {
      // Le repère d'un couloir dit ce qu'est le Vol de Corbeaux ; une pastille, l'ennemi qu'elle annonce.
      const contenu = (): ReturnType<typeof contenuEnnemiDeDonnees> => (puce.genre === 'couloir' ? contenuParticularite('corbeaux', [t('gimmick.couloir.note')]) : contenuEnnemiDeDonnees(puce.type));
      return {
        cle: puce.cle,
        ancre: () => puce.ancre(),
        fabriquer: () => (puce.encore() && (!souris || indications.puceSous(sourisX, sourisY)?.cle === puce.cle) ? contenu() : null),
      };
    }
    const ennemi = ennemiSous(etat, rendu.enTuilesX(x), rendu.enTuilesY(y), rayonToucheTuiles());
    if (!ennemi) return radeauPointe(x, y, souris);
    const sousLaSouris = (): boolean => ennemiSous(etat, rendu.enTuilesX(sourisX), rendu.enTuilesY(sourisY), rayonToucheTuiles()) === ennemi;
    return {
      cle: ennemi.id,
      ancre: () => {
        const demi = rendu.pixelsCssParTuile / 2;
        const ex = rendu.enCssX(ennemi.x);
        const ey = rendu.enCssY(ennemi.y - 0.5);
        return { left: ex - demi, top: ey - demi, right: ex + demi, bottom: ey + demi };
      },
      fabriquer: () => (ennemi.vivant && etat.ennemis.includes(ennemi) && (!souris || sousLaSouris()) ? contenuEnnemi(ennemi) : null),
    };
  };
  /** Le radeau sous le pointeur (une de ses places, ou sa plateforme) : sa bulle dit ses places libres et comment s'en servir. */
  const surLeRadeau = (x: number, y: number): boolean => {
    const tx = rendu.enTuilesX(x);
    const ty = rendu.enTuilesY(y);
    if (placeTouchee(etat, tx, ty, rayonToucheTuiles()) >= 0) return true;
    const centre = centreRadeauAffiche(etat, pas.alpha);
    return centre !== null && Math.abs(centre.x - tx) <= DEMI_LARGEUR_RADEAU && Math.abs(centre.y - ty) <= DEMI_HAUTEUR_RADEAU;
  };
  const radeauPointe = (x: number, y: number, souris: boolean): CibleCarteSurvolee | null => {
    // Menu ouvert ou visée en cours : la bulle du radeau cacherait les boutons, et le joueur sait déjà ce qu'il fait.
    if (interaction.mode.type !== 'libre' || !surLeRadeau(x, y)) return null;
    return {
      cle: CLE_BULLE_RADEAU,
      ancre: () => {
        const centre = centreRadeauAffiche(etat, pas.alpha) ?? { x: 0, y: 0 };
        const demi = rendu.pixelsCssParTuile * DEMI_LARGEUR_RADEAU;
        const cx = rendu.enCssX(centre.x);
        const cy = rendu.enCssY(centre.y);
        return { left: cx - demi, top: cy - demi, right: cx + demi, bottom: cy + demi };
      },
      fabriquer: () => (interaction.mode.type === 'libre' && (!souris || surLeRadeau(sourisX, sourisY)) ? contenuRadeau(etat) : null),
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    dernierPointeur = e.pointerType;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    enGlissement = false;
    pointeurSurTuiles(e.clientX, e.clientY);
    gestes.appuyer(e.pointerId, e.clientX, e.clientY);
    if (e.pointerType !== 'mouse') {
      sourisSurCarte = false;
      const x = e.clientX;
      const y = e.clientY;
      // L'ennemi désigné est celui sous le doigt à l'appui : un ennemi rapide a pu s'éloigner au bout de l'appui long.
      const designe = ennemiPointe(x, y, false);
      // Appui long : le geste s'arrête là (ni menu ni ordre au relâché), et la bulle de l'ennemi s'ouvre s'il y en a un.
      bulleCarte.appuyer(e.pointerId, x, y, () => (designe?.fabriquer() ? designe : ennemiPointe(x, y, false)), (id) => {
        gestes.annuler(id);
        interaction.cesserDeViser();
      });
    }
  }, { signal });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons !== 0) pointeurSurTuiles(e.clientX, e.clientY);
    gestes.bouger(e.pointerId, e.clientX, e.clientY);
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      sourisX = e.clientX;
      sourisY = e.clientY;
      bulleCarte.survoler(ecranFinAffiche ? null : ennemiPointe(e.clientX, e.clientY, true));
    } else {
      bulleCarte.bouger(e.pointerId, e.clientX, e.clientY);
    }
  }, { signal });
  canvas.addEventListener('pointerup', (e) => {
    bulleCarte.relacher(e.pointerId);
    gestes.relacher(e.pointerId, e.clientX, e.clientY);
    // Le doigt levé ne vise plus rien ; la souris, elle, reste au-dessus de la case.
    if (e.pointerType !== 'mouse') interaction.cesserDeViser();
  }, { signal });
  canvas.addEventListener('pointercancel', (e) => {
    bulleCarte.relacher(e.pointerId);
    gestes.annuler(e.pointerId);
    interaction.cesserDeViser();
  }, { signal });
  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    sourisSurCarte = false;
    interaction.cesserDeViser();
    bulleCarte.survoler(null);
  }, { signal });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const facteur = e.deltaMode === 1 ? LIGNE_PIXELS : e.deltaMode === 2 ? PAGE_PIXELS : 1;
    rendu.camera.molette(e.deltaY * facteur, e.clientX * rendu.ratio, e.clientY * rendu.ratio);
  }, { signal, passive: false });
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // Clic droit de la souris : annule. Chrome Android l'envoie aussi à chaque appui long du doigt : on garde alors le mode.
    const type = e instanceof PointerEvent && e.pointerType !== '' ? e.pointerType : dernierPointeur;
    if (type === 'mouse') interaction.annuler();
  }, { signal });

  const executer = (commande: Commande): void => {
    if (finie) return;
    // Le Bestiaire est ouvert : la pause est à lui, ni P ni aucune commande n'y change rien.
    if (bestiaire) return;
    if (commande.type === 'pause') {
      // Bascule la pause DEMANDÉE (pas l'état réel, qu'une fiche ou une inscription ouverte force aussi).
      definirPause(!pauseDemandee);
      return;
    }
    if (pas.pause) return;
    switch (commande.type) {
      case 'tour':
        traiter(interaction.construireSurSelection(etat, commande.famille));
        break;
      case 'sort':
        traiter(interaction.basculerSort(etat, commande.emplacement));
        break;
      case 'objet':
        traiter(interaction.basculerObjet(etat, commande.emplacement));
        break;
      case 'heros':
        traiter(interaction.basculerHeros(etat));
        break;
      case 'vague':
        demanderVague();
        break;
      case 'vitesse':
        pas.vitesse = pas.vitesse === 1 ? 2 : 1;
        break;
      case 'annuler':
        interaction.annuler();
        break;
    }
  };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const commande = commandeClavier(e);
    // En pause, Espace et Entrée restent aux boutons de l'écran de pause.
    if (!commande || finie || (pas.pause && commande.type !== 'pause')) return;
    e.preventDefault();
    executer(commande);
  }, { signal });

  // --- Pause automatique : onglet caché, fenêtre qui perd le focus, écran en portrait ---

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) definirPause(true);
  }, { signal });
  // L'éditeur de notes (touche de secours) recouvre le jeu : la partie s'arrête.
  document.addEventListener(EVENEMENT_SECOURS, (e) => {
    if ((e as CustomEvent<{ notes: boolean }>).detail.notes) definirPause(true);
  }, { signal });
  window.addEventListener('blur', () => {
    gestes.reinitialiser();
    bulleCarte.oublier();
    definirPause(true);
  }, { signal });
  const portrait = window.matchMedia('(orientation: portrait)');
  portrait.addEventListener('change', (e) => {
    if (e.matches) definirPause(true);
  }, { signal });
  if (portrait.matches) definirPause(true);
  // Un niveau à particularité : la première fois, sa fiche s'ouvre avant tout le reste (la partie attend).
  const gimmick = etat.niveau.gimmick;
  if (gimmick && options.surNouvelleParticularite?.(gimmick.type) === true) {
    fichesEnAttente.push({ genre: 'particularite', type: gimmick.type });
    montrerFicheSuivante();
  }
  if (options.reprise) {
    // Une partie reprise montre d'abord ce qu'elle contient (tours, ennemis), et attend que le joueur soit prêt.
    rendu.synchroniser(etat, temps);
    definirPause(true);
    // Les ennemis déjà présents dans la partie reprise sont signalés une fois, au démarrage.
    signalerNouveauxEnnemis(etat.ennemis.map((e) => e.type));
  }
  const surRedimension = (): void => {
    rendu.redimensionner();
    indications.redimensionner();
    mesurerInterface();
  };
  window.addEventListener('resize', surRedimension, { signal });
  window.addEventListener('orientationchange', surRedimension, { signal });

  // --- Fin de partie ---

  const terminer = (): void => {
    finie = true;
    interaction.annuler();
    if (etat.statut === 'en_cours') return;
    const retour = surFin(resultatDe(etat.statut));
    if (retour instanceof Promise) {
      retourFin = (retour as Promise<RetourFin | null>).catch((erreur: unknown) => {
        console.error(erreur);
        return null;
      });
    }
  };
  const montrerEcranFin = (): void => {
    ecranFinAffiche = true;
    bulleCarte.detruire();
    fermerBulle();
    if (etat.statut === 'en_cours') return;
    const continuer = options.surContinuer;
    afficherFin(racine, atlas, { statut: etat.statut, etoiles: etat.etoiles, vies: etat.vies, viesDepart: etat.viesDepart, ...(options.infini ? { infini: true } : {}) }, {
      surRejouer: () => {
        if (relanceEnCours) return;
        relanceEnCours = true;
        // Le lancement peut être refusé (stock d'objets entamé) : l'écran de fin reste alors en place.
        Promise.resolve(options.nouvelleConfig ? options.nouvelleConfig(config) : { ...config, graine: graineSuivante(config.graine) })
          .then((suivante) => {
            if (suivante === null || arretee) return;
            arreter();
            // Une nouvelle tentative repart d'une partie neuve, jamais de la partie reprise.
            const relance: OptionsPartie = { ...options };
            delete relance.reprise;
            lancerNiveau(niveau, suivante, surFin, relance).catch(console.error);
          })
          .catch(console.error)
          .finally(() => {
            relanceEnCours = false;
          });
      },
      ...(etat.statut === 'victoire' && continuer
        ? {
            surContinuer: () => {
              arreter();
              continuer();
            },
          }
        : quitter
          ? { surQuitter: quitter }
          : {}),
    }, retourFin);
  };

  // --- Boucle ---

  let dernier = performance.now();
  const boucle = (maintenant: number): void => {
    if (arretee) return;
    identifiantImage = requestAnimationFrame(boucle);
    const ecart = maintenant - dernier;
    dernier = maintenant;
    if (!pas.pause) temps += Math.min(Math.max(ecart, 0), ECART_MAX_MS) * pas.vitesse;

    if (!finie) {
      const debut = performance.now();
      const n = pas.avancer(ecart);
      for (let i = 0; i < n; i++) {
        const resultats: ResultatAction[] = avancer(etat, actions);
        for (const r of resultats) {
          if (!r.ok) {
            jouerInterface('refus');
            hud.afficherMessage(texteRefus(r.raison));
          }
        }
        audio.jouerEvenements(etat.evenements, etat);
        actions.length = 0;
        // Les ennemis qui viennent d'apparaître (hors partie finie : voir signalerNouveauxEnnemis).
        if (etat.statut === 'en_cours') {
          const apparus: string[] = [];
          for (const evenement of etat.evenements) if (evenement.type === 'apparition') apparus.push(evenement.typeEnnemi);
          if (apparus.length > 0) signalerNouveauxEnnemis(apparus);
        }
        rendu.apresPas(etat, temps);
        mesures.pasSimules++;
        for (const evenement of etat.evenements) indications.evenement(etat, evenement, temps);
        indications.apresPas(etat);
        // Bandeau des événements datés et des foules (DLC) et paroles de boss : un seul bandeau par pas, qui réunit tout ce qu'il y a à dire
        // (le bandeau remplace son texte : sans cela, la parole d'un boss écraserait l'annonce d'un événement du même pas).
        const paroles: string[] = [];
        for (const evenement of etat.evenements) {
          const texte = texteBandeau(etat, evenement);
          if (texte !== null) paroles.push(texte);
        }
        for (const evenement of etat.evenements) {
          if (evenement.type !== 'vague') continue;
          const dlc = niveau.campagne === 'moderne';
          const region = dlc ? Math.floor((niveau.numero - 1) / NIVEAUX_PAR_REGION) + 1 : niveau.visuel.region;
          const cle = cleParoleBoss(etat.niveau.vagues, evenement.index, region, niveau.boss, dlc);
          if (cle) paroles.push(t(cle));
        }
        const parole = reunirParoles(paroles);
        if (parole !== null) hud.afficherParole(parole);
        if (etat.statut === 'en_cours' && (options.surVague || options.surObjet)) {
          let vague = false;
          let objet = false;
          for (const evenement of etat.evenements) {
            if (evenement.type === 'vague') vague = true;
            else if (evenement.type === 'objet') objet = true;
          }
          if (vague) options.surVague?.(etat);
          if (objet) options.surObjet?.(etat);
        }
        if (etat.statut !== 'en_cours') {
          finVue = maintenant;
          terminer();
          break;
        }
      }
      mesures.msSimulation += performance.now() - debut;
    }
    if (finie && !ecranFinAffiche && maintenant - finVue >= DELAI_ECRAN_FIN_MS) montrerEcranFin();

    const debutDessin = performance.now();
    interaction.rafraichir(etat);
    if (sourisSurCarte && !enGlissement && !finie && etat.niveau.gimmick?.type === 'radeau' && !Number.isNaN(sourisX)) {
      interaction.viser(etat, rendu.enTuilesX(sourisX), rendu.enTuilesY(sourisY));
    }
    interaction.surbrillance(etat, surbrillance);
    rendu.dessiner(etat, pas.alpha, temps, surbrillance);
    mettreAJourMenu();
    indications.mettreAJour(etat, temps);
    hud.mettreAJour(etat, { vitesse: pas.vitesse, pause: pas.pause, mode: interaction.mode }, interaction.invite(etat));
    mesures.msDessin += performance.now() - debutDessin;
    mesures.images++;
  };

  /** Menu en cercle de la case sélectionnée, recalculé à chaque pas de simulation (prix, grisé) et replacé à chaque image. */
  const mettreAJourMenu = (): void => {
    const mode = interaction.mode;
    const lieu = lieuDuMenu(mode);
    const cle = !lieu ? '' : lieu.place !== undefined ? `place:${String(lieu.place)}` : `${String(lieu.cx)},${String(lieu.cy)}`;
    // Sur le radeau, le menu reste là où il s'est ouvert : des boutons qui glissent sous le doigt ou la souris (le radeau fait une
    // tuile par seconde) se visent mal. L'anneau de la place et la portée, eux, suivent le radeau (Surbrillance.place).
    if (lieu?.place !== undefined && (cle !== caseMenu || !ancreMenu)) ancreMenu = placeAffichee(etat, pas.alpha, lieu.place);
    const centre = !lieu ? null : lieu.place !== undefined ? ancreMenu : caseExiste(etat.niveau.carte, lieu.cx, lieu.cy) ? centreCase(lieu.cx, lieu.cy) : null;
    if (!lieu || !centre || finie) {
      ancreMenu = null;
      if (elementsDuMenu) {
        elementsDuMenu = null;
        caseMenu = '';
        hud.placerMenu(null, versionMenu, 0, 0, 0, 0, 0);
      }
      return;
    }
    if (!elementsDuMenu || etat.pas !== pasMenu || cle !== caseMenu) {
      elementsDuMenu = elementsMenu(etat, lieu);
      pasMenu = etat.pas;
      caseMenu = cle;
      versionMenu++;
    }
    const largeur = window.innerWidth;
    const hauteur = window.innerHeight;
    const rayon = Math.min(78, Math.max(56, hauteur * 0.19));
    hud.placerMenu(elementsDuMenu, versionMenu, rendu.enCssX(centre.x), rendu.enCssY(centre.y - 0.6), largeur, hauteur, rayon);
  };

  function arreter(): void {
    if (arretee) return;
    arretee = true;
    inscription?.fermer();
    ficheEnnemi?.fermer();
    bestiaire?.arreter();
    cancelAnimationFrame(identifiantImage);
    controleur.abort();
    bulleCarte.detruire();
    fermerBulle();
    hud.detruire();
    racine.remove();
    document.body.classList.remove('en-partie');
  }

  identifiantImage = requestAnimationFrame(boucle);
  const partie: PartieEnCours = {
    etat,
    rendu,
    mesures,
    get mode() {
      return interaction.mode;
    },
    envoyer,
    arreter,
  };
  options.surDemarrage?.(partie);
  return partie;
}
