# 0001 : TypeScript, Vite, Canvas maison et moteur déterministe

Statut : acceptée
Date : 2026-10-25

## Contexte
Pocharlume est un tower defense en pixel art, joué d'abord sur téléphone (navigateur puis appli Android), hors
ligne en V1. La spec impose :
- 60 images/s avec 150 ennemis sur un Android milieu de gamme de 2020, et un premier chargement sous 3 Mo ;
- un simulateur (`npm run balance`) qui rejoue chaque niveau sans affichage, avec des bots, pour vérifier
  l'équilibrage dans les tests ;
- la possibilité, plus tard, qu'un serveur rejoue une partie à partir de son journal d'actions (classements) ;
- une appli Android publiable sur le Play Store, avec une sauvegarde qui survit aux mises à jour.

## Décision
- **TypeScript strict + Vite**, sans framework UI ni moteur de jeu. Rendu **Canvas 2D maison** : sprites en
  atlas, zoom à pixels entiers, sans lissage.
- **Simulation déterministe séparée du rendu** : `src/engine/` avance par pas fixes de 1/30 s, tire ses nombres
  d'un générateur pseudo-aléatoire à graine et ne lit jamais l'horloge. Il ne connaît ni le DOM, ni le rendu,
  ni la sauvegarde, et tourne donc tel quel dans Node. Une partie se résume à une graine et un journal d'actions
  horodatées en pas : la rejouer redonne le même état, octet pour octet. Le rendu lit l'état et interpole
  entre deux pas. ESLint impose ces frontières (`reglesSimulationPure`), un test vérifie la règle.
- **Toutes les valeurs de jeu dans `src/data/`**, lues par le moteur, le simulateur et le générateur de vagues.
- **Capacitor** pour l'appli Android (jalon 5) : le même site statique, construit avec `base: './'`.
- **Sauvegarde locale versionnée** derrière une couche unique (`src/save/`) : IndexedDB dans le navigateur,
  Preferences de Capacitor sur Android. Chaque format porte un numéro de version et une chaîne de migrations ;
  export et import par code.

## Conséquences
- Le simulateur, les tests de déterminisme et un futur rejeu serveur réutilisent le moteur sans adaptation.
- Le bundle reste petit (aucune dépendance d'exécution), ce qui tient l'objectif des 3 Mo.
- On écrit nous-mêmes la boucle, la caméra, les entrées, les animations et les pools d'objets.
- Discipline à tenir : pas de flottants dépendants de l'ordre d'itération non fixé, pas de `Math.random`,
  pas de `Date.now` dans le moteur ; l'ordre de mise à jour des entités est stable.
- Passer à Capacitor ne touche ni au moteur ni au rendu, seulement au stockage et à l'emballage.

## Alternatives écartées
- **Phaser 3** : moteur complet et éprouvé, mais environ 1 Mo minifié, une boucle et une physique pensées pour
  le temps réel, et une simulation mêlée aux objets d'affichage. Le faire tourner sans affichage dans Node, de
  façon déterministe, demanderait de contourner l'essentiel du moteur. Un tower defense en Canvas 2D n'a pas
  besoin de ce qu'il apporte en plus.
- **Simulation à pas variable** (delta de l'image) : plus simple au départ, mais rend le rejeu et le simulateur
  non reproductibles.
