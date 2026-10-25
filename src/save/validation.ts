// Validation stricte d'une sauvegarde de version courante. Sert à relire le stockage et à valider un code
// importé : on n'y fait pas confiance. Types exacts, bornes, aucune clé en trop (ce qui écarte `__proto__`,
// `constructor`, `prototype`), et le résultat est une copie neuve construite champ par champ, jamais l'objet
// reçu.
//
// Cohérence de la méta-progression : les étoiles dépensées dans l'arbre ne dépassent pas les étoiles gagnées, les
// points de compétence placés ne dépassent pas ceux du niveau du héros. Sans définitions (`defs`), le niveau d'un
// héros n'est pas connu : la validation vérifie alors seulement la forme et le plafond de points du niveau maximal.
// Avec les définitions de `src/data/heros.ts`, elle vérifie aussi que chaque compétence existe, que son rang est
// permis et que le niveau requis (6 pour l'ultime) est atteint. Les définitions ne servent qu'aux imports et aux
// transactions : relire le stockage ne les passe pas, pour qu'un rééquilibrage ne rende jamais une sauvegarde
// existante illisible.
import { DIEUX } from '../data/dieux';
import { DIFFICULTES } from '../data/difficultes';
import {
  AVATARS,
  BRANCHES_ARBRE,
  COMPETENCES_PAR_HEROS,
  EMPLACEMENTS_OBJETS,
  HEROS_PAR_DIEU,
  IDS_DIEUX,
  IDS_HEROS,
  IDS_OBJETS,
  PLAFOND_MONNAIE,
  PLAFOND_XP,
  RANG_MAX_ARBRE,
  RANG_MAX_COMPETENCE,
  STOCK_MAX_OBJET,
  type IdObjet,
} from '../data/meta';
import { REGLES } from '../data/regles';
import type { ConfigPartie } from '../engine/etat';
import { definitionDuHeros, niveauHerosDepuisXp, pointsDeCompetence, type DefsMeta } from './definitions';
import {
  DIFFICULTES_SAUVEGARDE,
  etoilesDepensees,
  etoilesGagnees,
  NOMBRE_NIVEAUX,
  VERSION_SAUVEGARDE,
  type ChoixPartie,
  type Etoiles,
  type EtoilesNiveau,
  type Meta,
  type PartieEnCours,
  type Progression,
  type ProgressionHeros,
  type Reglages,
  type Sauvegarde,
} from './format';

export type Resultat<T> = { readonly ok: true; readonly valeur: T } | { readonly ok: false; readonly raison: string };

/** Taille maximale de l'état sérialisé d'une partie en cours, en caractères. */
export const TAILLE_MAX_ETAT = 4 * 1024 * 1024;
const VAGUE_MAX = 1000;
const GRAINE_MAX = 0xffffffff;

function ok<T>(valeur: T): Resultat<T> {
  return { ok: true, valeur };
}

function echec<T>(raison: string): Resultat<T> {
  return { ok: false, raison };
}

function estEnregistrement(x: unknown): x is Record<string, unknown> {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const proto = Object.getPrototypeOf(x) as unknown;
  return proto === Object.prototype || proto === null;
}

/** Un objet qui a exactement ces clés propres (ni plus ni moins). */
function avecCles(x: unknown, cles: readonly string[], chemin: string): Resultat<Record<string, unknown>> {
  if (!estEnregistrement(x)) return echec(`${chemin} : objet attendu`);
  const presentes = Object.keys(x);
  for (const cle of presentes) if (!cles.includes(cle)) return echec(`${chemin} : clé inattendue « ${cle} »`);
  for (const cle of cles) if (!Object.hasOwn(x, cle)) return echec(`${chemin} : clé « ${cle} » manquante`);
  return ok(x);
}

export function estEntierEntre(x: unknown, min: number, max: number): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
}

function valeur(objet: Record<string, unknown>, cle: string): unknown {
  return Object.hasOwn(objet, cle) ? objet[cle] : undefined;
}

/** Pose une valeur sous une clé quelconque comme propriété propre (jamais comme prototype, même pour `__proto__`). */
export function poser<T>(cible: Record<string, T>, cle: string, valeur: T): void {
  Object.defineProperty(cible, cle, { value: valeur, enumerable: true, writable: true, configurable: true });
}

