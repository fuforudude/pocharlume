# Après l'histoire : 50 niveaux à gimmicks (régions 11 à 15)

Statut : en cours, jalon 1 (région 11) livré le 2026-11-09
Date : 2026-11-08

## Besoin
Une fois l'histoire finie (niveau 100), gagner des braises est très long : il ne reste que les défis et les paliers de l'infini.
L'auteur veut 50 niveaux de plus, où chaque bloc de 5 niveaux a une particularité (un « gimmick ») qui change la façon de jouer, et qui
rapportent nettement plus de braises.

## Décisions (entretien du 2026-11-08)

### Structure
- 50 niveaux, numéros **101 à 150**, en **5 régions de 10** (régions 11 à 15), après la Cathédrale du Soleil Blême. Chaque région a
  son décor, son lore, **2 gimmicks** (un par bloc de 5 niveaux) et un **boss inédit** au niveau 10 de la région.
- La région 11 s'ouvre à la victoire du niveau 100. La fin de l'histoire reste le niveau 100 (`NIVEAU_FIN_CAMPAGNE`).
- **50 cartes neuves** (aucune reprise).
- Dans un bloc, la difficulté monte ; le 5e niveau du bloc est le plus dur (au niveau 10 de la région : le boss, avec le gimmick du bloc).
- Modes : comme la campagne (Chaton, Matou, Vieux Sage, puis défis Héroïque et Fer à 3 étoiles). Tout est débloqué (rythme des
  niveaux 11+).
- Ennemis : les 59 existants, en mélanges plus durs pensés pour le gimmick, plus un boss inédit par région. Pas d'ennemi ordinaire nouveau.
- Lore : les agents proposent noms, ambiances et phrases dans `docs/lore.md`, dans le ton de l'histoire ; l'auteur retouche.
- Infini : 1 ou 2 cartes neuves par région rejoignent la liste de l'infini, **sans** gimmick.

### Les 10 gimmicks, dans l'ordre (du plus simple au plus dur)
| Niveaux | Région | Gimmick | Règle |
| --- | --- | --- | --- |
| 101–105 | 11 | **Vol de Corbeaux** | Des volants traversent la carte de gauche à droite dans des couloirs horizontaux, sans suivre le chemin ; chacun qui atteint le bord droit coûte 1 cœur. Couloirs fixés par carte (2 ou 3), annoncés avant la vague par un panneau au bord gauche. Seuls ce qui vise les volants (tours, sorts, héros tireurs) les touche. |
| 106–110 | 11 | **Radeau** | Une plateforme à 3 places va et vient sans arrêt le long d'un trajet tracé sur l'eau. On y construit toute tour sauf les casernes ; ses tours tirent depuis la position courante du radeau. |
| 111–115 | 12 | **Pont-Levis** | Deux chemins ; toutes les 2 vagues une herse bascule et les ennemis prennent l'autre. |
| 116–120 | 12 | **Crue** | À certaines vagues, l'eau monte et noie une partie des emplacements : leurs tours sont hors service jusqu'à la décrue. |
| 121–125 | 13 | **Nuit sans Lune** | Carte noire : on ne voit et ne touche que les ennemis éclairés (tours à feu, braseros posés, sorts de lumière). |
| 126–130 | 13 | **Dîme** | Toutes les 2 manches, toutes les tours sont vendues d'office, **au prix total dépensé** (tour et améliorations). |
| 131–135 | 14 | **Convoi** | Un chariot de réfugiés remonte le chemin à contre-sens, visé en priorité ; détruit = **défaite immédiate**. |
| 136–140 | 14 | **Marché Noir** | Avant chaque vague, on choisit 1 tour parmi 3 tirées au hasard (déterministe) ; seules les tours choisies se construisent. |
| 141–145 | 15 | **Contagion** | Une tour près du chemin peut attraper la peste et la passer à ses voisines ; malade, elle ne tire plus tant qu'on ne paie pas son soin. |
| 146–150 | 15 | **Colosse** | Un géant traverse lentement la carte toute la partie, en plus des vagues ; s'il atteint la porte : **défaite immédiate**. |

Les détails chiffrés des gimmicks 3 à 10 (cadences, coûts, nombres) se décident à l'entretien de début de leur jalon.

