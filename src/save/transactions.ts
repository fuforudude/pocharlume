// Transactions de la méta-progression : acheter un rang de l'arbre, un disciple ou un objet, équiper, placer des
// points de compétence, enregistrer une fin de partie. Des fonctions pures : chacune prend une sauvegarde et rend
// soit { ok: true, sauvegarde } (une copie, l'original n'est jamais modifié), soit { ok: false, raison } sans rien
// avoir changé. Les paramètres viennent de l'interface (chaînes quelconques) : ils sont vérifiés ici, jamais crus.
// Les raisons de refus sont des codes stables que l'interface traduit en texte.
import {
  aretesDeVictoire,
  braisesDeVictoire,
  braisesDeDefi,
  coutRangArbre,
  DISCIPLES_OFFERTS,
  EMPLACEMENTS_OBJETS,
  estIdBranche,
  estIdDefi,
  estIdDieu,
  estIdHeros,
  estIdObjet,
  HEROS_PAR_DIEU,
  NIVEAU_FIN_CAMPAGNE,
  NIVEAU_OUVERTURE_INFINI,
  NIVEAUX_DISCIPLE_OFFERT,
  OBJETS,
  PLAFOND_MONNAIE,
  PLAFOND_XP,
  PRIX_DISCIPLE,
  RANG_MAX_ARBRE,
  STOCK_MAX_OBJET,
  xpDePartie,
  type IdDefi,
  type IdHeros,
  type IdObjet,
} from '../data/meta';
import { BRAISES_DEFI_MODERNE, braisesDeVictoireModerne, estBossModerne, NIVEAU_MAX_MODERNE } from '../data/campagnes';
import { badgesDeLaVictoire } from './badges-moderne';
import { definitionDuHeros, niveauHerosDepuisXp, pointsDeCompetence, type DefsMeta } from './definitions';
import { DIFFICULTES_SAUVEGARDE, etoilesDepensees, etoilesGagnees, metaParDefaut, type Meta, type Sauvegarde } from './format';
import { enregistrerVictoireModerne, sauvegardeDeCampagne } from './moderne';
import { enregistrerVictoire, meilleuresEtoiles, niveauDebloque } from './progression';
import { estEntierEntre, poser } from './validation';

export { niveauHerosDepuisXp } from './definitions';

export type Transaction<R extends string> =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde }
  | { readonly ok: false; readonly raison: R };

export type RaisonArbre = 'branche_inconnue' | 'rang_max' | 'etoiles_insuffisantes';
export type RaisonReinitialisation = 'rien_a_reinitialiser';
export type RaisonDisciple = 'heros_inconnu' | 'deja_possede' | 'braises_insuffisantes';
export type RaisonAchatObjet = 'objet_inconnu' | 'quantite_invalide' | 'stock_plein' | 'aretes_insuffisantes';
export type RaisonEquipement = 'trop_d_objets' | 'objet_inconnu' | 'objet_hors_stock';
export type RaisonChoix = 'dieu_inconnu' | 'heros_inconnu' | 'heros_pas_du_dieu' | 'heros_non_possede';
export type RaisonPoint = 'heros_inconnu' | 'heros_non_possede' | 'competence_inconnue' | 'rang_max' | 'niveau_insuffisant' | 'plus_de_points';
export type RaisonPoints = 'heros_inconnu' | 'heros_non_possede' | RaisonReinitialisation;
export type RaisonFin = 'niveau_invalide' | 'difficulte_inconnue' | 'etoiles_invalides' | 'heros_non_possede' | 'objets_invalides';

function refus<R extends string>(raison: R): { readonly ok: false; readonly raison: R } {
  return { ok: false, raison };
}

function avecMeta(s: Sauvegarde, changements: Partial<Meta>): { readonly ok: true; readonly sauvegarde: Sauvegarde } {
  return { ok: true, sauvegarde: { ...s, meta: { ...s.meta, ...changements } } };
}

function possede(s: Sauvegarde, heros: IdHeros): boolean {
  return Object.hasOwn(s.meta.heros, heros);
}

// --- Lectures -------------------------------------------------------------------------------------------------

/** Étoiles qu'on peut encore dépenser dans l'arbre : gagnées moins le coût des rangs déjà achetés. */
export function etoilesDisponibles(s: Sauvegarde): number {
  return Math.max(0, etoilesGagnees(s.progression) - etoilesDepensees(s.meta.arbre));
}

