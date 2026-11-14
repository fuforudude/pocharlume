# DLC « Temps modernes » : la campagne jouable

Statut : livrée le 2026-11-14
Date : 2026-11-12

## Besoin
Rendre jouable le DLC « Temps modernes » dont les skins et animations sont validés (specs du 2026-11-11) : une campagne à part
où les chats sont des étudiants mobilisés et les humains les forces de l'ordre, plus dynamique que la campagne principale,
avec ses propres récompenses.

## Décisions (entretien du 2026-11-12)

### Forme et accès
- **Campagne à part**, ouverte depuis le menu principal, avec sa propre carte du monde : **3 régions de 10 niveaux**, la Fac
  (occupation, AG), la Manif (cortège, boulevards), la Préfecture (le siège final). 30 niveaux, 30 cartes neuves.
- **Ouverte à tous**, dès le départ, sans condition.
- **Sticker « DLC disponible ! »** : un autocollant penché dans un coin de chaque carte du monde de la campagne principale,
  légèrement animé ; un clic ouvre la campagne du DLC ; une petite croix le replie en simple bouton « DLC » dans la barre du
  haut (le choix est mémorisé).
- **Boss** : région 1 le commissaire (version boss agrandie), région 2 le Centaure (version boss), région 3 le préfet.
- **Modes** : comme la campagne (Chaton, Matou, Vieux Sage, puis défis Héroïque et Fer à 3 étoiles), mêmes bandes
  d'équilibrage imposées.

### Tours, ennemis, héros
- **Tours : une capacité propre par famille**, active seulement dans la campagne du DLC (les stats d'origine restent) :
  propositions à valider (les chiffres seront réglés au simulateur) :
  - Barricade (caserne) « Piquet » : les soldats encaissent moins de dégâts tant qu'ils tiennent la ligne à deux ou plus ;
  - Perchoir (tir) « Renvoi » : dissipe les nuages lacrymogènes à portée et renvoie une partie des tirs de LBD visant les
    tours voisines ;
  - Sono (magie) « Sono » : ralentit les ennemis dans une zone autour de la tour, par le son ;
  - Engin bricolé (artillerie) « Perçage » : les pavés percent les boucliers frontaux et une partie de l'armure.
- **Ennemis : rôles existants + trois mécaniques nouvelles** : chacun des 15 garde le pouvoir de l'ennemi d'origine choisi au
  dessin ; nouveaux : le **canon à eau repousse** les soldats (et les étourdit), le **tireur de LBD tire sur les tours** (les
  met hors service un court instant, comme le Fagotier mais à distance et par projectile), la **BRAV-M est un binôme** (deux
  ennemis liés : quand l'un tombe, l'autre accélère).
- **Héros : les 9 redessinés** en étudiants (les 3 dieux et leurs 6 disciples), mêmes compétences, toutes leurs animations, avec
  le même processus que les skins (poses → revue → animations → revue sur la page de revue).
- Les tours divines prennent leur apparence DLC (colleur d'affiches, voiture de tête, atelier de l'AG) ; le mégaphone est un
  tireur (spec d'animation, branchement de `spriteTireur()`).

### Dynamique
- **Événements en partie, écrits dans le niveau** : chaque niveau a une liste d'événements datés (« vague 6 : charge sur le
  chemin 2 »), toujours les mêmes, annoncés quelques secondes avant par un bandeau ; exemples : charge soudaine, nasse qui
  coupe un chemin, canon à eau qui balaie une ligne, renforts étudiants.
- **Carte qui bouge** : des événements changent le terrain en cours de partie (barricade qui tombe, chemin qui s'ouvre ou se
  ferme, cortège qui avance).
- **Foules activables** : des groupes d'étudiants placés sur la carte, qui aident le joueur si on les active ; la condition
  dépend du niveau (payer en arêtes, placer le héros dans la foule…) et l'effet aussi (ralentir les ennemis proches, envoyer
  des renforts, bloquer un passage un moment). Elles passent par le moteur et sont équilibrées.
- **Mise en scène vivante** dans le rendu : foule en décor qui scande, slogans, banderoles, fumigènes d'ambiance, musique plus
  rythmée ; elle réagit aux événements.

### Récompenses
- **Braises** aux montants des niveaux 101 à 150 (15 par première victoire, +30 aux boss, +6 pour 3 étoiles, 12 par défi).
- **Arêtes et expérience** : le niveau N du DLC rapporte comme le niveau 100+N de l'histoire (décision du 2026-11-12). Le boss
  est le niveau 10 de chaque région ; une victoire du DLC ne débloque ni région, ni infini, ni disciple de l'histoire.
