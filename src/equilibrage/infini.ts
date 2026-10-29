// Mesure du mode infini (jalon 4, tâche 6) : jusqu'à quelle vague tiennent les bots, en Matou, sur des cartes de la campagne.
// Chaque partie est une partie infinie (`config.infini`) sur le niveau de campagne dont la carte est choisie : les arêtes de départ
// sont celles de ce niveau, les vagues sont générées par le moteur (src/engine/infini.ts) avec la graine de la partie. Le résultat
// d'une partie est sa dernière vague terminée (le « record » de la sauvegarde). Le bot soigneux lit les 30 premières vagues générées
// (geometrie.ts, `niveauLu`) : il est un peu optimiste, comme en campagne.
import { niveauDeCampagne } from '../data/niveaux/campagne';
import { creerBotNaif } from './bot-naif';
import { creerBotSoigneux, VARIANTES, type VarianteSoigneux } from './bot-soigneux';
import { GRAINES_EVALUATION } from './campagne';
import { jouerPartie } from './simulation';

/** Une carte jouée en infini : le niveau de campagne qui la porte (le premier de la carte) et sa région. */
export interface CarteInfini {
  readonly id: string;
  readonly numero: number;
  readonly region: number;
}

/** Les quatre cartes de la région 1, puis une carte de chacune de quelques autres régions (la 3, la 6 et la 10). */
export const CARTES_INFINI_REGION1: readonly CarteInfini[] = [
  { id: 'chaumes', numero: 1, region: 1 },
  { id: 'gue', numero: 2, region: 1 },
  { id: 'pendus', numero: 3, region: 1 },
  { id: 'carrefour', numero: 4, region: 1 },
];
export const CARTES_INFINI_AUTRES: readonly CarteInfini[] = [
  { id: 'region3', numero: 21, region: 3 },
  { id: 'region6', numero: 51, region: 6 },
  { id: 'region10', numero: 91, region: 10 },
];

/** Au-delà de cette vague terminée on arrête la partie : le coût d'une partie croît avec le budget (×1,22 par vague). */
export const VAGUE_MAX_INFINI = 100;

/** Les graines de l'infini : les dix graines d'évaluation des bandes. */
export const GRAINES_INFINI: readonly number[] = GRAINES_EVALUATION;

/** Bandes de l'infini, en Matou (spec, « Équilibrage du jalon 4 ») : médiane du soigneux et plafond du naïf, sur les cartes de la région 1. */
export const BANDES_INFINI = {
  soigneuxMin: 25,
  soigneuxMax: 45,
  /** Le naïf ne passe pas cette vague (sa meilleure partie sur chaque carte de la région 1). */
  naifMax: 30,
} as const;

export interface MesureInfini {
  readonly bot: 'naif' | 'soigneux';
  readonly dieu: string;
  readonly carte: CarteInfini;
  /** Dernière vague terminée de chaque graine. */
  readonly vagues: readonly number[];
}

export function mediane(valeurs: readonly number[]): number {
  if (valeurs.length === 0) return 0;
  const tries = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(tries.length / 2);
  return tries.length % 2 === 1 ? (tries[m] ?? 0) : ((tries[m - 1] ?? 0) + (tries[m] ?? 0)) / 2;
}

/**
 * La variante du bot soigneux en infini : une seule, fixée (la recherche sur graines d'entraînement des bandes de campagne coûterait dix
 * parties infinies de plus par carte et par dieu). Le soigneux équilibré et diversifié est celui qui sert par défaut.
 */
export const VARIANTE_INFINI: VarianteSoigneux = VARIANTES[0] ?? { nom: 'équilibrée', poids: { caserne: 1, tir: 1, magie: 1, artillerie: 1 }, diversite: 0.4 };

