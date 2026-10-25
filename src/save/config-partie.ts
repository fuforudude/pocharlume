// Ce que la progression fournit au lancement d'une partie : le dieu, le héros et son niveau, ses compétences, les rangs
// de l'arbre, les objets emportés. Tout est figé dans la config au lancement pour que la partie reste rejouable à
// l'identique. Fonction pure : rend la config ou la raison pour laquelle le lancement est refusé.
import { EMPLACEMENTS_OBJETS, estIdDieu, estIdHeros, estIdObjet, HEROS_PAR_DIEU, type IdBranche, type IdDieu, type IdHeros, type IdObjet } from '../data/meta';
import { definitionDuHeros, niveauHerosDepuisXp, pointsDeCompetence, type DefsMeta } from './definitions';
import { DIFFICULTES_SAUVEGARDE, type Sauvegarde } from './format';

/**
 * Config d'une partie telle que la méta-progression la compose. Ce sont les champs de `ConfigPartie` côté moteur
 * (graine, difficulté, dieu, niveau du héros, version des données) plus ceux du jalon 2.
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
  /** Objets emportés, un par emplacement (3 au plus). */
  readonly objets: readonly IdObjet[];
  readonly versionDonnees: number;
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

export type ResultatConfig =
  | { readonly ok: true; readonly config: ConfigMeta }
  | { readonly ok: false; readonly raison: RaisonConfig };

/**
 * Compose la config d'une partie d'après la progression. Refuse un dieu ou un héros inconnu, un héros qui n'est pas
 * celui du dieu ou qu'on ne possède pas, un objet inconnu ou absent du stock (autant d'exemplaires que
 * d'emplacements), et des compétences que le héros ne peut pas avoir (inconnues, rang ou niveau requis dépassés, plus
 * de points que de niveaux : on lui demande de redistribuer ses points). Ne modifie rien.
 */
export function configDepuisSauvegarde(s: Sauvegarde, options: OptionsConfig): ResultatConfig {
  const { dieu, heros, objetsEquipes, difficulte, defsHeros } = options;
  if (!estIdDieu(dieu)) return { ok: false, raison: 'dieu_inconnu' };
  if (!estIdHeros(heros)) return { ok: false, raison: 'heros_inconnu' };
  if (!(HEROS_PAR_DIEU[dieu] as readonly string[]).includes(heros)) return { ok: false, raison: 'heros_pas_du_dieu' };
  const progression = Object.hasOwn(s.meta.heros, heros) ? s.meta.heros[heros] : undefined;
  if (!progression) return { ok: false, raison: 'heros_non_possede' };
  if (!DIFFICULTES_SAUVEGARDE.some((d) => d === difficulte)) return { ok: false, raison: 'difficulte_inconnue' };

  if (!Array.isArray(objetsEquipes)) return { ok: false, raison: 'objet_inconnu' };
  if (objetsEquipes.length > EMPLACEMENTS_OBJETS) return { ok: false, raison: 'trop_d_objets' };
  const objets: IdObjet[] = [];
  for (const objet of objetsEquipes) {
    if (!estIdObjet(objet)) return { ok: false, raison: 'objet_inconnu' };
    objets.push(objet);
  }
  for (const objet of objets) {
    if (objets.filter((o) => o === objet).length > s.meta.objets[objet]) return { ok: false, raison: 'objet_hors_stock' };
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
    },
  };
}
