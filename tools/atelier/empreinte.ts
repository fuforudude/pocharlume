// Empreinte d'un ensemble de textes : sert à reconnaître qu'un fichier a changé entre l'ouverture et l'enregistrement.
import { createHash } from 'node:crypto';

export function empreinte(textes: readonly string[]): string {
  const h = createHash('sha256');
  for (const t of textes) h.update(`${String(t.length)}:`).update(t);
  return h.digest('hex').slice(0, 24);
}
