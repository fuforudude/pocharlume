// Bandes cibles de l'équilibrage (spec, « Système d'équilibrage ») : ce que chaque bot doit réussir dans
// chaque difficulté. `verifierBandes` renvoie une phrase par écart constaté ; liste vide = tout est dans la bande.
import { trouver, partiesDe, synthetiser, type Evaluation } from './campagne';
import { toursHorsTolerance } from './puissance';

export const BANDES = {
  chaton: { naifMin: 1 },
  matou: { soigneuxMin: 1, naifMin: 0.5, naifMax: 0.9 },
  vieux_sage: { soigneuxMin: 0.8 },
  /** Niveaux (sur 10) où le bot naïf en Matou perd au moins une vie dans au moins une partie. */
  niveauxAvecPertesMin: 6,
} as const;

function pourcent(x: number): string {
  return `${String(Math.round(x * 1000) / 10)} %`;
}

export function verifierBandes(evaluations: readonly Evaluation[]): string[] {
  const ecarts: string[] = [];
  const taux = (difficulte: string, bot: 'naif' | 'soigneux'): number => synthetiser(partiesDe(evaluations, difficulte, bot)).tauxVictoire;

  if (taux('chaton', 'naif') < BANDES.chaton.naifMin) ecarts.push(`Chaton : le bot naïf gagne ${pourcent(taux('chaton', 'naif'))} des parties, il doit tout gagner`);
  if (taux('matou', 'soigneux') < BANDES.matou.soigneuxMin) ecarts.push(`Matou : le bot soigneux gagne ${pourcent(taux('matou', 'soigneux'))} des parties, il doit tout gagner`);
  const naifMatou = taux('matou', 'naif');
  if (naifMatou < BANDES.matou.naifMin || naifMatou > BANDES.matou.naifMax) {
    ecarts.push(`Matou : le bot naïf gagne ${pourcent(naifMatou)} des parties, la bande est ${pourcent(BANDES.matou.naifMin)} à ${pourcent(BANDES.matou.naifMax)}`);
  }
  if (taux('vieux_sage', 'soigneux') < BANDES.vieux_sage.soigneuxMin) {
    ecarts.push(`Vieux Sage : le bot soigneux gagne ${pourcent(taux('vieux_sage', 'soigneux'))} des parties, il doit en gagner au moins ${pourcent(BANDES.vieux_sage.soigneuxMin)}`);
  }

  // Le héros seul ne gagne jamais, sauf en Chaton sur le premier niveau (introduction).
  for (const e of evaluations.filter((x) => x.bot === 'inactif')) {
    const tolere = e.difficulte === 'chaton' && e.niveau === 1;
    const gagnees = e.parties.filter((p) => p.statut === 'victoire').length;
    if (!tolere && gagnees > 0) ecarts.push(`Sans défense : le niveau ${String(e.niveau)} est gagné ${String(gagnees)} fois sur ${String(e.parties.length)} en ${e.difficulte}`);
  }

  // Le niveau ne doit pas se gagner sans perdre une vie : au moins la moitié des niveaux en font perdre au bot naïf.
  const niveaux = evaluations.filter((e) => e.bot === 'naif' && e.difficulte === 'matou');
  const avecPertes = niveaux.filter((e) => synthetiser(e.parties).aPerduDesVies).length;
  if (niveaux.length === 10 && avecPertes < BANDES.niveauxAvecPertesMin) {
    ecarts.push(`Matou : le bot naïf perd des vies sur ${String(avecPertes)} niveaux seulement, il en faut au moins ${String(BANDES.niveauxAvecPertesMin)}`);
  }

  for (const t of toursHorsTolerance()) ecarts.push(`Puissance : ${t.nom} (palier ${String(t.palier)}) est à ${pourcent(t.ecart)} de la moyenne de son palier`);
  return ecarts;
}

/** Vies restantes moyennes du bot naïf en Matou, niveau par niveau (la courbe de difficulté). */
export function courbeDifficulte(evaluations: readonly Evaluation[], difficulte = 'matou'): { niveau: number; vies: number }[] {
  return [...new Set(evaluations.map((e) => e.niveau))]
    .sort((a, b) => a - b)
    .flatMap((niveau) => {
      const e = trouver(evaluations, niveau, difficulte, 'naif');
      return e ? [{ niveau, vies: synthetiser(e.parties).viesMoyennes }] : [];
    });
}

/** Corrélation de rang (Spearman) entre le niveau et les vies restantes : proche de -1 = difficulté croissante. */
export function correlationDeRang(courbe: readonly { niveau: number; vies: number }[]): number {
  const n = courbe.length;
  if (n < 2) return 0;
  const rangs = (valeurs: readonly number[]): number[] => {
    const tries = valeurs.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const r = new Array<number>(n).fill(0);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j + 1 < n && tries[j + 1]?.v === tries[i]?.v) j++;
      for (let k = i; k <= j; k++) r[tries[k]?.i ?? 0] = (i + j) / 2 + 1;
      i = j + 1;
    }
    return r;
  };
  const a = rangs(courbe.map((c) => c.niveau));
  const b = rangs(courbe.map((c) => c.vies));
  const ma = (n + 1) / 2;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = (a[i] ?? 0) - ma;
    const y = (b[i] ?? 0) - ma;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da === 0 || db === 0 ? 0 : num / Math.sqrt(da * db);
}
