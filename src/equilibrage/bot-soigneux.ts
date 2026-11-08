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
//
// Gimmicks de l'après-histoire (spec du 2026-11-08, décision technique 4) :
// - Vol de Corbeaux : les couloirs sont échantillonnés comme des trajets à part (geometrie.ts), pesés par la menace des groupes qui
//   les traversent. Sur un point de couloir, seule une tour qui vise les volants compte : le bot pose donc ses tours de tir et de magie
//   à portée des couloirs. Un héros qui tire sur les volants se poste au croisement du chemin et du couloir le plus menacé de la vague
//   en cours (ou de la prochaine, celle que le panneau annonce).
// - Radeau : une tour s'identifie par son lieu (`LieuTour`, la case ou la place du radeau). Le bot construit sur les places libres les
//   tours qui ne posent rien au sol (tir, magie, artillerie, tour divine de Charlie) et les estime par la couverture moyenne de leur
//   place sur le trajet du radeau (`POSITIONS_RADEAU` positions réparties sur un aller, chacune pour sa part du temps : l'aller-retour
//   repasse aux mêmes endroits). La zone de feu d'une tour du radeau (héros, sorts) suit la même couverture moyenne.
import { PAS_PAR_SECONDE, ajusterMontant, casesLibres, centreCase, gimmickRadeau, niveauDeblocage, positionPlace, ralliementParDefaut, tourSurCase, tourSurPlace, validerAction } from '../engine';
import type { Action, BonusFamille, CaseGrille, DefDieu, DefEnnemi, DefHeros, DefNiveauTour, DefSort, Ennemi, EtatPartie, GimmickRadeau, IdFamille, LieuTour, Niveau, Point, Tour, Voie } from '../engine';
import { DIEUX } from '../data/dieux';
import { DIFFICULTE_DES_DEFIS, DIFFICULTES } from '../data/difficultes';
import { ENNEMIS } from '../data/ennemis';
import { HEROS } from '../data/heros';
import { dpsEfficace, EQUILIBRAGE, estTourDeZone } from '../data/equilibrage';
import { REGLES } from '../data/regles';
import { FAMILLES, TOURS } from '../data/tours';
import { distance, echantillonner, longueurVue, menacePaquet, niveauLu, PAS_ECHANTILLON, partsSpeciales, poidsDesChemins, premiereVagueFurtifs, trajetDuPaquet, type Echantillon } from './geometrie';
import { jouerPartie, lieuDeLaTour, type Bot, type Joueur, type ResultatPartie } from './simulation';

/** Une préférence de famille : le poids multiplie la valeur d'une tour de cette famille. */
export interface VarianteSoigneux {
  readonly nom: string;
  readonly poids: Readonly<Record<IdFamille, number>>;
  /** Décote par tour de la même famille déjà posée : la valeur d'une tour est divisée par 1 + diversité × (autres tours de sa famille). */
  readonly diversite?: number;
  /**
   * « Bloquer puis écraser en zone » (jalon 5) : la caserne est valorisée comme si une tour de zone allait la suivre derrière elle, là
   * où les soldats arrêtent les ennemis. 0 ou absent : la caserne ne compte que la zone déjà posée.
   */
  readonly blocage?: number;
}

const EQUILIBREE: VarianteSoigneux = { nom: 'équilibrée', poids: { caserne: 1, tir: 1, magie: 1, artillerie: 1 } };

/** Préférences de famille essayées par la recherche : tout équilibré, ou une famille un peu plus aimée. */
const PREFERENCES: readonly Pick<VarianteSoigneux, 'nom' | 'poids' | 'blocage'>[] = [
  EQUILIBREE,
  { nom: 'tir', poids: { caserne: 0.8, tir: 1.4, magie: 0.9, artillerie: 0.9 } },
  { nom: 'artillerie', poids: { caserne: 0.8, tir: 0.9, magie: 0.9, artillerie: 1.4 } },
  { nom: 'magie', poids: { caserne: 0.8, tir: 0.9, magie: 1.4, artillerie: 0.9 } },
  { nom: 'caserne', poids: { caserne: 1.5, tir: 0.9, magie: 0.9, artillerie: 0.9 } },
  { nom: 'bloquer puis zone', poids: { caserne: 1.4, tir: 0.9, magie: 0.9, artillerie: 1.3 }, blocage: 1 },
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
  /** Familles de tours permises (toutes par défaut) : les compositions des mesures de la zone (`zone.ts`) en retirent. */
  readonly familles?: readonly IdFamille[];
}

interface Candidat {
  readonly action: Action;
  readonly ratio: number;
  /** Achat qu'on attend plutôt que de dépenser ailleurs (un furtif non révélé passe sans qu'aucune tour le touche). */
  readonly imperatif?: boolean;
}

const dieux: Readonly<Record<string, DefDieu>> = DIEUX;
const heros: Readonly<Record<string, DefHeros>> = HEROS;
const ennemis: Readonly<Record<string, DefEnnemi>> = ENNEMIS;

/** Dégâts qu'un volant annoncé doit pouvoir encaisser en traversant son couloir, en multiples de ses PV (Vol de Corbeaux). */
const MARGE_COULOIR = 1.25;

/** Positions du radeau (réparties sur un aller) avec lesquelles le bot estime la couverture d'une place. */
const POSITIONS_RADEAU = 8;

/** Une tour qui pose quelque chose au sol (soldats, tourelles, pièges) : le radeau la refuse (`radeau_sol_requis`). */
function poseAuSol(def: DefNiveauTour): boolean {
  return def.soldats !== null || def.atelier !== null;
}

