// Correspondance source -> nom -> usage des bruitages de public/sons/. Les fichiers viennent de trois packs Kenney
// (CC0, voir CREDITS.md) ; `npm run sons -- <dossier>` les recopie depuis les packs extraits. Les noms sont les
// identifiants de src/audio/table.ts (un test vérifie que les deux listes sont identiques).
//
// Choix faits sans écoute, d'après le nom, la durée et la taille des fichiers : à réécouter et à remplacer ici
// (une ligne par son) si un bruitage ne convient pas, puis relancer `npm run sons -- <dossier>`.

export type PackSon = 'impact-sounds' | 'rpg-audio' | 'interface-sounds';

export interface EntreeCatalogue {
  /** Identifiant du son (nom du fichier sans `.ogg`). */
  readonly nom: string;
  readonly pack: PackSon;
  /** Fichier d'origine dans `Audio/` du pack, sans l'extension. */
  readonly source: string;
  /** Pourquoi ce fichier, et où le jeu le joue. */
  readonly usage: string;
}

export const CATALOGUE: readonly EntreeCatalogue[] = [
  { nom: 'tir_fleche', pack: 'interface-sounds', source: 'pluck_002', usage: 'Corde de l\'arc : tir des archers et des héros à distance (0,16 s).' },
  { nom: 'tir_carreau', pack: 'rpg-audio', source: 'metalLatch', usage: 'Déclic de l\'arbalète et départ de la catapulte (0,26 s).' },
  { nom: 'impact_physique', pack: 'impact-sounds', source: 'impactWood_light_001', usage: 'Flèche ou boulet qui touche : coup sec sur du bois (0,2 s).' },
  { nom: 'impact_magique', pack: 'impact-sounds', source: 'impactGlass_medium_001', usage: 'Éclat de cendre ou de magie à l\'impact (verre, joué plus grave, 0,25 s).' },
  { nom: 'explosion', pack: 'impact-sounds', source: 'impactMining_001', usage: 'Boulet de catapulte et soufre : choc lourd (0,87 s, joué plus grave).' },
  { nom: 'onde_choc', pack: 'impact-sounds', source: 'impactPlate_heavy_000', usage: 'Onde de choc d\'une tour : plaque de métal lourde (0,49 s).' },
  { nom: 'coup_epee', pack: 'impact-sounds', source: 'impactMetal_medium_001', usage: "Le héros frappe, exécution d'un ennemi : choc de métal (0,14 s)." },
  { nom: 'coup_griffe', pack: 'interface-sounds', source: 'scratch_002', usage: "Griffes des soldats chats qui frappent, ennemi dévorant une unité (0,14 s)." },
  { nom: 'coup_ennemi', pack: 'impact-sounds', source: 'impactPunch_medium_001', usage: "Coup d'un ennemi au corps à corps : choc sourd (0,40 s)." },
  { nom: 'mort_ennemi', pack: 'impact-sounds', source: 'impactSoft_heavy_000', usage: 'Mort d\'un ennemi : choc mat et court.' },
  { nom: 'mort_boss', pack: 'impact-sounds', source: 'impactMining_003', usage: 'Mort d\'un boss : grand choc (1,0 s, joué très grave).' },
  { nom: 'mort_unite', pack: 'rpg-audio', source: 'dropLeather', usage: 'Chute d\'un soldat ou d\'un héros, dévoré (0,42 s).' },
  { nom: 'construction', pack: 'impact-sounds', source: 'impactPlank_medium_001', usage: 'Planche clouée : tour, tourelle ou barricade posée (0,78 s).' },
  { nom: 'amelioration', pack: 'interface-sounds', source: 'maximize_004', usage: 'Montée courte : amélioration, compétence de tour, renfort (0,42 s).' },
  { nom: 'vente', pack: 'rpg-audio', source: 'handleCoins2', usage: 'Quelques pièces : vente d\'une tour (0,34 s).' },
  { nom: 'achat', pack: 'rpg-audio', source: 'handleCoins', usage: 'Poignée de pièces : achat en boutique, via jouerInterface(\'achat\') (0,85 s).' },
  { nom: 'sort', pack: 'interface-sounds', source: 'maximize_005', usage: 'Sort lancé, objet utilisé, invocation (0,53 s).' },
  { nom: 'piege', pack: 'rpg-audio', source: 'metalClick', usage: 'Piège qui se referme (0,45 s).' },
  { nom: 'soin', pack: 'interface-sounds', source: 'select_004', usage: 'Soin, vies regagnées (0,38 s, joué plus aigu).' },
  { nom: 'vague', pack: 'impact-sounds', source: 'impactBell_heavy_000', usage: 'Cloche lourde : une vague est appelée ou arrive (1,5 s, joué plus grave).' },
  { nom: 'victoire', pack: 'impact-sounds', source: 'impactBell_heavy_001', usage: 'Cloche longue : niveau gagné (1,7 s).' },
  { nom: 'defaite', pack: 'rpg-audio', source: 'doorClose_3', usage: 'Porte qui claque, jouée très grave : niveau perdu (0,71 s).' },
  { nom: 'clic', pack: 'interface-sounds', source: 'click_001', usage: 'Tout bouton de l\'interface, ordre donné au héros ou aux soldats (0,10 s).' },
  { nom: 'refus', pack: 'interface-sounds', source: 'error_001', usage: 'Action refusée : pas assez d\'or, socle occupé… (0,16 s).' },
  { nom: 'vie_perdue', pack: 'impact-sounds', source: 'impactMetal_heavy_001', usage: 'Un ennemi atteint la sortie : choc métallique grave (0,36 s).' },
];