### Braises (niveaux 101 à 150 seulement ; 1 à 100 inchangés)
- 15 à la première victoire d'un niveau (au lieu de 5), **+30** à la première victoire du 5e niveau de chaque bloc (105, 110, … 150),
  +6 la première fois qu'un niveau atteint 3 étoiles (au lieu de 2), défi réussi : 12 (au lieu de 4).
- Ordre de grandeur pour tout finir : 50 × 15 + 10 × 30 + 50 × 6 + 100 × 12 ≈ 2550 braises (≈ 125 caisses).

### Décisions techniques (2026-11-08)
1. **Format du gimmick** : champ `gimmick` du `Niveau`, union discriminée (`{ type: 'corbeaux', couloirs }`, `{ type: 'radeau', trajet,
   vitesse, places }`, …) ; un module par gimmick dans `src/engine/gimmicks/`, appelé à chaque pas par un aiguillage unique ; TypeScript
   vérifie qu'aucun type n'est oublié (`switch` exhaustif). Même style que `PouvoirsEnnemi`.
2. **Radeau** : sa position est une **fonction pure du numéro de pas** (`positionRadeau(gimmick, pas)`), rien n'est stocké ; une tour du
   radeau garde seulement « radeau, place n ». Rejeu et sauvegarde en pleine partie restent justes sans migration de l'état du radeau.
3. **Corbeaux** : c'est l'**apparition dans la vague** qui dit « couloir k » au lieu de « chemin k » ; tout ennemi volant peut traverser.
   L'ennemi porte son couloir dans l'état (`VERSION_ETAT` + 1).
4. **Bots** : chaque gimmick vient avec sa stratégie de bot (utiliser le radeau, couvrir les couloirs annoncés…), pour que les bandes
   imposées aient un sens sur ces régions.

### Décisions de jeu du jalon 1 (2026-11-08, après les relectures)
- **L'eau bloque** la construction sur les cartes de la région 11 (étangs compris), sauf sur le radeau : les cases d'eau sont des cases interdites.
- **Radeau** : seules les tours sans rien posé au sol y vont. Casernes, divine de Plume (assassins) **et divine de Pollen (tourelles)** sont refusées (`radeau_sans_caserne` ou raison dédiée).
- **Héros** : placement inchangé (près d'un chemin). Chaque couloir croise un chemin, le héros tireur se poste au croisement.
- **Corbeau** : un corbeau qui sort coûte **au moins 1 cœur** ; `coutVies: 0` est refusé à la validation.

### Livraison
Région par région : **5 jalons**, chacun mis en ligne. Le jalon 1 = base commune + région 11. Cette spec détaille le jalon 1 ; les
jalons 2 à 5 y ajouteront leur section après leur entretien.

## Jalon 1 : base commune et région 11 « Les Grèves Grises » (nom proposé, à retoucher)

### Critères d'acceptation
- [x] Le niveau 100 gagné ouvre la région 11 ; la carte du monde montre les régions 11 à 15 (onglets), 12 à 15 verrouillées tant que
  la précédente n'est pas finie ; la sauvegarde accepte les niveaux jusqu'à 150 et les régions jusqu'à 15 (tests de validation et de
  migration si le format change).
- [x] Braises : un niveau ≥ 101 rapporte 15 / +30 (5e du bloc) / +6 (3 étoiles) / 12 (défi) ; les niveaux 1 à 100 rapportent comme avant
  (tests de `meta.ts` et des transactions).
- [x] Moteur, Corbeaux : un ennemi apparu dans un couloir avance en ligne droite du bord gauche au bord droit, ignore le chemin, les
  soldats et ce qui ne vise pas les volants, et retire 1 cœur en sortant à droite ; déterministe au rejeu (tests du moteur).
- [x] Moteur, Radeau : 3 places dont la position suit le trajet aller-retour en fonction du seul pas ; construire, améliorer,
  vendre y marche ; une caserne y est refusée (raison dédiée) ; une tour du radeau vise depuis la position courante ; une sauvegarde en
  pleine partie puis reprise redonne le même état (tests du moteur).
- [x] Rendu : les couloirs et le panneau d'annonce au bord gauche avant chaque vague (icônes, nombre, couloir) ; le radeau et ses tours
  se déplacent de façon fluide (interpolés entre deux pas) ; bulle sur le panneau et sur le radeau.
