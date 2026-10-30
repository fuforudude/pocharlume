// « Nouvelles découvertes » de la fiche d'un niveau : ce que ce niveau débloque (src/data/deblocage.ts), avec une ligne
// tirée des données sur ce que ça apporte. Logique pure : le DOM est dans carte-monde.ts.
import { nouveautesDuNiveau, type PalierTour } from '../data/deblocage';
import { DIEUX } from '../data/dieux';
import { TOURS } from '../data/tours';
import type { DefNiveauTour, IdFamille, Voie } from '../engine/definitions';
import { t, tCle } from '../i18n';
import { spriteTour } from '../render/habillage';
import { pouvoirsTour } from './bulle-contenus';

export interface Decouverte {
  /** Identifiant stable : « caserne-2 », « tir-4A », « divine ». */
  readonly id: string;
  readonly famille: IdFamille | 'divine';
  readonly palier: PalierTour;
  /** Spécialisation (palier 4), sinon null. */
  readonly voie: Voie | null;
  /** Sprite de l'atlas (la tour divine : celle du dieu donné). */
  readonly icone: string;
  /** Nom affiché, déjà traduit. */
  readonly nom: string;
  /** Ce que ça apporte, en une phrase tirée des données. */
  readonly apport: string;
}

/** Un nombre à la française, à une décimale au plus : « 3,5 », « 0,8 », « 12 ». */
function decimal(x: number): string {
  return String(Math.round(x * 10) / 10).replace('.', ',');
}

/** La phrase d'une tour commune : ses soldats, ou ses dégâts, sa cadence et sa portée (chiffres bruts des données). */
export function apportTour(def: DefNiveauTour): string {
  const s = def.soldats;
  if (s) return t('decouverte.soldats', { n: s.nombre, pv: s.pv, min: s.degats[0], max: s.degats[1] });
  return t(def.zone > 0 ? 'decouverte.tir_zone' : 'decouverte.tir', {
    min: def.degats[0],
    max: def.degats[1],
    type: t(`decouverte.type_${def.typeDegats}`),
    cadence: decimal(def.cadence),
    portee: decimal(def.portee),
  });
}

/**
 * La phrase d'une spécialisation : son pouvoir (ce qui la distingue : furtifs, spectres, chaîne, effets…), tiré des mêmes
 * caractéristiques que la bulle ; à défaut, ses dégâts comme une tour commune.
 */
export function apportSpecialisation(def: DefNiveauTour): string {
  const pouvoirs = pouvoirsTour(def);
  if (pouvoirs.length === 0) return apportTour(def);
  return t('decouverte.pouvoir', { texte: pouvoirs.map((p) => t('decouverte.pouvoir_un', { nom: p.libelle, valeur: p.valeur })).join(' ; ') });
}

/**
 * Ce que le niveau `numero` débloque de neuf, dans l'ordre de la table ; vide s'il n'apporte rien. Une spécialisation donne
 * ses deux voies. `dieu` choisit l'image et le prix de la tour divine.
 */
export function decouvertesDuNiveau(numero: number, dieu: string): Decouverte[] {
  const divine = Object.hasOwn(DIEUX, dieu) ? DIEUX[dieu as keyof typeof DIEUX].tourDivine : DIEUX.plume.tourDivine;
  return nouveautesDuNiveau(numero).flatMap((d): Decouverte[] => {
    if (d.famille === 'divine') {
      return [{ id: 'divine', famille: 'divine', palier: 1, voie: null, icone: spriteTour('divine', 1, null, dieu), nom: t('famille.divine'), apport: t('decouverte.divine', { cout: divine.cout }) }];
    }
    const famille = TOURS[d.famille];
    if (d.palier === 4) {
      return (['A', 'B'] as const).map((voie) => {
        const def = famille.specialisations[voie];
        return {
          id: `${d.famille}-4${voie}`,
          famille: d.famille,
          palier: 4,
          voie,
          icone: spriteTour(d.famille, 4, voie),
          // La famille telle que le joueur la connaît : le nom de sa tour de base.
          nom: t('decouverte.specialisation', { nom: tCle(def.nom), base: tCle(famille.niveaux[0].nom) }),
          apport: apportSpecialisation(def),
        };
      });
    }
    const def = famille.niveaux[d.palier - 1];
    if (!def) return [];
    return [{
      id: `${d.famille}-${String(d.palier)}`,
      famille: d.famille,
      palier: d.palier,
      voie: null,
      icone: spriteTour(d.famille, d.palier, null),
      nom: d.palier === 1 ? tCle(def.nom) : t('decouverte.niveau', { nom: tCle(def.nom), n: d.palier }),
      apport: apportTour(def),
    }];
  });
}
