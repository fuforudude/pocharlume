// Le temps du moteur : des pas fixes de 1/30 s, jamais l'horloge.
export const PAS_PAR_SECONDE = 30;

/** Convertit une durée des données (secondes) en nombre entier de pas. */
export function enPas(secondes: number): number {
  return Math.round(secondes * PAS_PAR_SECONDE);
}