- [x] Le gimmick est présenté : sur la fiche du niveau (« Particularité : … », une ligne tirée des données) et par une fiche en partie
  la première fois qu'on le rencontre (comme « Nouvel ennemi », même option pour la couper) ; il figure dans le Bestiaire (onglet ou
  section « Particularités »).
- [x] 10 cartes neuves de la région 11 (eau et rivages pour le radeau, bandes dégagées pour les couloirs), décor et ambiance de région,
  lore (nom de région, nom et phrase de chaque niveau) dans `docs/lore.md`, boss inédit au niveau 110 (sprite, capacités pensées pour le
  radeau, phrase de lore, conseils du Bestiaire).
- [x] 1 ou 2 cartes de la région 11 dans l'infini, sans gimmick.
- [x] Bots : stratégies Corbeaux et Radeau ; `npm run balance` sans écart aux bandes imposées sur la région 11 (Chaton, défis 40–90 %,
  infini) et toujours 0 écart ailleurs ; la CI teste les bandes de la région 11 (matrice du déploiement).
- [x] QA navigateur 1280×720 et 740×360 : tout tient, 0 erreur en console.

### Tâches
1. **Base commune** (données, sauvegarde, carte du monde) : régions 11–15 dans `meta.ts` en distinguant fin de l'histoire (100) et dernier
   niveau (150), ouverture, braises, validation et migration de sauvegarde, onglets 11–15 de la carte (en 740×360 aussi), `VERSION_DONNEES`.
2. **Aiguillage des gimmicks + Corbeaux** (moteur) : type `Gimmick`, `src/engine/gimmicks/index.ts`, couloirs dans le format des vagues
   et du générateur, mouvement en couloir, cœur perdu, `VERSION_ETAT` + 1, tests.
3. **Radeau** (moteur, après la tâche 2) : places mobiles, commandes de construction, refus des casernes, ciblage, tests.
4. **Rendu et présentation** (après 2 et 3) : couloirs, panneau, radeau, interpolation, fiche du niveau, fiche « Nouvelle particularité »,
   Bestiaire, textes.
5. **Contenu de la région 11** (en parallèle de 2–4) : 10 cartes, décor, lore, boss, plans de vagues (`plan-region11.ts`), cartes de l'infini.
6. **Bots et équilibrage** (après 2–5) : stratégies, `npm run balance`, CI à 11 régions, rapport.
7. Relecture, intégration, QA, mise en ligne.

### Équilibrage de la région 11 (tâche 6, 2026-11-08)

Outils : `npm run balance -- --niveaux=101-110 --difficultes=chaton,heroique,fer --graines=10 --detail` (80 à 110 secondes, les mêmes
chiffres que la passe complète : 10 graines = les graines d'évaluation), un niveau isolé pour chercher la cause, puis une seule passe
complète. Bandes imposées : Chaton (le naïf gagne tout), sans défense, défis Héroïque et Fer (40 à 90 % sur la région). Matou et Vieux
Sage restent suspendues, comme ailleurs. `npm run balance` jetait jusqu'ici les écarts de la région 11 (`ecartsDeTout` s'arrêtait à la
région 10) : les régions évaluées vont maintenant de 1 à 11, dérivées de la campagne (`REGIONS_DE_LA_CAMPAGNE`, rapport-regions.ts).

**Stratégies de bot** (décision technique 4) :
- *Vol de Corbeaux* : pour la géométrie des bots, un couloir est un trajet comme un chemin (indice N + k), jamais compté sur le chemin 0.
  Le soigneux n'y compte que les tours qui visent les volants. Il achète en priorité de quoi abattre chaque volant annoncé (vague en cours
  et prochaine) pendant sa traversée : 1,25 fois ses PV, avec puissance × (temps à portée + (n − 1) × intervalle) / n par tour. Son héros,
  s'il tire sur les volants, se poste au croisement du chemin et du couloir le plus menacé. Le naïf, sur une case qui voit plus de couloir
  que de chemin, tire sa famille parmi celles qui touchent les volants.
- *Radeau* : une tour s'identifie par son lieu (case ou place), jamais par sa case. Le soigneux construit sur les places libres tir,
  magie, artillerie et la tour divine de Charlie. Une place vaut sa couverture moyenne sur 8 positions distinctes d'un aller.

