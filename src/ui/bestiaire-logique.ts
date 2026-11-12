// Bestiaire : ce que les écrans (Bestiaire, fiche « Nouvel ennemi », fiche d'un niveau) montrent, calculé d'après les données. Logique
// pure, sans DOM. Rien n'est écrit en dur : les ennemis et les tours viennent de src/data/ (un ennemi ajouté apparaît tout seul), les
// chiffres de `bulle-contenus.ts` (la seule source des valeurs affichées), les phrases de src/i18n/fr-bestiaire.ts.
import { niveauOuverture, type PalierTour } from '../data/deblocage';
import { DIEUX } from '../data/dieux';
import { ENNEMIS } from '../data/ennemis';
import { IDS_DIEUX, type IdDieu } from '../data/meta';
import { REGIONS } from '../data/niveaux/campagne';
import { FAMILLES, TOURS } from '../data/tours';
import type { NiveauCampagne } from '../data/visuel';
import type { DefEnnemi, DefNiveauTour, IdFamille, Niveau, Voie } from '../engine/definitions';
import { aTexte, t, tCle, type CleTexte, type ParametresTexte } from '../i18n';
import { spriteEnnemi, spriteTour } from '../render/habillage';
import type { Sauvegarde } from '../save';
import { CAPACITES_CAMPAGNE } from '../data/capacites-campagne';
import { contenuEnnemiDeDonnees, contenuTourDeDonnees, texteCapacite, type ContenuBulle } from './bulle-contenus';

/** Un ennemi est « rapide » (conseil : le retenir) à partir de cette vitesse, en cases par seconde. */
const VITESSE_RAPIDE = 1.8;
/** Armure ou résistance à partir de laquelle on conseille l'autre type de dégâts. */
const PROTECTION_NOTABLE = 0.3;

// --- Comment le contrer -----------------------------------------------------------------------------------------

function defDe(id: string): DefEnnemi | null {
  return Object.hasOwn(ENNEMIS, id) ? ENNEMIS[id as keyof typeof ENNEMIS] : null;
}

/** Les niveaux de toutes les tours (3 niveaux et 2 spécialisations de chaque famille). */
function defsDeTours(): { famille: IdFamille; def: DefNiveauTour }[] {
  return FAMILLES.flatMap((famille) => [...TOURS[famille].niveaux, TOURS[famille].specialisations.A, TOURS[famille].specialisations.B].map((def) => ({ famille, def })));
}

/** Les familles dont au moins une tour répond à `critere`, dans l'ordre du jeu, en noms lisibles. */
function famillesQui(critere: (def: DefNiveauTour) => boolean): string {
  const noms = FAMILLES.filter((f) => defsDeTours().some((x) => x.famille === f && critere(x.def))).map((f) => tCle(`famille.${f}`));
  return noms.join(', ');
}

/** Les tours (spécialisations comprises) qui répondent à `critere`, sans doublon de nom. */
function toursQui(critere: (def: DefNiveauTour) => boolean): string {
  const noms = new Set(defsDeTours().filter((x) => critere(x.def)).map((x) => tCle(x.def.nom)));
  return [...noms].join(', ');
}

/** Ce qu'une phrase de conseil reçoit pour se remplir : les listes de tours lues dans les données. */
interface ContexteConseil {
  readonly volants: string;
  readonly revelent: string;
  readonly magiques: string;
  readonly physiques: string;
  readonly zone: string;
}

function contexte(): ContexteConseil {
  return {
    volants: famillesQui((x) => x.volants),
    revelent: toursQui((x) => x.revele),
    magiques: famillesQui((x) => x.typeDegats === 'magique'),
    physiques: famillesQui((x) => x.typeDegats === 'physique'),
    zone: famillesQui((x) => x.zone > 0),
  };
}

/** Une phrase de conseil : sa clé de texte et ses paramètres. */
type Conseil = readonly [CleTexte, ParametresTexte?];

/**
 * Les conseils par pouvoir (`DefEnnemi.pouvoirs`), indexés par le NOM du pouvoir : `conseilsContre` parcourt les pouvoirs de l'ennemi et
 * cherche chacun ici. POUR AJOUTER UN POUVOIR, il suffit d'une ligne ici (la valeur du pouvoir est donnée pour les cas conditionnels) et
 * de sa phrase dans src/i18n/fr-bestiaire.ts ; un test échoue tant qu'un pouvoir présent dans les données n'a pas sa ligne. `paliers` et
 * `periodiques` ne sont pas ici : ce sont des listes d'actions, lues dans CONSEILS_ACTIONS.
 */
