// Toutes les cartes dessinées à la main, des 11 régions : 4 pour le Village Affamé, 3 pour chacune des régions 2 à 10, puis une par
// niveau pour la région 11 (après l'histoire, une carte neuve par niveau).
import { CARREFOUR, CHAUMES, GUE, PENDUS } from './cartes';
import { AIRE, MEULES, SILLONS } from './cartes-region2';
import { BEFFROI, PLACE, RUELLES } from './cartes-region3';
import { ETANG, PONTON, SAULES } from './cartes-region4';
import { FAUBOURG, MARCHE, QUARANTAINE } from './cartes-region5';
import { FOSSOYAGE, OSSUAIRE, TERTRES } from './cartes-region6';
import { BALISTE, BIVOUAC, PALISSADE } from './cartes-region7';
import { CLOITRE, REFECTOIRE, SCRIPTORIUM } from './cartes-region8';
import { AVENUE, DOUVES, PONT_LEVIS } from './cartes-region9';
import { CHOEUR, NEF, TRANSEPT } from './cartes-region10';
import { CARTES_REGION11 } from './cartes-region11';
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
  fossoyage: FOSSOYAGE,
  tertres: TERTRES,
  ossuaire: OSSUAIRE,
  bivouac: BIVOUAC,
  palissade: PALISSADE,
  baliste: BALISTE,
  cloitre: CLOITRE,
  refectoire: REFECTOIRE,
  scriptorium: SCRIPTORIUM,
  avenue: AVENUE,
  douves: DOUVES,
  pont_levis: PONT_LEVIS,
  nef: NEF,
  transept: TRANSEPT,
  choeur: CHOEUR,
  ...CARTES_REGION11,
} as const satisfies Record<string, CarteModele>;

export type IdCarte = keyof typeof CARTES;
