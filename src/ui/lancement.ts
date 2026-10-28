// Compose la config d'une partie d'après la sauvegarde et le choix fait sur la fiche de niveau (dieu, héros, objets).
// Tout ce qui entre dans la partie est figé ici, une fois : la partie reste rejouable à l'identique.
import { DEFS_META } from '../data/heros';
import { VERSION_DONNEES } from '../data/version';
import type { ConfigPartie } from '../engine';
import { estIdDieu, estIdHeros, estIdObjet, type IdObjet } from '../data/meta';
import { t } from '../i18n';
import { configDepuisSauvegarde, type ChoixPartie, type RaisonConfig, type RaisonEquipement, type ResultatTransaction, type Sauvegarde } from '../save';
import { choixJouable } from './meta-vues';
import { texteRefusMeta } from './raisons-meta';

export type ResultatLancement =
  | { readonly ok: true; readonly config: ConfigPartie }
  | { readonly ok: false; readonly raison: RaisonConfig };

/** La config du moteur pour ce choix, ou la raison pour laquelle le lancement est refusé (rien n'est modifié). */
export function configDuChoix(s: Sauvegarde, choix: ChoixPartie, difficulte: string, graine: number): ResultatLancement {
  const r = configDepuisSauvegarde(s, {
    dieu: choix.dieu,
    heros: choix.heros,
    objetsEquipes: choix.objets,
    difficulte,
    graine,
    versionDonnees: VERSION_DONNEES,
    defsHeros: DEFS_META,
  });
  if (!r.ok) return r;
  const c = r.config;
  return {
    ok: true,
    config: {
      graine: c.graine,
      difficulte: c.difficulte,
      dieu: c.dieu,
      heros: c.heros,
      niveauHeros: c.niveauHeros,
      competencesHeros: { ...c.competencesHeros },
      ameliorations: { ...c.ameliorations },
      objets: [...c.objets],
      versionDonnees: c.versionDonnees,
    },
  };
}

/** Graine d'une nouvelle partie, tirée de l'horloge (hors moteur : c'est ici qu'on choisit la graine). */
export function nouvelleGraine(): number {
  return Date.now() & 0x7fffffff;
}

/** Le choix (dieu, héros, objets) que dit une config de partie, corrigé pour la sauvegarde d'aujourd'hui (stock, héros possédés). */
export function choixDeLaConfig(s: Sauvegarde, config: ConfigPartie): ChoixPartie {
  const memorise = s.meta.choix;
  const objets: IdObjet[] = [];
  for (const objet of config.objets) if (estIdObjet(objet)) objets.push(objet);
  return choixJouable(s, {
    dieu: estIdDieu(config.dieu) ? config.dieu : memorise.dieu,
    heros: estIdHeros(config.heros) ? config.heros : memorise.heros,
    objets,
  });
}

/**
 * La config d'une nouvelle tentative (« Rejouer ») : même dieu, même héros, mêmes objets tant que le stock les couvre
 * (un objet consommé par la partie précédente n'est plus emporté), niveau et compétences du héros d'aujourd'hui, nouvelle
 * graine. Si la sauvegarde ne permet plus ce choix, on garde la config précédente avec la nouvelle graine.
 */
export function configDeRelance(s: Sauvegarde, precedente: ConfigPartie, graine: number): ConfigPartie {
  const r = configDuChoix(s, choixDeLaConfig(s, precedente), precedente.difficulte, graine);
  return r.ok ? r.config : { ...precedente, graine };
}

/** Ce que le lancement demande à la session : le stock pour composer la config, le débit des objets pour la lancer. */
export interface SessionLancement {
  readonly sauvegarde: Sauvegarde;
  lancerPartie(objets: readonly string[]): Promise<ResultatTransaction<RaisonEquipement>>;
}

export type ResultatDebit = { readonly ok: true } | { readonly ok: false; readonly refus: string };

/**
 * Débite les objets de la config du stock, sous verrou, au moment de lancer une nouvelle partie. Refuse (avec la phrase
 * à dire au joueur) si le stock ne couvre plus le choix, ou si l'écriture échoue : la partie ne doit alors pas démarrer.
 */
export async function debiterAuLancement(session: SessionLancement, config: ConfigPartie): Promise<ResultatDebit> {
  try {
    const r = await session.lancerPartie(config.objets);
    return r.ok ? { ok: true } : { ok: false, refus: t('fiche.lancement_refuse', { raison: texteRefusMeta(r.raison) }) };
  } catch (erreur) {
    console.error(erreur);
    return { ok: false, refus: t('erreur.sauvegarde') };
  }
}

/**
 * La config de « Rejouer » prête à démarrer : composée d'après la sauvegarde d'aujourd'hui (`configDeRelance`), puis
 * débitée du stock comme n'importe quel lancement. Le repli de `configDeRelance` (config précédente gardée telle quelle)
 * n'échappe pas au contrôle : si le stock ne couvre plus ses objets, le lancement est refusé.
 */
export async function relancerAvecDebit(
  session: SessionLancement,
  precedente: ConfigPartie,
  graine: number,
): Promise<{ readonly ok: true; readonly config: ConfigPartie } | { readonly ok: false; readonly refus: string }> {
  const config = configDeRelance(session.sauvegarde, precedente, graine);
  const debit = await debiterAuLancement(session, config);
  return debit.ok ? { ok: true, config } : debit;
}