/** `x` est l'un des éléments de `liste` (une liste d'identifiants connus). */
function parmi<T extends string>(liste: readonly T[], x: unknown): x is T {
  return typeof x === 'string' && (liste as readonly string[]).includes(x);
}

function validerEtoilesNiveau(x: unknown, chemin: string): Resultat<EtoilesNiveau> {
  if (!estEnregistrement(x)) return echec(`${chemin} : objet attendu`);
  const copie: EtoilesNiveau = {};
  const cles = Object.keys(x);
  if (cles.length === 0) return echec(`${chemin} : aucune difficulté`);
  for (const cle of cles) {
    const difficulte = DIFFICULTES_SAUVEGARDE.find((d) => d === cle);
    if (difficulte === undefined) return echec(`${chemin} : difficulté inconnue « ${cle} »`);
    const etoiles = valeur(x, cle);
    if (!estEntierEntre(etoiles, 1, 3)) return echec(`${chemin}.${cle} : 1 à 3 étoiles attendues`);
    copie[difficulte] = etoiles as Etoiles;
  }
  return ok(copie);
}

const CLE_NIVEAU = /^(?:[1-9]\d?|100)$/;

function validerProgression(x: unknown): Resultat<Progression> {
  const base = avecCles(x, ['niveauMax', 'etoiles'], 'progression');
  if (!base.ok) return base;
  const niveauMax = valeur(base.valeur, 'niveauMax');
  if (!estEntierEntre(niveauMax, 1, NOMBRE_NIVEAUX)) return echec('progression.niveauMax : entier de 1 à 100 attendu');
  const brutes = valeur(base.valeur, 'etoiles');
  if (!estEnregistrement(brutes)) return echec('progression.etoiles : objet attendu');
  const etoiles: Record<string, EtoilesNiveau> = {};
  for (const cle of Object.keys(brutes)) {
    if (!CLE_NIVEAU.test(cle)) return echec(`progression.etoiles : numéro de niveau invalide « ${cle} »`);
    const numero = Number(cle);
    // Réussir le niveau N débloque N + 1 : un niveau réussi ne peut pas dépasser le niveau max débloqué.
    if (niveauMax < Math.min(numero + 1, NOMBRE_NIVEAUX)) return echec(`progression : le niveau ${cle} est réussi mais le suivant n'est pas débloqué`);
    const niveau = validerEtoilesNiveau(valeur(brutes, cle), `progression.etoiles.${cle}`);
    if (!niveau.ok) return niveau;
    poser(etoiles, cle, niveau.valeur);
  }
  return ok({ niveauMax, etoiles });
}

function validerReglages(x: unknown): Resultat<Reglages> {
  const base = avecCles(x, ['son', 'musique', 'vitesse'], 'reglages');
  if (!base.ok) return base;
  const son = valeur(base.valeur, 'son');
  const musique = valeur(base.valeur, 'musique');
  const vitesse = valeur(base.valeur, 'vitesse');
  if (!estEntierEntre(son, 0, 100)) return echec('reglages.son : entier de 0 à 100 attendu');
  if (!estEntierEntre(musique, 0, 100)) return echec('reglages.musique : entier de 0 à 100 attendu');
  if (vitesse !== 1 && vitesse !== 2) return echec('reglages.vitesse : 1 ou 2 attendu');
  return ok({ son, musique, vitesse });
}

// --- Méta-progression -----------------------------------------------------------------------------------------

/** Forme d'un identifiant de compétence (les ids viennent de src/data/heros.ts) : minuscules, chiffres et tirets bas. */
const ID_COMPETENCE = /^[a-z][a-z0-9_]{0,31}$/;

/** Rangs de compétences d'un héros : au plus 4, ids bien formés (jamais un nom hérité d'Object), rangs de 1 à 3. */
function validerCompetences(x: unknown, chemin: string): Resultat<Record<string, number>> {
  if (!estEnregistrement(x)) return echec(`${chemin} : objet attendu`);
  const cles = Object.keys(x);
  if (cles.length > COMPETENCES_PAR_HEROS) return echec(`${chemin} : au plus ${String(COMPETENCES_PAR_HEROS)} compétences`);
  const copie: Record<string, number> = {};
  for (const cle of cles) {
    if (!ID_COMPETENCE.test(cle) || cle in Object.prototype || cle === 'prototype') return echec(`${chemin} : compétence invalide « ${cle} »`);
    const rang = valeur(x, cle);
    if (!estEntierEntre(rang, 1, RANG_MAX_COMPETENCE)) return echec(`${chemin}.${cle} : rang de 1 à ${String(RANG_MAX_COMPETENCE)} attendu`);
    poser(copie, cle, rang);
  }
  return ok(copie);
}

