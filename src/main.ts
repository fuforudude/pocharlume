// Point d'entrée du navigateur : ouvre la sauvegarde, puis enchaîne les écrans (accueil, carte du monde, fiche
// de niveau, partie, options). Ce fichier ne contient que de l'enchaînement : la logique est dans src/save/
// (session) et dans src/ui/ (carte-monde-logique, partie), où elle est testée.
import './ui/style.css';
import './ui/style-meta.css';
import { installerAudio } from './audio';
import { DEFS_META } from './data/heros';
import { REGION1 } from './data/niveaux/region1';
import type { NiveauCampagne } from './data/visuel';
import type { DefiPartie, EtatPartie } from './engine';
import { t } from './i18n';
import { chargerAtlas } from './render/atlas';
import { Depot, difficulteDe, ouvrirCanalNavigateur, ouvrirStockage, Session, type ChoixPartie, type DifficulteSauvegarde } from './save';
import { afficherBoutique } from './ui/boutique';
import { afficherCarteMonde, type EcranCarteMonde } from './ui/carte-monde';
import { afficherEcranHeros } from './ui/ecran-heros';
import { afficherAccueil, afficherAvis, type ChoixNiveau } from './ui/ecrans';
import { configDeRelance, configDuChoix, debiterAuLancement, nouvelleGraine, relancerAvecDebit } from './ui/lancement';
import { choixJouable } from './ui/meta-vues';
import { NIVEAU_CAMPAGNE_TEST } from './ui/niveau-test';
import { afficherOptions } from './ui/options';
import { lancerNiveau, graineSuivante, type PartieEnCours } from './ui/partie';
import { texteRefusMeta } from './ui/raisons-meta';
import { niveauDeCampagne } from './ui/regions-monde';

const conteneur = document.querySelector<HTMLElement>('#app');
if (!conteneur) throw new Error('Conteneur #app introuvable');
const app: HTMLElement = conteneur;

let session: Session;
let carteOuverte: EcranCarteMonde | null = null;
/** Difficulté cochée dans la fiche : celle du dernier niveau lancé. */
let derniereDifficulte: DifficulteSauvegarde = 'matou';
/** Région montrée sur la carte du monde : la dernière regardée (absente : la plus haute région ouverte). */
let derniereRegion: number | undefined;

interface OptionsLancement {
  /** Défi joué (Héroïque, Fer) ; absent : partie ordinaire. */
  readonly defi?: DefiPartie;
  /** Dieu, héros et objets choisis sur la fiche ; absent : le dernier choix mémorisé dans la sauvegarde. */
  readonly choix?: ChoixPartie;
  /** Partie sauvegardée à relancer. */
  readonly reprise?: EtatPartie;
  /** Raccourci de développement : la partie ne touche pas à la sauvegarde. */
  readonly horsSauvegarde?: boolean;
}

