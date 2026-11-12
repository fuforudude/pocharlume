// Canon à eau : une ligne de la grille est balayée d'un bord à l'autre ; les unités alliées qui s'y trouvent (soldats, renforts, héros)
// sont repoussées dans le sens du jet et étourdies un instant. Elles lâchent les ennemis qu'elles retenaient, puis reviennent à leur poste.
import { REGLES } from '../../data/regles';
import type { EvenementCanonAEau, Niveau } from '../definitions';
import type { EtatPartie } from '../etat';
import { lignes } from '../grille';
import { enPas } from '../temps';
import { libererBloques } from '../unites';

export function verifierCanonAEau(niveau: Niveau, e: EvenementCanonAEau, quoi: string): void {
  if (!Number.isInteger(e.cy) || e.cy < 0 || e.cy >= lignes(niveau.carte)) throw new Error(`${quoi} : ligne hors de la grille (${String(e.cy)})`);
  const sens: unknown = e.sens;
  if (sens !== undefined && sens !== 1 && sens !== -1) throw new Error(`${quoi} : sens invalide (${JSON.stringify(sens)})`);
  if (!(Number.isFinite(e.recul) && e.recul >= 0)) throw new Error(`${quoi} : recul invalide (${String(e.recul)})`);
  if (!(Number.isFinite(e.etourdissement) && e.etourdissement >= 0)) throw new Error(`${quoi} : étourdissement invalide (${String(e.etourdissement)})`);
}

export function declencherCanonAEau(etat: EtatPartie, e: EvenementCanonAEau): void {
  const haut = e.cy * REGLES.tailleCase;
  const bas = haut + REGLES.tailleCase;
  const sens = e.sens ?? 1;
  const largeur = etat.niveau.carte.largeur;
  const etourdi = enPas(e.etourdissement);
  let touchees = 0;
  for (const u of etat.unites) {
    if (u.mort || u.y < haut || u.y >= bas) continue;
    touchees++;
    libererBloques(etat, u);
    u.x = Math.max(0, Math.min(largeur, u.x + sens * e.recul));
    u.etourdi = Math.max(u.etourdi, etourdi);
  }
  etat.evenements.push({ type: 'balayage', cy: e.cy, sens, unites: touchees });
}
