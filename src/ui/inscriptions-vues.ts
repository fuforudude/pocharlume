// Ce que le recueil des inscriptions montre, d'après la sauvegarde : une ligne par carte (31), trouvée (texte complet) ou non (« ??? »
// et le nom de la région), et le compteur. Lectures pures : aucun DOM, aucune écriture.
import { CARTES } from '../data/niveaux/cartes-toutes';
import { cleInscription, IDS_INSCRIPTIONS, type IdInscription } from '../data/niveaux/statues';
import { t, tCle } from '../i18n';
import type { Sauvegarde } from '../save';

export interface LigneInscription {
  readonly id: IdInscription;
  readonly trouvee: boolean;
  /** Nom de la région de la carte (« Le Village Affamé »). */
  readonly region: string;
  /** Nom de la carte (« Les Chaumes ») : donné seulement une fois l'inscription trouvée. */
  readonly carte: string | null;
  /** Le texte complet de l'inscription : donné seulement une fois trouvée. */
  readonly texte: string | null;
}

export interface VueInscriptions {
  readonly trouvees: number;
  readonly total: number;
  /** « 3 / 31 ». */
  readonly compteur: string;
  /** « 3 inscriptions trouvées sur 31 », pour les lecteurs d'écran. */
  readonly libelleCompteur: string;
  /** Aucune inscription trouvée : le recueil le dit. */
  readonly vide: boolean;
  /** Les 31 lignes, dans l'ordre de la campagne. */
  readonly lignes: readonly LigneInscription[];
}

export function vueInscriptions(s: Sauvegarde): VueInscriptions {
  const trouvees = s.meta.inscriptions;
  const total = IDS_INSCRIPTIONS.length;
  const lignes = IDS_INSCRIPTIONS.map((id): LigneInscription => {
    const trouvee = trouvees.includes(id);
    return {
      id,
      trouvee,
      region: tCle(`region.${String(CARTES[id].region)}`),
      carte: trouvee ? tCle(`carte.nom.${id}`) : null,
      texte: trouvee ? tCle(cleInscription(id)) : null,
    };
  });
  return {
    trouvees: trouvees.length,
    total,
    compteur: t('inscriptions.compteur', { n: trouvees.length, total }),
    libelleCompteur: t('inscriptions.compteur_libelle', { n: trouvees.length, total }),
    vide: trouvees.length === 0,
    lignes,
  };
}