async function jouer(niveau: NiveauCampagne, difficulte: DifficulteSauvegarde, lancement: OptionsLancement = {}): Promise<void> {
  carteOuverte?.arreter();
  carteOuverte = null;
  app.replaceChildren();
  const { reprise, horsSauvegarde } = lancement;
  let config = reprise?.config;
  if (!config) {
    // Tout ce qui entre dans la partie (dieu, héros et son niveau, compétences, arbre, objets) est figé ici.
    const demande = lancement.defi ? { niveau: niveau.numero, defi: lancement.defi } : undefined;
    const composee = configDuChoix(session.sauvegarde, lancement.choix ?? choixJouable(session.sauvegarde), difficulte, nouvelleGraine(), demande);
    if (!composee.ok) {
      afficherAvis(document.body, t('fiche.lancement_refuse', { raison: texteRefusMeta(composee.raison) }));
      carte();
      return;
    }
    config = composee.config;
    // Les objets emportés sont débités du stock tout de suite, sous verrou : si le stock ne les couvre plus, la partie ne démarre pas.
    if (!horsSauvegarde) {
      const debit = await debiterAuLancement(session, config);
      if (!debit.ok) {
        afficherAvis(document.body, debit.refus);
        carte();
        return;
      }
    }
  }
  // La partie reprise est déjà dans la sauvegarde ; une nouvelle partie n'y est qu'à partir de sa première vague.
  let enSauvegarde = reprise !== undefined;
  // En développement seulement : la console du navigateur peut piloter et mesurer la partie.
  const surDemarrage = import.meta.env.DEV
    ? (partie: PartieEnCours): void => {
        (window as unknown as { __partie?: PartieEnCours }).__partie = partie;
      }
    : undefined;
  lancerNiveau(
    niveau,
    config,
    // Victoire ou défaite : méta-progression et progression enregistrées ; le bilan (gains, niveau du héros) revient à l'écran de fin.
    (resultat) => (horsSauvegarde ? Promise.resolve(null) : session.enregistrerFin(resultat)),
    {
      parent: app,
      vitesse: session.sauvegarde.reglages.vitesse,
      // « Rejouer » : même dieu, héros et objets (ceux que la partie a consommés ne sont plus emportés), nouvelle graine.
      // Comme tout lancement, il débite les objets du stock ; refusé, l'écran de fin reste en place.
      nouvelleConfig: async (precedente) => {
        const graine = graineSuivante(precedente.graine);
        if (horsSauvegarde) return configDeRelance(session.sauvegarde, precedente, graine, niveau.numero);
        const r = await relancerAvecDebit(session, precedente, graine, niveau.numero);
        if (r.ok) return r.config;
        afficherAvis(document.body, r.refus);
        return null;
      },
      surQuitter: (abandon) => {
        // Abandon d'une partie en cours : ni expérience ni récompense, les objets non utilisés sont rendus, et la
        // partie sauvegardée qui était la sienne est effacée. Une partie déjà finie a déjà été enregistrée.
        if (!horsSauvegarde) {
          if (abandon) session.enregistrerFin(abandon).catch(console.error);
          else if (enSauvegarde) session.effacerPartie().catch(console.error);
        }
        carte();
      },
      surContinuer: carte,
      ...(horsSauvegarde
        ? {}
        : {
            surVague: (etat: EtatPartie) => {
              enSauvegarde = true;
              session.rangerPartie(etat, niveau.numero).catch(console.error);
            },
            // Un objet utilisé est rangé aussitôt : une reprise ne doit pas le rendre de nouveau disponible.
            surObjet: (etat: EtatPartie) => {
              session.rangerPartie(etat, niveau.numero).then((rangee) => { if (rangee) enSauvegarde = true; }).catch(console.error);
            },
          }),
      ...(reprise ? { reprise } : {}),
      ...(surDemarrage ? { surDemarrage } : {}),
    },
  ).catch((erreur: unknown) => {
    console.error(erreur);
    // Pas d'écran noir : on prévient, on efface une reprise qui ne démarre pas, et on revient à l'écran d'avant.
    document.body.classList.remove('en-partie');
    app.replaceChildren();
    afficherAvis(document.body, t('erreur.chargement'));
    if (reprise && !horsSauvegarde) void session.effacerPartie();
    if (reprise || horsSauvegarde) accueil();
    else carte();
  });
}

