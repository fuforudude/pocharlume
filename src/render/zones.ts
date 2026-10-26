// Géométrie des zones qui durent (Voile de Nuit) : quelles tuiles le rayon touche. Séparée du rendu pour être testée.

/**
 * La tuile (colonne `tx`, ligne `ty`, côté `taille` pixels) touche-t-elle le disque de centre (cx, cy) et de rayon `r`
 * (mêmes unités que `taille`) ? Vrai si le point de la tuile le plus proche du centre est à l'intérieur du disque :
 * toute la zone réelle est donc couverte, bords compris.
 */
export function tuileTouchee(tx: number, ty: number, cx: number, cy: number, r: number, taille: number): boolean {
  const gauche = tx * taille;
  const haut = ty * taille;
  const px = cx < gauche ? gauche : cx > gauche + taille ? gauche + taille : cx;
  const py = cy < haut ? haut : cy > haut + taille ? haut + taille : cy;
  const dx = cx - px;
  const dy = cy - py;
  return dx * dx + dy * dy <= r * r;
}
