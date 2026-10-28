// Bandes cibles de l'équilibrage (spec, « Système d'équilibrage ») : ce que chaque bot doit réussir dans
// chaque difficulté, avec chacun des trois dieux jouant son avatar sans amélioration ni objet. `verifierBandes`
// renvoie une phrase par écart constaté ; liste vide = tout est dans la bande.
//
// Le bot soigneux lit la composition des vagues futures (`poidsDesChemins`, geometrie.ts), ce qu'un joueur ne voit
// pas : il est un peu optimiste. On le prend pourtant pour référence d'un joueur humain compétent.
import { dieuxDe, duDieu, trouver, partiesDe, synthetiser, type Evaluation } from './campagne';
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
    /** Écart maximal, entre deux dieux, des vies restantes moyennes du soigneux (tous niveaux, toutes graines). */
    ecartViesEntreDieuxMax: 3,
  },
  vieux_sage: {
    soigneuxMin: 0.6,
    soigneuxMax: 0.85,
    /** Écart maximal, entre deux dieux, du taux de victoire du soigneux (10 points). */
    ecartVictoiresEntreDieuxMax: 0.1,
  },
  /** Courbe de difficulté du bot naïf en Matou (moyenne des dieux) : corrélation de rang au plus égale à ceci. */
  courbeCorrelationMax: -0.6,
  /** La courbe de chaque dieu, prise seule, doit aussi monter : corrélation de rang au plus égale à ceci. */
  courbeCorrelationDieuMax: -0.3,
  /** Le dernier niveau doit figurer parmi ce nombre de niveaux les plus durs (les moins de vies restantes au naïf, moyenne des dieux). */
  courbeRangDuDernierMax: 3,
} as const;

/** Tolérance sur les comparaisons à une valeur exacte (taux de victoire de 50 parties : multiples de 0,02). */
const EPSILON = 1e-9;

const NOM_DIEU: Readonly<Record<string, string>> = { plume: 'Plume', charlie: 'Charlie', pollen: 'Pollen' };

/** Nom d'un dieu pour les messages d'écart et le rapport. */
export function nomDuDieu(dieu: string): string {
  return NOM_DIEU[dieu] ?? dieu;
}

function pourcent(x: number): string {
  return `${String(Math.round(x * 1000) / 10)} %`;
}

function un(x: number): string {
  return String(Math.round(x * 10) / 10).replace('.', ',');
}

function taux(evaluations: readonly Evaluation[], difficulte: string, bot: 'naif' | 'soigneux', dieu?: string): number {
  return synthetiser(partiesDe(evaluations, difficulte, bot, dieu)).tauxVictoire;
}

/** Chaton, pour chaque dieu : le bot naïf gagne tout. */
export function ecartsChaton(evaluations: readonly Evaluation[]): string[] {
  return dieuxDe(evaluations).flatMap((dieu) => {
    const t = taux(evaluations, 'chaton', 'naif', dieu);
    return t < BANDES.chaton.naifMin ? [`Chaton (${nomDuDieu(dieu)}) : le bot naïf gagne ${pourcent(t)} des parties, il doit tout gagner`] : [];
  });
}

/** Niveaux d'une difficulté où le bot soigneux perd en moyenne au moins une vie (d'un seul dieu si `dieu` est donné). */
export function niveauxAvecPertes(evaluations: readonly Evaluation[], difficulte = 'matou', dieu?: string): Evaluation[] {
  return evaluations.filter(
    (e) =>
      e.bot === 'soigneux' &&
      e.difficulte === difficulte &&
      (dieu === undefined || e.dieu === dieu) &&
      synthetiser(e.parties).viesPerduesMoyennes >= BANDES.matou.pertesParNiveauMin,
  );
}

/**
 * Matou, pour chaque dieu : le soigneux gagne tout mais pas sans perdre de vies (au moins une vie en moyenne sur la
 * moitié des niveaux), il ne laisse pas d'arêtes inutilisées (moins de 250 par niveau), et le naïf gagne entre 30 et 70 %.
 */
export function ecartsMatou(evaluations: readonly Evaluation[]): string[] {
  return dieuxDe(evaluations).flatMap((dieu) => ecartsMatouDuDieu(duDieu(evaluations, dieu), dieu));
}