/** Niveau d'un héros possédé d'après son expérience, ou null s'il n'est pas possédé. */
export function niveauDuHeros(s: Sauvegarde, heros: string, defs: DefsMeta): number | null {
  if (!estIdHeros(heros) || !possede(s, heros)) return null;
  return niveauHerosDepuisXp(s.meta.heros[heros]?.xp ?? 0, defs.seuilsXp);
}

/** Points de compétence qu'il reste à placer (0 pour un héros non possédé). */
export function pointsDisponibles(s: Sauvegarde, heros: string, defs: DefsMeta): number {
  const niveau = niveauDuHeros(s, heros, defs);
  if (niveau === null || !estIdHeros(heros)) return 0;
  const places = Object.values(s.meta.heros[heros]?.competences ?? {}).reduce((somme, rang) => somme + rang, 0);
  return Math.max(0, pointsDeCompetence(niveau) - places);
}

// --- Arbre d'améliorations ------------------------------------------------------------------------------------

/** Achète le rang suivant d'une branche : le rang n coûte n étoiles. */
export function acheterRangArbre(s: Sauvegarde, branche: string): Transaction<RaisonArbre> {
  if (!estIdBranche(branche)) return refus('branche_inconnue');
  const rang = s.meta.arbre[branche];
  if (rang >= RANG_MAX_ARBRE) return refus('rang_max');
  if (etoilesDisponibles(s) < coutRangArbre(rang + 1)) return refus('etoiles_insuffisantes');
  return avecMeta(s, { arbre: { ...s.meta.arbre, [branche]: rang + 1 } });
}

/** Remet l'arbre à zéro, gratuitement : toutes les étoiles dépensées reviennent (elles se déduisent des rangs). */
export function reinitialiserArbre(s: Sauvegarde): Transaction<RaisonReinitialisation> {
  if (etoilesDepensees(s.meta.arbre) === 0) return refus('rien_a_reinitialiser');
  return avecMeta(s, { arbre: metaParDefaut().arbre });
}

// --- Disciples, choix du héros --------------------------------------------------------------------------------

/** Achète un disciple pour 30 braises ; les avatars sont offerts et ne s'achètent pas. */
export function acheterDisciple(s: Sauvegarde, heros: string): Transaction<RaisonDisciple> {
  if (!estIdHeros(heros)) return refus('heros_inconnu');
  if (possede(s, heros)) return refus('deja_possede');
  if (s.meta.monnaies.braises < PRIX_DISCIPLE) return refus('braises_insuffisantes');
  return avecMeta(s, {
    monnaies: { ...s.meta.monnaies, braises: s.meta.monnaies.braises - PRIX_DISCIPLE },
    heros: { ...s.meta.heros, [heros]: { xp: 0, competences: {} } },
  });
}

/** Retient le dieu et le héros qu'on emmène : le héros doit être un de ceux du dieu, et possédé. */
export function choisirHeros(s: Sauvegarde, dieu: string, heros: string): Transaction<RaisonChoix> {
  if (!estIdDieu(dieu)) return refus('dieu_inconnu');
  if (!estIdHeros(heros)) return refus('heros_inconnu');
  if (!(HEROS_PAR_DIEU[dieu] as readonly string[]).includes(heros)) return refus('heros_pas_du_dieu');
  if (!possede(s, heros)) return refus('heros_non_possede');
  return avecMeta(s, { choix: { ...s.meta.choix, dieu, heros } });
}

// --- Objets consommables --------------------------------------------------------------------------------------

/** Achète `quantite` exemplaires d'un objet en arêtes ; le stock ne dépasse jamais 10. */
export function acheterObjet(s: Sauvegarde, objet: string, quantite = 1): Transaction<RaisonAchatObjet> {
  if (!estIdObjet(objet)) return refus('objet_inconnu');
  if (!estEntierEntre(quantite, 1, STOCK_MAX_OBJET)) return refus(Number.isInteger(quantite) && quantite > STOCK_MAX_OBJET ? 'stock_plein' : 'quantite_invalide');
  if (s.meta.objets[objet] + quantite > STOCK_MAX_OBJET) return refus('stock_plein');
  const cout = OBJETS[objet].prix * quantite;
  if (s.meta.monnaies.aretes < cout) return refus('aretes_insuffisantes');
  return avecMeta(s, {
    monnaies: { ...s.meta.monnaies, aretes: s.meta.monnaies.aretes - cout },
    objets: { ...s.meta.objets, [objet]: s.meta.objets[objet] + quantite },
  });
}

