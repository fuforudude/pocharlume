// Emplacement de la statue des cartes. Les statues viennent de la branche j5-statues (`src/data/niveaux/statues.ts`),
// qui n'existe pas encore sur cette base : tant que le fichier est absent, la statue est désactivée avec un message.
// À la fusion, brancher ici la lecture et l'écriture du format de ce fichier (voir README de l'adaptateur), puis
// faire renvoyer `actif: true` et les objets de genre `statue` par `cartes.ts`.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface EtatStatues {
  readonly actif: boolean;
  readonly raison: string;
}

export const CHEMIN_STATUES = 'src/data/niveaux/statues.ts';

export function etatStatues(racine: string): EtatStatues {
  if (!existsSync(join(racine, CHEMIN_STATUES))) {
    return { actif: false, raison: `${CHEMIN_STATUES} n'existe pas encore (branche j5-statues à fusionner)` };
  }
  return { actif: false, raison: `${CHEMIN_STATUES} existe mais son format n'est pas encore branché dans l'adaptateur (tools/atelier-pocharlume/statues.ts)` };
}
