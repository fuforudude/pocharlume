// Toutes les cartes dessinées à la main, des 5 régions : 4 pour le Village Affamé, 3 pour chacune des régions 2 à 5.
import { CARREFOUR, CHAUMES, GUE, PENDUS } from './cartes';
import { AIRE, MEULES, SILLONS } from './cartes-region2';
import { BEFFROI, PLACE, RUELLES } from './cartes-region3';
import { ETANG, PONTON, SAULES } from './cartes-region4';
import { FAUBOURG, MARCHE, QUARANTAINE } from './cartes-region5';
import type { CarteModele } from './modele-carte';

export type { CarteModele } from './modele-carte';

export const CARTES = {
  chaumes: CHAUMES,
  gue: GUE,
  pendus: PENDUS,
  carrefour: CARREFOUR,
  sillons: SILLONS,
  meules: MEULES,
  aire: AIRE,
  ruelles: RUELLES,
  place: PLACE,
  beffroi: BEFFROI,
  ponton: PONTON,
  etang: ETANG,
  saules: SAULES,
  quarantaine: QUARANTAINE,
  faubourg: FAUBOURG,
  marche: MARCHE,
} as const satisfies Record<string, CarteModele>;

export type IdCarte = keyof typeof CARTES;
