// Coupures de chemin (nasse, foule qui bloque) : une portion de chemin où aucun ennemi au sol n'entre tant qu'elle tient.
//
// Règle choisie (déterministe et lisible) : un ennemi au sol qui n'a pas encore atteint l'entrée (`debut`) s'y arrête et attend ; celui qui
// l'a déjà passée continue. Personne ne fait demi-tour (les ennemis ne reculent jamais sur leur chemin). Un volant passe au-dessus. Les
// soldats et le héros ne peuvent pas être envoyés dans la portion coupée (refus `zone_bloquee`).
import { REGLES } from '../../data/regles';
import { calculerChemin, projeterSurChemin } from '../chemins';
import type { Niveau } from '../definitions';
import type { Barrage, EtatPartie } from '../etat';
import { enPas } from '../temps';

/** Vérifie une coupure écrite dans les données (`quoi` : où elle est écrite, pour le message). */
export function verifierCoupure(niveau: Niveau, quoi: string, chemin: number, debut: number, longueur: number, duree: number): void {
  const carte = niveau.carte.chemins[chemin];
  if (!Number.isInteger(chemin) || !carte) throw new Error(`${quoi} : chemin inconnu ${String(chemin)}`);
  const total = calculerChemin(carte).longueur;
  if (!(Number.isFinite(debut) && debut >= 0 && debut < total)) throw new Error(`${quoi} : début hors du chemin (${String(debut)})`);
  if (!(Number.isFinite(longueur) && longueur > 0)) throw new Error(`${quoi} : longueur invalide (${String(longueur)})`);
  if (!(Number.isFinite(duree) && duree > 0)) throw new Error(`${quoi} : durée invalide (${String(duree)})`);
}

/** Coupe `chemin` de `debut` à `debut + longueur` pendant `duree` secondes. */
export function ajouterBarrage(etat: EtatPartie, chemin: number, debut: number, longueur: number, duree: number): void {
  const restant = Math.max(1, enPas(duree));
  etat.dynamique.barrages.push({ chemin, debut, fin: debut + longueur, restant });
  etat.evenements.push({ type: 'barrage', chemin, debut, fin: debut + longueur, duree });
}

/** Décompte des coupures : celle dont le temps est écoulé se lève (événement `barrage_fin`). */
export function mettreAJourBarrages(etat: EtatPartie): void {
  const barrages = etat.dynamique.barrages;
  if (barrages.length === 0) return;
  let garde = 0;
  for (const b of barrages) {
    b.restant--;
    if (b.restant > 0) barrages[garde++] = b;
    else etat.evenements.push({ type: 'barrage_fin', chemin: b.chemin, debut: b.debut, fin: b.fin });
  }
  barrages.length = garde;
}

/**
 * La distance où s'arrête, ce pas-ci, un ennemi au sol de `chemin` qui passe de `avant` à `apres` : bornée à l'entrée de chaque coupure
 * qu'il n'avait pas encore franchie.
 */
export function borneBarrage(barrages: readonly Barrage[], chemin: number, avant: number, apres: number): number {
  let borne = apres;
  for (const b of barrages) if (b.chemin === chemin && avant <= b.debut && borne > b.debut) borne = b.debut;
  return borne;
}

/** Vrai si le point est dans une portion coupée : près du chemin coupé (`distanceMaxChemin`), entre l'entrée et la sortie. */
export function pointDansBarrage(etat: EtatPartie, x: number, y: number): boolean {
  for (const b of etat.dynamique.barrages) {
    const c = etat.chemins[b.chemin];
    if (!c) continue;
    const p = projeterSurChemin([c], x, y);
    if (p && p.ecart <= REGLES.distanceMaxChemin && p.distance >= b.debut && p.distance <= b.fin) return true;
  }
  return false;
}
