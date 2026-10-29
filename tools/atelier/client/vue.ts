// Contrat entre la page principale et chacune de ses vues (sprites, palette, cartes).
export interface Contexte {
  /** Message de la barre du haut. */
  etat(message: string, type?: 'ok' | 'erreur'): void;
  /** Dit si la vue a des changements non enregistrés (active le bouton et la garde de sortie). */
  signalerModif(modifie: boolean): void;
}

export interface Vue {
  /** Ouvre un élément par son id (lien direct `#onglet/id`). */
  ouvrir?(id: string): Promise<void>;
  /** Écrit les changements (bouton et Ctrl+S). */
  enregistrer(): Promise<void>;
  /** Raccourcis de la vue ; rend vrai si la touche a été prise. */
  touche(e: KeyboardEvent): boolean;
  /** Libère les minuteries et les écouteurs globaux. */
  arreter(): void;
}