**Premier passage** : **4 écarts** aux bandes imposées avec les bots d'avant la tâche (Chaton pour les trois dieux, Défi Héroïque), **3**
avec les bots des gimmicks sans réglage des plans (Chaton de Plume et de Charlie, Défi Héroïque). Après les réglages : **0 écart**.

| Écart au premier passage | Cause | Réglage |
| --- | --- | --- |
| Chaton : le naïf gagne 90 / 82 / 93 % (Plume / Charlie / Pollen) des niveaux 101 à 110, puis 92 / 89 / 100 % avec les bots des gimmicks (niveaux 101, 103, 104 : 30 à 80 %) | Il tirait sa famille au hasard, caserne et artillerie comprises, même sur une case qui ne voit qu'un couloir de volants | Familles qui touchent les volants sur une case tournée vers un couloir (bot naïf). Effectifs plus bas aux niveaux 101 à 105 (ci-dessous) |
| Défi Héroïque : 24 % (bots d'avant), 25 % (bots des gimmicks) | Niveaux 101, 103, 105 : un volant sort d'un couloir dès la vague 4 à 6, et c'est la seule vie. Un couloir ne pèse que 2 à 17 % de la menace : le soigneux le laissait presque nu. Les essaims de 10 Chauves-Souris d'élite à 0,2 s ne s'abattent qu'avec une dizaine de tours de magie. Niveaux 107 à 109 : Charlie et Pollen à court d'arêtes | Règle des couloirs annoncés (soigneux). Arêtes de départ : 101 : 1300 → 1820, 102 : 1350 → 1890, 103 : 1400 → 1960, 104 : 1450 → 2030, 105 : 1550 → 2170, 106 : 1350 → 1690, 107 : 1400 → 1750, 108 : 1450 → 1810, 109 : 1500 → 1875. `facteurBudget` 101 : 0,25 → 0,19, 102 : 0,28 → 0,22, 103 : 0,2 → 0,12, 104 : 0,33 → 0,26, 105 : 0,38 → 0,24. Plus de Chauve-Souris aux niveaux 103 et 105 ; graines 103 : 2106 → 2156, 105 : 4113 → 4133 (pour que chaque couloir serve encore) |

Ce qui n'a pas aidé, et a été retiré : peser un couloir par sa part d'ennemis plutôt que de menace (Héroïque 101 à 105 de 7 % à 6 %).
Les arêtes seules (+40 %) ne faisaient passer l'Héroïque de 101 à 105 que de 7 à 13 % : il fallait des effectifs plus bas et moins
d'essaims. Le radeau, la vitesse du radeau, le nombre de couloirs et le Passeur n'ont pas été touchés.

| Mesure (soigneux, 10 graines) | Bots d'avant | Bots des gimmicks, sans réglage | Après réglage |
| --- | --- | --- | --- |
| Chaton, naïf (Plume / Charlie / Pollen) | 90 / 82 / 93 % | 92 / 89 / 100 % | 100 / 100 / 100 % |
| Défi Héroïque, région 11 (trois dieux) | 24 % | 25 % | 50 % |
| Défi Héroïque (Plume / Charlie / Pollen) | 45 / 12 / 14 % | 48 / 10 / 18 % | 78 / 32 / 39 % |
| Défi Fer, région 11 (trois dieux) | 87 % | 87 % | 90 % |
| Héroïque par niveau, 101 à 110 (Plume) | 0, 100, 0, 0, 0, 100, 50, 100, 100, 0 | 0, 100, 0, 40, 0, 100, 50, 100, 90, 0 | 100, 100, 60, 90, 50, 100, 100, 90, 90, 0 |
| Héroïque par niveau (Charlie) | 0, 0, 0, 0, 0, 100, 0, 20, 0, 0 | 0, 0, 0, 0, 0, 100, 0, 0, 0, 0 | 0, 80, 0, 0, 0, 90, 90, 60, 0, 0 |
| Héroïque par niveau (Pollen) | 0, 0, 0, 0, 0, 70, 40, 30, 0, 0 | 0, 0, 0, 0, 0, 70, 40, 70, 0, 0 | 0, 90, 0, 0, 0, 100, 100, 100, 0, 0 |
| Fer par niveau (trois dieux) | 100 sauf 101 Pollen (0) et 110 (0) | idem | 100 sauf 110 (0) |

#### Second équilibrage (2026-11-09) : bots relus, Passeur par le chemin nord, Fer réglé par niveau

Après le premier équilibrage, le radeau a été agrandi : 3 places en ligne, et les trajets des niveaux 106 à 110 recentrés dans l'eau.
Avec les bots d'alors, le Fer de la région montait à **93 %**, hors bande, et le niveau 110 restait perdu en Matou (0 sur 30 pour les deux
bots). L'étudiant a décidé de « rééquilibrer les deux » : le Passeur doit être gagnable en Matou, et le Fer de la région doit revenir
vers 70 %.

