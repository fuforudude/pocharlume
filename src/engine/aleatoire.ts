// Générateur pseudo-aléatoire à graine (mulberry32). Son état est un entier non signé de 32 bits rangé
// dans l'objet qui le porte (l'état de partie, ou un générateur autonome) : il se sérialise avec lui.

export interface Generateur {
  rng: number;
}

export function creerGenerateur(graine: number): Generateur {
  return { rng: graine >>> 0 };
}

/** Nombre dans [0, 1). Fait avancer l'état du générateur. */
export function tirer(g: Generateur): number {
  const etat = (g.rng + 0x6d2b79f5) >>> 0;
  g.rng = etat;
  let t = Math.imul(etat ^ (etat >>> 15), etat | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Nombre dans [min, max) ; renvoie min sans tirer si la fourchette est vide. */
export function tirerEntre(g: Generateur, min: number, max: number): number {
  if (max <= min) return min;
  return min + tirer(g) * (max - min);
}