- **Nouvelle monnaie : les badges**, gagnés uniquement en jouant le DLC (première victoire, étoiles, défis, boss), jamais avec de
  l'argent réel.
- **Caisse « Temps modernes »**, ouverte avec des badges, sur le modèle des caisses actuelles (raretés, garantie, doublons en
  éclats, taux affichés) : elle contient les skins de tours et de héros du DLC, **apparence seulement**, utilisables aussi dans
  la campagne principale.
- **Titres** de collection (« Fac occupée », « Préfecture tombée »…), affichés dans la collection.
- **Tranché le 2026-11-12** : les arêtes et l'expérience restent celles des niveaux 101 à 130, même pour un joueur neuf (choix assumé
  après chiffrage : 681 arêtes au niveau 1 en 3 étoiles) ; bonus de 30 braises aux seuls boss (niveaux 10, 20, 30) ; un skin du
  DLC porté dans l'histoire ne change que l'apparence (le bonus du skin de l'histoire reste) ; skins du DLC par la caisse seulement
  (doublons → éclats) ; badges : 20 par première victoire, +40 boss, +10 trois étoiles, 20 par défi (2 220 en tout), caisse à
  15 badges, garantie à la 10e caisse.

### Décisions techniques (2026-11-12)
1. **Campagne nommée** : chaque niveau porte une campagne (`histoire` ou `moderne`) et un numéro dans sa campagne ; la sauvegarde
   garde une progression par campagne (migration v8 → v9 qui ajoute celle du DLC, vide) ; l'histoire n'est pas touchée.
2. **Capacités par règle de campagne** : les tours restent les mêmes dans les données ; la campagne `moderne` active, par
   famille, une capacité décrite dans les données, testable à part ; bots, menus et bulles inchangés.
3. **Événements et carte qui bouge en liste d'événements datés** : `Niveau.evenements` (vague, type, paramètres), un module par
   type, union discriminée comme les gimmicks, déterministe ; briques réutilisables pour le Pont-Levis et la Crue.
4. **Foules dans le moteur**, avec effet et condition d'activation décrits dans les données, et une stratégie de bot.

### Règles de jeu tranchées en cours de route (2026-11-12)
- **Nasse et foule qui bloque** : les ennemis au sol qui arrivent s'arrêtent devant et attendent ; ceux déjà dedans continuent,
  les volants passent au-dessus.
- **Charge** : les chargeurs passent à travers les soldats (comme la charge du Prince Croisé).
- **Défi Fer** : tous les événements du niveau sont joués pendant la vague unique, à des moments répartis dans le temps.
- **Renvoi** : le tir de LBD renvoyé **blesse** son tireur (dégâts, sans étourdissement) ; montant réglé au simulateur.
- **Chemin fermé** : les ennemis déjà engagés finissent leur route ; les nouveaux groupes prennent le repli.
- **Foule « ralentir »** : ralentit d'un coup les ennemis présents dans le rayon à l'activation.
- **Sauvegarde** : tout le DLC (progression, badges, collection, titres, sticker) dans un bloc `moderne` à part ; les badges
  ne sont pas dans `meta.monnaies`. Les « records » sont les records d'infini par carte du DLC. La partie en cours porte sa
  campagne (champ facultatif, absent = histoire), vérifiée contre la bonne progression. Un identifiant de skin ou de titre
  inconnu est écarté à la normalisation, jamais une cause de rejet de toute la sauvegarde.
- **Chemins mobiles** : leurs cases restent toujours interdites à la construction, ouverts ou fermés (moteur et interface) ;
  il n'y a donc plus de vente d'office. En défi Fer, le délai de chaque événement est réparti sur la durée de la vague unique,
  en gardant toujours l'ordre (vague, délai) du niveau. Un niveau dont les événements ne sont pas écrits dans cet ordre est
  refusé à la validation. Quand le joueur appelle la vague suivante en avance, les événements de chemin encore en attente
  de la vague en cours se déclenchent aussitôt (avec leur annonce).
- **Sauteur et plongeur** franchissent une nasse : c'est leur force, écrite dans le Bestiaire.
- **Bestiaire par campagne** : celui ouvert depuis le DLC montre les ennemis du DLC ; celui de l'histoire est inchangé.
- **Ligne « Capacité DLC »** des fiches de tours : seulement dans les écrans du DLC.
- **Piquet** : coupé quand la caserne est en feu ou gelée ; réduit tous les dégâts (coups, nuage, drain).

### Livraison
- **Tout d'un coup** : une seule mise en ligne quand les 30 niveaux, les héros, les capacités, les événements, les foules et les
  caisses sont prêts et équilibrés. Revues intermédiaires sur la page de revue (héros, capacités, premiers niveaux).

## Critères d'acceptation
- [ ] Le menu principal et le sticker des cartes de campagne ouvrent la campagne du DLC ; le sticker se replie en bouton et le
  choix est mémorisé ; la campagne est ouverte à tous.
- [ ] La sauvegarde v9 garde une progression par campagne ; une sauvegarde v8 migre sans perte (fixture, tests).
- [ ] 30 niveaux en 3 régions, cartes neuves, boss commissaire / Centaure / préfet, lore (noms, phrases).
- [ ] Les 4 capacités de famille agissent dans le DLC et seulement dans le DLC (tests du moteur).
- [ ] Les 3 mécaniques nouvelles d'ennemis (repousse, tir sur les tours, binôme) sont testées dans le moteur.
- [ ] Événements datés et carte qui bouge : annoncés, déterministes au rejeu, testés.
- [ ] Foules activables (au moins deux conditions et deux effets), testées, jouées par les bots.
- [ ] 9 héros redessinés et animés, validés en revue.
- [ ] Badges, caisse « Temps modernes » (raretés, garantie, éclats, taux affichés), skins utilisables dans l'histoire, titres.
- [ ] `npm run balance` sans écart aux bandes imposées sur les 3 régions du DLC, toujours 0 écart ailleurs.
- [ ] QA navigateur 1280×720 et 740×360, 0 erreur en console.

## Tâches (ordre indicatif, vagues parallèles)
1. Socle : campagne nommée, sauvegarde v9, menu et sticker, carte du monde du DLC.
2. Moteur : capacités de famille, mécaniques d'ennemis (repousse, tir sur les tours, binôme), branchement des skins (atlas,
   `spriteTireur`), boss.
