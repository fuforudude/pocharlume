// Vagues : lancement (par le joueur ou au bout du compte à rebours) et apparition des paquets.
import { REGLES } from '../data/regles';
import { defEnnemi } from './contenu';
import { ajouterEnnemi } from './ennemis';
import type { EtatPartie } from './etat';
import { enPas, PAS_PAR_SECONDE } from './temps';

/** Lance la vague suivante ; `bonus` est le bonus d'arêtes déjà versé (appel en avance). */
export function lancerVague(etat: EtatPartie, bonus: number): void {
  const v = etat.vagues;
  const index = v.lancees;
  const vague = etat.niveau.vagues[index];
  if (!vague) return;
  let duree = 0;
  for (const p of vague.paquets) {
    const debut = enPas(p.delai);
    const intervalle = enPas(p.intervalle);
    v.paquets.push({ vague: index, ennemi: p.ennemi, chemin: p.chemin, restants: p.nombre, intervalle, prochain: etat.pas + debut });
    duree = Math.max(duree, debut + intervalle * Math.max(0, p.nombre - 1));
  }
  v.lancees++;
  v.prochaine = v.lancees < etat.niveau.vagues.length ? etat.pas + duree + enPas(REGLES.delaiEntreVagues) : -1;
  etat.evenements.push({ type: 'vague', index, bonus });
}

/** Bonus d'arêtes pour un appel en avance, à partir de la deuxième vague. */
export function bonusAppel(etat: EtatPartie): number {
  const v = etat.vagues;
  if (v.lancees === 0 || v.prochaine === -1) return 0;
  // Calcul en entiers (pas restants × arêtes par seconde), une seule division : pas d'erreur d'arrondi.
  const restant = Math.max(0, v.prochaine - etat.pas);
  return Math.floor((restant * REGLES.aretesParSecondeAvance) / PAS_PAR_SECONDE);
}

export function mettreAJourVagues(etat: EtatPartie): void {
  const v = etat.vagues;
  if (v.prochaine !== -1 && etat.pas >= v.prochaine) lancerVague(etat, 0);
  let garde = 0;
  for (const p of v.paquets) {
    while (p.restants > 0 && etat.pas >= p.prochain) {
      const def = defEnnemi(p.ennemi);
      if (!def) throw new Error(`Ennemi inconnu : ${p.ennemi}`);
      ajouterEnnemi(etat, def, p.ennemi, p.chemin, 0);
      p.restants--;
      p.prochain += p.intervalle;
    }
    if (p.restants > 0) v.paquets[garde++] = p;
  }
  v.paquets.length = garde;
}