/** Joue le mode infini d'un dieu sur une carte avec un bot, une partie par graine. */
export function mesurerInfini(bot: 'naif' | 'soigneux', dieu: string, carte: CarteInfini, graines: readonly number[] = GRAINES_INFINI): MesureInfini {
  const campagne = niveauDeCampagne(carte.numero);
  if (!campagne) throw new Error(`Niveau ${String(carte.numero)} introuvable`);
  const vagues = graines.map((graine) => {
    const joueur = bot === 'naif' ? creerBotNaif({ graine: graine * 31 + 7 }) : creerBotSoigneux({ variante: VARIANTE_INFINI });
    return (
      jouerPartie(campagne.niveau, joueur, { graine, difficulte: 'matou', dieu, infini: { region: carte.region }, vagueMax: VAGUE_MAX_INFINI, secondesMax: 100_000 }).vagueTerminee ?? 0
    );
  });
  return { bot, dieu, carte, vagues };
}

/**
 * Écarts aux bandes de l'infini : pour chaque dieu et chaque carte de la région 1, la médiane du soigneux est entre la vague 25 et la
 * vague 45, et le naïf ne passe pas la vague 30 (aucune de ses parties). Liste vide = tout est dans la bande.
 */
export function ecartsInfini(mesures: readonly MesureInfini[]): string[] {
  const ecarts: string[] = [];
  for (const m of mesures.filter((x) => x.carte.region === 1)) {
    const nom = `Infini (${m.dieu}, carte ${m.carte.id})`;
    if (m.bot === 'soigneux') {
      const med = mediane(m.vagues);
      if (med < BANDES_INFINI.soigneuxMin || med > BANDES_INFINI.soigneuxMax) {
        ecarts.push(`${nom} : la médiane du bot soigneux est la vague ${String(med)}, la bande est la vague ${String(BANDES_INFINI.soigneuxMin)} à ${String(BANDES_INFINI.soigneuxMax)}`);
      }
    } else {
      const meilleure = Math.max(0, ...m.vagues);
      if (meilleure > BANDES_INFINI.naifMax) ecarts.push(`${nom} : le bot naïf atteint la vague ${String(meilleure)}, il ne doit pas passer la vague ${String(BANDES_INFINI.naifMax)}`);
    }
  }
  return ecarts;
}

function maxi(valeurs: readonly number[]): number {
  return Math.max(0, ...valeurs);
}

/** Le texte de la section « Mode infini » du rapport : médiane, meilleure partie et dispersion par bot, dieu et carte, puis les écarts. */
export function redigerInfini(mesures: readonly MesureInfini[]): string {
  const lignes = mesures.map((m) => {
    const vagues = [...m.vagues].sort((a, b) => a - b);
    return `| ${m.bot === 'naif' ? 'Naïf' : 'Soigneux'} | ${m.dieu} | ${m.carte.id} (région ${String(m.carte.region)}) | ${String(mediane(m.vagues))} | ${String(vagues[0] ?? 0)} à ${String(maxi(vagues))} | ${vagues.join(' ')} |`;
  });
  const ecarts = ecartsInfini(mesures);
  return [
    '## Mode infini',
    '',
    `Matou, 20 vies, sans amélioration ni objet, chaque dieu avec son avatar, ${String(mesures[0]?.vagues.length ?? 0)} graines par ligne. Résultat d’une partie : la dernière vague terminée (le record). ` +
      `On arrête une partie à la vague ${String(VAGUE_MAX_INFINI)}. Bandes, sur les cartes de la région 1 : la médiane du soigneux est entre la vague ${String(BANDES_INFINI.soigneuxMin)} et la vague ` +
      `${String(BANDES_INFINI.soigneuxMax)} ; le naïf ne passe pas la vague ${String(BANDES_INFINI.naifMax)} (aucune de ses parties). Les autres cartes sont données à titre d’information. ` +
      'Le soigneux joue une seule variante (équilibrée, diversité 0,4) et lit les 30 premières vagues générées.',
    '',
    '| Bot | Dieu | Carte | Médiane | Min à max | Vagues par graine |',
    '| --- | --- | --- | --- | --- | --- |',
    ...lignes,
    '',
    `Écarts aux bandes de l’infini : ${ecarts.length === 0 ? 'aucun.' : String(ecarts.length)}`,
    ...(ecarts.length === 0 ? [] : ['', ...ecarts.map((e) => `- ${e}`)]),
  ].join('\n');
}