function ecartsMatouDuDieu(evaluations: readonly Evaluation[], dieu: string): string[] {
  const ecarts: string[] = [];
  const nom = `Matou (${nomDuDieu(dieu)})`;
  const soigneux = taux(evaluations, 'matou', 'soigneux');
  if (soigneux < BANDES.matou.soigneuxMin) ecarts.push(`${nom} : le bot soigneux gagne ${pourcent(soigneux)} des parties, il doit tout gagner`);
  const naif = taux(evaluations, 'matou', 'naif');
  if (naif < BANDES.matou.naifMin || naif > BANDES.matou.naifMax) {
    ecarts.push(`${nom} : le bot naïf gagne ${pourcent(naif)} des parties, la bande est ${pourcent(BANDES.matou.naifMin)} à ${pourcent(BANDES.matou.naifMax)}`);
  }
  const niveaux = evaluations.filter((e) => e.bot === 'soigneux' && e.difficulte === 'matou');
  const avecPertes = niveauxAvecPertes(evaluations).length;
  const requis = Math.ceil(niveaux.length * BANDES.matou.partNiveauxAvecPertesMin);
  if (avecPertes < requis) {
    ecarts.push(`${nom} : le bot soigneux perd au moins une vie sur ${String(avecPertes)} niveaux seulement, il en faut au moins ${String(requis)} sur ${String(niveaux.length)}`);
  }
  for (const e of niveaux) {
    const inutilisees = synthetiser(e.parties).aretesFinMoyennes;
    if (inutilisees >= BANDES.matou.aretesInutiliseesMax) {
      ecarts.push(
        `${nom} : le niveau ${String(e.niveau)} laisse ${String(Math.round(inutilisees))} arêtes inutilisées au bot soigneux, il en faut moins de ${String(BANDES.matou.aretesInutiliseesMax)}`,
      );
    }
  }
  return ecarts;
}

/** Vieux Sage, pour chaque dieu : le soigneux gagne entre 60 et 85 % des parties (ni trop facile, ni hors de portée). */
export function ecartsVieuxSage(evaluations: readonly Evaluation[]): string[] {
  const { soigneuxMin, soigneuxMax } = BANDES.vieux_sage;
  return dieuxDe(evaluations).flatMap((dieu) => {
    const t = taux(evaluations, 'vieux_sage', 'soigneux', dieu);
    return t < soigneuxMin - EPSILON || t > soigneuxMax + EPSILON
      ? [`Vieux Sage (${nomDuDieu(dieu)}) : le bot soigneux gagne ${pourcent(t)} des parties, la bande est ${pourcent(soigneuxMin)} à ${pourcent(soigneuxMax)}`]
      : [];
  });
}

interface MesureDieu {
  readonly dieu: string;
  readonly valeur: number;
}

function extremes(liste: readonly MesureDieu[]): [MesureDieu, MesureDieu] {
  const premier = liste[0];
  if (!premier) throw new Error('Aucun dieu à comparer');
  let bas = premier;
  let haut = premier;
  for (const x of liste) {
    if (x.valeur < bas.valeur) bas = x;
    if (x.valeur > haut.valeur) haut = x;
  }
  return [bas, haut];
}

/**
 * Entre les dieux : en Vieux Sage, le taux de victoire du soigneux ne diffère pas de plus de 10 points d'un dieu à
 * l'autre ; en Matou, ses vies restantes moyennes ne diffèrent pas de plus de 3. Sans objet avec un seul dieu évalué.
 */
export function ecartsEntreDieux(evaluations: readonly Evaluation[]): string[] {
  const dieux = dieuxDe(evaluations);
  if (dieux.length < 2) return [];
  const ecarts: string[] = [];
  const [bas, haut] = extremes(dieux.map((dieu) => ({ dieu, valeur: taux(evaluations, 'vieux_sage', 'soigneux', dieu) })));
  if (haut.valeur - bas.valeur > BANDES.vieux_sage.ecartVictoiresEntreDieuxMax + EPSILON) {
    ecarts.push(
      `Vieux Sage : ${nomDuDieu(haut.dieu)} (${pourcent(haut.valeur)}) et ${nomDuDieu(bas.dieu)} (${pourcent(bas.valeur)}) sont à ${un((haut.valeur - bas.valeur) * 100)} points l'un de l'autre, il en faut au plus ${un(BANDES.vieux_sage.ecartVictoiresEntreDieuxMax * 100)}`,
    );
  }
  const [minVies, maxVies] = extremes(dieux.map((dieu) => ({ dieu, valeur: synthetiser(partiesDe(evaluations, 'matou', 'soigneux', dieu)).viesMoyennes })));
  if (maxVies.valeur - minVies.valeur > BANDES.matou.ecartViesEntreDieuxMax + EPSILON) {
    ecarts.push(
      `Matou : ${nomDuDieu(maxVies.dieu)} (${un(maxVies.valeur)} vies) et ${nomDuDieu(minVies.dieu)} (${un(minVies.valeur)} vies) sont à ${un(maxVies.valeur - minVies.valeur)} vies l'un de l'autre, il en faut au plus ${String(BANDES.matou.ecartViesEntreDieuxMax)}`,
    );
  }
  return ecarts;
}

