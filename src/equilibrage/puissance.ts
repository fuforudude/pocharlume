// Puissance des tours communes par palier de coût (formule de src/data/equilibrage.ts), et écart de chaque tour
// à la moyenne de son palier.
import type { DefNiveauTour } from '../engine';
import { DIEUX } from '../data/dieux';
import { dpsEfficace, EQUILIBRAGE, paliersFamille, puissanceTour } from '../data/equilibrage';
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

export interface PuissanceDivine {
  readonly dieu: string;
  readonly nom: string;
  readonly cout: number;
  /** Puissance par la formule des tours communes, effets de zone et de contrôle des tours divines compris (voir `dpsDivine`). */
  readonly puissance: number;
  /** Puissance moyenne des tours communes de coût cumulé voisin (à ± 30 % du coût de la tour divine). */
  readonly reference: number;
  /** Les tours communes qui ont servi de référence. */
  readonly tours: readonly { readonly nom: string; readonly palier: number; readonly coutCumule: number }[];
}

/**
 * DPS d'une tour divine : celui de la formule des tours communes, plus ce que celle-ci ne voit pas. L'onde du Totem touche
 * tout ce qui est à portée (on lui compte les cibles d'une zone d'un tuile de rayon) ; l'Atelier compte ses tourelles
 * (au maximum, en continu) et un piège par cadence (dégâts du piège seulement : l'immobilisation n'est pas chiffrée).
 */
export function dpsDivine(def: DefNiveauTour): number {
  const dps = dpsEfficace(def);
  let total = dps.reduce((a, b) => a + b, 0) / dps.length;
  if (def.onde && def.cadence > 0) total += total * EQUILIBRAGE.ciblesParRayonDeZone;
  const atelier = def.atelier;
  if (atelier?.constructeur) {
    const t = atelier.constructeur.tourelle;
    total += (atelier.constructeur.max * ((t.degats[0] + t.degats[1]) / 2)) / t.cadence;
  }
  if (atelier?.pieges) total += (atelier.pieges.piege.degats * 1) / atelier.pieges.cadence;
  return total;
}

/** Puissance des trois tours divines (formule des tours communes), comparée aux tours communes de coût voisin. */
export function puissancesDivines(): PuissanceDivine[] {
  const communes = FAMILLES.flatMap((famille) => paliersFamille(TOURS[famille]).map((p) => ({ famille, ...p })));
  return Object.entries(DIEUX).map(([dieu, def]) => {
    const cout = def.tourDivine.cout;
    const voisines = communes.filter((t) => t.palier < 4 && Math.abs(t.coutCumule - cout) <= cout * 0.3);
    const reference = voisines.reduce((a, t) => a + puissanceTour(t.def, t.coutCumule), 0) / Math.max(1, voisines.length);
    return {
      dieu,
      nom: def.tourDivine.nom,
      cout,
      puissance: (dpsDivine(def.tourDivine) * def.tourDivine.portee) / cout,
      reference,
      tours: voisines.map((t) => ({ nom: t.def.nom, palier: t.palier, coutCumule: t.coutCumule })),
    };
  });
}