/** Un objet dont les clés sont exactement `cles` et les valeurs des entiers de 0 à `max`. */
function validerEntiersParCle<K extends string>(x: unknown, cles: readonly K[], max: number, chemin: string): Resultat<Record<K, number>> {
  const base = avecCles(x, cles, chemin);
  if (!base.ok) return base;
  const copie = {} as Record<K, number>;
  for (const cle of cles) {
    const v = valeur(base.valeur, cle);
    if (!estEntierEntre(v, 0, max)) return echec(`${chemin}.${cle} : entier de 0 à ${String(max)} attendu`);
    copie[cle] = v;
  }
  return ok(copie);
}

/** Une liste d'objets emportés : au plus 3, ids connus. */
function validerObjetsEmportes(x: unknown, chemin: string): Resultat<IdObjet[]> {
  if (!Array.isArray(x)) return echec(`${chemin} : liste attendue`);
  if (x.length > EMPLACEMENTS_OBJETS) return echec(`${chemin} : au plus ${String(EMPLACEMENTS_OBJETS)} objets`);
  const copie: IdObjet[] = [];
  for (const objet of x as unknown[]) {
    if (!parmi(IDS_OBJETS, objet)) return echec(`${chemin} : objet inconnu`);
    copie.push(objet);
  }
  return ok(copie);
}

function validerUnHeros(x: unknown, chemin: string, id: string, defs: DefsMeta | undefined): Resultat<ProgressionHeros> {
  const base = avecCles(x, ['xp', 'competences'], chemin);
  if (!base.ok) return base;
  const xp = valeur(base.valeur, 'xp');
  if (!estEntierEntre(xp, 0, PLAFOND_XP)) return echec(`${chemin}.xp : entier de 0 à ${String(PLAFOND_XP)} attendu`);
  const competences = validerCompetences(valeur(base.valeur, 'competences'), `${chemin}.competences`);
  if (!competences.ok) return competences;
  const depense = Object.values(competences.valeur).reduce((somme, rang) => somme + rang, 0);
  if (!defs) {
    if (depense > pointsDeCompetence(REGLES.niveauHerosMax)) return echec(`${chemin} : plus de points placés que le niveau maximal n'en donne`);
    return ok({ xp, competences: competences.valeur });
  }
  const definition = definitionDuHeros(defs, id);
  if (!definition) return echec(`${chemin} : héros sans définition`);
  const niveau = niveauHerosDepuisXp(xp, defs.seuilsXp);
  for (const [cle, rang] of Object.entries(competences.valeur)) {
    const competence = definition.competences.find((c) => c.id === cle);
    if (!competence) return echec(`${chemin}.competences : compétence inconnue « ${cle} »`);
    if (rang > competence.rangMax) return echec(`${chemin}.competences.${cle} : rang au-dessus du maximum`);
    if (niveau < competence.niveauRequis) return echec(`${chemin}.competences.${cle} : niveau ${String(competence.niveauRequis)} requis`);
  }
  if (depense > pointsDeCompetence(niveau)) return echec(`${chemin} : plus de points placés (${String(depense)}) que le niveau ${String(niveau)} n'en donne`);
  return ok({ xp, competences: competences.valeur });
}

function validerHerosPossedes(x: unknown, defs: DefsMeta | undefined): Resultat<Meta['heros']> {
  if (!estEnregistrement(x)) return echec('meta.heros : objet attendu');
  const cles = Object.keys(x);
  for (const cle of cles) if (!parmi(IDS_HEROS, cle)) return echec(`meta.heros : héros inconnu « ${cle} »`);
  for (const avatar of AVATARS) if (!Object.hasOwn(x, avatar)) return echec(`meta.heros : l'avatar « ${avatar} » est offert et doit figurer`);
  const heros: Meta['heros'] = {};
  for (const cle of cles) {
    if (!parmi(IDS_HEROS, cle)) continue;
    const un = validerUnHeros(valeur(x, cle), `meta.heros.${cle}`, cle, defs);
    if (!un.ok) return un;
    heros[cle] = un.valeur;
  }
  return ok(heros);
}

