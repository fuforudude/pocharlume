// Verrou entre onglets : relire le stockage, appliquer une opération et réécrire ne doivent pas s'entremêler avec
// l'écriture d'un autre onglet, sans quoi l'une des deux écritures en écraserait une autre (la monnaie dépensée dans un
// onglet serait redépensée dans l'autre). Dans le navigateur, c'est l'API Web Locks, qui exclut aussi les onglets
// entre eux ; sans elle (navigateur ancien), la session se rabat sur sa seule file interne et la fenêtre de course
// reste (voir `Session`).

export interface VerrouSauvegarde {
  /** Exécute `travail` quand personne d'autre (autre onglet compris) ne tient le verrou, puis le relâche. */
  executer<T>(travail: () => Promise<T>): Promise<T>;
}

export const NOM_VERROU = 'pocharlume-sauvegarde';

/** Le verrou Web Locks du navigateur, ou null s'il n'existe pas. Jamais d'exception. */
export function ouvrirVerrouNavigateur(): VerrouSauvegarde | null {
  try {
    if (typeof navigator === 'undefined' || !('locks' in navigator)) return null;
    const verrous = navigator.locks;
    return {
      executer: async <T>(travail: () => Promise<T>): Promise<T> => {
        const suivi = { lance: false };
        try {
          return await verrous.request(NOM_VERROU, async () => {
            suivi.lance = true;
            return travail();
          });
        } catch (erreur) {
          // Le verrou lui-même est refusé (contexte non sécurisé, par exemple) : on travaille sans.
          if (suivi.lance) throw erreur;
          return travail();
        }
      },
    };
  } catch {
    return null;
  }
}

/**
 * Verrou en mémoire : exclut les sessions d'une même page, pas les autres onglets. Sert aux tests (deux sessions sur un
 * même stockage) et de modèle.
 */
export function creerVerrouMemoire(): VerrouSauvegarde {
  let file: Promise<unknown> = Promise.resolve();
  return {
    executer: <T>(travail: () => Promise<T>): Promise<T> => {
      const suite = file.then(travail, travail);
      file = suite.catch(() => undefined);
      return suite;
    },
  };
}