/**
 * `POSITIONS_RADEAU` pas répartis sur un aller du radeau : de quoi moyenner la couverture d'une place. Sur un aller-retour, les instants
 * t et P − t tombent au même endroit : on répartit donc sur la première moitié de la période, pour avoir autant de positions distinctes.
 */
function pasRepartis(gimmick: GimmickRadeau): number[] {
  // Durée d'un aller-retour : la longueur du trajet (somme des segments entre centres de cases) faite deux fois à `vitesse`.
  let longueur = 0;
  gimmick.trajet.forEach((c, i) => {
    const avant = gimmick.trajet[i - 1];
    if (avant) longueur += distance(centreCase(avant.cx, avant.cy), centreCase(c.cx, c.cy));
  });
  const periode = (2 * longueur * PAS_PAR_SECONDE) / (gimmick.vitesse * REGLES.tailleCase);
  return Array.from({ length: POSITIONS_RADEAU }, (_, k) => Math.round(((k + 0.5) * periode) / (2 * POSITIONS_RADEAU)));
}

/** Nombre de cases libres examinées par famille à chaque achat (les mieux classées d'abord). */
const CASES_PAR_FAMILLE = 30;

/**
 * Puissance (dégâts par seconde) au-delà de laquelle un point du chemin rend peu : l'utilité d'une puissance D couvrant un point est
 * D / (1 + D / SATURATION_DPS). Une tour de niveau 3 pèse environ 20 : seule, elle rend 60 % ; avec une voisine, 70 % chacune.
 */
const SATURATION_DPS = 30;

/** Distance (tuiles) au point de ralliement des soldats à laquelle les ennemis arrêtés sont groupés : la zone y touche beaucoup de cibles. */
const RAYON_BLOCAGE = 1.5;

function utilite(dps: number): number {
  return dps / (1 + dps / SATURATION_DPS);
}

/** Part de menace furtive à partir de laquelle le bot se soucie des Guetteurs des Toits. */
const PART_FURTIFS_MIN = 0.001;

/** Le palier de protection au-dessus de `valeur` (le dernier s'il y est déjà) : ce que devient l'armure d'une élite, comme dans le moteur. */
function palierSuperieur(valeur: number): number {
  for (const palier of REGLES.paliersProtection) if (palier > valeur) return palier;
  return REGLES.paliersProtection[REGLES.paliersProtection.length - 1] ?? valeur;
}

/**
 * DPS d'un niveau de tour contre un ennemi de cette armure et de cette résistance. `dpsEfficace` donne le DPS sur chaque palier de
 * protection, et il est affine en la part de protection : on interpole au palier que le coup rencontre (l'armure, moins ce que le coup
 * en ignore, pour des dégâts physiques ; la résistance pour des dégâts magiques ; rien pour des dégâts purs).
 */
function dpsContre(def: DefNiveauTour, armure: number, resistance: number): number {
  const protection = def.typeDegats === 'physique' ? armure * (1 - def.ignoreArmure) : def.typeDegats === 'magique' ? resistance : 0;
  const paliers = REGLES.paliersProtection;
  const dps = dpsEfficace(def);
  for (let i = 1; i < paliers.length; i++) {
    const bas = paliers[i - 1] ?? 0;
    const haut = paliers[i] ?? 1;
    if (protection <= haut || i === paliers.length - 1) {
      const t = (protection - bas) / (haut - bas);
      return (dps[i - 1] ?? 0) * (1 - t) + (dps[i] ?? 0) * t;
    }
  }
  return dps[0] ?? 0;
}

