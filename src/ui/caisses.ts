// Écran des caisses (depuis la boutique) : les deux caisses (skins, familiers) payées en braises, leurs chances affichées
// (les mêmes que celles du tirage, lues dans src/data/meta.ts), la garantie restante, et l'ouverture avec une révélation
// courte. Le tirage est une transaction de la session (le hasard et les règles sont dans src/meta/ et src/save/) : cet écran
// présente la sauvegarde, envoie le geste, et dit le résultat ou le refus. Un doublon donne des éclats, affichés.
import { jouerInterface } from '../audio';
import { CATALOGUE } from '../data/collection';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import type { OuvertureCaisse, RaisonCaisse, ResultatTransactionAvecDetail, Sauvegarde } from '../save';
import { vueCaisses, spriteDeCollection } from './collection-vues';
import { bouton, el, image } from './dom';
import { creerEcranMeta, pastilles, redessiner, type EcranMeta } from './ecran-meta';
import { texteRefusMeta } from './raisons-meta';

/** Ce que l'écran demande à la session (la session en entier y répond). */
export interface SessionCaisses {
  readonly sauvegarde: Sauvegarde;
  ouvrirCaisse(type: string): Promise<ResultatTransactionAvecDetail<OuvertureCaisse, RaisonCaisse | 'aleatoire_indisponible'>>;
}

export interface OptionsCaisses {
  readonly atlas: AtlasRendu;
  readonly session: SessionCaisses;
  readonly surFermer: () => void;
  /** « Collection » : l'appelant remplace cet écran par celui de la collection. */
  readonly surCollection: () => void;
}

