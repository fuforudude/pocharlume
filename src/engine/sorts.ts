// Sorts du dieu et objets consommables : effets ciblés en un point ou sur toute la carte (dégâts, effets, exécution,
// invocation, zone qui dure, pièges, arêtes, boost de tours, vies). Un sort et un objet sont décrits de la même façon.
import { tirerEntre } from './aleatoire';
import { appliquerEffet, estVisible, executer, infligerDegats } from './degats';
import type { CiblesEffet, DefSort, EffetSort, ZoneEffets } from './definitions';
import type { Ennemi, EtatPartie } from './etat';
import { modArbre } from './modificateurs';
import { distance2 } from './recherche';
import { creerZone, poserPiegesSurChemin } from './structures';
import { enPas } from './temps';
import { creerUnite, placeEnFormation } from './unites';

/** Recharge d'un sort en pas, arbre d'améliorations compris. */
export function rechargeSort(etat: EtatPartie, sort: DefSort, initiale = false): number {
  const facteur = 1 - modArbre(etat.config, 'sorts').recharge;
  return enPas((initiale ? sort.rechargeInitiale : sort.recharge) * facteur);
}

function visee(e: Ennemi, cibles: CiblesEffet | undefined): boolean {
  return cibles === undefined || cibles === 'tous' || (cibles === 'boss') === e.boss;
}

/** Applique `effet` aux ennemis visibles de la zone (ou de toute la carte si elle est globale). */
function surEnnemis(etat: EtatPartie, zone: ZoneEffets, x: number, y: number, volants: boolean, appliquer: (e: Ennemi) => void, cibles?: CiblesEffet): void {
  const rayon2 = zone.rayon * zone.rayon;
  for (const e of etat.ennemis) {
    // Comme les zones des tours, un sort de zone ne touche pas un furtif non révélé ; un effet global (Sablier) touche
    // tous les ennemis de la carte, furtifs non révélés compris.
    if (!e.vivant || (e.volant && !volants) || !(zone.global || estVisible(e, false)) || !visee(e, cibles)) continue;
    if (!zone.global && distance2(e.x, e.y, x, y) > rayon2) continue;
    appliquer(e);
  }
}

function appliquerEffetSort(etat: EtatPartie, zone: ZoneEffets, effet: EffetSort, x: number, y: number): void {
  switch (effet.type) {
    case 'invoquer':
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
      return;
    case 'degats':
      surEnnemis(etat, zone, x, y, effet.volants, (e) => infligerDegats(etat, e, tirerEntre(etat, effet.degats[0], effet.degats[1]), effet.typeDegats), effet.cibles);
      return;
    case 'effet':
      surEnnemis(
        etat,
        zone,
        x,
        y,
        effet.volants,
        (e) => {
          appliquerEffet(etat, e, effet.effet);
        },
        effet.cibles,
      );
      return;
    case 'execution':
      // Un boss ne meurt pas net : il perd une fraction de ses PV actuels.
      surEnnemis(etat, zone, x, y, effet.volants, (e) => {
        if (e.boss) infligerDegats(etat, e, e.pv * effet.fractionBoss, 'pur');
        else executer(etat, e);
      });
      return;
    case 'zone':
      creerZone(etat, effet.zone, x, y, zone.rayon);
      return;
    case 'pieges':
      poserPiegesSurChemin(etat, effet.piege, x, y, effet.nombre, effet.ecart);
      return;
    case 'aretes':
      etat.aretes += effet.montant;
      return;
    case 'boost': {
      const rayon2 = zone.rayon * zone.rayon;
      const pas = Math.max(1, enPas(effet.duree));
      for (const t of etat.tours) {
        if (distance2(t.x, t.y, x, y) > rayon2) continue;
        t.boostCadence = Math.max(t.boostPas > 0 ? t.boostCadence : 0, effet.cadence);
        t.boostPas = Math.max(t.boostPas, pas);
        etat.evenements.push({ type: 'boost', tour: t.id, duree: effet.duree });
      }
      return;
    }
    case 'vies': {
      const avant = etat.vies;
      etat.vies = Math.min(etat.viesDepart, etat.vies + effet.nombre);
      if (etat.vies > avant) etat.evenements.push({ type: 'regain_vies', vies: etat.vies - avant });
      return;
    }
  }
}

/** Lance les effets d'un sort ou d'un objet au point (x, y). */
export function lancerEffets(etat: EtatPartie, zone: ZoneEffets, x: number, y: number): void {
  for (const effet of zone.effets) appliquerEffetSort(etat, zone, effet, x, y);
}

export function mettreAJourSorts(etat: EtatPartie): void {
  for (const s of etat.sorts) if (s.recharge > 0) s.recharge--;
}
