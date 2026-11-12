// Point d'entrée du navigateur : ouvre la sauvegarde, puis enchaîne les écrans (accueil, carte du monde, fiche
// de niveau, partie, options). Ce fichier ne contient que de l'enchaînement : la logique est dans src/save/
// (session) et dans src/ui/ (carte-monde-logique, partie), où elle est testée.
import './ui/style.css';
import './ui/style-meta.css';
import './ui/style-inscriptions.css';
import './ui/style-bestiaire.css';
import './ui/style-bulles.css';
import './ui/style-indications.css';
import './ui/style-notes.css';
import './ui/style-moderne.css';
import { installerAudio } from './audio';
import { campagneDuNiveau, type IdCampagne } from './data/campagnes';
import { DEFS_META } from './data/heros';
import { REGION1 } from './data/niveaux/region1';
import type { NiveauCampagne } from './data/visuel';
import type { DefiPartie, EtatPartie } from './engine';
import { t } from './i18n';
import { chargerAtlas, type AtlasRendu } from './render/atlas';
import { campagneTerminee, Depot, difficulteDe, infiniOuvert, inscriptionTrouvee, ouvrirCanalNavigateur, ouvrirStockage, recordDeLaCarte, Session, stickerDlcReplie, type ChoixPartie, type DifficulteSauvegarde } from './save';
import { afficherBestiaire } from './ui/bestiaire';
import { ennemisAMontrer } from './ui/fiches-ennemis';
import { afficherBoutique } from './ui/boutique';
import { afficherCaisses } from './ui/caisses';
import { afficherCarteMonde, type EcranCarteMonde } from './ui/carte-monde';
import { afficherCollection } from './ui/collection';
import { afficherEcranHeros } from './ui/ecran-heros';
import { afficherEcranInfini } from './ui/ecran-infini';
import { afficherEcranInscriptions } from './ui/ecran-inscriptions';
import { afficherAccueil, afficherAvis, afficherConfirmation, afficherFinCampagne, type ChoixNiveau } from './ui/ecrans';
import { lignesBilanInfini, vueCartesInfini } from './ui/infini-vues';
import { configDeRelance, configDuChoix, configInfini, debiterAuLancement, nouvelleGraine, relancerAvecDebit } from './ui/lancement';
import { choixJouable } from './ui/meta-vues';
import { NIVEAU_CAMPAGNE_TEST } from './ui/niveau-test';
import { installerIndicationsClavier } from './ui/indications-clavier';
import { installerNotes } from './ui/notes';
import { afficherOptions } from './ui/options';
import { lancerNiveau, graineSuivante, type PartieEnCours, type ResultatPartie, type RetourFin } from './ui/partie';
import { texteRefusMeta } from './ui/raisons-meta';
import { niveauDeCampagne, REGIONS_MONDE_MODERNE } from './ui/regions-monde';
import { particulariteAMontrer } from './ui/particularites';

const conteneur = document.querySelector<HTMLElement>('#app');
if (!conteneur) throw new Error('Conteneur #app introuvable');
const app: HTMLElement = conteneur;
// L'éditeur de notes s'affiche d'abord : le jeu se prépare dessous, la touche de secours bascule de l'un à l'autre.
installerNotes(app);

let session: Session;
let carteOuverte: EcranCarteMonde | null = null;
/** Difficulté cochée dans la fiche : celle du dernier niveau lancé. */
let derniereDifficulte: DifficulteSauvegarde = 'matou';
/** Région montrée sur la carte du monde : la dernière regardée (absente : la plus haute région ouverte). */
let derniereRegion: number | undefined;
/** Région montrée sur la carte du DLC : la dernière regardée (absente : la plus haute région ouverte du DLC). */
let derniereRegionModerne: number | undefined;
/** Campagne de la dernière carte du monde ouverte : c'est elle qu'on rouvre en fermant les héros, la boutique ou les options. */
let derniereCampagne: IdCampagne = 'histoire';
/** Carte cochée dans l'écran du mode infini : la dernière jouée. */
let derniereCarteInfini: string | undefined;

