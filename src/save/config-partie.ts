// Ce que la progression fournit au lancement d'une partie : le dieu, le héros et son niveau, ses compétences, les rangs
// de l'arbre, les objets emportés, le défi joué et les bonus de la collection équipée. Tout est figé dans la config au
// lancement pour que la partie reste rejouable à l'identique. Fonction pure : rend la config ou la raison pour laquelle
// le lancement est refusé.
import { EMPLACEMENTS_OBJETS, estIdDefi, estIdDieu, estIdHeros, estIdObjet, HEROS_PAR_DIEU, type IdBranche, type IdDefi, type IdDieu, type IdHeros, type IdObjet } from '../data/meta';
import type { BonusCollection, DefiPartie } from '../engine';
import { bonusDeCollection } from '../meta/bonus';
import { definitionDuHeros, niveauHerosDepuisXp, pointsDeCompetence, type DefsMeta } from './definitions';
import { DIFFICULTES_SAUVEGARDE, NOMBRE_NIVEAUX, type Sauvegarde } from './format';
import { meilleuresEtoiles } from './progression';
import { estEntierEntre } from './validation';

/**
 * Config d'une partie telle que la méta-progression la compose. Ce sont les champs de `ConfigPartie` côté moteur
 * (graine, difficulté, dieu, niveau du héros, version des données) plus ceux du jalon 2, puis `defi` et `bonus` du jalon 3,
 * dont les types sont ceux du moteur (`DefiPartie`, `BonusCollection` de src/engine) : la config ici composée se copie
 * champ par champ dans une `ConfigPartie` (voir `configDuChoix`, src/ui/lancement.ts).
 */
export interface ConfigMeta {
  readonly graine: number;
  readonly difficulte: string;
  readonly dieu: IdDieu;
  readonly heros: IdHeros;
  readonly niveauHeros: number;
  /** Rang (1 à 3) de chaque compétence où le héros a placé un point. */
  readonly competencesHeros: Readonly<Record<string, number>>;
  /** Rang (0 à 5) de chaque branche de l'arbre. */
  readonly ameliorations: Readonly<Record<IdBranche, number>>;
  /** Objets emportés, un par emplacement (3 au plus). Aucun en défi. */
  readonly objets: readonly IdObjet[];
  readonly versionDonnees: number;
  /** Le défi joué, ou null pour une partie ordinaire. */
  readonly defi: DefiPartie | null;
  /** Bonus de la collection équipée, en fractions ; vide en défi Fer. */
  readonly bonus: BonusCollection;
}

export interface OptionsConfig {
  readonly dieu: string;
  readonly heros: string;
  /** Objets emportés, un par emplacement ; un même objet peut en occuper plusieurs. */
  readonly objetsEquipes: readonly string[];
  readonly difficulte: string;
  readonly graine: number;
  readonly versionDonnees: number;
  /** Compétences des héros et seuils d'expérience (de `src/data/heros.ts`). */
  readonly defsHeros: DefsMeta;
}

/** Les options d'une partie qui peut être un défi : il faut dire quel niveau on joue pour savoir s'il en ouvre un. */
export interface OptionsConfigDefi extends OptionsConfig {
  /** Numéro du niveau de campagne joué (1 à 150). */
  readonly niveau: number;
  /** « heroique », « fer », ou null pour une partie ordinaire. Un défi se joue en Matou, sans objet : `difficulte` et `objetsEquipes` sont alors ignorés. */
  readonly defi: string | null;
}

export type RaisonConfig =
  | 'dieu_inconnu'
  | 'heros_inconnu'
  | 'heros_pas_du_dieu'
  | 'heros_non_possede'
  | 'difficulte_inconnue'
  | 'trop_d_objets'
  | 'objet_inconnu'
  | 'objet_hors_stock'
  | 'competences_incoherentes';

/**
 * Raisons propres aux défis, à part de `RaisonConfig` pour que l'interface existante (qui traduit chaque raison) n'ait pas
 * à changer tant qu'elle ne lance pas de défi : `defi_verrouille` = le niveau n'a pas 3 étoiles (ou n'existe pas).
 */
export type RaisonDefi = 'defi_inconnu' | 'defi_verrouille';

export type ResultatConfig =
  | { readonly ok: true; readonly config: ConfigMeta }
  | { readonly ok: false; readonly raison: RaisonConfig };

export type ResultatConfigDefi =
  | { readonly ok: true; readonly config: ConfigMeta }
  | { readonly ok: false; readonly raison: RaisonConfig | RaisonDefi };

