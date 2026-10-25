// API publique de la sauvegarde : ce que l'interface utilise. Fonctions pures d'un côté (progression, réglages,
// partie en cours, export et import), accès au stockage de l'autre (Depot).
export { exporterCode, importerCode, remplacerProgression, type RaisonImport, type ResultatImport } from './code';
export {
  CLE_AVANT_MIGRATION,
  CLE_SAUVEGARDE,
  CLE_SECOURS,
  Depot,
  type Chargement,
  type OrigineChargement,
} from './depot';
export {
  DIFFICULTES_SAUVEGARDE,
  NOMBRE_NIVEAUX,
  REGLAGES_PAR_DEFAUT,
  sauvegardeVide,
  VERSION_SAUVEGARDE,
  type DifficulteSauvegarde,
  type Etoiles,
  type EtoilesNiveau,
  type PartieEnCours,
  type Progression,
  type Reglages,
  type Sauvegarde,
  type VitesseJeu,
} from './format';
export { migrer, type ResultatMigration } from './migrations';
export { avecPartieEnCours, partieEnCours, reprendrePartie } from './partie';
export { changerReglages, enregistrerVictoire, etoilesDe, meilleuresEtoiles, niveauDebloque, niveauReussi, totalEtoiles } from './progression';
export { difficulteDe, Session, type FinDePartie, type Reprise } from './session';
export {
  ouvrirStockage,
  StockageIndexedDB,
  StockageLocalStorage,
  StockageMemoire,
  type Environnement,
  type NomStockage,
  type Stockage,
} from './stockage';
export { validerSauvegarde, type Resultat } from './validation';
