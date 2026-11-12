// Aiguillage des événements datés, de la carte qui bouge et des foules (DLC Temps modernes), sur le modèle des gimmicks : un point
// d'entrée par moment de la partie, qui renvoie au module de chaque type. Chaque `switch` finit sur une valeur `never` : un nouveau type
// d'`EvenementNiveau` oublié ici ne compile pas.
//
// Un événement est planifié au lancement de sa vague (`pas` = lancement + délai), annoncé `EVENEMENTS_NIVEAU.annonce` secondes avant
// (événement `annonce_evenement`), puis déclenché (événement `evenement_niveau`, suivi de ce que fait son type).
import { EVENEMENTS_NIVEAU } from '../../data/evenements-niveau';
import type { EvenementNiveau, Niveau } from '../definitions';
import type { EtatDynamique, EtatEvenementNiveau, EtatPartie } from '../etat';
import { enPas } from '../temps';
import { mettreAJourBarrages } from './barrages';
import { verifierCanonAEau, declencherCanonAEau } from './canon-a-eau';
import { declencherCharge, poursuivreCharge, verifierCharge } from './charge';
import { cheminEffectif, fermerChemin, ouvrirChemin, verifierCheminsFermes, verifierFermerChemin, verifierOuvrirChemin, verifierReplis } from './chemins-mobiles';
import { creerEtatFoules, mettreAJourFoules, verifierFoules } from './foules';
import { declencherNasse, verifierNasse } from './nasse';
import { declencherRenforts, verifierEvenementRenforts } from './renforts';

export { caseInterditeEnPartie, casesLibresEnPartie, cheminEffectif, cheminOuvertPour } from './chemins-mobiles';
export { borneBarrage, pointDansBarrage } from './barrages';
export { payerFoule, validerActivationFoule } from './foules';

function evenementInconnu(e: never): never {
  throw new Error(`Événement de niveau inconnu : ${String((e as { type: unknown }).type)}`);
}

/** Le chemin que l'événement concerne (pour l'annonce), -1 s'il n'en vise aucun. */
export function cheminDeLEvenement(e: EvenementNiveau): number {
  switch (e.type) {
    case 'charge':
    case 'nasse':
    case 'ouvrir_chemin':
    case 'fermer_chemin':
      return e.chemin;
    case 'canon_a_eau':
    case 'renforts':
      return -1;
    default:
      return evenementInconnu(e);
  }
}

/**
 * Le chemin que l'événement désigne dans le bandeau et les panneaux : celui où il agit vraiment. Une charge sur un chemin fermé sort sur
 * son repli ; les autres types gardent leur chemin (une nasse coupe bien le chemin écrit, un `ouvrir_chemin` parle du chemin qui s'ouvre).
 */
function cheminAnnonce(etat: EtatPartie, e: EvenementNiveau): number {
  const chemin = cheminDeLEvenement(e);
  return e.type === 'charge' ? cheminEffectif(etat, chemin) : chemin;
}

/** Vérifie les événements, les chemins fermés et les foules du niveau à la création de la partie (lève une erreur au premier défaut). */
export function verifierDynamique(niveau: Niveau): void {
  verifierCheminsFermes(niveau);
  (niveau.evenements ?? []).forEach((e, i) => {
    const quoi = `Événement ${String(i)} (${e.type})`;
    const avant = i > 0 ? niveau.evenements?.[i - 1] : undefined;
    // L'ordre écrit est l'ordre de jeu (défi Fer, replis, rattrapage) : il doit être croissant en (vague, délai).
    if (avant && (e.vague < avant.vague || (e.vague === avant.vague && (e.delai ?? EVENEMENTS_NIVEAU.annonce) < (avant.delai ?? EVENEMENTS_NIVEAU.annonce)))) {
      throw new Error(`${quoi} : les événements doivent être écrits dans l'ordre (vague, délai), celui-ci passe avant l'événement ${String(i - 1)}`);
    }
    if (!Number.isInteger(e.vague) || e.vague < 1 || e.vague > niveau.vagues.length) throw new Error(`${quoi} : vague inconnue ${String(e.vague)}`);
    if (e.delai !== undefined && !(Number.isFinite(e.delai) && e.delai >= EVENEMENTS_NIVEAU.annonce)) {
      throw new Error(`${quoi} : délai trop court (${String(e.delai)} s), au moins ${String(EVENEMENTS_NIVEAU.annonce)} s pour l'annonce`);
    }
    switch (e.type) {
      case 'charge':
        verifierCharge(niveau, e, quoi);
        return;
      case 'nasse':
        verifierNasse(niveau, e, quoi);
        return;
      case 'canon_a_eau':
        verifierCanonAEau(niveau, e, quoi);
        return;
      case 'renforts':
        verifierEvenementRenforts(niveau, e, quoi);
        return;
      case 'ouvrir_chemin':
        verifierOuvrirChemin(niveau, e, quoi);
        return;
      case 'fermer_chemin':
        verifierFermerChemin(niveau, e, quoi);
        return;
      default:
        evenementInconnu(e);
    }
  });
  verifierReplis(niveau);
  verifierFoules(niveau);
}

