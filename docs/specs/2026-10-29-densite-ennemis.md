# Moins d'ennemis, plus solides : la zone redevient une stratégie

Statut : validée le 2026-10-29 (jalon 5)
Date : 2026-10-29

## Besoin
En jouant, l'utilisateur trouve qu'il y a trop d'ennemis : les tours de zone (catapulte, baliste à chaînes, etc.) sont
les meilleures presque partout. Il veut qu'elles ne dominent que dans certains niveaux ou avec une stratégie précise,
par exemple bloquer les ennemis avec beaucoup de soldats puis les écraser en zone.

## Constat dans le code
- Les vagues sont tirées sur un budget de menace (`budgetVague`) ; la menace d'un ennemi est linéaire en PV
  (`menaceEnnemi`). Dix ennemis de 50 PV valent un ennemi de 500 PV, alors qu'une tour de zone tue les dix pour le prix
  d'un.
- Les ennemis ordinaires sont tirés 5 fois plus souvent (`repetitionOrdinaires: 5`), par paquets de 12 au plus.
- Dans un paquet, les ennemis se suivent à 0,3 s (`intervalleReference`) : à 1 tuile/s, 0,3 tuile d'écart. Un rayon de
  zone de 1 tuile touche alors 5 à 6 ennemis sans aucun blocage.
- L'estimation de puissance des tours compte 1,5 cible par rayon de zone (`ciblesParRayonDeZone`), bien en dessous de
  ce qui arrive vraiment avec ces écarts.

## Décisions (entretien du 2026-10-29)
- Approche : environ 2× moins d'ennemis, 2× plus de PV et de prime chacun, et plus espacés. Les tours de zone gardent
  leurs chiffres.
- 1 ou 2 niveaux de horde par région : nombreux ennemis faibles et groupés (essaims), là où la zone doit briller.
- Les 10 régions, défis et infini compris : l'équilibrage complet est refait par le simulateur.