interface OptionsLancement {
  /** Défi joué (Héroïque, Fer) ; absent : partie ordinaire. */
  readonly defi?: DefiPartie;
  /** Dieu, héros et objets choisis sur la fiche ; absent : le dernier choix mémorisé dans la sauvegarde. */
  readonly choix?: ChoixPartie;
  /** Partie sauvegardée à relancer. */
  readonly reprise?: EtatPartie;
  /** Raccourci de développement : la partie ne touche pas à la sauvegarde. */
  readonly horsSauvegarde?: boolean;
  /** Niveau d'essai d'un gimmick (développement) : hors sauvegarde, mais la fiche « Nouvelle particularité » s'ouvre quand même. */
  readonly essai?: boolean;
  /** Partie du mode infini : la carte jouée et sa région. Le niveau passé à `jouer` fournit la carte et ses entrées. */
  readonly infini?: { readonly carte: string; readonly region: number };
}

async function jouer(niveau: NiveauCampagne, difficulte: DifficulteSauvegarde, lancement: OptionsLancement = {}): Promise<void> {
  carteOuverte?.arreter();
  carteOuverte = null;
  app.replaceChildren();
  const { reprise, horsSauvegarde, infini } = lancement;
  let config = reprise?.config;
  if (!config) {
    // Tout ce qui entre dans la partie (dieu, héros et son niveau, compétences, arbre, objets) est figé ici.
    const demande = lancement.defi ? { niveau: niveau.numero, defi: lancement.defi } : undefined;
    const choix = lancement.choix ?? choixJouable(session.sauvegarde);
    const composee = infini
      ? configInfini(session.sauvegarde, choix, nouvelleGraine(), infini.region)
      : configDuChoix(session.sauvegarde, choix, difficulte, nouvelleGraine(), demande);
    if (!composee.ok) {
      afficherAvis(document.body, t('fiche.lancement_refuse', { raison: texteRefusMeta(composee.raison) }));
      if (infini) accueil();
      else carte();
      return;
    }
    config = composee.config;
    // Les objets emportés sont débités du stock tout de suite, sous verrou : si le stock ne les couvre plus, la partie ne démarre pas.
    if (!horsSauvegarde) {
      const debit = await debiterAuLancement(session, config);
      if (!debit.ok) {
        afficherAvis(document.body, debit.refus);
        if (infini) accueil();
        else carte();
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
  // Le bilan de la victoire en cours d'enregistrement : « Continuer » attend de savoir si c'était la fin de la campagne.
  let bilanVictoire: Promise<{ readonly bilan: { readonly campagneTerminee?: true } | null }> | null = null;
  lancerNiveau(
    niveau,
    config,
    // Victoire ou défaite : méta-progression et progression enregistrées ; le bilan (gains, niveau du héros) revient à l'écran de fin.
    // Mode infini : record de la carte et paliers.
    (resultat) => {
      if (horsSauvegarde) return Promise.resolve(null);
      if (infini) return enregistrerInfini(infini.carte, resultat);
      const enregistre = session.enregistrerFin(resultat);
      bilanVictoire = enregistre;
      return enregistre;
    },
    {
      parent: app,
      vitesse: session.sauvegarde.reglages.vitesse,
      // Skins et familier équipés : le rendu habille les tours et le héros (même en défi Fer, où seul le bonus est ignoré).
      equipes: session.sauvegarde.meta.collection.equipes,
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
        // Mode infini : l'abandon garde le record atteint (et paie les paliers), et efface sa partie sauvegardée.
        if (!horsSauvegarde) {
          if (abandon && infini) enregistrerInfini(infini.carte, abandon).catch(console.error);
          else if (abandon) session.enregistrerFin(abandon).catch(console.error);
          else if (enSauvegarde) session.effacerPartie().catch(console.error);
        }
        if (infini) accueil();
        else carte();
      },
      surContinuer: () => {
        // La première victoire sur le Soleil Blême finit la campagne : l'écran de fin passe avant le retour à la carte.
        (bilanVictoire ?? Promise.resolve(null))
          .then((r) => { if (r?.bilan?.campagneTerminee === true) finDeCampagne(); else carte(); })
          .catch((erreur: unknown) => { console.error(erreur); carte(); });
      },
      // Une vieille statue touchée : son inscription entre au recueil (la première fois seulement). Hors sauvegarde, rien n'est gagné.
      surInscription: (id) => {
        if (horsSauvegarde) return null;
        const nouvelle = !inscriptionTrouvee(session.sauvegarde, id);
        if (nouvelle) session.trouverInscription(id).catch(console.error);
        return nouvelle;
      },
      // Un ennemi paraît pour la première fois dans cette partie : il entre au bestiaire (pour toujours) et, si l'option est active et qu'il
      // n'avait jamais été rencontré, sa fiche « Nouvel ennemi » s'ouvre. Hors sauvegarde, rien n'est noté ni montré.
      surNouveauxEnnemis: (ids: string[]): string[] => ennemisAMontrer(session, ids, horsSauvegarde === true),
      // Un niveau à particularité : la première fois, elle est notée et sa fiche s'ouvre (même option que « Nouvel ennemi »).
      surNouvelleParticularite: (type) => particulariteAMontrer(session, type, horsSauvegarde === true, lancement.essai === true),
      // « Bestiaire » dans la pause : monté dans la partie par-dessus la pause ; c'est la partie qui le possède et le ferme.
      surBestiaire: (parent: HTMLElement, atlas: AtlasRendu, surFermer: () => void) => afficherBestiaire(parent, { atlas, session, surFermer, campagne: campagneDuNiveau(niveau.niveau) }),
      ...(infini ? { infini: { record: () => recordDeLaCarte(session.sauvegarde, infini.carte) } } : {}),
      ...(horsSauvegarde
        ? {}
        : {
            surVague: (etat: EtatPartie) => {
              enSauvegarde = true;
              session.rangerPartie(etat, niveau.numero, infini?.carte).catch(console.error);
            },
            // Un objet utilisé est rangé aussitôt : une reprise ne doit pas le rendre de nouveau disponible.
            surObjet: (etat: EtatPartie) => {
              session.rangerPartie(etat, niveau.numero, infini?.carte).then((rangee) => { if (rangee) enSauvegarde = true; }).catch(console.error);
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
    if (reprise || horsSauvegarde || infini) accueil();
    else carte();
  });
}

/** La fin d'une partie infinie : record de la carte, paliers payés une seule fois, objets rendus ; le bilan pour l'écran de fin. */
async function enregistrerInfini(carte: string, resultat: ResultatPartie): Promise<RetourFin> {
  const r = await session.enregistrerFinInfini(
    { carte, vague: resultat.vagueTerminee, objetsEquipes: resultat.config.objets, objetsUtilises: resultat.objetsUtilises },
    resultat.config.graine,
  );
  return { bilan: null, refus: null, lignesInfini: r.ok ? lignesBilanInfini(r.detail, carte) : null };
}

/** L'écran de fin de campagne, puis la carte du monde. */
function finDeCampagne(): void {
  afficherFinCampagne(app, { illustration: `${import.meta.env.BASE_URL}illustrations/fin-campagne.png`, surContinuer: carte });
}

/** L'écran du mode infini : choix de la carte, du dieu, du héros et des objets. */
function ecranInfini(): void {
  chargerAtlas()
    .then((atlas) => {
      afficherEcranInfini(app, {
        atlas,
        session,
        ...(derniereCarteInfini === undefined ? {} : { carte: derniereCarteInfini }),
        surRetour: accueil,
        surLancer: (choisie, choix) => {
          derniereCarteInfini = choisie.id;
          const lancer = (): void => {
            jouer(choisie.niveau, 'matou', { choix, infini: { carte: choisie.id, region: choisie.region } }).catch(console.error);
          };
          // Lancer une nouvelle partie remplace celle qu'on pourrait reprendre : on le dit d'abord.
          const enCours = partieEnCours();
          if (!enCours) {
            lancer();
            return;
          }
          afficherConfirmation(app, {
            titre: t('lancer.perte_titre'),
            detail: t(enCours.infini ? 'lancer.perte_detail_infini' : 'lancer.perte_detail', { n: enCours.niveau, m: enCours.vague }),
            confirmer: t('lancer.confirmer'),
            annuler: t('lancer.annuler'),
            surConfirmer: lancer,
            surAnnuler: ecranInfini,
          });
        },
      });
    })
    .catch((erreur: unknown) => {
      console.error(erreur);
      afficherAvis(document.body, t('erreur.chargement'));
    });
}

/** La carte du monde de l'histoire. */
function carte(): void {
  ouvrirCarte('histoire');
}

/** La carte du monde du DLC « Temps modernes » (menu principal, sticker ou bouton « DLC » des cartes de l'histoire). */
function carteModerne(): void {
  ouvrirCarte('moderne');
}

/** Rouvre la carte du monde de la dernière campagne montrée (fermeture des héros, de la boutique, des options…). */
function rouvrirCarte(): void {
  ouvrirCarte(derniereCampagne);
}

function ouvrirCarte(campagne: IdCampagne): void {
  derniereCampagne = campagne;
  const moderne = campagne === 'moderne';
  carteOuverte?.arreter();
  carteOuverte = null;
  app.replaceChildren();
  chargerAtlas()
    .then((atlas) => {
      const region = moderne ? derniereRegionModerne : derniereRegion;
      carteOuverte = afficherCarteMonde(app, {
        atlas,
        session,
        difficulte: derniereDifficulte,
        partieEnCours: partieEnCours(),
        ...(moderne
          ? {
              campagne,
              regions: REGIONS_MONDE_MODERNE,
              // Le Bestiaire du DLC : ses ennemis ont leurs images dans l'atlas du DLC, chargé ici (une seule fois).
              surBestiaire: () => {
                carteOuverte?.suspendre(true);
                chargerAtlas('moderne')
                  .then((atlasModerne) => afficherBestiaire(app, { atlas: atlasModerne, session, surFermer: rouvrirCarte, campagne: 'moderne' }))
                  .catch((erreur: unknown) => {
                    console.error(erreur);
                    afficherAvis(document.body, t('erreur.chargement'));
                    rouvrirCarte();
                  });
              },
            }
          : {
              // La campagne finie : l'écran de fin ne se perd pas si le joueur a cliqué « Rejouer » ou fermé l'onglet.
              ...(campagneTerminee(session.sauvegarde) ? { surRevoirFin: finDeCampagne } : {}),
              surInscriptions: () => {
                carteOuverte?.suspendre(true);
                afficherEcranInscriptions(app, { atlas, session, surFermer: rouvrirCarte });
              },
              surBestiaire: () => {
                carteOuverte?.suspendre(true);
                afficherBestiaire(app, { atlas, session, surFermer: rouvrirCarte });
              },
              // Le sticker « DLC disponible ! » : un clic ouvre la carte du DLC, la croix le replie (choix gardé dans la sauvegarde).
              sticker: {
                replie: stickerDlcReplie(session.sauvegarde),
                surOuvrir: carteModerne,
                surReplier: () => { session.replierStickerDlc(true).catch(console.error); },
              },
            }),
        ...(region === undefined ? {} : { region }),
        surRegion: (numero) => {
          if (moderne) derniereRegionModerne = numero;
          else derniereRegion = numero;
        },
        surLancer: (niveau, difficulte, choix, defi) => {
          // Les niveaux du DLC ne se jouent pas encore : leur fin de partie (progression du DLC, badges) arrive avec leur contenu.
          if (moderne) {
            afficherAvis(document.body, t('moderne.bientot'));
            carteModerne();
            return;
          }
          // Un défi se joue en Matou, imposé : la difficulté cochée dans la fiche n'est pas changée.
          if (defi === null) derniereDifficulte = difficulte;
          jouer(niveau, difficulte, { choix, ...(defi === null ? {} : { defi }) }).catch(console.error);
        },
        // Les écrans des héros et de la boutique couvrent la carte, qui dort dessous puis est rouverte (elle relit la sauvegarde).
        surHeros: () => {
          carteOuverte?.suspendre(true);
          afficherEcranHeros(app, { atlas, session, surFermer: rouvrirCarte });
        },
        surBoutique: () => {
          carteOuverte?.suspendre(true);
          ouvrirBoutique(atlas);
        },
        surOptions: () => {
          // La carte dort sous les options : plus de clavier ni de dessin ; elle est rouverte à la fermeture.
          carteOuverte?.suspendre(true);
          afficherOptions(app, session, rouvrirCarte);
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

// La boutique, les caisses et la collection se passent la main : elles couvrent la carte (qui dort dessous), « Fermer » dans
// les caisses ou la collection revient à la boutique, « Fermer » dans la boutique rouvre la carte.
function ouvrirBoutique(atlas: AtlasRendu): void {
  const ecran = afficherBoutique(app, {
    atlas,
    session,
    surFermer: rouvrirCarte,
    surCaisses: () => { ecran.arreter(); ouvrirCaisses(atlas); },
    surCollection: () => { ecran.arreter(); ouvrirCollection(atlas); },
  });
}

function ouvrirCaisses(atlas: AtlasRendu): void {
  const ecran = afficherCaisses(app, {
    atlas,
    session,
    surFermer: () => { ouvrirBoutique(atlas); },
    surCollection: () => { ecran.arreter(); ouvrirCollection(atlas); },
  });
}

function ouvrirCollection(atlas: AtlasRendu): void {
  const ecran = afficherCollection(app, {
    atlas,
    session,
    surFermer: () => { ouvrirBoutique(atlas); },
    surCaisses: () => { ecran.arreter(); ouvrirCaisses(atlas); },
  });
}

/** La partie en cours qu'un nouveau lancement remplacerait, ou null. */
function partieEnCours(): { niveau: number; vague: number; infini?: true } | null {
  const reprise = session.partieAReprendre();
  return reprise ? { niveau: reprise.niveau, vague: reprise.vague, ...(reprise.carte === undefined ? {} : { infini: true as const }) } : null;
}

/** Les raccourcis de test de l'accueil : jamais sur le site public. */
function raccourcisDeveloppement(): readonly ChoixNiveau[] {
  if (!import.meta.env.DEV) return [];
  const dernier = REGION1[REGION1.length - 1];
  if (!dernier) return [];
  return [
    { libelle: t('accueil.niveau', { n: dernier.numero }), surChoisir: () => { jouer(dernier, 'matou', { horsSauvegarde: true }).catch(console.error); } },
    { libelle: t('accueil.niveau_test'), surChoisir: () => { jouer(NIVEAU_CAMPAGNE_TEST, 'matou', { horsSauvegarde: true }).catch(console.error); } },
    { libelle: t('accueil.essai_corbeaux'), surChoisir: () => { lancerEssaiGimmick('corbeaux'); } },
    { libelle: t('accueil.essai_radeau'), surChoisir: () => { lancerEssaiGimmick('radeau'); } },
    { libelle: t('accueil.essai_evenements'), surChoisir: () => { lancerEssaiEvenements(); } },
  ];
}

/**
 * Développement seulement : un niveau d'essai d'un gimmick (couloirs de corbeaux, radeau), hors sauvegarde. Le module est chargé à
 * la demande, derrière `import.meta.env.DEV` : le site publié ne l'embarque pas.
 */
function lancerEssaiGimmick(type: 'corbeaux' | 'radeau'): void {
  if (!import.meta.env.DEV) return;
  import('./ui/niveaux-essai-gimmicks')
    .then(({ ESSAIS_GIMMICKS }) => jouer(ESSAIS_GIMMICKS[type], 'matou', { horsSauvegarde: true, essai: true }))
    .catch(console.error);
}

/** Développement seulement : le niveau d'essai des événements datés et des foules du DLC, hors sauvegarde (chargé à la demande). */
function lancerEssaiEvenements(): void {
  if (!import.meta.env.DEV) return;
  import('./ui/niveau-essai-evenements')
    .then(({ ESSAI_EVENEMENTS }) => jouer(ESSAI_EVENEMENTS, 'matou', { horsSauvegarde: true, essai: true }))
    .catch(console.error);
}

function accueil(): void {
  carteOuverte?.arreter();
  carteOuverte = null;
  app.replaceChildren();
  const { reprise, oubliee } = session.examinerPartie();
  if (oubliee) afficherAvis(document.body, t('sauvegarde.partie_oubliee'));
  // La partie reprend dans la campagne où elle a été rangée (histoire sans précision).
  const niveauRepris = reprise ? niveauDeCampagne(reprise.niveau, reprise.campagne === 'moderne' ? REGIONS_MONDE_MODERNE : undefined) : undefined;
  afficherAccueil(app, {
    surJouer: carte,
    // Le DLC « Temps modernes » est ouvert à tous, dès le départ.
    surModerne: carteModerne,
    surOptions: () => {
      afficherOptions(app, session, accueil);
    },
    autres: raccourcisDeveloppement(),
    // Le mode infini s'ouvre avec le boss de la région 1, et n'est proposé que s'il a une carte à jouer.
    ...(infiniOuvert(session.sauvegarde) && vueCartesInfini(session.sauvegarde).length > 0 ? { surInfini: ecranInfini } : {}),
    ...(reprise && niveauRepris
      ? {
          reprise: {
            vague: reprise.vague,
            surReprendre: () => {
              const region = reprise.etat.config.infini?.region;
              const infini = reprise.carte !== undefined && region !== undefined ? { infini: { carte: reprise.carte, region } } : {};
              jouer(niveauRepris, difficulteDe(reprise.etat.config) ?? derniereDifficulte, { reprise: reprise.etat, ...infini }).catch(console.error);
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
  installerIndicationsClavier();
  // Développement : `?essai=corbeaux` ou `?essai=radeau` ouvre directement le niveau d'essai du gimmick (captures, réglages).
  const essai = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('essai') : null;
  if (essai === 'corbeaux' || essai === 'radeau') lancerEssaiGimmick(essai);
  else accueil();
  avertirSauvegarde(session.origine, nom === 'memoire');
}

demarrer().catch((erreur: unknown) => {
  console.error(erreur);
});