export const CONSEILS_POUVOIRS: Readonly<Record<string, (valeur: unknown, c: ContexteConseil) => Conseil | null>> = {
  relevement: (v) => [(v as { sauf?: string }).sauf === 'magique' ? 'bestiaire.contre.relevement_magie' : 'bestiaire.contre.relevement'],
  brulure: () => ['bestiaire.contre.brulure'],
  noyade: () => ['bestiaire.contre.noyade'],
  drain: () => ['bestiaire.contre.drain'],
  soin: () => ['bestiaire.contre.soin'],
  nuage: () => ['bestiaire.contre.nuage'],
  enterrement: () => ['bestiaire.contre.enterrement'],
  aura: () => ['bestiaire.contre.aura'],
  renversement: () => ['bestiaire.contre.renversement'],
  rage: () => ['bestiaire.contre.rage'],
  insensibleRalentissement: (v) => (v === true ? ['bestiaire.contre.insensible_ralentissement'] : null),
  degatsHeros: (v) => (typeof v === 'number' && v > 1 ? ['bestiaire.contre.degats_heros'] : null),
  essaim: (v, c) => (typeof v === 'number' && v > 1 ? ['bestiaire.contre.essaim', { familles: c.zone }] : null),
  vol: () => ['bestiaire.contre.vol'],
  division: (_v, c) => ['bestiaire.contre.division', { familles: c.zone }],
  explosion: () => ['bestiaire.contre.explosion'],
  bouclier: () => ['bestiaire.contre.bouclier'],
  auraProtection: () => ['bestiaire.contre.aura_protection'],
  bond: () => ['bestiaire.contre.bond'],
  regeneration: () => ['bestiaire.contre.regeneration'],
  epines: () => ['bestiaire.contre.epines'],
  alternance: () => ['bestiaire.contre.alternance'],
  derniereLueur: () => ['bestiaire.contre.derniere_lueur'],
  binome: () => ['bestiaire.contre.binome'],
  insaisissable: (v) => (v === true ? ['bestiaire.contre.insaisissable'] : null),
  // Listes d'actions : lues par CONSEILS_ACTIONS.
  paliers: () => null,
  periodiques: () => null,
};

/** Les conseils par type d'action des boss (paliers de PV, actions périodiques), indexés par `ActionEnnemi.type`. Même règle que ci-dessus. */
export const CONSEILS_ACTIONS: Readonly<Record<string, Conseil>> = {
  invoquer: ['bestiaire.contre.renforts'],
  relever_morts: ['bestiaire.contre.renforts'],
  affamer: ['bestiaire.contre.tours_gelees'],
  desactiver_tour: ['bestiaire.contre.tours_gelees'],
  figer_tour: ['bestiaire.contre.tours_gelees'],
  aveugler: ['bestiaire.contre.tours_gelees'],
  plonger: ['bestiaire.contre.intouchable'],
  invulnerabilite: ['bestiaire.contre.intouchable'],
  bannir: ['bestiaire.contre.bannir'],
  charger: ['bestiaire.contre.charge'],
  desamorcer: ['bestiaire.contre.desamorcer'],
  purifier: ['bestiaire.contre.purifier'],
  terrifier: ['bestiaire.contre.terrifier'],
  repousser: ['bestiaire.contre.repousse'],
  tirer_tour: ['bestiaire.contre.tir_tour'],
};

/**
 * Comment contrer cet ennemi : une phrase par particularité, tirée de ses données (volant, furtif, protections, pouvoirs…), jamais d'un
 * texte propre à un ennemi. Les tours citées viennent des données des tours (celles qui visent les volants, celles qui révèlent).
 * Un ennemi ordinaire, sans rien de particulier, a une phrase générale. Les pouvoirs sont lus génériquement : voir CONSEILS_POUVOIRS et
 * CONSEILS_ACTIONS pour ajouter une phrase. Un pouvoir inconnu n'ajoute rien (ses particularités restent lisibles dans la fiche).
 */
