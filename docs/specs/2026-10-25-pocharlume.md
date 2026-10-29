# Pocharlume : tower defense de chats

Statut : en cours (jalon 1 livré le 2026-10-25, jalon 2 le 2026-10-28, jalon 3 le 2026-10-29)
Date : 2026-10-25

## Besoin
Un joueur sur téléphone (et dans un navigateur) défend les derniers chats d'un monde médiéval horrible
(bûchers de sorcières, famines, peste) dans un tower defense façon Kingdom Rush : une campagne de 100 niveaux, un mode
infini et un mode roguelike, avec trois dieux-chats qui servent de classes. Hors ligne d'abord, publiable plus tard
sur le Play Store.

## Univers (ton : entièrement sombre)
C'est l'**An de la Grande Mort**. L'Église du **Soleil Blême** a déclaré les chats serviteurs des sorcières :
on les brûle avec elles sur les bûchers, on les mange quand la famine vient, on les jette au puits pour conjurer la
peste. Et plus les chats meurent, plus les rats prolifèrent, et plus la peste tue. Personne ne fait le lien.

Bien avant l'Église, trois **Chats Suprêmes** étaient priés dans les granges et les cryptes. Ils ont brûlé sur le
**Premier Bûcher**, et il ne reste d'eux que des braises. Le joueur est **le Dernier Veilleur**, un chat sans nom
qui ranime ces braises et rassemble les survivants, région après région, jusqu'à la cathédrale où le Soleil Blême
attend.

- **Plume**, la Dame des Ombres : chat noire, rapide et furtive. Elle a vendu son reflet pour que les chasseurs ne
  la voient plus jamais.
- **Charlie**, le Colosse : bête et puissant. Il a tenu seul la porte du dernier refuge pendant neuf nuits contre
  les torches, et n'a jamais compris pourquoi il devait s'arrêter.
- **Pollen**, Trois-Pattes : chat tigré ingénieux. Il a laissé sa patte dans un piège à loup des chasseurs de
  sorcières. Les pièges qu'il a construits ensuite ont mieux marché.

Les textes sont courts et cryptiques : descriptions d'objets, inscriptions sur les autels, paroles des dieux avant
chaque boss. Rien n'est drôle. La violence est suggérée (fumée, silhouettes, cendres) et jamais montrée en gros
plan, pour rester publiable sur le Play Store (classement PEGI 12 visé).

## Décisions de l'entretien
- Projet neuf : dépôt `../Pocharlume`, dépôt GitHub privé, version navigateur sur GitHub Pages.
- TypeScript strict, Vite, rendu Canvas 2D maison, aucune dépendance de jeu. Simulation déterministe séparée
  du rendu (pas fixe de 1/30 s, nombres pseudo-aléatoires à graine), pour qu'un serveur puisse la rejouer plus
  tard. Appli Android via Capacitor au jalon 5.
- Hors ligne en V1 : aucune requête réseau en partie. La sauvegarde passe par une couche de stockage unique
  (IndexedDB, puis Preferences de Capacitor sur Android), versionnée, avec migrations de format, export et import
  par code. La synchronisation cloud et le classement en ligne viendront plus tard sans toucher au moteur.
- Monnaies gagnées en jeu seulement. Rien de payant en V1, mais la boutique est prévue pour accueillir plus tard
  des achats Play Store.
- Français seul en V1, mais tous les textes passent par `t('clé')` (fichier `src/i18n/fr.ts`).
- Paysage sur téléphone, cartes en 16:9, zoom à deux doigts et glisser pour déplacer la caméra. Les menus hors
  partie marchent aussi en portrait.
- Souris et doigt font tout. Raccourcis clavier en plus : `1`–`5` tours, `Q` `W` sorts, `A` `Z` `R` objets
  emportés, `E` héros, `Espace` vague suivante, `P` pause, `F` vitesse.
- Pause automatique quand l'appli perd le focus. L'état est sauvegardé au début de chaque vague, et après une
  fermeture le jeu propose « Reprendre à la vague N ».
- Son : packs libres de droits (CC0, Kenney ou OpenGameArt) avec un fichier `CREDITS.md`. Chaque téléchargement
  est validé par l'utilisateur.
- Cible : Android milieu de gamme 2020, 60 images/s avec 150 ennemis à l'écran, premier chargement sous 3 Mo.
- Livraison en 5 jalons jouables.

## Graphismes
- Patte du pack Minifolks : pixel art en cadres de 32×32, contour sombre d'un pixel, peu de couleurs par
  personnage, une ligne de planche par animation (repos, marche, attaque, blessé, mort).
