// Valeurs neutres et constructeurs pour les pouvoirs des unités, les modificateurs des compétences et les
// définitions de tours : les tables de données ne listent que ce qui s'écarte du neutre.
import type { CapacitesUnite, ModTour, ModUnite } from '../engine/definitions';

/** Unité ordinaire : aucun pouvoir, visible des ennemis. */
export const CAPACITES_NULLES: CapacitesUnite = {
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

export function capacites(champs: Partial<CapacitesUnite>): CapacitesUnite {
  return { ...CAPACITES_NULLES, ...champs };
}

/** Modificateur sans effet. */
export const MOD_UNITE_NUL: ModUnite = {
  pv: 0,
  degats: 0,
  cadence: 0,
  armure: 0,
  vitesse: 0,
  portee: 0,
  capacite: 0,
  esquive: 0,
  execution: 0,
  ignoreArmure: 0,
  critique: 0,
  regeneration: 0,
  rage: 0,
  zone: 0,
  soin: 0,
  nombreOuvrages: 0,
  cadenceOuvrages: 0,
  degatsOuvrages: 0,
};

export const MOD_TOUR_NUL: ModTour = {
  pvSoldats: 0,
  degats: 0,
  cadence: 0,
  portee: 0,
  zone: 0,
  critique: 0,
  ignoreArmure: 0,
  chaine: 0,
  spectres: 0,
  effets: [],
  unites: MOD_UNITE_NUL,
  nappe: null,
};

/** Les valeurs de chaque champ aux rangs 1, 2 et 3 : `rangsUnite({ esquive: [0.05, 0.1, 0.15] })`. */
export type ValeursParRang<T> = { readonly [K in keyof T]?: readonly [T[K], T[K], T[K]] };

function trois<T extends object>(neutre: T, valeurs: ValeursParRang<T>): readonly [T, T, T] {
  const rang = (i: 0 | 1 | 2): T => {
    const modificateur: T = { ...neutre };
    for (const cle of Object.keys(valeurs) as (keyof T)[]) {
      const trio = valeurs[cle];
      if (trio) modificateur[cle] = trio[i];
    }
    return modificateur;
  };
  return [rang(0), rang(1), rang(2)];
}

export function rangsUnite(valeurs: ValeursParRang<ModUnite>): readonly [ModUnite, ModUnite, ModUnite] {
  return trois(MOD_UNITE_NUL, valeurs);
}

export function rangsTour(valeurs: ValeursParRang<ModTour>): readonly [ModTour, ModTour, ModTour] {
  return trois(MOD_TOUR_NUL, valeurs);
}