export function afficherCaisses(parent: HTMLElement, options: OptionsCaisses): EcranMeta {
  const { atlas, session } = options;
  /** Une ouverture est en cours (ou sa révélation affichée) : un second geste n'ouvre rien de plus. */
  let occupe = false;

  const ecran = creerEcranMeta(parent, {
    classe: 'ecran-caisses',
    titre: t('caisses.titre'),
    fermer: t('caisses.fermer'),
    atlas,
    sauvegarde: session.sauvegarde,
    monnaies: ['braises', 'eclats'],
    surFermer: options.surFermer,
  });

  /** La révélation de ce que la caisse a donné ; « Continuer » (ou Échap) la ferme et rend le focus à la caisse ouverte. */
  function reveler(tirage: OuvertureCaisse, type: string): void {
    const def = CATALOGUE[tirage.id];
    const nom = tCle(def.nom);
    const fin = new AbortController();
    const carte = el('div', `revelation rarete-${tirage.rarete}`);
    carte.setAttribute('role', 'dialog');
    carte.setAttribute('aria-modal', 'true');
    carte.setAttribute('aria-label', nom);

    // Une courte ouverture (la caisse qui tremble, en CSS), puis ce qu'elle contenait.
    const ouverture = el('div', 'ouverture');
    ouverture.setAttribute('aria-hidden', 'true');
    ouverture.append(image(atlas.iconeUrl(`icone-caisse-${type}`, 4), 'icone'));
    const resultat = el('div', 'resultat');
    const objet = el('div', 'objet-revele');
    objet.append(image(atlas.iconeUrl(spriteDeCollection(tirage.id), 4), 'icone'), image(atlas.iconeUrl(`icone-rarete-${tirage.rarete}`, 2), 'badge'));
    const lignes = el('div', 'lignes');
    lignes.append(el('span', 'nom-revele', nom), el('span', 'rarete', t(`rarete.${tirage.rarete}`)));
    lignes.append(el('span', 'statut', t(tirage.nouveau ? 'caisses.resultat_nouveau' : 'caisses.resultat_doublon', { nom })));
    if (!tirage.nouveau) {
      const eclats = el('span', 'eclats-gagnes');
      eclats.append(image(atlas.iconeUrl('icone-eclat', 2), 'petite'), el('span', '', t('caisses.resultat_eclats', { n: tirage.eclats })));
      lignes.append(eclats);
    }
    if (tirage.garantie) lignes.append(el('span', 'garantie-jouee', t('caisses.resultat_garantie')));
    resultat.append(objet, lignes);

    const fermer = (): void => {
      fin.abort();
      carte.remove();
      occupe = false;
      // Le focus revient au bouton de la caisse qu'on vient d'ouvrir.
      for (const b of ecran.corps.querySelectorAll<HTMLElement>('[data-cle]')) {
        if (b.dataset.cle === `ouvrir:${type}`) {
          b.focus({ preventScroll: true });
          break;
        }
      }
    };
    const continuer = bouton('bouton grand', t('caisses.continuer'), fermer, fin.signal);
    continuer.textContent = t('caisses.continuer');
    carte.append(ouverture, resultat, continuer);
    ecran.racine.append(carte);
    continuer.focus({ preventScroll: true });
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      fermer();
    }, { signal: fin.signal });
  }

  const ouvrirUneCaisse = async (type: string): Promise<void> => {
    if (occupe) return;
    occupe = true;
    let revelation = false;
    try {
      const r = await session.ouvrirCaisse(type);
      dessiner();
      if (r.ok) {
        jouerInterface('achat');
        ecran.dire('');
        reveler(r.detail, type);
        revelation = true;
      } else {
        jouerInterface('refus');
        ecran.dire(texteRefusMeta(r.raison), true);
      }
    } catch (erreur) {
      // La session lève si l'écriture échoue (verrou, stockage) : on le dit au lieu de laisser un rejet orphelin.
      console.error(erreur);
      dessiner();
      jouerInterface('refus');
      ecran.dire(t('erreur.sauvegarde'), true);
    } finally {
      // Pendant la révélation, `occupe` reste vrai : c'est « Continuer » qui le rend.
      if (!revelation) occupe = false;
    }
  };

  function corps(): HTMLElement[] {
    const grille = el('div', 'caisses');
    for (const vue of vueCaisses(session.sauvegarde)) {
      const carte = el('div', 'caisse');
      carte.dataset.type = vue.type;
      const tete = el('div', 'caisse-tete');
      tete.append(image(atlas.iconeUrl(`icone-caisse-${vue.type}`, 3), 'icone'));
      const noms = el('div', 'noms');
      noms.append(el('span', 'nom', t(`caisses.caisse_${vue.type}`)), el('span', 'desc', t(`caisses.desc_${vue.type}`)));
      tete.append(noms);

      const chances = el('div', 'chances');
      for (const c of vue.chances) {
        const chance = el('span', `chance rarete-${c.rarete}`, t('caisses.chance', { rarete: t(`rarete.${c.rarete}`), n: c.pourcent }));
        chances.append(chance);
      }

      const garantie = el('div', 'garantie');
      garantie.append(
        pastilles(vue.compteur, 9),
        el('span', 'garantie-texte', vue.avantGarantie === 1 ? t('caisses.garantie_une') : t('caisses.garantie', { n: vue.avantGarantie })),
      );

      const libelle = t('caisses.ouvrir', { nom: t(`caisses.caisse_${vue.type}`) });
      const ouvrir = bouton('bouton acheter ouvrir', libelle, () => { void ouvrirUneCaisse(vue.type); });
      ouvrir.dataset.cle = `ouvrir:${vue.type}`;
      ouvrir.append(el('span', '', t('caisses.prix', { n: vue.prix })), image(atlas.iconeUrl('icone-braise', 1), 'icone'));
      ouvrir.classList.toggle('grise', !vue.peutPayer);

      carte.append(tete, chances, garantie, ouvrir);
      grille.append(carte);
    }
    return [grille];
  }

  function dessiner(): void {
    ecran.majMonnaies(session.sauvegarde);
    redessiner(ecran.corps, corps);
  }

  // « Collection » : à côté de « Fermer », dans la barre du haut.
  const versCollection = bouton('bouton', t('caisses.collection'), options.surCollection);
  versCollection.textContent = t('caisses.collection');
  ecran.racine.querySelector('.meta-entete')?.insertBefore(versCollection, ecran.racine.querySelector('.meta-entete > button'));

  ecran.corps.classList.add('caisses-corps');
  dessiner();
  return ecran;
}
