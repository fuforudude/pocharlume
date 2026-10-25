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
| `src/save/` | Couche de stockage unique (IndexedDB, puis Preferences de Capacitor), format versionné avec migrations, export et import par code. | `src/engine/`, `src/data/` |
| `tools/` | Scripts Node : `art` (grilles de pixels vers planches PNG et atlas JSON), `balance` (simulateur et `balance-report.md`). | `src/engine/`, `src/data/` |
| `art/` | Sources graphiques : pack Minifolks d'origine (`art/minifolks/`), grilles de pixels en texte (`art/sprites/<nom>.txt`). | — |

`src/main.ts` est le point d'entrée du navigateur.

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