/** Les ids reconnus d'une liste d'objets, ou null si ce n'est pas une liste d'objets connus. */
export function listeObjets(x: unknown): IdObjet[] | null {
  if (!Array.isArray(x)) return null;
  const liste: IdObjet[] = [];
  for (const objet of x as unknown[]) {
    if (!estIdObjet(objet)) return null;
    liste.push(objet);
  }
  return liste;
}

function compte(liste: readonly IdObjet[], objet: IdObjet): number {
  return liste.filter((o) => o === objet).length;
}

/** Choisit les objets emportés (3 emplacements au plus, un même objet peut en occuper plusieurs) parmi le stock. */
export function equiperObjets(s: Sauvegarde, objets: readonly string[]): Transaction<RaisonEquipement> {
  if (Array.isArray(objets) && objets.length > EMPLACEMENTS_OBJETS) return refus('trop_d_objets');
  const liste = listeObjets(objets);
  if (!liste) return refus('objet_inconnu');
  for (const objet of liste) if (compte(liste, objet) > s.meta.objets[objet]) return refus('objet_hors_stock');
  return avecMeta(s, { choix: { ...s.meta.choix, objets: liste } });
}

/**
 * Lancement d'une partie : les objets emportés sont débités du stock tout de suite (un exemplaire par emplacement).
 * Refusé si le stock ne couvre plus le choix (un autre onglet l'a entamé, par exemple) : la partie ne se lance pas.
 * En fin de partie enregistrée, les objets non utilisés sont recrédités (`enregistrerFinDePartie`) ; une partie
 * remplacée sans être finie ne rend rien.
 */
export function debiterObjetsDePartie(s: Sauvegarde, objets: readonly string[]): Transaction<RaisonEquipement> {
  if (Array.isArray(objets) && objets.length > EMPLACEMENTS_OBJETS) return refus('trop_d_objets');
  const liste = listeObjets(objets);
  if (!liste) return refus('objet_inconnu');
  for (const objet of liste) if (compte(liste, objet) > s.meta.objets[objet]) return refus('objet_hors_stock');
  if (liste.length === 0) return { ok: true, sauvegarde: s };
  const stock = { ...s.meta.objets };
  for (const objet of liste) stock[objet] -= 1;
  return avecMeta(s, { objets: stock });
}

// --- Compétences des héros ------------------------------------------------------------------------------------

/** Place un point de compétence : +1 rang dans une compétence du héros, dans la limite de ses points et de son niveau. */
export function repartirPoint(s: Sauvegarde, heros: string, competence: string, defs: DefsMeta): Transaction<RaisonPoint> {
  if (!estIdHeros(heros)) return refus('heros_inconnu');
  const definition = definitionDuHeros(defs, heros);
  if (!definition) return refus('heros_inconnu');
  const actuel = s.meta.heros[heros];
  if (!actuel || !possede(s, heros)) return refus('heros_non_possede');
  const def = definition.competences.find((c) => c.id === competence);
  if (!def) return refus('competence_inconnue');
  const rang = Object.hasOwn(actuel.competences, competence) ? (actuel.competences[competence] ?? 0) : 0;
  if (rang >= def.rangMax) return refus('rang_max');
  const niveau = niveauHerosDepuisXp(actuel.xp, defs.seuilsXp);
  if (niveau < def.niveauRequis) return refus('niveau_insuffisant');
  if (pointsDisponibles(s, heros, defs) < 1) return refus('plus_de_points');
  const competences = { ...actuel.competences };
  poser(competences, competence, rang + 1);
  return avecMeta(s, { heros: { ...s.meta.heros, [heros]: { xp: actuel.xp, competences } } });
}

/** Reprend tous les points placés d'un héros, gratuitement, pour les redistribuer. */
export function reinitialiserPoints(s: Sauvegarde, heros: string): Transaction<RaisonPoints> {
  if (!estIdHeros(heros)) return refus('heros_inconnu');
  const actuel = s.meta.heros[heros];
  if (!actuel || !possede(s, heros)) return refus('heros_non_possede');
  if (Object.keys(actuel.competences).length === 0) return refus('rien_a_reinitialiser');
  return avecMeta(s, { heros: { ...s.meta.heros, [heros]: { xp: actuel.xp, competences: {} } } });
}

// --- Fin de partie --------------------------------------------------------------------------------------------