export function conseilsContre(id: string): string[] {
  const d = defDe(id);
  if (!d) return [];
  const ctx = contexte();
  const conseils: Conseil[] = [];
  if (d.volant) conseils.push(['bestiaire.contre.volant', { familles: ctx.volants }]);
  if (d.furtif) conseils.push(['bestiaire.contre.furtif', { tours: ctx.revelent }]);
  if (d.armure >= PROTECTION_NOTABLE) conseils.push(['bestiaire.contre.blinde', { familles: ctx.magiques }]);
  if (d.resistance >= PROTECTION_NOTABLE) conseils.push(['bestiaire.contre.resistant', { familles: ctx.physiques }]);
  // Un volant n'est pas retenu par des soldats : sa variante parle de ralentissement et de tours le long du chemin.
  if (d.vitesse >= VITESSE_RAPIDE) conseils.push([d.volant ? 'bestiaire.contre.rapide_volant' : 'bestiaire.contre.rapide']);
  if (d.distance) conseils.push(['bestiaire.contre.distance']);
  if (d.devore > 0) conseils.push(['bestiaire.contre.devore']);
  if (d.insensibleEtourdissement && !d.boss) conseils.push(['bestiaire.contre.inarretable']);
  const pouvoirs = (d.pouvoirs ?? {}) as Readonly<Record<string, unknown>>;
  for (const nom of Object.keys(pouvoirs)) {
    if (!Object.hasOwn(CONSEILS_POUVOIRS, nom)) continue;
    const conseil = CONSEILS_POUVOIRS[nom]?.(pouvoirs[nom], ctx);
    if (conseil) conseils.push(conseil);
  }
  const actions = [...(d.pouvoirs?.paliers ?? []).flatMap((x) => x.actions), ...(d.pouvoirs?.periodiques ?? []).flatMap((x) => x.actions)];
  for (const a of actions) {
    if (Object.hasOwn(CONSEILS_ACTIONS, a.type)) {
      const conseil = CONSEILS_ACTIONS[a.type];
      if (conseil) conseils.push(conseil);
    }
  }
  if (d.boss) conseils.push(['bestiaire.contre.boss']);
  const textes = [...new Set(conseils.map(([cle, parametres]) => t(cle, parametres)))];
  return textes.length > 0 ? textes : [t('bestiaire.contre.ordinaire')];
}

// --- Les ennemis, classés par région ----------------------------------------------------------------------------

export interface EntreeEnnemi {
  readonly id: string;
  readonly rencontre: boolean;
}

export interface GroupeEnnemis {
  /** Numéro de la région (1 à 10) où l'ennemi paraît pour la première fois ; 0 : il ne paraît dans aucun niveau de la campagne (renfort invoqué…). */
  readonly region: number;
  readonly ennemis: readonly EntreeEnnemi[];
}

/** Les identifiants des ennemis d'un niveau, dans l'ordre de leur première apparition dans ses vagues, sans doublon. */
export function ennemisDuNiveau(niveau: Niveau): string[] {
  const vus = new Set<string>();
  for (const vague of niveau.vagues) for (const paquet of vague.paquets) vus.add(paquet.ennemi);
  return [...vus];
}

/** Les ennemis du niveau à afficher sur sa fiche : chacun avec « nouveau » s'il n'a encore jamais été rencontré. */
export function ennemisDeLaFiche(niveau: Niveau, s: Sauvegarde): { id: string; nouveau: boolean }[] {
  const connus = new Set(s.meta.bestiaire.rencontres);
  return ennemisDuNiveau(niveau)
    .filter((id) => defDe(id) !== null)
    .map((id) => ({ id, nouveau: !connus.has(id) }));
}

/**
 * Tous les ennemis du jeu (la table des données), rangés par région de première apparition, dans l'ordre où la campagne les présente.
 * `regions` : les niveaux de chaque région (par défaut ceux de la campagne). Un ennemi absent de tous les niveaux va dans le groupe 0.
 */
export function ennemisParRegion(s: Sauvegarde, regions: readonly (readonly NiveauCampagne[])[] = REGIONS): GroupeEnnemis[] {
  const connus = new Set(s.meta.bestiaire.rencontres);
  const placé = new Set<string>();
  const groupes: GroupeEnnemis[] = [];
  regions.forEach((niveaux, i) => {
    const ids: string[] = [];
    for (const n of niveaux) {
      for (const id of ennemisDuNiveau(n.niveau)) {
        if (defDe(id) === null || placé.has(id)) continue;
        placé.add(id);
        ids.push(id);
      }
    }
    if (ids.length > 0) groupes.push({ region: i + 1, ennemis: ids.map((id) => ({ id, rencontre: connus.has(id) })) });
  });
  const restants = Object.keys(ENNEMIS).filter((id) => !placé.has(id));
  if (restants.length > 0) groupes.push({ region: 0, ennemis: restants.map((id) => ({ id, rencontre: connus.has(id) })) });
  return groupes;
}

/** La fiche complète d'un ennemi rencontré : les chiffres et particularités des bulles, comment le contrer, sa phrase de lore. */
export interface FicheEnnemi {
  readonly id: string;
  readonly sprite: string;
  readonly contenu: ContenuBulle;
  readonly contrer: readonly string[];
  readonly lore: string | null;
}

export function ficheEnnemi(id: string): FicheEnnemi {
  const contenu = contenuEnnemiDeDonnees(id);
  const cle = `ennemi.${id}.desc`;
  return { id, sprite: spriteEnnemi(id), contenu, contrer: conseilsContre(id), lore: aTexte(cle) ? tCle(cle) : null };
}

