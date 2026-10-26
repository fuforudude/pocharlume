# Crédits

## Sons (public/sons/)

Les bruitages viennent de trois packs de [Kenney](https://kenney.nl) (Kenney Vleugels), publiés sous licence
**Creative Commons Zéro (CC0 1.0)** : usage libre, y compris commercial, sans obligation de crédit (nous le faisons
quand même, avec plaisir).

| Pack | Page | Fichiers utilisés |
| --- | --- | --- |
| Impact Sounds 1.0 | https://kenney.nl/assets/impact-sounds | 12 |
| RPG Audio | https://kenney.nl/assets/rpg-audio | 6 |
| Interface Sounds | https://kenney.nl/assets/interface-sounds | 7 |

Licence : https://creativecommons.org/publicdomain/zero/1.0/

La correspondance fichier d'origine, nom dans le jeu et usage de chaque son est dans
[tools/sons/catalogue.ts](tools/sons/catalogue.ts) ; `npm run sons -- <dossier des packs extraits>` les recopie. Les
fichiers sont gardés tels quels (Ogg Vorbis, sans retouche) : le jeu fait varier la hauteur et le volume à la lecture.

## Graphismes

Les sprites des ennemis humains partent du pack **Minifolks** (`art/minifolks/`), recolorés et retouchés par
`npm run art`. **Licence à vérifier avant le jalon 5** : elle doit autoriser la modification et un usage commercial
(voir la spec, section Graphismes). Tant que ce n'est pas fait, cette ligne reste une réserve, pas un accord.
