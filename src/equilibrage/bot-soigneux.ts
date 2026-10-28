// Bot « soigneux » : un bon joueur. Il connaît la carte (longueur de chemin que chaque socle couvre, poids de
// chaque chemin dans les vagues) et achète toujours ce qui rapporte le plus de puissance par arête dépensée
// (recherche gloutonne sur le choix du socle, de la famille, du niveau et de la spécialisation), bonus et remise
// de famille de son dieu compris. Il place son héros là où ses tours concentrent leur feu, joue les sorts de
// chaque dieu selon leur effet (zones de dégâts sur les grappes, Renforts et Voile de Nuit devant la zone de feu,
// Pièges à Ressort un peu avant, Griffes d'Ombre sur la plus grosse grappe, Ingéniosité au cœur des tours),
// construit la tour divine de son dieu, et appelle la vague suivante dès que le terrain est vide et qu'il n'a
// plus rien à acheter. Il sait ce que ne touchent pas les tours (la caserne et l'artillerie ignorent les volants : leur valeur
// baisse de la part de volants du niveau) et qu'il faut au moins une tour de Guetteurs des Toits par chemin pour révéler les
// furtifs. Une petite recherche en amont (`optimiserBot`) choisit parmi quelques variantes de
// préférence de famille celle qui joue le mieux le niveau, en simulant des parties d'entraînement.
import { ajusterMontant, validerAction } from '../engine';
import type { Action, BonusFamille, DefDieu, DefNiveauTour, DefSort, Ennemi, EtatPartie, IdFamille, Niveau, Point, Tour, Voie } from '../engine';
import { DIEUX } from '../data/dieux';
import { dpsEfficace } from '../data/equilibrage';
import { REGLES } from '../data/regles';
import { FAMILLES, TOURS } from '../data/tours';
import { distance, echantillonner, longueurVue, partsSpeciales, poidsDesChemins, type Echantillon } from './geometrie';
import { jouerPartie, type Bot, type Joueur, type ResultatPartie } from './simulation';

/** Une préférence de famille : le poids multiplie la valeur d'une tour de cette famille. */
export interface VarianteSoigneux {
  readonly nom: string;
  readonly poids: Readonly<Record<IdFamille, number>>;
  /** Décote par tour de la même famille déjà posée : la valeur d'une tour est divisée par 1 + diversité × (autres tours de sa famille). */
  readonly diversite?: number;
}

const EQUILIBREE: VarianteSoigneux = { nom: 'équilibrée', poids: { caserne: 1, tir: 1, magie: 1, artillerie: 1 } };

/** Préférences de famille essayées par la recherche : tout équilibré, ou une famille un peu plus aimée. */
const PREFERENCES: readonly Pick<VarianteSoigneux, 'nom' | 'poids'>[] = [
  EQUILIBREE,
  { nom: 'tir', poids: { caserne: 0.8, tir: 1.4, magie: 0.9, artillerie: 0.9 } },
  { nom: 'artillerie', poids: { caserne: 0.8, tir: 0.9, magie: 0.9, artillerie: 1.4 } },
  { nom: 'magie', poids: { caserne: 0.8, tir: 0.9, magie: 1.4, artillerie: 0.9 } },
  { nom: 'caserne', poids: { caserne: 1.5, tir: 0.9, magie: 0.9, artillerie: 0.9 } },
];

/** Diversités essayées : de peu à fortement décotée la famille déjà bien représentée. */
const DIVERSITES: readonly number[] = [0.4, 1];

/** La variante du bot soigneux quand on ne lui en donne pas. */
const VARIANTE_PAR_DEFAUT: VarianteSoigneux = { ...EQUILIBREE, diversite: 0.4 };

/** Les variantes de la recherche : chaque préférence avec chaque diversité. */
export const VARIANTES: readonly VarianteSoigneux[] = DIVERSITES.flatMap((diversite) =>
  PREFERENCES.map((p) => ({ ...p, nom: `${p.nom}, diversité ${String(diversite)}`, diversite })),
);