/** Ce que l'interface sait d'une partie terminée. */
export interface FinDePartieMeta {
  readonly niveau: number;
  /**
   * `abandon` : le joueur a quitté avant la fin. Il ne rapporte ni expérience, ni étoiles, ni arêtes, ni braises ;
   * seuls les objets non utilisés sont rendus. Seule une défaite réelle (vies à 0) donne la moitié de l'expérience.
   */
  readonly statut: 'victoire' | 'defaite' | 'abandon';
  /** Difficulté jouée (clé de `DIFFICULTES_SAUVEGARDE`) ; seule une victoire en a besoin. */
  readonly difficulte: string;
  /** Étoiles de la victoire (1 à 3) ; ignorées pour une défaite ou un abandon. */
  readonly etoiles: number;
  /** Héros joué : il reçoit l'expérience. Absent ou null : pas d'expérience. Ignoré pour un abandon. */
  readonly heros?: string | null;
  /** Objets emportés dans la partie (les emplacements, 3 au plus), déjà débités du stock au lancement. */
  readonly objetsEquipes?: readonly string[];
  /** Objets que le joueur a utilisés pendant la partie, un par emplacement utilisé : consommés pour de bon. */
  readonly objetsUtilises?: readonly string[];
  /**
   * Défi joué (« heroique », « fer »), absent ou null pour une partie ordinaire. Seule une victoire en défi compte : elle
   * doit porter sur un niveau déjà à 3 étoiles (refus `niveau_invalide` sinon), marque le défi réussi et rapporte ses
   * braises la première fois. Elle ne touche ni aux étoiles, ni au niveau suivant, ni aux arêtes, ni aux braises de
   * première victoire, ni aux disciples offerts (le niveau est déjà gagné) ; l'expérience du héros est donnée comme
   * pour une victoire.
   */
  readonly defi?: string | null;
  /**
   * Campagne de la partie : `moderne` pour le DLC « Temps modernes » ; absent = l'histoire. Le niveau est celui de cette campagne. Une
   * partie du DLC passe par la progression et les défis du DLC (`moderne`), jamais par ceux de l'histoire ; ses braises suivent les
   * montants du DLC ; elle n'ouvre ni mode infini, ni disciple, ni région de l'histoire.
   */
  readonly campagne?: 'moderne';
}

/**
 * Ce qu'une partie a rapporté, pour l'écran de fin. Les champs facultatifs (jalon 3) sont absents quand il n'y a rien à
 * signaler : pas de défi réussi, pas de disciple offert, pas de région ouverte.
 */
export interface BilanPartie {
  readonly aretes: number;
  readonly braises: number;
  readonly xp: number;
  /** Étoiles jamais obtenues avant sur ce niveau (toutes difficultés confondues). */
  readonly nouvellesEtoiles: number;
  readonly heros: IdHeros | null;
  /** Niveau du héros avant et après la partie (null sans héros ou sans `defs`). */
  readonly niveauHeros: { readonly avant: number; readonly apres: number } | null;
  readonly objetsConsommes: readonly IdObjet[];
  /** Objets emportés mais pas utilisés, recrédités au stock (dans la limite du stock maximal). */
  readonly objetsRendus: readonly IdObjet[];
  /** Le défi réussi pour la première fois sur ce niveau (ses braises sont comprises dans `braises`). */
  readonly defiReussi?: IdDefi;
  /** Braises de ce défi (4 jusqu'au niveau 100, 12 après l'histoire) : présent avec `defiReussi`. */
  readonly braisesDefi?: number;
  /** Le disciple offert par la première victoire sur le boss de la région 2, 4, 6 ou 8 : le premier non possédé dans l'ordre fixé. */
  readonly discipleOffert?: IdHeros;
  /** La région que cette victoire a ouverte (le boss de la région précédente vient d'être battu). */
  readonly regionDebloquee?: number;
  /** Vrai à la première victoire sur le boss de la région 10 : l'interface affiche la fin de campagne. */
  readonly campagneTerminee?: true;
  /** Vrai à la première victoire sur le boss de la région 1 : le mode infini vient de s'ouvrir. */
  readonly infiniDebloque?: true;
}

export type ResultatFin =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly bilan: BilanPartie }
  | { readonly ok: false; readonly raison: RaisonFin };

/** `utilises` est-il inclus dans `equipes`, avec les répétitions ? */
export function inclus(utilises: readonly IdObjet[], equipes: readonly IdObjet[]): boolean {
  const reste = [...equipes];
  for (const objet of utilises) {
    const i = reste.indexOf(objet);
    if (i < 0) return false;
    reste.splice(i, 1);
  }
  return true;
}

