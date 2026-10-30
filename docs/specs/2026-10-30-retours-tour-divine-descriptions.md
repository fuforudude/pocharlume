# Retours du 2026-10-30 : une seule tour divine, « XP » des héros, descriptions au survol

Statut : validée le 2026-10-30
Date : 2026-10-30

## Besoin
En jouant, l'utilisateur a gagné le niveau 3 en Vieux Sage en ne posant que des tours divines de l'Ombre : à 200 arêtes,
c'est le prix d'une tour de base, et rien n'empêche d'en aligner. Il veut aussi que les points à placer des héros
s'appellent « XP », et pouvoir lire ce que fait chaque chose du jeu sans avoir à deviner : survol à la souris sur PC,
appui long sur téléphone.

## Décisions (entretien du 2026-10-30)
- Tour divine : **une seule par partie**, et son coût passe à **400 arêtes** (les trois dieux). Une fois posée, son
  emplacement dans le menu reste visible mais refusé, avec la raison. Si elle est vendue, on peut la reposer. Règle dans
  le moteur, testée, jouée de la même façon par les bots.
- Héros : simple renommage. Les « points à placer » s'appellent « XP » partout à l'écran (« XP à placer : 3 »,
  « Reprendre l'XP », messages de refus…). Le système ne change pas.
- Descriptions : sur PC au survol (après un court délai, ~350 ms), sur téléphone à l'appui long (~450 ms). Un appui long
  n'exécute jamais l'action du bouton ; un toucher court garde son effet actuel. La bulle se ferme en quittant l'élément
  (PC) ou au prochain toucher (téléphone). En partie, le jeu ne se met pas en pause.
- Endroits :
  1. Menu de construction : chaque tour (rôle, dégâts, cadence, portée, cibles volantes ou non, soldats, pouvoir) et
     chaque amélioration (ce qui change, avant → après ; pour une branche, son pouvoir) ; la tour divine aussi.
  2. Ennemis en partie : nom, PV, armure, résistance magique, vitesse, particularités (volant, furtif, boss, soigneur…),
     la phrase de lore existante (`ennemi.<id>.desc`).
  3. Héros : le portrait en partie et l'écran des héros (rôle, compétences et ce qu'elles font au rang actuel et suivant).
  4. Collection et fiche d'un niveau : les ennemis et les tours qui y apparaissent.
- Les chiffres viennent des données (jamais recopiés à la main dans les textes) ; les tournures sont en français, claires,
  non cryptiques. Le lore reste dans `docs/lore.md` (aucun nouveau texte de lore requis).

## Déblocage progressif (ajouté le 2026-10-30)
Ce qu'on peut construire dépend du **niveau joué** : une fonction pure du numéro de niveau, jamais de la sauvegarde
(« rythme du niveau » : rejouer le niveau 2, même en défi Héroïque ou Fer, limite toujours aux tours du niveau 2).
- Niveau 1 : les 4 tours communes, au niveau 1 seulement.
- Niveau 2 : + niveau 2 de la caserne (Grenier des Griffes) et des archers.
- Niveau 3 (horde) : + niveau 2 de la magie et de l'artillerie.
- Niveau 4 : + niveau 3 de la caserne et des archers. Niveau 5 : + niveau 3 de la magie et de l'artillerie.
- Niveaux 6, 7, 8, 9 : les deux spécialisations (niveau 4, A et B) d'une famille par niveau, dans l'ordre caserne,
  archers, magie, artillerie (les compétences d'une spécialisation viennent avec elle).
- Niveau 10 (boss de la région 1) : + la tour divine. À partir du niveau 11, tout est ouvert ; le mode infini aussi.
- Moteur : construire ou améliorer vers un élément non débloqué est refusé (raison `non_debloque`). La liste vient du
  numéro du niveau : le déterminisme et le rejeu tiennent. Les bots respectent la règle.
- Menu de construction : un élément non débloqué apparaît avec un cadenas et la raison « Se débloque au niveau N ».
- Fiche du niveau (carte du monde, avant « Lancer ») : un encadré « Nouvelles découvertes » liste ce que ce niveau
  débloque (icône, nom, une ligne tirée des données sur ce que ça apporte) ; absent s'il n'y a rien de neuf. Pas de
  fenêtre en partie. Chaque élément porte une classe et des data-attributs (id de la tour, niveau) pour y brancher les
  bulles de description.
- Rééquilibrage : les niveaux 1 à 9 se jouent avec moins d'outils ; les bandes imposées (Chaton, héros seul, défis
  40–90 %) doivent tenir. Rapport avant/après des niveaux 1 à 10.

## Critères d'acceptation
- [x] Moteur : poser une seconde tour divine est refusé (raison `une_seule_divine`), même dieu ou non ; après vente, la
  pose redevient possible. Coût 400 pour les trois dieux. Tests du moteur.