/** Le défi qu'on peut jouer sur ce niveau : connu, et le niveau a ses 3 étoiles (toutes difficultés confondues). */
function verifierDefi(s: Sauvegarde, niveau: number, defi: string): IdDefi | RaisonDefi {
  if (!estIdDefi(defi)) return 'defi_inconnu';
  if (!estEntierEntre(niveau, 1, NOMBRE_NIVEAUX) || meilleuresEtoiles(s, niveau) < 3) return 'defi_verrouille';
  return defi;
}

/**
 * Compose la config d'une partie d'après la progression. Refuse un dieu ou un héros inconnu, un héros qui n'est pas
 * celui du dieu ou qu'on ne possède pas, un objet inconnu ou absent du stock (autant d'exemplaires que
 * d'emplacements), et des compétences que le héros ne peut pas avoir (inconnues, rang ou niveau requis dépassés, plus
 * de points que de niveaux : on lui demande de redistribuer ses points). Ne modifie rien.
 *
 * Avec `niveau` et `defi`, la partie peut être un défi : refusé tant que le niveau n'a pas ses 3 étoiles ; la partie se joue
 * alors en Matou, sans objet emporté (le stock n'est pas regardé), et les bonus de la collection sont vides en Fer.
 */
export function configDepuisSauvegarde(s: Sauvegarde, options: OptionsConfigDefi): ResultatConfigDefi;
export function configDepuisSauvegarde(s: Sauvegarde, options: OptionsConfig): ResultatConfig;
export function configDepuisSauvegarde(s: Sauvegarde, options: OptionsConfig & Partial<Pick<OptionsConfigDefi, 'niveau' | 'defi'>>): ResultatConfigDefi {
  const { dieu, heros, objetsEquipes, defsHeros } = options;
  if (!estIdDieu(dieu)) return { ok: false, raison: 'dieu_inconnu' };
  if (!estIdHeros(heros)) return { ok: false, raison: 'heros_inconnu' };
  if (!(HEROS_PAR_DIEU[dieu] as readonly string[]).includes(heros)) return { ok: false, raison: 'heros_pas_du_dieu' };
  const progression = Object.hasOwn(s.meta.heros, heros) ? s.meta.heros[heros] : undefined;
  if (!progression) return { ok: false, raison: 'heros_non_possede' };

  let defi: IdDefi | null = null;
  if (options.defi !== undefined && options.defi !== null) {
    const verifie = verifierDefi(s, options.niveau ?? 0, options.defi);
    if (verifie === 'defi_inconnu' || verifie === 'defi_verrouille') return { ok: false, raison: verifie };
    defi = verifie;
  }
  // Un défi se joue avec les règles de Matou et sans objet consommable : ni la difficulté ni les objets demandés ne comptent.
  const difficulte = defi === null ? options.difficulte : 'matou';
  if (!DIFFICULTES_SAUVEGARDE.some((d) => d === difficulte)) return { ok: false, raison: 'difficulte_inconnue' };

  const objets: IdObjet[] = [];
  if (defi === null) {
    if (!Array.isArray(objetsEquipes)) return { ok: false, raison: 'objet_inconnu' };
    if (objetsEquipes.length > EMPLACEMENTS_OBJETS) return { ok: false, raison: 'trop_d_objets' };
    for (const objet of objetsEquipes) {
      if (!estIdObjet(objet)) return { ok: false, raison: 'objet_inconnu' };
      objets.push(objet);
    }
    for (const objet of objets) {
      if (objets.filter((o) => o === objet).length > s.meta.objets[objet]) return { ok: false, raison: 'objet_hors_stock' };
    }
  }

  const definition = definitionDuHeros(defsHeros, heros);
  if (!definition) return { ok: false, raison: 'heros_inconnu' };
  const niveauHeros = niveauHerosDepuisXp(progression.xp, defsHeros.seuilsXp);
  let places = 0;
  for (const [id, rang] of Object.entries(progression.competences)) {
    const competence = definition.competences.find((c) => c.id === id);
    if (!competence || rang > competence.rangMax || niveauHeros < competence.niveauRequis) return { ok: false, raison: 'competences_incoherentes' };
    places += rang;
  }
  if (places > pointsDeCompetence(niveauHeros)) return { ok: false, raison: 'competences_incoherentes' };

  return {
    ok: true,
    config: {
      graine: options.graine,
      difficulte,
      dieu,
      heros,
      niveauHeros,
      competencesHeros: { ...progression.competences },
      ameliorations: { ...s.meta.arbre },
      objets,
      versionDonnees: options.versionDonnees,
      defi,
      bonus: bonusDeCollection(s.meta.collection, heros, defi),
    },
  };
}
