// API publique de la sauvegarde : ce que l'interface utilise. Fonctions pures d'un côté (progression, méta-progression,
// réglages, partie en cours, export et import), accès au stockage de l'autre (Depot, Session).
export { ouvrirCanalNavigateur, type CanalSauvegarde } from './canal';
export { exporterCode, importerCode, remplacerProgression, type RaisonImport, type ResultatImport } from './code';
export { configDepuisSauvegarde, type ConfigMeta, type OptionsConfig, type RaisonConfig, type ResultatConfig } from './config-partie';
export { definitionDuHeros, pointsDeCompetence, type DefCompetence, type DefHeros, type DefsMeta } from './definitions';
export {
  CLE_AVANT_MIGRATION,
  CLE_SAUVEGARDE,
  CLE_SECOURS,
  Depot,
  type Chargement,
  type Relecture,
  type OrigineChargement,
} from './depot';
export {
  DIFFICULTES_SAUVEGARDE,
  etoilesDepensees,
  etoilesGagnees,
  metaParDefaut,
  NOMBRE_NIVEAUX,
  REGLAGES_PAR_DEFAUT,
  sauvegardeVide,
  VERSION_SAUVEGARDE,
  type ChoixPartie,
  type DifficulteSauvegarde,
  type Etoiles,
  type EtoilesNiveau,
  type Meta,
  type Monnaies,
  type PartieEnCours,
  type Progression,
  type ProgressionHeros,
  type Reglages,
  type Sauvegarde,
  type VitesseJeu,
} from './format';
export { migrer, type ResultatMigration } from './migrations';
export { avecPartieEnCours, partieEnCours, reprendrePartie } from './partie';
export { changerReglages, enregistrerVictoire, etoilesDe, fusionnerProgressions, meilleuresEtoiles, niveauDebloque, niveauReussi, totalEtoiles } from './progression';
export {
  difficulteDe,
  Session,
  type ExamenPartie,
  type FinDePartie,
  type OptionsSession,
  type Reprise,
  type ResultatFin,
  type ResultatTransaction,
} from './session';
export {
  ouvrirStockage,
  StockageIndexedDB,
  StockageLocalStorage,
  StockageMemoire,
  type Environnement,
  type NomStockage,
  type Stockage,
} from './stockage';
export {
  acheterDisciple,
  acheterObjet,
  acheterRangArbre,
  choisirHeros,
  enregistrerFinDePartie,
  equiperObjets,
  etoilesDisponibles,
  niveauDuHeros,
  niveauHerosDepuisXp,
  pointsDisponibles,
  reinitialiserArbre,
  reinitialiserPoints,
  repartirPoint,
  type BilanPartie,
  type FinDePartieMeta,
  type RaisonAchatObjet,
  type RaisonArbre,
  type RaisonChoix,
  type RaisonDisciple,
  type RaisonEquipement,
  type RaisonFin,
  type RaisonPoint,
  type RaisonPoints,
  type RaisonReinitialisation,
  type ResultatFin as ResultatFinPure,
  type Transaction,
} from './transactions';
export { validerSauvegarde, type Resultat } from './validation';
export { creerVerrouMemoire, ouvrirVerrouNavigateur, type VerrouSauvegarde } from './verrou';