function carte(): void {
  carteOuverte?.arreter();
  carteOuverte = null;
  app.replaceChildren();
  chargerAtlas()
    .then((atlas) => {
      carteOuverte = afficherCarteMonde(app, {
        atlas,
        session,
        difficulte: derniereDifficulte,
        partieEnCours: partieEnCours(),
        ...(derniereRegion === undefined ? {} : { region: derniereRegion }),
        surRegion: (numero) => {
          derniereRegion = numero;
        },
        surLancer: (niveau, difficulte, choix, defi) => {
          // Un défi se joue en Matou, imposé : la difficulté cochée dans la fiche n'est pas changée.
          if (defi === null) derniereDifficulte = difficulte;
          jouer(niveau, difficulte, { choix, ...(defi === null ? {} : { defi }) }).catch(console.error);
        },
        // Les écrans des héros et de la boutique couvrent la carte, qui dort dessous puis est rouverte (elle relit la sauvegarde).
        surHeros: () => {
          carteOuverte?.suspendre(true);
          afficherEcranHeros(app, { atlas, session, surFermer: carte });
        },
        surBoutique: () => {
          carteOuverte?.suspendre(true);
          afficherBoutique(app, { atlas, session, surFermer: carte });
        },
        surOptions: () => {
          // La carte dort sous les options : plus de clavier ni de dessin ; elle est rouverte à la fermeture.
          carteOuverte?.suspendre(true);
          afficherOptions(app, session, carte);
        },
        surRetour: accueil,
      });
    })
    .catch((erreur: unknown) => {
      console.error(erreur);
      afficherAvis(document.body, t('erreur.chargement'));
      accueil();
    });
}

/** La partie en cours qu'un nouveau lancement remplacerait, ou null. */
function partieEnCours(): { niveau: number; vague: number } | null {
  const reprise = session.partieAReprendre();
  return reprise ? { niveau: reprise.niveau, vague: reprise.vague } : null;
}

/** Les raccourcis de test de l'accueil : jamais sur le site public. */
function raccourcisDeveloppement(): readonly ChoixNiveau[] {
  if (!import.meta.env.DEV) return [];
  const dernier = REGION1[REGION1.length - 1];
  if (!dernier) return [];
  return [
    { libelle: t('accueil.niveau', { n: dernier.numero }), surChoisir: () => { jouer(dernier, 'matou', { horsSauvegarde: true }).catch(console.error); } },
    { libelle: t('accueil.niveau_test'), surChoisir: () => { jouer(NIVEAU_CAMPAGNE_TEST, 'matou', { horsSauvegarde: true }).catch(console.error); } },
  ];
}

function accueil(): void {
  carteOuverte?.arreter();
  carteOuverte = null;
  app.replaceChildren();
  const { reprise, oubliee } = session.examinerPartie();
  if (oubliee) afficherAvis(document.body, t('sauvegarde.partie_oubliee'));
  const niveauRepris = reprise ? niveauDeCampagne(reprise.niveau) : undefined;
  afficherAccueil(app, {
    surJouer: carte,
    surOptions: () => {
      afficherOptions(app, session, accueil);
    },
    autres: raccourcisDeveloppement(),
    ...(reprise && niveauRepris
      ? {
          reprise: {
            vague: reprise.vague,
            surReprendre: () => {
              jouer(niveauRepris, difficulteDe(reprise.etat.config) ?? derniereDifficulte, { reprise: reprise.etat }).catch(console.error);
            },
          },
        }
      : {}),
  });
}

/** Un avis discret quand la sauvegarde n'a pas pu être relue ou ne sera pas gardée. */
function avertirSauvegarde(origine: Session['origine'], stockageEnMemoire: boolean): void {
  if (origine === 'corrompue') afficherAvis(document.body, t('sauvegarde.corrompue'));
  else if (origine === 'trop_recente') afficherAvis(document.body, t('sauvegarde.trop_recente'));
  else if (origine === 'indisponible' || stockageEnMemoire) afficherAvis(document.body, t('sauvegarde.indisponible'));
}

async function demarrer(): Promise<void> {
  const { stockage, nom } = await ouvrirStockage();
  session = await Session.ouvrir(new Depot(stockage), ouvrirCanalNavigateur(), { defs: DEFS_META });
  installerAudio(() => session.sauvegarde.reglages);
  accueil();
  avertirSauvegarde(session.origine, nom === 'memoire');
}

demarrer().catch((erreur: unknown) => {
  console.error(erreur);
});
