// Canal de diffusion entre onglets : quand un onglet a écrit la sauvegarde, il prévient les autres, qui la relisent
// et fusionnent la progression. Le canal ne transporte aucune donnée (seulement « la sauvegarde a changé ») : la
// vérité reste dans le stockage. Les navigateurs sans `BroadcastChannel` jouent sans ce rafraîchissement ; la
// fusion avant chaque écriture (session.ts) protège quand même la progression.

export interface CanalSauvegarde {
  /** Prévient les autres onglets qu'une écriture vient d'avoir lieu. */
  publier(): void;
  /** Appelle `rappel` quand un autre onglet a écrit. Un seul écouteur : le dernier remplace le précédent. */
  ecouter(rappel: () => void): void;
  fermer(): void;
}

export const NOM_CANAL = 'pocharlume-sauvegarde';

/** Le canal du navigateur, ou null s'il n'a pas `BroadcastChannel`. Jamais d'exception. */
export function ouvrirCanalNavigateur(): CanalSauvegarde | null {
  try {
    if (typeof BroadcastChannel === 'undefined') return null;
    const canal = new BroadcastChannel(NOM_CANAL);
    return {
      publier: () => {
        try {
          canal.postMessage('sauvegarde');
        } catch {
          // Canal fermé : sans importance, la fusion avant écriture suffit.
        }
      },
      ecouter: (rappel) => {
        canal.onmessage = () => { rappel(); };
      },
      fermer: () => { canal.close(); },
    };
  } catch {
    return null;
  }
}
