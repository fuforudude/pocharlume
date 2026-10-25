# Pocharlume : tower defense de chats

Statut : validée
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
- Souris et doigt font tout. Raccourcis clavier en plus : `1`–`5` tours, `Q` `W` sorts, `E` héros, `Espace`
  vague suivante, `P` pause, `F` vitesse.
- Pause automatique quand l'appli perd le focus. L'état est sauvegardé au début de chaque vague, et après une
  fermeture le jeu propose « Reprendre à la vague N ».
- Son : packs libres de droits (CC0, Kenney ou OpenGameArt) avec un fichier `CREDITS.md`. Chaque téléchargement
  est validé par l'utilisateur.
- Cible : Android milieu de gamme 2020, 60 images/s avec 150 ennemis à l'écran, premier chargement sous 3 Mo.
- Livraison en 5 jalons jouables.

## Graphismes
- Patte du pack Minifolks : pixel art en cadres de 32×32, contour sombre d'un pixel, peu de couleurs par
  personnage, une ligne de planche par animation (repos, marche, attaque, blessé, mort).
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
- Difficultés **Chaton**, **Matou** et **Vieux Sage**, choisies au lancement. Étoiles : 3 si aucune vie perdue,
  2 si au moins la moitié des vies, 1 sinon. On garde le meilleur résultat par niveau (300 étoiles en tout).
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
  - Matou : le bot soigneux gagne 100 % des niveaux, le bot naïf entre 50 et 90 %.
  - Vieux Sage : le bot soigneux gagne au moins 80 % des niveaux, sans aucun bonus de caisse ni amélioration
    au-delà de ce que la progression attendue permet à ce niveau.
  - Aucune tour commune n'a une puissance hors de ±15 % de la moyenne de son palier de coût.

## Périmètre
- Dedans : tout ce qui précède, livré en 5 jalons.
- Hors périmètre (versions suivantes) : synchronisation cloud, classements en ligne, rejeu serveur, achats
  réels, publicité, traduction anglaise, publication sur l'App Store iOS.

## Jalons et critères d'acceptation

### Jalon 1 : le socle jouable
- [ ] `npm run dev` ouvre le jeu. `npm run build` produit un site statique de moins de 3 Mo, sans erreur
  TypeScript (strict).
- [ ] `npm test` passe : tests du moteur (déterminisme : même graine et mêmes actions donnent le même état final,
  octet pour octet), de la sauvegarde (migration d'une sauvegarde v1), et de l'équilibrage de la région 1.
- [ ] Les 4 tours communes se construisent sur les socles, s'améliorent jusqu'au niveau 3, puis choisissent une
  spécialisation, et se revendent à 70 % de leur coût total.
- [ ] Les 10 niveaux de la région 1 et les 3 ennemis de la région plus son boss sont jouables. Victoire et défaite
  affichent un écran de fin. La victoire donne 1 à 3 étoiles selon la règle des vies.
- [ ] Le dieu Charlie est jouable : héros déplaçable au doigt et à la souris, 2 sorts rechargeables, bonus de
  caserne, Totem du Colosse.
- [ ] Les sprites des 4 tours (3 niveaux et 2 spécialisations), de Charlie, des 4 ennemis et des tuiles de la
  région 1 viennent de `npm run art`, en cadres de 32×32 (16×16 pour les tuiles).
- [ ] Sur un téléphone en paysage : socles et boutons d'au moins 44 px, zoom à deux doigts et glisser de la
  caméra. Pause au passage en arrière-plan. Après une fermeture, « Reprendre à la vague N ».
- [ ] Vitesse ×1/×2, pause, raccourcis clavier listés plus haut.
- [ ] La progression (niveaux, étoiles) survit à un rechargement. L'export produit un code, et l'import de ce code
  sur un profil vide redonne la même progression.
- [ ] `npm run balance` produit `balance-report.md` pour la région 1, et le test des bandes passe.
- [ ] 60 images/s mesurées dans les outils de performance de Chrome (processeur ralenti ×4) avec 150 ennemis.

### Jalon 2 : les trois dieux et la boutique
- [ ] Plume et Pollen jouables (héros, sorts, bonus, tour divine). Choix du dieu et du héros avant un niveau.
- [ ] 6 disciples, expérience et compétences des héros.
- [ ] Arbre d'améliorations en étoiles (réinitialisable : toutes les étoiles reviennent), arêtes, braises,
  objets consommables (3 emplacements).
- [ ] Trois difficultés sélectionnables, avec leurs bandes vérifiées par le simulateur.
- [ ] Bruitages CC0 intégrés, réglages son, `CREDITS.md`.

### Jalon 3 : régions 2 à 5, caisses, défis
- [ ] 40 niveaux de plus, avec leurs ennemis, élites et boss, et des tests d'équilibrage qui passent.
- [ ] Caisses de skins et de familiers : chances affichées égales à celles du tirage (test sur 100 000 tirages,
  écart < 0,5 point), garantie de 10, éclats, rangs, plafond de +10 % vérifié par un test.
- [ ] Défis Héroïque et Fer sur chaque niveau à 3 étoiles. Bonus de caisses désactivés en Fer.

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

## Impacts
- Données / migrations : aucune base de données. Le format de sauvegarde est versionné dès la v1.
- API : aucune en V1. Le journal d'actions et le moteur déterministe préparent le rejeu serveur.
- Écrans : accueil, carte du monde, fiche de niveau (dieu, héros, difficulté), partie, fin de partie, boutique,
  héros, options (son, export et import).

## Questions ouvertes
- Nom du dépôt GitHub : `pocharlume` sous le compte de l'utilisateur ?
