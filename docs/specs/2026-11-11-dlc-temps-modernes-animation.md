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
- **Mégaphone d'or : l'étudiant devient un tireur** (décision de l'auteur, 2026-11-11, après la revue des animations :
  « on enlève l'enceinte, plus qu'un étudiant surélevé, il doit se tourner vers le côté vers lequel il attaque »).
  `moderne-magie-megaphone` ne garde que l'estrade ; l'étudiant est le sprite à part `moderne-megaphone-chat`, dessiné
  tourné à droite, posé au point `tireur` de l'estrade (même place que `tir`, 16 13, inchangé). Il a les animations de
  la tour d'origine (repos 6 images, attaque 3) et joue avec elle. Seule exception au contrat « mêmes animations que
  l'original » : `tour-magie-oracle` n'a pas de tireur, le skin en a un (`TIREURS_SANS_ORIGINAL` dans `tools/dlc/skins.ts`,
  le test de conformité reste bloquant pour tout le reste). Les aperçus montrent aussi le tireur retourné
  (`<id>--repos-miroir.gif`, `<id>--attaque-miroir.gif`, champ `gifMiroir` de l'index) pour chaque skin à tireur.
  **Au branchement du DLC** (rien à faire avant dans `src/`) : `spriteTireur()` de `src/render/habillage.ts` ne donne un
  tireur qu'à la famille `tir` ; il devra renvoyer `moderne-megaphone-chat` pour la magie niveau 4 voie A quand le skin
  DLC est équipé. Le rendu le pose alors au point de tir de la tour (`nomPointDeTir('magie')` = `tir`, d'où les deux
  points confondus) et `tireurMiroir` le retourne vers sa cible, comme les chats des tours de tir.

## Critères d'acceptation
- [ ] Chaque skin a toutes les animations de son original (mêmes noms et même nombre d'images), testé par l'outil `tools/dlc`.
- [ ] Aperçus animés générés (GIF par skin et par animation) par `npm run dlc:apercu`.
- [ ] Le jeu ne change pas : atlas et tests de sprites inchangés.
- [ ] Page de revue republiée avec les animations ; avis de l'auteur relevés et traités.

## Hors périmètre
- Règles, niveaux, équilibrage, vente ou déblocage du DLC ; branchement des skins dans le jeu.
