// Sources aléatoires du tirage des caisses. Le hasard est toujours injecté : `crypto.getRandomValues` en jeu, un
// générateur à graine ou des valeurs fixes dans les tests. Jamais `Math.random` (le moteur de jeu a le sien, à graine,
// et les caisses ne doivent dépendre ni de l'un ni de l'autre).

/** Rend un nombre dans [0, 1) à chaque appel. */
export type SourceAleatoire = () => number;

/** Le morceau de l'API Web Crypto dont on a besoin. */
export type FournisseurCrypto = Pick<Crypto, 'getRandomValues'>;

const DEUX_PUISSANCE_32 = 4_294_967_296;

/**
 * La source de `crypto.getRandomValues` (32 bits tirés à chaque appel). `fournisseur` par défaut : le crypto de la
 * plateforme. Rend null s'il n'y en a pas : l'appelant refuse alors le tirage, il ne se rabat pas sur du hasard faible.
 */
export function sourceCrypto(fournisseur: FournisseurCrypto | null | undefined = (globalThis as { crypto?: FournisseurCrypto }).crypto): SourceAleatoire | null {
  if (!fournisseur || typeof fournisseur.getRandomValues !== 'function') return null;
  const tampon = new Uint32Array(1);
  return () => {
    fournisseur.getRandomValues(tampon);
    return (tampon[0] ?? 0) / DEUX_PUISSANCE_32;
  };
}

/**
 * Tire `n` nombres d'avance dans `source` et rend une fabrique de sources qui les rejouent : chaque appel de la fabrique
 * repart du début de la réserve. Une transaction de session est rejouée plusieurs fois (d'abord sur la vue en mémoire,
 * puis sur le contenu frais du stockage, sous verrou) : avec une réserve, chaque passage fait les mêmes jets, et l'on ne
 * change pas de résultat en route (sauf si l'état du joueur a changé entre-temps, ce qui est voulu). Aller au-delà de la
 * réserve lève une erreur : c'est un bogue, pas du hasard.
 */
export function sourceRejouable(source: SourceAleatoire, n: number): () => SourceAleatoire {
  const reserve = Array.from({ length: n }, () => source());
  return () => {
    let i = 0;
    return () => {
      const valeur = reserve[i++];
      if (valeur === undefined) throw new Error('réserve aléatoire épuisée');
      return valeur;
    };
  };
}