- [x] Le menu de construction affiche la tour divine refusée avec la raison quand une est déjà posée.
- [x] Bots et bandes : `npm run balance` sans écart aux bandes imposées ; le rapport d'équilibrage note l'effet.
- [x] Aucun texte affiché ne dit plus « point(s) » pour les héros ; « XP » à la place (test sur `fr`).
- [x] Survol (PC) et appui long (tactile) ouvrent une bulle sur : élément du menu de construction (tour, amélioration,
  divine), ennemi en partie, portrait du héros en partie, compétence sur l'écran des héros, ennemi et tour de la collection
  et de la fiche d'un niveau. Tests de l'interaction (délais, appui long sans action, toucher court inchangé).
  (Collection : tours des skins et des porteurs, la collection n'a pas d'ennemis. Fiche : le boss annoncé et les éléments
  de l'encadré « Nouvelles découvertes ».)
- [x] Les chiffres d'une bulle sont ceux des données (test : PV, dégâts, portée d'un ennemi et d'une tour).
- [x] La bulle reste entièrement à l'écran (bords, 740×360 et 1280×720) et ne bloque pas le jeu.
- [x] Déblocage : le moteur refuse (`non_debloque`) de construire, d'améliorer ou de spécialiser vers un élément que le
  niveau joué n'a pas encore débloqué, d'après son seul numéro (défis compris) ; tout est ouvert dès le niveau 11 et en
  infini. Tests du moteur.
- [x] Le menu de construction montre un élément non débloqué avec un cadenas et « Se débloque au niveau N ».
- [x] La fiche d'un niveau liste ses « Nouvelles découvertes » (icône, nom, apport tiré des données), et rien quand le
  niveau n'apporte rien de neuf.
- [x] Bots et bandes : `npm run balance` sans écart aux bandes imposées avec le déblocage ; rapport avant/après des
  niveaux 1 à 10.

## Équilibrage après les tâches 1 et 5 (`npm run balance` du 2026-10-30, version des données 13)
0 écart aux bandes imposées (Chaton, sans défense, défis 40–90 % des dix régions, infini) ; les bandes suspendues de Matou et de
Vieux Sage restent suspendues (15 écarts en région 1 contre 13 avant, mêmes natures). Aucun chiffre de tour ordinaire n'a été touché.
- **Constat** : la règle « une seule tour divine » existait déjà dans le moteur depuis le jalon 1 (`tour_divine_unique`, renommée
  `une_seule_divine`) ; ce qui rendait le Sanctuaire si fort était son prix (200, celui d'une tour de base) et sa disponibilité
  dès le niveau 1. À 400 et au niveau 10, le soigneux ne la pose plus que sur 10 % des parties de la région 1 (le niveau 10),
  contre 48 à 88 % avant ; son gain mesuré (avec / sans) reste nul en victoires (±0,3 vie).
- **Niveaux 1 à 10, soigneux (trois dieux, 30 parties par niveau)** : victoires inchangées en Matou (30/30 partout) ; en Vieux Sage
  30/30 partout sauf le niveau 4 (29/30, comme avant), le niveau 5 passe de 29/30 à 30/30. Vies moyennes du soigneux en Vieux
  Sage : 14,9 → 15,0 ; 13,6 → 14,5 ; 15,0 → 15,0 ; 12,7 → 13,2 ; 10,7 → 12,0 ; 14,8 → 15,0 ; 13,5 → 13,8 ; 14,6 → 14,6 ;
  14,8 → 15,0 ; 15,0 → 14,4. Le naïf (Matou, moyenne des dieux) ne bouge qu'aux niveaux 1 et 2 (10,4 → 10,9 ; 7,9 → 8,5 vies) :
  il améliorait peu de toute façon. Moins d'outils ne rend donc pas la région 1 plus dure pour les bots ; la tour divine à
  200 arêtes coûtait autant qu'elle rapportait au soigneux.
- **Défis** : Héroïque de la région 1 86 % → 82 %, Fer 87 % → 87 %. La tour divine plus chère baisse l'Héroïque ailleurs
  (région 4 : 85 % → 67 %, région 7 : 66 % → 57 %, région 9 : 55 % → 49 %, région 8 : 89 % → 85 %), tout en restant dans la bande.
- **Régions 2 à 10 (bandes suspendues, à surveiller)** : la tour divine à 400 affaiblit surtout Charlie et Pollen en Vieux Sage
  (victoires du soigneux, Charlie : région 5 56 % → 40 %, région 6 42 % → 23 %, région 10 42 % → 26 % ; Pollen : région 8 95 % →
  81 %, région 9 28 % → 13 %), Plume bouge peu (−5 points au plus) : l'écart entre dieux en Vieux Sage se creuse. Matou bouge peu
  (Charlie région 6 : 100 % → 91 %). Écarts aux bandes suspendues, régions 1 à 10 : 152 avant, 145 après. Rien n'est corrigé ici :
  ces bandes sont suspendues et la consigne était de ne toucher ni aux tours ordinaires ni à la règle.
- Le rapport (`balance-report.md`) a une section générée « Déblocage progressif des tours » et dit, sous « Tours divines », la règle
  et le prix.

## Tâches
1. Tour divine unique et coût 400 (moteur, données, menu, bots), rééquilibrage vérifié.
2. Renommage « XP » des héros.
3. Composant de bulle commun (survol / appui long) et contenu tiré des données, branché aux quatre endroits.
4. Relecture, QA au navigateur (PC et téléphone).
5. Déblocage progressif des tours (moteur, données, menu, fiche du niveau, bots), rééquilibrage commun avec la tâche 1.

## Impacts
- Données : coût des tours divines ; `VERSION_DONNEES` si une partie en cours peut contenir deux tours divines.
- Écrans : menu de construction, partie, héros, collection, fiche de niveau.
- Déblocage : table dans `src/data/`, numéro du niveau porté par le niveau ; `VERSION_DONNEES` + 1.

## Questions ouvertes
- Aucune.
