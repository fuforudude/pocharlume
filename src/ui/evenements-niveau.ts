// Ce que l'interface dit des événements datés et des foules (DLC Temps modernes) : le texte du bandeau d'annonce, la foule sous le doigt,
// et le geste à jouer quand on la touche. Pur : lit l'état, ne le change jamais (la commande passe par la file d'actions de la partie).
import { foulePrete, pointDansFoule, validerAction, type Action, type EtatPartie, type Evenement, type RaisonRefus } from '../engine';
import { t } from '../i18n';
import { texteRefus } from './refus';

/** Le texte du bandeau pour un événement du moteur, ou null s'il n'y a rien à annoncer. */
export function texteBandeau(etat: EtatPartie, ev: Evenement): string | null {
  switch (ev.type) {
    case 'annonce_evenement':
      switch (ev.typeEvenement) {
        case 'charge':
          return t('evenement.charge.annonce', { n: ev.chemin + 1 });
        case 'nasse':
          return t('evenement.nasse.annonce', { n: ev.chemin + 1 });
        case 'canon_a_eau':
          return t('evenement.canon_a_eau.annonce');
        case 'renforts':
          return t('evenement.renforts.annonce');
        case 'ouvrir_chemin':
          return t('evenement.ouvrir_chemin.annonce', { n: ev.chemin + 1 });
        case 'fermer_chemin':
          return t('evenement.fermer_chemin.annonce', { n: ev.chemin + 1 });
        default:
          return null;
      }
    case 'vente_office':
      return t('evenement.vente_office', { n: ev.aretes });
    case 'foule_activee': {
      const effet = etat.niveau.foules?.[ev.foule]?.effet.type;
      if (effet === 'ralentir') return t('foule.activee.ralentir');
      if (effet === 'renforts') return t('foule.activee.renforts');
      if (effet === 'bloquer') return t('foule.activee.bloquer');
      return null;
    }
    default:
      return null;
  }
}

/** L'indice de la foule sous le point (tuiles), -1 s'il n'y en a pas. */
export function fouleSous(etat: EtatPartie, x: number, y: number): number {
  const foules = etat.niveau.foules ?? [];
  for (let i = 0; i < foules.length; i++) {
    const foule = foules[i];
    if (foule && pointDansFoule(etat.niveau, foule, x, y)) return i;
  }
  return -1;
}

/** Ce que fait un toucher sur une foule : l'action à envoyer (foule « payer » prête et payable), sinon le message qui explique. */
export interface GesteFoule {
  readonly action: Action | null;
  readonly message: string | null;
  readonly refus: RaisonRefus | null;
}

export function toucherFoule(etat: EtatPartie, index: number): GesteFoule {
  const foule = etat.niveau.foules?.[index];
  const suivi = etat.dynamique.foules[index];
  if (!foule || !suivi) return { action: null, message: null, refus: null };
  const condition = foule.condition;
  if (condition.type === 'heros') {
    // Une foule « héros » ne se paie pas : la bulle dit comment l'activer (ou qu'elle se repose).
    return { action: null, message: foulePrete(suivi) ? t('foule.aide.heros', { n: condition.duree }) : texteRefus(suivi.utilisations === 0 ? 'foule_epuisee' : 'foule_en_recharge'), refus: null };
  }
  const action: Action = { type: 'activerFoule', foule: index };
  const refus = validerAction(etat, action);
  if (refus === null) return { action, message: null, refus: null };
  // Pas assez d'arêtes : la bulle redit le prix, plus utile que « pas assez ».
  const message = refus === 'aretes_insuffisantes' ? t('foule.aide.payer', { n: condition.cout }) : texteRefus(refus);
  return { action: null, message, refus };
}
