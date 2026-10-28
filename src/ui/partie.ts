// Une partie à l'écran : relie le moteur (src/engine), le rendu (src/render) et l'interface (HUD, gestes,
// clavier). C'est le point d'entrée que l'écran de carte du monde appelle : `lancerNiveau`.
//
// Règles de cette couche :
// - toutes les actions du joueur passent par `avancer` (donc par le journal) : on les met dans une file que
//   la boucle donne au prochain pas, on n'écrit jamais dans l'état ;
// - la simulation avance par pas fixes (PasFixes), le rendu interpole entre deux pas ;
// - tout ce que la partie installe (événements, DOM, boucle) est retiré par `arreter()`.
import { audio, jouerInterface } from '../audio';
import type { NiveauCampagne } from '../data/visuel';
import { avancer, caseExiste, centreCase, creerPartie, validerAction } from '../engine';
import type { Action, ConfigPartie, EntreeJournal, EtatPartie, ResultatAction } from '../engine';
import { chargerAtlas } from '../render/atlas';
import type { BilanPartie, RaisonFin } from '../save';
import { ECART_MAX_MS, PasFixes } from '../render/pas-fixes';
import { Rendu, Surbrillance } from '../render/rendu';
import { apparenceDeLaPartie, type Equipes } from './apparence';
import { commandeClavier, type Commande } from './clavier';
import { afficherFin, creerAvisPaysage, creerPause } from './ecrans';
import { Gestes } from './gestes';
import { Hud } from './hud';
import { Interaction, type Issue, type Mode } from './interaction';
import { mesurerMarges } from './marges';
import { elementsMenu, type ElementMenu } from './menu-cercle';
import { texteRefus } from './refus';
import { el } from './dom';

/** Résultat d'une partie terminée, transmis à `surFin` (étoiles, vies, journal pour une future vérification). */
export interface ResultatPartie {
  /** Numéro du niveau de campagne (1 à 100). */
  readonly niveau: number;
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
}