3. Moteur : événements datés, carte qui bouge, foules activables (+ annonces au rendu).
4. Héros : poses (revue), puis animations (revue).
5. Contenu : 30 cartes, plans de vagues, événements et foules par niveau, lore, mise en scène vivante.
6. Récompenses : badges, caisse, titres, skins dans l'histoire.
7. Bots et équilibrage des 3 régions.
8. Relecture, QA, mise en ligne.

## Impacts
- Données : campagne des niveaux, capacités de famille, ennemis DLC, événements, foules, badges, caisse ; `VERSION_DONNEES`,
  `VERSION_ETAT`.
- Sauvegarde : v9 (progression par campagne, badges, collection DLC, titres, préférence du sticker).
- Écrans : menu principal, carte du monde (sticker), carte du DLC, partie (événements, foules, mise en scène), collection,
  caisses.

## Questions ouvertes
- Chiffres des capacités, des badges et du prix de la caisse : réglés au simulateur et en revue.
- Détail des événements et des foules niveau par niveau : proposés par l'agent du contenu, validés en revue.

## Décisions après les relectures de la vague 2 (2026-11-12)
- Chaque boss du DLC (commissaire, Centaure, préfet) a sa réplique d'entrée, propre à la campagne, dans le lore.
- Dans la campagne du DLC, les 9 héros sont toujours dessinés en étudiants, comme les tours ; la caisse sert à porter ces
  apparences dans l'histoire.
- Musique plus rythmée et slogans scandés : une tâche à part, pour tout le DLC, après les 3 régions et avant la sortie.
- Un chemin mobile ouvert en cours de niveau reste ouvert assez longtemps pour qu'y construire vaille le coup (Fac : niveau 8
  ouvert jusqu'à la fin, niveau 10 ouvert dès la moitié du niveau) ; règle à suivre pour les régions 2 et 3.
- Une seule source pour la règle des badges ; l'écran de fin affiche badges et titres gagnés.
- **Charges** : la traversée des soldats et l'accélération ont deux durées distinctes. L'accélération est courte (environ 4 s) ;
  la traversée dure jusqu'au milieu du chemin. La charge du Prince Croisé (histoire) ne change pas.
- **Décor et cases de tour** : un déplacement de décor pour l'apparence ne doit pas retirer de bonnes cases de tour ; les grands
  décors se posent sur des cases sans valeur (vérifié par un test).