/** Sans défense, le héros seul ne gagne jamais (sauf en Chaton au niveau 1, qui sert d'introduction). */
export function ecartsSansDefense(evaluations: readonly Evaluation[]): string[] {
  const ecarts: string[] = [];
  for (const e of evaluations.filter((x) => x.bot === 'inactif')) {
    const gagnees = e.parties.filter((p) => p.statut === 'victoire').length;
    if (gagnees > 0 && !(e.difficulte === 'chaton' && e.niveau === 1)) {
      ecarts.push(`Sans défense (${nomDuDieu(e.dieu)}) : le niveau ${String(e.niveau)} est gagné ${String(gagnees)} fois sur ${String(e.parties.length)} en ${e.difficulte}`);
    }
  }
  return ecarts;
}

/** Aucune tour commune hors de la tolérance de puissance de son palier. */
export function ecartsPuissance(): string[] {
  return toursHorsTolerance().map((t) => `Puissance : ${t.nom} (palier ${String(t.palier)}) est à ${pourcent(t.ecart)} de la moyenne de son palier`);
}

/**
 * Courbe de difficulté en Matou. Les niveaux ont une seule courbe, jugée sur la moyenne des trois dieux : elle monte
 * (corrélation de rang) et le dernier niveau est parmi les plus durs. Chaque dieu a sa courbe, qui doit monter aussi
 * (corrélation de rang au plus égale à `courbeCorrelationDieuMax`) : le boss du niveau 10 dévore les unités au contact,
 * ce qui pèse plus sur un héros de mêlée que sur un tireur, et le rang exact du dernier niveau varie d'un dieu à l'autre.
 */
export function ecartsCourbe(evaluations: readonly Evaluation[]): string[] {
  const ecarts: string[] = [];
  const moyenne = courbeMoyenne(evaluations);
  if (moyenne.length >= 2) {
    const rho = correlationDeRang(moyenne);
    if (rho > BANDES.courbeCorrelationMax) {
      ecarts.push(`Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de ${un(rho)}, elle doit être d'au plus ${un(BANDES.courbeCorrelationMax)}`);
    }
    const dernier = moyenne[moyenne.length - 1];
    const tries = moyenne.map((c) => c.vies).sort((a, b) => a - b);
    const seuil = tries[Math.min(BANDES.courbeRangDuDernierMax, tries.length) - 1] ?? 0;
    if (dernier && dernier.vies > seuil) {
      ecarts.push(`Matou : le niveau ${String(dernier.niveau)} (${un(dernier.vies)} vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les ${String(BANDES.courbeRangDuDernierMax)} plus durs`);
    }
  }
  for (const dieu of dieuxDe(evaluations)) {
    const courbe = courbeDifficulte(evaluations, 'matou', dieu);
    if (courbe.length < 2) continue;
    const rho = correlationDeRang(courbe);
    if (rho > BANDES.courbeCorrelationDieuMax) {
      ecarts.push(`Matou (${nomDuDieu(dieu)}) : la courbe de difficulté du bot naïf a une corrélation de rang de ${un(rho)}, elle doit être d'au plus ${un(BANDES.courbeCorrelationDieuMax)}`);
    }
  }
  return ecarts;
}

/** Vies restantes moyennes du bot naïf en Matou, niveau par niveau, moyennées sur les dieux évalués. */
export function courbeMoyenne(evaluations: readonly Evaluation[], difficulte = 'matou'): { niveau: number; vies: number }[] {
  const courbes = dieuxDe(evaluations).map((dieu) => courbeDifficulte(evaluations, difficulte, dieu));
  const niveaux = [...new Set(courbes.flatMap((c) => c.map((x) => x.niveau)))].sort((a, b) => a - b);
  return niveaux.map((niveau) => {
    const vies = courbes.flatMap((c) => c.filter((x) => x.niveau === niveau).map((x) => x.vies));
    return { niveau, vies: vies.reduce((a, b) => a + b, 0) / Math.max(1, vies.length) };
  });
}

export function verifierBandes(evaluations: readonly Evaluation[]): string[] {
  return [
    ...ecartsChaton(evaluations),
    ...ecartsMatou(evaluations),
    ...ecartsCourbe(evaluations),
    ...ecartsVieuxSage(evaluations),
    ...ecartsEntreDieux(evaluations),
    ...ecartsSansDefense(evaluations),
    ...ecartsPuissance(),
  ];
}

/** Vies restantes moyennes du bot naïf en Matou, niveau par niveau (la courbe de difficulté), pour un dieu. */
export function courbeDifficulte(evaluations: readonly Evaluation[], difficulte = 'matou', dieu?: string): { niveau: number; vies: number }[] {
  return [...new Set(evaluations.map((e) => e.niveau))]
    .sort((a, b) => a - b)
    .flatMap((niveau) => {
      const e = trouver(evaluations, niveau, difficulte, 'naif', dieu);
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
