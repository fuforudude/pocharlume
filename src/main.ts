// Point d'entrée du navigateur : écran d'accueil minimal, puis la partie. La carte du monde et la sauvegarde
// (tâche 8) remplaceront l'accueil et appelleront `lancerNiveau` avec les vrais niveaux.
import './ui/style.css';
import { REGION1 } from './data/niveaux/region1';
import { VERSION_DONNEES } from './data/version';
import type { NiveauCampagne } from './data/visuel';
import type { ConfigPartie } from './engine';
import { t } from './i18n';
import { afficherAccueil } from './ui/ecrans';
import { NIVEAU_CAMPAGNE_TEST } from './ui/niveau-test';
import { lancerNiveau, type PartieEnCours } from './ui/partie';

const conteneur = document.querySelector<HTMLElement>('#app');
if (!conteneur) throw new Error('Conteneur #app introuvable');
const app: HTMLElement = conteneur;

function configDeTest(): ConfigPartie {
  return { graine: Date.now() & 0x7fffffff, difficulte: 'matou', dieu: 'charlie', niveauHeros: 1, versionDonnees: VERSION_DONNEES };
}

function jouer(niveau: NiveauCampagne): void {
  app.replaceChildren();
  // En développement seulement : la console du navigateur peut piloter et mesurer la partie.
  const surDemarrage = import.meta.env.DEV
    ? (partie: PartieEnCours): void => {
        (window as unknown as { __partie?: PartieEnCours }).__partie = partie;
      }
    : undefined;
  lancerNiveau(niveau, configDeTest(), () => undefined, { parent: app, surQuitter: accueil, ...(surDemarrage ? { surDemarrage } : {}) })
    .catch((erreur: unknown) => {
      console.error(erreur);
    });
}

function accueil(): void {
  app.replaceChildren();
  const premier = REGION1[0];
  const dernier = REGION1[REGION1.length - 1];
  if (!premier || !dernier) throw new Error('Région 1 vide');
  afficherAccueil(app, {
    surJouer: () => { jouer(premier); },
    autres: [
      { libelle: t('accueil.niveau', { n: dernier.numero }), surChoisir: () => { jouer(dernier); } },
      { libelle: t('accueil.niveau_test'), surChoisir: () => { jouer(NIVEAU_CAMPAGNE_TEST); } },
    ],
  });
}

accueil();
