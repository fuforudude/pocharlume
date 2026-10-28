// Outils réservés aux tests de la collection (jamais importés par le jeu) : sources aléatoires déterministes.
import { creerGenerateur, tirer } from '../engine/aleatoire';
import type { SourceAleatoire } from './aleatoire';

/** Source aléatoire à graine (le générateur du moteur) : mêmes tirages à chaque exécution. */
export function sourceGraine(graine: number): SourceAleatoire {
  const generateur = creerGenerateur(graine);
  return () => tirer(generateur);
}

/** Source qui rend toujours la même valeur (0 : la première rareté de la liste et son premier objet). */
export function sourceConstante(valeur: number): SourceAleatoire {
  return () => valeur;
}

/** Source qui rend les valeurs données puis lève une erreur : montre combien de tirages une opération consomme. */
export function sourceListe(valeurs: readonly number[]): SourceAleatoire {
  let i = 0;
  return () => {
    const v = valeurs[i++];
    if (v === undefined) throw new Error('source aléatoire épuisée');
    return v;
  };
}
