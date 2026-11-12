// Écran des caisses (depuis la boutique) : les deux caisses (skins, familiers) payées en braises, leurs chances affichées
// (les mêmes que celles du tirage, lues dans src/data/meta.ts), la garantie restante, et l'ouverture avec une révélation
// courte. Le tirage est une transaction de la session (le hasard et les règles sont dans src/meta/ et src/save/) : cet écran
// présente la sauvegarde, envoie le geste, et dit le résultat ou le refus. Un doublon donne des éclats, affichés.
// La caisse « Temps modernes » du DLC s'y ajoute, payée en badges (solde dans la barre du haut), sur le même modèle.
import { jouerInterface } from '../audio';
import { CATALOGUE } from '../data/collection';
import { defSkinModerne } from '../data/recompenses-moderne';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import type { OuvertureCaisse, OuvertureCaisseModerne, RaisonCaisse, RaisonCaisseModerne, ResultatTransactionAvecDetail, Sauvegarde } from '../save';
import { vueCaisses, spriteDeCollection } from './collection-vues';
import { bouton, el, image } from './dom';
import { creerEcranMeta, jetonBadge, pastilles, redessiner, type EcranMeta } from './ecran-meta';
import { spriteDuSkinModerne, vueCaisseModerne } from './recompenses-moderne-vues';
import { texteRefusMeta } from './raisons-meta';

/** Ce que l'écran demande à la session (la session en entier y répond). */
export interface SessionCaisses {
  readonly sauvegarde: Sauvegarde;
  ouvrirCaisse(type: string): Promise<ResultatTransactionAvecDetail<OuvertureCaisse, RaisonCaisse | 'aleatoire_indisponible'>>;
  ouvrirCaisseModerne(): Promise<ResultatTransactionAvecDetail<OuvertureCaisseModerne, RaisonCaisseModerne | 'aleatoire_indisponible'>>;
}

/** La caisse du DLC dans cet écran (clé des boutons, `data-type` de sa carte). */
const MODERNE = 'moderne';

/** Ce que la révélation montre d'un tirage, quelle que soit la caisse. */
interface Revele {
  readonly nom: string;
  readonly icone: string;
  readonly rarete: OuvertureCaisse['rarete'];
  readonly nouveau: boolean;
  readonly eclats: number;
  readonly garantie: boolean;
}

export interface OptionsCaisses {
  readonly atlas: AtlasRendu;
  readonly session: SessionCaisses;
  readonly surFermer: () => void;
  /** « Collection » : l'appelant remplace cet écran par celui de la collection. */
  readonly surCollection: () => void;
  /** Charge l'atlas du DLC (images des skins « Temps modernes ») ; l'écran se redessine quand il est là. Absent : pas d'images du DLC. */
  readonly chargerAtlasModerne?: () => Promise<unknown>;
}