export interface OptionsSoigneux {
  readonly variante?: VarianteSoigneux;
  /** Appelle la vague suivante dès que le terrain est vide et qu'il n'y a plus rien à acheter. */
  readonly appelerEnAvance?: boolean;
  /** Utilise le héros et les sorts. */
  readonly sorts?: boolean;
  /** Construit la tour divine du dieu (oui par défaut, pour les trois dieux). */
  readonly tourDivine?: boolean;
}

interface Candidat {
  readonly action: Action;
  readonly ratio: number;
}

const dieux: Readonly<Record<string, DefDieu>> = DIEUX;

/** Part de menace furtive à partir de laquelle le bot se soucie des Guetteurs des Toits. */
const PART_FURTIFS_MIN = 0.02;

function dpsMoyen(def: DefNiveauTour): number {
  const dps = dpsEfficace(def);
  return dps.reduce((a, b) => a + b, 0) / dps.length;
}

/** Le niveau de tour tel que le bonus de famille du dieu le rend (cadence, critique, PV des soldats) : ce que le joueur voit. */
function avecBonus(def: DefNiveauTour, famille: IdFamille, bonus: BonusFamille): DefNiveauTour {
  if (bonus.famille !== famille) return def;
  const critique =
    bonus.chanceCritique > 0
      ? { chance: (def.critique?.chance ?? 0) + bonus.chanceCritique, multiplicateur: def.critique?.multiplicateur ?? REGLES.multiplicateurCritique }
      : def.critique;
  return {
    ...def,
    cadence: def.cadence > 0 ? def.cadence / (1 + bonus.cadence) : def.cadence,
    critique,
    soldats: def.soldats ? { ...def.soldats, pv: def.soldats.pv * (1 + bonus.pvSoldats) } : null,
  };
}

/** Prix d'un niveau de tour pour ce dieu : remise (ou majoration) de famille comprise. */
function prixDe(def: DefNiveauTour, famille: IdFamille, bonus: BonusFamille): number {
  return bonus.famille === famille ? ajusterMontant(def.cout, 1 + bonus.prix) : def.cout;
}

/** Le défi Fer n'autorise que deux familles de tours ; hors Fer, toutes. */
function famillePermise(etat: EtatPartie, famille: IdFamille): boolean {
  if (etat.config.defi !== 'fer') return true;
  return etat.niveau.defiFer?.familles.includes(famille) ?? true;
}

function defCourante(tour: Tour): DefNiveauTour | undefined {
  if (tour.famille === 'divine') return undefined;
  const famille = TOURS[tour.famille];
  if (tour.niveau <= 3) return famille.niveaux[tour.niveau - 1];
  return tour.voie ? famille.specialisations[tour.voie] : undefined;
}

