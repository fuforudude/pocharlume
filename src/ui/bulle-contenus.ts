// Contenu des bulles de description (survol à la souris, appui long au doigt) : tours, améliorations, ennemis, héros et
// compétences. Logique pure, sans DOM : chaque chiffre est lu dans les données (src/data/) ou dans l'état de la partie,
// jamais recopié dans un texte, et les tournures viennent de src/i18n (fr-bulles.ts).
import { DIEUX, type IdDieu } from '../data/dieux';
import { DIFFICULTES } from '../data/difficultes';
import { ENNEMIS } from '../data/ennemis';
import { HEROS, type IdHeros } from '../data/heros';
import { RANG_MAX_COMPETENCE } from '../data/meta';
import { TOURS } from '../data/tours';
import { tourSurCase, valeurRevente } from '../engine';
import type {
  ActionEnnemi,
  CapacitesUnite,
  DefEnnemi,
  DefNiveauTour,
  EffetCoup,
  Fourchette,
  IdFamille,
  ModUnite,
  Niveau,
  PouvoirsEnnemi,
  TypeDegats,
  Voie,
  ZoneHeros,
} from '../engine/definitions';
import type { Ennemi, EtatPartie, FamilleTour } from '../engine/etat';
import { chercherParId } from '../engine/recherche';
import { PAS_PAR_SECONDE } from '../engine/temps';
import { defNiveau, statsTour } from '../engine/tours';
import { aTexte, t, tCle } from '../i18n';
import type { ElementMenu } from './menu-cercle';
import { texteRefus } from './refus';

/** Une ligne « libellé : valeur » de la bulle. */
export interface LigneBulle {
  readonly libelle: string;
  readonly valeur: string;
}

export interface ContenuBulle {
  readonly titre: string;
  /** Rôle d'une tour ou d'un héros, « Boss »… ; null s'il n'y a rien à dire. */
  readonly sousTitre: string | null;
  readonly lignes: readonly LigneBulle[];
  /** Phrases à part : particularités d'un ennemi, compétences d'une tour, verrou d'une compétence. */
  readonly notes: readonly string[];
  /** Texte d'ambiance (lore, description), en italique sous le reste ; null s'il n'y en a pas. */
  readonly texte: string | null;
}

/** Une caractéristique, identifiée par `cle` pour comparer deux états d'une même tour (avant → après). */
interface Carac extends LigneBulle {
  readonly cle: string;
}

// --- Mise en forme des nombres -------------------------------------------------------------------

