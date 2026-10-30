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

## Critères d'acceptation
- [ ] Moteur : poser une seconde tour divine est refusé (raison `une_seule_divine`), même dieu ou non ; après vente, la
  pose redevient possible. Coût 400 pour les trois dieux. Tests du moteur.
- [ ] Le menu de construction affiche la tour divine refusée avec la raison quand une est déjà posée.
- [ ] Bots et bandes : `npm run balance` sans écart aux bandes imposées ; le rapport d'équilibrage note l'effet.
- [ ] Aucun texte affiché ne dit plus « point(s) » pour les héros ; « XP » à la place (test sur `fr`).
- [x] Survol (PC) et appui long (tactile) ouvrent une bulle sur : élément du menu de construction (tour, amélioration,
  divine), ennemi en partie, portrait du héros en partie, compétence sur l'écran des héros, ennemi et tour de la collection
  et de la fiche d'un niveau. Tests de l'interaction (délais, appui long sans action, toucher court inchangé).
  (Collection : tours des skins et des porteurs, la collection n'a pas d'ennemis. Fiche : le boss annoncé ; l'encadré
  « Nouvelles découvertes » se branche à la fusion avec `attacherBulleTour` ou `data-bulle-tour` + `brancherBulles`.)
- [x] Les chiffres d'une bulle sont ceux des données (test : PV, dégâts, portée d'un ennemi et d'une tour).
- [x] La bulle reste entièrement à l'écran (bords, 740×360 et 1280×720) et ne bloque pas le jeu.

## Tâches
1. Tour divine unique et coût 400 (moteur, données, menu, bots), rééquilibrage vérifié.
2. Renommage « XP » des héros.
3. Composant de bulle commun (survol / appui long) et contenu tiré des données, branché aux quatre endroits.
4. Relecture, QA au navigateur (PC et téléphone).

## Impacts
- Données : coût des tours divines ; `VERSION_DONNEES` si une partie en cours peut contenir deux tours divines.
- Écrans : menu de construction, partie, héros, collection, fiche de niveau.

## Questions ouvertes
- Aucune.
