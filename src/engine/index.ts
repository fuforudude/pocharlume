// API publique du moteur : ce que le rendu, l'interface, la sauvegarde et le simulateur utilisent.
export type { Action, RaisonRefus, ResultatAction } from './actions';
export type * from './definitions';
export type {
  CheminCalcule,
  ConfigPartie,
  Ennemi,
  EntreeJournal,
  EtatPartie,
  EtatSort,
  EtatVagues,
  FamilleTour,
  GenreUnite,
  PaquetActif,
  Piege,
  Projectile,
  Statut,
  Structure,
  Tour,
  Unite,
  ZoneDurable,
} from './etat';
export { EFFET, MINUTEUR, VERSION_ETAT } from './etat';
export { verifierConfig } from './config';
export type { Evenement } from './evenements';
export { creerGenerateur, tirer, tirerEntre, type Generateur } from './aleatoire';
export { distanceAuxChemins, pointSurChemin } from './chemins';
export { ajusterMontant, partEntiere } from './argent';
export { ajouterEnnemi } from './ennemis';
export {
  appliquerAction,
  avancer,
  coutCompetence,
  coutConstruction,
  creerPartie,
  deserialiser,
  etoilesPour,
  rejouer,
  serialiser,
  step,
  validerAction,
  valeurRevente,
} from './partie';
export { enPas, PAS_PAR_SECONDE } from './temps';
