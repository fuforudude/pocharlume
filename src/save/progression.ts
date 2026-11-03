// Règles de progression de la campagne, en fonctions pures : elles prennent une sauvegarde et en rendent une
// nouvelle (jamais modifiée sur place), sans toucher au stockage.
import { IDS_DEFIS, NIVEAU_FIN_CAMPAGNE, regionOuverte } from '../data/meta';
import {
  DIFFICULTES_SAUVEGARDE,
  NOMBRE_NIVEAUX,
  type DefisNiveau,
  type DifficulteSauvegarde,
  type Etoiles,
  type EtoilesNiveau,
  type Reglages,
  type Sauvegarde,
} from './format';
import { reunirRencontres } from './transactions-bestiaire';
import { reunirInscriptions } from './transactions-inscriptions';
import { estEntierEntre } from './validation';

function cle(numero: number): string {
  return String(numero);
}

function valide(numero: number): boolean {
  return estEntierEntre(numero, 1, NOMBRE_NIVEAUX);
}

/** Un niveau est jouable s'il est le premier ou si le précédent a été réussi. */
export function niveauDebloque(s: Sauvegarde, numero: number): boolean {
  return valide(numero) && numero <= s.progression.niveauMax;
}

/** Meilleures étoiles d'un niveau dans une difficulté (0 si jamais réussi). */
export function etoilesDe(s: Sauvegarde, numero: number, difficulte: DifficulteSauvegarde): number {
  return Object.hasOwn(s.progression.etoiles, cle(numero)) ? (s.progression.etoiles[cle(numero)]?.[difficulte] ?? 0) : 0;
}

/** Meilleur résultat d'un niveau, toutes difficultés confondues (0 si jamais réussi). */
export function meilleuresEtoiles(s: Sauvegarde, numero: number): number {
  return Math.max(0, ...DIFFICULTES_SAUVEGARDE.map((d) => etoilesDe(s, numero, d)));
}

export function niveauReussi(s: Sauvegarde, numero: number): boolean {
  return meilleuresEtoiles(s, numero) > 0;
}

/** La campagne est terminée quand le boss de la région 10 (niveau 100, le Soleil Blême) a été battu. */
export function campagneTerminee(s: Sauvegarde): boolean {
  return niveauReussi(s, NIVEAU_FIN_CAMPAGNE);
}

/** Total des étoiles gagnées (meilleur résultat par niveau, toutes difficultés confondues) : 300 au plus. */
export function totalEtoiles(s: Sauvegarde): number {
  let total = 0;
  for (let n = 1; n <= NOMBRE_NIVEAUX; n++) total += meilleuresEtoiles(s, n);
  return total;
}

/**
 * Enregistre la victoire d'un niveau : garde le meilleur résultat par niveau et par difficulté, et débloque le
 * niveau suivant. Une victoire invalide (niveau inconnu ou verrouillé, étoiles hors de 1 à 3, difficulté
 * inconnue) est ignorée : la sauvegarde rendue est alors la même.
 */
export function enregistrerVictoire(s: Sauvegarde, numero: number, difficulte: DifficulteSauvegarde, etoiles: number): Sauvegarde {
  if (!niveauDebloque(s, numero) || !estEntierEntre(etoiles, 1, 3) || !DIFFICULTES_SAUVEGARDE.includes(difficulte)) return s;
  const anciennes: EtoilesNiveau = Object.hasOwn(s.progression.etoiles, cle(numero)) ? { ...s.progression.etoiles[cle(numero)] } : {};
  anciennes[difficulte] = Math.max(anciennes[difficulte] ?? 0, etoiles) as Etoiles;
  const nouvelles = { ...s.progression.etoiles };
  Object.defineProperty(nouvelles, cle(numero), { value: anciennes, enumerable: true, writable: true, configurable: true });
  const niveauMax = Math.max(s.progression.niveauMax, Math.min(numero + 1, NOMBRE_NIVEAUX));
  return {
    ...s,
    progression: { niveauMax, etoiles: nouvelles },
    // Battre le boss d'une région (niveau 10 r) ouvre la suivante : `niveauMax` passe alors au-delà de 10 r.
    meta: { ...s.meta, regionMax: regionOuverte(niveauMax) },
  };
}

