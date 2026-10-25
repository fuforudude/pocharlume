// Une partie à l'écran : relie le moteur (src/engine), le rendu (src/render) et l'interface (HUD, gestes,
// clavier). C'est le point d'entrée que l'écran de carte du monde appelle : `lancerNiveau`.
//
// Règles de cette couche :
// - toutes les actions du joueur passent par `avancer` (donc par le journal) : on les met dans une file que
//   la boucle donne au prochain pas, on n'écrit jamais dans l'état ;
// - la simulation avance par pas fixes (PasFixes), le rendu interpole entre deux pas ;
// - tout ce que la partie installe (événements, DOM, boucle) est retiré par `arreter()`.
import type { NiveauCampagne } from '../data/visuel';
import { avancer, creerPartie, validerAction } from '../engine';
import type { Action, ConfigPartie, EntreeJournal, EtatPartie, ResultatAction } from '../engine';
import { chargerAtlas } from '../render/atlas';
import { ECART_MAX_MS, PasFixes } from '../render/pas-fixes';
import { Rendu, Surbrillance } from '../render/rendu';
import { commandeClavier, type Commande } from './clavier';
import { afficherFin, creerAvisPaysage, creerPause } from './ecrans';
import { Gestes } from './gestes';
import { Hud } from './hud';
import { Interaction, type Issue, type Mode } from './interaction';
import { elementsMenu, type ElementMenu } from './menu-cercle';
import { texteRefus } from './refus';
import { el } from './dom';

/** Résultat d'une partie terminée, transmis à `surFin` (étoiles, vies, journal pour une future vérification). */
export interface ResultatPartie {
  /** Numéro du niveau de campagne (1 à 100). */
  readonly niveau: number;
  readonly statut: 'victoire' | 'defaite';
  /** 0 en cas de défaite, 1 à 3 en cas de victoire. */
  readonly etoiles: number;
  readonly vies: number;
  readonly viesDepart: number;
  /** Durée en pas de simulation (30 par seconde). */
  readonly pas: number;
  readonly config: ConfigPartie;
  readonly journal: readonly EntreeJournal[];
}