- **Décors de la Fac** : les grands décors qui prenaient une case de tour près d'un chemin, et ceux cachés par le fourgon,
  sont tous déplacés ; aucune liste d'exceptions (décision du 2026-11-12).
- **Boss tuables** : sur chaque niveau de boss du DLC, le boss doit pouvoir être tué ; un test vérifie que le bot le tue
  (le laisser passer en perdant des vies ne compte pas comme une vraie victoire de conception). Le boss peut demander une
  stratégie précise (ex. : le Centaure se tue en cherchant la pénétration d'armure, archers voie B, Perçage) ; le test peut
  jouer une stratégie dédiée, et le bot générique ne doit plus gagner en laissant passer le boss.
- **Scène vivante** : cortèges et figurants de décor suivent la même règle que les grands décors (cases sans valeur).
- **Fermetures de chemin** : une fermeture dure quelques vagues puis le chemin rouvre avant la fin du niveau, sur les 30 niveaux.
- **Renforts ennemis de la Préfecture** faits avec des charges (blindés qui enfoncent les lignes) : assumé, à contrer avec
  nasses et foules qui bloquent.
- **Niveau 20** : le Grand Centaure n'était tuable par aucune stratégie, faute de cases de tour le long du couloir final ; on
  ouvre des cases le long de ce couloir et sur la moitié droite, armure gardée à 0,9.
- **Scène vivante** : la règle stricte (aucune case de tour utile occupée) est gardée, même si quelques cortèges sont raccourcis.
- **Niveau 20 (suite)** : la carte n'était pas en cause (diagnostic corrigé) ; on allège la vague 15 (escorte) et on baisse les PV du
  Grand Centaure, armure gardée à 0,9 : la stratégie perce-armure doit le tuer avec les arêtes normales (test).
- **Niveau 20 (décision finale)** : après trois tentatives, la cause est l'économie des vagues 8 à 14 ; le niveau est réglé dans
  l'équilibrage global (tâche 7). Le test « le Centaure doit mourir » reste en garde-fou (`it.fails`) et bloque la sortie tant qu'il
  n'est pas passé en `it` vert.
- **Identifiants de cartes** : uniques dans tout le jeu, histoire et DLC confondus (test) ; la carte « carrefour » de la Manif est renommée.
- **Musique** : reportée (le jeu n'a aucune musique, histoire comprise) ; le DLC sort avec les slogans scandés et la scène vivante.
- **Équilibrage** : mêmes bandes que la campagne (Chaton, sans défense et défis imposés ; Matou et Vieux Sage affichés, suspendus
  comme pour l'histoire). « Victoire implique boss tué » doit tenir sur toutes les graines d'évaluation, pas seulement une.
- **Boss du DLC qui passe** : il coûte 20 vies (donnée des 3 boss du DLC ; ceux de l'histoire inchangés) : le laisser passer en
  Matou est une défaite. **Niveau 20** : 24 000 arêtes de départ, assumé comme un siège et annoncé dans la fiche du niveau.
- **Écarts suspendus** (Matou de la Manif, écart entre dieux en Vieux Sage) : acceptés pour la sortie ; l'équilibrage des dieux est
  une tâche à part, pour tout le jeu.
- **Tests lourds** : les tests de boss sur toutes les graines et zone-ordinaires sortent de la suite habituelle (passe d'équilibrage
  et job distant) ; la suite habituelle garde une version rapide. La vérification avant sortie lance les deux.
- **Import d'un code sans DLC** : le bloc DLC de l'appareil est gardé (aucune perte silencieuse) ; un code qui en contient un le remplace.
- **`moderne.records`** : réservé (le DLC n'a pas de mode infini pour l'instant).
- **Après la mise en ligne, jamais de retour en arrière par revert** : l'ancien client efface une sauvegarde v9. On corrige en avant ;
  pour retirer le DLC en urgence, on garde `VERSION_SAUVEGARDE = 9` et on cache les entrées.
- **Animations des 9 héros** : revue visuelle par l'étudiant avant la sortie.

## Écarts à la livraison (2026-11-14)
- Musique plus rythmée : reportée (le jeu n'a pas encore de musique).
- Bandes Matou et Vieux Sage : suspendues comme pour l'histoire ; l'écart entre dieux en Vieux Sage est une tâche à part.
- `moderne.records` réservé (pas de mode infini dans le DLC).
- Niveau 20 : 24 000 arêtes de départ (siège assumé).
- Décision structurante consignée dans `docs/adr/0002-campagnes-nommees-et-sauvegarde-v9.md`.
