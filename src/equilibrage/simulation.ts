// Simulation sans affichage d'une partie complète jouée par un bot. Le bot ne passe que par l'API publique du
// moteur (`avancer` avec des actions), exactement comme l'interface : il lit l'état mais ne le modifie jamais
// directement.
import { avancer, creerPartie, derniereVagueTerminee, PAS_PAR_SECONDE } from '../engine';
import type { Action, ConfigPartie, DefEnnemi, DefiPartie, EtatPartie, IdFamille, LieuTour, Niveau, Statut, Tour, Voie } from '../engine';
import { ENNEMIS } from '../data/ennemis';
import { VERSION_DONNEES } from '../data/version';

/** Clé d'un lieu de tour : la case (« cx,cy ») ou la place du radeau (« radeau n »). */
export function cleDuLieu(lieu: LieuTour): string {
  return lieu.place !== undefined ? `radeau ${String(lieu.place)}` : `${String(lieu.cx)},${String(lieu.cy)}`;
}

/** Le lieu d'une tour posée : sa place sur le radeau, ou sa case. */
export function lieuDeLaTour(tour: Tour): LieuTour {
  return tour.place >= 0 ? { place: tour.place } : { cx: tour.cx, cy: tour.cy };
}

/** Un joueur automatique : il regarde l'état et renvoie les actions à jouer à ce pas. */
export interface Bot {
  readonly nom: string;
  decider(etat: EtatPartie): readonly Action[];
}

/** Un choix de tour du bot : famille construite, ou spécialisation prise. */
export interface ChoixTour {
  readonly famille: IdFamille;
  /** Absent pour une construction, voie pour une spécialisation. */
  readonly voie?: Voie;
}

export interface ResultatPartie {
  readonly statut: Statut;
  readonly vies: number;
  readonly viesDepart: number;
  readonly etoiles: number;
  /** Durée de la partie en secondes de jeu. */
  readonly secondes: number;
  /** Arêtes non dépensées à la fin de la partie. */
  readonly aretesFin: number;
  /** Vies perdues pendant chaque vague (indice 0 = vague 1). */
  readonly viesPerduesParVague: readonly number[];
  /** Constructions et spécialisations jouées, dans l'ordre. */
  readonly choix: readonly ChoixTour[];
  /** Nombre d'actions acceptées par le moteur. */
  readonly actions: number;
  /** Lancers de chaque sort du dieu acceptés par le moteur (indice = emplacement). */
  readonly sorts: readonly number[];
  /** La tour divine du dieu a été construite au moins une fois. */
  readonly tourDivine: boolean;
  /** Dernière vague terminée à la fin de la partie (l'infini : le « record » de la partie). */
  readonly vagueTerminee?: number;
  /** Boss tués pendant la partie (type de l'ennemi, dans l'ordre des morts). */
  readonly bossTues?: readonly string[];
  /** Points de vie les plus bas atteints par un boss de la partie (null s'il n'y en a pas eu) : ce qui reste de lui à l'instant le plus proche de sa mort. */
  readonly pvMinBoss?: number | null;
}

/** Ce qu'apporte le joueur à une partie : son dieu, son héros et ce que la méta-progression lui a donné. */
export interface Joueur {
  /** Dieu joué (Charlie par défaut) et son héros (son avatar par défaut). */
  readonly dieu?: string;
  readonly heros?: string;
  readonly niveauHeros?: number;
  readonly competencesHeros?: Readonly<Record<string, number>>;
  readonly ameliorations?: Readonly<Record<string, number>>;
  readonly objets?: readonly string[];
  /** Défi joué (Héroïque ou Fer) : le moteur le joue avec les règles de Matou, quelle que soit la difficulté demandée. */
  readonly defi?: DefiPartie;
  /** Mode infini (jalon 4) sur une carte de cette région : les vagues sont générées par le moteur et la partie ne se gagne pas. */
  readonly infini?: { readonly region: number };
}

export interface OptionsPartie extends Joueur {
  readonly graine: number;
  readonly difficulte: string;
  /** Temps de jeu au-delà duquel on abandonne la partie (jamais atteint en pratique). */
  readonly secondesMax?: number;
  /** Infini : on arrête la partie quand cette vague est terminée (le coût des vagues croît de 8 % par vague). */
  readonly vagueMax?: number;
  /** Pas entre deux décisions du bot (15 = deux fois par seconde). */
  readonly periodeDecision?: number;
}