function validerChoix(x: unknown): Resultat<ChoixPartie> {
  const base = avecCles(x, ['dieu', 'heros', 'objets'], 'meta.choix');
  if (!base.ok) return base;
  const dieu = valeur(base.valeur, 'dieu');
  const heros = valeur(base.valeur, 'heros');
  if (!parmi(IDS_DIEUX, dieu)) return echec('meta.choix.dieu inconnu');
  if (!parmi(HEROS_PAR_DIEU[dieu], heros)) return echec('meta.choix.heros : un héros de ce dieu est attendu');
  const objets = validerObjetsEmportes(valeur(base.valeur, 'objets'), 'meta.choix.objets');
  if (!objets.ok) return objets;
  return ok({ dieu, heros, objets: objets.valeur });
}

function validerMeta(x: unknown, progression: Progression, defs: DefsMeta | undefined): Resultat<Meta> {
  const base = avecCles(x, ['monnaies', 'heros', 'arbre', 'objets', 'choix'], 'meta');
  if (!base.ok) return base;
  const monnaies = validerEntiersParCle(valeur(base.valeur, 'monnaies'), ['aretes', 'braises'] as const, PLAFOND_MONNAIE, 'meta.monnaies');
  if (!monnaies.ok) return monnaies;
  const heros = validerHerosPossedes(valeur(base.valeur, 'heros'), defs);
  if (!heros.ok) return heros;
  const arbre = validerEntiersParCle(valeur(base.valeur, 'arbre'), BRANCHES_ARBRE, RANG_MAX_ARBRE, 'meta.arbre');
  if (!arbre.ok) return arbre;
  if (etoilesDepensees(arbre.valeur) > etoilesGagnees(progression)) return echec("meta.arbre : plus d'étoiles dépensées que gagnées");
  const objets = validerEntiersParCle(valeur(base.valeur, 'objets'), IDS_OBJETS, STOCK_MAX_OBJET, 'meta.objets');
  if (!objets.ok) return objets;
  const choix = validerChoix(valeur(base.valeur, 'choix'));
  if (!choix.ok) return choix;
  return ok({ monnaies: monnaies.valeur, heros: heros.valeur, arbre: arbre.valeur, objets: objets.valeur, choix: choix.valeur });
}

// --- Partie en cours ------------------------------------------------------------------------------------------

const CLES_CONFIG = ['graine', 'difficulte', 'dieu', 'niveauHeros', 'versionDonnees'] as const;
/** Champs que le moteur ajoute à la config au jalon 2 : tous présents ou tous absents (config d'avant le jalon 2). */
const CLES_EXTENSION_CONFIG = ['heros', 'competencesHeros', 'ameliorations', 'objets'] as const;

function validerExtensionConfig(brute: Record<string, unknown>, dieu: string): Resultat<Record<string, unknown>> {
  const heros = valeur(brute, 'heros');
  if (!parmi(IDS_HEROS, heros)) return echec('partie.config.heros inconnu');
  if (parmi(IDS_DIEUX, dieu) && !(HEROS_PAR_DIEU[dieu] as readonly string[]).includes(heros)) return echec("partie.config.heros n'appartient pas au dieu");
  const competences = validerCompetences(valeur(brute, 'competencesHeros'), 'partie.config.competencesHeros');
  if (!competences.ok) return competences;
  const brutesAmeliorations = valeur(brute, 'ameliorations');
  if (!estEnregistrement(brutesAmeliorations)) return echec('partie.config.ameliorations : objet attendu');
  const ameliorations: Record<string, number> = {};
  for (const cle of Object.keys(brutesAmeliorations)) {
    if (!parmi(BRANCHES_ARBRE, cle)) return echec(`partie.config.ameliorations : branche inconnue « ${cle} »`);
    const rang = valeur(brutesAmeliorations, cle);
    if (!estEntierEntre(rang, 0, RANG_MAX_ARBRE)) return echec(`partie.config.ameliorations.${cle} : rang de 0 à ${String(RANG_MAX_ARBRE)} attendu`);
    poser(ameliorations, cle, rang);
  }
  const objets = validerObjetsEmportes(valeur(brute, 'objets'), 'partie.config.objets');
  if (!objets.ok) return objets;
  return ok({ heros, competencesHeros: competences.valeur, ameliorations, objets: objets.valeur });
}

