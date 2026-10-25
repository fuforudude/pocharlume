// Bandes cibles de l'équilibrage (spec, « Système d'équilibrage ») : ce que chaque bot doit réussir dans
// chaque difficulté. `verifierBandes` renvoie une phrase par écart constaté ; liste vide = tout est dans la bande.
//
// Le bot soigneux lit la composition des vagues futures (`poidsDesChemins`, geometrie.ts), ce qu'un joueur ne voit
// pas : il est un peu optimiste. On le prend pourtant pour référence d'un joueur humain compétent.
import { trouver, partiesDe, synthetiser, type Evaluation } from './campagne';
import { toursHorsTolerance } from './puissance';

export const BANDES = {
  chaton: { naifMin: 1 },
  matou: {
    soigneuxMin: 1,
    naifMin: 0.3,
    naifMax: 0.7,
    /** Un niveau « avec perte » : le soigneux y perd en moyenne (sur les graines) au moins cette quantité de vies. */
    pertesParNiveauMin: 1,
    /** Part des niveaux qui doivent être « avec perte » : le soigneux ne doit pas tout gagner sans une égratignure. */
    partNiveauxAvecPertesMin: 0.5,
    /** Arêtes inutilisées en fin de niveau (moyenne du soigneux sur les graines) : strictement moins, pour chaque niveau. */
    aretesInutiliseesMax: 250,
  },
  vieux_sage: { soigneuxMin: 0.6, soigneuxMax: 0.85 },
  /** Courbe de difficulté du bot naïf en Matou : corrélation de rang au plus égale à ceci. */
  courbeCorrelationMax: -0.6,
  /** Le dernier niveau doit figurer parmi ce nombre de niveaux les plus durs (les moins de vies restantes au naïf). */
  courbeRangDuDernierMax: 3,
} as const;

function pourcent(x: number): string {
  return `${String(Math.round(x * 1000) / 10)} %`;
}

function un(x: number): string {
  return String(Math.round(x * 10) / 10).replace('.', ',');
}

function taux(evaluations: readonly Evaluation[], difficulte: string, bot: 'naif' | 'soigneux'): number {
  return synthetiser(partiesDe(evaluations, difficulte, bot)).tauxVictoire;
}

/** Chaton : le bot naïf gagne tout. */
export function ecartsChaton(evaluations: readonly Evaluation[]): string[] {
  const t = taux(evaluations, 'chaton', 'naif');
  return t < BANDES.chaton.naifMin ? [`Chaton : le bot naïf gagne ${pourcent(t)} des parties, il doit tout gagner`] : [];
}

/** Niveaux d'une difficulté où le bot soigneux perd en moyenne au moins une vie. */
export function niveauxAvecPertes(evaluations: readonly Evaluation[], difficulte = 'matou'): Evaluation[] {
  return evaluations.filter(
    (e) => e.bot === 'soigneux' && e.difficulte === difficulte && synthetiser(e.parties).viesPerduesMoyennes >= BANDES.matou.pertesParNiveauMin,
  );
}

/**
 * Matou : le soigneux gagne tout mais pas sans perdre de vies (au moins une vie en moyenne sur la moitié des niveaux),
 * il ne laisse pas d'arêtes inutilisées (moins de 250 par niveau), et le naïf gagne entre 30 et 70 %.
 */
export function ecartsMatou(evaluations: readonly Evaluation[]): string[] {
  const ecarts: string[] = [];
  const soigneux = taux(evaluations, 'matou', 'soigneux');
  if (soigneux < BANDES.matou.soigneuxMin) ecarts.push(`Matou : le bot soigneux gagne ${pourcent(soigneux)} des parties, il doit tout gagner`);
  const naif = taux(evaluations, 'matou', 'naif');
  if (naif < BANDES.matou.naifMin || naif > BANDES.matou.naifMax) {
    ecarts.push(`Matou : le bot naïf gagne ${pourcent(naif)} des parties, la bande est ${pourcent(BANDES.matou.naifMin)} à ${pourcent(BANDES.matou.naifMax)}`);
  }
  const niveaux = evaluations.filter((e) => e.bot === 'soigneux' && e.difficulte === 'matou');
  const avecPertes = niveauxAvecPertes(evaluations).length;
  const requis = Math.ceil(niveaux.length * BANDES.matou.partNiveauxAvecPertesMin);
  if (avecPertes < requis) {
    ecarts.push(`Matou : le bot soigneux perd au moins une vie sur ${String(avecPertes)} niveaux seulement, il en faut au moins ${String(requis)} sur ${String(niveaux.length)}`);
  }
  for (const e of niveaux) {
    const inutilisees = synthetiser(e.parties).aretesFinMoyennes;
    if (inutilisees >= BANDES.matou.aretesInutiliseesMax) {
      ecarts.push(
        `Matou : le niveau ${String(e.niveau)} laisse ${String(Math.round(inutilisees))} arêtes inutilisées au bot soigneux, il en faut moins de ${String(BANDES.matou.aretesInutiliseesMax)}`,
      );
    }
  }
  return ecarts;
}

/** Vieux Sage : le soigneux gagne entre 60 et 85 % des parties (ni trop facile, ni hors de portée). */
export function ecartsVieuxSage(evaluations: readonly Evaluation[]): string[] {
  const t = taux(evaluations, 'vieux_sage', 'soigneux');
  const { soigneuxMin, soigneuxMax } = BANDES.vieux_sage;
  return t < soigneuxMin || t > soigneuxMax
    ? [`Vieux Sage : le bot soigneux gagne ${pourcent(t)} des parties, la bande est ${pourcent(soigneuxMin)} à ${pourcent(soigneuxMax)}`]
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

/** Courbe de difficulté en Matou : elle monte (corrélation de rang) et le dernier niveau est parmi les plus durs. */
export function ecartsCourbe(evaluations: readonly Evaluation[]): string[] {
  const courbe = courbeDifficulte(evaluations);
  if (courbe.length < 2) return [];
  const ecarts: string[] = [];
  const rho = correlationDeRang(courbe);
  if (rho > BANDES.courbeCorrelationMax) {
    ecarts.push(`Matou : la courbe de difficulté du bot naïf a une corrélation de rang de ${un(rho)}, elle doit être d'au plus ${un(BANDES.courbeCorrelationMax)}`);
  }
  const dernier = courbe[courbe.length - 1];
  const tries = courbe.map((c) => c.vies).sort((a, b) => a - b);
  const seuil = tries[Math.min(BANDES.courbeRangDuDernierMax, tries.length) - 1] ?? 0;
  if (dernier && dernier.vies > seuil) {
    ecarts.push(`Matou : le niveau ${String(dernier.niveau)} (${un(dernier.vies)} vies restantes au bot naïf) n'est pas parmi les ${String(BANDES.courbeRangDuDernierMax)} plus durs`);
  }
  return ecarts;
}

export function verifierBandes(evaluations: readonly Evaluation[]): string[] {
  return [
    ...ecartsChaton(evaluations),
    ...ecartsMatou(evaluations),
    ...ecartsCourbe(evaluations),
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
