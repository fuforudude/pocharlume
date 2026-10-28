// Écran de la collection (depuis la boutique ou les caisses) : tous les skins et familiers du catalogue, ceux qu'on a en
// couleur et les autres en silhouette, leur rareté, leur rang, leur bonus ; monter un rang, acheter un objet précis en
// éclats, équiper un skin (sur sa tour de base ou son héros) ou un familier (sur un héros recruté, un seul par héros). Un
// troisième onglet liste les porteurs avec le total de leur bonus et le plafond de +10 %. Les règles sont dans src/save/ et
// src/meta/ : l'écran présente la sauvegarde, envoie les gestes à la session et affiche ses refus.
import { jouerInterface } from '../audio';
import { CATALOGUE, type IdCollection } from '../data/collection';
import { HEROS } from '../data/heros';
import { PLAFOND_BONUS_POURCENT, RANG_MAX_COLLECTION, type IdHeros } from '../data/meta';
import { t, tCle } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import { portraitHeros } from '../render/habillage';
import type {
  RaisonAchatPrecis,
  RaisonEquipementCollection,
  RaisonRang,
  ResultatTransaction,
  Sauvegarde,
} from '../save';
import { formaterPourcent, spriteDeCollection, vueObjetsCollection, vuePorteurs, type VueObjetCollection, type VuePorteur } from './collection-vues';
import { bouton, el, image } from './dom';
import { creerEcranMeta, pastilles, redessiner, type EcranMeta } from './ecran-meta';
import { texteRefusMeta } from './raisons-meta';

/** Ce que l'écran demande à la session (la session en entier y répond). */
export interface SessionCollection {
  readonly sauvegarde: Sauvegarde;
  monterRang(objet: string): Promise<ResultatTransaction<RaisonRang | 'modifie_ailleurs'>>;
  acheterObjetPrecis(objet: string): Promise<ResultatTransaction<RaisonAchatPrecis>>;
  equiperSkin(cible: string, skin: string | null): Promise<ResultatTransaction<RaisonEquipementCollection>>;
  equiperFamilier(heros: string, familier: string | null): Promise<ResultatTransaction<RaisonEquipementCollection>>;
}

export type OngletCollection = 'skins' | 'familiers' | 'equipement';

export interface OptionsCollection {
  readonly atlas: AtlasRendu;
  readonly session: SessionCollection;
  readonly onglet?: OngletCollection;
  readonly surFermer: () => void;
  /** « Caisses » : l'appelant remplace cet écran par celui des caisses. */
  readonly surCaisses: () => void;
}

/** Nom affiché d'un porteur : la tour de base (`tir`) ou le héros (`suie`). */
function nomDuPorteur(id: string): string {
  return Object.hasOwn(HEROS, id) ? tCle(HEROS[id as IdHeros].nom) : t(`famille.${id as 'caserne' | 'tir' | 'magie' | 'artillerie'}`);
}

