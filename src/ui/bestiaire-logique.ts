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
import { aTexte, t, tCle } from '../i18n';
import { spriteEnnemi, spriteTour } from '../render/habillage';
import type { Sauvegarde } from '../save';
import { contenuEnnemiDeDonnees, contenuTourDeDonnees, type ContenuBulle } from './bulle-contenus';

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

/**
 * Comment contrer cet ennemi : une phrase par particularité, tirée de ses données (volant, furtif, protections, pouvoirs…), jamais d'un
 * texte propre à un ennemi. Les tours citées viennent des données des tours (celles qui visent les volants, celles qui révèlent).
 * Un ennemi ordinaire, sans rien de particulier, a une phrase générale. Une mécanique que ce module ne connaît pas encore n'ajoute rien :
 * ses particularités restent lisibles dans la liste (`contenuEnnemiDeDonnees`).
 */
export function conseilsContre(id: string): string[] {
  const d = defDe(id);
  if (!d) return [];
  const c: string[] = [];
  if (d.volant) c.push(t('bestiaire.contre.volant', { familles: famillesQui((x) => x.volants) }));
  if (d.furtif) c.push(t('bestiaire.contre.furtif', { tours: toursQui((x) => x.revele) }));
  if (d.armure >= PROTECTION_NOTABLE) c.push(t('bestiaire.contre.blinde', { familles: famillesQui((x) => x.typeDegats === 'magique') }));
  if (d.resistance >= PROTECTION_NOTABLE) c.push(t('bestiaire.contre.resistant'));
  if (d.vitesse >= VITESSE_RAPIDE) c.push(t('bestiaire.contre.rapide'));
  if (d.distance) c.push(t('bestiaire.contre.distance'));
  if (d.devore > 0) c.push(t('bestiaire.contre.devore'));
  if (d.insensibleEtourdissement && !d.boss) c.push(t('bestiaire.contre.inarretable'));
  const p = d.pouvoirs;
  if (p) {
    if (p.relevement) c.push(t(p.relevement.sauf === 'magique' ? 'bestiaire.contre.relevement_magie' : 'bestiaire.contre.relevement'));
    if (p.brulure) c.push(t('bestiaire.contre.brulure'));
    if (p.noyade) c.push(t('bestiaire.contre.noyade'));
    if (p.drain) c.push(t('bestiaire.contre.drain'));
    if (p.soin) c.push(t('bestiaire.contre.soin'));
    if (p.nuage) c.push(t('bestiaire.contre.nuage'));
    if (p.enterrement) c.push(t('bestiaire.contre.enterrement'));
    if (p.aura) c.push(t('bestiaire.contre.aura'));
    if (p.renversement) c.push(t('bestiaire.contre.renversement'));
    if (p.rage) c.push(t('bestiaire.contre.rage'));
    if (p.insensibleRalentissement) c.push(t('bestiaire.contre.insensible_ralentissement'));
    if (p.degatsHeros !== undefined && p.degatsHeros > 1) c.push(t('bestiaire.contre.degats_heros'));
    if (p.essaim !== undefined && p.essaim > 1) c.push(t('bestiaire.contre.essaim', { familles: famillesQui((x) => x.zone > 0) }));
    const types = new Set([...(p.paliers ?? []).flatMap((x) => x.actions), ...(p.periodiques ?? []).flatMap((x) => x.actions)].map((a) => a.type));
    if (types.has('invoquer') || types.has('relever_morts')) c.push(t('bestiaire.contre.renforts'));
    if (types.has('affamer') || types.has('desactiver_tour') || types.has('figer_tour') || types.has('aveugler')) c.push(t('bestiaire.contre.tours_gelees'));
    if (types.has('plonger') || types.has('invulnerabilite')) c.push(t('bestiaire.contre.intouchable'));
  }
  if (d.boss) c.push(t('bestiaire.contre.boss'));
  if (c.length === 0) c.push(t('bestiaire.contre.ordinaire'));
  return c;
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
  return contenuTourDeDonnees(e.famille, { niveau: e.palier, ...(e.voie ? { voie: e.voie } : {}) });
}
