// Bonus de collection (skins et familiers) : de petites fractions de stats données à une famille de tours ou au héros,
// fixées au lancement dans `ConfigPartie.bonus`. Ignorés en défi Fer. Le plafond (+10 % par tour ou pour le héros) est
// vérifié par `verifierConfig`.
import { MOD_UNITE_NUL } from '../data/capacites';
import { REGLES } from '../data/regles';
import type { DefNiveauTour, IdFamille, ModUnite } from './definitions';
import type { BonusCollection, ConfigPartie, StatBonusHeros, StatBonusTour } from './etat';

export const STATS_BONUS_TOUR: readonly StatBonusTour[] = ['degats', 'cadence', 'portee', 'pvSoldats'];
export const STATS_BONUS_HEROS: readonly StatBonusHeros[] = ['pv', 'degats', 'cadence', 'regeneration'];

export function bonusVide(): BonusCollection {
  return { tours: {}, heros: {} };
}

/** Le bonus qui joue dans cette partie : celui de la config, rien en défi Fer. */
export function bonusEffectif(config: ConfigPartie): BonusCollection {
  return config.defi === 'fer' ? bonusVide() : (config.bonus ?? bonusVide());
}

/** Bonus d'une famille de tours (sa tour de base et ses spécialisations), ou undefined. */
export function bonusDeFamille(bonus: BonusCollection, famille: IdFamille): Partial<Record<StatBonusTour, number>> | undefined {
  return Object.hasOwn(bonus.tours, famille) ? bonus.tours[famille] : undefined;
}

/**
 * Applique le bonus d'une famille à un niveau de tour (le niveau 1, 2 ou 3 comme la spécialisation) : dégâts, cadence
 * et portée de la tour, et ceux de ses soldats ou spectres ; PV des soldats. Ne modifie pas l'original.
 */
export function appliquerBonusTour(def: DefNiveauTour, bonus: Partial<Record<StatBonusTour, number>>): DefNiveauTour {
  const degats = bonus.degats ?? 0;
  const cadence = bonus.cadence ?? 0;
  const portee = bonus.portee ?? 0;
  const pvSoldats = bonus.pvSoldats ?? 0;
  if (degats === 0 && cadence === 0 && portee === 0 && pvSoldats === 0) return def;
  const soldats = def.soldats
    ? {
        ...def.soldats,
        pv: def.soldats.pv * (1 + pvSoldats),
        degats: [def.soldats.degats[0] * (1 + degats), def.soldats.degats[1] * (1 + degats)] as const,
        cadence: def.soldats.cadence / (1 + cadence),
      }
    : null;
  const spectres = def.spectres
    ? {
        ...def.spectres,
        degats: [def.spectres.degats[0] * (1 + degats), def.spectres.degats[1] * (1 + degats)] as const,
        cadence: def.spectres.cadence / (1 + cadence),
      }
    : null;
  return {
    ...def,
    degats: [def.degats[0] * (1 + degats), def.degats[1] * (1 + degats)],
    cadence: def.cadence / (1 + cadence),
    portee: def.portee * (1 + portee),
    soldats,
    spectres,
  };
}

/**
 * Le bonus du héros sous forme de modificateur de stats : PV, dégâts et cadence en fractions ; la régénération (fraction)
 * est convertie en PV par seconde par `REGLES.regenerationBonusHeros`. Null s'il n'y a aucun bonus.
 */
export function modBonusHeros(bonus: Partial<Record<StatBonusHeros, number>>): ModUnite | null {
  const pv = bonus.pv ?? 0;
  const degats = bonus.degats ?? 0;
  const cadence = bonus.cadence ?? 0;
  const regeneration = (bonus.regeneration ?? 0) * REGLES.regenerationBonusHeros;
  if (pv === 0 && degats === 0 && cadence === 0 && regeneration === 0) return null;
  return { ...MOD_UNITE_NUL, pv, degats, cadence, regeneration };
}

/** Copie propre d'un bonus déjà vérifié : seulement les familles et les stats connues. */
export function copierBonus(bonus: BonusCollection | undefined): BonusCollection {
  const copie = bonusVide();
  if (!bonus) return copie;
  for (const famille of Object.keys(bonus.tours) as IdFamille[]) {
    const source = bonus.tours[famille];
    if (!source) continue;
    const stats: Partial<Record<StatBonusTour, number>> = {};
    for (const stat of STATS_BONUS_TOUR) if (Object.hasOwn(source, stat) && source[stat] !== undefined) stats[stat] = source[stat];
    copie.tours[famille] = stats;
  }
  for (const stat of STATS_BONUS_HEROS) if (Object.hasOwn(bonus.heros, stat) && bonus.heros[stat] !== undefined) copie.heros[stat] = bonus.heros[stat];
  return copie;
}
