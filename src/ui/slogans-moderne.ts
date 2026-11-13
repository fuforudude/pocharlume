// Slogans scandés par la foule dans le bandeau du DLC « Temps modernes » (spec, « Dynamique » : la foule réagit aux événements).
// Pur et sans effet sur le moteur : c'est du rendu, qui lit les événements du pas. Le choix du slogan est un hachage du niveau, du pas
// et du rang de l'événement (jamais `Math.random`) : la même partie rejouée dit les mêmes slogans. Le slogan s'ajoute APRÈS les annonces
// et paroles du pas (voir `ajouterSlogan`) : il ne les remplace jamais, et il n'y en a qu'un par pas (un seul bandeau par pas).
import type { Evenement, EtatPartie } from '../engine';
import type { Vague } from '../engine/definitions';
import { tCle } from '../i18n';
import { regionDeParole, vagueAUnBoss } from './parole-boss';
import type { NiveauCampagne } from '../data/visuel';

/** Nombre de slogans par région (`slogan.m<région>.1` à `slogan.m<région>.10`). */
export const SLOGANS_PAR_REGION = 10;

/** Hachage pur de trois entiers vers [0, 1[ (même famille que celui de la mise en scène vivante). */
function hachage(a: number, b: number, c: number): number {
  let h = Math.imul(a + 7, 374761393) + Math.imul(b + 3, 668265263) + Math.imul(c + 11, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Vrai si cet événement fait réagir la foule : annonce d'événement, foule activée, renforts, vague de boss. */
export function evenementFaitScander(ev: Evenement, vagues: readonly Vague[], niveauDeBoss: boolean): boolean {
  switch (ev.type) {
    case 'annonce_evenement':
    case 'foule_activee':
      return true;
    case 'evenement_niveau':
      return ev.typeEvenement === 'renforts';
    case 'vague': {
      const vague = vagues[ev.index];
      return niveauDeBoss && vague !== undefined && vagueAUnBoss(vague);
    }
    default:
      return false;
  }
}

/** La clé du slogan choisi pour ce pas : déterministe, ou null hors du DLC ou sans événement qui fasse scander. */
export function cleSlogan(niveau: Pick<NiveauCampagne, 'numero' | 'campagne' | 'visuel' | 'boss'>, etat: Pick<EtatPartie, 'pas' | 'evenements'>, vagues: readonly Vague[]): string | null {
  if (niveau.campagne !== 'moderne') return null;
  const rang = etat.evenements.findIndex((ev) => evenementFaitScander(ev, vagues, niveau.boss));
  if (rang < 0) return null;
  const n = 1 + Math.floor(hachage(niveau.numero, etat.pas, rang) * SLOGANS_PAR_REGION);
  return `slogan.m${String(regionDeParole(niveau))}.${String(n)}`;
}

/** Le texte du slogan du pas, ou null. */
export function sloganDuPas(niveau: Pick<NiveauCampagne, 'numero' | 'campagne' | 'visuel' | 'boss'>, etat: Pick<EtatPartie, 'pas' | 'evenements'>, vagues: readonly Vague[]): string | null {
  const cle = cleSlogan(niveau, etat, vagues);
  return cle === null ? null : tCle(cle);
}

/** Les textes du bandeau avec le slogan à la fin : les annonces et paroles passent toujours devant, rien n'est remplacé. */
export function ajouterSlogan(textes: readonly string[], slogan: string | null): string[] {
  return slogan === null ? [...textes] : [...textes, slogan];
}