export function creerBotSoigneux(options: OptionsSoigneux = {}): Bot {
  const variante = options.variante ?? VARIANTE_PAR_DEFAUT;
  const appelerEnAvance = options.appelerEnAvance ?? true;
  const utiliserSorts = options.sorts ?? true;

  let echantillons: Echantillon[] = [];
  let poids: number[] = [];
  let parts = { volants: 0, furtifs: 0 };
  const vues = new Map<string, number>();
  const dpsParDef = new Map<DefNiveauTour, number>();
  const dpsAvecBonusParDef = new Map<DefNiveauTour, number>();
  let zones: (Echantillon | undefined)[] = [];
  let clefZones = -1;
  let dernierOrdreHeros: Point | null = null;

  function vue(etat: EtatPartie, socle: number, portee: number): number {
    const clef = `${String(socle)}:${String(portee)}`;
    let v = vues.get(clef);
    if (v === undefined) {
      const s = etat.niveau.carte.socles[socle];
      v = s ? longueurVue(echantillons, poids, s, portee) : 0;
      vues.set(clef, v);
    }
    return v;
  }

  function dps(def: DefNiveauTour): number {
    let v = dpsParDef.get(def);
    if (v === undefined) {
      v = dpsMoyen(def);
      dpsParDef.set(def, v);
    }
    return v;
  }

  function bonusDuDieu(etat: EtatPartie): BonusFamille | undefined {
    return dieux[etat.config.dieu]?.bonus;
  }

  /** DPS d'un niveau de tour d'une famille, bonus de famille du dieu compris (les tours posées le portent déjà dans leurs stats). */
  function dpsFamille(etat: EtatPartie, def: DefNiveauTour, famille: IdFamille): number {
    const bonus = bonusDuDieu(etat);
    if (!bonus || bonus.famille !== famille) return dps(def);
    let v = dpsAvecBonusParDef.get(def);
    if (v === undefined) {
      v = dpsMoyen(avecBonus(def, famille, bonus));
      dpsAvecBonusParDef.set(def, v);
    }
    return v;
  }

  function cout(etat: EtatPartie, def: DefNiveauTour, famille: IdFamille): number {
    const bonus = bonusDuDieu(etat);
    return bonus ? prixDe(def, famille, bonus) : def.cout;
  }

  function valeur(etat: EtatPartie, socle: number, def: DefNiveauTour, famille: IdFamille): number {
    const memeFamille = etat.tours.filter((t) => t.famille === famille && t.socle !== socle).length;
    // Une tour qui ne touche pas les volants perd la part de menace qu'ils représentent (rien à retrancher quand il n'y en a pas).
    const touchee = def.volants ? 1 : 1 - parts.volants;
    return (dpsFamille(etat, def, famille) * touchee * vue(etat, socle, def.portee) * variante.poids[famille]) / (1 + (variante.diversite ?? 0) * memeFamille);
  }

  /** Tous les achats possibles (construction, amélioration, spécialisation), classés par valeur gagnée par arête. */
  function candidats(etat: EtatPartie): Candidat[] {
    const liste: Candidat[] = [];
    etat.niveau.carte.socles.forEach((_, socle) => {
      const tour = etat.tours.find((t) => t.socle === socle);
      if (!tour) {
        for (const famille of FAMILLES.filter((f) => famillePermise(etat, f))) {
          const def = TOURS[famille].niveaux[0];
          liste.push({ action: { type: 'construire', socle, tour: famille }, ratio: valeur(etat, socle, def, famille) / cout(etat, def, famille) });
        }
        return;
      }
      const actuelle = defCourante(tour);
      if (tour.famille === 'divine' || !actuelle || tour.niveau >= 4) return;
      const famille = TOURS[tour.famille];
      const avant = valeur(etat, socle, actuelle, tour.famille);
      if (tour.niveau < 3) {
        const suivante = famille.niveaux[tour.niveau];
        if (suivante) liste.push({ action: { type: 'ameliorer', socle }, ratio: (valeur(etat, socle, suivante, tour.famille) - avant) / cout(etat, suivante, tour.famille) });
        return;
      }
      for (const voie of ['A', 'B'] as const satisfies readonly Voie[]) {
        const spe = famille.specialisations[voie];
        liste.push({ action: { type: 'specialiser', socle, voie }, ratio: (valeur(etat, socle, spe, tour.famille) - avant) / cout(etat, spe, tour.famille) });
      }
    });
    liste.sort((a, b) => b.ratio - a.ratio);
    const divine = candidatDivine(etat, liste[0]?.ratio ?? 0);
    if (divine) liste.unshift(divine);
    const guetteurs = candidatGuetteurs(etat, liste[0]?.ratio ?? 0);
    if (guetteurs) liste.unshift(guetteurs);
    return liste;
  }

  /**
   * Contre les furtifs, une tour de Guetteurs des Toits (spécialisation A de la tour de tir, qui révèle les furtifs à portée)
   * par chemin : la tour de tir la plus avancée est montée puis spécialisée, ou construite sur le socle qui voit le plus de
   * chemin. Une valeur juste au-dessus du meilleur autre achat : le bot économise jusqu'à pouvoir la payer.
   */
  function candidatGuetteurs(etat: EtatPartie, meilleurRatio: number): Candidat | null {
    if (parts.furtifs < PART_FURTIFS_MIN || !famillePermise(etat, 'tir')) return null;
    const requis = etat.niveau.carte.chemins.length;
    if (etat.tours.filter((t) => t.famille === 'tir' && t.voie === 'A').length >= requis) return null;
    const tir = etat.tours.filter((t) => t.famille === 'tir' && t.voie !== 'A').sort((a, b) => b.niveau - a.niveau)[0];
    const ratio = meilleurRatio * 1.02;
    if (tir) {
      if (tir.niveau >= 3) return { action: { type: 'specialiser', socle: tir.socle, voie: 'A' }, ratio };
      return { action: { type: 'ameliorer', socle: tir.socle }, ratio };
    }
    let socle = -1;
    let meilleurVue = -1;
    etat.niveau.carte.socles.forEach((_, i) => {
      if (etat.tours.some((t) => t.socle === i)) return;
      const v = vue(etat, i, TOURS.tir.niveaux[0].portee);
      if (v > meilleurVue) {
        meilleurVue = v;
        socle = i;
      }
    });
    return socle < 0 ? null : { action: { type: 'construire', socle, tour: 'tir' }, ratio };
  }

  /**
   * La tour divine, dès que la défense compte trois tours : sur le socle libre qui voit le plus de chemin, avec une
   * valeur juste au-dessus du meilleur autre achat (le bot ne sait pas la chiffrer comme une tour ordinaire).
   */
  function candidatDivine(etat: EtatPartie, meilleurRatio: number): Candidat | null {
    if (!(options.tourDivine ?? true)) return null;
    const dieu = dieux[etat.config.dieu];
    if (!dieu || etat.tours.length < 3 || etat.tours.some((t) => t.famille === 'divine')) return null;
    // Au défi Fer, la tour divine suit la famille de son dieu : elle n'est permise que si cette famille l'est.
    if (!famillePermise(etat, dieu.bonus.famille)) return null;
    let socle = -1;
    let meilleurVue = -1;
    etat.niveau.carte.socles.forEach((_, i) => {
      if (etat.tours.some((t) => t.socle === i)) return;
      const v = vue(etat, i, dieu.tourDivine.portee);
      if (v > meilleurVue) {
        meilleurVue = v;
        socle = i;
      }
    });
    return socle < 0 ? null : { action: { type: 'construire', socle, tour: 'divine' }, ratio: meilleurRatio * 1.01 };
  }

  /** Achat de ce tour-ci : le meilleur s'il est payable, sinon un presque aussi bon qui l'est, sinon on économise. */
  function acheter(etat: EtatPartie): Action | null {
    const liste = candidats(etat);
    const meilleur = liste[0];
    if (!meilleur) return null;
    for (const c of liste) {
      if (c.ratio < meilleur.ratio * 0.75) break;
      if (validerAction(etat, c.action) === null) return c.action;
    }
    return null;
  }

  /** Point de chaque chemin où les tours posées concentrent le plus de feu. */
  function calculerZones(etat: EtatPartie): void {
    const clef = etat.tours.reduce((a, t) => a + t.coutCumule + 1000 * t.socle, 0);
    if (clef === clefZones) return;
    clefZones = clef;
    zones = etat.chemins.map((_, chemin) => {
      let meilleur: Echantillon | undefined;
      let max = 0;
      for (const e of echantillons) {
        if (e.chemin !== chemin) continue;
        let somme = 0;
        for (const t of etat.tours) if (distance(t, e) <= t.stats.portee) somme += dps(t.stats);
        if (somme > max) {
          max = somme;
          meilleur = e;
        }
      }
      return meilleur;
    });
  }

  function ordreHeros(etat: EtatPartie): Action | null {
    calculerZones(etat);
    let cheminCle = 0;
    poids.forEach((p, i) => {
      if (p > (poids[cheminCle] ?? 0)) cheminCle = i;
    });
    const zone = zones[cheminCle];
    if (!zone) return null;
    if (dernierOrdreHeros && distance(dernierOrdreHeros, zone) < 0.3) return null;
    const action: Action = { type: 'deplacerHeros', x: zone.x, y: zone.y };
    if (validerAction(etat, action) !== null) return null;
    dernierOrdreHeros = { x: zone.x, y: zone.y };
    return action;
  }

  /** Pièges à Ressort : sur le chemin, un peu avant la zone de feu, quand des ennemis s'en approchent. */
  function viserPieges(etat: EtatPartie, emplacement: number): Action | null {
    calculerZones(etat);
    for (let chemin = 0; chemin < zones.length; chemin++) {
      const zone = zones[chemin];
      if (!zone) continue;
      const venant = etat.ennemis.some((e) => e.vivant && e.chemin === chemin && e.distance >= zone.distance - 7 && e.distance <= zone.distance - 1);
      if (!venant) continue;
      // Le point du chemin deux tuiles avant la zone de feu.
      let devant: Echantillon | undefined;
      for (const e of echantillons) {
        if (e.chemin === chemin && (!devant || Math.abs(e.distance - (zone.distance - 2)) < Math.abs(devant.distance - (zone.distance - 2)))) devant = e;
      }
      if (devant) return { type: 'lancerSort', emplacement, x: devant.x, y: devant.y };
    }
    return null;
  }

  /**
   * Ingéniosité : au cœur du plus gros groupe de tours (une tour seule fait l'affaire : les arêtes du sort sont
   * gagnées de toute façon), quand des ennemis sont à portée de l'une d'elles.
   */
  function viserBoost(etat: EtatPartie, sort: DefSort, emplacement: number): Action | null {
    const r2 = sort.rayon * sort.rayon;
    let centre: Tour | undefined;
    let meilleur = 0;
    for (const t of etat.tours) {
      let voisines = 0;
      for (const autre of etat.tours) if ((t.x - autre.x) * (t.x - autre.x) + (t.y - autre.y) * (t.y - autre.y) <= r2) voisines++;
      if (voisines > meilleur) {
        meilleur = voisines;
        centre = t;
      }
    }
    if (!centre) return null;
    const c = centre;
    const portee2 = (sort.rayon + 2) * (sort.rayon + 2);
    const pressant = etat.ennemis.some((e) => e.vivant && (e.x - c.x) * (e.x - c.x) + (e.y - c.y) * (e.y - c.y) <= portee2);
    return pressant ? { type: 'lancerSort', emplacement, x: c.x, y: c.y } : null;
  }

  /** Compte les ennemis (hors boss, et le boss à part) dans le rayon du sort autour de chacun d'eux, et garde la plus grosse grappe. */
  function plusGrosseGrappe(ennemis: readonly Ennemi[], rayon: number): { x: number; y: number; nombre: number; boss: boolean } | null {
    let meilleur: { x: number; y: number; nombre: number; boss: boolean } | null = null;
    const r2 = rayon * rayon;
    for (const e of ennemis) {
      let nombre = 0;
      let boss = false;
      for (const autre of ennemis) {
        if ((e.x - autre.x) * (e.x - autre.x) + (e.y - autre.y) * (e.y - autre.y) <= r2) {
          nombre++;
          boss ||= autre.boss;
        }
      }
      if (!meilleur || nombre > meilleur.nombre || (nombre === meilleur.nombre && boss && !meilleur.boss)) meilleur = { x: e.x, y: e.y, nombre, boss };
    }
    return meilleur;
  }

  /** Voile de Nuit : sur la zone de feu de chaque chemin, quand une colonne d'ennemis s'y présente. */
  function viserZoneLente(etat: EtatPartie, emplacement: number, ennemis: readonly Ennemi[]): Action | null {
    calculerZones(etat);
    for (let chemin = 0; chemin < zones.length; chemin++) {
      const zone = zones[chemin];
      if (!zone) continue;
      let nombre = 0;
      for (const e of ennemis) {
        if (e.chemin === chemin && e.distance >= zone.distance - 3 && e.distance <= zone.distance + 1.5) nombre++;
      }
      if (nombre >= 3) return { type: 'lancerSort', emplacement, x: zone.x, y: zone.y };
    }
    return null;
  }

  function viserSort(etat: EtatPartie, sort: DefSort, emplacement: number): Action | null {
    if ((etat.sorts[emplacement]?.recharge ?? 1) > 0) return null;
    const ennemis = etat.ennemis.filter((e) => e.vivant);
    if (ennemis.length === 0) return null;
    if (sort.effets.some((e) => e.type === 'pieges')) return viserPieges(etat, emplacement);
    if (sort.effets.some((e) => e.type === 'boost')) return viserBoost(etat, sort, emplacement);
    if (sort.effets.some((e) => e.type === 'zone')) return viserZoneLente(etat, emplacement, ennemis);
    if (sort.effets.some((e) => e.type === 'execution')) {
      // Griffes d'Ombre : tue net tout ce qui n'est pas un boss dans la grappe, donc la plus grosse grappe (ou le boss).
      const grappe = plusGrosseGrappe(ennemis, sort.rayon);
      return grappe && (grappe.nombre >= 4 || grappe.boss) ? { type: 'lancerSort', emplacement, x: grappe.x, y: grappe.y } : null;
    }
    if (!sort.effets.some((e) => e.type === 'invoquer')) {
      // Dégâts de zone : centrer sur l'ennemi qui a le plus de voisins.
      const grappe = plusGrosseGrappe(ennemis, sort.rayon);
      if (!grappe || (grappe.nombre < 3 && !grappe.boss)) return null;
      return { type: 'lancerSort', emplacement, x: grappe.x, y: grappe.y };
    }
    // Renforts : devant la zone de feu de chaque chemin, quand des ennemis s'y présentent.
    calculerZones(etat);
    for (let chemin = 0; chemin < zones.length; chemin++) {
      const zone = zones[chemin];
      if (!zone) continue;
      let nombre = 0;
      for (const e of ennemis) {
        if (e.chemin === chemin && e.distance >= zone.distance - 4 && e.distance <= zone.distance + 1) nombre++;
      }
      if (nombre >= 2) return { type: 'lancerSort', emplacement, x: zone.x, y: zone.y };
    }
    return null;
  }

  function lancerSorts(etat: EtatPartie): Action[] {
    const dieu = dieux[etat.config.dieu];
    if (!dieu) return [];
    const actions: Action[] = [];
    dieu.sorts.forEach((sort, emplacement) => {
      const action = viserSort(etat, sort, emplacement);
      if (action && validerAction(etat, action) === null) actions.push(action);
    });
    return actions;
  }

  function pretAuCombat(etat: EtatPartie): boolean {
    return etat.ennemis.length === 0 && !etat.unites.some((u) => u.mort && (u.genre === 'soldat' || u.genre === 'heros'));
  }

  return {
    nom: `soigneux (${variante.nom})`,
    decider(etat) {
      if (echantillons.length === 0) {
        echantillons = echantillonner(etat);
        poids = poidsDesChemins(etat.niveau);
        parts = partsSpeciales(etat.niveau);
      }
      const actions: Action[] = [];
      const achat = acheter(etat);
      if (achat) actions.push(achat);
      if (utiliserSorts) {
        const ordre = etat.tours.length > 0 ? ordreHeros(etat) : null;
        if (ordre) actions.push(ordre);
        actions.push(...lancerSorts(etat));
      }
      if (!achat && appelerEnAvance && pretAuCombat(etat) && validerAction(etat, { type: 'appelerVague' }) === null) {
        actions.push({ type: 'appelerVague' });
      }
      return actions;
    },
  };
}

