// Validation et application des actions du joueur. Les actions viennent de l'interface ou d'un journal
// relu : elles ne sont pas fiables. Une action refusée (mal formée comprise) ne lève jamais d'exception et
// ne change rien à l'état ; une action acceptée est inscrite au journal avec le pas courant.
import { RANG_MAX_COMPETENCE } from '../data/meta';
import { REGLES } from '../data/regles';
import type { Action, RaisonRefus, ResultatAction } from './actions';
import { partEntiere } from './argent';
import { distanceAuxChemins } from './chemins';
import { defFamille, defObjet, dieuDe } from './contenu';
import type { DefNiveauTour } from './definitions';
import type { EtatPartie, FamilleTour, Tour } from './etat';
import { ouvrirPas } from './evenements';
import { chercherParId, distance2 } from './recherche';
import { lancerEffets, rechargeSort } from './sorts';
import { minuteursInitiaux } from './structures';
import { defNiveau, deplacerSoldats, prix, prixFamille, statsTour, synchroniserSoldats } from './tours';
import { libererBloques } from './unites';
import { bonusAppel, lancerVague } from './vagues';

function estFini(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Forme de l'action : type connu, socles et emplacements entiers, coordonnées finies, voie A ou B. */
function estBienFormee(action: unknown): action is Action {
  if (typeof action !== 'object' || action === null) return false;
  const a = action as Record<string, unknown>;
  switch (a.type) {
    case 'construire':
      return Number.isInteger(a.socle) && (a.tour === 'divine' || defFamille(a.tour) !== undefined);
    case 'ameliorer':
    case 'vendre':
      return Number.isInteger(a.socle);
    case 'specialiser':
      return Number.isInteger(a.socle) && (a.voie === 'A' || a.voie === 'B');
    case 'ameliorerCompetence':
      return Number.isInteger(a.socle) && typeof a.competence === 'string';
    case 'deplacerRalliement':
      return Number.isInteger(a.socle) && estFini(a.x) && estFini(a.y);
    case 'deplacerHeros':
      return estFini(a.x) && estFini(a.y);
    case 'lancerSort':
    case 'utiliserObjet':
      return Number.isInteger(a.emplacement) && estFini(a.x) && estFini(a.y);
    case 'appelerVague':
      return true;
    default:
      return false;
  }
}

function tourSurSocle(etat: EtatPartie, socle: number): Tour | undefined {
  for (const t of etat.tours) if (t.socle === socle) return t;
  return undefined;
}

function horsCarte(etat: EtatPartie, x: number, y: number): boolean {
  const carte = etat.niveau.carte;
  return !(x >= 0 && x <= carte.largeur && y >= 0 && y <= carte.hauteur);
}

function loinDuChemin(etat: EtatPartie, x: number, y: number): boolean {
  return distanceAuxChemins(etat.chemins, x, y) > REGLES.distanceMaxChemin;
}

/** Niveau suivant d'une tour (amélioration ou spécialisation), ou la raison du refus. */
function niveauSuivant(etat: EtatPartie, t: Tour, action: Action): DefNiveauTour | RaisonRefus {
  if (action.type === 'specialiser') {
    if (t.famille === 'divine' || t.niveau !== 3) return 'specialisation_impossible';
    return defNiveau(etat, t.famille, 4, action.voie) ?? 'specialisation_impossible';
  }
  if (t.famille === 'divine' || t.niveau >= 4) return 'niveau_max';
  if (t.niveau === 3) return 'specialisation_requise';
  return defNiveau(etat, t.famille, t.niveau + 1, null) ?? 'niveau_max';
}

/** Prochain rang d'une compétence de spécialisation : indice, rang visé et prix, ou la raison du refus. */
function competenceSuivante(etat: EtatPartie, t: Tour, id: string): { indice: number; rang: number; cout: number } | RaisonRefus {
  if (t.famille === 'divine' || t.niveau !== 4) return 'specialisation_requise';
  const indice = t.stats.competences.findIndex((c) => c.id === id);
  const competence = t.stats.competences[indice];
  if (!competence) return 'competence_inconnue';
  const rang = t.rangs[indice] ?? 0;
  const cout = competence.cout[rang];
  if (cout === undefined || rang >= RANG_MAX_COMPETENCE) return 'competence_au_maximum';
  return { indice, rang: rang + 1, cout: prixFamille(etat, t.famille, cout) };
}

/** Prix en arêtes du prochain rang d'une compétence de la tour du socle, ou undefined si elle n'existe pas ou est au maximum. */
export function coutCompetence(etat: EtatPartie, socle: number, competence: string): number | undefined {
  const t = tourSurSocle(etat, socle);
  if (!t) return undefined;
  const suivante = competenceSuivante(etat, t, competence);
  return typeof suivante === 'string' ? undefined : suivante.cout;
}

/** Coût de construction d'une tour (divine comprise) pour le dieu de la partie. */
export function coutConstruction(etat: EtatPartie, famille: FamilleTour): number | undefined {
  const def = defNiveau(etat, famille, 1, null);
  return def ? prix(etat, famille, def) : undefined;
}

/** Valeur de revente de la tour d'un socle. */
export function valeurRevente(etat: EtatPartie, socle: number): number {
  const t = tourSurSocle(etat, socle);
  return t ? partEntiere(t.coutCumule, REGLES.tauxRevente) : 0;
}

/** Dit si l'action est permise maintenant, sans rien changer. Renvoie null si elle l'est. */
export function validerAction(etat: EtatPartie, action: Action): RaisonRefus | null {
  if (etat.statut !== 'en_cours') return 'partie_terminee';
  if (!estBienFormee(action)) return 'action_invalide';
  switch (action.type) {
    case 'construire': {
      if (!etat.niveau.carte.socles[action.socle]) return 'socle_inconnu';
      if (tourSurSocle(etat, action.socle)) return 'socle_occupe';
      if (action.tour === 'divine' && etat.tours.some((t) => t.famille === 'divine')) return 'tour_divine_unique';
      const cout = coutConstruction(etat, action.tour);
      if (cout === undefined) return 'tour_inconnue';
      return cout > etat.aretes ? 'aretes_insuffisantes' : null;
    }
    case 'ameliorer':
    case 'specialiser': {
      const t = tourSurSocle(etat, action.socle);
      if (!t) return 'socle_vide';
      const suivant = niveauSuivant(etat, t, action);
      if (typeof suivant === 'string') return suivant;
      return prix(etat, t.famille, suivant) > etat.aretes ? 'aretes_insuffisantes' : null;
    }
    case 'ameliorerCompetence': {
      const t = tourSurSocle(etat, action.socle);
      if (!t) return 'socle_vide';
      const suivante = competenceSuivante(etat, t, action.competence);
      if (typeof suivante === 'string') return suivante;
      return suivante.cout > etat.aretes ? 'aretes_insuffisantes' : null;
    }
    case 'vendre':
      return tourSurSocle(etat, action.socle) ? null : 'socle_vide';
    case 'utiliserObjet': {
      const id = etat.config.objets[action.emplacement];
      const objet = defObjet(id);
      if (!objet) return 'objet_inconnu';
      if (etat.objetsUtilises[action.emplacement]) return 'objet_utilise';
      if (objet.global) return null;
      if (horsCarte(etat, action.x, action.y)) return 'hors_carte';
      return objet.surChemin && loinDuChemin(etat, action.x, action.y) ? 'hors_chemin' : null;
    }
    case 'deplacerRalliement': {
      const t = tourSurSocle(etat, action.socle);
      if (!t) return 'socle_vide';
      if (!t.stats.soldats) return 'pas_une_caserne';
      if (horsCarte(etat, action.x, action.y)) return 'hors_carte';
      if (distance2(t.x, t.y, action.x, action.y) > t.stats.portee * t.stats.portee) return 'hors_portee';
      return loinDuChemin(etat, action.x, action.y) ? 'hors_chemin' : null;
    }
    case 'deplacerHeros': {
      const h = chercherParId(etat.unites, etat.heros);
      if (!h || h.mort) return 'heros_mort';
      if (horsCarte(etat, action.x, action.y)) return 'hors_carte';
      return loinDuChemin(etat, action.x, action.y) ? 'hors_chemin' : null;
    }
    case 'lancerSort': {
      const sort = dieuDe(etat).sorts[action.emplacement];
      const recharge = etat.sorts[action.emplacement];
      if (!sort || !recharge) return 'sort_inconnu';
      if (recharge.recharge > 0) return 'sort_en_recharge';
      if (horsCarte(etat, action.x, action.y)) return 'hors_carte';
      return sort.surChemin && loinDuChemin(etat, action.x, action.y) ? 'hors_chemin' : null;
    }
    case 'appelerVague':
      // Comme dans Kingdom Rush : avant la vague 1, ou une fois la vague en cours entièrement apparue.
      if (etat.vagues.prochaine === -1) return 'plus_de_vague';
      return etat.vagues.lancees > 0 && etat.vagues.paquets.length > 0 ? 'vague_en_cours' : null;
  }
}

function construire(etat: EtatPartie, socle: number, famille: FamilleTour): void {
  const s = etat.niveau.carte.socles[socle];
  const def = defNiveau(etat, famille, 1, null);
  if (!s || !def) return;
  const cout = prix(etat, famille, def);
  etat.aretes -= cout;
  const t: Tour = {
    id: etat.prochainId++,
    socle,
    famille,
    niveau: 1,
    voie: null,
    coutCumule: cout,
    x: s.x,
    y: s.y,
    recharge: 0,
    ralliementX: s.ralliement.x,
    ralliementY: s.ralliement.y,
    stats: statsTour(etat, famille, def),
    rangs: [],
    boostCadence: 0,
    boostPas: 0,
    minuteurs: minuteursInitiaux(def.atelier, 0),
  };
  etat.tours.push(t);
  synchroniserSoldats(etat, t);
  etat.evenements.push({ type: 'construction', tour: t.id, socle, famille });
}

function monterNiveau(etat: EtatPartie, t: Tour, action: Action): void {
  const suivant = niveauSuivant(etat, t, action);
  if (typeof suivant === 'string') return;
  const cout = prix(etat, t.famille, suivant);
  etat.aretes -= cout;
  t.coutCumule += cout;
  t.niveau++;
  if (action.type === 'specialiser') t.voie = action.voie;
  t.rangs = suivant.competences.map(() => 0);
  t.stats = statsTour(etat, t.famille, suivant, t.rangs);
  synchroniserSoldats(etat, t);
  etat.evenements.push({ type: 'amelioration', tour: t.id, socle: t.socle, niveau: t.niveau, voie: t.voie });
}

/** Achète le rang suivant d'une compétence de la spécialisation et recalcule les stats de la tour. */
function acheterCompetence(etat: EtatPartie, t: Tour, id: string): void {
  const suivante = competenceSuivante(etat, t, id);
  const def = defNiveau(etat, t.famille, t.niveau, t.voie);
  if (typeof suivante === 'string' || !def) return;
  etat.aretes -= suivante.cout;
  t.coutCumule += suivante.cout;
  t.rangs[suivante.indice] = suivante.rang;
  t.stats = statsTour(etat, t.famille, def, t.rangs);
  synchroniserSoldats(etat, t);
  etat.evenements.push({ type: 'competence_tour', tour: t.id, socle: t.socle, competence: id, rang: suivante.rang });
}

function vendre(etat: EtatPartie, t: Tour): void {
  const aretes = partEntiere(t.coutCumule, REGLES.tauxRevente);
  etat.aretes += aretes;
  etat.tours = etat.tours.filter((autre) => autre !== t);
  etat.structures = etat.structures.filter((s) => s.origine !== t.id);
  const restent = [];
  for (const u of etat.unites) {
    if (u.tour === t.id && u.genre === 'soldat') libererBloques(etat, u);
    else restent.push(u);
  }
  etat.unites = restent;
  etat.evenements.push({ type: 'vente', tour: t.id, socle: t.socle, aretes });
}

function executer(etat: EtatPartie, action: Action): void {
  switch (action.type) {
    case 'construire':
      construire(etat, action.socle, action.tour);
      return;
    case 'ameliorer':
    case 'specialiser': {
      const t = tourSurSocle(etat, action.socle);
      if (t) monterNiveau(etat, t, action);
      return;
    }
    case 'ameliorerCompetence': {
      const t = tourSurSocle(etat, action.socle);
      if (t) acheterCompetence(etat, t, action.competence);
      return;
    }
    case 'vendre': {
      const t = tourSurSocle(etat, action.socle);
      if (t) vendre(etat, t);
      return;
    }
    case 'utiliserObjet': {
      const id = etat.config.objets[action.emplacement];
      const objet = defObjet(id);
      if (!id || !objet) return;
      etat.objetsUtilises[action.emplacement] = true;
      etat.evenements.push({ type: 'objet', emplacement: action.emplacement, objet: id, x: action.x, y: action.y });
      lancerEffets(etat, objet, action.x, action.y);
      return;
    }
    case 'deplacerRalliement': {
      const t = tourSurSocle(etat, action.socle);
      if (!t) return;
      t.ralliementX = action.x;
      t.ralliementY = action.y;
      deplacerSoldats(etat, t);
      etat.evenements.push({ type: 'ralliement', tour: t.id, x: action.x, y: action.y });
      return;
    }
    case 'deplacerHeros': {
      const h = chercherParId(etat.unites, etat.heros);
      if (!h) return;
      libererBloques(etat, h);
      h.ancreX = action.x;
      h.ancreY = action.y;
      h.enDeplacement = true;
      etat.evenements.push({ type: 'ordre_heros', x: action.x, y: action.y });
      return;
    }
    case 'lancerSort': {
      const sort = dieuDe(etat).sorts[action.emplacement];
      const recharge = etat.sorts[action.emplacement];
      if (!sort || !recharge) return;
      recharge.recharge = rechargeSort(etat, sort);
      etat.evenements.push({ type: 'sort', emplacement: action.emplacement, x: action.x, y: action.y });
      lancerEffets(etat, sort, action.x, action.y);
      return;
    }
    case 'appelerVague': {
      const bonus = bonusAppel(etat);
      etat.aretes += bonus;
      lancerVague(etat, bonus);
      return;
    }
  }
}

/** Valide puis applique l'action ; refusée, elle ne change rien. */
export function appliquerAction(etat: EtatPartie, action: Action): ResultatAction {
  const raison = validerAction(etat, action);
  if (raison !== null) return { ok: false, raison };
  ouvrirPas(etat);
  executer(etat, action);
  etat.journal.push({ pas: etat.pas, action: { ...action } });
  return { ok: true };
}
