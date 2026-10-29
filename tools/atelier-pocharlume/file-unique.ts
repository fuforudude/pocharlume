// Exécute une tâche asynchrone à la fois : si des demandes arrivent pendant qu'elle tourne, une seule relance les
// couvre toutes (elle repart après la fin de la tâche en cours et rend le même résultat à tous les demandeurs).
export function fileUnique<T>(tache: () => Promise<T>): () => Promise<T> {
  let enCours: Promise<T> | null = null;
  let suivante: Promise<T> | null = null;
  const lancer = (): Promise<T> => {
    if (enCours === null) {
      const courante = tache().finally(() => { if (enCours === courante) enCours = null; });
      enCours = courante;
      return courante;
    }
    suivante ??= enCours.then(() => { suivante = null; return lancer(); }, () => { suivante = null; return lancer(); });
    return suivante;
  };
  return lancer;
}
