// Bot « soigneux » : un bon joueur. Il connaît la carte (longueur de chemin que chaque case de la grille couvre, poids de
// chaque chemin dans les vagues) et achète toujours ce qui rapporte le plus de puissance par arête dépensée
// (recherche gloutonne sur le choix de la case, de la famille, du niveau et de la spécialisation), bonus et remise
// de famille de son dieu compris. Il place son héros là où ses tours concentrent leur feu, joue les sorts de
// chaque dieu selon leur effet (zones de dégâts sur les grappes, Renforts et Voile de Nuit devant la zone de feu,
// Pièges à Ressort un peu avant, Griffes d'Ombre sur la plus grosse grappe, Ingéniosité au cœur des tours),
// construit la tour divine de son dieu, et appelle la vague suivante dès que le terrain est vide et qu'il n'a
// plus rien à acheter. Il sait ce que ne touchent pas les tours (la caserne et l'artillerie ignorent les volants : leur valeur
// baisse de la part de volants du niveau) et qu'il faut au moins une tour de Guetteurs des Toits par chemin pour révéler les
// furtifs. Une petite recherche en amont (`optimiserBot`) choisit parmi quelques variantes de
// préférence de famille celle qui joue le mieux le niveau, en simulant des parties d'entraînement.
//
// Toutes les cases libres de la grille sont permises, mais la recherche reste raisonnable : pour chaque famille (et pour la tour
// divine), le bot classe une fois pour toutes les cases où elle voit du chemin (longueur de chemin couverte, pesée par la menace de
// chaque chemin, donc les virages et les zones où il se replie sur lui-même passent devant), et il n'examine à chaque achat que les
// `CASES_PAR_FAMILLE` meilleures qui sont encore libres. Une caserne n'y est classée que là où elle a un chemin à portée.
// Sur la grille, plusieurs cases voisines voient presque le même chemin : sans correctif, le bot empilerait tout sur le meilleur
// virage. La puissance qui couvre un point du chemin est donc comptée avec un rendement décroissant (`SATURATION_DPS`) : une nouvelle
// tour, ou le niveau suivant d'une tour, vaut ce qu'elle ajoute à ce que les tours posées couvrent déjà, comme le fait un joueur
// qui répartit sa défense sur le chemin plutôt que de tout miser sur une seule tour.
import { ajusterMontant, casesLibres, centreCase, ralliementParDefaut, tourSurCase, validerAction } from '../engine';
import type { Action, BonusFamille, CaseGrille, DefDieu, DefNiveauTour, DefSort, Ennemi, EtatPartie, IdFamille, Niveau, Point, Tour, Voie } from '../engine';
import { DIEUX } from '../data/dieux';
import { dpsEfficace } from '../data/equilibrage';
import { REGLES } from '../data/regles';
import { FAMILLES, TOURS } from '../data/tours';
import { distance, echantillonner, longueurVue, niveauLu, PAS_ECHANTILLON, partsSpeciales, poidsDesChemins, premiereVagueFurtifs, type Echantillon } from './geometrie';
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
  /** Achat qu'on attend plutôt que de dépenser ailleurs (un furtif non révélé passe sans qu'aucune tour le touche). */
  readonly imperatif?: boolean;
}

const dieux: Readonly<Record<string, DefDieu>> = DIEUX;

/** Nombre de cases libres examinées par famille à chaque achat (les mieux classées d'abord). */
const CASES_PAR_FAMILLE = 30;

/**
 * Puissance (dégâts par seconde) au-delà de laquelle un point du chemin rend peu : l'utilité d'une puissance D couvrant un point est
 * D / (1 + D / SATURATION_DPS). Une tour de niveau 3 pèse environ 20 : seule, elle rend 60 % ; avec une voisine, 70 % chacune.
 */
const SATURATION_DPS = 30;

function utilite(dps: number): number {
  return dps / (1 + dps / SATURATION_DPS);
}