**Bots** (relecture de la tâche 6), sans effet sur les régions 1 à 10 :
- Dégâts au volant calculés contre sa protection réelle, élites comprises (interpolation de `dpsEfficace` au palier rencontré).
- 8 positions distinctes du radeau, prises sur un aller.
- Classement des cases : les couloirs ne comptent pas pour la caserne et l'artillerie.
- Zone de feu d'une tour du radeau : couverture moyenne de sa place.

Sur un échantillon de 13 niveaux des régions 1 à 10, joués dans les cinq modes, la sortie `--detail` est identique ligne à ligne.

**Décision 1 : le Passeur arrive par le chemin nord.** Au niveau 110, le Passeur faisait à lui seul 93 % de la menace du niveau
(`menaceEnnemi` compte ses 12 vies). Le soigneux défendait donc toute la partie haute du chemin 0 et laissait passer les Creux et les
Acolytes des chemins 1 et 2. Ces chemins ne rejoignent le chemin 0 qu'à la sortie, et ces ennemis suffisaient à le battre avant même le
boss. Corriger ce poids dans le bot aurait changé les niveaux de boss des régions 1 à 10. Avec les seuls PV et vies du Passeur, le
soigneux de Charlie et de Pollen ne gagnait qu'avec un boss de 2500 à 4000 PV et de 3 à 4 vies, plus faible que celui de la région 1.
Choix retenu (option B) :
- `boss.chemin` 0 → 1 : le chemin nord, qui rejoint le chemin 0 près de la sortie, si bien que défendre la jonction couvre tout ;
- Passeur à 15 000 PV au lieu de 18 000, `coutVies` 12 gardé, pouvoirs inchangés ;
- arêtes de départ du 110 : 2700 → 3600 ;
- `facteurBudget` du 110 : 0,1 → 0,07.

Le test du boss accepte maintenant au moins 0,9 fois les PV du Soleil Blême.

**Limite assumée** : le soigneux gagne le 110 en Matou avec 6 à 7 vies sur 20, et le naïf en Chaton avec 13 vies sur 25. Le Passeur
n'y est pas tué : **il sort (12 vies)**, et la partie est gagnée parce qu'il est le dernier ennemi.

**Décision 2 : le Fer se règle par niveau.** Avec le Passeur gagnable, le Fer de la région montait à 100 %. Aucun levier du niveau n'y
changeait rien :
- toutes les paires permises donnent 100 % sur chacun des niveaux 101 à 110 ;
- un budget × 2,2, ou des arêtes × 0,35 avec un budget × 2, laissent le Fer à 100 % ;
- le Fer ne tombait qu'en même temps que le Chaton du naïf et que l'Héroïque.

Cause : la difficulté de la région vient des couloirs et du radeau, où un seul volant coûte la partie en Héroïque (une vie). Au Fer, on
a 20 vies et les arêtes sont multipliées par 6. Choix retenu (option A) : `DefiFer` reçoit `facteurAretes` et `facteurEffectifs`,
facultatifs (finis et strictement positifs, vérifiés par `creerPartie`), qui remplacent `REGLES.fer` pour ce niveau. Les régions 1 à 10
ne les utilisent pas, et leur Fer ne change pas. Réglages de la région 11 :
- 4 et 0,8 sur les niveaux 101, 102, 105, 106, 108 et 110 ;
- 3,5 et 0,9 sur les niveaux 103, 104, 107 et 109, où les trois dieux gagnaient encore avec leurs 20 vies.