export function afficherCollection(parent: HTMLElement, options: OptionsCollection): EcranMeta {
  const { atlas, session } = options;
  let onglet: OngletCollection = options.onglet ?? 'skins';
  /** Le familier dont la liste de porteurs est ouverte. */
  let familierOuvert: IdCollection | null = null;
  let occupe = false;

  const ecran = creerEcranMeta(parent, {
    classe: 'ecran-collection',
    titre: t('collection.titre'),
    fermer: t('collection.fermer'),
    atlas,
    sauvegarde: session.sauvegarde,
    monnaies: ['braises', 'eclats'],
    surFermer: options.surFermer,
  });

  const nomDe = (id: IdCollection): string => tCle(CATALOGUE[id].nom);

  /** Passe un geste à la session, puis redessine ; le refus éventuel est dit. */
  const agir = async (
    geste: () => Promise<{ readonly ok: true } | { readonly ok: false; readonly raison: Parameters<typeof texteRefusMeta>[0] }>,
    succes: string,
    achat = false,
  ): Promise<void> => {
    if (occupe) return;
    occupe = true;
    try {
      const r = await geste();
      dessiner();
      if (!r.ok) jouerInterface('refus');
      else if (achat) jouerInterface('achat');
      ecran.dire(r.ok ? succes : texteRefusMeta(r.raison), !r.ok);
    } catch (erreur) {
      // La session lève si l'écriture échoue (verrou, stockage) : on le dit au lieu de laisser un rejet orphelin.
      console.error(erreur);
      dessiner();
      jouerInterface('refus');
      ecran.dire(t('erreur.sauvegarde'), true);
    } finally {
      occupe = false;
    }
  };

  // --- Onglets ---

  function onglets(): HTMLElement {
    const rangee = el('div', 'collection-onglets');
    rangee.setAttribute('role', 'tablist');
    for (const [id, cle] of [['skins', 'collection.onglet_skins'], ['familiers', 'collection.onglet_familiers'], ['equipement', 'collection.onglet_equipement']] as const) {
      const b = bouton('bouton onglet', t(cle), () => {
        if (id === onglet) return;
        onglet = id;
        familierOuvert = null;
        ecran.dire('');
        dessiner();
      });
      b.dataset.cle = `onglet:${id}`;
      b.textContent = t(cle);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(id === onglet));
      b.classList.toggle('actif', id === onglet);
      rangee.append(b);
    }
    if (onglet !== 'equipement') {
      const genre = onglet === 'skins' ? 'skin' : 'familier';
      const vues = vueObjetsCollection(session.sauvegarde, genre);
      rangee.append(el('span', 'collection-compte', t('collection.possedes', { n: vues.filter((v) => v.possede).length, m: vues.length })));
    }
    const caisses = bouton('bouton', t('collection.caisses'), options.surCaisses);
    caisses.textContent = t('collection.caisses');
    caisses.classList.add('vers-caisses');
    rangee.append(caisses);
    return rangee;
  }

  // --- Une carte d'objet ---

  function carteObjet(vue: VueObjetCollection): HTMLElement {
    const nom = nomDe(vue.id);
    const carte = el('div', `objet-collection rarete-${vue.rarete}`);
    carte.dataset.id = vue.id;
    carte.classList.toggle('silhouette', !vue.possede);
    carte.classList.toggle('equipe', vue.equipeSur.length > 0);

    const tete = el('div', 'tete');
    const icone = image(atlas.iconeUrl(spriteDeCollection(vue.id), 3), vue.possede ? 'icone' : 'icone silhouette');
    const noms = el('div', 'noms');
    const rarete = el('span', 'rarete');
    rarete.append(image(atlas.iconeUrl(`icone-rarete-${vue.rarete}`, 1), 'petite'), el('span', '', t(`rarete.${vue.rarete}`)));
    noms.append(el('span', 'nom', nom), rarete);
    tete.append(icone, noms);

    const details = el('div', 'details');
    const stat = t(`stat.${vue.stat as 'pv'}`);
    const pourcent = formaterPourcent(vue.bonusPourcent);
    if (vue.possede) {
      const rangs = el('div', 'rangs');
      rangs.append(pastilles(vue.rang, vue.rangMax), el('span', 'rang', vue.rang >= RANG_MAX_COLLECTION ? t('collection.rang_max') : t('collection.rang', { n: vue.rang, m: vue.rangMax })));
      details.append(rangs, el('span', 'bonus', t('collection.bonus_objet', { n: pourcent, stat })));
      if (vue.equipeSur.length > 0) details.append(el('span', 'equipe-sur', t('collection.equipe_sur', { noms: vue.equipeSur.map(nomDuPorteur).join(', ') })));
    } else {
      details.append(el('span', 'verrou', t('collection.verrouille')), el('span', 'bonus', t('collection.bonus_objet_pas_possede', { n: pourcent, stat })));
    }

    const actions = el('div', 'actions');
    if (!vue.possede && vue.prixAchat !== null) {
      const prix = vue.prixAchat;
      const acheter = bouton('bouton acheter', t('collection.acheter_libelle', { nom, c: prix }), () => {
        void agir(() => session.acheterObjetPrecis(vue.id), t('collection.achete', { nom }), true);
      });
      acheter.dataset.cle = `acheter:${vue.id}`;
      acheter.append(el('span', '', String(prix)), image(atlas.iconeUrl('icone-eclat', 1), 'icone'));
      acheter.classList.toggle('grise', !vue.peutAcheter);
      actions.append(acheter);
    }
    if (vue.possede && vue.genre === 'skin') {
      const cible = vue.porteurs[0] ?? '';
      const equipe = vue.equipeSur.length > 0;
      const b = bouton('bouton equiper', t(equipe ? 'collection.retirer_libelle' : 'collection.equiper_libelle', { nom }), () => {
        void agir(
          () => session.equiperSkin(cible, equipe ? null : vue.id),
          t(equipe ? 'collection.retire_ok' : 'collection.equipe_ok', { nom, porteur: nomDuPorteur(cible) }),
        );
      });
      b.dataset.cle = `equiper:${vue.id}`;
      b.textContent = t(equipe ? 'collection.retirer' : 'collection.equiper');
      actions.append(b);
    }
    if (vue.possede && vue.genre === 'familier') {
      const ouvert = familierOuvert === vue.id;
      const b = bouton('bouton equiper', t('collection.equiper_sur_libelle', { nom }), () => {
        familierOuvert = ouvert ? null : vue.id;
        dessiner();
      });
      b.dataset.cle = `porteurs:${vue.id}`;
      b.textContent = t('collection.equiper_sur');
      b.setAttribute('aria-expanded', String(ouvert));
      b.classList.toggle('actif', ouvert);
      actions.append(b);
    }
    if (vue.possede && vue.coutMonter !== null) {
      const cout = vue.coutMonter;
      const monter = bouton('bouton acheter', t('collection.monter_libelle', { nom, n: vue.rang + 1, c: cout }), () => {
        void agir(() => session.monterRang(vue.id), t('collection.monte', { nom, n: vue.rang + 1 }), true);
      });
      monter.dataset.cle = `monter:${vue.id}`;
      monter.append(el('span', '', t('collection.monter', { n: vue.rang + 1 })), el('span', 'cout', String(cout)), image(atlas.iconeUrl('icone-eclat', 1), 'icone'));
      monter.classList.toggle('grise', !vue.peutMonter);
      actions.append(monter);
    }

    carte.append(tete, details, actions);

    if (vue.genre === 'familier' && vue.possede && familierOuvert === vue.id) {
      const liste = el('div', 'porteurs-possibles');
      for (const heros of vue.porteurs) {
        const id = heros as IdHeros;
        const porte = vue.equipeSur.includes(heros);
        const nomHeros = tCle(HEROS[id].nom);
        const puce = bouton('bouton porteur-puce', t(porte ? 'collection.retirer_porteur_libelle' : 'collection.porteur_libelle', { objet: nom, porteur: nomHeros }), () => {
          void agir(
            () => session.equiperFamilier(heros, porte ? null : vue.id),
            t(porte ? 'collection.retire_ok' : 'collection.equipe_ok', { nom, porteur: nomHeros }),
          );
        });
        puce.dataset.cle = `porteur:${vue.id}:${heros}`;
        puce.classList.toggle('actif', porte);
        puce.append(image(atlas.iconeUrl(portraitHeros(heros), 2), 'portrait'));
        liste.append(puce);
      }
      carte.append(liste);
    }
    return carte;
  }

  function liste(genre: 'skin' | 'familier'): HTMLElement {
    const grille = el('div', 'collection-grille');
    for (const vue of vueObjetsCollection(session.sauvegarde, genre)) grille.append(carteObjet(vue));
    return grille;
  }

  // --- Les porteurs et le total de leur bonus ---

  function lignePorteur(p: VuePorteur): HTMLElement {
    const nom = nomDuPorteur(p.id);
    const ligne = el('div', 'porteur');
    ligne.dataset.id = p.id;
    ligne.classList.toggle('plafonne', p.plafonne);
    const entete = el('div', 'tete');
    entete.append(image(atlas.iconeUrl(p.genre === 'heros' ? portraitHeros(p.id) : `icone-${p.id}`, 2), 'icone'), el('span', 'nom', nom));

    const portes = el('div', 'portes');
    const emplacement = (classe: string, texte: string, cleRetrait: string | null, libelle: string): HTMLElement => {
      const e = el('span', `emplacement ${classe}`);
      e.append(el('span', 'texte', texte));
      if (cleRetrait) {
        const b = bouton('bouton retirer', `${libelle} : ${nom}`, () => {
          const [genre, cible] = cleRetrait.split(':');
          void agir(
            () => (genre === 'retirer-skin' ? session.equiperSkin(cible ?? '', null) : session.equiperFamilier(cible ?? '', null)),
            t('collection.retire_ok', { nom: texte, porteur: nom }),
          );
        });
        b.dataset.cle = cleRetrait;
        b.textContent = t('collection.retirer');
        e.append(b);
      }
      return e;
    };
    portes.append(emplacement('skin', p.skin ? nomDe(p.skin) : t('collection.rien_equipe'), p.skin ? `retirer-skin:${p.id}` : null, t('collection.retirer_libelle', { nom: p.skin ? nomDe(p.skin) : '' })));
    if (p.genre === 'heros') {
      portes.append(emplacement('familier', p.familier ? nomDe(p.familier) : t('collection.rien_equipe'), p.familier ? `retirer-familier:${p.id}` : null, t('collection.retirer_libelle', { nom: p.familier ? nomDe(p.familier) : '' })));
    }

    const bonus = el('div', 'bonus-total');
    const barre = el('span', 'barre-bonus');
    const rempli = el('span', 'rempli');
    rempli.style.width = `${String(Math.min(100, (p.totalPourcent / PLAFOND_BONUS_POURCENT) * 100))}%`;
    barre.append(rempli);
    const total = formaterPourcent(p.totalPourcent);
    const texte =
      p.totalPourcent <= 0
        ? t('collection.bonus_aucun', { m: PLAFOND_BONUS_POURCENT })
        : p.plafonne
          ? t('collection.bonus_total_plafonne', { n: total, m: PLAFOND_BONUS_POURCENT })
          : t('collection.bonus_total', { n: total, m: PLAFOND_BONUS_POURCENT });
    bonus.append(barre, el('span', 'texte', texte));

    ligne.append(entete, portes, bonus);
    return ligne;
  }

  function equipement(): HTMLElement {
    const grille = el('div', 'porteurs');
    for (const p of vuePorteurs(session.sauvegarde)) grille.append(lignePorteur(p));
    return grille;
  }

  function dessiner(): void {
    ecran.majMonnaies(session.sauvegarde);
    redessiner(ecran.corps, () => [onglets(), onglet === 'equipement' ? equipement() : liste(onglet === 'skins' ? 'skin' : 'familier')]);
  }

  ecran.corps.classList.add('collection-corps');
  dessiner();
  return ecran;
}