/** Part de menace furtive à partir de laquelle le bot se soucie des Guetteurs des Toits. */
const PART_FURTIFS_MIN = 0.001;

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
  /** Numéro (1 à N) de la première vague qui compte un furtif, 0 s'il n'y en a pas. */
  let vagueFurtifs = 0;
  const vues = new Map<string, number>();
  /** Indices des points d'échantillonnage à portée d'une case, par (case, portée). */
  const alentours = new Map<string, Int32Array>();
  /** Puissance des tours posées qui couvre chaque point d'échantillonnage, et la situation (tours, niveaux) pour laquelle elle est calculée. */
  let couverture = new Float32Array(0);
  let situationCouverture = Number.NaN;
  const dpsParDef = new Map<DefNiveauTour, number>();
  const dpsAvecBonusParDef = new Map<DefNiveauTour, number>();
  /** Cases utiles de chaque famille (et de la tour divine), classées par longueur de chemin vue décroissante. */
  let classement: Readonly<Record<IdFamille | 'divine', readonly CaseGrille[]>> | null = null;
  let zones: (Echantillon | undefined)[] = [];
  let clefZones = -1;
  let dernierOrdreHeros: Point | null = null;

  function vue(cx: number, cy: number, portee: number): number {
    const clef = `${String(cx)},${String(cy)}:${String(portee)}`;
    let v = vues.get(clef);
    if (v === undefined) {
      v = longueurVue(echantillons, poids, centreCase(cx, cy), portee);
      vues.set(clef, v);
    }
    return v;
  }

  function alentoursDe(cx: number, cy: number, portee: number): Int32Array {
    const clef = `${String(cx)},${String(cy)}:${String(portee)}`;
    let indices = alentours.get(clef);
    if (!indices) {
      const centre = centreCase(cx, cy);
      const trouves: number[] = [];
      echantillons.forEach((e, i) => {
        if (distance(e, centre) <= portee) trouves.push(i);
      });
      indices = Int32Array.from(trouves);
      alentours.set(clef, indices);
    }
    return indices;
  }

  /** Recompte les tours qui couvrent chaque point d'échantillonnage quand la défense a changé (tour posée, vendue ou améliorée). */
  function majCouverture(etat: EtatPartie): void {
    let situation = 0;
    for (const t of etat.tours) situation = (Math.imul(situation, 31) + t.id * 100003 + t.coutCumule) | 0;
    if (situation === situationCouverture && couverture.length === echantillons.length) return;
    situationCouverture = situation;
    couverture = new Float32Array(echantillons.length);
    for (const t of etat.tours) deplacerCouverture(t, 1);
  }

  /** Ajoute (+1) ou retire (-1) la puissance d'une tour posée, le temps d'évaluer son amélioration sans la compter deux fois. */
  function deplacerCouverture(t: Tour, signe: number): void {
    const puissance = signe * dps(t.stats);
    for (const i of alentoursDe(t.cx, t.cy, t.stats.portee)) couverture[i] = (couverture[i] ?? 0) + puissance;
  }

  /**
   * Ce qu'une tour de cette portée et de cette puissance ajoute aux tours posées : sur chaque point du chemin à sa portée, le gain
   * d'utilité (rendement décroissant), pesé par la menace du chemin et la longueur de chemin que le point représente.
   */
  function utiliteAjoutee(cx: number, cy: number, portee: number, puissance: number): number {
    let total = 0;
    for (const i of alentoursDe(cx, cy, portee)) {
      const e = echantillons[i];
      if (!e) continue;
      const deja = couverture[i] ?? 0;
      total += (poids[e.chemin] ?? 0) * PAS_ECHANTILLON * (utilite(deja + puissance) - utilite(deja));
    }
    return total;
  }

  /** Les cases non interdites où une tour de cette portée voit du chemin, de la plus utile à la moins utile (égalité : ordre de la grille). */
  function classer(etat: EtatPartie, portee: number, avecSoldats: boolean): CaseGrille[] {
    const vide = { niveau: etat.niveau, tours: [] };
    return casesLibres(vide)
      .filter((c) => !avecSoldats || ralliementParDefaut(etat.chemins, c.cx, c.cy, portee) !== null)
      .map((c) => ({ c, v: vue(c.cx, c.cy, portee) }))
      .filter((m) => m.v > 0)
      .sort((a, b) => b.v - a.v)
      .map((m) => m.c);
  }

  function classements(etat: EtatPartie): Readonly<Record<IdFamille | 'divine', readonly CaseGrille[]>> {
    if (classement) return classement;
    const dieu = dieux[etat.config.dieu];
    const parFamille = (famille: IdFamille): CaseGrille[] => {
      const def = TOURS[famille].niveaux[0];
      return classer(etat, def.portee, def.soldats !== null);
    };
    classement = {
      caserne: parFamille('caserne'),
      tir: parFamille('tir'),
      magie: parFamille('magie'),
      artillerie: parFamille('artillerie'),
      divine: dieu ? classer(etat, dieu.tourDivine.portee, dieu.tourDivine.soldats !== null) : [],
    };
    return classement;
  }

  /** Les premières cases libres du classement d'une famille. */
  function meilleuresCasesLibres(etat: EtatPartie, famille: IdFamille | 'divine', combien: number): CaseGrille[] {
    const libres: CaseGrille[] = [];
    for (const c of classements(etat)[famille]) {
      if (tourSurCase(etat, c.cx, c.cy)) continue;
      libres.push(c);
      if (libres.length >= combien) break;
    }
    return libres;
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

  /** La case libre qui apporte le plus de couverture, parmi les mieux classées pour cette famille. */
  function meilleureCase(etat: EtatPartie, famille: IdFamille | 'divine', portee: number): CaseGrille | undefined {
    majCouverture(etat);
    let meilleure: CaseGrille | undefined;
    let meilleureVue = -1;
    for (const c of meilleuresCasesLibres(etat, famille, CASES_PAR_FAMILLE)) {
      const v = utiliteAjoutee(c.cx, c.cy, portee, SATURATION_DPS / 2);
      if (v > meilleureVue) {
        meilleureVue = v;
        meilleure = c;
      }
    }
    return meilleure;
  }

  function valeur(etat: EtatPartie, cx: number, cy: number, def: DefNiveauTour, famille: IdFamille): number {
    const memeFamille = etat.tours.filter((t) => t.famille === famille && (t.cx !== cx || t.cy !== cy)).length;
    // Une tour qui ne touche pas les volants perd la part de menace qu'ils représentent (rien à retrancher quand il n'y en a pas).
    const touchee = def.volants ? 1 : 1 - parts.volants;
    return (utiliteAjoutee(cx, cy, def.portee, dpsFamille(etat, def, famille) * touchee) * variante.poids[famille]) / (1 + (variante.diversite ?? 0) * memeFamille);
  }

  /** Tous les achats possibles (construction, amélioration, spécialisation), classés par valeur gagnée par arête. */
  function candidats(etat: EtatPartie): Candidat[] {
    const liste: Candidat[] = [];
    majCouverture(etat);
    for (const famille of FAMILLES.filter((f) => famillePermise(etat, f))) {
      const def = TOURS[famille].niveaux[0];
      for (const { cx, cy } of meilleuresCasesLibres(etat, famille, CASES_PAR_FAMILLE)) {
        liste.push({ action: { type: 'construire', cx, cy, tour: famille }, ratio: valeur(etat, cx, cy, def, famille) / cout(etat, def, famille) });
      }
    }
    for (const tour of etat.tours) {
      const { cx, cy } = tour;
      const actuelle = defCourante(tour);
      if (tour.famille === 'divine' || !actuelle || tour.niveau >= 4) continue;
      const famille = TOURS[tour.famille];
      // La tour ne compte pas dans la couverture qu'elle améliore.
      deplacerCouverture(tour, -1);
      const avant = valeur(etat, cx, cy, actuelle, tour.famille);
      if (tour.niveau < 3) {
        const suivante = famille.niveaux[tour.niveau];
        if (suivante) liste.push({ action: { type: 'ameliorer', cx, cy }, ratio: (valeur(etat, cx, cy, suivante, tour.famille) - avant) / cout(etat, suivante, tour.famille) });
      } else {
        for (const voie of ['A', 'B'] as const satisfies readonly Voie[]) {
          const spe = famille.specialisations[voie];
          liste.push({ action: { type: 'specialiser', cx, cy, voie }, ratio: (valeur(etat, cx, cy, spe, tour.famille) - avant) / cout(etat, spe, tour.famille) });
        }
      }
      deplacerCouverture(tour, 1);
    }
    liste.sort((a, b) => b.ratio - a.ratio);
    const divine = candidatDivine(etat, liste[0]?.ratio ?? 0);
    if (divine) liste.unshift(divine);
    const guetteurs = candidatGuetteurs(etat, liste[0]?.ratio ?? 0);
    if (guetteurs) liste.unshift(guetteurs);
    return liste;
  }

  /**
   * Contre les furtifs, une tour de Guetteurs des Toits (spécialisation A de la tour de tir, qui révèle les furtifs à portée)
   * par chemin : la tour de tir la plus avancée est montée puis spécialisée, ou construite sur la case libre qui voit le plus de
   * chemin. Une valeur juste au-dessus du meilleur autre achat : le bot économise jusqu'à pouvoir la payer.
   */
  function candidatGuetteurs(etat: EtatPartie, meilleurRatio: number): Candidat | null {
    if (parts.furtifs < PART_FURTIFS_MIN || !famillePermise(etat, 'tir')) return null;
    // Pas avant que le premier furtif approche : les premières vagues se gagnent avec une défense ordinaire.
    if (etat.vagues.lancees < vagueFurtifs - 2) return null;
    const requis = etat.niveau.carte.chemins.length;
    if (etat.tours.filter((t) => t.famille === 'tir' && t.voie === 'A').length >= requis) return null;
    // Une tour de tir déjà spécialisée (voie B) ne peut plus devenir Guetteurs : seules celles du niveau 1 à 3 servent.
    const tir = etat.tours.filter((t) => t.famille === 'tir' && t.niveau < 4).sort((a, b) => b.niveau - a.niveau)[0];
    const ratio = meilleurRatio * 1.02;
    if (tir) {
      if (tir.niveau >= 3) return { action: { type: 'specialiser', cx: tir.cx, cy: tir.cy, voie: 'A' }, ratio, imperatif: true };
      return { action: { type: 'ameliorer', cx: tir.cx, cy: tir.cy }, ratio, imperatif: true };
    }
    const meilleure = meilleureCase(etat, 'tir', TOURS.tir.niveaux[0].portee);
    return meilleure ? { action: { type: 'construire', cx: meilleure.cx, cy: meilleure.cy, tour: 'tir' }, ratio, imperatif: true } : null;
  }

  /**
   * La tour divine, dès que la défense compte trois tours : sur la case libre qui voit le plus de chemin, avec une
   * valeur juste au-dessus du meilleur autre achat (le bot ne sait pas la chiffrer comme une tour ordinaire).
   */
  function candidatDivine(etat: EtatPartie, meilleurRatio: number): Candidat | null {
    if (!(options.tourDivine ?? true)) return null;
    const dieu = dieux[etat.config.dieu];
    if (!dieu || etat.tours.length < 3 || etat.tours.some((t) => t.famille === 'divine')) return null;
    // Au défi Fer, la tour divine suit la famille de son dieu : elle n'est permise que si cette famille l'est.
    if (!famillePermise(etat, dieu.bonus.famille)) return null;
    const meilleure = meilleureCase(etat, 'divine', dieu.tourDivine.portee);
    return meilleure ? { action: { type: 'construire', cx: meilleure.cx, cy: meilleure.cy, tour: 'divine' }, ratio: meilleurRatio * 1.01 } : null;
  }

  /** Achat de ce tour-ci : le meilleur s'il est payable, sinon un presque aussi bon qui l'est, sinon on économise. */
  function acheter(etat: EtatPartie): Action | null {
    const liste = candidats(etat);
    const meilleur = liste[0];
    if (!meilleur) return null;
    // Les Guetteurs des Toits face à des furtifs se paient d'abord : on économise plutôt que de dépenser ailleurs.
    if (meilleur.imperatif && validerAction(etat, meilleur.action) === 'aretes_insuffisantes') return null;
    for (const c of liste) {
      if (c.ratio < meilleur.ratio * 0.75) break;
      if (validerAction(etat, c.action) === null) return c.action;
    }
    return null;
  }

  /** Point de chaque chemin où les tours posées concentrent le plus de feu. */
  function calculerZones(etat: EtatPartie): void {
    const clef = etat.tours.reduce((a, t) => a + t.coutCumule + 1000 * (t.cx + 100 * t.cy), 0);
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
        const lu = niveauLu(etat);
        poids = poidsDesChemins(lu);
        parts = partsSpeciales(lu);
        vagueFurtifs = premiereVagueFurtifs(lu);
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
