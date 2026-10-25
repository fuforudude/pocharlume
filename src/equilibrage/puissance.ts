// Puissance des tours communes par palier de coût (formule de src/data/equilibrage.ts), et écart de chaque tour
// à la moyenne de son palier.
import { EQUILIBRAGE, paliersFamille, puissanceTour } from '../data/equilibrage';
import { FAMILLES, TOURS } from '../data/tours';

export interface PuissanceTour {
  readonly nom: string;
  readonly famille: string;
  /** 1 à 3, ou 4 pour une spécialisation. */
  readonly palier: number;
  readonly coutCumule: number;
  readonly puissance: number;
  /** Écart relatif à la moyenne du palier (0,1 = 10 % au-dessus). */
  readonly ecart: number;
}

export function puissancesParPalier(): PuissanceTour[] {
  const tours = FAMILLES.flatMap((famille) => paliersFamille(TOURS[famille]).map((p) => ({ famille, ...p })));
  return [1, 2, 3, 4].flatMap((palier) => {
    const groupe = tours.filter((t) => t.palier === palier).map((t) => ({ ...t, puissance: puissanceTour(t.def, t.coutCumule) }));
    const moyenne = groupe.reduce((a, t) => a + t.puissance, 0) / groupe.length;
    return groupe.map((t) => ({
      nom: t.def.nom,
      famille: t.famille,
      palier,
      coutCumule: t.coutCumule,
      puissance: t.puissance,
      ecart: t.puissance / moyenne - 1,
    }));
  });
}

/** Tours hors de la tolérance d'écart à la moyenne de leur palier. */
export function toursHorsTolerance(): PuissanceTour[] {
  return puissancesParPalier().filter((t) => Math.abs(t.ecart) > EQUILIBRAGE.tolerancePuissance);
}
