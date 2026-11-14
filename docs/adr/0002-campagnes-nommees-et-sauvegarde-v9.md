# 0002 : Campagnes nommées, sauvegarde v9 et correction toujours en avant

Statut : acceptée
Date : 2026-11-14

## Contexte
Le DLC « Temps modernes » (spec `docs/specs/2026-11-12-dlc-temps-modernes-campagne.md`) ajoute une seconde campagne
de 30 niveaux, avec sa propre progression, une nouvelle monnaie (badges), une collection et des titres. L'histoire
(150 niveaux) ne doit pas changer d'un octet, et les sauvegardes v8 des joueurs doivent passer sans perte.

## Décision
- **Campagne nommée** : chaque niveau porte un champ facultatif `campagne` (`histoire` ou `moderne`, absent =
  histoire) et un numéro dans sa campagne. Les niveaux de l'histoire ne portent pas le champ : leur état sérialisé
  ne change pas.
- **Sauvegarde v9** : un bloc `moderne` à part au premier niveau de la sauvegarde (progression, défis, records réservés,
  badges, collection et équipement, titres, sticker), plutôt qu'un mélange avec `meta` ; la partie en cours porte sa
  campagne. Migration v8 → v9 idempotente qui ajoute un bloc vide et copie l'original dans `sauvegarde.avant-migration`.
- **Identifiants inconnus** (skins, titres) écartés à la normalisation, jamais une cause de rejet de toute la sauvegarde.
- **Import d'un code sans DLC** : le DLC de l'appareil est gardé ; un code v9 qui en contient un le remplace.
- **Versions** : `VERSION_ETAT` 10 et `VERSION_DONNEES` 17 ; une partie rangée par l'ancien client est refusée
  proprement (« partie oubliée »).
- **Après la mise en ligne, on corrige toujours en avant, jamais par revert.** L'ancien client trouve une
  sauvegarde v9 illisible, la met de côté et repart d'une sauvegarde vide. Pour retirer le DLC en urgence, on garde
  `VERSION_SAUVEGARDE = 9` et on cache seulement ses entrées.

## Conséquences
- L'histoire reste identique (test `src/engine/histoire-empreinte.test.ts`, empreintes relevées avant le DLC).
- Les joueurs perdent leur partie en cours à la mise en ligne (changement de `VERSION_DONNEES`), pas leur progression.
- Toute future campagne suit le même modèle : un bloc par campagne, une valeur de `IdCampagne`.
- Un retour en arrière du site après la sortie effacerait les sauvegardes des joueurs : il est interdit.
