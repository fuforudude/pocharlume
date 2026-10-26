// Point d'entrée du navigateur : ouvre la sauvegarde, puis enchaîne les écrans (accueil, carte du monde, fiche
// de niveau, partie, options). Ce fichier ne contient que de l'enchaînement : la logique est dans src/save/
// (session) et dans src/ui/ (carte-monde-logique, partie), où elle est testée.
import './ui/style.css';
import './ui/style-meta.css';
import { DEFS_META } from './data/heros';
import { REGION1 } from './data/niveaux/region1';
import type { NiveauCampagne } from './data/visuel';
import type { EtatPartie } from './engine';
import { t } from './i18n';
import { chargerAtlas } from './render/atlas';
import { Depot, difficulteDe, ouvrirCanalNavigateur, ouvrirStockage, Session, type ChoixPartie, type DifficulteSauvegarde } from './save';
import { afficherBoutique } from './ui/boutique';
import { afficherCarteMonde, type EcranCarteMonde } from './ui/carte-monde';
import { afficherEcranHeros } from './ui/ecran-heros';
import { afficherAccueil, afficherAvis, type ChoixNiveau } from './ui/ecrans';
import { configDeRelance, configDuChoix, nouvelleGraine } from './ui/lancement';
import { choixJouable } from './ui/meta-vues';
import { NIVEAU_CAMPAGNE_TEST } from './ui/niveau-test';
import { afficherOptions } from './ui/options';
import { lancerNiveau, graineSuivante, type PartieEnCours } from './ui/partie';
import { texteRefusMeta } from './ui/raisons-meta';

const conteneur = document.querySelector<HTMLElement>('#app');
if (!conteneur) throw new Error('Conteneur #app introuvable');
const app: HTMLElement = conteneur;

let session: Session;
let carteOuverte: EcranCarteMonde | null = null;
/** Difficulté cochée dans la fiche : celle du dernier niveau lancé. */
let derniereDifficulte: DifficulteSauvegarde = 'matou';

interface OptionsLancement {
  /** Dieu, héros et objets choisis sur la fiche ; absent : le dernier choix mémorisé dans la sauvegarde. */
  readonly choix?: ChoixPartie;
  /** Partie sauvegardée à relancer. */
  readonly reprise?: EtatPartie;
  /** Raccourci de développement : la partie ne touche pas à la sauvegarde. */
  readonly horsSauvegarde?: boolean;
}

function jouer(niveau: NiveauCampagne, difficulte: DifficulteSauvegarde, lancement: OptionsLancement = {}): void {
  carteOuverte?.arreter();
  carteOuverte = null;
  app.replaceChildren();
  const { reprise, horsSauvegarde } = lancement;
  let config = reprise?.config;
  if (!config) {
    // Tout ce qui entre dans la partie (dieu, héros et son niveau, compétences, arbre, objets) est figé ici.
    const composee = configDuChoix(session.sauvegarde, lancement.choix ?? choixJouable(session.sauvegarde), difficulte, nouvelleGraine());
    if (!composee.ok) {
      afficherAvis(document.body, t('fiche.lancement_refuse', { raison: texteRefusMeta(composee.raison) }));
      carte();
      return;
    }
    config = composee.config;
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
      nouvelleConfig: (precedente) => configDeRelance(session.sauvegarde, precedente, graineSuivante(precedente.graine)),
      surQuitter: (abandon) => {
        // Abandon d'une partie en cours : une défaite (objets utilisés consommés, expérience de défaite, sans gain de
        // victoire) qui efface aussi la partie sauvegardée. Une partie déjà finie a déjà été enregistrée.
        if (!horsSauvegarde) {
          if (abandon) void session.enregistrerFin(abandon);
          else if (enSauvegarde) void session.effacerPartie();
        }
        carte();
      },
      surContinuer: carte,
      ...(horsSauvegarde
        ? {}
        : {
            surVague: (etat: EtatPartie) => {
              enSauvegarde = true;
              void session.rangerPartie(etat, niveau.numero);
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
        surLancer: (niveau, difficulte, choix) => {
          derniereDifficulte = difficulte;
          jouer(niveau, difficulte, { choix });
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
    { libelle: t('accueil.niveau', { n: dernier.numero }), surChoisir: () => { jouer(dernier, 'matou', { horsSauvegarde: true }); } },
    { libelle: t('accueil.niveau_test'), surChoisir: () => { jouer(NIVEAU_CAMPAGNE_TEST, 'matou', { horsSauvegarde: true }); } },
  ];
}

function accueil(): void {
  carteOuverte?.arreter();
  carteOuverte = null;
  app.replaceChildren();
  const { reprise, oubliee } = session.examinerPartie();
  if (oubliee) afficherAvis(document.body, t('sauvegarde.partie_oubliee'));
  const niveauRepris = reprise ? REGION1.find((n) => n.numero === reprise.niveau) : undefined;
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
              jouer(niveauRepris, difficulteDe(reprise.etat.config) ?? derniereDifficulte, { reprise: reprise.etat });
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
  accueil();
  avertirSauvegarde(session.origine, nom === 'memoire');
}

demarrer().catch((erreur: unknown) => {
  console.error(erreur);
});