export interface OptionsPartie {
  /** Où monter la partie ; par défaut `document.body`. */
  parent?: HTMLElement;
  /** Appelée par les boutons « Quitter » (pause et fin). Absente : ces boutons n'apparaissent pas. */
  surQuitter?: () => void;
  /** Appelée dès que la partie tourne, y compris après « Rejouer » (qui lance une nouvelle partie). */
  surDemarrage?: (partie: PartieEnCours) => void;
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

/** Zone de toucher autour d'un socle ou du héros : 44 px CSS de large au moins, soit un rayon de 22 px. */
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
 * `surFin` est appelée une seule fois, à la fin de la partie (victoire ou défaite), avec son résultat.
 * L'écran de fin propose « Rejouer » (nouvelle partie de ce niveau) et, si `options.surQuitter` existe, « Quitter ».
 */
export async function lancerNiveau(
  niveau: NiveauCampagne,
  config: ConfigPartie,
  surFin: (resultat: ResultatPartie) => void,
  options: OptionsPartie = {},
): Promise<PartieEnCours> {
  const atlas = await chargerAtlas();
  const etat = creerPartie(niveau.niveau, config);
  const parent = options.parent ?? document.body;
  const controleur = new AbortController();
  const { signal } = controleur;

  const racine = el('div', 'partie');
  const canvas = el('canvas', 'jeu');
  racine.append(canvas);
  parent.append(racine);
  document.body.classList.add('en-partie');
  creerAvisPaysage(racine);

  const rendu = new Rendu(canvas, atlas, niveau.niveau.carte, niveau.visuel);
  const surbrillance = new Surbrillance();
  const interaction = new Interaction();
  const pas = new PasFixes();
  const actions: Action[] = [];
  const mesures: Mesures = { images: 0, msDessin: 0, msSimulation: 0, pasSimules: 0 };
  let temps = 0;
  let arretee = false;
  let finie = false;
  let finVue = 0;
  let ecranFinAffiche = false;
  let identifiantImage = 0;
  let pasMenu = -1;
  let elementsDuMenu: ElementMenu[] | null = null;
  let socleMenu = -1;

  const envoyer = (action: Action): void => {
    actions.push(action);
  };
  const traiter = (issue: Issue): void => {
    if (issue.action) envoyer(issue.action);
    if (issue.refus !== null) hud.afficherMessage(texteRefus(issue.refus));
  };
  const definirPause = (pause: boolean): void => {
    if (finie) return;
    if (pause && !pas.pause) interaction.annuler();
    pas.pause = pause;
    ecranPause.afficher(pause);
  };
  const quitter = options.surQuitter
    ? (): void => {
        arreter();
        options.surQuitter?.();
      }
    : undefined;
  const ecranPause = creerPause(racine, () => { definirPause(false); }, quitter);
  const hud = new Hud(racine, atlas, etat, {
    appelerVague: () => {
      const refus = validerAction(etat, { type: 'appelerVague' });
      if (refus === null) envoyer({ type: 'appelerVague' });
      else hud.afficherMessage(texteRefus(refus));
    },
    changerVitesse: () => {
      pas.vitesse = pas.vitesse === 1 ? 2 : 1;
    },
    basculerPause: () => { definirPause(!pas.pause); },
    basculerSort: (emplacement) => { traiter(interaction.basculerSort(etat, emplacement)); },
    basculerHeros: () => { traiter(interaction.basculerHeros(etat)); },
    choisirElement: (element) => { traiter(interaction.choisirElement(element)); },
  }, signal);

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
      case 'heros':
        traiter(interaction.basculerHeros(etat));
        break;
      case 'vague': {
        const refus = validerAction(etat, { type: 'appelerVague' });
        if (refus === null) envoyer({ type: 'appelerVague' });
        else hud.afficherMessage(texteRefus(refus));
        break;
      }
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
  const surRedimension = (): void => { rendu.redimensionner(); };
  window.addEventListener('resize', surRedimension, { signal });
  window.addEventListener('orientationchange', surRedimension, { signal });

  // --- Fin de partie ---

  const terminer = (): void => {
    finie = true;
    interaction.annuler();
    if (etat.statut === 'en_cours') return;
    const resultat: ResultatPartie = {
      niveau: niveau.numero,
      statut: etat.statut,
      etoiles: etat.etoiles,
      vies: etat.vies,
      viesDepart: etat.viesDepart,
      pas: etat.pas,
      config: etat.config,
      journal: etat.journal,
    };
    surFin(resultat);
  };
  const montrerEcranFin = (): void => {
    ecranFinAffiche = true;
    if (etat.statut === 'en_cours') return;
    afficherFin(racine, atlas, { statut: etat.statut, etoiles: etat.etoiles, vies: etat.vies, viesDepart: etat.viesDepart }, {
      surRejouer: () => {
        arreter();
        lancerNiveau(niveau, { ...config, graine: graineSuivante(config.graine) }, surFin, options).catch(console.error);
      },
      ...(quitter ? { surQuitter: quitter } : {}),
    });
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
        for (const r of resultats) if (!r.ok) hud.afficherMessage(texteRefus(r.raison));
        actions.length = 0;
        rendu.apresPas(etat, temps);
        mesures.pasSimules++;
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

  /** Menu en cercle du socle sélectionné, recalculé à chaque pas de simulation (prix, grisé) et replacé à chaque image. */
  const mettreAJourMenu = (): void => {
    const mode = interaction.mode;
    const socle = etat.niveau.carte.socles[mode.type === 'menu' ? mode.socle : -1];
    if (mode.type !== 'menu' || !socle || finie) {
      if (elementsDuMenu) {
        elementsDuMenu = null;
        socleMenu = -1;
        hud.placerMenu(null, 0, 0, 0, 0, 0);
      }
      return;
    }
    if (!elementsDuMenu || etat.pas !== pasMenu || mode.socle !== socleMenu) {
      elementsDuMenu = elementsMenu(etat, mode.socle);
      pasMenu = etat.pas;
      socleMenu = mode.socle;
    }
    const largeur = window.innerWidth;
    const hauteur = window.innerHeight;
    const rayon = Math.min(78, Math.max(56, hauteur * 0.19));
    hud.placerMenu(elementsDuMenu, rendu.enCssX(socle.x), rendu.enCssY(socle.y - 0.6), largeur, hauteur, rayon);
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
