# DLC « Temps modernes » : un rythme plus nerveux

Statut : validée
Date : 2026-11-15

## Besoin
En jouant le DLC, l'auteur trouve le rythme trop lent : la Fac présente un ennemi nouveau par niveau, et les niveaux comptent
trop de vagues. Il veut découvrir le bestiaire plus vite et des niveaux plus courts et plus denses.

## Périmètre
- Dedans : les 30 niveaux de la campagne `moderne` (plans `plan-moderne-r1/2/3.ts`, vagues figées `vagues-moderne-r*.ts`),
  leur rééquilibrage contre les bandes, `VERSION_DONNEES`.
- Hors périmètre : la campagne histoire (aucune empreinte ne bouge), les cartes, les ennemis eux-mêmes (PV, vitesse), le moteur.

## Décisions techniques (prises par l'auteur le 2026-11-15)
- **Les ennemis de la Fac arrivent par 2, et le bestiaire de la Fac est complet au niveau 5.**
  - Niveau 1 : Gendarme et Gendarme Mobile.
  - Niveau 2 : CRS et Canon à eau.
  - Niveau 3 : BAC et Tireur de LBD.
  - Niveau 4 : BRAV-M et Grenadier lacrymogène.
  - Niveau 5 : Drone, Commissaire et Bouclier anti-émeute.
  - Niveaux 6 à 9 : ils mélangent tout, avec les cartes qui bougent.
  - Niveau 10 : le boss, sans changement.

  Les événements qui accompagnent un ennemi (la charge, la ligne du canon à eau) arrivent avec lui. La Manif garde ses 3
  arrivées : le Cavalier au 13, l'Hélicoptère au 16, le Centaure au 18.
- **Moins de vagues** :
  - Fac : 6 à 8 vagues ;
  - Manif : 8 à 10 vagues ;
  - Préfecture : 9 à 11 vagues.

  Chaque boss garde sa dernière vague mise en scène.
- **La menace totale d'un niveau est gardée, et les vagues sont donc plus denses.** On relève `facteurBudget` pour que la somme
  des budgets des vagues reste à peu près celle d'avant. Les événements datés (charges, renforts, nasses, canons, chemins qui
  s'ouvrent ou se ferment) sont replacés sur les nouvelles vagues, dans le même ordre et à la même proportion du niveau.
- **Les données des niveaux changent, donc `VERSION_DONNEES` passe de 17 à 18.**
  - Une partie du DLC en cours chez un joueur devient « partie oubliée ».
  - La progression, les étoiles, les badges et les records sont gardés.
  - L'auteur l'a accepté.
- **Rééquilibrage contre les bandes** : les mêmes bandes que la livraison du DLC, avec Matou et Vieux Sage toujours suspendus.
  Le boss du niveau 20 doit rester tuable avec une stratégie perce-armure.

## Décisions et réglages en cours de route (2026-11-16)
- **Le décor sous le fourgon du canon à eau est déplacé.** Avec le Canon à eau présent aux niveaux 2 à 10 de la Fac, les décors
  qui passaient sous sa silhouette vont vers une case libre proche. Le test reste strict. C'est la décision de l'auteur.
- **Les tests lourds ne tournent plus sur la machine de l'auteur.** Les bandes et la vérification complète passent sur GitHub,
  avec `[equilibrage]` dans le message du commit. C'est la décision de l'auteur.
- **Les arêtes de départ sont relevées pour compenser l'économie.** Avec moins de vagues, on gagne moins d'arêtes avant les
  vagues lourdes, et l'Héroïque (une seule vie) sortait de sa bande par le bas.
  - Fac : arêtes environ ×2 aux niveaux 1 à 9.
  - Manif : arêtes ×1,4 aux niveaux 11 à 19, avec `facteurAretes` du défi Fer divisé d'autant.
  - Préfecture : arêtes relevées aux niveaux 24 et 28.
- **Des graines changent.** Le tirage d'origine ne faisait plus apparaître l'ennemi attendu au bon niveau.
  - Fac : niveaux 3, 6, 7, 8 et 9.
  - Manif : niveau 16, pour que l'Hélicoptère apparaisse bien au 16.
- **Un test est assoupli.** Le test qui imposait que la Manif n'ait jamais moins de vagues que la Fac ne compare plus que les
  niveaux d'une même région.

## Critères d'acceptation
- [ ] Les nouveaux ennemis de la Fac sont exactement ceux de la liste ci-dessus, niveau par niveau. Un test le vérifie à partir
      des vagues figées : première apparition de chaque ennemi.
- [ ] Le nombre de vagues de chaque niveau est dans la fourchette de sa région. Un test le vérifie.
- [ ] Pour chaque niveau, hors boss, la menace totale des vagues figées reste entre 85 et 115 % de celle d'avant. Le relevé
      d'avant est figé dans le test.
- [ ] Aucun événement ne pointe vers une vague qui n'existe plus. Le test de cohérence des plans existe déjà ou doit être ajouté.
- [ ] `VERSION_DONNEES` vaut 18. Une partie rangée avec la version 17 est refusée proprement.
- [ ] Les bandes de la campagne `moderne` passent (`BANDES_CAMPAGNE=moderne BANDES_REGIONS=n`) pour les 3 régions.
- [ ] Les empreintes de l'histoire ne bougent pas (`src/engine/histoire-empreinte.test.ts`).
- [ ] La vérification complète passe.

## Tâches (en parallèle, une par région)
1. **Fac** (`plan-moderne-r1.ts`, `vagues-moderne-r1.ts`, tests de la région 1, `version.ts`) : les arrivées par 2, 6 à 8 vagues,
   les événements replacés, le budget compensé, les bandes de la région 1. Elle porte aussi le passage de `VERSION_DONNEES`
   à 18 et le test des arrivées.
2. **Manif** (`plan-moderne-r2.ts`, `vagues-moderne-r2.ts`, tests de la région 2) : 8 à 10 vagues, les événements replacés, le
   budget compensé, les bandes de la région 2 et le boss du niveau 20.
3. **Préfecture** (`plan-moderne-r3.ts`, `vagues-moderne-r3.ts`, tests de la région 3) : 9 à 11 vagues, les événements
   replacés, le budget compensé, les bandes de la région 3 et le boss du niveau 30.

## Impacts
- Données : les vagues figées du DLC ; `VERSION_DONNEES` 18. La sauvegarde reste en v9.
- Écrans : aucun. Les fiches de niveau calculent déjà les nouveaux ennemis à partir des vagues ; à vérifier.

## Questions ouvertes
- Aucune.
