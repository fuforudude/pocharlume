// Calculs d'arêtes sans erreur d'arrondi : on passe par des pourcentages entiers, car un produit par une
// fraction décimale (0,7, 0,85…) tombe souvent juste sous l'entier attendu (180 × 0,7 = 125,999…).

/** Part entière (arrondie vers le bas) d'un montant entier pour un pourcentage entier : 180, 70 → 126. */
export function partEntiere(montant: number, pourcentage: number): number {
  return Math.floor((montant * pourcentage) / 100);
}

/**
 * Montant arrondi au plus proche après un facteur des données (0,85 = −15 %). Le facteur est d'abord
 * ramené à un pourcentage entier, puis le calcul se fait en entiers : 70 × 0,85 → 60, pas 59.
 */
export function ajusterMontant(montant: number, facteur: number): number {
  return Math.round((montant * Math.round(facteur * 100)) / 100);
}