/** Ce que l'enregistrement d'une fin de partie rend à l'écran de fin : le butin, ou la raison pour laquelle il est refusé. */
export interface RetourFin {
  readonly bilan: BilanPartie | null;
  readonly refus: RaisonFin | null;
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
  const atlas = await chargerAtlas();
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
    rendu = new Rendu(canvas, atlas, etat.niveau.carte, niveau.visuel, apparenceDeLaPartie(options.equipes, etat.config.heros));
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
  let pasMenu = -1;
  let elementsDuMenu: ElementMenu[] | null = null;
  let caseMenu = '';
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
      hud.afficherMessage(texteRefus(issue.refus));
    }
  };
  const definirPause = (pause: boolean): void => {
    if (finie) return;
    if (pause && !pas.pause) interaction.annuler();
    pas.pause = pause;
    ecranPause.afficher(pause);
  };
  /** Les objets emportés que la partie a utilisés, un par emplacement utilisé. */
  const objetsUtilises = (): string[] => etat.config.objets.filter((_, i) => etat.objetsUtilises[i] === true);
  const resultatDe = (statut: 'victoire' | 'defaite' | 'abandon'): ResultatPartie => ({
    niveau: niveau.numero,
    statut,
    etoiles: statut === 'victoire' ? etat.etoiles : 0,
    vies: etat.vies,
    viesDepart: etat.viesDepart,
    pas: etat.pas,
    config: etat.config,
    journal: etat.journal,
    objetsUtilises: objetsUtilises(),
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
  const ecranPause = creerPause(racine, () => { definirPause(false); }, quitter);
  const hud = new Hud(racine, atlas, etat, {
    appelerVague: demanderVague,
    changerVitesse: () => {
      pas.vitesse = pas.vitesse === 1 ? 2 : 1;
    },
    basculerPause: () => { definirPause(!pas.pause); },
    basculerSort: (emplacement) => { traiter(interaction.basculerSort(etat, emplacement)); },
    basculerObjet: (emplacement) => { traiter(interaction.basculerObjet(etat, emplacement)); },
    basculerHeros: () => { traiter(interaction.basculerHeros(etat)); },
    choisirElement: (element) => { traiter(interaction.choisirElement(element)); },
  }, signal);

  // La carte peut dépasser de l'écran de la largeur des barres du HUD : une case collée au bord reste atteignable.
  const mesurerInterface = (): void => {
    rendu.definirMarges(mesurerMarges(hud.racine, canvas.clientWidth, canvas.clientHeight));
  };
  mesurerInterface();

  // --- Entrées : toucher, glisser, pincer, molette, clavier ---

  const pointeurSurTuiles = (x: number, y: number): void => {
    surbrillance.curseurX = rendu.enTuilesX(x);
    surbrillance.curseurY = rendu.enTuilesY(y);
    surbrillance.curseurActif = true;
  };
  const gestes = new Gestes({
    toucher: (x, y) => {
      if (finie || pas.pause) return;
      const rayon = Math.max(RAYON_TOUCHE_MIN_TUILES, RAYON_TOUCHE_CSS / rendu.pixelsCssParTuile);
      traiter(interaction.toucher(etat, rendu.enTuilesX(x), rendu.enTuilesY(y), rayon));
    },
    glisser: (dx, dy) => { rendu.camera.deplacer(dx * rendu.ratio, dy * rendu.ratio); },
    debutPincement: () => { rendu.camera.debutPincement(); },
    pincer: (facteur, x, y) => { rendu.camera.pincement(facteur, x * rendu.ratio, y * rendu.ratio); },
    survol: pointeurSurTuiles,
  });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    pointeurSurTuiles(e.clientX, e.clientY);
    gestes.appuyer(e.pointerId, e.clientX, e.clientY);
  }, { signal });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons !== 0) pointeurSurTuiles(e.clientX, e.clientY);
    gestes.bouger(e.pointerId, e.clientX, e.clientY);
  }, { signal });
  canvas.addEventListener('pointerup', (e) => { gestes.relacher(e.pointerId, e.clientX, e.clientY); }, { signal });
  canvas.addEventListener('pointercancel', (e) => { gestes.annuler(e.pointerId); }, { signal });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const facteur = e.deltaMode === 1 ? LIGNE_PIXELS : e.deltaMode === 2 ? PAGE_PIXELS : 1;
    rendu.camera.molette(e.deltaY * facteur, e.clientX * rendu.ratio, e.clientY * rendu.ratio);
  }, { signal, passive: false });
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    interaction.annuler();
  }, { signal });

  const executer = (commande: Commande): void => {
    if (finie) return;
    if (commande.type === 'pause') {
      definirPause(!pas.pause);
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
  window.addEventListener('blur', () => {
    gestes.reinitialiser();
    definirPause(true);
  }, { signal });
  const portrait = window.matchMedia('(orientation: portrait)');
  portrait.addEventListener('change', (e) => {
    if (e.matches) definirPause(true);
  }, { signal });
  if (portrait.matches) definirPause(true);
  if (options.reprise) {
    // Une partie reprise montre d'abord ce qu'elle contient (tours, ennemis), et attend que le joueur soit prêt.
    rendu.synchroniser(etat, temps);
    definirPause(true);
  }
  const surRedimension = (): void => {
    rendu.redimensionner();
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
    if (etat.statut === 'en_cours') return;
    const continuer = options.surContinuer;
    afficherFin(racine, atlas, { statut: etat.statut, etoiles: etat.etoiles, vies: etat.vies, viesDepart: etat.viesDepart }, {
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
        rendu.apresPas(etat, temps);
        mesures.pasSimules++;
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
    interaction.surbrillance(etat, surbrillance);
    rendu.dessiner(etat, pas.alpha, temps, surbrillance);
    mettreAJourMenu();
    hud.mettreAJour(etat, { vitesse: pas.vitesse, pause: pas.pause, mode: interaction.mode }, interaction.invite(etat));
    mesures.msDessin += performance.now() - debutDessin;
    mesures.images++;
  };

  /** Menu en cercle de la case sélectionnée, recalculé à chaque pas de simulation (prix, grisé) et replacé à chaque image. */
  const mettreAJourMenu = (): void => {
    const mode = interaction.mode;
    const centre = mode.type === 'menu' && caseExiste(etat.niveau.carte, mode.cx, mode.cy) ? centreCase(mode.cx, mode.cy) : null;
    if (mode.type !== 'menu' || !centre || finie) {
      if (elementsDuMenu) {
        elementsDuMenu = null;
        caseMenu = '';
        hud.placerMenu(null, versionMenu, 0, 0, 0, 0, 0);
      }
      return;
    }
    const cle = `${String(mode.cx)},${String(mode.cy)}`;
    if (!elementsDuMenu || etat.pas !== pasMenu || cle !== caseMenu) {
      elementsDuMenu = elementsMenu(etat, mode.cx, mode.cy);
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
    cancelAnimationFrame(identifiantImage);
    controleur.abort();
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