/** L'état dynamique au début de la partie : tous les chemins ouverts sauf ceux fermés au départ, rien de planifié, foules prêtes. */
export function creerEtatDynamique(niveau: Niveau): EtatDynamique {
  const cheminsActifs = niveau.carte.chemins.map(() => true);
  const replis = niveau.carte.chemins.map(() => -1);
  for (const f of niveau.cheminsFermes ?? []) {
    cheminsActifs[f.chemin] = false;
    replis[f.chemin] = f.repli;
  }
  return {
    evenements: (niveau.evenements ?? []).map(() => ({ pas: -1, annonce: false, declenche: false, fini: false, fin: -1, restants: 0, prochain: 0 })),
    cheminsActifs,
    replis,
    barrages: [],
    foules: creerEtatFoules(niveau),
  };
}

/**
 * Défi Fer : toutes les vagues n'en font qu'une, mais tous les événements du niveau sont joués. Chacun passe à la vague 1 et son délai
 * est réparti sur la durée `dureeFer` (secondes) de la vague unique, proportionnellement au rang de sa vague d'origine : l'événement de
 * la vague k sur N part à `dureeFer × (k − 1) / N`, plus son propre délai, arrondi au dixième de seconde puis borné à `dureeFer` (la borne
 * s'applique après l'arrondi : aucun événement ne tombe après la dernière apparition), jamais avant le délai minimal de l'annonce.
 * L'ordre (vague, délai) du niveau est gardé : un événement placé plus tard dans le niveau ne part jamais avant un événement placé plus
 * tôt, et à égalité l'ordre des données compte (les délais répartis sont croissants dans cet ordre). `dureeFer` vient d'un compte en pas
 * (voir `dureeDeLaVague`) : la borne tombe sur un pas réel. Seul le délai minimal de l'annonce peut dépasser une vague plus courte que lui. Déterministe : une pure fonction
 * des données du niveau.
 */
export function repartirEvenementsFer(evenements: readonly EvenementNiveau[], nombreVagues: number, dureeFer: number): EvenementNiveau[] {
  const total = Math.max(1, nombreVagues);
  const borne = Math.max(EVENEMENTS_NIVEAU.annonce, dureeFer);
  const delais = evenements.map((e) => {
    const debut = (dureeFer * (e.vague - 1)) / total;
    return Math.max(EVENEMENTS_NIVEAU.annonce, Math.min(Math.round((debut + (e.delai ?? EVENEMENTS_NIVEAU.annonce)) * 10) / 10, borne));
  });
  // Ordre (vague, délai propre, rang dans les données) du niveau d'origine ; chaque délai réparti est au moins celui du précédent.
  const ordre = evenements
    .map((_, i) => i)
    .sort((a, b) => {
      const ea = evenements[a];
      const eb = evenements[b];
      return (ea?.vague ?? 0) - (eb?.vague ?? 0) || (ea?.delai ?? EVENEMENTS_NIVEAU.annonce) - (eb?.delai ?? EVENEMENTS_NIVEAU.annonce) || a - b;
    });
  let precedent = 0;
  for (const i of ordre) {
    const d = Math.max(delais[i] ?? 0, precedent);
    delais[i] = d;
    precedent = d;
  }
  return evenements.map((e, i) => ({ ...e, vague: 1, delai: delais[i] ?? EVENEMENTS_NIVEAU.annonce }));
}

/** Le niveau sans ses événements, chemins fermés ni foules (copie de surface) : le mode infini joue la carte sans eux. */
export function sansDynamique(niveau: Niveau): Niveau {
  const copie: { -readonly [K in keyof Niveau]: Niveau[K] } = { ...niveau };
  delete copie.evenements;
  delete copie.cheminsFermes;
  delete copie.foules;
  return copie;
}

function declencher(etat: EtatPartie, suivi: EtatEvenementNiveau, e: EvenementNiveau): void {
  switch (e.type) {
    case 'charge':
      declencherCharge(etat, suivi, e);
      return;
    case 'nasse':
      declencherNasse(etat, e);
      suivi.fin = etat.pas + Math.max(1, enPas(e.duree));
      break;
    case 'canon_a_eau':
      declencherCanonAEau(etat, e);
      break;
    case 'renforts':
      declencherRenforts(etat, e);
      break;
    case 'ouvrir_chemin':
      ouvrirChemin(etat, e);
      break;
    case 'fermer_chemin':
      fermerChemin(etat, e);
      break;
    default:
      evenementInconnu(e);
  }
  suivi.fini = true;
}

