// Point d'entrée du navigateur : écran d'accueil minimal, puis la partie de test. La carte du monde et la
// sauvegarde (tâche 8) remplaceront l'accueil et appelleront `lancerNiveau` avec les vrais niveaux.
import './ui/style.css';
import { VERSION_DONNEES } from './data/version';
import type { ConfigPartie } from './engine';
import { afficherAccueil } from './ui/ecrans';
import { NIVEAU_CAMPAGNE_TEST } from './ui/niveau-test';
import { lancerNiveau, type PartieEnCours } from './ui/partie';

const conteneur = document.querySelector<HTMLElement>('#app');
if (!conteneur) throw new Error('Conteneur #app introuvable');
const app: HTMLElement = conteneur;

function configDeTest(): ConfigPartie {
  return { graine: Date.now() & 0x7fffffff, difficulte: 'matou', dieu: 'charlie', niveauHeros: 1, versionDonnees: VERSION_DONNEES };
}

function accueil(): void {
  afficherAccueil(app, {
    surJouer: () => {
      app.replaceChildren();
      lancerNiveau(NIVEAU_CAMPAGNE_TEST, configDeTest(), () => undefined, { parent: app, surQuitter: accueil })
        .then((partie: PartieEnCours) => {
          // En développement seulement : la console du navigateur peut piloter et mesurer la partie.
          if (import.meta.env.DEV) (window as unknown as { __partie?: PartieEnCours }).__partie = partie;
        })
        .catch((erreur: unknown) => {
          console.error(erreur);
        });
    },
  });
}

accueil();