`VERSION_DONNEES` reste 16. Elle a déjà été montée dans ce jalon, qui n'est pas en ligne : aucune partie de la région 11 n'existe chez un
joueur. De plus, une partie en cours garde dans son état les vagues et les arêtes calculées à sa création.

| Mesure de la région 11 (10 graines) | Bots d'avant, radeau agrandi | Bots relus | Passeur par le nord | + Fer par niveau (final) |
| --- | --- | --- | --- | --- |
| Chaton, soigneux (Plume / Charlie / Pollen) | 100 / 92 / 90 % | 100 / 97 / 90 % | 100 / 100 / 100 % | 100 / 100 / 100 % |
| Chaton, naïf | 100 / 100 / 100 % | 100 / 100 / 100 % | 100 / 100 / 100 % | 100 / 100 / 100 % |
| Matou, soigneux | 90 / 90 / 90 % | 90 / 84 / 87 % | 100 / 94 / 97 % | 100 / 94 / 97 % |
| Niveau 110 en Matou, soigneux / naïf | 0 / 0 % | 0 / 0 % | 100 % / 47 % (70 / 0 / 70) | 100 % / 47 % |
| Défi Héroïque, région (bande 40 à 90 %) | 49 % | 47 % | 47 % | 47 % (73 / 29 / 39) |
| Défi Fer, région (bande 40 à 90 %) | **93 %** | 90 % | **100 %** | **73 %** (97 / 78 / 44) |
| Fer par niveau, 101 à 110 (trois dieux) | 100 sauf 110 (33 %) | 100 sauf 110 (0 %) | 100 partout | 57, 73, 100, 90, 60, 33, 67, 63, 60, 87 % |

Passe complète finale (`npm run balance`, 2108 s) : **0 écart aux bandes imposées**. Dans `balance-report.md`, seules les sections de
la région 11 changent. Les bandes de la région 11 (`BANDES_REGIONS=11`) passent en 123 s. Marges : en Chaton, le naïf gagne tout ; le
Fer est à 13 points de la borne haute (90 %) et de la cible basse (60 %) ; l'Héroïque n'est qu'à **7 points** de sa borne basse (40 %).

Signalé, sans réglage :
- **Marge de l'Héroïque** : à 47 %, aucun levier propre à l'Héroïque ne le relève sans relever aussi les autres modes. Plume est à 73 %,
  Charlie à 29 % et Pollen à 39 %. Le héros de Charlie ne tire pas sur les volants ; pour Pollen, la cause n'est pas chiffrée.
- **Matou de la région 11** (bande suspendue) : 15 écarts au lieu de 17. Le naïf gagne trop (79 et 86 % pour Plume et Pollen), et sa
  courbe de difficulté ne monte pas.

## Livraison du jalon 1 (2026-11-09)
- Vérification complète verte (lint, types, 182 fichiers de tests dont 10 relancés seuls faute de place sur la machine, build).
  QA navigateur PC 1280×720 et téléphone 740×360 acceptée, 0 erreur en console.
- Écarts : le Passeur passe par le chemin nord (décision B) et les bots gagnent le 110 en Matou en le laissant sortir ; le défi
  Fer a ses facteurs par niveau (décision A) ; le radeau a 3 places en ligne à une case d'écart, trajets recentrés.
- Remarques de QA laissées en l'état : le total d'étoiles (« sur 330 ») n'est que dans l'infobulle du compteur ; en téléphone,
  avec la région 11 avancée, le cadrage initial laisse 106 à 108 sous l'en-tête jusqu'à la première sélection ; la bulle du
  Passeur en partie montre ses PV de difficulté (16 200 en Matou), le Bestiaire ses PV de base (15 000).

## Impacts
- Données : `meta.ts` (régions, braises), `Niveau.gimmick`, format des vagues (couloir), ennemis (boss de région), `VERSION_DONNEES`, `VERSION_ETAT`.
- Sauvegarde : bornes de validation (niveau 150, région 15) ; migration seulement si le format change.
- Écrans : carte du monde, fiche du niveau, partie (panneau des couloirs, radeau), Bestiaire.
- CI : matrice des bandes étendue à chaque nouvelle région.

## Questions ouvertes
- Aucune pour le jalon 1. (Carte du monde en 740×360, région entière débloquée : on garde le glissement, vue centrée sur le niveau à
  jouer, décision du 2026-11-08.)
