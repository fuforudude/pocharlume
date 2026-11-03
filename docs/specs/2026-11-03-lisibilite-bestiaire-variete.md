# Retours du 2026-11-03 : départ et arrivée lisibles, bestiaire, plus d'ennemis, tours plus flashy

Statut : validée le 2026-11-03
Date : 2026-11-03

## Besoin
En jouant, l'utilisateur relève quatre problèmes :
1. On ne sait pas d'où partent les ennemis ni où ils vont : il faut deviner.
2. Pas de bestiaire : lire ce que font les ennemis et les tours pendant les vagues, sous pression, est pénible.
3. Peu de variété : dix niveaux d'une région avec les mêmes adversaires, c'est long.
4. Les améliorations de tours (niveaux 1 à 3) ne se voient pas assez ; certaines ne sont pas assez flashy.

## Décisions (entretien du 2026-11-03)

### A. Départ et arrivée
- À chaque entrée de chemin, un panneau (crâne ou fanion) qui pulse avant la vague, avec les icônes des ennemis qui
  sortiront par là pour la prochaine vague et leur nombre. Survol (PC) ou appui long (téléphone) : bulle détaillée
  (réutiliser `src/ui/bulle.ts`). Le panneau disparaît une fois la vague partie, revient avant la suivante.
- La sortie est dessinée : la porte de ce qu'on défend, avec le cœur des vies ; elle tremble et rougit quand un ennemi
  passe.
- Tracé animé : au début du niveau, une traînée lumineuse parcourt chaque chemin de l'entrée à la sortie (~2 s), et de
  nouveau quand un chemin sert pour la première fois dans le niveau. Respecte « réduire les animations ».
- Rien de tout ça ne change le moteur ni l'équilibrage (affichage seulement), sauf la lecture de la composition de la
  prochaine vague, déjà connue (vagues figées).

### B. Bestiaire
- Écran « Bestiaire », ouvert depuis la carte du monde et depuis la pause : onglets Ennemis et Tours.
  - Ennemi : sprite animé, nom, PV, armure, résistance magique, vitesse, particularités, faiblesses / comment le contrer
    (texte clair), phrase de lore. Un ennemi jamais rencontré reste « ??? » (silhouette).
  - Tour : chaque famille, ses niveaux et spécialisations, chiffres et pouvoirs ; ce qui n'est pas encore débloqué dans
    la campagne est montré verrouillé.
  - Chiffres tirés des données (comme les bulles, `bulle-contenus.ts`).
- Fiche « Nouvel ennemi » : la première fois qu'un ennemi apparaît en partie, le jeu se met en pause et montre sa fiche
  courte (ce qu'il fait, comment le contrer). Une seule fois par ennemi, mémorisé dans la sauvegarde ; option pour les
  désactiver dans Options.
- Fiche du niveau : les ennemis qu'on y rencontre (icônes, nouveau signalé), avec bulle.
- La « rencontre » d'un ennemi est enregistrée dans la sauvegarde (méta), migration de sauvegarde propre.

### C. Variété des ennemis
- Chaque région garde ses ennemis, en **ajoute 2 nouveaux** qui arrivent en cours de région (vers les niveaux 4 et 7),
  et reprend **quelques ennemis des régions précédentes** dans ses plans de vagues. Environ 20 nouveaux ennemis.
- Chaque nouvel ennemi a un rôle distinct (pas une copie à PV différents) : exemples de rôles à couvrir — bouclier
  frontal, kamikaze, invocateur, saut par-dessus les soldats, fuyard qui vole des arêtes, aura de résistance, porteur qui
  se divise, etc. Cohérent avec le lore de la région (`docs/lore.md` : nom, description, phrase de lore). Sprites dans le
  style des autres (`art/sprites/*.txt`, `npm run art`).
- Rééquilibrage complet au simulateur : bandes imposées tenues.

### D. Tours plus flashy
- D'abord une planche : les 4 familles aux niveaux 1, 2, 3 (et les spécialisations pour comparaison), avec des
  propositions de changement. L'utilisateur choisit ce qu'on refait.
- Puis : chaque niveau nettement plus grand et plus riche (silhouette qui grandit, drapeaux, braseros, lueur, idle
  animé) et un effet visible à l'amélioration (éclat, poussière, son).

## Critères d'acceptation
- [x] A : chaque entrée montre avant chaque vague un panneau avec les icônes et le nombre d'ennemis qui en sortiront
  (test : composition affichée = composition de la vague par entrée) ; la sortie est dessinée et réagit à une fuite ;
  le tracé animé part au début du niveau et respecte « réduire les animations ».
- [ ] B : écran Bestiaire (carte du monde et pause), ennemis rencontrés détaillés, autres « ??? » ; tours avec niveaux
  et spécialisations ; chiffres = données (test).
- [ ] B : fiche « Nouvel ennemi » une seule fois par ennemi (sauvegarde), pause pendant la fiche, option pour la couper.
- [ ] B : la fiche du niveau montre ses ennemis.
- [ ] C : chaque région a au moins 2 ennemis inédits et en reprend au moins 1 d'une région précédente (test sur les
  plans) ; chaque nouvel ennemi a un rôle mécanique propre testé dans le moteur ; textes dans lore.md.
- [ ] C : `npm run balance` sans écart aux bandes imposées.
- [ ] D : planche envoyée et validée ; sprites refaits ; effet d'amélioration visible.
- [ ] Tout tient en 740×360 et 1280×720.

## Tâches
1. A — indications de départ et d'arrivée (rendu, HUD).
2. B — Bestiaire, fiche « Nouvel ennemi », ennemis sur la fiche du niveau, rencontres dans la sauvegarde.
3. C — nouveaux ennemis (moteur, données, sprites, lore), mélange des régions, rééquilibrage.
4. D — planche des tours, puis refonte après choix de l'utilisateur.
5. Relecture, fusion, QA navigateur PC et téléphone, mise en ligne.

## Impacts
- Données : ennemis, plans de vagues, `VERSION_DONNEES` ; sauvegarde (ennemis rencontrés, option).
- Écrans : partie (entrées, sortie, tracé, fiche nouvel ennemi), carte du monde, pause, fiche du niveau, Bestiaire.

## Questions ouvertes
- Choix des tours à refaire (après la planche).