/** Nombre à la française, deux décimales au plus (0,48 ; 3,5 ; 12). */
function nombre(n: number): string {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

/** Une fraction (0,3) en pourcentage entier (30). */
function pourcent(fraction: number): number {
  return Math.round(fraction * 100);
}

type CleTexte = Parameters<typeof t>[0];

/** Un nombre avec son unité accordée : singulier sous 2 (« 1,5 case »), pluriel au-delà (« 3 cases »). */
function accorde(n: number, un: CleTexte, plusieurs: CleTexte): string {
  return t(Math.abs(n) < 2 ? un : plusieurs, { n: nombre(n) });
}

function cases(n: number): string {
  return accorde(n, 'bulle.case_un', 'bulle.cases');
}

function fourchette(degats: Fourchette): string {
  return t('bulle.fourchette', { a: nombre(degats[0]), b: nombre(degats[1]) });
}

function texteDegats(degats: Fourchette, type: TypeDegats): string {
  return t(`bulle.degats.${type}`, { d: fourchette(degats) });
}

function cadence(secondes: number): string {
  return t('bulle.tour.cadence_valeur', { n: nombre(secondes) });
}

function texteEffet(e: EffetCoup): string {
  const texte =
    e.type === 'ralentissement'
      ? t('bulle.effet.ralentissement_valeur', { n: pourcent(1 - e.valeur), d: nombre(e.duree) })
      : e.type === 'etourdissement'
        ? t('bulle.effet.etourdissement_valeur', { d: nombre(e.duree) })
        : t('bulle.effet.degats_valeur', { n: nombre(e.valeur), d: nombre(e.duree) });
  return e.chance < 1 ? t('bulle.chance', { texte, c: pourcent(e.chance) }) : texte;
}

// --- Tours ---------------------------------------------------------------------------------------

/** Rassemble les caractéristiques dans l'ordre, une seule par clé. */
class Caracs {
  readonly liste: Carac[] = [];

  ajouter(cle: string, libelle: string, valeur: string): void {
    if (!this.liste.some((c) => c.cle === cle)) this.liste.push({ cle, libelle, valeur });
  }

  /** Chaque effet a sa ligne : deux effets du même type (celui de la tour et celui du dieu) sont tous les deux dits. */
  effets(effets: readonly EffetCoup[]): void {
    for (const e of effets) {
      const deja = this.liste.filter((c) => c.cle.startsWith(`effet:${e.type}:`)).length;
      this.ajouter(`effet:${e.type}:${String(deja)}`, t(`bulle.effet.${e.type}`), texteEffet(e));
    }
  }

  /** Pouvoirs d'une unité alliée (soldats d'une tour ou héros). */
  capacites(c: CapacitesUnite | undefined): void {
    if (!c) return;
    if (c.esquive > 0) this.ajouter('esquive', t('bulle.tour.esquive'), t('bulle.tour.esquive_valeur', { n: pourcent(c.esquive) }));
    if (c.critique && c.critique.chance > 0) {
      this.ajouter('critique', t('bulle.tour.critique'), t('bulle.tour.critique_valeur', { c: pourcent(c.critique.chance), m: nombre(c.critique.multiplicateur) }));
    }
    if (c.execution > 0) this.ajouter('execution', t('bulle.tour.execution'), t('bulle.tour.execution_valeur', { n: pourcent(c.execution) }));
    if (c.ignoreArmure > 0) this.ajouter('perceArmure', t('bulle.tour.perce_armure'), t('bulle.tour.perce_armure_valeur', { n: pourcent(c.ignoreArmure) }));
    if (c.rage > 0) this.ajouter('rage', t('bulle.heros.rage'), t('bulle.heros.rage_valeur', { n: pourcent(c.rage) }));
    if (c.regeneration > 0) this.ajouter('regeneration', t('bulle.tour.regeneration'), t('bulle.tour.regeneration_valeur', { n: nombre(c.regeneration) }));
    if (c.soin) this.ajouter('soin', t('bulle.heros.soin'), t('bulle.heros.soin_valeur', { p: pourcent(c.soin.quantite), s: nombre(c.soin.cadence) }));
    if (c.voitFurtifs) this.ajouter('furtifs', t('bulle.tour.furtifs'), t('bulle.heros.voit_furtifs'));
    if (!c.ciblable) this.ajouter('invisibles', t('bulle.tour.invisibles'), t('bulle.tour.invisibles_valeur'));
    const constructeur = c.ouvrage?.constructeur;
    if (constructeur) {
      const tourelle = constructeur.tourelle;
      this.ajouter(
        'tourelles',
        t('bulle.tour.tourelles'),
        t('bulle.tour.tourelles_valeur', { n: constructeur.max, s: nombre(constructeur.cadence), a: nombre(tourelle.degats[0]), b: nombre(tourelle.degats[1]), d: nombre(tourelle.duree) }),
      );
    }
    const pieges = c.ouvrage?.pieges;
    if (pieges) {
      this.ajouter('pieges', t('bulle.tour.pieges'), t('bulle.tour.pieges_valeur', { s: nombre(pieges.cadence), n: nombre(pieges.piege.degats), i: nombre(pieges.piege.immobilisation) }));
    }
  }
}

/** Ce que fait une tour d'après ses stats (brutes, ou effectives en partie). */
function caracsTour(def: DefNiveauTour): Carac[] {
  const c = new Caracs();
  if (def.degats[1] > 0) {
    c.ajouter('degats', t('bulle.tour.degats'), texteDegats(def.degats, def.typeDegats));
    if (def.cadence > 0) c.ajouter('cadence', t('bulle.tour.cadence'), cadence(def.cadence));
  }
  c.ajouter('portee', t(def.soldats ? 'bulle.tour.portee_ralliement' : 'bulle.tour.portee'), cases(def.portee));
  const volants = def.volants || def.atelier?.constructeur?.tourelle.volants === true;
  c.ajouter('volants', t('bulle.tour.volants'), t(volants ? 'bulle.oui' : 'bulle.non'));
  const s = def.soldats;
  if (s) {
    c.ajouter('soldats', t('bulle.tour.soldats'), t('bulle.tour.soldats_valeur', { n: s.nombre, nom: tCle(s.nom) }));
    c.ajouter('pvSoldats', t('bulle.tour.pv_soldats'), nombre(Math.round(s.pv)));
    c.ajouter('degatsSoldats', t('bulle.tour.degats_soldats'), fourchette(s.degats));
    c.ajouter('cadenceSoldats', t('bulle.tour.cadence'), cadence(s.cadence));
    if (s.coups > 1) c.ajouter('coupsSoldats', t('bulle.tour.coups_soldats'), String(s.coups));
    if (s.armure > 0) c.ajouter('armureSoldats', t('bulle.tour.armure_soldats'), t('bulle.ennemi.armure_valeur', { n: pourcent(s.armure) }));
    if (s.capacite > 1) c.ajouter('capaciteSoldats', t('bulle.tour.capacite_soldats'), String(s.capacite));
    c.capacites(s.capacites);
  }
  const sp = def.spectres;
  if (sp) {
    c.ajouter('spectres', t('bulle.tour.spectres'), t('bulle.tour.spectres_valeur', { n: sp.max, d: nombre(sp.duree) }));
    c.ajouter('pvSpectres', t('bulle.tour.pv_spectres'), nombre(Math.round(sp.pv)));
    c.ajouter('degatsSpectres', t('bulle.tour.degats_spectres'), fourchette(sp.degats));
  }
  if (def.zone > 0) c.ajouter('zone', t('bulle.tour.zone'), cases(def.zone));
  if (def.critique && def.critique.chance > 0) {
    c.ajouter('critique', t('bulle.tour.critique'), t('bulle.tour.critique_valeur', { c: pourcent(def.critique.chance), m: nombre(def.critique.multiplicateur) }));
  }
  if (def.chaine) c.ajouter('chaine', t('bulle.tour.chaine'), t('bulle.tour.chaine_valeur', { n: accorde(def.chaine.nombre, 'bulle.ennemi_un', 'bulle.ennemis'), p: pourcent(def.chaine.facteur) }));
  if (def.ignoreArmure > 0) c.ajouter('perceArmure', t('bulle.tour.perce_armure'), t('bulle.tour.perce_armure_valeur', { n: pourcent(def.ignoreArmure) }));
  if (def.revele) c.ajouter('furtifs', t('bulle.tour.furtifs'), t('bulle.tour.furtifs_valeur'));
  if (def.onde) c.ajouter('onde', t('bulle.tour.onde'), t('bulle.tour.onde_valeur'));
  c.effets(def.effets);
  if (s) c.effets(s.effets);
  if (def.nappe) c.ajouter('nappe', t('bulle.tour.nappe'), t('bulle.tour.nappe_valeur', { r: cases(def.nappe.rayon), d: nombre(def.nappe.duree) }));
  if (def.piegeAuSol) c.ajouter('piegesSol', t('bulle.tour.pieges_sol'), t('bulle.tour.pieges_sol_valeur', { c: pourcent(def.piegeAuSol.chance) }));
  if (def.atelier) c.capacites({ ...CAPACITES_SANS_POUVOIR, ouvrage: def.atelier });
  return c.liste;
}

const CAPACITES_SANS_POUVOIR: CapacitesUnite = {
  esquive: 0,
  execution: 0,
  ignoreArmure: 0,
  critique: null,
  rage: 0,
  regeneration: 0,
  soin: null,
  ciblable: true,
  voitFurtifs: false,
  distance: null,
  ouvrage: null,
};

/** Les lignes qui changent entre deux états d'une tour, « avant → après » ; ce qui ne change pas n'est pas répété. */
function difference(avant: readonly Carac[], apres: readonly Carac[]): LigneBulle[] {
  const lignes: LigneBulle[] = [];
  for (const c of apres) {
    const a = avant.find((x) => x.cle === c.cle);
    if (a?.valeur === c.valeur) continue;
    lignes.push({ libelle: c.libelle, valeur: t('bulle.avant_apres', { avant: a?.valeur ?? t('bulle.absent'), apres: c.valeur }) });
  }
  for (const a of avant) {
    if (!apres.some((x) => x.cle === a.cle)) lignes.push({ libelle: a.libelle, valeur: t('bulle.avant_apres', { avant: a.valeur, apres: t('bulle.absent') }) });
  }
  return lignes;
}

function lignes(caracs: readonly Carac[]): LigneBulle[] {
  return caracs.map(({ libelle, valeur }) => ({ libelle, valeur }));
}

/** Caractéristiques communes à toutes les tours (dégâts, cadence, portée, soldats de base) : ce qui n'est pas un pouvoir. */
const CARACS_DE_BASE: ReadonlySet<string> = new Set(['degats', 'cadence', 'portee', 'volants', 'soldats', 'pvSoldats', 'degatsSoldats', 'cadenceSoldats', 'zone']);

/** Les pouvoirs d'une tour (furtifs, spectres, chaîne, effets, critique…), d'après ses stats : tout sauf ses caractéristiques de base. */
export function pouvoirsTour(def: DefNiveauTour): LigneBulle[] {
  return lignes(caracsTour(def).filter((c) => !CARACS_DE_BASE.has(c.cle)));
}

function notesCompetences(def: DefNiveauTour): string[] {
  return def.competences.length > 0 ? [t('bulle.competences_tour', { noms: def.competences.map((c) => tCle(c.nom)).join(', ') })] : [];
}

/** Une tour d'après ses stats (brutes ou effectives) : rôle de sa famille, caractéristiques, compétences à acheter. */
export function contenuTour(def: DefNiveauTour, famille: FamilleTour, notes: readonly string[] = []): ContenuBulle {
  return { titre: tCle(def.nom), sousTitre: t(`bulle.role.${famille}`), lignes: lignes(caracsTour(def)), notes: [...notes, ...notesCompetences(def)], texte: null };
}

export interface ChoixTour {
  /** Niveau 1 à 3, ou 4 avec une voie (spécialisation) ; 1 par défaut. */
  readonly niveau?: 1 | 2 | 3 | 4;
  readonly voie?: Voie;
  /** Dieu de la tour divine (`famille` = `divine`) ; Plume par défaut. */
  readonly dieu?: IdDieu;
}

/** Une tour telle que la décrivent les données, hors partie (collection, fiche d'un niveau). */
export function contenuTourDeDonnees(famille: IdFamille | 'divine', choix: ChoixTour = {}): ContenuBulle {
  if (famille === 'divine') return contenuTour(DIEUX[choix.dieu ?? 'plume'].tourDivine, famille);
  const niveau = choix.niveau ?? 1;
  const def = niveau === 4 ? TOURS[famille].specialisations[choix.voie ?? 'A'] : TOURS[famille].niveaux[niveau - 1];
  if (!def) throw new Error(`Niveau de tour inconnu : ${famille} ${String(niveau)}`);
  return contenuTour(def, famille);
}

/**
 * Bulle d'un bouton du menu en cercle de la case (cx, cy) : la tour à construire (stats effectives de la partie), ce
 * qu'une amélioration ou une compétence change, le pouvoir d'une spécialisation, ce que rend la vente, le ralliement.
 * Un bouton refusé dit aussi pourquoi (le même texte que le message de refus).
 */
export function contenuElementMenu(etat: EtatPartie, cx: number, cy: number, element: ElementMenu): ContenuBulle | null {
  const contenu = contenuSansRefus(etat, cx, cy, element);
  if (!contenu || element.refus === null || element.refus === 'competence_au_maximum') return contenu;
  return { ...contenu, notes: [...contenu.notes, texteRefus(element.refus, element.deblocage)] };
}

function contenuSansRefus(etat: EtatPartie, cx: number, cy: number, element: ElementMenu): ContenuBulle | null {
  const [genre, detail] = element.id.split(':');
  if (genre === 'construire') {
    const famille = detail as FamilleTour;
    const def = defNiveau(etat, famille, 1, null);
    return def ? contenuTour(statsTour(etat, famille, def), famille) : null;
  }
  const tour = tourSurCase(etat, cx, cy);
  if (!tour) return null;
  const famille = tour.famille;
  if (genre === 'ameliorer') {
    const suivant = defNiveau(etat, famille, tour.niveau + 1, null);
    if (!suivant) return null;
    const apres = statsTour(etat, famille, suivant);
    return { titre: t('bulle.amelioration', { n: tour.niveau + 1 }), sousTitre: tCle(suivant.nom), lignes: difference(caracsTour(tour.stats), caracsTour(apres)), notes: [], texte: null };
  }
  if (genre === 'specialiser' && (detail === 'A' || detail === 'B')) {
    const def = defNiveau(etat, famille, 4, detail);
    return def ? contenuTour(statsTour(etat, famille, def), famille, [t('bulle.specialisation')]) : null;
  }
  if (genre === 'competence') {
    const base = defNiveau(etat, famille, tour.niveau, tour.voie);
    const i = tour.stats.competences.findIndex((c) => c.id === detail);
    const competence = tour.stats.competences[i];
    if (!base || !competence) return null;
    const rang = tour.rangs[i] ?? 0;
    const entete = { titre: tCle(competence.nom), sousTitre: t('bulle.competence_tour', { n: rang, m: RANG_MAX_COMPETENCE }), texte: tCle(competence.description) };
    if (rang >= RANG_MAX_COMPETENCE) return { ...entete, lignes: [], notes: [t('bulle.au_sommet')] };
    const rangs = tour.stats.competences.map((_, j) => (tour.rangs[j] ?? 0) + (j === i ? 1 : 0));
    const avant = statsTour(etat, famille, base, tour.rangs);
    const apres = statsTour(etat, famille, base, rangs);
    return { ...entete, lignes: difference(caracsTour(avant), caracsTour(apres)), notes: [] };
  }
  if (genre === 'vendre') {
    const rendu = valeurRevente(etat, cx, cy);
    return {
      titre: t('menu.vendre'),
      sousTitre: tCle(tour.stats.nom),
      lignes: [{ libelle: t('bulle.vendre.rendu'), valeur: accorde(rendu, 'bulle.arete_un', 'bulle.aretes') }],
      notes: [t('bulle.vendre.note')],
      texte: null,
    };
  }
  if (genre === 'ralliement') {
    return {
      titre: t('menu.ralliement'),
      sousTitre: tCle(tour.stats.nom),
      lignes: [{ libelle: t('bulle.tour.portee_ralliement'), valeur: cases(tour.stats.portee) }],
      notes: [t('bulle.ralliement.note')],
      texte: null,
    };
  }
  return null;
}

// --- Ennemis -------------------------------------------------------------------------------------

/** Ce qu'il faut d'un ennemi pour le décrire : ses données, ou son état en partie (difficulté et élite comprises). */
interface VueEnnemi {
  readonly id: string;
  readonly def: DefEnnemi;
  /** PV actuels en partie ; null hors partie. */
  readonly pv: number | null;
  readonly pvMax: number;
  readonly armure: number;
  readonly resistance: number;
  /** Cases par seconde, sans ralentissement. */
  readonly vitesse: number;
  readonly degats: Fourchette;
  readonly coutVies: number;
  readonly elite: boolean;
  /** Secondes entre deux soldats dévorés ; 0 = jamais. */
  readonly devore: number;
}

function protection(fraction: number, cle: 'bulle.ennemi.armure_valeur' | 'bulle.ennemi.resistance_valeur'): string {
  return fraction > 0 ? t(cle, { n: pourcent(fraction) }) : t('bulle.ennemi.aucune');
}

function texteAction(a: ActionEnnemi): string {
  switch (a.type) {
    case 'affamer':
      return t('bulle.ennemi.affamer', { n: pourcent(a.cadence), d: nombre(a.duree) });
    case 'desactiver_tour':
      return a.rayon === undefined
        ? t('bulle.ennemi.desactiver_tour', { d: nombre(a.duree) })
        : t('bulle.ennemi.desactiver_tour_rayon', { d: nombre(a.duree), r: nombre(a.rayon) });
    case 'invoquer': {
      const appele = Object.hasOwn(ENNEMIS, a.ennemi) ? tCle(ENNEMIS[a.ennemi as keyof typeof ENNEMIS].nom) : a.ennemi;
      return t('bulle.ennemi.invoquer', { n: a.nombre, nom: appele });
    }
    case 'plonger':
      return t('bulle.ennemi.plonger', { d: nombre(a.duree) });
    case 'figer_tour':
      return t('bulle.ennemi.figer_tour', { n: accorde(a.nombre, 'bulle.tour_un', 'bulle.tours'), d: nombre(a.duree) });
    case 'aveugler':
      return t('bulle.ennemi.aveugler', { n: pourcent(a.portee), d: nombre(a.duree) });
    case 'bannir':
      return t('bulle.ennemi.bannir', { d: nombre(a.etourdissement) });
    case 'relever_morts':
      return t('bulle.ennemi.relever_morts', { n: a.nombre });
    case 'charger':
      return t('bulle.ennemi.charger', { d: nombre(a.duree) });
    case 'invulnerabilite':
      return t('bulle.ennemi.invulnerabilite', { d: nombre(a.duree) });
    case 'desamorcer':
      return t('bulle.ennemi.desamorcer');
    case 'purifier':
      return t('bulle.ennemi.purifier');
    case 'terrifier':
      return t('bulle.ennemi.terrifier', { d: nombre(a.etourdissement) });
  }
}

function notesPouvoirs(p: PouvoirsEnnemi | undefined): string[] {
  if (!p) return [];
  const notes: string[] = [];
  if (p.brulure) notes.push(t('bulle.ennemi.brulure', { n: nombre(p.brulure.degats), d: nombre(p.brulure.duree) }));
  if (p.noyade) notes.push(t('bulle.ennemi.noyade', { d: nombre(p.noyade.delai) }));
  if (p.drain) notes.push(t('bulle.ennemi.drain', { n: nombre(p.drain.degats) }));
  if (p.soin) notes.push(t('bulle.ennemi.soin', { p: pourcent(p.soin.quantite), s: nombre(p.soin.cadence) }));
  if (p.nuage) notes.push(t('bulle.ennemi.nuage', { n: nombre(p.nuage.degats), d: nombre(p.nuage.duree) }));
  if (p.relevement) {
    const r = p.relevement;
    notes.push(t(r.sauf === 'magique' ? 'bulle.ennemi.relevement_sauf' : 'bulle.ennemi.relevement', { n: r.fois, p: pourcent(r.pv) }));
  }
  if (p.enterrement) notes.push(t('bulle.ennemi.enterrement', { n: nombre(p.enterrement.facteur) }));
  if (p.aura) notes.push(t('bulle.ennemi.aura', { n: pourcent(p.aura.vitesse) }));
  if (p.renversement) notes.push(t('bulle.ennemi.renversement', { d: nombre(p.renversement.etourdissement) }));
  if (p.rage) notes.push(t('bulle.ennemi.rage', { p: pourcent(p.rage.pv), v: pourcent(p.rage.vitesse), d: pourcent(p.rage.degats) }));
  if (p.bouclier) notes.push(t('bulle.ennemi.bouclier', { n: pourcent(p.bouclier.reduction) }));
  if (p.explosion) notes.push(t('bulle.ennemi.explosion', { n: nombre(p.explosion.degats) }));
  if (p.bond) notes.push(t('bulle.ennemi.bond', { d: nombre(p.bond.recharge) }));
  if (p.vol) notes.push(t('bulle.ennemi.vol', { n: p.vol.aretes }));
  if (p.auraProtection) notes.push(t('bulle.ennemi.aura_protection', { n: pourcent(p.auraProtection.reduction) }));
  if (p.division) {
    const nom = Object.hasOwn(ENNEMIS, p.division.ennemi) ? tCle(ENNEMIS[p.division.ennemi as keyof typeof ENNEMIS].nom) : p.division.ennemi;
    notes.push(t('bulle.ennemi.division', { n: p.division.nombre, nom }));
  }
  if (p.regeneration) notes.push(t('bulle.ennemi.regeneration', { n: pourcent(p.regeneration.quantite) }));
  if (p.epines) notes.push(t('bulle.ennemi.epines', { n: nombre(p.epines.degats) }));
  if (p.alternance) notes.push(t('bulle.ennemi.alternance', { d: nombre(p.alternance.periode) }));
  if (p.derniereLueur) notes.push(t('bulle.ennemi.derniere_lueur', { p: pourcent(p.derniereLueur.quantite) }));
  if (p.insaisissable) notes.push(t('bulle.ennemi.insaisissable'));
  if (p.insensibleRalentissement) notes.push(t('bulle.ennemi.insensible_ralentissement'));
  if (p.degatsHeros !== undefined && p.degatsHeros !== 1) notes.push(t('bulle.ennemi.degats_heros', { n: nombre(p.degatsHeros) }));
  if (p.essaim !== undefined && p.essaim > 1) notes.push(t('bulle.ennemi.essaim', { n: p.essaim }));
  // Les actions des boss (paliers de PV, actions périodiques), chacune dite une fois.
  const vues = new Set<string>();
  for (const a of [...(p.paliers ?? []).flatMap((x) => x.actions), ...(p.periodiques ?? []).flatMap((x) => x.actions)]) {
    if (vues.has(a.type)) continue;
    vues.add(a.type);
    notes.push(texteAction(a));
  }
  return notes;
}

function contenuDeVue(v: VueEnnemi): ContenuBulle {
  const d = v.def;
  const pv = v.pv === null ? nombre(Math.round(v.pvMax)) : t('bulle.pv_valeur', { n: Math.max(0, Math.round(v.pv)), m: Math.round(v.pvMax) });
  const lignesEnnemi: LigneBulle[] = [
    { libelle: t('bulle.pv'), valeur: pv },
    { libelle: t('bulle.ennemi.armure'), valeur: protection(v.armure, 'bulle.ennemi.armure_valeur') },
    { libelle: t('bulle.ennemi.resistance'), valeur: protection(v.resistance, 'bulle.ennemi.resistance_valeur') },
    { libelle: t('bulle.ennemi.vitesse'), valeur: t('bulle.ennemi.vitesse_valeur', { n: cases(v.vitesse) }) },
  ];
  if (v.degats[1] > 0) lignesEnnemi.push({ libelle: t('bulle.ennemi.coups'), valeur: fourchette(v.degats) });
  if (d.distance) {
    lignesEnnemi.push({ libelle: t('bulle.ennemi.tir'), valeur: t('bulle.ennemi.tir_valeur', { d: texteDegats(d.distance.degats, d.distance.typeDegats), p: cases(d.distance.portee) }) });
  }
  lignesEnnemi.push({ libelle: t('bulle.ennemi.vies'), valeur: String(v.coutVies) });
  const notes: string[] = [];
  if (v.elite) notes.push(t('bulle.ennemi.elite'));
  if (d.volant) notes.push(t('bulle.ennemi.volant'));
  if (d.furtif) notes.push(t('bulle.ennemi.furtif'));
  if (d.insensibleEtourdissement) notes.push(t('bulle.ennemi.inarretable'));
  if (v.devore > 0) notes.push(t('bulle.ennemi.devore', { n: nombre(v.devore) }));
  notes.push(...notesPouvoirs(d.pouvoirs));
  const lore = `ennemi.${v.id}.desc`;
  return {
    titre: tCle(d.nom),
    sousTitre: d.boss ? t('bulle.ennemi.boss') : null,
    lignes: lignesEnnemi,
    notes,
    texte: aTexte(lore) ? tCle(lore) : null,
  };
}

function defEnnemiDe(id: string): DefEnnemi {
  if (!Object.hasOwn(ENNEMIS, id)) throw new Error(`Ennemi inconnu : ${id}`);
  return ENNEMIS[id as keyof typeof ENNEMIS];
}

/** Un ennemi tel que le décrivent les données (fiche d'un niveau) ; `difficulte` ajuste ses PV comme en partie. */
export function contenuEnnemiDeDonnees(id: string, difficulte?: string): ContenuBulle {
  const def = defEnnemiDe(id);
  // Avec une difficulté (fiche d'un niveau), les PV sont ceux qu'il aura en partie, comme le fait `ajouterEnnemi`.
  const facteur = difficulte !== undefined && Object.hasOwn(DIFFICULTES, difficulte) ? DIFFICULTES[difficulte as keyof typeof DIFFICULTES].pvEnnemis : 1;
  return contenuDeVue({
    id,
    def,
    pv: null,
    pvMax: def.pv * facteur,
    armure: def.armure,
    resistance: def.resistance,
    vitesse: def.vitesse,
    degats: def.degats,
    coutVies: def.coutVies,
    elite: false,
    devore: def.devore,
  });
}

/** Un ennemi en partie : ses PV actuels et ce que la difficulté et l'élite ont changé. */
export function contenuEnnemi(e: Ennemi): ContenuBulle {
  return contenuDeVue({
    id: e.type,
    def: defEnnemiDe(e.type),
    pv: e.pv,
    pvMax: e.pvMax,
    armure: e.armure,
    resistance: e.resistance,
    vitesse: e.vitesse * PAS_PAR_SECONDE,
    degats: [e.degatsMin, e.degatsMax],
    coutVies: e.coutVies,
    elite: e.elite,
    devore: e.devore / PAS_PAR_SECONDE,
  });
}

/** Le boss annoncé par un niveau (le premier ennemi boss de ses vagues), null s'il n'en a pas. */
export function bossDuNiveau(niveau: Niveau): string | null {
  for (const vague of niveau.vagues) {
    for (const paquet of vague.paquets) {
      if (Object.hasOwn(ENNEMIS, paquet.ennemi) && ENNEMIS[paquet.ennemi as keyof typeof ENNEMIS].boss) return paquet.ennemi;
    }
  }
  return null;
}

/** Décalage entre le pied d'un ennemi et le centre de son sprite, en tuiles : on désigne son corps. */
const CENTRE_SPRITE = 0.5;

/** L'ennemi vivant le plus proche du point (x, y) (tuiles), à moins de `rayon` tuiles ; null s'il n'y en a pas. */
export function ennemiSous(etat: EtatPartie, x: number, y: number, rayon: number): Ennemi | null {
  let meilleur: Ennemi | null = null;
  let distance = rayon * rayon;
  for (const e of etat.ennemis) {
    if (!e.vivant) continue;
    const dx = e.x - x;
    const dy = e.y - CENTRE_SPRITE - y;
    const d = dx * dx + dy * dy;
    if (d <= distance) {
      distance = d;
      meilleur = e;
    }
  }
  return meilleur;
}

// --- Héros ---------------------------------------------------------------------------------------

function idHeros(id: string): IdHeros | null {
  return Object.hasOwn(HEROS, id) ? (id as IdHeros) : null;
}

/** Le héros de la partie : PV actuels, attaque, pouvoirs et rangs de ses compétences. */
export function contenuHerosEnPartie(etat: EtatPartie): ContenuBulle | null {
  const id = idHeros(etat.config.heros);
  const unite = chercherParId(etat.unites, etat.heros);
  if (!id || !unite) return null;
  const def = HEROS[id];
  const s = unite.stats;
  const c = new Caracs();
  c.ajouter('pv', t('bulle.pv'), t('bulle.pv_valeur', { n: unite.mort ? 0 : Math.max(0, Math.round(unite.pv)), m: Math.round(s.pv) }));
  const distance = s.capacites?.distance ?? null;
  const degats = distance ? distance.degats : s.degats;
  if (degats[1] > 0) {
    c.ajouter('degats', t('bulle.heros.degats'), texteDegats(degats, distance ? distance.typeDegats : 'physique'));
    c.ajouter('cadence', t('bulle.heros.cadence'), cadence(distance ? distance.cadence : s.cadence));
  }
  c.ajouter('portee', t('bulle.heros.portee'), cases(distance ? distance.portee : s.portee));
  if (s.armure > 0) c.ajouter('armure', t('bulle.heros.armure'), t('bulle.ennemi.armure_valeur', { n: pourcent(s.armure) }));
  if (s.resistance > 0) c.ajouter('resistance', t('bulle.ennemi.resistance'), t('bulle.ennemi.resistance_valeur', { n: pourcent(s.resistance) }));
  if (s.capacite > 1) c.ajouter('capacite', t('bulle.heros.capacite'), String(s.capacite));
  const zone: ZoneHeros | null = unite.zone;
  if (zone) c.ajouter('zone', t('bulle.heros.zone'), t('bulle.heros.zone_valeur', { r: cases(zone.rayon) }));
  c.capacites(s.capacites);
  c.effets(s.effets);
  if (zone) c.effets(zone.effets);
  if (distance) c.effets(distance.effets);
  const apprises = def.competences
    .map((comp) => ({ comp, rang: Object.hasOwn(etat.config.competencesHeros, comp.id) ? (etat.config.competencesHeros[comp.id] ?? 0) : 0 }))
    .filter((x) => x.rang > 0)
    .map((x) => t('bulle.heros.competence_rang', { nom: tCle(x.comp.nom), n: x.rang, m: x.comp.rangMax }));
  if (apprises.length > 0) c.ajouter('competences', t('bulle.heros.competences'), apprises.join(', '));
  return { titre: tCle(def.nom), sousTitre: tCle(def.role), lignes: lignes(c.liste), notes: [], texte: null };
}

/** Ce qu'un rang de compétence de héros ajoute, en clair (« +4 % d'esquive, +8 % de dégâts »). */
function texteMod(m: ModUnite): string {
  const morceaux: string[] = [];
  const fraction = (valeur: number, cle: CleTexte): void => {
    if (valeur !== 0) morceaux.push(t(cle, { n: pourcent(valeur) }));
  };
  const brut = (valeur: number, cle: CleTexte): void => {
    if (valeur !== 0) morceaux.push(t(cle, { n: nombre(valeur) }));
  };
  /** La valeur entre dans le texte déjà mise en forme (unité accordée). */
  const avec = (valeur: number, cle: CleTexte, texte: string): void => {
    if (valeur !== 0) morceaux.push(t(cle, { n: texte }));
  };
  const entier = (valeur: number, un: CleTexte, plusieurs: CleTexte): void => {
    if (valeur !== 0) morceaux.push(accorde(valeur, un, plusieurs));
  };
  // Armure et soin s'ajoutent à une part (0,3 + 0,1) : ce sont des points, pas un pourcentage de la valeur actuelle.
  const points = (valeur: number): string => accorde(pourcent(valeur), 'bulle.point_un', 'bulle.points');
  fraction(m.pv, 'bulle.mod.pv');
  fraction(m.degats, 'bulle.mod.degats');
  fraction(m.cadence, 'bulle.mod.cadence');
  avec(m.armure, 'bulle.mod.armure', points(m.armure));
  fraction(m.vitesse, 'bulle.mod.vitesse');
  avec(m.portee, 'bulle.mod.portee', cases(m.portee));
  entier(m.capacite, 'bulle.mod.capacite_un', 'bulle.mod.capacite');
  fraction(m.esquive, 'bulle.mod.esquive');
  fraction(m.execution, 'bulle.mod.execution');
  fraction(m.ignoreArmure, 'bulle.mod.ignore_armure');
  fraction(m.critique, 'bulle.mod.critique');
  brut(m.regeneration, 'bulle.mod.regeneration');
  fraction(m.rage, 'bulle.mod.rage');
  avec(m.zone, 'bulle.mod.zone', cases(m.zone));
  avec(m.soin, 'bulle.mod.soin', points(m.soin));
  entier(m.nombreOuvrages, 'bulle.mod.nombre_ouvrages_un', 'bulle.mod.nombre_ouvrages');
  fraction(m.cadenceOuvrages, 'bulle.mod.cadence_ouvrages');
  fraction(m.degatsOuvrages, 'bulle.mod.degats_ouvrages');
  return morceaux.join(', ');
}

/**
 * Une compétence de héros (écran des héros) : ce qu'elle donne au rang `rang` et au suivant. `verrouillee` : le héros
 * n'a pas encore le niveau qu'elle demande.
 */
export function contenuCompetenceHeros(heros: IdHeros, index: number, rang: number, verrouillee = false): ContenuBulle {
  const def = HEROS[heros];
  const c = def.competences[index];
  if (!c) throw new Error(`Compétence inconnue : ${heros} ${String(index)}`);
  const lignesComp: LigneBulle[] = [
    { libelle: t('bulle.comp.rang_actuel', { n: rang, m: c.rangMax }), valeur: rang > 0 ? texteMod(c.rangs[Math.min(rang, c.rangs.length) - 1] ?? c.rangs[0]) : t('bulle.comp.pas_apprise') },
  ];
  const suivant = rang < c.rangMax ? c.rangs[rang] : undefined;
  if (suivant) lignesComp.push({ libelle: t('bulle.comp.rang_suivant', { n: rang + 1, m: c.rangMax }), valeur: texteMod(suivant) });
  const notes: string[] = [];
  if (verrouillee) notes.push(t('bulle.comp.verrouillee', { n: c.niveauRequis }));
  if (rang >= c.rangMax) notes.push(t('bulle.au_sommet'));
  return { titre: tCle(c.nom), sousTitre: c.ultime ? t('bulle.comp.ultime') : tCle(def.role), lignes: lignesComp, notes, texte: tCle(c.description) };
}