export interface ResultatRecherche {
  readonly variante: VarianteSoigneux;
  /** Note de chaque variante essayée (plus haut = mieux). */
  readonly notes: readonly { readonly variante: VarianteSoigneux; readonly note: number }[];
}

/** Une victoire vaut toujours plus qu'une défaite ; à issue égale, plus de vies ou une défaite plus tardive. */
export function noterPartie(r: ResultatPartie): number {
  return r.statut === 'victoire' ? 10000 + r.vies * 100 + r.aretesFin / 100 : r.secondes;
}

/**
 * Petite recherche : joue le niveau avec chaque variante sur des graines d'entraînement (qui ne servent
 * jamais à l'évaluation) et garde la meilleure. Déterministe.
 */
export function optimiserBot(
  niveau: Niveau,
  difficulte: string,
  graines: readonly number[],
  joueur: Joueur = {},
  options: Pick<OptionsSoigneux, 'tourDivine'> = {},
  variantes: readonly VarianteSoigneux[] = VARIANTES,
): ResultatRecherche {
  const notes = variantes.map((variante) => {
    let note = 0;
    for (const graine of graines) note += noterPartie(jouerPartie(niveau, creerBotSoigneux({ ...options, variante }), { ...joueur, graine, difficulte }));
    return { variante, note };
  });
  let meilleur = notes[0];
  for (const n of notes) if (!meilleur || n.note > meilleur.note) meilleur = n;
  if (!meilleur) throw new Error('Aucune variante à essayer');
  return { variante: meilleur.variante, notes };
}
