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

## Nouveaux ennemis (tâche C)

Vingt ennemis ordinaires, deux par région : le premier arrive au niveau 4 de sa région, le second au niveau 7, puis ils reviennent
jusqu'au niveau 10 (`NOUVEAUX_ENNEMIS_REGIONS` et `NIVEAUX_NOUVEAUX`, `plan-niveau.ts` ; la région 1 les met dans `plan-region1.ts`).
Chacun a un rôle mécanique propre : aucun n'est un ennemi existant à d'autres PV, et deux nouveaux n'ont jamais le même rôle. Treize
capacités sont nouvelles dans le moteur (déterministe, une fonction de `ennemis.ts`, `pouvoirs-ennemis.ts`, `degats.ts` ou `unites.ts` chacune), sept
réutilisent une capacité existante dans une combinaison nouvelle (invocation, plongée, aveuglement, mise en feu, dévoration, invulnérabilité périodique).
Tout est piloté par les données (`PouvoirsEnnemi`) : le moteur ne connaît aucun de ces ennemis par son nom. Tests : `src/engine/ennemis-variete.test.ts`.

| Région | Id | Nom | Niv. | Rôle mécanique | Valeurs de départ (Matou) | Ce qui le contre |
| --- | --- | --- | --- | --- | --- | --- |
| 1 Village Affamé | `coupe_bourse` | Coupe-Bourse | 4 | **Voleur d'arêtes qui fuit** (nouveau : `vol`). Au premier soldat qui le retient, ou à la sortie, prend 20 arêtes ; retenu, il file à ×2 pendant 2 s sans que soldat ni héros ne l'arrête (`vol.duree`, ajoutée au rééquilibrage : sans elle, il filait jusqu'à la sortie et le soigneux de Charlie, dont les soldats et le héros ne peuvent plus le toucher, perdait ses 20 vies avant la vague 10 en infini), puis redevient un ennemi comme les autres (il ne vole qu'une fois). Tué, il rend le butin ; échappé, le butin est perdu. | 26 PV, vitesse 1,5 | Le tuer vite : tours de tir à l'entrée, héros |
| 1 | `grand_manteau` | Grand Manteau | 7 | **Porteur qui se divise** (nouveau : `division`). À sa mort, 3 Mendiants sortent de son manteau, là où il tombe. | 70 PV, vitesse 0,8 | Une zone derrière lui ; ne pas le tuer sous la sortie |
| 2 Champs Brûlés | `gerbe_ardente` | Gerbe Ardente | 4 | **Kamikaze** (nouveau : `explosion`). Au contact d'un soldat, explose (22 dégâts physiques à 1,3 tuile) et disparaît : ni prime, ni vie perdue. | 36 PV, vitesse 1,7 | La tuer avant le contact ; soldats espacés, héros solide |
| 2 | `porte_herse` | Porte-Herse | 7 | **Bouclier frontal** (nouveau : `bouclier`). Les coups directs des tours (tir, magie), tourelles et héros tireur venus de devant lui ne passent qu'à 25 %. Les tirs au sol, ondes et soldats ne sont pas arrêtés. | 100 PV, vitesse 0,7 | Artillerie, soldats, tours placées derrière lui ou après son passage |
| 3 Bourg des Bûchers | `fagotier` | Fagotier | 4 | **Incendiaire de tours** (action `desactiver_tour` avec `rayon`, nouveau paramètre). Toutes les 12 s, met le feu à la tour la plus proche à 3 tuiles : 3 s hors service. | 55 PV, vitesse 0,9 | Le tuer avant qu'il n'approche ; tours en nombre |
| 3 | `crieur_public` | Crieur Public | 7 | **Aura de résistance** (nouveau : `auraProtection`). Les autres ennemis à 2,5 tuiles subissent 30 % de dégâts physiques et magiques en moins (non cumulable). | 80 PV, vitesse 0,8 | Le tuer en premier (dégâts purs, poison, brûlure ne sont pas réduits) |
| 4 Marais de l'Ordalie | `crapaud_gonfle` | Crapaud Gonflé | 4 | **Sauteur** (nouveau : `bond`). Franchit le soldat qui le retient (3 tuiles plus loin), au plus toutes les 4 s, sans étourdir personne. | 60 PV, vitesse 1 | Plusieurs lignes de soldats, tours loin de la caserne |
| 4 | `lueur_marais` | Lueur des Marais | 7 | **Aveugleur de tours** (action `aveugler` existante, sur un ennemi ordinaire). Toutes les 10 s, portée −30 % pendant 3 s aux tours à 3 tuiles. Résistance magique 30 %. | 40 PV, vitesse 1,1 | Tuer-la vite, tours à longue portée |
| 5 Ville Pestiférée | `montreur_rats` | Montreur de Rats | 4 | **Invocateur** (action `invoquer` existante, ennemi ordinaire). Toutes les 10 s, lâche 2 Rats de Peste sur le chemin. | 65 PV, vitesse 0,8 | Le tuer en premier ; zone contre les rats |
| 5 | `bubonneux` | Bubonneux | 7 | **Régénération** (nouveau : `regeneration`). Récupère 3 % de ses PV maximaux par seconde. | 120 PV, vitesse 0,8 | Dégâts en rafale, ne pas disperser le tir |
| 6 Charnier | `deterreur` | Déterreur | 4 | **Creuseur** (action `plonger` existante, sur un ennemi ordinaire). Toutes les 9 s, s'enfonce sous terre (intouchable 2 s) et ressort 2,5 tuiles plus loin. | 85 PV, vitesse 0,9 | Garder du tir pour quand il ressort |
| 6 | `fagot_os` | Fagot d'Os | 7 | **Épines** (nouveau : `epines`). Chaque coup au corps-à-corps qu'il reçoit coûte 6 PV purs à celui qui frappe. | 110 PV, vitesse 0,8 | Tours plutôt que soldats et héros |
| 7 Croisade | `sapeur` | Sapeur | 4 | **Désamorceur** (nouveau : action `desamorcer`). Toutes les 6 s, détruit les pièges et tourelles à 2 tuiles. | 90 PV, vitesse 0,9 | Pièges et tourelles loin du chemin ; le tuer avant |
| 7 | `aumonier` | Aumônier de Guerre | 7 | **Purificateur** (nouveau : action `purifier`). Toutes les 5 s, retire ralentissement et étourdissement aux ennemis à 3 tuiles (lui compris). Résistance magique 30 %. | 100 PV, vitesse 0,8 | Dégâts sur la durée (brûlure, poison), le tuer en premier |
| 8 Monastère Noir | `chantre` | Chantre | 4 | **Terreur** (nouveau : action `terrifier`). Toutes les 9 s, étourdit 1,5 s les soldats et le héros à 2 tuiles, qui lâchent leurs ennemis. | 85 PV, vitesse 0,8 | Le tuer avant qu'il n'atteigne la ligne de soldats |
| 8 | `frere_sans_porte` | Frère Sans-Porte | 7 | **Insaisissable** (nouveau : `insaisissable`). Aucun soldat ni héros (tireur compris) ne l'arrête ni ne le vise ; les tours, les sorts, les pièges, les tourelles et les assassins l'atteignent. | 120 PV, vitesse 1 | Tours, artillerie, tout sauf les soldats |
| 9 Cité du Roi | `effigie_roi` | Effigie du Roi | 4 | **Peau alternée** (nouveau : `alternance`). Armure 60 % puis, 5 s plus tard, résistance magique 60 % à la place, et ainsi de suite (la version d'élite échange ses protections renforcées). | 120 PV, vitesse 0,7 | Frapper avec le type de dégâts qui passe en ce moment |
| 9 | `bourreau_roi` | Bourreau du Roi | 7 | **Tueur de soldats** (champ `devore` existant, sur un ennemi ordinaire). Tue d'un coup le soldat qui le retient, toutes les 5 s. Armure 30 %. | 150 PV, vitesse 0,7 | Le tuer à distance ; soldats qui reviennent vite |
| 10 Cathédrale du Soleil Blême | `gargouille` | Gargouille | 4 | **Pierre intermittente** (combinaison : `invulnerabilite` périodique, insensible aux ralentissements et aux étourdissements). Toutes les 8 s, se fige 2 s, intouchable et immobile. Armure 60 %. | 140 PV, vitesse 0,8 | Magie ; ne pas compter sur le contrôle |
| 10 | `martyr_bleme` | Martyr Blême | 7 | **Dernière lueur** (nouveau : `derniereLueur`). À sa mort, rend 35 % de leurs PV maximaux aux ennemis à 3 tuiles. Résistance magique 30 %. | 95 PV, vitesse 0,9 | Le tuer à l'écart du groupe |

L'ennemi « Feu Follet » imaginé d'abord s'appelle `lueur_marais` : `feu-follet` est déjà un décor des Marais (`art/sprites/decor-region4.txt`).

Ennemis repris des régions précédentes (`REPRISES_REGIONS`, dès le niveau 4 de chaque région ; un choix à la main, plus « tout ce qui précède »
comme avant, pour que les nouveaux ennemis restent visibles dans les plans de vagues) : R2 Chien Errant, Mendiant, Coupe-Bourse ;
R3 Paysan Affamé, Corbeau Noir, Gerbe Ardente ; R4 Chasseur de Sorcières, Crieur Public, Corbeau Noir ; R5 Sangsue, Pèlerin Voilé, Fagotier ;
R6 Rat de Peste, Pestiféré, Crapaud Gonflé ; R7 Fossoyeur, Chauve-Souris, Déterreur ; R8 Fantassin, Médecin de Peste, Sapeur ;
R9 Cavalier, Exorciste, Chantre ; R10 Garde Royal, Inquisiteur, Effigie du Roi, Bourreau du Roi. Les nouveaux ennemis entrent aussi dans le mode infini
(`INFINI.regions`), à la suite des ennemis ordinaires de leur région.

Sprites : un par ennemi dans `art/sprites/<id>.txt` (32×32, dessinés, version d'élite comprise, mêmes cinq animations que les autres) ; planche d'aperçu :
`docs/ennemis-variete.png`. Textes : nom, et phrase `ennemi.<id>.desc` dans `docs/lore.md`. Données : `VERSION_DONNEES` 13 → 14, `VERSION_ETAT` 6 → 7 (champs de l'ennemi).
Atlas : `LARGEUR_ATLAS` 1024 → 2048 (40 sprites de plus dépassaient 2048 px de haut).

## Rééquilibrage des nouveaux ennemis (2026-11-03)

Outils : `npm run balance` en entier (environ 27 à 33 minutes avec 16 fils), puis par morceaux pour la mise au point :
`--infini=chaumes,gue,carrefour --dieux=charlie --graines=5` (2 secondes), `--niveaux=41-50 --difficultes=heroique,fer --graines=10` (une région, 30 à 100 secondes),
`--niveaux=1-100 --difficultes=chaton,heroique,fer` (12 minutes). Bandes imposées : Chaton, héros seul, défis Héroïque et Fer (40 à 90 %), infini. Matou et Vieux Sage restent suspendues.

Premier passage (les 20 ennemis, rien d'autre de changé) : **12 écarts** aux bandes imposées. Après les réglages ci-dessous : **0 écart**.

| Écart au premier passage | Cause | Réglage |
| --- | --- | --- |
| Infini, Charlie, soigneux : médiane de la vague 7,5 à 9 (bande 25 à 45), sur les 4 cartes de la région 1 | Le Coupe-Bourse, son butin pris, filait jusqu'à la sortie sans que soldat ni héros (donc rien de ce que joue Charlie) puisse le toucher : 2 vies perdues par vague dès la vague 2, et ses arêtes volées | `Vol.duree` (nouveau champ du moteur, `ennemis.ts`) : il file 2 s à ×2 puis redevient un ennemi comme les autres. Médiane de Charlie : 35 / 33 / 35,5 / 33,5 sur chaumes, gué, pendus, carrefour |
| Chaton : le naïf de Charlie gagne 99 % au lieu de 100 % (régions 2 et 5) | Niveau 13 : une graine perdait à cause des Corbeaux (le naïf tire ses familles au hasard) ; niveau 47 (une horde) : idem | Niveau 13 : graine de vagues 2113 → 2313 ; niveau 47 : 4147 → 4347 (le naïf tient 100 % avec les trois dieux) |
| Défi Fer, région 5 : 38 % (bande 40 à 90) | Les niveaux 43 (caserne + magie) et 47 (caserne + tir), deux hordes, étaient à 0 % avec 700 à 2200 arêtes inutilisées : ces familles ne tiennent pas une horde | Niveau 43 : caserne + artillerie ; niveau 47 : magie + artillerie (jamais deux fois la même paire de suite : test de `campagne.test.ts`). Fer R5 : 47 % |
| Défi Héroïque, région 9 : 29 % ; Fer, régions 9 et 10 : 93 % et 90,3 % | Les arêtes ×3 de l'Héroïque aident les niveaux qu'elles limitent (83, 85, 87, 90 : 0 à 17 %) ; le Fer est saturé (arêtes ×6 inutilisées, il ne dépend plus que des familles et des effectifs) | Niveau 7 : arêtes de départ 250 → 290 (le soigneux de Charlie perdait une des trois graines du test de `simulation.test.ts`). Arêtes de départ de la région 9 : 83 : 1090 → 1525, 85 : 1230 → 1720, 87 : 1370 → 1920, 90 : 1590 → 2225, 81 : 1685 → 1265, 82 : 1010 → 760. `facteurBudget` 81 : 0,278 → 0,31, 82 : 0,209 → 0,235, 83 : 0,217 → 0,19, 85 : 0,375 → 0,33, 87 : 0,314 → 0,275, 90 : 0,265 → 0,235. Défi Fer : effectifs ×0,3 → ×0,36 (`REGLES.fer.facteurEffectifs`, toutes les régions) |

Autres changements de données : `VERSION_DONNEES` 14 → 15. Ennemis : seul le Coupe-Bourse gagne `vol.duree` (PV, vitesse et butin de la spec gardés) ; aucun PV ni prix n'a été touché.
La menace du Montreur de Rats (invocations) et du Bubonneux (régénération) n'est pas chiffrée par `menaceEnnemi`, mais n'a pas fait sortir une bande imposée.

Avant (rapport du jalon 5, `VERSION_DONNEES` 13, avant les 20 ennemis) → après (15). Défis : les trois dieux ensemble, soigneux, 10 graines. La colonne « sans réglage » est le premier passage
(avec la correction du Coupe-Bourse pour les défis et l'infini de Plume et Pollen, qui n'ont pas été rejoués avant) ; « — » : non relevé.

| Mesure | Avant les 20 ennemis | Avec les 20 ennemis, sans réglage | Après réglage |
| --- | --- | --- | --- |
| Chaton, naïf (région 2 : Charlie ; région 5 : Charlie) | 100 % | 99 % | 100 % |
| Défi Héroïque, régions 1 à 10 | 82, 73, 82, 67, 80, 77, 57, 85, 49, 82 % | 72, 78, 70, 51, 66, 79, 55, 63, 29, 63 % | 74, 77, 70, 51, 68, 79, 55, 63, 47, 63 % |
| Défi Fer, régions 1 à 10 | 87, 87, 78, 84, 57, 76, 87, 80, 87, 86 % | 72, 87, 64, 66, 38, 83, 89, 63, 93, 90 % | 67, 82, 52, 58, 47, 76, 76, 56, 88, 80 % |
| Infini, soigneux, médiane sur chaumes (Plume / Charlie / Pollen) | 36 / 35 / 35 | — / 7,5 / — | 37 / 35 / 36 |
| Infini, soigneux, médiane sur gué (Plume / Charlie / Pollen) | 34 / 32,5 / 33 | — / 9 / — | 34 / 33 / 33 |
| Matou, région 1, soigneux (Plume / Charlie / Pollen) | 100 / 100 / 100 % | 99 / 52 / 99 % | 100 / 100 / 100 % |
| Matou, région 1, naïf (Plume / Charlie / Pollen) | 77 / 52 / 98 % | — / 21 / 88 % | 45 / 29 / 90 % |
| Vieux Sage, région 1, soigneux (Plume / Charlie / Pollen) | 99 / 100 / 100 % | — / 30 / — | 89 / 80 / 89 % |

Bandes suspendues, gros écarts entre dieux (signalés seulement) : Charlie reste très en dessous de Plume en Vieux Sage (régions 2 à 10 : de 23 à 95 points, plus de 90 points aux régions 4, 6, 8 et 9) et de 3 à 10 vies en Matou (régions 2 et 4 à 10).
Au jalon 5, l'écart était déjà de 48 à 81 points en Vieux Sage (régions 3 à 10). Les nouveaux ennemis qui contournent ou tuent les soldats (Coupe-Bourse, Frère Sans-Porte, Gerbe Ardente, Chantre, Bourreau du Roi) pèsent sur Charlie :
reprendre ses sorts et son héros plutôt que les niveaux reste la piste. En Matou, le naïf de Pollen (90 %) sort encore de la bande par le haut, celui de Charlie (29 %) par le bas et la courbe de difficulté du naïf n'est pas décroissante (déjà le cas avant).

## Critères d'acceptation
- [ ] A : chaque entrée montre avant chaque vague un panneau avec les icônes et le nombre d'ennemis qui en sortiront
  (test : composition affichée = composition de la vague par entrée) ; la sortie est dessinée et réagit à une fuite ;
  le tracé animé part au début du niveau et respecte « réduire les animations ».
- [ ] B : écran Bestiaire (carte du monde et pause), ennemis rencontrés détaillés, autres « ??? » ; tours avec niveaux
  et spécialisations ; chiffres = données (test).
- [ ] B : fiche « Nouvel ennemi » une seule fois par ennemi (sauvegarde), pause pendant la fiche, option pour la couper.
- [ ] B : la fiche du niveau montre ses ennemis.
- [x] C : chaque région a au moins 2 ennemis inédits et en reprend au moins 1 d'une région précédente (test sur les
  plans) ; chaque nouvel ennemi a un rôle mécanique propre testé dans le moteur ; textes dans lore.md.
- [x] C : `npm run balance` sans écart aux bandes imposées (Matou et Vieux Sage restent suspendues).
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
