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
  | { type: 'construction'; tour: number; cx: number; cy: number; famille: FamilleTour }
  | { type: 'amelioration'; tour: number; cx: number; cy: number; niveau: number; voie: Voie | null }
  | { type: 'vente'; tour: number; cx: number; cy: number; aretes: number }
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
  /** Objet utilisé : emplacement, id, point visé. */
  | { type: 'objet'; emplacement: number; objet: string; x: number; y: number }
  | { type: 'competence_tour'; tour: number; cx: number; cy: number; competence: string; rang: number }
  /** Tir d'un héros à distance. */
  | { type: 'tir_unite'; unite: number; ennemi: number; critique: boolean }
  | { type: 'esquive'; unite: number; ennemi: number }
  | { type: 'soin'; source: number; unite: number; pv: number }
  | { type: 'regain_vies'; vies: number }
  /** Un ennemi tué net (exécution) ; sa mort suit comme d'habitude. */
  | { type: 'execution'; ennemi: number; x: number; y: number }
  | { type: 'zone'; zone: number; x: number; y: number; rayon: number; duree: number }
  | { type: 'zone_fin'; zone: number; x: number; y: number }
  | { type: 'piege_pose'; piege: number; x: number; y: number }
  | { type: 'piege_declenche'; piege: number; ennemi: number; x: number; y: number }
  | { type: 'structure'; structure: number; origine: number; nom: string; x: number; y: number; duree: number }
  | { type: 'tir_structure'; structure: number; ennemi: number; x: number; y: number }
  | { type: 'structure_fin'; structure: number; x: number; y: number }
  | { type: 'boost'; tour: number; duree: number }
  | { type: 'ralliement'; tour: number; x: number; y: number }
  | { type: 'ordre_heros'; x: number; y: number }
  // --- Mécaniques des ennemis (régions 2 à 5) ---
  /** Un ennemi tué se relève : à terre `delai` s (intouchable), puis il repart avec une part de ses PV. */
  | { type: 'releve'; ennemi: number; x: number; y: number; delai: number }
  /** Un ennemi plonge : intouchable `delai` s, puis il réapparaît plus loin sur son chemin. */
  | { type: 'plongee'; ennemi: number; x: number; y: number; delai: number }
  /** Fin de l'intouchabilité (relèvement ou plongée) : l'ennemi est de nouveau là, à (x, y). */
  | { type: 'emergence'; ennemi: number; x: number; y: number }
  /** Une unité alliée prend feu au contact d'un ennemi. */
  | { type: 'brulure'; ennemi: number; unite: number }
  /** Une unité alliée est entraînée sous l'eau : elle meurt dans `delai` s si le noyeur vit encore. */
  | { type: 'noyade'; ennemi: number; unite: number; delai: number }
  /** Un ennemi en soigne un autre. */
  | { type: 'soin_ennemi'; source: number; ennemi: number; pv: number }
  /** Un boss affame les tours à portée : cadence réduite pendant `duree` s. */
  | { type: 'famine'; ennemi: number; x: number; y: number; rayon: number; duree: number }
  /** Une tour est mise hors service (en feu) pendant `duree` s. */
  | { type: 'tour_desactivee'; ennemi: number; tour: number; duree: number }
  /** Un ennemi en appelle d'autres (leurs `apparition` suivent). */
  | { type: 'appel'; ennemi: number; typeEnnemi: string; nombre: number }
  | { type: 'fin'; statut: Statut; etoiles: number };

/** Ouvre la liste d'événements du pas courant : celle d'un pas précédent est remplacée. */
export function ouvrirPas(etat: EtatPartie): void {
  if (etat.evenementsPas === etat.pas) return;
  etat.evenements = [];
  etat.evenementsPas = etat.pas;
}
