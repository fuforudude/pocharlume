// Sorts du dieu : effets ciblés en un point (dégâts, effet de zone, invocation).
import { tirerEntre } from './aleatoire';
import { appliquerEffet, estVisible, infligerDegats } from './degats';
import type { DefSort } from './definitions';
import type { EtatPartie } from './etat';
import { distance2 } from './recherche';
import { enPas } from './temps';
import { creerUnite, placeEnFormation } from './unites';

export function lancerEffetsSort(etat: EtatPartie, sort: DefSort, x: number, y: number): void {
  const rayon2 = sort.rayon * sort.rayon;
  for (const effet of sort.effets) {
    if (effet.type === 'invoquer') {
      for (let i = 0; i < effet.nombre; i++) {
        const place = placeEnFormation(i, x, y);
        const u = creerUnite(etat, {
          genre: 'renfort',
          tour: -1,
          emplacement: i,
          x: place.x,
          y: place.y,
          ancreX: place.x,
          ancreY: place.y,
          stats: effet.unite,
          delaiReapparition: -1,
          duree: Math.max(1, enPas(effet.duree)),
          zone: null,
        });
        etat.evenements.push({ type: 'invocation', unite: u.id, genre: 'renfort', x: u.x, y: u.y });
      }
      continue;
    }
    for (const e of etat.ennemis) {
      // Comme les zones des tours, un sort ne touche pas un furtif non révélé.
      if (!e.vivant || (e.volant && !effet.volants) || !estVisible(e, false) || distance2(e.x, e.y, x, y) > rayon2) continue;
      if (effet.type === 'degats') infligerDegats(etat, e, tirerEntre(etat, effet.degats[0], effet.degats[1]), effet.typeDegats);
      else appliquerEffet(etat, e, effet.effet);
    }
  }
}

export function mettreAJourSorts(etat: EtatPartie): void {
  for (const s of etat.sorts) if (s.recharge > 0) s.recharge--;
}
