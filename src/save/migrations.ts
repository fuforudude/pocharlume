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

/**
 * v3 vers v4 : progression, réglages, partie en cours et tout le reste de `meta` sont gardés tels quels. `meta` reçoit
 * la région ouverte (déduite du niveau le plus haut débloqué : la région r + 1 s'ouvre quand le niveau 10 r est battu),
 * aucun défi réussi, et une collection vide (rien en poche, rien d'équipé, compteurs de garantie à zéro), écrits en dur
 * ici comme pour la v3. Les victoires passées ne rapportent ni éclats ni défis rétroactifs. Rien n'est perdu.
 */
function v3versV4(v3: Brut): Brut {
  const progression = objet(v3.progression);
  const niveauMax = progression.niveauMax;
  const regionMax = typeof niveauMax === 'number' && Number.isInteger(niveauMax) && niveauMax >= 1 ? Math.min(10, Math.floor((niveauMax - 1) / 10) + 1) : 1;
  return {
    ...v3,
    version: 4,
    meta: {
      ...objet(v3.meta),
      regionMax,
      defis: {},
      collection: { possedes: {}, eclats: 0, garanties: { skins: 0, familiers: 0 }, equipes: { skins: {}, familiers: {} } },
    },
  };
}

/**
 * v4 vers v5 : tout est gardé tel quel ; `meta` reçoit le mode infini sans record ni palier payé (écrit en dur ici comme
 * pour les versions précédentes). Rien n'est perdu : le mode infini n'existait pas, il n'y a aucun record à reprendre.
 */
function v4versV5(v4: Brut): Brut {
  return { ...v4, version: 5, meta: { ...objet(v4.meta), infini: { records: {}, paliers: [] } } };
}

/**
 * v5 vers v6 : tout est gardé tel quel ; `meta` reçoit la liste des inscriptions trouvées, vide (écrite en dur ici comme pour les versions
 * précédentes). Rien n'est perdu : les statues n'existaient pas, il n'y a aucune inscription à reprendre.
 */
function v5versV6(v5: Brut): Brut {
  return { ...v5, version: 6, meta: { ...objet(v5.meta), inscriptions: [] } };
}

/**
 * v6 vers v7 : tout est gardé tel quel ; `meta` reçoit le bestiaire, sans ennemi rencontré et avec les fiches « Nouvel ennemi » activées (écrits en
 * dur ici comme pour les versions précédentes). Rien n'est perdu : le bestiaire n'existait pas ; les ennemis déjà affrontés s'y inscriront
 * à leur prochaine apparition (leur fiche s'affichera une fois, ce qui est voulu : le joueur ne les a jamais lus).
 */
function v6versV7(v6: Brut): Brut {
  return { ...v6, version: 7, meta: { ...objet(v6.meta), bestiaire: { rencontres: [], fiches: true } } };
}

/**
 * v7 vers v8 : la campagne passe de 100 à 150 niveaux (régions 11 à 15). Avant, le niveau 100 gagné laissait `niveauMax` à 100 ;
 * désormais il débloque le niveau 101 et la région 11. Une sauvegarde dont le niveau 100 est déjà gagné reçoit ce déblocage
 * (`niveauMax` 101, `regionMax` 11) ; tout le reste est gardé tel quel.
 */
function v7versV8(v7: Brut): Brut {
  const progression = objet(v7.progression);
  const finDeLHistoire = progression.niveauMax === 100 && estObjet(objet(progression.etoiles)['100']);
  if (!finDeLHistoire) return { ...v7, version: 8 };
  return { ...v7, version: 8, progression: { ...progression, niveauMax: 101 }, meta: { ...objet(v7.meta), regionMax: 11 } };
}

/**
 * v8 vers v9 : la campagne « Temps modernes » (le DLC) entre dans la sauvegarde, vide (écrite en dur ici comme pour les versions
 * précédentes) : sa progression (niveau 1 ouvert, aucune étoile), ni défi ni record, 0 badge, rien en collection, aucun titre, sticker
 * déplié. Tout le reste est gardé tel quel : l'histoire n'est pas touchée. Une campagne du DLC déjà présente est gardée (la migration
 * appliquée deux fois ne la remet pas à zéro) ; la validation finale juge sa forme.
 */
function v8versV9(v8: Brut): Brut {
  const moderne = Object.hasOwn(v8, 'moderne')
    ? v8.moderne
    : { progression: { niveauMax: 1, etoiles: {} }, defis: {}, records: {}, badges: 0, collection: { skinsTours: [], skinsHeros: [], garantie: 0, equipes: {} }, titres: [], stickerReplie: false };
  return { ...v8, version: 9, moderne };
}

/** `MIGRATIONS[n]` fait passer une sauvegarde de la version n à la version n + 1. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = { 1: v1versV2, 2: v2versV3, 3: v3versV4, 4: v4versV5, 5: v5versV6, 6: v6versV7, 7: v7versV8, 8: v8versV9 };

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
