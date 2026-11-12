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
  /** Événements d'une tour : sa case (cx, cy) ou -1 sur le radeau, sa place (-1 sur une case) et sa position (x, y) à cet instant. */
  | { type: 'construction'; tour: number; cx: number; cy: number; place: number; x: number; y: number; famille: FamilleTour }
  | { type: 'amelioration'; tour: number; cx: number; cy: number; place: number; x: number; y: number; niveau: number; voie: Voie | null }
  | { type: 'vente'; tour: number; cx: number; cy: number; place: number; x: number; y: number; aretes: number }
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
  | { type: 'competence_tour'; tour: number; cx: number; cy: number; place: number; x: number; y: number; competence: string; rang: number }
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
  | { type: 'piege_desamorce'; piege: number; ennemi: number; x: number; y: number }
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
  // --- Mécaniques des ennemis (régions 6 à 10) ---
  /** Un soldat tombe près d'un Fossoyeur : il mettra plus longtemps à réapparaître. */
  | { type: 'enterre'; ennemi: number; unite: number }
  /** Un Cavalier renverse l'unité qui le bloquait (étourdie `duree` s) et passe. */
  | { type: 'renversement'; ennemi: number; unite: number; duree: number }
  /** Une tour est gelée pendant `duree` s. */
  | { type: 'tour_gelee'; ennemi: number; tour: number; duree: number }
  /** Un boss aveugle les tours à portée : portée réduite pendant `duree` s. */
  | { type: 'aveuglement'; ennemi: number; x: number; y: number; rayon: number; duree: number }
  /** Un Exorciste bannit une invocation (tuée) ou étourdit le héros `duree` s (`unite` : l'unité visée). */
  | { type: 'bannissement'; ennemi: number; unite: number; genre: GenreUnite; duree: number }
  /** Un boss relève les derniers ennemis morts (leurs `apparition` suivent). */
  | { type: 'resurrection'; ennemi: number; nombre: number }
  /** Un boss charge : vitesse multipliée pendant `duree` s. */
  | { type: 'charge'; ennemi: number; x: number; y: number; duree: number }
  /** Un boss devient intouchable `duree` s. */
  | { type: 'invulnerabilite'; ennemi: number; x: number; y: number; duree: number }
  // --- Mécaniques des ennemis (variété : deux nouveaux ennemis par région) ---
  /** Un kamikaze explose au contact : il blesse les unités alliées dans `rayon` et disparaît. */
  | { type: 'explosion'; ennemi: number; x: number; y: number; rayon: number }
  /** Un sauteur franchit l'unité qui le retenait : de (x, y) à (versX, versY). */
  | { type: 'bond'; ennemi: number; x: number; y: number; versX: number; versY: number }
  /** Un voleur prend `aretes` arêtes au joueur. */
  | { type: 'vol'; ennemi: number; aretes: number }
  /** Un porteur meurt et se divise : `nombre` ennemis de `typeEnnemi` apparaissent (leurs `apparition` suivent). */
  | { type: 'division'; ennemi: number; typeEnnemi: string; nombre: number; x: number; y: number }
  /** Un ennemi qui meurt rend des PV à ceux qui l'entourent. */
  | { type: 'derniere_lueur'; ennemi: number; x: number; y: number; rayon: number }
  /** Un Aumônier retire ralentissement et étourdissement aux ennemis autour de lui. */
  | { type: 'purification'; ennemi: number; x: number; y: number; rayon: number }
  /** Un Chantre étourdit les unités alliées autour de lui `duree` s. */
  | { type: 'terreur'; ennemi: number; x: number; y: number; rayon: number; duree: number }
  /** Un Sapeur désamorce `nombre` pièges ou tourelles. */
  | { type: 'desamorcage'; ennemi: number; x: number; y: number; nombre: number }
  /** L'armure et la résistance d'une Effigie s'échangent. */
  | { type: 'inversion'; ennemi: number; x: number; y: number }
  // --- DLC « Temps modernes » : capacités de famille et mécaniques d'ennemis ---
  /** Un Perchoir (« Renvoi ») dissipe un nuage toxique (son `zone_fin` suit). */
  | { type: 'dissipation'; tour: number; zone: number; x: number; y: number }
  /** Un ennemi repousse `nombre` unités alliées devant lui, dans la direction (dx, dy). */
  | { type: 'repousse'; ennemi: number; x: number; y: number; dx: number; dy: number; portee: number; nombre: number }
  /** Un ennemi tire un projectile sur une tour (le tir `tir` est dans `etat.tirsEnnemis` tant qu'il vole). */
  | { type: 'tir_tour'; tir: number; ennemi: number; tour: number; x: number; y: number }
  /** Un Perchoir (« Renvoi ») renvoie un tir sur les tours vers son tireur. */
  | { type: 'renvoi'; tir: number; tour: number; ennemi: number; x: number; y: number }
  /** Un tir renvoyé atteint son tireur, qui est étourdi. */
  | { type: 'tir_renvoye_touche'; tir: number; ennemi: number; x: number; y: number }
  /** L'autre ennemi d'un binôme est tombé : celui-ci accélère. */
  | { type: 'binome_seul'; ennemi: number; x: number; y: number }
  | { type: 'fin'; statut: Statut; etoiles: number };

/** Ouvre la liste d'événements du pas courant : celle d'un pas précédent est remplacée. */
export function ouvrirPas(etat: EtatPartie): void {
  if (etat.evenementsPas === etat.pas) return;
  etat.evenements = [];
  etat.evenementsPas = etat.pas;
}