export function configPartie(o: OptionsPartie): ConfigPartie {
  const dieu = o.dieu ?? 'charlie';
  return {
    graine: o.graine,
    difficulte: o.difficulte,
    dieu,
    heros: o.heros ?? dieu,
    niveauHeros: o.niveauHeros ?? 1,
    competencesHeros: { ...o.competencesHeros },
    ameliorations: { ...o.ameliorations },
    objets: [...(o.objets ?? [])],
    versionDonnees: VERSION_DONNEES,
    ...(o.defi ? { defi: o.defi } : {}),
    ...(o.infini ? { infini: { region: o.infini.region } } : {}),
  };
}

const defsEnnemis: Readonly<Record<string, DefEnnemi>> = ENNEMIS;

/** Un bot qui ne fait rien : la défense du niveau se limite au héros immobile. */
export const BOT_INACTIF: Bot = { nom: 'inactif', decider: () => [] };

/**
 * Joue le niveau jusqu'à sa fin. Le bot est consulté tous les `periodeDecision` pas ; les actions qu'il
 * renvoie passent par `avancer` (le moteur les valide et refuse les impossibles sans rien changer).
 */
export function jouerPartie(niveau: Niveau, bot: Bot, options: OptionsPartie): ResultatPartie {
  const etat = creerPartie(niveau, configPartie(options));
  const periode = options.periodeDecision ?? PAS_PAR_SECONDE / 2;
  const limite = (options.secondesMax ?? 3600) * PAS_PAR_SECONDE;
  const viesPerduesParVague: number[] = niveau.vagues.map(() => 0);
  const vagueDe = new Map<number, number>();
  const choix: ChoixTour[] = [];
  const familleDuLieu = new Map<string, IdFamille>();
  const sorts: number[] = [0, 0];
  let tourDivine = false;
  let actions = 0;
  const bossTues: string[] = [];
  let pvMinBoss: number | null = null;

  const vagueMax = options.vagueMax ?? Infinity;
  while (etat.statut === 'en_cours' && etat.pas < limite && !(vagueMax < Infinity && etat.pas % periode === 0 && derniereVagueTerminee(etat) >= vagueMax)) {
    const aJouer = etat.pas % periode === 0 ? bot.decider(etat) : [];
    const resultats = avancer(etat, aJouer);
    aJouer.forEach((a, i) => {
      if (resultats[i]?.ok !== true) return;
      actions++;
      if (a.type === 'lancerSort') sorts[a.emplacement] = (sorts[a.emplacement] ?? 0) + 1;
      else if (a.type === 'construire' && a.tour === 'divine') tourDivine = true;
      if (a.type === 'construire' && a.tour !== 'divine') {
        familleDuLieu.set(cleDuLieu(a), a.tour);
        choix.push({ famille: a.tour });
      } else if (a.type === 'specialiser') {
        const famille = familleDuLieu.get(cleDuLieu(a));
        if (famille) choix.push({ famille, voie: a.voie });
      } else if (a.type === 'vendre') {
        familleDuLieu.delete(cleDuLieu(a));
      }
    });
    for (const e of etat.ennemis) if (e.boss && (pvMinBoss === null || e.pv < pvMinBoss)) pvMinBoss = e.pv;
    for (const ev of etat.evenements) {
      if (ev.type === 'mort') {
        if (defsEnnemis[ev.typeEnnemi]?.boss) {
          bossTues.push(ev.typeEnnemi);
          pvMinBoss = 0;
        }
      } else if (ev.type === 'apparition') vagueDe.set(ev.ennemi, Math.max(0, etat.vagues.lancees - 1));
      else if (ev.type === 'fuite') {
        const vague = vagueDe.get(ev.ennemi) ?? 0;
        viesPerduesParVague[vague] = (viesPerduesParVague[vague] ?? 0) + ev.vies;
      }
    }
  }
  return {
    statut: etat.statut,
    vies: etat.vies,
    viesDepart: etat.viesDepart,
    etoiles: etat.etoiles,
    secondes: etat.pas / PAS_PAR_SECONDE,
    aretesFin: etat.aretes,
    viesPerduesParVague,
    choix,
    actions,
    sorts,
    tourDivine,
    vagueTerminee: derniereVagueTerminee(etat),
    bossTues,
    pvMinBoss,
  };
}