/** `equipes` privé de `utilises` (avec les répétitions) : les objets emportés qui n'ont pas servi. */
export function nonUtilises(equipes: readonly IdObjet[], utilises: readonly IdObjet[]): IdObjet[] {
  const reste = [...equipes];
  for (const objet of utilises) {
    const i = reste.indexOf(objet);
    if (i >= 0) reste.splice(i, 1);
  }
  return reste;
}

/**
 * Enregistre une partie terminée : victoire (étoiles, niveau suivant débloqué, arêtes, braises), expérience du héros
 * joué. Une défaite (vies à 0) ne rapporte que la moitié de l'expérience ; un abandon ne rapporte rien. Les objets
 * emportés ont été débités au lancement : ceux qui n'ont pas servi sont recrédités (le stock reste borné à 10), ceux qui
 * ont servi restent consommés. Une partie invalide est refusée en entier : rien ne bouge. `defs` (facultatif) sert
 * seulement au niveau du héros dans le bilan.
 */
export function enregistrerFinDePartie(s: Sauvegarde, fin: FinDePartieMeta, defs?: DefsMeta): ResultatFin {
  const victoire = fin.statut === 'victoire';
  const abandon = fin.statut === 'abandon';
  // Le DLC lit et écrit sa propre progression et ses propres défis ; `base` est la sauvegarde telle que la campagne de la partie la voit.
  const moderne = fin.campagne === 'moderne';
  const base = moderne ? sauvegardeDeCampagne(s, 'moderne') : s;
  if (!abandon && !niveauDebloque(base, fin.niveau)) return refus('niveau_invalide');
  if (moderne && fin.niveau > NIVEAU_MAX_MODERNE) return refus('niveau_invalide');
  const difficulte = DIFFICULTES_SAUVEGARDE.find((d) => d === fin.difficulte);
  if (victoire && difficulte === undefined) return refus('difficulte_inconnue');
  if (victoire && !estEntierEntre(fin.etoiles, 1, 3)) return refus('etoiles_invalides');
  const heros = abandon ? null : (fin.heros ?? null);
  if (heros !== null && (!estIdHeros(heros) || !possede(s, heros))) return refus('heros_non_possede');
  const equipes = listeObjets(fin.objetsEquipes ?? []);
  const utilises = listeObjets(fin.objetsUtilises ?? []);
  if (!equipes || !utilises || equipes.length > EMPLACEMENTS_OBJETS || !inclus(utilises, equipes)) return refus('objets_invalides');

  // Une victoire en défi ne compte que sur un niveau déjà à 3 étoiles (un défi inconnu ou fermé est refusé en entier).
  let defi: IdDefi | null = null;
  if (victoire && fin.defi !== undefined && fin.defi !== null) {
    if (!estIdDefi(fin.defi) || meilleuresEtoiles(base, fin.niveau) < 3) return refus('niveau_invalide');
    defi = fin.defi;
  }

  let suivante = s;
  const etoilesAvant = meilleuresEtoiles(base, fin.niveau);
  if (victoire && defi === null && difficulte !== undefined) {
    suivante = moderne ? enregistrerVictoireModerne(s, fin.niveau, difficulte, fin.etoiles) : enregistrerVictoire(s, fin.niveau, difficulte, fin.etoiles);
  }
  const etoilesApres = meilleuresEtoiles(sauvegardeDeCampagne(suivante, moderne ? 'moderne' : 'histoire'), fin.niveau);
  const nouvellesEtoiles = etoilesApres - etoilesAvant;

  // Défi : ses braises la première fois seulement, rien de la campagne. Partie ordinaire : arêtes et braises habituelles.
  const defisAvant = base.meta.defis;
  const defiDejaReussi = defi !== null && Object.hasOwn(defisAvant, String(fin.niveau)) && defisAvant[String(fin.niveau)]?.[defi] === true;
  const defiReussi = defi !== null && !defiDejaReussi ? defi : null;
  // Les niveaux du DLC valent ceux d'après l'histoire pour les arêtes et l'expérience (le DLC se joue après la campagne).
  const rang = moderne ? NIVEAU_FIN_CAMPAGNE + fin.niveau : fin.niveau;
  const aretesGagnees = victoire && defi === null ? aretesDeVictoire(rang, nouvellesEtoiles) : 0;
  const braisesVictoire = moderne ? braisesDeVictoireModerne : braisesDeVictoire;
  const braisesDuDefi = moderne ? BRAISES_DEFI_MODERNE : braisesDeDefi(fin.niveau);
  const braisesGagnees =
    victoire && defi === null
      ? braisesVictoire(fin.niveau, etoilesAvant === 0, etoilesAvant < 3 && etoilesApres === 3)
      : defiReussi !== null
        ? braisesDuDefi
        : 0;
  const aretes = Math.min(PLAFOND_MONNAIE, s.meta.monnaies.aretes + aretesGagnees);
  const braises = Math.min(PLAFOND_MONNAIE, s.meta.monnaies.braises + braisesGagnees);

  let defis = moderne ? s.moderne.defis : suivante.meta.defis;
  if (defiReussi !== null) {
    defis = { ...defis };
    poser(defis, String(fin.niveau), { ...(Object.hasOwn(defis, String(fin.niveau)) ? defis[String(fin.niveau)] : undefined), [defiReussi]: true });
  }

  let herosMeta = s.meta.heros;
  let xpGagnee = 0;
  let niveauHeros: BilanPartie['niveauHeros'] = null;
  if (heros !== null) {
    const ancien = s.meta.heros[heros];
    const xpAvant = ancien?.xp ?? 0;
    const xpApres = Math.min(PLAFOND_XP, xpAvant + xpDePartie(rang, victoire));
    xpGagnee = xpApres - xpAvant;
    herosMeta = { ...s.meta.heros, [heros]: { xp: xpApres, competences: ancien?.competences ?? {} } };
    if (defs) niveauHeros = { avant: niveauHerosDepuisXp(xpAvant, defs.seuilsXp), apres: niveauHerosDepuisXp(xpApres, defs.seuilsXp) };
  }

  // La première victoire sur le boss de la région 2, 4, 6 ou 8 offre le premier disciple non encore possédé.
  const discipleOffert =
    !moderne && victoire && defi === null && etoilesAvant === 0 && NIVEAUX_DISCIPLE_OFFERT.includes(fin.niveau)
      ? DISCIPLES_OFFERTS.find((disciple) => !Object.hasOwn(herosMeta, disciple))
      : undefined;
  if (discipleOffert !== undefined) herosMeta = { ...herosMeta, [discipleOffert]: { xp: 0, competences: {} } };
  const regionDebloquee = !moderne && suivante.meta.regionMax > s.meta.regionMax ? suivante.meta.regionMax : undefined;
  const premiereVictoireOrdinaire = victoire && defi === null && etoilesAvant === 0;
  const campagneTerminee = !moderne && premiereVictoireOrdinaire && fin.niveau === NIVEAU_FIN_CAMPAGNE;
  const infiniDebloque = !moderne && premiereVictoireOrdinaire && fin.niveau === NIVEAU_OUVERTURE_INFINI;

  // Les objets emportés ont été débités au lancement : on rend ceux qui n'ont pas servi, sans dépasser le stock maximal.
  const objets = { ...s.meta.objets };
  const rendus: IdObjet[] = [];
  for (const objet of nonUtilises(equipes, utilises)) {
    if (objets[objet] >= STOCK_MAX_OBJET) continue;
    objets[objet] += 1;
    rendus.push(objet);
  }

  const meta = { ...suivante.meta, monnaies: { aretes, braises }, heros: herosMeta, objets };
  // Le DLC range ses défis et ses badges dans son bloc `moderne` ; les défis de l'histoire (`meta.defis`) ne bougent pas.
  const badges = moderne && victoire ? badgesDeLaVictoire({ numero: fin.niveau, boss: estBossModerne(fin.niveau), premiereVictoire: premiereVictoireOrdinaire, etoilesAvant, etoilesApres, defiReussi }) : 0;
  const sauvegarde: Sauvegarde = moderne
    ? { ...suivante, meta, moderne: { ...suivante.moderne, defis, badges: suivante.moderne.badges + badges } }
    : { ...suivante, meta: { ...meta, defis } };
  return {
    ok: true,
    sauvegarde,
    bilan: {
      aretes: aretes - s.meta.monnaies.aretes,
      braises: braises - s.meta.monnaies.braises,
      xp: xpGagnee,
      nouvellesEtoiles,
      heros,
      niveauHeros,
      objetsConsommes: utilises,
      objetsRendus: rendus,
      ...(defiReussi !== null ? { defiReussi, braisesDefi: braisesDuDefi } : {}),
      ...(discipleOffert !== undefined ? { discipleOffert } : {}),
      ...(regionDebloquee !== undefined ? { regionDebloquee } : {}),
      ...(campagneTerminee ? { campagneTerminee: true as const } : {}),
      ...(infiniDebloque ? { infiniDebloque: true as const } : {}),
    },
  };
}
