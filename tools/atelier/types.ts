// Contrat entre le cœur de l'atelier et un projet : l'ADAPTATEUR.
// Le cœur ne connaît aucun format de fichier : il affiche et édite des documents génériques (calques de pixels en
// lettres, palette, objets sur une grille) et délègue tout le reste à l'adaptateur du projet. Tout ce qui passe
// entre le serveur et le navigateur est du JSON simple.

/** Saisie invalide (400). */
export class ErreurRequete extends Error {}
/** Le fichier n'est plus tel qu'à l'ouverture, ou la clé est périmée : il faut rouvrir (409). */
export class ErreurConflit extends Error {}
/** Élément inconnu (404). */
export class ErreurIntrouvable extends Error {}

/** Image RVBA, 4 octets par pixel, encodée en base64. */
export interface ImageRvba {
  readonly largeur: number;
  readonly hauteur: number;
  readonly rvba: string;
}

/** Un fichier à écrire. Le cœur vérifie le chemin avant d'écrire quoi que ce soit. */
export interface Ecriture {
  /** Chemin relatif à la racine du projet, avec des `/`. */
  readonly chemin: string;
  readonly contenu: string;
}

/** Résultat d'une commande lancée après l'écriture (reconstruction d'un atlas, d'un cache…). */
export interface ResultatApres {
  readonly ok: boolean;
  readonly message: string;
}

// ---------------------------------------------------------------------------------------------------------------
// Sprites
// ---------------------------------------------------------------------------------------------------------------

export interface EntreeSprite {
  readonly id: string;
  readonly nom: string;
  /** Rubrique d'affichage dans la liste (le fichier source, la catégorie…). */
  readonly groupe: string;
}

/**
 * Un calque éditable : une grille de lettres posée à (x, y) dans le cadre du sprite. `.` est transparent, `_` efface
 * ce qui est dessous, toute autre lettre est une entrée de la palette. Les lignes peuvent être plus courtes que le
 * cadre : ce qui manque est transparent.
 */
export interface CalqueSprite {
  readonly id: string;
  readonly nom: string;
  readonly x: number;
  readonly y: number;
  readonly lignes: readonly string[];
  /** Si ce calque est employé par d'autres sprites que celui-ci, leurs ids (ils changent aussi à l'enregistrement). */
  readonly partageAvec?: readonly string[];
  /** Cadre rendu à montrer en fond pendant la retouche de ce calque. */
  readonly contexte?: { readonly animation: string; readonly indice: number };
}

export interface EntreePalette {
  readonly lettre: string;
  /** `#rrggbb` ou `#rrggbbaa`. */
  readonly couleur: string;
  readonly commentaire?: string;
}

export interface CadreApercu {
  readonly image: ImageRvba;
  /** Durée d'affichage en millisecondes. */
  readonly duree: number;
}

export interface AnimationApercu {
  readonly nom: string;
  readonly boucle: boolean;
  readonly cadres: readonly CadreApercu[];
}

export interface ApercuSprite {
  readonly id: string;
  readonly nom: string;
  /** Taille logique du cadre et point posé au sol, pour aligner les animations entre elles. */
  readonly largeur: number;
  readonly hauteur: number;
  readonly ancre: { readonly x: number; readonly y: number };
  readonly animations: readonly AnimationApercu[];
}

export interface DocumentSprite {
  readonly id: string;
  readonly nom: string;
  /** Taille du cadre de dessin, en pixels de calque. */
  readonly largeur: number;
  readonly hauteur: number;
  readonly calques: readonly CalqueSprite[];
  readonly palette: readonly EntreePalette[];
  /** Le sprite rendu, avec toutes ses animations. */
  readonly apercu: ApercuSprite;
  /** Les sprites qui reprennent celui-ci (dérivés, variantes), rendus eux aussi. */
  readonly derives: readonly ApercuSprite[];
  /** Couleur du sol sur lequel les animations sont jouées. */
  readonly fond?: string;
  /** Empreinte des fichiers que l'enregistrement réécrira : à renvoyer telle quelle, un fichier modifié entre-temps est refusé. */
  readonly empreinte: string;
  /** Pourquoi une partie du sprite n'est pas éditable (cadres repris d'une planche, calques calculés…). */
  readonly remarque?: string;
}

/** Les calques modifiés par l'utilisateur, par id : seul le contenu des lignes change. */
export type CalquesModifies = Readonly<Record<string, readonly string[]>>;

export interface ModuleSprites {
  lister(): Promise<readonly EntreeSprite[]>;
  ouvrir(id: string): Promise<DocumentSprite>;
  /** Rend le sprite et ses dérivés avec des calques modifiés, sans rien écrire. `origine` : leurs lignes à l'ouverture (clé périmée : `ErreurConflit`). */
  apercu(id: string, calques: CalquesModifies, origine: CalquesModifies): Promise<{ readonly apercu: ApercuSprite; readonly derives: readonly ApercuSprite[] }>;
  /**
   * Les fichiers à écrire pour enregistrer ces calques ; ne touche qu'aux lignes modifiées. `base` dit comment le client a
   * ouvert le sprite (lignes d'origine des calques modifiés, empreinte) : si le fichier a changé depuis, lève `ErreurConflit`.
   */
  enregistrer(id: string, calques: CalquesModifies, base: { readonly origine: CalquesModifies; readonly empreinte: string }): Promise<readonly Ecriture[]>;
}

// ---------------------------------------------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------------------------------------------

export interface CouleurPalette extends EntreePalette {
  /** Nombre de sprites qui emploient cette lettre de cette palette. */
  readonly utilisations: number;
}

export interface DocumentPalette {
  readonly nom: string;
  readonly couleurs: readonly CouleurPalette[];
  /** À partir de ce nombre de sprites, changer la couleur mérite un avertissement. */
  readonly seuilAvertissement: number;
}

