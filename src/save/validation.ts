// Validation stricte d'une sauvegarde de version courante. Sert à relire le stockage et à valider un code
// importé : on n'y fait pas confiance. Types exacts, bornes, aucune clé en trop (ce qui écarte `__proto__`,
// `constructor`, `prototype`), et le résultat est une copie neuve construite champ par champ, jamais l'objet
// reçu.
import { DIEUX } from '../data/dieux';
import { DIFFICULTES } from '../data/difficultes';
import { REGLES } from '../data/regles';
import type { ConfigPartie } from '../engine/etat';
import {
  DIFFICULTES_SAUVEGARDE,
  NOMBRE_NIVEAUX,
  VERSION_SAUVEGARDE,
  type Etoiles,
  type EtoilesNiveau,
  type PartieEnCours,
  type Progression,
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
    Object.defineProperty(etoiles, cle, { value: niveau.valeur, enumerable: true, writable: true, configurable: true });
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

function validerConfig(x: unknown): Resultat<ConfigPartie> {
  const base = avecCles(x, ['graine', 'difficulte', 'dieu', 'niveauHeros', 'versionDonnees'], 'partie.config');
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
  return ok({ graine, difficulte, dieu, niveauHeros, versionDonnees });
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

/** Valide une sauvegarde de la version courante et en rend une copie propre. */
export function validerSauvegarde(x: unknown): Resultat<Sauvegarde> {
  const base = avecCles(x, ['version', 'progression', 'reglages', 'partie'], 'sauvegarde');
  if (!base.ok) return base;
  if (valeur(base.valeur, 'version') !== VERSION_SAUVEGARDE) return echec(`sauvegarde.version : ${String(VERSION_SAUVEGARDE)} attendue`);
  const progression = validerProgression(valeur(base.valeur, 'progression'));
  if (!progression.ok) return progression;
  const reglages = validerReglages(valeur(base.valeur, 'reglages'));
  if (!reglages.ok) return reglages;
  const partie = validerPartie(valeur(base.valeur, 'partie'), progression.valeur.niveauMax);
  if (!partie.ok) return partie;
  return ok({ version: VERSION_SAUVEGARDE, progression: progression.valeur, reglages: reglages.valeur, partie: partie.valeur });
}
