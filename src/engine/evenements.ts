// Événements émis pendant un pas, pour que le rendu joue effets et sons sans que le moteur le connaisse.
//
// Règle : `etat.evenements` contient les événements d'un seul pas, `etat.evenementsPas`. Ce pas réunit
// les actions appliquées à ce pas (via `avancer`, ou `appliquerAction` juste avant `step`) et la
// simulation qui suit. La liste est remplacée dès que quelque chose se passe au pas suivant, donc le
// rendu la lit après chaque `step` ou `avancer`. Partie terminée : « fin » se lit après le dernier pas,
// puis l'appel suivant à `step` ou `avancer` vide la liste.
import type { Voie } from './definitions';
import type { EtatPartie, FamilleTour, GenreUnite, Statut } from './etat';

export type Evenement =
  | { type: 'vague'; index: number; bonus: number }
  | { type: 'apparition'; ennemi: number; typeEnnemi: string }
  | { type: 'fuite'; ennemi: number; vies: number }
  | { type: 'mort'; ennemi: number; typeEnnemi: string; x: number; y: number; prime: number }
  | { type: 'construction'; tour: number; socle: number; famille: FamilleTour }
  | { type: 'amelioration'; tour: number; socle: number; niveau: number; voie: Voie | null }
  | { type: 'vente'; tour: number; socle: number; aretes: number }
  /** Tir d'une tour ; projectile -1 pour un coup instantané (rayon). */
  | { type: 'tir'; tour: number; cible: number; projectile: number; x: number; y: number; critique: boolean }
  | { type: 'impact'; projectile: number; tour: number; x: number; y: number; zone: number }
  | { type: 'onde'; tour: number; x: number; y: number; rayon: number }
  | { type: 'coup'; unite: number; ennemi: number }
  | { type: 'coup_ennemi'; ennemi: number; unite: number; distance: boolean }
  | { type: 'devore'; ennemi: number; unite: number }
  | { type: 'mort_unite'; unite: number; genre: GenreUnite; x: number; y: number }
  | { type: 'reapparition'; unite: number; genre: GenreUnite }
  | { type: 'invocation'; unite: number; genre: GenreUnite; x: number; y: number }
  | { type: 'sort'; emplacement: number; x: number; y: number }
  | { type: 'ralliement'; tour: number; x: number; y: number }
  | { type: 'ordre_heros'; x: number; y: number }
  | { type: 'fin'; statut: Statut; etoiles: number };

/** Ouvre la liste d'événements du pas courant : celle d'un pas précédent est remplacée. */
export function ouvrirPas(etat: EtatPartie): void {
  if (etat.evenementsPas === etat.pas) return;
  etat.evenements = [];
  etat.evenementsPas = etat.pas;
}
