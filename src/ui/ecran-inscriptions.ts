// Le recueil « Inscriptions » (ouvert depuis la carte du monde) : les 31 inscriptions des vieilles statues, celles qu'on a trouvées en
// texte complet, les autres en « ??? » avec le nom de leur région, et le compteur « n / 31 ». Lecture seule : les inscriptions se
// gagnent en touchant une statue pendant une partie (src/ui/partie.ts), pas ici.
// Clavier : chaque entrée prend le focus avec Tab (la liste défile jusqu'à elle), Échap ou « Fermer » referme. Un panneau plein cadre
// comme les héros et la boutique (ecran-meta.ts), dont la liste tient en deux colonnes en paysage (812×375).
import { t } from '../i18n';
import type { AtlasRendu } from '../render/atlas';
import type { Sauvegarde } from '../save';
import { el } from './dom';
import { creerEcranMeta, type EcranMeta } from './ecran-meta';
import { vueInscriptions } from './inscriptions-vues';

/** Ce que l'écran lit de la session : la sauvegarde courante. */
export interface SessionInscriptions {
  readonly sauvegarde: Sauvegarde;
}

export interface OptionsEcranInscriptions {
  readonly atlas: AtlasRendu;
  readonly session: SessionInscriptions;
  readonly surFermer: () => void;
}

export function afficherEcranInscriptions(parent: HTMLElement, options: OptionsEcranInscriptions): EcranMeta {
  const vue = vueInscriptions(options.session.sauvegarde);
  const ecran = creerEcranMeta(parent, {
    classe: 'ecran-inscriptions',
    titre: t('inscriptions.titre'),
    fermer: t('inscriptions.fermer'),
    atlas: options.atlas,
    sauvegarde: options.session.sauvegarde,
    monnaies: [],
    surFermer: options.surFermer,
  });

  // Le compteur prend la place des monnaies dans l'en-tête.
  const compteur = el('div', 'puce inscriptions-compteur', vue.compteur);
  compteur.title = vue.libelleCompteur;
  compteur.setAttribute('aria-label', vue.libelleCompteur);
  ecran.racine.querySelector('.meta-monnaies')?.append(compteur);

  if (vue.vide) {
    const vide = el('p', 'inscriptions-vide', t('inscriptions.vide'));
    vide.setAttribute('role', 'status');
    ecran.corps.append(vide);
  }

  const liste = el('ul', 'inscriptions-liste');
  liste.setAttribute('aria-label', t('inscriptions.liste'));
  for (const ligne of vue.lignes) {
    const entree = el('li', `inscription ${ligne.trouvee ? 'trouvee' : 'inconnue'}`);
    entree.tabIndex = 0;
    entree.dataset.carte = ligne.id;
    if (ligne.texte !== null && ligne.carte !== null) {
      entree.append(
        el('p', 'inscription-lieu', t('inscriptions.lieu', { carte: ligne.carte, region: ligne.region })),
        el('p', 'inscription-texte', ligne.texte),
      );
    } else {
      entree.setAttribute('aria-label', t('inscriptions.inconnue_libelle', { region: ligne.region }));
      entree.append(el('p', 'inscription-lieu', ligne.region), el('p', 'inscription-texte', t('inscriptions.inconnue')));
    }
    liste.append(entree);
  }
  ecran.corps.append(liste);
  return ecran;
}
