// Capacités de famille par campagne (DLC « Temps modernes ») : les tours gardent leurs stats des données, et la campagne du niveau
// (`Niveau.campagne`, `histoire` par défaut) donne à chaque famille la capacité de src/data/capacites-campagne.ts. Ce module ne
// connaît que les mécaniques (Piquet, Renvoi, Sono, Perçage) : ni niveau ni tour par son nom.
//   - Piquet : `facteurPiquet`, appelé par `blesserUnite` (unites.ts) ;
//   - Renvoi : dissipation des nuages dans `appliquerCapacitesCampagne`, renvoi des tirs sur les tours dans tirs-ennemis.ts ;
//   - Sono : ralentissement de zone dans `appliquerCapacitesCampagne` ;
//   - Perçage : `avecCapacite`, appelé par `statsTour` (tours.ts), et `percageBouclier` lu par les coups directs.
import { CAPACITES_CAMPAGNE } from '../data/capacites-campagne';
import { appliquerEffet } from './degats';
import type { CapaciteFamille, CapaciteRenvoi, CapaciteSono, DefNiveauTour, EffetCoup, IdCampagne, Niveau } from './definitions';
import type { EtatPartie, FamilleTour, Tour, Unite } from './etat';
import { chercherParId, distance2 } from './recherche';
import { PAS_PAR_SECONDE } from './temps';

/** Campagne d'un niveau : `histoire` sans précision (ou pour une valeur inconnue venue d'un état relu). */
export function campagneDe(niveau: Niveau): IdCampagne {
  const c = niveau.campagne;
  return c !== undefined && Object.hasOwn(CAPACITES_CAMPAGNE, c) ? c : 'histoire';
}

/** La capacité que la campagne de la partie donne à cette famille de tours ; undefined s'il n'y en a pas (toujours pour la tour divine). */
export function capaciteDe(etat: EtatPartie, famille: FamilleTour): CapaciteFamille | undefined {
  if (famille === 'divine') return undefined;
  const capacites = CAPACITES_CAMPAGNE[campagneDe(etat.niveau)];
  return Object.hasOwn(capacites, famille) ? capacites[famille] : undefined;
}

/** Une tour en feu ou gelée n'exerce pas sa capacité. */
function active(t: Tour): boolean {
  return t.gel === 0 && t.desactivee === 0;
}

/** Portée de tir effective (aveuglement compris), comme celle des tirs (tours.ts). */
export function porteeEffective(t: Tour): number {
  return t.aveuglePas > 0 ? t.stats.portee * (1 - t.aveugleFacteur) : t.stats.portee;
}

/** Stats d'une tour avec la capacité de sa famille qui en change les coups (Perçage) ; les mêmes sinon. */
export function avecCapacite(etat: EtatPartie, famille: FamilleTour, stats: DefNiveauTour): DefNiveauTour {
  const capacite = capaciteDe(etat, famille);
  if (capacite?.type !== 'percage') return stats;
  return { ...stats, ignoreArmure: Math.min(1, stats.ignoreArmure + capacite.ignoreArmure), percageBouclier: true };
}

/**
 * Piquet : facteur des dégâts reçus par une unité (1 = inchangés). Un soldat d'une caserne qui a cette capacité subit moins tant qu'au moins
 * `soldats` soldats vivants de la même caserne (lui compris) retiennent des ennemis. Tous les dégâts reçus passent par ce facteur (coups,
 * nuage toxique, drain) ; une caserne en feu ou gelée n'exerce pas sa capacité, ses soldats encaissent tout.
 */
export function facteurPiquet(etat: EtatPartie, u: Unite): number {
  if (u.genre !== 'soldat' || u.tour < 0) return 1;
  const tour = chercherParId(etat.tours, u.tour);
  const capacite = tour ? capaciteDe(etat, tour.famille) : undefined;
  if (!tour || capacite?.type !== 'piquet' || !active(tour)) return 1;
  let tiennent = 0;
  for (const s of etat.unites) {
    if (s.tour === u.tour && s.genre === 'soldat' && !s.mort && s.bloques > 0) tiennent++;
  }
  return tiennent >= capacite.soldats ? 1 - capacite.reduction : 1;
}

