// Génération des vagues d'un niveau de campagne avec le générateur d'équilibrage. Appelée seulement par
// `npm run niveaux` (tools/niveaux/generer.ts), qui fige le résultat dans vagues-region1.ts : le jeu ne génère
// jamais de vague à l'exécution. Les tests vérifient que le fichier figé correspond à ce que ce code produit.
import type { DefEnnemi, Vague } from '../../engine/definitions';
import { ENNEMIS, type IdEnnemi } from '../ennemis';
import { budgetVague, EQUILIBRAGE, genererVague } from '../equilibrage';
import type { PlanNiveau } from './plan-niveau';

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
}

/** Les vagues d'un niveau, telles que son plan les demande. */
export function vaguesDuPlan(plan: PlanNiveau): Vague[] {
  return genererVaguesNiveau({ niveau: plan.numero, chemins: plan.chemins.length, ...plan.vagues });
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
      }).paquets];
    const boss = plan.boss;
    if (boss && boss.vague === w) {
      paquets.push({ ennemi: boss.ennemi, nombre: 1, intervalle: 0, chemin: boss.chemin, delai: boss.delai });
    }
    vagues.push({ paquets });
  }
  return vagues;
}
