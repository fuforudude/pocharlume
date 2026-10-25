// Bot « soigneux » : un bon joueur. Il connaît la carte (longueur de chemin que chaque socle couvre, poids de
// chaque chemin dans les vagues) et achète toujours ce qui rapporte le plus de puissance par arête dépensée
// (recherche gloutonne sur le choix du socle, de la famille, du niveau et de la spécialisation). Il place son
// héros là où ses tours concentrent leur feu, lance la Chute du Colosse sur les grappes d'ennemis et les
// Renforts devant ses tours, et appelle la vague suivante dès que le terrain est vide et qu'il n'a plus rien à
// acheter. Une petite recherche en amont (`optimiserBot`) choisit parmi quelques variantes de préférence de
// famille celle qui joue le mieux le niveau, en simulant des parties d'entraînement.
import { validerAction } from '../engine';
import type { Action, DefDieu, DefNiveauTour, DefSort, EtatPartie, IdFamille, Niveau, Point, Tour, Voie } from '../engine';
import { DIEUX } from '../data/dieux';
import { dpsEfficace } from '../data/equilibrage';
import { FAMILLES, TOURS } from '../data/tours';
import { distance, echantillonner, longueurVue, poidsDesChemins, type Echantillon } from './geometrie';
import { jouerPartie, type Bot, type ResultatPartie } from './simulation';

/** Une préférence de famille : le poids multiplie la valeur d'une tour de cette famille. */
export interface VarianteSoigneux {
  readonly nom: string;
  readonly poids: Readonly<Record<IdFamille, number>>;
}

const EQUILIBREE: VarianteSoigneux = { nom: 'équilibrée', poids: { caserne: 1, tir: 1, magie: 1, artillerie: 1 } };

export const VARIANTES: readonly VarianteSoigneux[] = [
  EQUILIBREE,
  { nom: 'tir', poids: { caserne: 0.8, tir: 1.4, magie: 0.9, artillerie: 0.9 } },
  { nom: 'artillerie', poids: { caserne: 0.8, tir: 0.9, magie: 0.9, artillerie: 1.4 } },
  { nom: 'magie', poids: { caserne: 0.8, tir: 0.9, magie: 1.4, artillerie: 0.9 } },
  { nom: 'caserne', poids: { caserne: 1.5, tir: 0.9, magie: 0.9, artillerie: 0.9 } },
  { nom: 'sans caserne', poids: { caserne: 0.01, tir: 1.1, magie: 1, artillerie: 1.1 } },
];

export interface OptionsSoigneux {
  readonly variante?: VarianteSoigneux;
  /** Appelle la vague suivante dès que le terrain est vide et qu'il n'y a plus rien à acheter. */
  readonly appelerEnAvance?: boolean;
  /** Utilise le héros et les sorts. */
  readonly sorts?: boolean;
}

interface Candidat {
  readonly action: Action;
  readonly ratio: number;
}

const dieux: Readonly<Record<string, DefDieu>> = DIEUX;

function dpsMoyen(def: DefNiveauTour): number {
  const dps = dpsEfficace(def);
  return dps.reduce((a, b) => a + b, 0) / dps.length;
}

function defCourante(tour: Tour): DefNiveauTour | undefined {
  if (tour.famille === 'divine') return undefined;
  const famille = TOURS[tour.famille];
  if (tour.niveau <= 3) return famille.niveaux[tour.niveau - 1];
  return tour.voie ? famille.specialisations[tour.voie] : undefined;
}

export function creerBotSoigneux(options: OptionsSoigneux = {}): Bot {
  const variante = options.variante ?? EQUILIBREE;
  const appelerEnAvance = options.appelerEnAvance ?? true;
  const utiliserSorts = options.sorts ?? true;

  let echantillons: Echantillon[] = [];
  let poids: number[] = [];
  const vues = new Map<string, number>();
  const dpsParDef = new Map<DefNiveauTour, number>();
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

  function valeur(etat: EtatPartie, socle: number, def: DefNiveauTour, famille: IdFamille): number {
    return dps(def) * vue(etat, socle, def.portee) * variante.poids[famille];
  }

  /** Tous les achats possibles (construction, amélioration, spécialisation), classés par valeur gagnée par arête. */
  function candidats(etat: EtatPartie): Candidat[] {
    const liste: Candidat[] = [];
    etat.niveau.carte.socles.forEach((_, socle) => {
      const tour = etat.tours.find((t) => t.socle === socle);
      if (!tour) {
        for (const famille of FAMILLES) {
          const def = TOURS[famille].niveaux[0];
          liste.push({ action: { type: 'construire', socle, tour: famille }, ratio: valeur(etat, socle, def, famille) / def.cout });
        }
        return;
      }
      const actuelle = defCourante(tour);
      if (tour.famille === 'divine' || !actuelle || tour.niveau >= 4) return;
      const famille = TOURS[tour.famille];
      const avant = valeur(etat, socle, actuelle, tour.famille);
      if (tour.niveau < 3) {
        const suivante = famille.niveaux[tour.niveau];
        if (suivante) liste.push({ action: { type: 'ameliorer', socle }, ratio: (valeur(etat, socle, suivante, tour.famille) - avant) / suivante.cout });
        return;
      }
      for (const voie of ['A', 'B'] as const satisfies readonly Voie[]) {
        const spe = famille.specialisations[voie];
        liste.push({ action: { type: 'specialiser', socle, voie }, ratio: (valeur(etat, socle, spe, tour.famille) - avant) / spe.cout });
      }
    });
    return liste.sort((a, b) => b.ratio - a.ratio);
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

  function viserSort(etat: EtatPartie, sort: DefSort, emplacement: number): Action | null {
    if ((etat.sorts[emplacement]?.recharge ?? 1) > 0) return null;
    const ennemis = etat.ennemis.filter((e) => e.vivant);
    if (ennemis.length === 0) return null;
    if (!sort.effets.some((e) => e.type === 'invoquer')) {
      // Dégâts de zone : centrer sur l'ennemi qui a le plus de voisins.
      let meilleur: { x: number; y: number; nombre: number; boss: boolean } | null = null;
      const r2 = sort.rayon * sort.rayon;
      for (const e of ennemis) {
        let nombre = 0;
        let boss = false;
        for (const autre of ennemis) {
          if ((e.x - autre.x) * (e.x - autre.x) + (e.y - autre.y) * (e.y - autre.y) <= r2) {
            nombre++;
            boss ||= autre.boss;
          }
        }
        if (!meilleur || nombre > meilleur.nombre) meilleur = { x: e.x, y: e.y, nombre, boss };
      }
      if (!meilleur || (meilleur.nombre < 3 && !meilleur.boss)) return null;
      return { type: 'lancerSort', emplacement, x: meilleur.x, y: meilleur.y };
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
export function optimiserBot(niveau: Niveau, difficulte: string, graines: readonly number[], variantes: readonly VarianteSoigneux[] = VARIANTES): ResultatRecherche {
  const notes = variantes.map((variante) => {
    let note = 0;
    for (const graine of graines) note += noterPartie(jouerPartie(niveau, creerBotSoigneux({ variante }), { graine, difficulte }));
    return { variante, note };
  });
  let meilleur = notes[0];
  for (const n of notes) if (!meilleur || n.note > meilleur.note) meilleur = n;
  if (!meilleur) throw new Error('Aucune variante à essayer');
  return { variante: meilleur.variante, notes };
}