export function afficherCaisses(parent: HTMLElement, options: OptionsCaisses): EcranMeta {
  const { atlas, session } = options;
  /** Une ouverture est en cours (ou sa révélation affichée) : un second geste n'ouvre rien de plus. */
  let occupe = false;
  // L'atlas du DLC se charge une fois, dès l'ouverture de l'écran : la révélation d'une caisse du DLC l'attend avant de lire l'icône.
  const atlasModerne: Promise<void> = (options.chargerAtlasModerne?.() ?? Promise.resolve()).then(() => undefined, (erreur: unknown) => { console.error(erreur); });

  const ecran = creerEcranMeta(parent, {
    classe: 'ecran-caisses',
    titre: t('caisses.titre'),
    fermer: t('caisses.fermer'),
    atlas,
    sauvegarde: session.sauvegarde,
    monnaies: ['braises', 'eclats', 'badges'],
    surFermer: options.surFermer,
  });

  /** La révélation de ce que la caisse a donné ; « Continuer » (ou Échap) la ferme et rend le focus à la caisse ouverte. */
  function reveler(tirage: Revele, type: string): void {
    const { nom } = tirage;
    const fin = new AbortController();
    const carte = el('div', `revelation rarete-${tirage.rarete}`);
    carte.setAttribute('role', 'dialog');
    carte.setAttribute('aria-modal', 'true');
    carte.setAttribute('aria-label', nom);

    // Une courte ouverture (la caisse qui tremble, en CSS), puis ce qu'elle contenait.
    const ouverture = el('div', 'ouverture');
    ouverture.setAttribute('aria-hidden', 'true');
    ouverture.append(image(atlas.iconeUrl(`icone-caisse-${type === MODERNE ? 'skins' : type}`, 4), 'icone'));
    const resultat = el('div', 'resultat');
    const objet = el('div', 'objet-revele');
    objet.append(image(tirage.icone, 'icone'), image(atlas.iconeUrl(`icone-rarete-${tirage.rarete}`, 2), 'badge'));
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

  /** Le tirage d'une caisse, ou son refus, ramené à ce que la révélation montre. */
  const tirer = async (type: string): Promise<{ readonly ok: true; readonly revele: Revele } | { readonly ok: false; readonly raison: Parameters<typeof texteRefusMeta>[0] }> => {
    if (type === MODERNE) {
      const r = await session.ouvrirCaisseModerne();
      if (!r.ok) return r;
      await atlasModerne;
      const def = defSkinModerne(r.detail.id);
      return { ok: true, revele: { ...r.detail, nom: def ? tCle(def.nom) : r.detail.id, icone: def ? atlas.iconeUrl(spriteDuSkinModerne(def), 3) : '' } };
    }
    const r = await session.ouvrirCaisse(type);
    if (!r.ok) return r;
    return { ok: true, revele: { ...r.detail, nom: tCle(CATALOGUE[r.detail.id].nom), icone: atlas.iconeUrl(spriteDeCollection(r.detail.id), 4) } };
  };

  const ouvrirUneCaisse = async (type: string): Promise<void> => {
    if (occupe) return;
    occupe = true;
    let revelation = false;
    try {
      const r = await tirer(type);
      dessiner();
      if (r.ok) {
        jouerInterface('achat');
        ecran.dire('');
        reveler(r.revele, type);
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
    grille.append(carteModerne());
    return [grille];
  }

  /** La caisse « Temps modernes » : payée en badges, ses chances, sa garantie, les skins du DLC déjà obtenus. */
  function carteModerne(): HTMLElement {
    const vue = vueCaisseModerne(session.sauvegarde);
    const carte = el('div', 'caisse caisse-moderne');
    carte.dataset.type = MODERNE;
    const tete = el('div', 'caisse-tete');
    // L'image du DLC (la tour divine de Charlie) quand son atlas est chargé ; sinon celle de la caisse de skins.
    tete.append(image(atlas.iconeUrl('moderne-charlie', 2) || atlas.iconeUrl('icone-caisse-skins', 3), 'icone'));
    const noms = el('div', 'noms');
    noms.append(
      el('span', 'nom', t('caisses.caisse_moderne')),
      el('span', 'desc desc-longue', t('caisses.desc_moderne')),
      el('span', 'desc', `${t('collection.possedes', { n: vue.possedes, m: vue.total })} · ${t('caisses.apparence_seule')}`),
    );
    tete.append(noms);

    const chances = el('div', 'chances');
    for (const c of vue.chances) chances.append(el('span', `chance rarete-${c.rarete}`, t('caisses.chance', { rarete: t(`rarete.${c.rarete}`), n: c.pourcent })));

    const garantie = el('div', 'garantie');
    garantie.append(
      pastilles(vue.compteur, 9),
      el('span', 'garantie-texte', vue.avantGarantie === 1 ? t('caisses.garantie_une') : t('caisses.garantie', { n: vue.avantGarantie })),
    );

    const libelle = t('caisses.ouvrir', { nom: t('caisses.caisse_moderne') });
    const ouvrir = bouton('bouton acheter ouvrir', libelle, () => { void ouvrirUneCaisse(MODERNE); });
    ouvrir.dataset.cle = `ouvrir:${MODERNE}`;
    ouvrir.append(el('span', '', t('caisses.prix_badges', { n: vue.prix })), jetonBadge());
    ouvrir.classList.toggle('grise', !vue.peutPayer);

    // La note complète se lit aussi dans la bulle du bouton (survol à la souris).
    ouvrir.title = t('caisses.badges_gagnes');
    // Écran bas : la note longue disparaît, une ligne courte reste toujours visible (la bulle `title` ne s'affiche pas au toucher).
    carte.append(tete, chances, garantie, ouvrir, el('span', 'caisse-note', t('caisses.badges_gagnes')), el('span', 'caisse-note-courte', t('caisses.badges_gagnes_court')));
    return carte;
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
  // Les images du DLC arrivent avec son atlas (chargé une fois) : on redessine alors, si l'écran est encore là.
  void atlasModerne.then(() => { if (ecran.racine.isConnected) dessiner(); });
  return ecran;
}
