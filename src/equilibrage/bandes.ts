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

function taux(evaluations: readonly Evaluation[], difficulte: string, bot: 'naif' | 'soigneux'): number {
  return synthetiser(partiesDe(evaluations, difficulte, bot)).tauxVictoire;
}

/** Chaton : le bot naïf gagne tout. */
export function ecartsChaton(evaluations: readonly Evaluation[]): string[] {
  const t = taux(evaluations, 'chaton', 'naif');
  return t < BANDES.chaton.naifMin ? [`Chaton : le bot naïf gagne ${pourcent(t)} des parties, il doit tout gagner`] : [];
}

/** Matou : le soigneux gagne tout, le naïf entre 50 et 90 %, et le niveau ne se gagne pas toujours sans perte. */
export function ecartsMatou(evaluations: readonly Evaluation[]): string[] {
  const ecarts: string[] = [];
  const soigneux = taux(evaluations, 'matou', 'soigneux');
  if (soigneux < BANDES.matou.soigneuxMin) ecarts.push(`Matou : le bot soigneux gagne ${pourcent(soigneux)} des parties, il doit tout gagner`);
  const naif = taux(evaluations, 'matou', 'naif');
  if (naif < BANDES.matou.naifMin || naif > BANDES.matou.naifMax) {
    ecarts.push(`Matou : le bot naïf gagne ${pourcent(naif)} des parties, la bande est ${pourcent(BANDES.matou.naifMin)} à ${pourcent(BANDES.matou.naifMax)}`);
  }
  const niveaux = evaluations.filter((e) => e.bot === 'naif' && e.difficulte === 'matou');
  const avecPertes = niveaux.filter((e) => synthetiser(e.parties).aPerduDesVies).length;
  if (niveaux.length === 10 && avecPertes < BANDES.niveauxAvecPertesMin) {
    ecarts.push(`Matou : le bot naïf perd des vies sur ${String(avecPertes)} niveaux seulement, il en faut au moins ${String(BANDES.niveauxAvecPertesMin)}`);
  }
  return ecarts;
}

/** Vieux Sage : le soigneux gagne au moins 80 %. */
export function ecartsVieuxSage(evaluations: readonly Evaluation[]): string[] {
  const t = taux(evaluations, 'vieux_sage', 'soigneux');
  return t < BANDES.vieux_sage.soigneuxMin
    ? [`Vieux Sage : le bot soigneux gagne ${pourcent(t)} des parties, il doit en gagner au moins ${pourcent(BANDES.vieux_sage.soigneuxMin)}`]
    : [];
}

/** Sans défense, le héros seul ne gagne jamais (sauf en Chaton au niveau 1, qui sert d'introduction). */
export function ecartsSansDefense(evaluations: readonly Evaluation[]): string[] {
  const ecarts: string[] = [];
  for (const e of evaluations.filter((x) => x.bot === 'inactif')) {
    const gagnees = e.parties.filter((p) => p.statut === 'victoire').length;
    if (gagnees > 0 && !(e.difficulte === 'chaton' && e.niveau === 1)) {
      ecarts.push(`Sans défense : le niveau ${String(e.niveau)} est gagné ${String(gagnees)} fois sur ${String(e.parties.length)} en ${e.difficulte}`);
    }
  }
  return ecarts;
}

/** Aucune tour commune hors de la tolérance de puissance de son palier. */
export function ecartsPuissance(): string[] {
  return toursHorsTolerance().map((t) => `Puissance : ${t.nom} (palier ${String(t.palier)}) est à ${pourcent(t.ecart)} de la moyenne de son palier`);
}

export function verifierBandes(evaluations: readonly Evaluation[]): string[] {
  return [
    ...ecartsChaton(evaluations),
    ...ecartsMatou(evaluations),
    ...ecartsVieuxSage(evaluations),
    ...ecartsSansDefense(evaluations),
    ...ecartsPuissance(),
  ];
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
