// Niveaux d'essai des événements datés et des foules (réservé aux tests : suffixe .test-utils.ts).
//
// Carte 32×18 à deux chemins droits : le chemin 0 à y = 5 (cases de la ligne cy = 2), le chemin 1 à y = 12 (lignes cy = 5 et 6), de x = 0
// à x = 30. Le héros attend en (28, 16), loin des deux chemins.
import { casesInterditesDuNiveau } from '../../data/niveaux/grille-niveau';
import type { CheminFerme, EvenementNiveau, Foule, Niveau, Vague } from '../definitions';
import { VAGUE_LOINTAINE } from '../aides.test-utils';

export interface OptionsNiveauDynamique {
  readonly evenements?: readonly EvenementNiveau[];
  readonly foules?: readonly Foule[];
  readonly cheminsFermes?: readonly CheminFerme[];
  readonly vagues?: readonly Vague[];
  /** Chemins qui bougent : leurs cases ne sont pas dans `casesInterdites` (contrat des données). */
  readonly mobiles?: readonly number[];
  readonly aretes?: number;
}

export function niveauDynamique(o: OptionsNiveauDynamique = {}): Niveau {
  const carte = {
    largeur: 32,
    hauteur: 18,
    chemins: [{ points: [{ x: 0, y: 5 }, { x: 30, y: 5 }] }, { points: [{ x: 0, y: 12 }, { x: 30, y: 12 }] }],
    departHeros: { x: 28, y: 16 },
  };
  const mobiles = o.mobiles ?? [];
  const fixes = { ...carte, chemins: carte.chemins.filter((_, i) => !mobiles.includes(i)) };
  return {
    id: 'essai-dynamique',
    aretesDepart: o.aretes ?? 5000,
    carte,
    casesInterdites: casesInterditesDuNiveau(fixes, [], []),
    vagues: o.vagues ?? [VAGUE_LOINTAINE, VAGUE_LOINTAINE],
    ...(o.evenements ? { evenements: o.evenements } : {}),
    ...(o.foules ? { foules: o.foules } : {}),
    ...(o.cheminsFermes ? { cheminsFermes: o.cheminsFermes } : {}),
  };
}