function dpsMoyen(def: DefNiveauTour, cibles?: number, presenceChaine?: number): number {
  const dps = dpsEfficace(def, cibles, presenceChaine);
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
function famillePermise(etat: EtatPartie, famille: IdFamille, permises?: readonly IdFamille[]): boolean {
  if (permises && !permises.includes(famille)) return false;
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
  /** Nombre de chemins de la partie : un échantillon d'indice de trajet au moins égal est sur un couloir. */
  let nombreChemins = 0;
  /** 1 pour un point d'échantillonnage sur un couloir du Vol de Corbeaux (seules les tours qui visent les volants y touchent). */
  let enCouloir = new Uint8Array(0);
  /** Hauteur (y) de chaque couloir. */
  let hauteursCouloirs: number[] = [];
  /** Positions de chaque place du radeau sur un aller-retour (vide sans radeau). */
  let positionsPlaces: Point[][] = [];
  let parts = { volants: 0, furtifs: 0 };
  /** Numéro (1 à N) de la première vague qui compte un furtif, 0 s'il n'y en a pas. */
  let vagueFurtifs = 0;
  const vues = new Map<string, number>();
  /** Indices des points d'échantillonnage à portée d'une case, par (case, portée). */
  const alentours = new Map<string, Int32Array>();
  /** Puissance des tours posées qui couvre chaque point d'échantillonnage, et la situation (tours, niveaux) pour laquelle elle est calculée. */
  let couverture = new Float32Array(0);
  let situationCouverture = Number.NaN;
  /** 1 là où des soldats arrêtent les ennemis (à moins de `RAYON_BLOCAGE` d'un point de ralliement), pour chaque point d'échantillonnage. */
  let bloque = new Uint8Array(0);
  /** Gain de puissance que les tours de zone posées tirent du blocage, en chaque point (elles n'y comptent déjà que leur puissance libre). */
  let gainBlocage = new Float32Array(0);
  const dpsParDef = new Map<DefNiveauTour, number>();
  const dpsBloqueParDef = new Map<DefNiveauTour, number>();
  const dpsAvecBonusParDef = new Map<DefNiveauTour, number>();
  const dpsAvecBonusBloqueParDef = new Map<DefNiveauTour, number>();
  /** DPS contre les volants d'un couloir, par niveau de tour puis par (bonus, armure, résistance). */
  const dpsAuVolantParDef = new Map<DefNiveauTour, Map<string, number>>();
  /** Cases utiles de chaque famille (et de la tour divine), classées par longueur de chemin vue décroissante. */
  let classement: Readonly<Record<IdFamille | 'divine', readonly CaseGrille[]>> | null = null;
  let zones: (Echantillon | undefined)[] = [];
  let clefZones = -1;
  let dernierOrdreHeros: Point | null = null;

  /** Longueur de trajet pesée vue depuis la case ; les couloirs n'y comptent que pour une tour qui vise les volants. */
  function vue(cx: number, cy: number, portee: number, volants: boolean): number {
    const clef = `${String(cx)},${String(cy)}:${String(portee)}:${volants ? 'v' : 's'}`;
    let v = vues.get(clef);
    if (v === undefined) {
      v = longueurVue(echantillons, poids, centreCase(cx, cy), portee, volants ? undefined : nombreChemins);
      vues.set(clef, v);
    }
    return v;
  }

  function alentoursDe(cx: number, cy: number, portee: number): Int32Array {
    return alentoursDuPoint(`${String(cx)},${String(cy)}`, centreCase(cx, cy), portee);
  }

  /** Indices des points d'échantillonnage à moins de `portee` du point, gardés sous la clé donnée. */
  function alentoursDuPoint(nom: string, centre: Point, portee: number): Int32Array {
    const clef = `${nom}:${String(portee)}`;
    let indices = alentours.get(clef);
    if (!indices) {
      const trouves: number[] = [];
      echantillons.forEach((e, i) => {
        if (distance(e, centre) <= portee) trouves.push(i);
      });
      indices = Int32Array.from(trouves);
      alentours.set(clef, indices);
    }
    return indices;
  }

  /**
   * Ce qu'une tour couvre depuis son lieu : sur une case, ses alentours en entier ; sur une place du radeau, les alentours de chacune
   * des `POSITIONS_RADEAU` positions de l'aller-retour, chacune pour sa part du temps (poids 1 / POSITIONS_RADEAU).
   */
  function couvertureDuLieu(lieu: LieuTour, portee: number): { indices: Int32Array; part: number }[] {
    if (lieu.place === undefined) return [{ indices: alentoursDe(lieu.cx, lieu.cy, portee), part: 1 }];
    const place = lieu.place;
    const positions = positionsPlaces[place] ?? [];
    return positions.map((p, k) => ({ indices: alentoursDuPoint(`radeau ${String(place)}.${String(k)}`, p, portee), part: 1 / positions.length }));
  }

  /** Recompte les tours qui couvrent chaque point d'échantillonnage quand la défense a changé (tour posée, vendue ou améliorée). */
  function majCouverture(etat: EtatPartie): void {
    let situation = 0;
    for (const t of etat.tours) situation = (Math.imul(situation, 31) + t.id * 100003 + t.coutCumule) | 0;
    if (situation === situationCouverture && couverture.length === echantillons.length) return;
    situationCouverture = situation;
    couverture = new Float32Array(echantillons.length);
    gainBlocage = new Float32Array(echantillons.length);
    bloque = new Uint8Array(echantillons.length);
    for (const t of etat.tours) {
      if (!t.stats.soldats || t.stats.soldats.nombre <= 0) continue;
      const rallie = { x: t.ralliementX, y: t.ralliementY };
      echantillons.forEach((e, i) => {
        // Les soldats n'arrêtent pas les volants d'un couloir.
        if (enCouloir[i] !== 1 && distance(e, rallie) <= RAYON_BLOCAGE) bloque[i] = 1;
      });
    }
    for (const t of etat.tours) {
      deplacerCouverture(t, 1);
      if (estTourDeZone(t.stats)) {
        const surplus = dpsBloque(t.stats) - dps(t.stats);
        for (const { indices, part } of couvertureDuLieu(lieuDeLaTour(t), t.stats.portee)) {
          for (const i of indices) if (enCouloir[i] !== 1) gainBlocage[i] = (gainBlocage[i] ?? 0) + surplus * part;
        }
      }
    }
  }

  /** Ajoute (+1) ou retire (-1) la puissance d'une tour posée, le temps d'évaluer son amélioration sans la compter deux fois. */
  function deplacerCouverture(t: Tour, signe: number): void {
    const libre = signe * dps(t.stats);
    const arrete = estTourDeZone(t.stats) ? signe * dpsBloque(t.stats) : libre;
    // Sur un couloir, seule une tour qui vise les volants compte.
    const couloir = t.stats.volants ? libre : 0;
    for (const { indices, part } of couvertureDuLieu(lieuDeLaTour(t), t.stats.portee)) {
      for (const i of indices) couverture[i] = (couverture[i] ?? 0) + part * (enCouloir[i] === 1 ? couloir : bloque[i] === 1 ? arrete : libre);
    }
  }

  /**
   * Ce qu'une tour de cette portée et de cette puissance ajoute aux tours posées : sur chaque point du chemin à sa portée, le gain
   * d'utilité (rendement décroissant), pesé par la menace du chemin et la longueur de chemin que le point représente. Une tour de
   * zone a une puissance de plus là où des soldats arrêtent les ennemis (`puissanceBloquee`) ; sur un couloir, elle vaut
   * `puissanceCouloir` (celle d'une tour qui vise les volants, 0 sinon). Sur le radeau, chaque position compte pour sa part du temps.
   */
  function utiliteAjoutee(lieu: LieuTour, portee: number, puissance: number, puissanceBloquee = puissance, puissanceCouloir = puissance): number {
    let total = 0;
    for (const { indices, part } of couvertureDuLieu(lieu, portee)) {
      for (const i of indices) {
        const e = echantillons[i];
        if (!e) continue;
        const deja = couverture[i] ?? 0;
        const p = part * (enCouloir[i] === 1 ? puissanceCouloir : bloque[i] === 1 ? puissanceBloquee : puissance);
        total += (poids[e.chemin] ?? 0) * PAS_ECHANTILLON * (utilite(deja + p) - utilite(deja));
      }
    }
    return total;
  }

  /**
   * Ce que des soldats rassemblés au point `rallie` apportent aux tours de zone : sur les points qu'ils arrêtent et qui ne le sont pas
   * encore, le gain de puissance de la zone posée à portée (ou, pour une variante qui prépare le blocage, celui d'une tour de zone moyenne
   * que le bot posera derrière eux, pondéré par `variante.blocage`).
   */
  function utiliteBlocage(rallie: Point, zoneAttendue: number): number {
    let total = 0;
    echantillons.forEach((e, i) => {
      if (bloque[i] === 1 || enCouloir[i] === 1 || distance(e, rallie) > RAYON_BLOCAGE) return;
      const gain = Math.max(gainBlocage[i] ?? 0, zoneAttendue);
      if (gain <= 0) return;
      const deja = couverture[i] ?? 0;
      total += (poids[e.chemin] ?? 0) * PAS_ECHANTILLON * (utilite(deja + gain) - utilite(deja));
    });
    return total;
  }

  /**
   * Les cases non interdites où une tour de cette portée voit du chemin, de la plus utile à la moins utile (égalité : ordre de la grille).
   * Les couloirs du Vol de Corbeaux n'y comptent que pour une tour qui vise les volants : la caserne et l'artillerie n'y touchent rien.
   */
  function classer(etat: EtatPartie, def: Pick<DefNiveauTour, 'portee' | 'soldats' | 'volants'>): CaseGrille[] {
    const vide = { niveau: etat.niveau, tours: [] };
    const avecSoldats = def.soldats !== null;
    return casesLibres(vide)
      .filter((c) => !avecSoldats || ralliementParDefaut(etat.chemins, c.cx, c.cy, def.portee) !== null)
      .map((c) => ({ c, v: vue(c.cx, c.cy, def.portee, def.volants) }))
      .filter((m) => m.v > 0)
      .sort((a, b) => b.v - a.v)
      .map((m) => m.c);
  }

  function classements(etat: EtatPartie): Readonly<Record<IdFamille | 'divine', readonly CaseGrille[]>> {
    if (classement) return classement;
    const dieu = dieux[etat.config.dieu];
    const parFamille = (famille: IdFamille): CaseGrille[] => classer(etat, TOURS[famille].niveaux[0]);
    classement = {
      caserne: parFamille('caserne'),
      tir: parFamille('tir'),
      magie: parFamille('magie'),
      artillerie: parFamille('artillerie'),
      divine: dieu ? classer(etat, dieu.tourDivine) : [],
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

  /** Niveau de horde : les ennemis y sont serrés, la zone y touche autant de cibles arrêtée ou non. */
  let horde = false;

  /** DPS d'un niveau de tour sur une colonne libre (ennemis espacés) ; en horde, celui d'une grappe. */
  function dps(def: DefNiveauTour): number {
    let v = dpsParDef.get(def);
    if (v === undefined) {
      v = horde && estTourDeZone(def) ? dpsMoyen(def, EQUILIBRAGE.ciblesParRayonDeZoneHorde, EQUILIBRAGE.presenceChaineGroupee) : dpsMoyen(def);
      dpsParDef.set(def, v);
    }
    return v;
  }

  /** DPS d'un niveau de tour de zone sur des ennemis arrêtés par des soldats (grappe au contact). */
  function dpsBloque(def: DefNiveauTour): number {
    let v = dpsBloqueParDef.get(def);
    if (v === undefined) {
      const cibles = horde ? EQUILIBRAGE.ciblesParRayonDeZoneHorde : EQUILIBRAGE.ciblesParRayonDeZoneBloquees;
      v = estTourDeZone(def) ? dpsMoyen(def, cibles, EQUILIBRAGE.presenceChaineGroupee) : dps(def);
      dpsBloqueParDef.set(def, v);
    }
    return v;
  }

  function bonusDuDieu(etat: EtatPartie): BonusFamille | undefined {
    return dieux[etat.config.dieu]?.bonus;
  }

  /** DPS d'un niveau de tour d'une famille, bonus de famille du dieu compris (les tours posées le portent déjà dans leurs stats). */
  function dpsFamille(etat: EtatPartie, def: DefNiveauTour, famille: IdFamille, arrete = false): number {
    const bonus = bonusDuDieu(etat);
    if (!bonus || bonus.famille !== famille) return arrete ? dpsBloque(def) : dps(def);
    const table = arrete ? dpsAvecBonusBloqueParDef : dpsAvecBonusParDef;
    let v = table.get(def);
    if (v === undefined) {
      const groupee = horde || arrete;
      const cibles = horde ? EQUILIBRAGE.ciblesParRayonDeZoneHorde : arrete ? EQUILIBRAGE.ciblesParRayonDeZoneBloquees : undefined;
      v = estTourDeZone(def) && groupee ? dpsMoyen(avecBonus(def, famille, bonus), cibles, EQUILIBRAGE.presenceChaineGroupee) : dpsMoyen(avecBonus(def, famille, bonus));
      table.set(def, v);
    }
    return v;
  }

  /** Gain de puissance qu'une tour de zone moyenne (catapulte de niveau 2) tirerait de soldats qui arrêtent les ennemis devant elle. */
  function zoneAttendue(etat: EtatPartie): number {
    if (!famillePermise(etat, 'artillerie', options.familles)) return 0;
    const def = TOURS.artillerie.niveaux[1];
    return Math.max(0, dpsFamille(etat, def, 'artillerie', true) - dpsFamille(etat, def, 'artillerie'));
  }

  function cout(etat: EtatPartie, def: DefNiveauTour, famille: IdFamille): number {
    const bonus = bonusDuDieu(etat);
    return bonus ? prixDe(def, famille, bonus) : def.cout;
  }

  /** Les places libres du radeau (aucune sans radeau). */
  function placesLibres(etat: EtatPartie): LieuTour[] {
    return positionsPlaces.flatMap((_, place) => (tourSurPlace(etat, place) ? [] : [{ place }]));
  }

  /**
   * Le lieu libre qui apporte le plus de couverture : parmi les cases les mieux classées pour cette famille et, si la tour peut y aller
   * (`surRadeau`), les places libres du radeau.
   */
  function meilleurLieu(etat: EtatPartie, famille: IdFamille | 'divine', portee: number, surRadeau = false): LieuTour | undefined {
    majCouverture(etat);
    let meilleur: LieuTour | undefined;
    let meilleureVue = -1;
    const lieux: LieuTour[] = meilleuresCasesLibres(etat, famille, CASES_PAR_FAMILLE).map((c) => ({ cx: c.cx, cy: c.cy }));
    if (surRadeau) lieux.push(...placesLibres(etat));
    for (const lieu of lieux) {
      const v = utiliteAjoutee(lieu, portee, SATURATION_DPS / 2);
      if (v > meilleureVue) {
        meilleureVue = v;
        meilleur = lieu;
      }
    }
    return meilleur;
  }

  /** Vrai si la tour posée est celle de ce lieu. */
  function estAuLieu(t: Tour, lieu: LieuTour): boolean {
    return lieu.place !== undefined ? t.place === lieu.place : t.place < 0 && t.cx === lieu.cx && t.cy === lieu.cy;
  }

  function valeur(etat: EtatPartie, lieu: LieuTour, def: DefNiveauTour, famille: IdFamille): number {
    const memeFamille = etat.tours.filter((t) => t.famille === famille && !estAuLieu(t, lieu)).length;
    // Une tour qui ne touche pas les volants perd la part de menace qu'ils représentent (rien à retrancher quand il n'y en a pas).
    const touchee = def.volants ? 1 : 1 - parts.volants;
    const pleine = dpsFamille(etat, def, famille);
    const libre = pleine * touchee;
    const arrete = estTourDeZone(def) ? dpsFamille(etat, def, famille, true) * touchee : libre;
    // Sur un couloir, seuls des volants passent : une tour qui les vise y compte en entier, une autre pas du tout.
    let utilite_ = utiliteAjoutee(lieu, def.portee, libre, arrete, def.volants ? pleine : 0);
    // Des soldats qui arrêtent les ennemis valent aussi ce qu'ils apportent à la zone posée (ou à celle qu'on prépare).
    if (def.soldats && def.soldats.nombre > 0 && lieu.place === undefined) {
      const rallie = ralliementParDefaut(etat.chemins, lieu.cx, lieu.cy, def.portee);
      if (rallie) utilite_ += utiliteBlocage(rallie, (variante.blocage ?? 0) * zoneAttendue(etat));
    }
    return (utilite_ * variante.poids[famille]) / (1 + (variante.diversite ?? 0) * memeFamille);
  }

  /** Tous les achats possibles (construction, amélioration, spécialisation), classés par valeur gagnée par arête. */
  function candidats(etat: EtatPartie): Candidat[] {
    const liste: Candidat[] = [];
    majCouverture(etat);
    for (const famille of FAMILLES.filter((f) => famillePermise(etat, f, options.familles))) {
      const def = TOURS[famille].niveaux[0];
      for (const { cx, cy } of meilleuresCasesLibres(etat, famille, CASES_PAR_FAMILLE)) {
        liste.push({ action: { type: 'construire', cx, cy, tour: famille }, ratio: valeur(etat, { cx, cy }, def, famille) / cout(etat, def, famille) });
      }
      // Radeau : les places libres, pour les tours qui ne posent rien au sol.
      if (!poseAuSol(def)) {
        for (const lieu of placesLibres(etat)) {
          liste.push({ action: { type: 'construire', tour: famille, ...lieu }, ratio: valeur(etat, lieu, def, famille) / cout(etat, def, famille) });
        }
      }
    }
    for (const tour of etat.tours) {
      const lieu = lieuDeLaTour(tour);
      const actuelle = defCourante(tour);
      if (tour.famille === 'divine' || !actuelle || tour.niveau >= 4) continue;
      const famille = TOURS[tour.famille];
      // La tour ne compte pas dans la couverture qu'elle améliore.
      deplacerCouverture(tour, -1);
      const avant = valeur(etat, lieu, actuelle, tour.famille);
      // Sur le radeau, un niveau qui poserait quelque chose au sol serait refusé : ce n'est pas un achat.
      const permis = (def: DefNiveauTour): boolean => tour.place < 0 || !poseAuSol(def);
      if (tour.niveau < 3) {
        const suivante = famille.niveaux[tour.niveau];
        if (suivante && permis(suivante)) liste.push({ action: { type: 'ameliorer', ...lieu }, ratio: (valeur(etat, lieu, suivante, tour.famille) - avant) / cout(etat, suivante, tour.famille) });
      } else {
        for (const voie of ['A', 'B'] as const satisfies readonly Voie[]) {
          const spe = famille.specialisations[voie];
          if (permis(spe)) liste.push({ action: { type: 'specialiser', voie, ...lieu }, ratio: (valeur(etat, lieu, spe, tour.famille) - avant) / cout(etat, spe, tour.famille) });
        }
      }
      deplacerCouverture(tour, 1);
    }
    // Déblocage progressif : ce que le niveau n'a pas encore ouvert n'est pas un achat (le bot n'économise pas pour lui).
    const ouverts = liste.filter((c) => niveauDeblocage(etat, c.action) === null);
    ouverts.sort((a, b) => b.ratio - a.ratio);
    const divine = candidatDivine(etat, ouverts[0]?.ratio ?? 0);
    if (divine) ouverts.unshift(divine);
    const guetteurs = candidatGuetteurs(etat, ouverts[0]?.ratio ?? 0);
    if (guetteurs) ouverts.unshift(guetteurs);
    const couloir = candidatCouloir(etat, ouverts[0]?.ratio ?? 0);
    if (couloir) ouverts.unshift(couloir);
    return ouverts;
  }

  /**
   * Un groupe de volants annoncé dans un couloir : PV de chacun, protections (celles d'une élite montent d'un palier), temps passé sur une
   * tuile, nombre et intervalle entre deux volants.
   */
  interface GroupeCouloir {
    readonly couloir: number;
    readonly pv: number;
    readonly armure: number;
    readonly resistance: number;
    readonly secondesParTuile: number;
    readonly nombre: number;
    readonly intervalle: number;
  }

  /**
   * Les groupes de la vague en cours et de la prochaine (celle que le panneau annonce) qui traversent un couloir, avec les PV de chaque
   * volant (difficulté, élite et facteur du groupe compris) et ses protections. En Héroïque, le bot suppose chaque groupe d'élite.
   */
  function groupesAnnonces(etat: EtatPartie): GroupeCouloir[] {
    const groupes: GroupeCouloir[] = [];
    const pvDifficulte = (DIFFICULTES as Readonly<Record<string, { pvEnnemis: number }>>)[etat.config.defi ? DIFFICULTE_DES_DEFIS : etat.config.difficulte]?.pvEnnemis ?? 1;
    const elite = etat.config.defi === 'heroique';
    for (const vague of [etat.niveau.vagues[etat.vagues.lancees - 1], etat.niveau.vagues[etat.vagues.lancees]]) {
      for (const p of vague?.paquets ?? []) {
        const def = ennemis[p.ennemi];
        if (p.couloir === undefined || !def) continue;
        const estElite = (elite || p.elite === true) && !def.boss;
        const pv = def.pv * pvDifficulte * (p.facteurPv ?? 1) * (estElite ? REGLES.elite.facteurPv : 1);
        const armure = estElite ? palierSuperieur(def.armure) : def.armure;
        const resistance = estElite ? palierSuperieur(def.resistance) : def.resistance;
        groupes.push({ couloir: p.couloir, pv, armure, resistance, secondesParTuile: 1 / Math.max(def.vitesse, 0.1), nombre: Math.max(1, p.nombre), intervalle: p.intervalle });
      }
    }
    return groupes;
  }

  /**
   * DPS d'un niveau de tour contre les volants d'un groupe (armure et résistance, élites comprises), bonus de famille du dieu compris
   * si `famille` est donnée (une tour posée le porte déjà dans ses stats : `famille` absente).
   */
  function dpsAuVolant(etat: EtatPartie, def: DefNiveauTour, groupe: GroupeCouloir, famille?: IdFamille): number {
    const bonus = famille ? bonusDuDieu(etat) : undefined;
    const avec = bonus !== undefined && famille !== undefined && bonus.famille === famille;
    const clef = `${avec ? 'b' : '-'}:${String(groupe.armure)}:${String(groupe.resistance)}`;
    let table = dpsAuVolantParDef.get(def);
    if (!table) {
      table = new Map();
      dpsAuVolantParDef.set(def, table);
    }
    let v = table.get(clef);
    if (v === undefined) {
      v = dpsContre(avec ? avecBonus(def, famille, bonus) : def, groupe.armure, groupe.resistance);
      table.set(clef, v);
    }
    return v;
  }

  /**
   * Dégâts qu'une tour de cette puissance (contre ce groupe : `dpsAuVolant`) et de cette portée inflige à chaque volant d'un groupe qui
   * traverse le couloir : elle tire tant qu'un volant du groupe est à portée (temps à portée T d'un volant, plus l'étalement du groupe),
   * et partage ce feu entre les n volants, soit puissance × (T + (n − 1) × intervalle) / n, sans jamais dépasser ce qu'elle inflige à un
   * volant seul (puissance × T). Sur le radeau, chaque position compte pour sa part du temps.
   */
  function degatsAuVolant(lieu: LieuTour, portee: number, puissance: number, groupe: GroupeCouloir): number {
    const trajet = nombreChemins + groupe.couloir;
    let total = 0;
    for (const { indices, part } of couvertureDuLieu(lieu, portee)) {
      let vue = 0;
      for (const i of indices) if (echantillons[i]?.chemin === trajet) vue += PAS_ECHANTILLON;
      const aPortee = vue * groupe.secondesParTuile;
      if (aPortee > 0) total += part * puissance * Math.min(aPortee, (aPortee + (groupe.nombre - 1) * groupe.intervalle) / groupe.nombre);
    }
    return total;
  }

  /**
   * Vol de Corbeaux : chaque volant qui sort d'un couloir coûte un cœur, quelle que soit la faible part de menace du couloir dans le
   * niveau. Si les tours qui visent les volants n'infligent pas à chaque volant d'un groupe annoncé `MARGE_COULOIR` fois ses PV pendant
   * sa traversée (`degatsAuVolant`), le bot achète, pour le groupe le moins bien couvert, ce qui en ajoute le plus par arête : une tour qui vise les volants sur un lieu libre,
   * ou le niveau suivant d'une tour qui vise les volants. Valeur juste au-dessus du meilleur autre achat : le bot économise jusqu'à
   * pouvoir le payer.
   */
  function candidatCouloir(etat: EtatPartie, meilleurRatio: number): Candidat | null {
    if (etat.couloirs.length === 0) return null;
    // Le groupe le moins bien couvert d'abord (dégâts infligés rapportés au besoin) : un couloir nu passe avant un couloir déjà défendu.
    const parCouverture = groupesAnnonces(etat)
      .map((groupe) => {
        let degats = 0;
        for (const t of etat.tours) if (t.stats.volants) degats += degatsAuVolant(lieuDeLaTour(t), t.stats.portee, dpsAuVolant(etat, t.stats, groupe), groupe);
        return { groupe, couvert: degats / (MARGE_COULOIR * groupe.pv) };
      })
      .filter((g) => g.couvert < 1)
      .sort((a, b) => a.couvert - b.couvert);
    for (const { groupe } of parCouverture) {
      const meilleur: { action: Action | null; gain: number } = { action: null, gain: 0 };
      const proposer = (action: Action, gain: number): void => {
        if (gain > meilleur.gain && niveauDeblocage(etat, action) === null) Object.assign(meilleur, { action, gain });
      };
      for (const famille of FAMILLES.filter((f) => famillePermise(etat, f, options.familles) && TOURS[f].niveaux[0].volants)) {
        const def = TOURS[famille].niveaux[0];
        const lieux: LieuTour[] = [...casesLibres(etat).map((c) => ({ cx: c.cx, cy: c.cy })), ...(poseAuSol(def) ? [] : placesLibres(etat))];
        const puissance = dpsAuVolant(etat, def, groupe, famille);
        for (const lieu of lieux) proposer({ type: 'construire', tour: famille, ...lieu }, degatsAuVolant(lieu, def.portee, puissance, groupe) / cout(etat, def, famille));
      }
      for (const tour of etat.tours) {
        const actuelle = defCourante(tour);
        if (tour.famille === 'divine' || !actuelle?.volants || tour.niveau >= 3) continue;
        const suivante = TOURS[tour.famille].niveaux[tour.niveau];
        if (!suivante || (tour.place >= 0 && poseAuSol(suivante))) continue;
        const lieu = lieuDeLaTour(tour);
        const gain =
          degatsAuVolant(lieu, suivante.portee, dpsAuVolant(etat, suivante, groupe, tour.famille), groupe) -
          degatsAuVolant(lieu, actuelle.portee, dpsAuVolant(etat, actuelle, groupe, tour.famille), groupe);
        proposer({ type: 'ameliorer', ...lieu }, gain / cout(etat, suivante, tour.famille));
      }
      if (meilleur.action) return { action: meilleur.action, ratio: meilleurRatio * 1.03, imperatif: true };
    }
    return null;
  }

  /**
   * Contre les furtifs, une tour de Guetteurs des Toits (spécialisation A de la tour de tir, qui révèle les furtifs à portée)
   * par chemin : la tour de tir la plus avancée est montée puis spécialisée, ou construite sur la case libre qui voit le plus de
   * chemin. Une valeur juste au-dessus du meilleur autre achat : le bot économise jusqu'à pouvoir la payer.
   */
  function candidatGuetteurs(etat: EtatPartie, meilleurRatio: number): Candidat | null {
    if (parts.furtifs < PART_FURTIFS_MIN || !famillePermise(etat, 'tir', options.familles)) return null;
    // Pas avant que le premier furtif approche : les premières vagues se gagnent avec une défense ordinaire.
    if (etat.vagues.lancees < vagueFurtifs - 2) return null;
    const requis = etat.niveau.carte.chemins.length;
    if (etat.tours.filter((t) => t.famille === 'tir' && t.voie === 'A').length >= requis) return null;
    // Une tour de tir déjà spécialisée (voie B) ne peut plus devenir Guetteurs : seules celles du niveau 1 à 3 servent.
    const tir = etat.tours.filter((t) => t.famille === 'tir' && t.niveau < 4).sort((a, b) => b.niveau - a.niveau)[0];
    const ratio = meilleurRatio * 1.02;
    if (tir) {
      const action: Action = tir.niveau >= 3 ? { type: 'specialiser', voie: 'A', ...lieuDeLaTour(tir) } : { type: 'ameliorer', ...lieuDeLaTour(tir) };
      // Pas encore débloqués à ce niveau : on ne bloque pas les arêtes pour des Guetteurs impossibles.
      return niveauDeblocage(etat, action) === null ? { action, ratio, imperatif: true } : null;
    }
    const meilleur = meilleurLieu(etat, 'tir', TOURS.tir.niveaux[0].portee);
    return meilleur ? { action: { type: 'construire', tour: 'tir', ...meilleur }, ratio, imperatif: true } : null;
  }

  /**
   * La tour divine, dès que la défense compte trois tours : sur la case libre qui voit le plus de chemin, avec une
   * valeur juste au-dessus du meilleur autre achat (le bot ne sait pas la chiffrer comme une tour ordinaire).
   */
  function candidatDivine(etat: EtatPartie, meilleurRatio: number): Candidat | null {
    if (!(options.tourDivine ?? true)) return null;
    const dieu = dieux[etat.config.dieu];
    if (!dieu || etat.tours.length < 3 || etat.tours.some((t) => t.famille === 'divine')) return null;
    if (niveauDeblocage(etat, { type: 'construire', cx: 0, cy: 0, tour: 'divine' }) !== null) return null;
    // Au défi Fer, la tour divine suit la famille de son dieu : elle n'est permise que si cette famille l'est.
    if (!famillePermise(etat, dieu.bonus.famille, options.familles)) return null;
    // Sur le radeau aussi quand elle ne pose rien au sol (celle de Charlie).
    const meilleur = meilleurLieu(etat, 'divine', dieu.tourDivine.portee, !poseAuSol(dieu.tourDivine));
    return meilleur ? { action: { type: 'construire', tour: 'divine', ...meilleur }, ratio: meilleurRatio * 1.01 } : null;
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

  /**
   * Point de chaque chemin où les tours posées concentrent le plus de feu. Une tour compte par la couverture de son lieu
   * (`couvertureDuLieu`) : sur une case, ses alentours ; sur le radeau, la moyenne des positions de sa place, qui ne dépend pas de
   * l'endroit où se trouve le radeau au moment du calcul.
   */
  function calculerZones(etat: EtatPartie): void {
    // Une tour du radeau (cx = cy = -1) compte par sa place ; une tour sur une case, comme avant.
    const clef = etat.tours.reduce((a, t) => a + t.coutCumule + 1000 * (t.place >= 0 ? -100000 * (t.place + 1) : t.cx + 100 * t.cy), 0);
    if (clef === clefZones) return;
    clefZones = clef;
    const feu = new Float64Array(echantillons.length);
    for (const t of etat.tours) {
      const puissance = dps(t.stats);
      for (const { indices, part } of couvertureDuLieu(lieuDeLaTour(t), t.stats.portee)) for (const i of indices) feu[i] = (feu[i] ?? 0) + part * puissance;
    }
    zones = etat.chemins.map((_, chemin) => {
      let meilleur: Echantillon | undefined;
      let max = 0;
      for (const [i, e] of echantillons.entries()) {
        if (e.chemin !== chemin) continue;
        const somme = feu[i] ?? 0;
        if (somme > max) {
          max = somme;
          meilleur = e;
        }
      }
      return meilleur;
    });
  }

  /**
   * Vol de Corbeaux : le couloir que le héros doit couvrir, s'il tire sur les volants et que les volants d'un couloir pèsent plus que
   * le chemin le plus menacé, dans la vague en cours (ennemis vivants) ou, terrain vide, dans la prochaine (celle que le panneau annonce).
   */
  function couloirAGarder(etat: EtatPartie): number | null {
    if (etat.couloirs.length === 0 || heros[etat.config.heros]?.capacites.distance?.volants !== true) return null;
    const menaces = poids.map(() => 0);
    const vivants = etat.ennemis.filter((e) => e.vivant);
    if (vivants.length > 0) {
      for (const e of vivants) {
        const t = e.couloir >= 0 ? nombreChemins + e.couloir : e.chemin;
        menaces[t] = (menaces[t] ?? 0) + e.pv;
      }
    } else {
      for (const p of etat.niveau.vagues[etat.vagues.lancees]?.paquets ?? []) {
        const t = trajetDuPaquet(etat.niveau, p);
        menaces[t] = (menaces[t] ?? 0) + menacePaquet(p);
      }
    }
    let couloir: number | null = null;
    let max = Math.max(0, ...menaces.slice(0, nombreChemins));
    for (let k = 0; k < etat.couloirs.length; k++) {
      const m = menaces[nombreChemins + k] ?? 0;
      if (m > max) {
        max = m;
        couloir = k;
      }
    }
    return couloir;
  }

  /** Le point des chemins le plus proche de la hauteur du couloir : le croisement où le héros tireur se poste. */
  function croisement(couloir: number): Echantillon | undefined {
    const y = hauteursCouloirs[couloir];
    if (y === undefined) return undefined;
    let meilleur: Echantillon | undefined;
    for (const e of echantillons) {
      if (e.chemin >= nombreChemins) continue;
      if (!meilleur || Math.abs(e.y - y) < Math.abs(meilleur.y - y)) meilleur = e;
    }
    return meilleur;
  }

  function ordreHeros(etat: EtatPartie): Action | null {
    calculerZones(etat);
    let cheminCle = 0;
    poids.forEach((p, i) => {
      if (i < nombreChemins && p > (poids[cheminCle] ?? 0)) cheminCle = i;
    });
    const couloir = couloirAGarder(etat);
    const zone = couloir !== null ? croisement(couloir) : zones[cheminCle];
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
      const venant = etat.ennemis.some((e) => e.vivant && e.couloir < 0 && e.chemin === chemin && e.distance >= zone.distance - 7 && e.distance <= zone.distance - 1);
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
        if (e.couloir < 0 && e.chemin === chemin && e.distance >= zone.distance - 3 && e.distance <= zone.distance + 1.5) nombre++;
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
        if (e.couloir < 0 && e.chemin === chemin && e.distance >= zone.distance - 4 && e.distance <= zone.distance + 1) nombre++;
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
        nombreChemins = etat.chemins.length;
        enCouloir = Uint8Array.from(echantillons, (e) => (e.chemin >= nombreChemins ? 1 : 0));
        hauteursCouloirs = etat.couloirs.map((c) => c.points[0]?.y ?? 0);
        const radeau = gimmickRadeau(etat.niveau);
        positionsPlaces = radeau ? radeau.places.map((_, n) => pasRepartis(radeau).map((pas) => positionPlace(radeau, pas, n))) : [];
        const lu = niveauLu(etat);
        horde = etat.niveau.horde === true;
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
  options: Pick<OptionsSoigneux, 'tourDivine' | 'familles'> = {},
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