function validerConfig(x: unknown): Resultat<ConfigPartie> {
  if (!estEnregistrement(x)) return echec('partie.config : objet attendu');
  const avecExtension = CLES_EXTENSION_CONFIG.some((cle) => Object.hasOwn(x, cle));
  const base = avecCles(x, avecExtension ? [...CLES_CONFIG, ...CLES_EXTENSION_CONFIG] : CLES_CONFIG, 'partie.config');
  if (!base.ok) return base;
  const graine = valeur(base.valeur, 'graine');
  const difficulte = valeur(base.valeur, 'difficulte');
  const dieu = valeur(base.valeur, 'dieu');
  const niveauHeros = valeur(base.valeur, 'niveauHeros');
  const versionDonnees = valeur(base.valeur, 'versionDonnees');
  if (!estEntierEntre(graine, 0, GRAINE_MAX)) return echec('partie.config.graine : entier 32 bits attendu');
  if (typeof difficulte !== 'string' || !Object.hasOwn(DIFFICULTES, difficulte)) return echec('partie.config.difficulte inconnue');
  if (typeof dieu !== 'string' || !Object.hasOwn(DIEUX, dieu)) return echec('partie.config.dieu inconnu');
  if (!estEntierEntre(niveauHeros, 1, REGLES.niveauHerosMax)) return echec('partie.config.niveauHeros hors bornes');
  if (!estEntierEntre(versionDonnees, 1, 1_000_000)) return echec('partie.config.versionDonnees invalide');
  const config = { graine, difficulte, dieu, niveauHeros, versionDonnees };
  if (!avecExtension) return ok(config);
  const extension = validerExtensionConfig(base.valeur, dieu);
  if (!extension.ok) return extension;
  return ok({ ...config, ...extension.valeur });
}

function validerPartie(x: unknown, niveauMax: number): Resultat<PartieEnCours | null> {
  if (x === null) return ok(null);
  const base = avecCles(x, ['niveau', 'config', 'etat', 'vague'], 'partie');
  if (!base.ok) return base;
  const niveau = valeur(base.valeur, 'niveau');
  const etat = valeur(base.valeur, 'etat');
  const vague = valeur(base.valeur, 'vague');
  if (!estEntierEntre(niveau, 1, NOMBRE_NIVEAUX) || niveau > niveauMax) return echec('partie.niveau : niveau débloqué attendu');
  if (typeof etat !== 'string' || etat.length < 2 || etat.length > TAILLE_MAX_ETAT || !etat.startsWith('{')) return echec('partie.etat : état sérialisé attendu');
  if (!estEntierEntre(vague, 1, VAGUE_MAX)) return echec('partie.vague : entier de 1 à 1000 attendu');
  const config = validerConfig(valeur(base.valeur, 'config'));
  if (!config.ok) return config;
  return ok({ niveau, config: config.valeur, etat, vague });
}

/**
 * Valide une sauvegarde de la version courante et en rend une copie propre. `defs` (facultatif) active les
 * vérifications qui dépendent des données de héros ; voir l'en-tête du fichier.
 */
export function validerSauvegarde(x: unknown, defs?: DefsMeta): Resultat<Sauvegarde> {
  const base = avecCles(x, ['version', 'progression', 'reglages', 'meta', 'partie'], 'sauvegarde');
  if (!base.ok) return base;
  if (valeur(base.valeur, 'version') !== VERSION_SAUVEGARDE) return echec(`sauvegarde.version : ${String(VERSION_SAUVEGARDE)} attendue`);
  const progression = validerProgression(valeur(base.valeur, 'progression'));
  if (!progression.ok) return progression;
  const reglages = validerReglages(valeur(base.valeur, 'reglages'));
  if (!reglages.ok) return reglages;
  const meta = validerMeta(valeur(base.valeur, 'meta'), progression.valeur, defs);
  if (!meta.ok) return meta;
  const partie = validerPartie(valeur(base.valeur, 'partie'), progression.valeur.niveauMax);
  if (!partie.ok) return partie;
  return ok({ version: VERSION_SAUVEGARDE, progression: progression.valeur, reglages: reglages.valeur, meta: meta.valeur, partie: partie.valeur });
}