- Exceptions aux cadres de 32×32, actées au jalon 1 : les tours hautes (tour de tir, totem) font 32×48, et les boss
  64×64 (un boss est deux fois plus grand qu'un ennemi courant). Les ancres restent au pied du sprite.
- Les 12 humains du pack (épéiste, lancier, hallebardier, porte-bouclier, archer, arbalétrier, mage, archimage,
  cavalier, homme à cheval, prince, roi) servent de base aux ennemis : un script les découpe, les recolore par
  palette (bure d'inquisiteur, haillons de pestiféré, tabard du Soleil Blême) et applique des retouches en grille
  (capuches, masques de peste, torches, fourches). La planche de projectiles du pack est réutilisée. Les fichiers
  d'origine restent dans `art/minifolks/`. **À vérifier avant le jalon 5** : la licence du pack autorise la
  modification et un usage commercial.
- Je dessine tout le reste (chats, rats, corbeaux, chiens, boss, tuiles). Chaque sprite est une grille de pixels en texte versionnée
  (`art/sprites/<nom>.txt`, une lettre par couleur de palette, cadres séparés). Un script `npm run art` les assemble
  en planches PNG et en atlas JSON, avec et sans contour. On corrige donc un pixel par un diff lisible.
- Affichage en pixels entiers (zoom ×2, ×3 ou ×4 selon l'écran, sans lissage). Les cartes sont faites de tuiles
  16×16 dessinées de la même façon.

## Contenu

### Tours communes (4)
Trois niveaux, puis deux spécialisations au niveau 4, au choix. Chaque spécialisation a 2 compétences
améliorables. Les familles servent aux bonus des dieux.

| Famille | Niv. 1–3 | Spécialisation A | Spécialisation B |
| --- | --- | --- | --- |
| Caserne | Grenier des Griffes : 3 chats de grange bloquent le chemin | Garde du Cloître : chats en cotte de mailles, provocation | Écorcheurs : 2 lames, saignement |
| Tir | Clocher des Archers : tir physique, touche les volants | Guetteurs des Toits : flèches empoisonnées, révèlent les furtifs | Arbalétriers du Beffroi : très longue portée, coup critique |
| Magie | Autel des Cendres : dégâts magiques, ignorent l'armure | Oracle de la Braise : rayon qui consume (dégâts purs) | Nécromancien des Neuf Vies : relève les chats tombés en spectres |
| Artillerie | Catapulte du Rempart : dégâts de zone, pas les volants | Mortier de Soufre : grande zone, brûlure | Baliste à Chaînes : chaînes qui ralentissent et enchaînent |

### Les dieux (classes)
Avant un niveau, on choisit un dieu. Il donne son héros-avatar (ou l'un de ses disciples), ses 2 sorts, un bonus
de famille et sa tour divine (5e tour, un exemplaire par carte au maximum).

| | Plume | Charlie | Pollen |
| --- | --- | --- | --- |
| Bonus de famille | Tir : +15 % cadence, +10 % critique | Caserne : +25 % PV soldats, coups étourdissants | Artillerie : −15 % prix, +1 piège à la pose |
| Sort 1 | Voile de Nuit : zone où les ennemis ralentissent et les tours font des critiques | Chute du Colosse : impact de zone, étourdit | Pièges à Ressort : pose 3 pièges sur le chemin |
| Sort 2 | Griffes d'Ombre : tue net les ennemis non-boss d'une petite zone | Renforts : 2 gros matous bloquent le chemin | Ingéniosité : +arêtes, tours voisines boostées 10 s |
| Tour divine | Sanctuaire de l'Ombre : assassins invisibles, exécution sous 15 % PV | Totem du Colosse : onde de choc périodique, étourdit | Atelier Boiteux : construit des tourelles et des pièges autour de lui |
| Avatar | Plume, l'Ombre Première | Charlie, le Colosse | Pollen, Trois-Pattes |
| Disciples | Suie (assassin), Corbeau (tireur) | Mastoc (tank), Brise-Os (berserker) | Rouage (ingénieur), Lanterne (soigneur) |

Héros : on le touche puis on touche un point du chemin pour le déplacer. Il réapparaît 15 s après sa mort.
Niveaux 1 à 10 par expérience gagnée en partie et gardée entre les niveaux. Chaque niveau donne un point de
compétence, à placer dans 4 compétences de 3 rangs.

### Ennemis : les persécuteurs, la faim et la peste
Attributs : PV, vitesse, armure physique (0 / 30 / 60 / 90 %), résistance magique (mêmes paliers), volant, furtif
(seulement visible des tours qui révèlent), attaque à distance, dégâts au corps-à-corps, coût en vies, prime en
arêtes. Entre parenthèses, la base Minifolks recolorée, ou « dessiné » pour un sprite neuf.

| Région | Thème | Ennemis | Boss (niveau 10) |
| --- | --- | --- | --- |
| 1 | Le Village Affamé | Paysan Affamé (épéiste, fourche), Mendiant (lancier, rapide et fragile), Chien Errant (dessiné, rapide) | Le Boucher de Vaudrelle (porte-bouclier agrandi), qui mange les chats |
| 2 | Les Champs Brûlés | Glaneur (archer, tire sur les soldats), Corbeau (dessiné, volant), Épouvantail (dessiné, se relève une fois) | La Faim, géante émaciée (dessinée) |
| 3 | Le Bourg des Bûchers | Porteur de Torche (lancier, brûle les soldats), Chasseur de Sorcières (arbalétrier, armure moyenne), Délateur (archer, furtif) | Le Juge des Flammes (archimage) |
| 4 | Les Marais de l'Ordalie | Noyeur (hallebardier, entraîne les soldats sous l'eau), Pèlerin Voilé (mage, résistance magique), Sangsue (dessinée, essaim) | La Dame du Puits (dessinée) |
| 5 | La Ville Pestiférée | Rat de Peste (dessiné, essaim très rapide), Pestiféré (épéiste, laisse un nuage toxique en mourant), Médecin de Peste (mage, soigne les ennemis) | La Mère des Rats (dessinée) |
| 6 | Le Charnier | Fossoyeur (hallebardier, enterre les soldats tués), Creux (épéiste décharné, se relève), Chauve-Souris (dessinée, volante) | Le Roi des Fosses (roi décharné) |
| 7 | La Croisade | Fantassin (épéiste, armure), Porte-Bannière (porte-bouclier, aura de vitesse), Cavalier (cavalier, très rapide, blindé) | Le Prince Croisé (prince à cheval) |
| 8 | Le Monastère Noir | Flagellant (épéiste, se renforce en perdant des PV), Inquisiteur (mage, fige une tour), Exorciste (archimage, bannit les spectres et les héros) | Le Grand Inquisiteur |
| 9 | La Cité du Roi | Garde Royal (porte-bouclier, très blindé), Arbalétrier d'Élite (arbalétrier, longue portée), Chevalier (homme à cheval, blindé et rapide) | Le Roi Fou (roi) |
| 10 | La Cathédrale du Soleil Blême | Acolyte de Cendre (mage, invoque), Ange de Cendre (dessiné, volant, résistant) | Le Soleil Blême (dessiné), le dieu de l'Église |

Les ennemis des régions précédentes reviennent ensuite, mélangés. Les régions 2 à 10 ajoutent une version
d'élite par ennemi.

### Campagne
- 10 régions de 10 niveaux. Chaque région a 3 à 4 cartes dessinées à la main, réutilisées avec d'autres entrées,
  vagues et règles. Le niveau 10 de chaque région est un boss.
- Carte du monde par région, chemin qui relie les niveaux, niveau suivant débloqué à la victoire.
- Difficultés **Chaton**, **Matou** et **Vieux Sage**, choisies au lancement. Étoiles : 3 si aucune vie perdue
  (même si l'Herbe de Sabbat les a rendues), 2 si au moins la moitié des vies, 1 sinon. On garde le meilleur résultat par niveau (300 étoiles en tout).
- Après 3 étoiles sur un niveau, deux défis s'ouvrent : **Héroïque** (1 vie, vagues d'élite) et **Fer** (une
  énorme vague, 2 tours imposées, bonus de caisses désactivés). Chacun rapporte des braises une fois.

### Mode infini
Ouvert à la fin de la région 1. On choisit une carte déjà terminée. Les vagues montent sans fin selon la formule
d'équilibrage, avec un mini-boss toutes les 10 vagues. Le record est gardé par carte, et chaque palier
(10, 20, 30, 50, 75, 100) rapporte des arêtes et des braises une fois.

### Mode roguelike
Ouvert à la fin de la région 3. Une course de 3 actes de 5 batailles, sur un chemin à embranchements : combat,
élite, autel (bénédiction), marchand, repos (rend des vies). Après chaque combat, on choisit 1 bénédiction parmi 3
(reliques des dieux, par exemple « les soldats explosent en mourant » ou « +1 cible par tir »). Les vies se gardent
d'une bataille à l'autre, et la course s'arrête à 0. Les braises gagnées débloquent de nouvelles reliques dans le
lot qu'on peut tirer.

### Économie et boutique
- **Arêtes** : gagnées à chaque niveau, palier ou course. Elles achètent les objets consommables.
- **Étoiles** : gagnées en campagne. Elles achètent l'**arbre d'améliorations** (par famille de tours, par sort,
  et pour le héros), réinitialisable gratuitement.
- **Braises** : boss, défis, paliers de l'infini et roguelike. Elles achètent les disciples et les caisses.
- **Disciples** : 6, achetés en braises ou offerts à des paliers de la campagne (fin des régions 2, 4, 6, 8).
- **Objets consommables** : Fiole de Soufre, Herbe de Sabbat (rend 5 vies), Griffe de Renfort, Sablier (gèle
  tout 5 s). 3 emplacements par partie.
- **Caisses** : caisse de skins (tours et héros) et caisse de familiers (un familier suit son héros). Payées en
  braises, 5 raretés aux chances affichées, un Épique ou mieux garanti toutes les 10 caisses. Un doublon donne des
  éclats. Les éclats montent un objet (5 rangs) ou achètent un objet précis.
  - Bonus minuscules : un skin donne de +1 % (Commun) à +5 % (Mythique) sur une stat de sa tour ou de son héros,
    un familier de +1 à +4 % sur son héros. Un skin porté par tour, un familier par héros, au plus +10 % au total
    par tour ou héros. Les bonus sont désactivés dans les défis Fer.

## Système d'équilibrage
- Toutes les valeurs sont dans des tables (`src/data/`) : tours, ennemis, vagues, régions, économie. Aucune valeur
  en dur ailleurs.
- Mesures calculées : **puissance** d'une tour = DPS efficace × portée ÷ coût cumulé, avec un DPS efficace
  par type d'armure. **Menace** d'un ennemi = PV ÷ (1 − armure ou résistance moyenne) × facteur de vitesse ×
  coût en vies.
- Vagues : budget de menace par vague, b(L, w), qui croît avec le niveau L et la vague w. Le générateur remplit le
  budget avec les ennemis débloqués de la région. Les vagues de la campagne sont générées une fois puis figées dans
  `src/data/levels/` (relues et retouchables à la main). Celles de l'infini sont générées à la volée avec la
  même formule.
- Revenus attendus : l'or gagné par vague suit une courbe cible. L'outil vérifie qu'on peut acheter de quoi tenir.
- **Simulateur** (`npm run balance`) : il rejoue chaque niveau sans affichage avec des bots aux stratégies fixées
  (bot « soigneux », placement optimisé par recherche ; bot « naïf », placement pseudo-aléatoire raisonnable),
  pour chaque difficulté. Il produit `balance-report.md` (taux de victoire, vies restantes, or inutilisé, vague la
  plus meurtrière, tour la plus et la moins choisie) et un test Vitest échoue si un niveau sort de sa bande cible :
  - Chaton : le bot naïf gagne 100 % des niveaux.
  - Matou : le bot soigneux gagne 100 % des niveaux, mais perd au moins une vie (en moyenne sur les graines) sur au
    moins la moitié des niveaux, et laisse moins de 250 arêtes inutilisées en fin de chaque niveau (moyenne sur les
    graines) ; le bot naïf gagne entre 30 et 70 % des niveaux.
  - Vieux Sage : le bot soigneux gagne entre 60 et 85 % des niveaux, sans aucun bonus de caisse ni amélioration
    au-delà de ce que la progression attendue permet à ce niveau.
  - Courbe de difficulté en Matou : les vies restantes du bot naïf baissent avec le niveau (corrélation de rang de
    Spearman d'au plus −0,6) et le niveau 10 est parmi les 3 plus durs.
  - Sans défense (héros seul), on perd tous les niveaux (sauf le niveau 1 en Chaton, qui sert d'introduction).
  - Le bot soigneux lit la composition des vagues futures, ce qu'un joueur ne voit pas : il est un peu optimiste. Un
    joueur humain compétent est supposé se comporter à peu près comme lui.
  - Aucune tour commune n'a une puissance hors de ±15 % de la moyenne de son palier de coût.

## Périmètre
- Dedans : tout ce qui précède, livré en 5 jalons.
- Hors périmètre (versions suivantes) : synchronisation cloud, classements en ligne, rejeu serveur, achats
  réels, publicité, traduction anglaise, publication sur l'App Store iOS.

## Jalons et critères d'acceptation

### Jalon 1 : le socle jouable
- [x] `npm run dev` ouvre le jeu. `npm run build` produit un site statique de moins de 3 Mo, sans erreur
  TypeScript (strict).
- [x] `npm test` passe : tests du moteur (déterminisme : même graine et mêmes actions donnent le même état final,
  octet pour octet), de la sauvegarde (migration d'une sauvegarde v1), et de l'équilibrage de la région 1.
- [x] Les 4 tours communes se construisent sur les socles, s'améliorent jusqu'au niveau 3, puis choisissent une
  spécialisation, et se revendent à 70 % de leur coût total.
- [x] Les 10 niveaux de la région 1 et les 3 ennemis de la région plus son boss sont jouables. Victoire et défaite
  affichent un écran de fin. La victoire donne 1 à 3 étoiles selon la règle des vies.
- [x] Le dieu Charlie est jouable : héros déplaçable au doigt et à la souris, 2 sorts rechargeables, bonus de
  caserne, Totem du Colosse.
- [x] Les sprites des 4 tours (3 niveaux et 2 spécialisations), de Charlie, des 4 ennemis et des tuiles de la
  région 1 viennent de `npm run art`, en cadres de 32×32 (16×16 pour les tuiles).
- [x] Sur un téléphone en paysage : socles et boutons d'au moins 44 px, zoom à deux doigts et glisser de la
  caméra. Pause au passage en arrière-plan. Après une fermeture, « Reprendre à la vague N ».
- [x] Vitesse ×1/×2, pause, raccourcis clavier listés plus haut.
- [x] La progression (niveaux, étoiles) survit à un rechargement. L'export produit un code, et l'import de ce code
  sur un profil vide redonne la même progression.
- [x] `npm run balance` produit `balance-report.md` pour la région 1, et le test des bandes passe.
- [x] 60 images/s mesurées dans les outils de performance de Chrome (processeur ralenti ×4) avec 150 ennemis.

Écarts à la livraison du jalon 1 : les 60 images/s sont mesurées sur Chrome de bureau avec processeur ralenti ×4 (environ 140 i/s), pas encore sur un vrai téléphone Android ; Matou et Vieux Sage ont été durcis après la QA (bandes revues dans « Système d'équilibrage »).

### Jalon 2 : les trois dieux et la boutique
- [x] Plume et Pollen jouables (héros, sorts, bonus, tour divine). Choix du dieu et du héros avant un niveau.
- [x] 6 disciples, expérience et compétences des héros.
- [x] Arbre d'améliorations en étoiles (réinitialisable : toutes les étoiles reviennent), arêtes, braises,
  objets consommables (3 emplacements).
- [x] Trois difficultés sélectionnables, avec leurs bandes vérifiées par le simulateur.
- [x] Bruitages CC0 intégrés, réglages son, `CREDITS.md`.

Écarts à la livraison du jalon 2 : l'écoute réelle des bruitages n'est pas vérifiée (sons choisis sans écoute) ; la courbe de difficulté du bot naïf en Matou est jugée sur la moyenne des dieux (le boss du niveau 10 gêne les héros de mêlée plus que Pollen) ; la progression (arbre, niveaux de héros) a été divisée pour ne pas rendre Vieux Sage trivial, un rang ne vaut donc que quelques points ; chaque première victoire de niveau rapporte 5 braises, soit 80 au plus et 2 disciples avec la région 1 ; l'abandon ne rapporte rien.

### Jalon 3 : régions 2 à 5, caisses, défis
- [x] 40 niveaux de plus, avec leurs ennemis, élites et boss, et des tests d'équilibrage qui passent.
- [x] Caisses de skins et de familiers : chances affichées égales à celles du tirage (test sur 100 000 tirages,
  écart < 0,5 point), garantie de 10, éclats, rangs, plafond de +10 % vérifié par un test.
- [x] Défis Héroïque et Fer sur chaque niveau à 3 étoiles. Bonus de caisses désactivés en Fer.

Écarts à la livraison du jalon 3 : les bandes Matou et Vieux Sage (et la courbe de difficulté, l'écart entre dieux) sont
suspendues, calculées et listées mais non bloquantes ; elles ne sont pas tenues, surtout pour Charlie en Vieux Sage aux
régions 2 à 5 (8 à 52 % de victoires du bot soigneux contre 70 à 96 % pour Plume) : piste, retravailler les héros et
sorts de Charlie et de Pollen, décision laissée à l'utilisateur. Élites adoucies (PV ×1,4, aucune vie en plus) ; défis
avec arêtes de départ ×3 (Héroïque) et ×6 (Fer), vague du Fer à ×0,3 des effectifs ; portée de ralliement de la caserne
et du Sanctuaire à 3,5 tuiles. Les sols sont redessinés mais sans planche « avant » conservée. Pas d'essai sur un vrai
écran tactile.

### Jalon 4 : régions 6 à 10 et mode infini
- [ ] Les 100 niveaux jouables. Le simulateur vérifie les 100 niveaux dans les 3 difficultés.
- [ ] Mode infini : record par carte, mini-boss toutes les 10 vagues, paliers payés une seule fois.

### Jalon 5 : roguelike, finitions, Android
- [ ] Mode roguelike complet (carte à embranchements, bénédictions, marchand, repos, reliques à débloquer).
- [ ] Musique d'ambiance CC0 par région.
- [ ] Appli Android (Capacitor) qui s'installe, tourne hors ligne et garde la sauvegarde entre deux lancements.

## Tâches du jalon 1
(Les jalons suivants seront découpés au moment de les lancer.)
1. Squelette : Vite + TypeScript strict + Vitest + ESLint, `CLAUDE.md`, ADR 0001 (stack, déterminisme,
   Capacitor), workflow GitHub Pages.
2. Moteur déterministe (`src/engine/`) : boucle à pas fixe, graine, chemins, déplacement des ennemis, tours,
   projectiles, soldats et blocage, types de dégâts et armure, vagues, vies et or. Journal d'actions rejouable.
   Tests d'abord.
3. Données (`src/data/`) : 4 tours, ennemis de la région 1, Charlie, formules d'équilibrage.
4. Pipeline graphique : format des grilles, script `npm run art` (planches, atlas, contour), palette, découpage et
   recoloration des humains Minifolks avec retouches en grille.
5. Sprites : tuiles du Village Affamé, 4 tours ×5 états, Charlie, Paysan Affamé, Mendiant, Chien Errant et le
   Boucher de Vaudrelle.
6. Rendu Canvas (`src/render/`) : caméra, zoom à pixels entiers, animations, barres de vie, effets.
7. Interface et contrôles (`src/ui/`) : menu en cercle sur les socles, HUD, héros, sorts, toucher, souris,
   clavier, pause automatique, écrans de fin, i18n.
8. Cartes et niveaux de la région 1, carte du monde, sauvegarde versionnée, export et import, reprise.
9. Simulateur, bots, `balance-report.md`, test des bandes, réglage de la région 1.
10. Mesure de performance et optimisations (pools d'objets, rendu par couches).

## Détail du jalon 2
Les valeurs ci-dessous ont été ajustées par le simulateur (tâche 6, voir `docs/architecture.md`, « Équilibrage des trois
dieux » : cadence de Plume +60 %, Ingéniosité +130 arêtes, Totem toutes les 7 s, héros de mêlée et de tir plus rapides…) ;
seules les règles comptent pour l'acceptation.

### Plume et Pollen
| | Plume | Pollen |
| --- | --- | --- |
| Bonus de famille | Tir : +60 % cadence, +15 points de critique (×2 dégâts) | Artillerie : −10 % prix, +15 % cadence ; chaque tir d'artillerie qui touche le sol a 20 % de chances de laisser un piège |
| Sort 1 | Voile de Nuit (recharge 30 s) : zone de rayon 3 pendant 10 s, ennemis −60 % vitesse, tours qui tirent dans la zone +50 points de critique | Pièges à Ressort (recharge 30 s) : 4 pièges sur le chemin autour du point, chacun 60 dégâts physiques et immobilise 1,5 s |
| Sort 2 | Griffes d'Ombre (recharge 40 s) : rayon 1,6, tue net les non-boss, −15 % des PV actuels d'un boss | Ingéniosité (recharge 50 s) : +130 arêtes, tours dans un rayon de 3 à +80 % cadence pendant 10 s |
| Tour divine (200) | Sanctuaire de l'Ombre : 4 assassins qui ne peuvent pas être ciblés, frappent vite, exécutent un non-boss sous 15 % de PV ; révèle les furtifs à portée | Atelier Boiteux : construit jusqu'à 2 tourelles (arbalète automatique, 30 s de vie) et pose un piège toutes les 12 s sur le chemin à portée |

Mécaniques nouvelles du moteur : zones qui durent, pièges posés sur le chemin, exécution, boost temporaire de
tours, unités non ciblables, structures construites par une tour.

### Héros
- 9 héros, 3 par dieu. L'avatar est offert. Les disciples coûtent 30 braises chacun (au jalon 3, ils seront aussi
  offerts à la fin des régions 2, 4, 6, 8).

| Dieu | Héros | Rôle | Attaque |
| --- | --- | --- | --- |
| Plume | Plume, l'Ombre Première | duelliste, esquive 30 %, critiques | corps-à-corps rapide |
| Plume | Suie | assassin, exécute sous 20 % de PV | corps-à-corps |
| Plume | Corbeau | tireur, ignore la moitié de l'armure | à distance |
| Charlie | Charlie, le Colosse | tank, frappe de zone qui étourdit | corps-à-corps |
| Charlie | Mastoc | provocation, bloque 3 ennemis | corps-à-corps |
| Charlie | Brise-Os | berserker, plus fort quand il perd des PV | corps-à-corps |
| Pollen | Pollen, Trois-Pattes | pose des pièges, fronde | à distance |
| Pollen | Rouage | construit une tourelle | à distance |
| Pollen | Lanterne | soigne les soldats et les héros autour | magique à distance |

- Expérience : gagnée à chaque niveau joué (victoire 100 + 20 × N, défaite moitié ; un abandon ne donne rien),
  gardée par héros. Seuils
  des niveaux 2 à 10 dans `src/data/heros.ts`. 1 point de compétence par niveau, 4 compétences de 3 rangs par
  héros (la 4e, l'ultime, demande le niveau 6). Points redistribuables gratuitement hors partie.

### Compétences des spécialisations
Chaque spécialisation des tours a 2 compétences de 3 rangs, achetées en partie avec des arêtes (comme Kingdom
Rush). Exemples : Garde du Cloître, Bénédiction (soigne) et Mur (PV) ; Arbalétriers du Beffroi, Tir à la tête et
Carreau perforant ; Mortier de Soufre, Nappe de soufre et Charge lourde.

### Méta-progression
- **Arbre d'améliorations** (étoiles) : 6 branches (caserne, tir, magie, artillerie, sorts, héros) de 5 rangs ;
  le rang n coûte n étoiles. Chaque rang donne un petit bonus défini dans `src/data/ameliorations.ts`.
  Réinitialisation gratuite : toutes les étoiles dépensées reviennent.
- **Arêtes** (hors partie) : victoire = 30 + 6 × N + 15 par étoile la première fois, 10 + 2 × N ensuite.
- **Braises** : chaque niveau gagné pour la première fois 5, première victoire d'un boss 10 de plus, premières
  3 étoiles d'un niveau 2. La région 1 en rapporte donc au plus 50 + 10 + 20 = 80, de quoi recruter deux disciples
  (30 braises chacun).
- **Objets consommables** (arêtes, stock de 10 au maximum chacun, 3 emplacements équipés avant un niveau, un même
  objet pouvant occuper plusieurs emplacements, chaque emplacement utilisable une fois par partie) : Fiole de Soufre
  (60 : zone, 150 dégâts purs), Herbe de Sabbat (80 : +5 vies), Griffe de Renfort (60 : un chat soldat fort pendant
  30 s), Sablier (100 : gèle tous les non-boss 5 s, ralentit les boss).
  - Un objet qui agit partout (Sablier, Herbe de Sabbat) s'utilise d'un toucher sur son bouton, sans viser la carte.
    Le Sablier gèle tous les non-boss de la carte, furtifs non révélés compris.
  - L'Herbe de Sabbat est refusée quand les vies sont pleines (elle n'est pas consommée). Les 3 étoiles ne sont
    données que si aucune vie n'a jamais été perdue : l'Herbe, qui rend des vies, ne les rend pas.
  - **Règle des consommables** : les objets emportés sont débités du stock **au lancement** de la partie (opération
    rejouée sous verrou comme un achat : refusée si le stock ne couvre plus le choix, « Rejouer » compris). À la fin
    d'une partie enregistrée (victoire, défaite ou abandon), les objets emportés non utilisés sont recrédités (dans la
    limite de 10) ; les objets utilisés restent consommés. Une partie en cours remplacée par une autre sans être
    finie ne rend rien. La partie en cours est aussi rangée juste après chaque utilisation d'objet, pour qu'une
    reprise ne rende pas un objet déjà utilisé.
  - **Abandon** (« Quitter » avant la fin) : aucune expérience ni récompense ; seule une défaite réelle (vies à 0)
    donne la moitié de l'expérience.
- Tout ce qui entre dans une partie est fixé au lancement dans `ConfigPartie` (dieu, héros, son niveau et ses
  compétences, rangs de l'arbre, objets emportés) pour que la partie reste rejouable à l'identique.

### Critères d'acceptation détaillés du jalon 2
- [x] Sur la fiche d'un niveau, on choisit le dieu puis l'un de ses héros possédés. La partie utilise ses sorts,
  son bonus, sa tour divine et son héros.
- [x] Chacun des 6 sorts, des 3 tours divines et des 9 héros a un test moteur qui montre son effet principal.
- [x] Gagner un niveau donne de l'expérience au héros joué. Un niveau de héros donne un point, placé ou
  redistribué sur l'écran des héros, et le changement se voit en partie.
- [x] Acheter un rang de l'arbre retire les étoiles. Réinitialiser les rend toutes. On ne peut pas dépenser plus
  d'étoiles qu'on n'en a gagné.
- [x] Acheter un disciple retire 30 braises. Avec moins de 30, l'achat est refusé.
- [x] Un objet consommable acheté s'équipe, quitte le stock au lancement, s'utilise une fois dans la partie ; s'il
  n'a pas servi à la fin de la partie, il revient au stock (règle des consommables ci-dessus).
- [x] Un code d'export devenu incohérent avec les données d'aujourd'hui (seuils d'expérience, compétences) est
  corrigé à l'import (le héros récupère ses points, un héros choisi non possédé devient l'avatar du dieu), pas refusé.
- [x] La sauvegarde passe en v3 avec une migration testée depuis la v2 : aucune progression perdue.
- [x] Les bandes du simulateur passent pour chacun des 3 dieux avec son avatar, sans amélioration ni objet.
  Aucun dieu ne dépasse de plus de 10 points le taux de victoire des autres en Vieux Sage. (Écart assumé : la courbe
  de difficulté du bot naïf en Matou est jugée sur la moyenne des dieux, et chaque dieu doit seulement avoir une courbe
  décroissante ; voir `docs/architecture.md`.)
- [x] Bruitages CC0 joués sur les événements (tir, impact, mort, construction, sorts, victoire, défaite),
  volumes réglables, `CREDITS.md`.

## Tâches du jalon 2
1. Moteur et données en jeu : Plume, Pollen, les 6 disciples, les compétences de héros, celles des
   spécialisations, les effets en partie de l'arbre et des objets, `ConfigPartie` étendue.
2. Sprites : Plume, Pollen, les 6 disciples, Sanctuaire de l'Ombre et ses assassins, Atelier Boiteux, ses
   tourelles et ses pièges, les effets des 6 sorts, les icônes (sorts, objets, compétences, boutique).
3. Méta-progression et sauvegarde v3 : monnaies, arbre, disciples, objets, expérience et compétences des héros,
   en fonctions pures avec migration v2 vers v3.
4. Interface : choix du dieu et du héros, écran des héros, boutique (arbre, disciples, objets), objets en partie,
   compétences des spécialisations dans le menu des tours.
5. Son : bruitages CC0, réglages branchés, `CREDITS.md`.
6. Équilibrage des trois dieux, bandes par dieu.
7. Relecture, QA, corrections.

## Détail du jalon 3

### Régions 2 à 5
- 10 niveaux par région, 3 cartes dessinées par région réutilisées avec d'autres entrées et vagues, le niveau 10
  est le boss. Vagues générées par la formule d'équilibrage puis figées dans `src/data/niveaux/` comme la région 1.
- Une région s'ouvre quand le boss de la précédente est battu. Ses niveaux mélangent ses ennemis et, à partir du
  niveau 4, ceux des régions précédentes.
- Mécaniques des ennemis (valeurs dans `src/data/ennemis.ts`) :

| Ennemi | Mécanique |
| --- | --- |
| Glaneur | tire de loin sur les soldats et le héros (portée 2 tuiles) |
| Corbeau | volant : ignoré par la Caserne et l'Artillerie, ne s'arrête pas aux soldats |
| Épouvantail | se relève une fois avec 40 % de ses PV |
| Porteur de Torche | brûle les soldats au contact (dégâts sur 3 s) |
| Chasseur de Sorcières | armure 30 %, double dégâts contre le héros |
| Délateur | furtif (visible des tours qui révèlent, du Voile et des Guetteurs) |
| Noyeur | entraîne un soldat bloquant sous l'eau (le tue après 3 s s'il n'est pas tué avant) |
| Pèlerin Voilé | résistance magique 60 % |
| Sangsue | essaim : arrive par groupes de 6, fragile, draine 1 PV/s du soldat qu'elle touche |
| Rat de Peste | essaim très rapide, coût en vies 1, par groupes de 8 |
| Pestiféré | laisse un nuage toxique 3 s en mourant (blesse soldats et héros) |
| Médecin de Peste | soigne de 5 % de leurs PV max les ennemis proches toutes les 4 s |

- Boss :
  - **La Faim** : chaque quart de PV perdu affame les tours à portée (cadence −30 % pendant 5 s).
  - **Le Juge des Flammes** : met le feu à la tour la plus proche toutes les 12 s (désactivée 4 s) et appelle 3
    Porteurs de Torche à 50 % de PV.
  - **La Dame du Puits** : plonge à 66 % et 33 % de PV (invulnérable 3 s, réapparaît 3 tuiles plus loin) et
    appelle 6 Sangsues à chaque plongée.
  - **La Mère des Rats** : pond un groupe de 4 Rats de Peste toutes les 6 s.
- **Élites** : chaque ennemi des régions 2 à 5 a sa version d'élite : PV ×1,4, un palier d'armure et de résistance
  de plus (au plus 90 %), prime ×1,5, même coût en vies (ramené de ×1,8 et +1 vie au rééquilibrage du 2026-10-29 : voir « Équilibrage
  du jalon 3 »), sprite recoloré (teinte sombre, yeux rouges). Elles
  apparaissent dans les dernières vagues en Vieux Sage et partout en Héroïque.
- Disciples offerts : la victoire sur le boss des régions 2 et 4 offre le premier disciple non possédé dans l'ordre
  Suie, Mastoc, Rouage, Corbeau, Brise-Os, Lanterne.

### Défis
- Ouverts sur un niveau à 3 étoiles, joués avec les règles de Matou, sans objet consommable.
- **Héroïque** : 1 vie, toutes les vagues en élite, arêtes de départ ×3.
- **Fer** : toutes les vagues fusionnées en une seule (effectifs ×0,3, boss exceptés ; arêtes de départ ×6), seules les 2 familles de tours
  fixées pour le niveau dans les données sont constructibles, tour divine comprise si sa famille l'autorise ; bonus
  des caisses désactivés.
- Chaque défi réussi rapporte 4 braises une fois. Les réussites sont gardées par niveau et marquées sur la carte.

### Caisses, skins et familiers
- Deux caisses, payées 20 braises chacune : skins (tours communes et héros) et familiers.
- Raretés et chances affichées : Commun 60 %, Rare 25 %, Épique 10 %, Légendaire 4 %, Mythique 1 %. Garantie : une
  caisse qui suit 9 caisses du même type sans Épique ou mieux donne un Épique ou mieux (les chances Épique, Légendaire
  et Mythique gardent leurs proportions). Le compteur est gardé par type de caisse.
- Le tirage se fait hors du moteur (`src/meta/`), avec une source aléatoire injectée (crypto en jeu, graine en test),
  par une transaction de session sous verrou comme les achats.
- Catalogue (`src/data/collection.ts`) : 21 skins (3 par tour commune de base, soit 12, et 1 par héros, soit 9) et
  12 familiers. Chaque objet a une rareté, une stat (dégâts, cadence, portée ou PV des soldats pour une tour ; PV,
  dégâts, cadence ou régénération pour un héros) et un sprite recoloré.
- Doublon : il donne des éclats (Commun 5, Rare 10, Épique 25, Légendaire 60, Mythique 150). Monter un objet du rang
  r au rang r+1 coûte 20 × r éclats (5 rangs). Acheter un objet précis : Commun 50, Rare 120, Épique 300,
  Légendaire 700, Mythique 1500 éclats.
- Bonus : base selon la rareté (skin +1 à +5 % de Commun à Mythique, familier +1, +1,5, +2, +3, +4 %), multiplié
  par 1 + 0,25 × (rang − 1). Un skin porté par tour de base (il vaut pour ses spécialisations), un familier par héros.
  Le total par tour ou par héros est plafonné à +10 %. Les bonus entrent dans `ConfigPartie` au lancement et sont
  ignorés en Fer.
- Le bonus ne change que des stats : le simulateur joue sans caisses et les bandes restent valables.

### Sauvegarde v4
- Ajoute : région débloquée, défis réussis par niveau, collection (objets possédés et rangs), éclats, compteurs de
  garantie, skins et familiers équipés. Migration v3 vers v4 testée, sans perte.

### Pose libre des tours et sols moins granuleux (changement du 2026-10-28)
Demande de l'utilisateur pendant le jalon 3 : les socles fixes disparaissent.
- **Grille de construction invisible** : chaque carte (32×18 tuiles) est découpée en cases de 2×2 tuiles (16×9
  cases). Une tour se pose sur n'importe quelle case libre, centrée dans la case. La case est un peu plus grande que
  la tour : deux tours voisines restent séparées par un écart visible. Il n'y a pas d'autre règle d'écartement.
- Une case est interdite si l'une de ses tuiles est du chemin, porte un grand décor (arbre, maison, rocher, bûcher…)
  ou est hors carte ; l'herbe, les fleurs et les petits cailloux ne bloquent pas. Le moteur reçoit la liste des cases
  interdites avec le niveau (il ne lit pas l'habillage).
- Le point de ralliement d'une caserne est placé par défaut sur le point du chemin le plus proche à sa portée ; une
  case d'où aucun chemin n'est à portée de caserne reste constructible pour les autres familles. La portée de ralliement de
  la caserne (tous ses niveaux) et du Sanctuaire de Plume est de 3,5 tuiles au moins dès le niveau 1 : une caserne posée à une case
  du chemin l'atteint quel que soit l'axe (le centre d'une case est à 2 ou 3 tuiles d'un axe). Un test garde qu'aucun des 50 niveaux
  n'est sans case de caserne et que chaque défi Fer a ses deux familles jouables.
- À l'écran : rien n'est dessiné tant qu'on ne vise pas ; la case sous le doigt ou la souris s'éclaire (libre ou
  interdite) et le menu en cercle s'ouvre sur une case libre. Cibles tactiles : une case fait au moins 44 px au zoom
  du téléphone, sinon on zoome.
- Les bots du simulateur choisissent parmi toutes les cases libres ; l'équilibrage des 50 niveaux se fait après ce
  changement.
- **Sols moins granuleux** : les tuiles de sol des 5 régions passent à de grands aplats avec une variation douce
  (moins de pixels isolés, motifs plus larges, transitions herbe-chemin adoucies), en gardant la palette sombre.
- Critères :
  - [x] Une tour se pose sur toute case libre de la grille et jamais sur une case interdite (tests moteur, y compris
    rejeu) ; deux tours ne partagent jamais une case.
  - [x] Les 50 niveaux ont leurs cases interdites tirées du chemin et des grands décors (test).
  - [x] La case visée s'éclaire, la tour est centrée dans sa case, et à 812×375 une case fait au moins 44 px ou le
    zoom le permet (zoom plancher tactile ; vérifié au navigateur à la souris, pas encore sur un vrai écran tactile).
  - [x] Les sols des 5 régions sont redessinés (planche d'aperçu avant / après).

### Équilibrage du jalon 3
- Les bandes de la région 1 s'appliquent à chacune des régions 2 à 5, pour les 3 dieux.
- Défis : sur chaque région, le bot soigneux réussit entre 40 et 90 % des Héroïques et des Fer.
- Le niveau 10 de chaque région est parmi ses 3 niveaux les plus durs (moyenne des dieux, comme au jalon 2).
- **État au rééquilibrage du 2026-10-29** (après la pose libre des tours ; détail dans docs/architecture.md et balance-report.md) :
  - **Tenues et imposées** (un test et `npm run balance` échouent si elles sortent) : Chaton (le naïf gagne tout), le héros seul ne gagne
    jamais, défis (le soigneux réussit 40 à 90 % des Héroïques et des Fer, sur chacune des 5 régions), puissance des tours.
  - **Non tenues, suspendues** (calculées, listées dans le rapport, mais non bloquantes ; `BANDES_SUSPENDUES_IMPOSEES=1` les impose) :
    Matou (le soigneux perd au moins une vie sur la moitié des niveaux, le naïf gagne 30 à 70 %), Vieux Sage (soigneux entre 60 et 85 %),
    **écart entre dieux** et **courbe de difficulté** des régions. Écart assumé principal : en Vieux Sage, Charlie est loin derrière
    Plume aux régions 2 à 5 (Charlie n'a ni tir, ni sort à distance, ni révélation sans payer des Guetteurs des Toits), et Plume
    dépasse 85 % aux régions 2 à 5. À reprendre par un travail sur les dieux et les héros (Charlie et Pollen), pas par les niveaux.
- Réglages du rééquilibrage (avant → après) : voir docs/architecture.md, « Rééquilibrage du jalon 3 ».

### Critères d'acceptation détaillés du jalon 3
- [x] Les régions 2 à 5 sont jouables de bout en bout, chacune débloquée par le boss de la précédente.
- [x] Chaque mécanique d'ennemi, de boss et d'élite ci-dessus a un test moteur qui montre son effet.
- [ ] `npm run balance` couvre les régions 1 à 5 et les défis, et toutes les bandes passent.
- [x] Sur 100 000 tirages d'une caisse sans garantie, chaque rareté sort à moins de 0,5 point de la chance affichée.
- [x] La 10e caisse sans Épique ou mieux en donne un ; un doublon donne les éclats prévus ; un rang et un achat
  d'objet précis retirent les éclats prévus ; moins d'éclats ou de braises que le prix, refus.
- [x] Le bonus d'une tour ou d'un héros ne dépasse jamais +10 % (test sur toutes les combinaisons du catalogue), et
  il vaut 0 en Fer.
- [x] Un défi s'ouvre à 3 étoiles, ses règles s'appliquent, sa récompense n'est donnée qu'une fois.
- [x] La sauvegarde passe en v4 avec une migration testée depuis la v3.
- [x] Les écrans caisses (chances affichées, ouverture, garantie restante) et collection (équiper, monter, acheter)
  tiennent en paysage 812×375.

## Tâches du jalon 3
1. Moteur : mécaniques des 12 ennemis et des 4 boss, élites, défis (Héroïque, Fer), bonus de collection dans
   `ConfigPartie`.
2. Sprites : 12 ennemis, leurs élites, 4 boss, tuiles et décor des régions 2 à 5, 21 skins, 12 familiers, icônes
   des caisses et des raretés.
3. Méta et sauvegarde v4 : catalogue, tirage, garantie, éclats, rangs, défis, déblocage des régions, disciples
   offerts.
4. Niveaux : 12 cartes et 40 niveaux figés, familles imposées des défis Fer. (Après la tâche 1.)
5. Interface : carte des régions 2 à 5, défis sur la fiche, écrans caisses et collection, bilan des défis. (Après les
   tâches 1 et 3.)
6. Équilibrage des régions 2 à 5 et des défis. (Après la tâche 4.)
7. Relecture, QA, corrections.

## Détail du jalon 4

Décisions prises par le chef de projet sans entretien, à la demande de l'utilisateur (« enchaîne directement sur le
jalon 4 ») : elles suivent la spec d'origine et les choix du jalon 3, et restent à relire par l'utilisateur.

### Régions 6 à 10
- Même structure qu'au jalon 3 : 10 niveaux par région, 3 cartes dessinées par région (grille de construction et
  cases interdites comme au jalon 3), niveau 10 boss, vagues figées dans `src/data/niveaux/`, région ouverte par le
  boss de la précédente, ennemis des régions précédentes mélangés à partir du niveau 4. Sols en grands aplats dès
  le départ.
- Mécaniques des ennemis :

| Ennemi | Mécanique |
| --- | --- |
| Fossoyeur | un soldat tué à 2 tuiles de lui met deux fois plus de temps à réapparaître |
| Creux | se relève une fois avec 50 % de ses PV, sauf s'il meurt de dégâts magiques |
| Chauve-Souris | volante, essaim par groupes de 5, rapide et fragile |
| Fantassin | armure 60 % |
| Porte-Bannière | aura : +25 % de vitesse aux ennemis à 2 tuiles (non cumulable) |
| Cavalier | très rapide, armure 30 % ; renverse le premier soldat qui le bloque (étourdi 2 s) et passe |
| Flagellant | sous 50 % de PV, +50 % de vitesse et de dégâts |
| Inquisiteur | fige la tour la plus proche à 2,5 tuiles pendant 3 s, toutes les 8 s |
| Exorciste | résistance magique 30 % ; toutes les 6 s, tue une invocation à 2 tuiles ou étourdit le héros 2 s |
| Garde Royal | armure 90 %, lent |
| Arbalétrier d'Élite | tire sur les soldats et le héros à 3,5 tuiles |
| Chevalier | rapide, armure 60 %, résistance magique 30 % |
| Acolyte de Cendre | résistance magique 30 % ; invoque 2 Creux toutes les 8 s |
| Ange de Cendre | volant, armure 30 %, résistance magique 60 % |

- Boss :
  - **Le Roi des Fosses** : toutes les 15 s, relève les 4 derniers ennemis morts à 50 % de leurs PV.
  - **Le Prince Croisé** : charge toutes les 10 s (vitesse ×3 pendant 2 s, ignore les soldats) et porte l'aura du
    Porte-Bannière à 3 tuiles.
  - **Le Grand Inquisiteur** : fige les 2 tours les plus proches pendant 4 s toutes les 10 s ; insensible aux
    ralentissements.
  - **Le Roi Fou** : à 75, 50 et 25 % de PV, appelle 4 Gardes Royaux et devient invulnérable 3 s.
  - **Le Soleil Blême** : trois phases. Jusqu'à 66 % de PV, aveugle les tours à 4 tuiles (portée −30 % pendant
    4 s, toutes les 12 s) ; jusqu'à 33 %, appelle 2 Anges de Cendre toutes les 10 s ; ensuite, cadence −30 % aux
    tours à 4 tuiles tant qu'il vit.
- Élites, défis Héroïque et Fer : mêmes règles qu'au jalon 3, sur les 50 nouveaux niveaux.
- Disciples offerts : victoire sur le boss des régions 6 et 8, même ordre qu'au jalon 3.
- Victoire sur le Soleil Blême : écran de fin de campagne (texte de lore), puis retour à la carte.

### Mode infini
- Ouvert par la victoire sur le boss de la région 1. On choisit une carte dont au moins un niveau est gagné.
- Règles de Matou, 20 vies, objets consommables et bonus de caisses autorisés, dieu et héros au choix.
- Vagues générées par le moteur, de façon déterministe à partir de la graine de la partie (le rejeu reste exact) :
  budget de menace de la vague n = budget de la première vague de Matou × 1,08^(n−1), tiré parmi les ennemis de la
  région de la carte et des régions précédentes ; élites à partir de la vague 20 (10 % des ennemis, +5 points
  toutes les 10 vagues, au plus 60 %). Le multiplicateur et les seuils sont dans `src/data/`.
- Mini-boss toutes les 10 vagues : le boss de la région de la carte, à 30 % de ses PV, +15 points par mini-boss
  déjà passé (60 % à la vague 30…), seul ou avec la vague.
- Le record (dernière vague terminée) est gardé par carte. « Reprendre à la vague N » marche comme en campagne.
- Paliers 10, 20, 30, 50, 75 et 100 : chacun payé une seule fois au total, toutes cartes confondues :
  arêtes 50 / 100 / 150 / 250 / 400 / 600, braises 2 / 3 / 5 / 8 / 12 / 20.
- Pas d'étoiles ni de défis en infini. Une partie arrêtée garde le record atteint.

### Sauvegarde v5
- Ajoute : records de l'infini par carte, paliers payés. Migration v4 vers v5 testée, sans perte.

### Équilibrage du jalon 4
- Les bandes de la région 1 s'appliquent aux régions 6 à 10, pour les 3 dieux ; défis entre 40 et 90 % de
  réussite du bot soigneux par région ; le boss de chaque région parmi ses 3 niveaux les plus durs.
- `npm run balance` couvre les 100 niveaux dans les 3 difficultés et les défis.
- Infini, en Matou : le bot soigneux atteint en médiane entre la vague 25 et la vague 45 sur une carte de la région
  1, et le bot naïf ne passe pas la vague 30.
- **État à la fin de la tâche d'équilibrage du jalon 4** (régime du jalon 3, détail dans docs/architecture.md, « Équilibrage du jalon 4 », et
  balance-report.md) :
  - **Tenues et imposées** (un test et `npm run balance` échouent si elles sortent) : Chaton (le naïf gagne tout) et le héros seul qui
    perd, sur les 100 niveaux et les 3 dieux ; défis (le soigneux réussit 40 à 90 % des Héroïques et des Fer, sur chacune des 10 régions) ;
    puissance des tours ; **infini** (en Matou, sur les 4 cartes de la région 1 et pour les 3 dieux : médiane du soigneux entre la vague 25 et
    la vague 45, le naïf ne dépasse jamais la vague 30 ; test `bandes-infini.test.ts`, une trentaine de secondes).
  - **Non tenues, suspendues** (calculées, listées, non bloquantes ; `BANDES_SUSPENDUES_IMPOSEES=1` les impose) : Matou (le soigneux ne gagne
    pas tout aux régions 6 à 9 et ne perd pas de vie sur la moitié des niveaux ; le naïf sort de 30 à 70 % pour certains dieux), Vieux Sage
    (Plume dans la bande ou un peu au-dessus, Charlie et Pollen très en dessous : de 0 à 36 % aux régions 6 à 10), **écart entre dieux** et
    **courbe de difficulté** (le niveau 10 de chaque région n'est pas parmi les 3 plus durs du naïf : le boss est battu par le naïf plus
    souvent que certains niveaux ordinaires). Les causes sont celles du jalon 3 (Charlie et Pollen ne contrent pas les ennemis qui
    contournent ou tuent les soldats ; le soigneux est plus économe que le naïf), aggravées par les armures de 60 à 90 % des régions 7 à 9.
    Aucun dieu, héros ni sort n'a été modifié.
- **Écarts assumés** :
  - Les régions 6 à 10 ont un `facteurBudget` par niveau (champ du plan, absent des régions 1 à 5) qui multiplie le budget de menace b(L, w) :
    la menace d'un ennemi (PV ÷ (1 − protection moyenne) × vitesse) ne chiffre ni une armure de 90 % contre des tours physiques, ni
    les invocations de l'Acolyte de Cendre ; à budget égal, les régions 7 à 10 étaient injouables pour le naïf à toute quantité d'arêtes
    (facteurs de 0,02 à 0,98). Les vagues des régions 1 à 5 sont restées identiques octet pour octet.
  - Valeurs d'ennemis changées par rapport au tableau ci-dessus : l'Acolyte de Cendre invoque **1** Creux toutes les **12 s** (et non 2 toutes
    les 8 s) et a 80 PV (et non 140) ; le Garde Royal a 130 PV (et non 200), armure 90 % inchangée.
  - Mode infini : le budget croît de **22 %** par vague (et non 8 %) : à 8 %, le naïf (16 tours, tout amélioré) atteignait la vague 100 ; plafond
    de 200 ennemis par vague (paramètre `ennemisMaxParVague`), le surplus de budget devient un facteur de PV (et de prime) de la vague, ce
    qui garde l'état sérialisé sous `TAILLE_MAX_ETAT` et les saccades bornées. Le PV du mini-boss (30 % + 15 points par mini-boss, 1,65 à la
    vague 100) n'est pas plafonné : il est linéaire alors que le budget est exponentiel, il ne rend rien absurde (au-delà de la vague 50
    plus personne ne tient).
  - Le niveau de la bande de défis est tenu de justesse à certains endroits (Fer 88 à 90 % aux régions 7, 9 et 10) : une retouche sans
    rapport peut le faire sortir (les résultats changent par sauts de 10 points quand un niveau bascule pour un dieu).

### Critères d'acceptation détaillés du jalon 4
- [x] Les régions 6 à 10 sont jouables de bout en bout, chacune débloquée par le boss de la précédente, et la
  victoire sur le Soleil Blême affiche la fin de campagne.
- [x] Chaque mécanique d'ennemi et de boss des régions 6 à 10 a un test moteur qui montre son effet.
- [ ] `npm run balance` couvre les 100 niveaux et les défis, et toutes les bandes passent.
- [x] Infini : même graine et mêmes actions donnent le même état (test), un mini-boss arrive aux vagues 10, 20,
  30, le budget suit la formule (test), le record par carte survit à un rechargement.
- [x] Un palier de l'infini n'est payé qu'une fois, même atteint sur une autre carte (test).
- [x] La sauvegarde passe en v5 avec une migration testée depuis la v4.
- [ ] Les écrans de l'infini (choix de la carte, record, paliers, fin de partie) tiennent en paysage 812×375.

## Tâches du jalon 4
1. Moteur : mécaniques des 14 ennemis et des 5 boss, élites ; génération des vagues de l'infini et mini-boss.
2. Sprites : 14 ennemis, leurs élites, 5 boss, tuiles en aplats et décor des régions 6 à 10, illustration de fin de
   campagne.
3. Méta et sauvegarde v5 : déblocage des régions 6 à 10, disciples offerts, records et paliers de l'infini.
4. Niveaux : 15 cartes et 50 niveaux figés, cases interdites, familles imposées des défis Fer. (Après la tâche 1.)
5. Interface : carte des régions 6 à 10, écran de l'infini, affichage de la vague et du record, fin de partie
   infinie, fin de campagne. (Après les tâches 1 et 3.)
6. Équilibrage des régions 6 à 10, des défis et de l'infini. (Après la tâche 4.)
7. Relecture, QA, corrections.

## Impacts
- Données / migrations : aucune base de données. Le format de sauvegarde est versionné dès la v1.
- API : aucune en V1. Le journal d'actions et le moteur déterministe préparent le rejeu serveur.
- Écrans : accueil, carte du monde, fiche de niveau (dieu, héros, difficulté), partie, fin de partie, boutique,
  héros, options (son, export et import).

## Questions ouvertes
- Nom du dépôt GitHub : `pocharlume` sous le compte de l'utilisateur ?