// --- Les tours, avec ce que la campagne a déjà ouvert -------------------------------------------------------------

export interface EntreeTour {
  /** Identifiant stable : « tir-2 », « tir-4A », « divine-plume ». */
  readonly id: string;
  readonly famille: IdFamille | 'divine';
  readonly palier: PalierTour;
  readonly voie: Voie | null;
  readonly dieu: IdDieu | null;
  readonly sprite: string;
  /** Numéro du niveau de campagne qui l'ouvre (`src/data/deblocage.ts`). */
  readonly ouvertAuNiveau: number;
  readonly verrouillee: boolean;
}

export interface GroupeTours {
  readonly famille: IdFamille | 'divine';
  readonly tours: readonly EntreeTour[];
}

/**
 * Les tours du jeu par famille : niveaux 1 à 3 puis les deux spécialisations, et la tour divine de chaque dieu. Une tour est verrouillée
 * tant que le niveau le plus avancé atteint (`niveauMax` de la progression) n'a pas atteint le niveau qui l'ouvre.
 */
export function groupesDeTours(niveauMax: number): GroupeTours[] {
  const ouverture = (famille: IdFamille | 'divine', palier: PalierTour): { ouvertAuNiveau: number; verrouillee: boolean } => {
    const ouvertAuNiveau = niveauOuverture(famille, palier);
    return { ouvertAuNiveau, verrouillee: niveauMax < ouvertAuNiveau };
  };
  const groupes: GroupeTours[] = FAMILLES.map((famille) => {
    const tours: EntreeTour[] = ([1, 2, 3] as const).map((palier) => ({
      id: `${famille}-${String(palier)}`,
      famille,
      palier,
      voie: null,
      dieu: null,
      sprite: spriteTour(famille, palier, null),
      ...ouverture(famille, palier),
    }));
    for (const voie of ['A', 'B'] as const) {
      tours.push({ id: `${famille}-4${voie}`, famille, palier: 4, voie, dieu: null, sprite: spriteTour(famille, 4, voie), ...ouverture(famille, 4) });
    }
    return { famille, tours };
  });
  groupes.push({
    famille: 'divine',
    tours: IDS_DIEUX.map((dieu) => ({
      id: `divine-${dieu}`,
      famille: 'divine' as const,
      palier: 1 as const,
      voie: null,
      dieu,
      sprite: spriteTour('divine', 1, null, dieu),
      ...ouverture('divine', 1),
    })),
  });
  return groupes;
}

/** Nom d'une tour : celui des données (jamais recopié). */
export function nomDeTour(e: EntreeTour): string {
  if (e.famille === 'divine') return tCle(DIEUX[e.dieu ?? 'plume'].tourDivine.nom);
  const base = TOURS[e.famille];
  const def = e.palier === 4 ? base.specialisations[e.voie ?? 'A'] : base.niveaux[e.palier - 1];
  return def ? tCle(def.nom) : e.id;
}

/** Le détail d'une tour : les chiffres et pouvoirs des bulles (une seule source, `bulle-contenus.ts`). */
export function contenuDeTour(e: EntreeTour): ContenuBulle {
  if (e.famille === 'divine') return contenuTourDeDonnees('divine', { dieu: e.dieu ?? 'plume' });
  const contenu = contenuTourDeDonnees(e.famille, { niveau: e.palier, ...(e.voie ? { voie: e.voie } : {}) });
  // La capacité que la famille gagne dans la campagne du DLC « Temps modernes » (les stats, elles, restent celles-ci).
  const capacite = CAPACITES_CAMPAGNE.moderne[e.famille];
  return capacite ? { ...contenu, lignes: [...contenu.lignes, { libelle: t('bulle.tour.capacite_dlc'), valeur: texteCapacite(capacite) }] } : contenu;
}

/**
 * Le libellé d'une tuile ou d'une fiche de tour : les trois niveaux d'une famille portent le même nom, on ajoute donc « Niveau n » ou
 * « Spécialisation A ». La tour divine garde son nom seul.
 */
export function libelleDeTour(e: EntreeTour): string {
  const precision = precisionDeTour(e);
  return precision === null ? nomDeTour(e) : `${nomDeTour(e)} : ${precision}`;
}

/** « Niveau 2 » ou « Spécialisation A » ; null pour la tour divine (un seul niveau). */
export function precisionDeTour(e: EntreeTour): string | null {
  if (e.famille === 'divine') return null;
  return e.palier === 4 ? t('bestiaire.tour_specialisation', { voie: e.voie ?? 'A' }) : t('bestiaire.tour_niveau', { n: e.palier });
}
