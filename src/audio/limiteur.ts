// Limiteur de sons : pas plus de N instances du même son par fenêtre de 80 ms, et un plafond total qui dépend de
// l'importance du son. Un jeu qui tire à vingt tours ne doit pas saturer la sortie audio ni masquer une cloche de
// vague. Pur et sans horloge : l'instant est donné par l'appelant, donc testable.

/** Durée de la fenêtre glissante, en millisecondes. */
export const FENETRE_MS = 80;

export type Priorite = 'basse' | 'normale' | 'haute';

/**
 * Nombre total de sons (tous types confondus) déjà lancés dans la fenêtre au-delà duquel un son de cette priorité
 * est refusé. Les sons importants (vague, mort de boss, victoire) passent donc même quand les tirs ont saturé la
 * fenêtre pour les sons de priorité basse.
 */
export const PLAFOND_PAR_PRIORITE: Readonly<Record<Priorite, number>> = { basse: 4, normale: 7, haute: 12 };

interface Lecture {
  readonly id: string;
  readonly instant: number;
}

export class Limiteur {
  private lectures: Lecture[] = [];

  /**
   * Demande la permission de lancer `id` à l'instant `maintenant` (ms). Si elle est accordée, la lecture est
   * comptée. `max` est le nombre d'instances du même son permises dans la fenêtre.
   */
  autoriser(id: string, priorite: Priorite, max: number, maintenant: number): boolean {
    this.purger(maintenant);
    if (this.lectures.length >= PLAFOND_PAR_PRIORITE[priorite]) return false;
    let memes = 0;
    for (const lecture of this.lectures) if (lecture.id === id) memes++;
    if (memes >= max) return false;
    this.lectures.push({ id, instant: maintenant });
    return true;
  }

  /** Oublie les lectures sorties de la fenêtre. Une horloge qui recule vide tout (rien de fiable à comparer). */
  private purger(maintenant: number): void {
    const dernier = this.lectures[this.lectures.length - 1];
    if (dernier && dernier.instant > maintenant) {
      this.lectures = [];
      return;
    }
    const limite = maintenant - FENETRE_MS;
    let premier = 0;
    while (premier < this.lectures.length && (this.lectures[premier]?.instant ?? 0) <= limite) premier++;
    if (premier > 0) this.lectures = this.lectures.slice(premier);
  }

  /** Nombre de lectures comptées dans la fenêtre courante (tests). */
  get compte(): number {
    return this.lectures.length;
  }
}