/**
 * Appel de la vague suivante en avance : les événements de chemin (`ouvrir_chemin`, `fermer_chemin`) encore en attente dans les vagues
 * déjà lancées se déclenchent aussitôt, dans l'ordre (vague, délai, rang), avec leur annonce, avant que la vague suivante ne planifie les
 * siens. Sans cela, la fermeture de la vague suivante pourrait passer avant l'ouverture de la vague en cours, et fermer tous les chemins.
 * Les autres types (charge, nasse, canon à eau, renforts) gardent leur délai.
 */
export function rattraperChemins(etat: EtatPartie): void {
  const evenements = etat.niveau.evenements;
  if (!evenements) return;
  const attente = evenements
    .map((e, index) => ({ e, index }))
    .filter(({ e, index }) => (e.type === 'ouvrir_chemin' || e.type === 'fermer_chemin') && e.vague <= etat.vagues.lancees && etat.dynamique.evenements[index]?.fini === false)
    .sort((a, b) => a.e.vague - b.e.vague || (a.e.delai ?? EVENEMENTS_NIVEAU.annonce) - (b.e.delai ?? EVENEMENTS_NIVEAU.annonce) || a.index - b.index);
  for (const { e, index } of attente) {
    const suivi = etat.dynamique.evenements[index];
    if (!suivi) continue;
    suivi.pas = etat.pas;
    if (!suivi.annonce) {
      suivi.annonce = true;
      etat.evenements.push({ type: 'annonce_evenement', index, typeEvenement: e.type, chemin: cheminAnnonce(etat, e), dans: EVENEMENTS_NIVEAU.annonce });
    }
    suivi.declenche = true;
    etat.evenements.push({ type: 'evenement_niveau', index, typeEvenement: e.type, chemin: cheminAnnonce(etat, e) });
    declencher(etat, suivi, e);
  }
}

/** Ce qui se poursuit après le déclenchement (seule la charge fait apparaître ses ennemis sur plusieurs pas). */
function poursuivre(etat: EtatPartie, suivi: EtatEvenementNiveau, e: EvenementNiveau): void {
  switch (e.type) {
    case 'charge':
      poursuivreCharge(etat, suivi, e);
      return;
    case 'nasse':
    case 'canon_a_eau':
    case 'renforts':
    case 'ouvrir_chemin':
    case 'fermer_chemin':
      suivi.fini = true;
      return;
    default:
      evenementInconnu(e);
  }
}

/**
 * Le pas des événements et des foules, appelé à chaque pas juste après les vagues (une vague lancée à ce pas-ci, par le joueur ou par le
 * compte à rebours, planifie ses événements tout de suite) : coupures qui se lèvent, planification, annonces, déclenchements, foules.
 */
export function mettreAJourDynamique(etat: EtatPartie): void {
  mettreAJourBarrages(etat);
  const evenements = etat.niveau.evenements;
  if (evenements) {
    const annonce = enPas(EVENEMENTS_NIVEAU.annonce);
    evenements.forEach((e, index) => {
      const suivi = etat.dynamique.evenements[index];
      if (!suivi || suivi.fini) return;
      if (suivi.pas < 0) {
        if (etat.vagues.lancees < e.vague) return;
        suivi.pas = etat.pas + enPas(e.delai ?? EVENEMENTS_NIVEAU.annonce);
      }
      if (!suivi.annonce && etat.pas >= suivi.pas - annonce) {
        suivi.annonce = true;
        etat.evenements.push({ type: 'annonce_evenement', index, typeEvenement: e.type, chemin: cheminAnnonce(etat, e), dans: EVENEMENTS_NIVEAU.annonce });
      }
      if (!suivi.declenche) {
        if (etat.pas < suivi.pas) return;
        suivi.declenche = true;
        etat.evenements.push({ type: 'evenement_niveau', index, typeEvenement: e.type, chemin: cheminAnnonce(etat, e) });
        declencher(etat, suivi, e);
      }
      // Charge : ses premiers ennemis apparaissent dès le pas du déclenchement ; les autres types sont déjà finis.
      poursuivre(etat, suivi, e);
    });
  }
  mettreAJourFoules(etat);
}

/** Une charge dont la vague est lancée n'a pas fini de faire apparaître ses ennemis : la partie ne peut pas encore être gagnée. */
export function chargesEnAttente(etat: EtatPartie): boolean {
  const evenements = etat.niveau.evenements;
  if (!evenements) return false;
  return evenements.some((e, i) => e.type === 'charge' && e.vague <= etat.vagues.lancees && etat.dynamique.evenements[i]?.fini !== true);
}
