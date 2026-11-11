# DLC « Temps modernes » : animation des 41 skins validés

Statut : validée le 2026-11-11
Date : 2026-11-11

## Besoin
Les 41 skins du DLC (23 tours, 3 chats tireurs, 15 ennemis) sont validés en pose fixe
(`docs/specs/2026-11-11-dlc-temps-modernes-skins.md`). Étape suivante : les animer, puis les faire valider sur la page de revue.
Toujours hors du jeu : aucune règle, aucun branchement dans l'atlas.

## Décisions (2026-11-11)
- **Mêmes animations que l'original** : chaque skin reçoit exactement les animations (noms, nombre d'images, cadence, points
  d'ancrage) de la tour ou de l'ennemi du jeu dont il reprend la place (`original` dans l'en-tête de sa source), pour pouvoir
  être branché plus tard sans toucher au moteur ni au rendu.
- **Demandes de l'auteur déjà connues** : les membranes des enceintes de la Sono pulsent comme si du son sortait ; le reste suit
  l'esprit des originaux (fumigènes qui ondulent, drapeaux qui flottent, gyrophares qui clignotent, rotors qui tournent, jet du
  canon à eau qui gicle…).
- **Identifiants renommés** pour coller aux dessins : `moderne-artillerie-bidon` → `moderne-artillerie-trebuchet`,
  `moderne-artillerie-lance-pierre` → `moderne-artillerie-canon-paves` (sources, index, et la page de revue garde les avis).
- **Revue** : la même page (https://claude.ai/artifact/VWMGWvx8m6pycg5zHBPYcD), chaque carte montre les animations qui tournent
  (une vignette animée par animation), à côté de la pose de l'original animée de la même façon.

## Critères d'acceptation
- [ ] Chaque skin a toutes les animations de son original (mêmes noms et même nombre d'images), testé par l'outil `tools/dlc`.
- [ ] Aperçus animés générés (GIF par skin et par animation) par `npm run dlc:apercu`.
- [ ] Le jeu ne change pas : atlas et tests de sprites inchangés.
- [ ] Page de revue republiée avec les animations ; avis de l'auteur relevés et traités.

## Hors périmètre
- Règles, niveaux, équilibrage, vente ou déblocage du DLC ; branchement des skins dans le jeu.