export interface VignetteSprite {
  readonly id: string;
  readonly nom: string;
  readonly image: ImageRvba;
}

export interface ModulePalette {
  /** Palettes modifiables (une seule suffit). */
  lister(): Promise<readonly string[]>;
  ouvrir(nom: string): Promise<DocumentPalette>;
  /** Vignettes des sprites concernés par ces changements (lettre vers couleur), rendues avec les nouvelles couleurs. */
  apercu(nom: string, changements: Readonly<Record<string, string>>): Promise<readonly VignetteSprite[]>;
  enregistrer(nom: string, changements: Readonly<Record<string, string>>): Promise<readonly Ecriture[]>;
}

// ---------------------------------------------------------------------------------------------------------------
// Cartes : des objets à placer sur une grille 2D
// ---------------------------------------------------------------------------------------------------------------

export interface ObjetCarte {
  readonly id: string;
  /** Famille de l'objet (décor, statue…), pour la couleur et le filtre. */
  readonly genre: string;
  readonly libelle: string;
  /** Position de l'ancre, en unités de la grille (peut être fractionnaire). */
  readonly x: number;
  readonly y: number;
  /** Rectangle occupé, en décalage de l'ancre : { gauche, haut, droite, bas } en unités. */
  readonly emprise: { readonly gauche: number; readonly haut: number; readonly droite: number; readonly bas: number };
}

export interface GenreObjet {
  readonly id: string;
  readonly libelle: string;
  readonly couleur: string;
  /** Si faux, le genre est montré mais ne peut pas être déplacé (avec `raison`). */
  readonly actif: boolean;
  readonly raison?: string;
}

export interface EntreeCarte {
  readonly id: string;
  readonly nom: string;
  readonly groupe: string;
}

export interface DocumentCarte {
  readonly id: string;
  readonly nom: string;
  /** Dimensions en unités de la grille. */
  readonly colonnes: number;
  readonly lignes: number;
  /** Une ligne plus marquée tous les `pas` unités (la case de construction, par exemple). */
  readonly pas: number;
  /** Précision du déplacement des objets, en unités. */
  readonly aimantation: number;
  /** Chemins à tracer en fond (polylignes en unités), lecture seule. */
  readonly chemins: readonly (readonly { readonly x: number; readonly y: number }[])[];
  readonly genres: readonly GenreObjet[];
  readonly objets: readonly ObjetCarte[];
  readonly verification: VerificationCarte;
  /** Empreinte des fichiers que l'enregistrement réécrira, à renvoyer à `enregistrer`. */
  readonly empreinte: string;
}

export interface ErreurCarte {
  /** Objet fautif, ou null pour une erreur générale. */
  readonly objet: string | null;
  readonly message: string;
}

export interface LigneBilan {
  readonly libelle: string;
  readonly avant: number;
  readonly apres: number;
}

export interface VerificationCarte {
  readonly erreurs: readonly ErreurCarte[];
  /** Cases (index ligne par ligne de la grille `pas`) bloquées dans la disposition vérifiée. */
  readonly casesBloquees: readonly number[];
  readonly bilan: readonly LigneBilan[];
  readonly avertissement?: string;
}

export type Positions = Readonly<Record<string, { readonly x: number; readonly y: number }>>;

/** Un objet déplacé, avec ce qu'il était à l'ouverture (libellé et position) pour détecter une modification externe. */
export type Deplacements = Readonly<Record<string, { readonly x: number; readonly y: number; readonly origine: { readonly libelle: string; readonly x: number; readonly y: number } }>>;

export interface ModuleCartes {
  lister(): Promise<readonly EntreeCarte[]>;
  ouvrir(id: string): Promise<DocumentCarte>;
  /** Applique les règles du projet à une disposition (positions des seuls objets déplacés, les autres restent où le fichier les met). */
  verifier(id: string, positions: Positions): Promise<VerificationCarte>;
  /**
   * Refuse (en lançant) une disposition invalide ; sinon les fichiers à écrire, limités aux lignes modifiées. Ne reçoit que
   * les objets déplacés ; un fichier changé depuis l'ouverture (empreinte ou origine d'un objet) lève `ErreurConflit`.
   */
  enregistrer(id: string, deplaces: Deplacements, empreinte: string): Promise<readonly Ecriture[]>;
}

// ---------------------------------------------------------------------------------------------------------------
// Adaptateur
// ---------------------------------------------------------------------------------------------------------------

export interface Adaptateur {
  /** Nom affiché dans l'interface. */
  readonly nom: string;
  /** Dossier racine du projet (absolu). Tous les chemins d'écriture sont relatifs à lui. */
  readonly racine: string;
  /**
   * Où l'atelier a le droit d'écrire, chemins relatifs à la racine avec des `/` : un dossier (`art/`), un fichier
   * (`donnees/niveaux.json`) ou un motif avec `*` dans le dernier segment (`donnees/cartes*.json`). Rien d'autre n'est écrit.
   */
  readonly ecriturePermise: readonly string[];
  readonly sprites?: ModuleSprites;
  readonly palette?: ModulePalette;
  readonly cartes?: ModuleCartes;
  /** Lancé après chaque enregistrement réussi (reconstruire un atlas…). */
  apresEcriture?(chemins: readonly string[]): Promise<ResultatApres>;
}

export interface ConfigAtelier {
  /** Fabrique l'adaptateur du projet (appelée une fois au démarrage). */
  readonly adaptateur: () => Adaptateur | Promise<Adaptateur>;
  /** Port du serveur local (défaut 5199). `--port` en ligne de commande l'emporte. */
  readonly port?: number;
}

export function definirConfig(config: ConfigAtelier): ConfigAtelier {
  return config;
}
