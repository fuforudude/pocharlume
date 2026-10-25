// Migrations de format : une fonction par saut de version (vN vers vN+1), appliquées en chaîne jusqu'à la
// version courante, puis validation stricte du résultat. Pour changer le format : incrémenter
// VERSION_SAUVEGARDE, écrire la migration de la version précédente ici, et garder en fixture (dossier
// fixtures/) une sauvegarde de l'ancienne version que migrations.test.ts relit.
//
// Une migration reçoit un objet brut (JSON relu, non fiable) et en rend un nouveau, sans le modifier. Elle ne
// valide rien : la validation finale (validation.ts) rejette tout ce qui reste incohérent.
import type { DefsMeta } from './definitions';
import { VERSION_SAUVEGARDE, type Sauvegarde } from './format';
import { validerSauvegarde } from './validation';

type Brut = Record<string, unknown>;
type Migration = (ancienne: Brut) => Brut;

export type ResultatMigration =
  | { readonly ok: true; readonly sauvegarde: Sauvegarde; readonly depuis: number }
  | { readonly ok: false; readonly cause: 'illisible' | 'trop_recente' | 'invalide'; readonly raison: string };

function estObjet(x: unknown): x is Brut {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function objet(x: unknown): Brut {
  return estObjet(x) ? x : {};
}

/** Copie une valeur sous une clé quelconque, même `__proto__`, comme propriété propre (jamais comme prototype). */
function poser(cible: Brut, cle: string, valeur: unknown): void {
  Object.defineProperty(cible, cle, { value: valeur, enumerable: true, writable: true, configurable: true });
}

function enPourcentage(fraction: unknown): unknown {
  return typeof fraction === 'number' && Number.isFinite(fraction) ? Math.round(Math.min(1, Math.max(0, fraction)) * 100) : fraction;
}

/**
 * v1 vers v2 : les étoiles de la v1 (une seule valeur par niveau) deviennent celles de la difficulté Matou, la
 * difficulté de référence ; les volumes passent de fractions à des pourcentages ; la vitesse par défaut est
 * ×1 ; la partie en cours est abandonnée (son état ne se rejoue pas avec les données de la v2).
 */
function v1versV2(v1: Brut): Brut {
  const progression = objet(v1.progression);
  const reglages = objet(v1.reglages);
  const etoiles: Brut = {};
  const anciennes = objet(progression.etoiles);
  for (const cle of Object.keys(anciennes)) poser(etoiles, cle, { matou: anciennes[cle] });
  return {
    version: 2,
    progression: { niveauMax: progression.niveauMax, etoiles },
    reglages: { son: enPourcentage(reglages.son), musique: enPourcentage(reglages.musique), vitesse: 1 },
    partie: null,
  };
}

/**
 * La partie en cours d'une v2 reçoit les champs de config du jalon 2 (héros = avatar du dieu, ni compétence, ni
 * amélioration, ni objet), obligatoires depuis : sa version des données est ancienne, elle sera oubliée à la reprise.
 */
function avecConfigEtendue(partie: unknown): unknown {
  if (!estObjet(partie) || !estObjet(partie.config) || Object.hasOwn(partie.config, 'heros')) return partie;
  return { ...partie, config: { ...partie.config, heros: partie.config.dieu, competencesHeros: {}, ameliorations: {}, objets: [] } };
}

/**
 * v2 vers v3 : la progression, les réglages et la partie en cours sont gardés tels quels ; la méta-progression
 * (`meta`) démarre à son état de départ, écrit ici en dur (il ne suivra pas les évolutions ultérieures des valeurs
 * par défaut). Rien n'est perdu : les étoiles déjà gagnées sont toutes disponibles pour l'arbre, puisque les
 * étoiles dépensées se déduisent des rangs achetés (aucun pour l'instant).
 */
function v2versV3(v2: Brut): Brut {
  return {
    ...v2,
    version: 3,
    partie: avecConfigEtendue(v2.partie),
    meta: {
      monnaies: { aretes: 0, braises: 0 },
      heros: { plume: { xp: 0, competences: {} }, charlie: { xp: 0, competences: {} }, pollen: { xp: 0, competences: {} } },
      arbre: { caserne: 0, tir: 0, magie: 0, artillerie: 0, sorts: 0, heros: 0 },
      objets: { fiole_soufre: 0, herbe_sabbat: 0, griffe_renfort: 0, sablier: 0 },
      choix: { dieu: 'charlie', heros: 'charlie', objets: [] },
    },
  };
}

/** `MIGRATIONS[n]` fait passer une sauvegarde de la version n à la version n + 1. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = { 1: v1versV2, 2: v2versV3 };

/**
 * Migre une sauvegarde brute (n'importe quelle version connue) vers la version courante et la valide. `defs`
 * (facultatif) active la validation complète des héros (voir validation.ts), pour les imports.
 */
export function migrer(brut: unknown, defs?: DefsMeta): ResultatMigration {
  if (!estObjet(brut) || !Object.hasOwn(brut, 'version')) return { ok: false, cause: 'illisible', raison: 'pas de numéro de version' };
  let version = brut.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { ok: false, cause: 'illisible', raison: 'numéro de version invalide' };
  if (version > VERSION_SAUVEGARDE) {
    return { ok: false, cause: 'trop_recente', raison: `sauvegarde en version ${String(version)}, le jeu lit jusqu'à la version ${String(VERSION_SAUVEGARDE)}` };
  }
  const depuis = version;
  let courante: Brut = brut;
  try {
    while (version < VERSION_SAUVEGARDE) {
      const migration = Object.hasOwn(MIGRATIONS, version) ? MIGRATIONS[version] : undefined;
      if (!migration) return { ok: false, cause: 'illisible', raison: `aucune migration depuis la version ${String(version)}` };
      courante = migration(courante);
      version++;
    }
  } catch (erreur) {
    return { ok: false, cause: 'invalide', raison: `migration impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}` };
  }
  const resultat = validerSauvegarde(courante, defs);
  if (!resultat.ok) return { ok: false, cause: 'invalide', raison: resultat.raison };
  return { ok: true, sauvegarde: resultat.valeur, depuis };
}
