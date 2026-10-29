# Adaptateur Pocharlume de l'atelier

Branche les sprites, la palette et les cartes de Pocharlume sur le cœur générique `tools/atelier/` (voir son README pour
l'usage et l'interface d'adaptateur). Lancer : `npm run editeur` (port 5199 par défaut, `-- --port 5200` pour un autre),
puis ouvrir http://127.0.0.1:5199/.

## Ce qu'il fait

- **Sprites** (`sprites.ts`, `sources.ts`) : réutilise `tools/art/` (analyseur `format.ts`, rendu `dessin.ts`). Les
  calques éditables sont les grilles de lettres des `art/sprites/*.txt` : calques nommés (dont ceux partagés par tout le
  fichier ou hérités d'un `modele`, signalés « partagé »), cadres dessinés, retouches. Les cadres repris d'une planche
  Minifolks ou d'un autre sprite se voient dans les animations mais ne s'éditent pas. L'enregistrement ne réécrit que les
  lignes de grille modifiées (`tools/atelier/ecriture-texte.ts`) ; une grille garde la largeur de ses lignes. Les
  sprites qui dépendent de celui-ci (`derive`, `modele`, cadres repris) sont rendus à chaque coup de pinceau.
- **Palette** (`palette.ts`) : `art/palettes/*.txt`, seul le code couleur de la ligne change. Avertissement à partir de
  8 sprites concernés (`SEUIL_AVERTISSEMENT`).
- **Cartes** (`cartes.ts`) : déplace les décors de `src/data/niveaux/cartes*.ts`. Règles du jeu appelées telles quelles
  (`habillage.ts`, `grille-niveau.ts`, `assemblage.ts`) : un décor déplacé ne doit ni sortir de la carte ni se poser sur
  un chemin utilisé par tous les niveaux de la carte ; le décompte des cases constructibles avant/après est donné pour la
  carte entière et pour chaque niveau. Seule la ligne `decor('…', x, y)` du décor déplacé change dans le fichier.
- **Statue** (`statues.ts`) : chaque carte montre sa statue (objet `statue`, sprite selon son origine), lue dans la table
  `POSITIONS` de `src/data/niveaux/statues.ts`. Elle se déplace sur une case de décor seulement, avec les règles de
  `src/data/niveaux/statues.test.ts` appliquées pour chaque niveau qui emploie la carte : sprite dans la carte et dans
  une seule case de la grille, hors chemin, sur une case que le décor interdit déjà à la construction, sans recouvrir de
  décor. Un refus dit pourquoi (« sortirait de la carte », « à cheval sur deux cases », « sur le chemin », « sur une case
  constructible », « recouvrirait … ») et pour quels niveaux. Déplacer un décor sur la statue, ou retirer le grand décor
  qui interdit sa case, est refusé au décor. Position : la convention du fichier, le pied du sprite en tuiles ; aimantée
  au demi-tuile à la souris (le pas de toutes les statues sauf `pendus`, en 15.9), décalée de la position actuelle aux
  flèches (Maj : une case, la statue garde sa place dans la case), arrondie au millième avant d'être jugée et écrite.
  Seuls x et y de la ligne de la carte changent dans le fichier ; l'origine ne se change pas ici. L'empreinte d'une
  carte couvre son fichier de décors et `statues.ts` : une modification de l'un ou de l'autre depuis l'ouverture donne
  un 409. Sans `statues.ts`, la statue est montrée désactivée avec un message.
- **Après l'enregistrement d'un sprite ou d'une palette** : `node tools/art/index.ts --sans-apercu` reconstruit l'atlas
  `public/sprites/` et ne touche jamais à `art/apercu/` (les planches suivies par git `_fideles.png` et `_jalon4.png`
  restent intactes).
- **Écriture permise** : `art/`, `src/data/niveaux/cartes.ts`, `src/data/niveaux/cartes-region*.ts`,
  `src/data/niveaux/statues.ts`. Rien d'autre.

## À adapter à la fusion

- **j5-densite (cartes alignées sur la grille)** : tout ce qui lit ou écrit le format des cartes est dans `cartes.ts`
  (`lireDecors` lit les lignes `decor('sprite', x, y[, true])` du texte, `LIGNE_DECOR`, `verifierCarte` pour les règles,
  `aimantation` à passer à 1 si les décors se posent sur la grille). Si les chemins ou les cases changent de format, les
  règles viennent de `src/data/niveaux/` et suivent seules ; sinon ajuster les imports en tête de `cartes.ts`.
- **Format des statues** : si la table `POSITIONS` de `src/data/niveaux/statues.ts` change de forme, adapter
  `LIGNE_STATUE` et `lireStatue` dans `statues.ts` ; si les règles de `statues.test.ts` changent, `verifierStatue`.

## Tests

`npx vitest run tools/atelier-pocharlume` : aller-retour sans perte des 67 fichiers de sprites (toutes les grilles
réécrites avec leur contenu donnent le fichier à l'octet près), palette, édition ciblée, aperçu des dérivés, cartes,
droits d'écriture. `statues.test.ts` : statue lue sur les 31 cartes, verdict de l'atelier identique à celui des règles
de `src/data/niveaux/statues.test.ts` sur toutes les positions au demi-tuile de deux cartes, messages, refus au décor
fautif, écriture d'une seule ligne, aller-retour à l'octet près, 409.