/** Renvoi : les nuages toxiques (zones qui blessent les alliés) à portée de la tour se dissipent ; la liste est compactée sur place, sans allocation. */
function dissiperNuages(etat: EtatPartie, t: Tour): void {
  const zones = etat.zones;
  if (zones.length === 0) return;
  const portee = porteeEffective(t);
  const portee2 = portee * portee;
  let garde = 0;
  for (const z of zones) {
    if (z.degatsAllies <= 0 || distance2(z.x, z.y, t.x, t.y) > portee2) {
      zones[garde++] = z;
      continue;
    }
    etat.evenements.push({ type: 'dissipation', tour: t.id, zone: z.id, x: z.x, y: z.y });
    etat.evenements.push({ type: 'zone_fin', zone: z.id, x: z.x, y: z.y });
  }
  zones.length = garde;
}

/** Le ralentissement d'un pas de chaque Sono, créé une fois (les données ne changent pas) plutôt qu'à chaque pas et pour chaque tour. */
const EFFETS_SONO = new WeakMap<CapaciteSono, EffetCoup>();

function effetSono(sono: CapaciteSono): EffetCoup {
  let effet = EFFETS_SONO.get(sono);
  if (!effet) {
    effet = { type: 'ralentissement', chance: 1, duree: 1 / PAS_PAR_SECONDE, valeur: 1 - sono.ralentissement };
    EFFETS_SONO.set(sono, effet);
  }
  return effet;
}

/**
 * Sono : un ralentissement d'un pas, renouvelé à chaque pas, sur les ennemis de la zone. Il passe par la case d'effet « ralentissement »
 * (`appliquerEffet` garde le plus fort, sans cumul) : aucun ralentissement des données ne doit être plus faible que la Sono, sans quoi
 * il prendrait sa valeur (voir le test « aucun ralentissement… » de capacites-campagne.test.ts).
 */
function sonoriser(etat: EtatPartie, t: Tour, sono: CapaciteSono): void {
  const r = porteeEffective(t) * sono.rayon;
  const r2 = r * r;
  const effet = effetSono(sono);
  for (const e of etat.ennemis) {
    if (!e.vivant || (e.volant && !sono.volants) || distance2(e.x, e.y, t.x, t.y) > r2) continue;
    appliquerEffet(etat, e, effet);
  }
}

/**
 * Le pas des capacités de zone, avant les nuages et le déplacement des ennemis : les tours actives qui ont « Renvoi » dissipent les nuages
 * à leur portée, celles qui ont « Sono » ralentissent les ennemis autour d'elles. Rien dans la campagne `histoire`.
 */
export function appliquerCapacitesCampagne(etat: EtatPartie): void {
  if (campagneDe(etat.niveau) === 'histoire') return;
  for (const t of etat.tours) {
    const capacite = capaciteDe(etat, t.famille);
    if (!capacite || !active(t)) continue;
    if (capacite.type === 'renvoi') dissiperNuages(etat, t);
    else if (capacite.type === 'sono') sonoriser(etat, t, capacite);
  }
}

/**
 * Renvoi d'un tir sur les tours qui arrive sur `cible` : la première tour active (dans l'ordre de construction) qui a « Renvoi » et la
 * couvre de sa portée (elle comprise) compte ce tir ; un sur `chaque` est renvoyé. Rend la capacité si le tir est renvoyé, null sinon.
 */
export function renvoiDuTir(etat: EtatPartie, cible: Tour): { tour: Tour; capacite: CapaciteRenvoi } | null {
  if (campagneDe(etat.niveau) === 'histoire') return null;
  for (const t of etat.tours) {
    const capacite = capaciteDe(etat, t.famille);
    if (capacite?.type !== 'renvoi' || !active(t)) continue;
    const portee = porteeEffective(t);
    if (distance2(t.x, t.y, cible.x, cible.y) > portee * portee) continue;
    t.renvois++;
    return t.renvois % capacite.chaque === 0 ? { tour: t, capacite } : null;
  }
  return null;
}