## Périmètre
- Dedans :
  - un facteur de robustesse des ennemis ordinaires (PV et prime multipliés, effectifs divisés à budget égal) ;
  - un espacement plus grand dans les paquets, hors essaims ;
  - un profil de niveau « horde » dans les plans (`PlanNiveau`), 1 ou 2 par région, qui garde la densité actuelle ;
  - le bot soigneux apprend « bloquer puis zone » (soldats devant les tours de zone) ;
  - l'estimation de puissance des tours de zone compte les cibles réellement touchées ;
  - nouvel équilibrage des régions 1 à 10, des défis et de l'infini, avec les mêmes bandes imposées ;
  - (ajout de l'utilisateur, 2026-10-29) les chemins des 31 cartes suivent la grille des cases : l'axe passe par le centre des cases,
    un chemin occupe exactement une file de cases, et les cases du chemin n'offrent aucune pose (ni menu, ni case rouge).
- Hors périmètre : les chiffres des tours, des héros et des sorts (sauf décision sur Charlie et Pollen) ; de nouveaux
  ennemis.

## Critères d'acceptation
- [x] Hors niveaux de horde, une vague compte en moyenne au moins 40 % d'ennemis en moins qu'avant, à niveau et vague
  égaux (test sur les 100 niveaux).
- [x] Hors essaims, deux ennemis d'un même paquet sont espacés d'au moins 0,8 tuile à leur entrée (test).
- [x] Chaque région a 1 ou 2 niveaux de horde, marqués dans leur plan et dans la fiche du niveau.
- [x] Simulateur, hors niveaux de horde : une composition sans tour de zone gagne au moins autant que la même
  composition avec zone, sans caserne ; avec caserne et zone, elle gagne plus que sans zone.
- [x] Simulateur, niveaux de horde : la composition avec zone gagne nettement plus que sans (au moins 20 points).
- [x] Les bandes imposées (Chaton, héros seul, défis 40–90 %, infini) passent sur les 100 niveaux.
- [x] Les chemins suivent la grille des cases : sur les 31 cartes, axe par les centres des cases (coordonnées de tuile impaires), segments
  horizontaux ou verticaux, entrée et sortie par le bord ; les cases interdites par le chemin sont exactement les cases traversées par l'axe
  et celles dont le sol est dessiné en chemin ; aucune case à moitié chemin ; toucher une case du chemin n'ouvre ni menu de construction ni
  surbrillance de pose (tests).
- [x] La sauvegarde reste compatible : une partie en cours d'une version précédente des données est refusée proprement
  (changement de `VERSION_DONNEES`).

## Tâches
1. Moteur et données : facteur de robustesse, espacement, profil horde dans `PlanNiveau` et `generation.ts`. Tests.
2. Estimation de puissance des tours de zone et bot soigneux « bloquer puis zone ». Tests du simulateur.
3. Choix des niveaux de horde (1 ou 2 par région, sur des cartes à virages serrés ou à long tronc commun).
4. Rééquilibrage des régions 1 à 10, des défis et de l'infini (`npm run balance`).
4bis. Chemins alignés sur la grille des cases (ajout de l'utilisateur, fait avant la tâche 4 car il change la géométrie des niveaux) : conversion
   faite une fois (script non conservé), tests `chemins-grille.test.ts` et `sol-chemin-grille.test.ts`, case de chemin non cliquable
   (`estCaseDeChemin`, `interaction.ts`), planche avant/après `docs/cartes/chemins-avant-apres.png`.
5. Relecture, QA au navigateur : nombre d'ennemis à l'écran, fiche de niveau de horde.

## Impacts
- Données / migrations : `VERSION_DONNEES` augmente, les vagues figées des 100 niveaux sont régénérées.
- Écrans : fiche de niveau (mention « Horde »).

## Questions ouvertes
- Le facteur exact (2× ou un peu moins) se décide au simulateur ; à confirmer en jouant.
- La faiblesse de Charlie et Pollen en Vieux Sage reste hors de ce chantier : les dieux, héros et sorts ne bougent pas, les
  bandes Matou et Vieux Sage restent suspendues comme aux jalons 3 et 4.

## Écarts et résultats (fin du développement)
- **Espacement** : 1,3 tuile (la spec demandait au moins 0,8). À 0,8 la zone sans caserne gagnait encore 9 points de plus que sans zone ; à 1,3, −1 point. Le test
  vérifie le minimum de 0,8 (`densite.test.ts`), l'espacement réel est dans `EQUILIBRAGE.ecartMinimalTuiles`.
- **Robustesse** : 2, avec un facteur plus bas (jamais sous 1) quand le budget restant ne paie pas un ennemi renforcé entier (régions 7 à 10). Effectif moyen par vague
  hors horde : 79 → 41 (−48 %), de −44 % (région 7) à −51 % (région 4).
- **Horde** : les niveaux 3 et 7 de chaque région (20 niveaux), jamais le boss.
- **Zone** (mesures de `zone.ts`, tolérances documentées dans `zone-ordinaires.test.ts`) : niveaux ordinaires sans caserne, zone −1 point par rapport à sans zone (au plus +6
  toléré) ; avec caserne, la zone gagne +12 points (au moins +10) ; horde, +43 points (au moins +20). Les compositions se mesurent à 45 % des arêtes de départ en Vieux Sage
  (sinon le soigneux gagne tout) et sans tour divine.
- **Estimation de puissance** : `ciblesParRayonDeZone` 1,5 → 1,2 seulement (1 sortait la catapulte et le mortier de la tolérance de ±15 %, et les chiffres des tours ne bougent pas) ;
  les cibles « arrêtées » et « horde » (3,5 et 4,5) ne servent qu'au bot soigneux.
- **Rééquilibrage** : bandes imposées toutes tenues (`npm run balance` : 0 écart imposé). Niveaux retouchés à la main : voir docs/architecture.md, « Équilibrage du jalon 5 ». Matou et
  Vieux Sage restent suspendues comme au jalon 4.
- **Infini** : plafond (200 ennemis) et croissance (×1,22) inchangés : médiane du soigneux 32 à 36 sur la région 1, naïf au plus 29.
- **Non vérifié** : la tâche 5 (QA au navigateur : nombre d'ennemis à l'écran, fiche de niveau de horde, sensation de jeu de la zone) n'est pas faite ; la sensation des niveaux 2
  et 4 de la région 1 (réglés par `ecart` 0,8, et `facteurBudget` 1,25 au niveau 2) est à confirmer en jouant.