/** Change des réglages (les champs absents restent inchangés). Une valeur hors bornes est ignorée. */
export function changerReglages(s: Sauvegarde, changements: Partial<Reglages>): Sauvegarde {
  const reglages = { ...s.reglages };
  if (changements.son !== undefined && estEntierEntre(changements.son, 0, 100)) reglages.son = changements.son;
  if (changements.musique !== undefined && estEntierEntre(changements.musique, 0, 100)) reglages.musique = changements.musique;
  if (changements.vitesse === 1 || changements.vitesse === 2) reglages.vitesse = changements.vitesse;
  return { ...s, reglages };
}

/**
 * Réunit la progression de `a` et celle de `b` : niveau débloqué le plus haut, meilleures étoiles par niveau et par
 * difficulté. Les réglages et la partie en cours sont ceux de `a`. Rend `a` lui-même si `b` n'apporte rien. Sert
 * quand deux onglets, ou une lecture qui avait échoué, ont chacun une part de la progression : aucune ne doit
 * effacer l'autre.
 */
export function fusionnerProgressions(a: Sauvegarde, b: Sauvegarde): Sauvegarde {
  let change = b.progression.niveauMax > a.progression.niveauMax;
  const etoiles = { ...a.progression.etoiles };
  for (const numero of Object.keys(b.progression.etoiles)) {
    const autres = b.progression.etoiles[numero];
    if (!autres) continue;
    const miennes = Object.hasOwn(etoiles, numero) ? etoiles[numero] : undefined;
    const reunies: EtoilesNiveau = { ...miennes };
    for (const difficulte of DIFFICULTES_SAUVEGARDE) {
      const avant = miennes?.[difficulte] ?? 0;
      const apres = autres[difficulte] ?? 0;
      if (apres > avant) {
        reunies[difficulte] = apres as Etoiles;
        change = true;
      }
    }
    Object.defineProperty(etoiles, numero, { value: reunies, enumerable: true, writable: true, configurable: true });
  }
  // Les défis réussis de `b` s'ajoutent à ceux de `a` : un défi réussi ne se perd pas.
  const defis = { ...a.meta.defis };
  for (const numero of Object.keys(b.meta.defis)) {
    const miens = Object.hasOwn(defis, numero) ? defis[numero] : undefined;
    const autres = b.meta.defis[numero];
    if (!autres) continue;
    const reunis: DefisNiveau = { ...miens };
    for (const defi of IDS_DEFIS) {
      if (autres[defi] === true && miens?.[defi] !== true) {
        reunis[defi] = true;
        change = true;
      }
    }
    Object.defineProperty(defis, numero, { value: reunis, enumerable: true, writable: true, configurable: true });
  }
  // Les records de l'infini : le meilleur de chaque carte. Les paliers payés restent ceux de `a` (leurs arêtes et leurs
  // braises sont dans les monnaies de `a`, que la fusion ne touche pas) : un palier de `b` que `a` n'a pas payé le sera
  // à la prochaine partie qui l'atteint, sans que `a` ait jamais payé deux fois.
  const records = { ...a.meta.infini.records };
  for (const carte of Object.keys(b.meta.infini.records)) {
    const autre = b.meta.infini.records[carte] ?? 0;
    const mien = Object.hasOwn(records, carte) ? (records[carte] ?? 0) : 0;
    if (autre > mien) {
      Object.defineProperty(records, carte, { value: autre, enumerable: true, writable: true, configurable: true });
      change = true;
    }
  }
  // Les inscriptions trouvées de `b` s'ajoutent à celles de `a` : une inscription trouvée ne se perd pas.
  const inscriptions = reunirInscriptions(a.meta.inscriptions, b.meta.inscriptions);
  if (inscriptions.length > a.meta.inscriptions.length) change = true;
  // Les ennemis rencontrés de `b` s'ajoutent à ceux de `a` (l'option de `a` reste) : une rencontre ne se perd pas.
  const rencontres = reunirRencontres(a.meta.bestiaire.rencontres, b.meta.bestiaire.rencontres);
  if (rencontres.length > a.meta.bestiaire.rencontres.length) change = true;
  if (!change) return a;
  const niveauMax = Math.max(a.progression.niveauMax, b.progression.niveauMax);
  return { ...a, progression: { niveauMax, etoiles }, meta: { ...a.meta, regionMax: regionOuverte(niveauMax), defis, infini: { ...a.meta.infini, records }, inscriptions, bestiaire: { ...a.meta.bestiaire, rencontres } } };
}
