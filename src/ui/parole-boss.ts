// La parole d'un boss (`boss.r<n>.parole`) s'affiche quand la vague qui le contient arrive : un bandeau qui
// ne bloque rien (voir Hud.afficherParole).
import { ENNEMIS } from '../data/ennemis';
import type { CleTexte } from '../i18n';
import type { Vague } from '../engine/definitions';

/** Clé de la parole à dire au lancement de la vague `index` (0 = première) d'un niveau de la région `region`, ou null. */
export function cleParoleBoss(vagues: readonly Vague[], index: number, region: number, niveauDeBoss: boolean): CleTexte | null {
  if (!niveauDeBoss) return null;
  const vague = vagues[index];
  if (!vague) return null;
  const aUnBoss = vague.paquets.some((p) => Object.hasOwn(ENNEMIS, p.ennemi) && ENNEMIS[p.ennemi as keyof typeof ENNEMIS].boss);
  return aUnBoss ? (`boss.r${String(region)}.parole` as CleTexte) : null;
}
