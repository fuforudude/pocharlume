// Génération des vagues d'un niveau de campagne avec le générateur d'équilibrage. Appelée seulement par
// `npm run niveaux` (tools/niveaux/generer.ts), qui fige le résultat dans vagues-region1.ts : le jeu ne génère
// jamais de vague à l'exécution. Les tests vérifient que le fichier figé correspond à ce que ce code produit.
import type { DefEnnemi, Paquet, Vague } from '../../engine/definitions';
import { ENNEMIS, type IdEnnemi } from '../ennemis';
import { budgetVague, EQUILIBRAGE, genererVague } from '../equilibrage';
import type { PlanNiveau } from './plan-niveau';
import type { PlanNiveauModerne } from './plan-moderne-r1';

/** Un boss ajouté à une vague, en plus de ses ennemis ordinaires (son budget dépasse celui de la vague). */
export interface BossDeVague {
  /** Numéro de la vague (1 à N). */
  readonly vague: number;
  readonly ennemi: IdEnnemi;
  readonly chemin: number;
  /** Secondes après le lancement de la vague. */
  readonly delai: number;
}

export interface PlanVagues {
  /** Niveau de campagne L (1 à 100), pour le budget b(L, w). */
  readonly niveau: number;
  readonly nombre: number;
  /** Ennemis débloqués pour ce niveau, tirés dans cet ordre (l'ordre compte pour le déterminisme). */
  readonly ennemis: readonly IdEnnemi[];
  readonly graine: number;
  /** Facteur sur le budget de menace des vagues (1 par défaut : voir `PlanNiveau`). */
  readonly facteurBudget?: number;
  /** Nombre de chemins du niveau. */
  readonly chemins: number;
  readonly boss?: BossDeVague;
  /** Niveau de horde (jalon 5) : la densité d'avant, ennemis non renforcés et serrés (voir `genererVague`). */
  readonly horde?: boolean;
  /** Écart minimal entre deux ennemis d'un paquet (tuiles), à la place de `EQUILIBRAGE.ecartMinimalTuiles` : réglage fin d'un niveau. */
  readonly ecart?: number;
  /**
   * Nombre de couloirs du Vol de Corbeaux du niveau (0 ou absent : aucun). Présent, chaque groupe de volants tiré pour une vague vole
   * dans un couloir au lieu de suivre un chemin, à tour de rôle dans l'ordre des groupes (le 1er au couloir 0, le 2e au couloir 1…).
   * Les tirages du générateur ne changent pas : seul le trajet des groupes de volants est réécrit.
   */
  readonly couloirs?: number;
}

/** Réécrit le trajet des groupes de volants d'une vague : le k-ième va dans le couloir k modulo `couloirs`. */
function volantsEnCouloirs(paquets: readonly Paquet[], couloirs: number): Paquet[] {
  let k = 0;
  return paquets.map((p) => {
    if (!(ENNEMIS[p.ennemi as IdEnnemi] as DefEnnemi | undefined)?.volant) return p;
    const { ennemi, nombre, intervalle, delai, facteurPv } = p;
    const couloir = k++ % couloirs;
    return facteurPv === undefined ? { ennemi, nombre, intervalle, chemin: 0, couloir, delai } : { ennemi, nombre, intervalle, chemin: 0, couloir, delai, facteurPv };
  });
}

/** Les vagues d'un niveau, telles que son plan les demande. */
export function vaguesDuPlan(plan: PlanNiveau): Vague[] {
  // Un niveau du Vol de Corbeaux envoie ses volants dans ses couloirs.
  const couloirs = plan.gimmick?.type === 'corbeaux' ? plan.gimmick.couloirs.length : 0;
  return genererVaguesNiveau({ niveau: plan.numero, chemins: plan.chemins.length, ...plan.vagues, ...(couloirs > 0 ? { couloirs } : {}) });
}

export function genererVaguesNiveau(plan: PlanVagues): Vague[] {
  const tous = plan.ennemis.map((id) => [id, ENNEMIS[id] as DefEnnemi] as const);
  // Un volant ou un furtif exige un contre précis (tour qui touche le ciel, qui révèle) : dans un niveau qui en compte, les ennemis
  // ordinaires sont tirés `EQUILIBRAGE.repetitionOrdinaires` fois plus souvent, pour qu'ils ne fassent pas la moitié de la menace.
  const aDesSpeciaux = tous.some(([, def]) => def.volant || def.furtif);
  const ennemis = aDesSpeciaux
    ? tous.flatMap((e) => (e[1].volant || e[1].furtif ? [e] : Array.from({ length: EQUILIBRAGE.repetitionOrdinaires }, () => e)))
    : tous;
  const vagues: Vague[] = [];
  for (let w = 1; w <= plan.nombre; w++) {
    const paquets = [...genererVague({
        niveau: plan.niveau,
        vague: w,
        ennemis,
        graine: plan.graine,
        chemins: plan.chemins,
        ...(plan.facteurBudget === undefined ? {} : { budget: budgetVague(plan.niveau, w) * plan.facteurBudget }),
        ...(plan.horde === true ? { horde: true } : {}),
        ...(plan.ecart === undefined ? {} : { ecart: plan.ecart }),
      }).paquets];
    const couloirs = plan.couloirs ?? 0;
    if (couloirs > 0) paquets.splice(0, paquets.length, ...volantsEnCouloirs(paquets, couloirs));
    const boss = plan.boss;
    if (boss && boss.vague === w) {
      paquets.push({ ennemi: boss.ennemi, nombre: 1, intervalle: 0, chemin: boss.chemin, delai: boss.delai });
    }
    vagues.push({ paquets });
  }
  return vagues;
}

/**
 * Les vagues d'un niveau du DLC « Temps modernes » (plan-moderne-r1.ts) : même générateur, au budget du niveau L de l'histoire que le plan
 * désigne (`niveauBudget`), sur tous les chemins du niveau (un groupe prévu sur un chemin fermé prend son repli).
 */
export function vaguesDuPlanModerne(plan: PlanNiveauModerne<string>): Vague[] {
  const v = plan.vagues;
  return genererVaguesNiveau({
    niveau: v.niveauBudget,
    nombre: v.nombre,
    ennemis: v.ennemis,
    graine: v.graine,
    chemins: plan.chemins.length,
    ...(v.facteurBudget === undefined ? {} : { facteurBudget: v.facteurBudget }),
    ...(v.boss === undefined ? {} : { boss: v.boss }),
    ...(v.horde === true ? { horde: true } : {}),
  });
}
