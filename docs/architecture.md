# Architecture

Vue d'ensemble des dossiers et de leurs frontières. Les choix de fond sont expliqués dans
[l'ADR 0001](adr/0001-stack-et-moteur-deterministe.md), le contenu du jeu dans
[la spec](specs/2026-10-25-pocharlume.md).

## Dossiers

| Dossier | Rôle | Peut dépendre de |
| --- | --- | --- |
| `src/engine/` | Simulation déterministe : boucle à pas fixe (1/30 s), générateur pseudo-aléatoire à graine, chemins, ennemis, tours, projectiles, soldats, vagues, vies et or, journal d'actions rejouable. Aucune dépendance au DOM : tourne dans Node (simulateur, futur serveur). | `src/data/` |
| `src/data/` | Tables d'équilibrage : tours, ennemis, dieux, difficultés, règles, formules et générateur de vagues (`equilibrage.ts`), version des données (`version.ts`, à incrémenter à chaque changement d'équilibrage). Aucune valeur de jeu en dur ailleurs. Les niveaux figés vont dans `src/data/niveaux/` (un fichier par région). | `src/engine/` : types, et le générateur à graine (`aleatoire.ts`) pour le générateur de vagues |
| `src/render/` | Rendu Canvas 2D : caméra, zoom à pixels entiers sans lissage, sprites, animations, barres de vie, effets. Lit l'état du moteur, ne le modifie jamais. | `src/engine/`, `src/data/` |
| `src/ui/` | Écrans, HUD, menus, toucher, souris, clavier. Traduit les gestes en actions du moteur. | tout `src/` |
| `src/i18n/` | Textes affichés. `fr.ts` contient la table, `t('clé')` la lit avec une clé typée. | rien |
| `src/save/` | Sauvegarde. Fonctions pures : format versionné (`format.ts`), validation stricte, migrations en chaîne vN vers vN+1, progression (étoiles, déblocage), partie en cours, export et import par code (`code.ts`). `Session` (`session.ts`) tient la sauvegarde courante en mémoire et l'écrit à chaque changement. Accès au stockage : interface `Stockage` (IndexedDB, repli localStorage, mémoire ; Capacitor Preferences plus tard) et `Depot`, qui ne lève jamais et garde une copie de secours d'une sauvegarde illisible. | `src/engine/`, `src/data/` |
| `tools/` | Scripts Node : `art` (grilles de pixels vers planches PNG et atlas JSON), `niveaux` (génère les vagues figées de la région 1, aperçu texte des cartes, bilan du joueur automatique ; `enregistrer.ts` permet à Node d'importer `src/` sans extension), `balance` (simulateur et `balance-report.md`). | `src/engine/`, `src/data/` |
| `art/` | Sources graphiques : pack Minifolks d'origine (`art/minifolks/`), grilles de pixels en texte (`art/sprites/<nom>.txt`, format décrit en tête de `tools/art/format.ts`), palettes partagées (`art/palettes/`). `npm run art` écrit aussi des aperçus agrandis dans `art/apercu/` (ignoré par git). | — |
| `public/sprites/` | Atlas généré par `npm run art` (`atlas.png`, `atlas.json`), commité : le build n'exécute pas le pipeline, un test vérifie que l'atlas est à jour. | — |

`src/main.ts` est le point d'entrée du navigateur.

## Rendu et interface
- **Boucle** (`src/ui/partie.ts`, `lancerNiveau`) : une boucle `requestAnimationFrame` accumule le temps réel
  (`src/render/pas-fixes.ts`, écart borné) et appelle `avancer` par pas de 1/30 s, ×1 ou ×2. Le rendu
  interpole entre deux pas avec le reste de l'accumulateur. Les actions du joueur sont mises dans une file que
  la boucle donne au prochain pas : l'interface n'écrit jamais dans l'état.
- **Rendu** (`src/render/`) : `Rendu` dessine dans un tampon de pixels logiques (une tuile = 16 px) agrandi
  d'un facteur entier sans lissage ; `camera.ts` (zoom entier, glisser, pincement, molette, bornes), `sol.ts`
  (sol précalculé depuis les chemins : herbe, chemin avec bords et coins, boue, pavés), `suivi.ts` (une
  représentation par entité du moteur, créée et retirée d'après les événements), `effets.ts` (effets en pool),
  `animations.ts` et `atlas.ts` (sprites). Rien ne s'alloue dans la boucle chaude.
- **Interface** (`src/ui/`) : `interaction.ts` (machine à états pure : menu d'un socle, héros, sort,
  ralliement ; renvoie l'action à envoyer ou la raison d'un refus), `menu-cercle.ts` (éléments du menu
  d'après `validerAction`), `gestes.ts` (toucher, glisser, pincer), `clavier.ts` (touches), `hud.ts`,
  `ecrans.ts` (accueil, pause, fin, « Tourne ton téléphone », avis discret), `refus.ts` (raison de refus vers texte).
- **Point d'entrée d'un niveau** : `lancerNiveau(niveauCampagne, config, surFin, options)`. `surFin` reçoit
  une fois le `ResultatPartie` (statut, étoiles, vies, pas, journal) ; `options.surQuitter` ajoute le bouton
  « Quitter » des écrans de pause et de fin ; `options.surDemarrage` donne la `PartieEnCours` (utile aux outils
  de mesure). `options.surVague` reçoit l'état juste après le lancement de chaque vague (sauvegarde de la
  partie en cours) ; `options.reprise` relance une partie depuis un état désérialisé (elle démarre en pause,
  « Rejouer » repart d'une partie neuve) ; `options.vitesse` donne la vitesse du réglage par défaut ;
  `options.surContinuer` remplace « Quitter » par « Continuer » après une victoire.
- **Carte du monde** (`src/ui/carte-monde.ts`, `src/render/carte-monde.ts`) : le fond de 512 × 288 est peint une
  fois avec `construireSol` et `peindreSol` (le tracé de `TRACE_REGION1`, seulement jusqu'au dernier niveau
  débloqué), le décor de `carte-monde-decor.ts`, un voile sombre et le pointillé de la suite du chemin. Les
  nœuds, leurs étoiles, le clignotement du prochain niveau et le chevron de sélection se redessinent à chaque
  image, avec la `Camera` de la partie (zoom entier : 2 pixels CSS par pixel du fond au départ, pincer ou
  molette pour tout voir). Ce que la carte montre (nœuds visibles, étoiles, tronçons, voisin d'une flèche,
  nœud touché) est calculé par des fonctions pures (`carte-monde-logique.ts`) d'après la sauvegarde. La fiche
  d'un niveau (nom, ambiance, étoiles par difficulté, difficulté, dieu, Lancer) est en DOM. La sauvegarde est
  lue à l'ouverture de l'écran : pour la voir changer (victoire, import), on rouvre la carte.
- **Options** (`src/ui/options.ts`) : volumes (rangés dans les réglages, pas encore de son), vitesse par défaut,
  export (code à copier) et import (un code refusé affiche sa raison via `import-refus.ts` et n'altère rien ;
  un code valide demande confirmation avant de remplacer la progression et abandonne la partie en cours).
- **Enchaînement des écrans** (`src/main.ts`) : accueil, carte du monde, partie, options. Il ouvre le stockage et
  une `Session` (`src/save/session.ts`) qui garde la sauvegarde courante et l'écrit à chaque changement :
  `terminerPartie` (victoire : meilleur résultat conservé, niveau suivant débloqué ; toujours : partie en cours
  effacée), `rangerPartie` (début de chaque vague), `effacerPartie` (abandon par « Quitter »),
  `partieAReprendre` (état relu pour « Reprendre à la vague N »), réglages, export et import. Les raccourcis de
  test « Niveau 10 » et « Niveau de test » de l'accueil n'existent qu'en développement (`import.meta.env.DEV`)
  et ne touchent pas à la sauvegarde.

## Niveaux de la campagne (`src/data/niveaux/`)
- `cartes.ts` : cartes dessinées à la main (chemins, socles et ralliements, départ du héros, zones de sol, décor).
  Une carte propose plusieurs chemins et plus de socles que nécessaire.
- `plan-region1.ts` : pour chacun des 10 niveaux, la carte, les chemins et les socles choisis, les ennemis
  débloqués, le nombre de vagues, la graine. `assemblage.ts` en tire un `NiveauCampagne` et n'en garde que le
  décor qui ne recouvre ni un chemin ni un socle utilisés.
- `vagues-region1.ts` : vagues **figées**, générées par `npm run niveaux` avec le générateur d'équilibrage
  (budget b(L, w)). Jamais de génération à l'exécution. Un niveau marqué `retouchees: true` dans le plan garde ses
  vagues retouchées à la main ; un test vérifie que les autres correspondent au générateur.
- `carte-du-monde.ts` : positions des 10 nœuds et tracé du chemin sur le fond de la carte de région (512 × 288).
- Le chemin est supposé dessiné sur 2 tuiles de large (`DEMI_LARGEUR_CHEMIN` dans `habillage.ts`) : les socles
  sont à 2 tuiles de l'axe, le décor à au moins 1,25 tuile.

## Invariants vérifiés automatiquement
`eslint.config.js` (bloc `reglesSimulationPure`, testé par `src/architecture.test.ts`) interdit à
`src/engine/**` et `src/data/**` :
- d'importer depuis `render`, `ui` ou `save` ;
- d'utiliser les globales du navigateur (`window`, `document`, `localStorage`, `requestAnimationFrame`…) ;
- d'appeler `Math.random`, `Date.now` ou `performance.now` (aléatoire à graine et temps par pas fixes seulement) ;
- d'utiliser les fonctions mathématiques dont le résultat n'est pas garanti identique d'un moteur JS à
  l'autre (`Math.hypot`, `sin`, `cos`, `tan`, `atan2`, `asin`, `acos`, `pow`, `exp`, `log`, `log2`, `log10`,
  `cbrt`, `expm1`, `log1p`) et l'opérateur `**` : seulement `Math.sqrt` et les opérations de base, exactement
  arrondies partout.

## Règles du moteur
- **Entrées non fiables** : les actions (interface, journal relu) sont validées par `validerAction` : forme
  (type connu, socles et emplacements entiers, coordonnées finies, voie `A` ou `B`), puis règles de jeu. Une
  action refusée ne lève jamais d'exception et ne change rien à l'état. Les tables de données ne sont lues que
  par propriétés propres (`Object.hasOwn`).
- **Événements** : `etat.evenements` contient les événements d'un seul pas (actions appliquées à ce pas, puis
  simulation). Le rendu les lit après chaque `step` ou `avancer`. Partie finie : `fin` se lit une fois, puis
  l'appel suivant vide la liste.
- **Arêtes** : calculs en entiers via pourcentages (`src/engine/argent.ts`) : revente à `tauxRevente` %
  arrondie vers le bas, prix et primes ajustés par un facteur ramené à un pourcentage entier.
- **Versions** : `VERSION_ETAT` (format de l'état) et `VERSION_DONNEES` (équilibrage) sont rangées dans l'état ;
  `deserialiser` et `rejouer` refusent une version différente.
- **Fichiers d'aide aux tests** : suffixe `.test-utils.ts` (jamais importés par le jeu, donc absents du build).
