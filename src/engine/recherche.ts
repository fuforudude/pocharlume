// Recherche par id dans les listes de l'état. Les ids croissent à la création et les listes gardent leur
// ordre (ajout en fin, retraits qui préservent l'ordre) : elles sont triées, d'où la dichotomie.

export function chercherParId<T extends { id: number }>(liste: readonly T[], id: number): T | undefined {
  let bas = 0;
  let haut = liste.length - 1;
  while (bas <= haut) {
    const milieu = (bas + haut) >>> 1;
    const element = liste[milieu];
    if (!element) return undefined;
    if (element.id === id) return element;
    if (element.id < id) bas = milieu + 1;
    else haut = milieu - 1;
  }
  return undefined;
}

export function distance2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}
