# Architecture

Vue d'ensemble des dossiers et de leurs frontières. Les choix de fond sont expliqués dans
[l'ADR 0001](adr/0001-stack-et-moteur-deterministe.md), le contenu du jeu dans
[la spec](specs/2026-10-25-pocharlume.md).

## Dossiers

| Dossier | Rôle | Peut dépendre de |
| --- | --- | --- |
| `src/engine/` | Simulation déterministe : boucle à pas fixe (1/30 s), générateur pseudo-aléatoire à graine, chemins, ennemis, tours, projectiles, soldats, vagues, vies et or, journal d'actions rejouable. Aucune dépendance au DOM : tourne dans Node (simulateur, futur serveur). | `src/data/` |
| `src/data/` | Tables d'équilibrage : tours, ennemis, dieux, difficultés, règles, formules et générateur de vagues (`equilibrage.ts`), version des données (`version.ts`, à incrémenter à chaque changement d'équilibrage), méta-progression (`meta.ts` : ids des dieux, héros, branches de l'arbre et objets, prix, plafonds, formules de gain hors partie, et depuis le jalon 3 les règles des caisses, des défis, des régions et des disciples offerts), catalogue de la collection (`collection.ts` : 21 skins et 12 familiers avec rareté et stat). Aucune valeur de jeu en dur ailleurs. Les niveaux figés vont dans `src/data/niveaux/` (un fichier par région). | `src/engine/` : types, et le générateur à graine (`aleatoire.ts`) pour le générateur de vagues |
| `src/render/` | Rendu Canvas 2D : caméra, zoom à pixels entiers sans lissage, sprites, animations, barres de vie, effets. Lit l'état du moteur, ne le modifie jamais. | `src/engine/`, `src/data/` |
| `src/ui/` | Écrans, HUD, menus, toucher, souris, clavier. Traduit les gestes en actions du moteur. | tout `src/` |
| `src/audio/` | Son : moteur Web Audio (`moteur.ts`), limiteur (`limiteur.ts`), données des sons et table événement vers son (`table.ts`), écouteurs du navigateur (`geste.ts`). Ne dépend que du type des événements du moteur et de `src/data/ennemis.ts`. | `src/engine/` (types), `src/data/` |
| `src/i18n/` | Textes affichés. `fr.ts` contient la table, `t('clé')` la lit avec une clé typée. | rien |
| `src/meta/` | Logique pure de la collection (jalon 3), sans stockage ni DOM : types de la collection d'un joueur (`collection.ts`), sources aléatoires injectées (`aleatoire.ts` : `crypto.getRandomValues`, réserve rejouable), tirage d'une caisse avec sa garantie (`tirage.ts`), bonus de la collection équipée vers le contrat de `ConfigPartie` (`bonus.ts`). Lit les règles de `src/data/meta.ts` et le catalogue de `src/data/collection.ts`. | `src/data/` |
| `src/save/` | Sauvegarde. Fonctions pures : format versionné v4 (`format.ts`), validation stricte (`validation.ts`, `validation-collection.ts`, briques communes `validation-base.ts`), migrations en chaîne vN vers vN+1, progression (étoiles, déblocage), méta-progression (`transactions.ts`, `transactions-collection.ts`, `config-partie.ts`, `definitions.ts`), partie en cours, export et import par code (`code.ts`). `Session` (`session.ts`) tient la sauvegarde courante en mémoire et l'écrit à chaque changement ; sa règle multi-onglets est décrite plus bas (« Méta-progression et sauvegarde v3 »). `verrou.ts` exclut les écritures entre onglets (Web Locks) ; `canal.ts` prévient les autres onglets par `BroadcastChannel`, qui se rafraîchissent. Accès au stockage : interface `Stockage` (IndexedDB, repli localStorage, mémoire ; Capacitor Preferences plus tard) et `Depot`, qui ne lève jamais et garde une copie de secours d'une sauvegarde illisible. | `src/engine/`, `src/data/`, `src/meta/` |
| `src/equilibrage/` | Simulateur d'équilibrage sans affichage : partie jouée par un bot (`simulation.ts`), bot naïf (`bot-naif.ts`) et bot soigneux avec sa petite recherche de variante (`bot-soigneux.ts`), géométrie des cartes, évaluation d'une région (`campagne.ts`), bandes cibles (`bandes.ts`), puissance des tours et des tours divines (`puissance.ts`), profils des vérifications supplémentaires (`profils.ts` : disciples, arbre au maximum, héros de niveau 10, sans tour divine), rédaction de `balance-report.md` (`rapport.ts`, plus la section des régions 2 à 5 dans `rapport-regions.ts`). Le bot soigneux sait que la caserne et l'artillerie ne touchent pas les volants et qu'il faut des Guetteurs des Toits contre les furtifs (`partsSpeciales`, `geometrie.ts`). Les bots ne passent que par l'API publique du moteur (`avancer` avec des actions). Réutilisé par `tools/balance/` et par les tests des bandes. | `src/engine/`, `src/data/`, `src/i18n/` |
| `tools/` | Scripts Node : `art` (grilles de pixels vers planches PNG et atlas JSON), `niveaux` (génère les vagues figées des 5 régions, aperçu texte et planche PNG des cartes (`planche.ts`), bilan du joueur automatique ; `enregistrer.ts` permet à Node d'importer `src/` sans extension), `balance` (`npm run balance` : lance le simulateur de `src/equilibrage/` et écrit `balance-report.md` à la racine). | `src/engine/`, `src/data/` |
| `tools/atelier/`, `tools/atelier-pocharlume/` | L'éditeur de retouche (`npm run editeur`) : cœur générique autonome (`tools/atelier/`, serveur local Vite, éditeur de pixels, palette, grille d'objets, interface d'adaptateur ; n'importe rien du projet, un test le garde) et adaptateur Pocharlume (`tools/atelier-pocharlume/` : sprites et palette via `tools/art/`, décors des cartes via les règles de `src/data/niveaux/`). Configuré par `atelier.config.ts`. Hors du build et du jeu. | `tools/art/`, `src/data/niveaux/` |
| `art/` | Sources graphiques : pack Minifolks d'origine (`art/minifolks/`), grilles de pixels en texte (`art/sprites/<nom>.txt`, format décrit en tête de `tools/art/format.ts`), palettes partagées (`art/palettes/`). `npm run art` écrit aussi des aperçus agrandis dans `art/apercu/` (ignoré par git). Les index de noms par jalon sont `art/sprites/jalon2-noms.txt` et `jalon3-noms.txt` (ennemis et élites, boss, effets, tuiles et décor des régions 2 à 5, familiers, icônes). Les versions d'élite se font avec la directive `sombre` (voir `tools/art/format.ts`) ; les skins ne sont pas des sprites mais des palettes (`src/render/palettes-skins.ts`). | — |
| `public/sprites/` | Atlas généré par `npm run art` (`atlas.png`, `atlas.json`), commité : le build n'exécute pas le pipeline, un test vérifie que l'atlas est à jour. | — |

`src/main.ts` est le point d'entrée du navigateur.

## Son
- **Fichiers** : `public/sons/<id>.ogg` (25 bruitages Ogg Vorbis, 281 Ko), extraits de trois packs Kenney CC0. Le catalogue
  source, nom, usage est `tools/sons/catalogue.ts` (`npm run sons -- <dossier des packs>` les recopie), les crédits
  sont dans `CREDITS.md`. Un test vérifie que fichiers, catalogue et `SONS` sont identiques et que le total reste sous
  600 Ko. Safari iOS lit l'Ogg Vorbis depuis iOS 17 ; pas de repli MP3 ajouté (iOS plus ancien : jeu muet, sans erreur).
- **Moteur** (`src/audio/moteur.ts`) : l'`AudioContext` est créé au premier geste (`pointerup`, `click`, `keydown`,
  `touchend`, branchés par `geste.ts`) et relancé à chaque geste s'il est suspendu. Chargement paresseux : rien n'est
  téléchargé avant ce geste, puis les 25 sons le sont en tâche de fond (sauf volume à 0). Deux bus (effets, interface)
  suivent le volume « son », un bus musique suit « musique » (`audio.busMusique`, pour la musique à venir). Courbe de
  volume carrée. Volume à 0 : rien n'est chargé ni joué. Aucune méthode ne lève : sans `AudioContext`, contexte
  suspendu, fichier introuvable ou son pas encore chargé, le son est simplement sauté.
- **Table** (`src/audio/table.ts`) : `SONS` (volume, hauteur, variation aléatoire, priorité, nombre maximal par fenêtre,
  bus) et `SON_DES_EVENEMENTS`, une entrée par type d'événement du moteur (`null` = silence voulu). Un test lit
  `src/engine/evenements.ts` : un nouvel événement sans entrée fait échouer la CI. Les entrées-fonctions choisissent selon
  la famille de la tour ou le genre de l'unité (la partie est passée au moteur de son) et selon `boss` des ennemis.
  **Lectures réglées (jalon 3)** : une entrée peut rendre une `LectureSon` (`{ id, volume, hauteur, cle, max }`, facteurs
  appliqués au son de base, clé et `max` du limiteur) au lieu d'un simple id : le même fichier sert plusieurs événements avec
  des nuances, sans nouveau fichier. Les 9 événements des ennemis des régions 2 à 5 ont ainsi leur son ; ceux qui viennent en
  grappe (`brulure`, `soin_ennemi`, `appel`) et la mort d'un ennemi d'essaim (sangsue, rat de peste : `pouvoirs.essaim`) ont
  une clé propre limitée à une instance par fenêtre, donc pas de mitraille. `lectureDe` donne la lecture d'un événement,
  `sonDe` son id.
- **Limitation** (`limiteur.ts`) : fenêtre de 80 ms, au plus `max` instances d'un même son, et un plafond total par
  priorité (basse 4, normale 7, haute 12) : une rafale de tirs ne couvre jamais une cloche de vague, la mort d'un boss ou
  la victoire. Le hasard de hauteur et de volume est `Math.random` du rendu, jamais celui du moteur.
- **Branchements** : `main.ts` appelle `installerAudio(() => session.sauvegarde.reglages)` (volumes relus à chaque son, donc
  les curseurs agissent en direct) ; la boucle de `partie.ts` appelle `audio.jouerEvenements(etat.evenements, etat)` après
  chaque pas et `jouerInterface('refus')` sur un refus ; tout `<button>` joue « clic » (écouteur global en capture, bouton
  `aria-disabled` muet) ; un curseur de volume relâché joue un clic de contrôle. La boutique appelle
  `jouerInterface('achat')` quand un achat réussit (non branché : pas d'écran de boutique au moment de ce jalon).

## Rendu et interface
- **Boucle** (`src/ui/partie.ts`, `lancerNiveau`) : une boucle `requestAnimationFrame` accumule le temps réel
  (`src/render/pas-fixes.ts`, écart borné) et appelle `avancer` par pas de 1/30 s, ×1 ou ×2. Le rendu
  interpole entre deux pas avec le reste de l'accumulateur. Les actions du joueur sont mises dans une file que
  la boucle donne au prochain pas : l'interface n'écrit jamais dans l'état.
- **Tests de la boucle** : `src/ui/partie-boucle.test.ts` et `carte-monde.test.ts` tournent sous happy-dom (devDependency, pour le DOM) avec un faux `requestAnimationFrame` ; le rendu Canvas et l'atlas y sont remplacés par des doublures.
- **Rendu** (`src/render/`) : `Rendu` dessine dans un tampon de pixels logiques (une tuile = 16 px) agrandi
  d'un facteur entier sans lissage ; `camera.ts` (zoom entier, glisser, pincement, molette, bornes ; la vue peut dépasser la carte de la largeur des barres du HUD, mesurées dans le DOM par `src/ui/marges.ts`, pour que toute case de la grille puisse sortir de dessous un bouton), `sol.ts`
  (sol précalculé depuis les chemins : herbe, chemin avec bords et coins, boue, pavés), `suivi.ts` (une
  représentation par entité du moteur, créée et retirée d'après les événements), `effets.ts` (effets en pool),
  `animations.ts` et `atlas.ts` (sprites). Rien ne s'alloue dans la boucle chaude. **Nouveautés du jalon 2** :
  ce qui dure se lit dans l'état (les zones du Voile de Nuit couvrent par `zones.ts` toutes les tuiles que le rayon
  touche, avec la tuile `effet-voile-nuit-tuile` ; les pièges armés ; les tours dont `boostPas` > 0 portent
  `effet-ingeniosite` ; la rage d'un héros blessé), les tourelles construites sont suivies comme des tours (`Suivi.structures` :
  apparition à la création, destruction par l'événement `structure_fin`), et les événements lancent les effets
  ponctuels (déclenchement d'un piège, exécution, soin, esquive, tir d'un héros à distance ou d'une tourelle, objets
  de `effetObjet`, assassin qui sort de l'ombre). L'assassin du Sanctuaire (non ciblable) est dessiné translucide.
  **Graphismes du jalon 3** (livrés avant leur branchement) : le sol choisit son jeu de tuiles d'après `region` du visuel
  (`nomTuile` dans `sol.ts` : la région 1 garde `herbe-1`, les régions 2 à 5 ont `r2-herbe-1`…, 21 tuiles chacune), les
  boss en 64×64 (`la-faim`, `juge-flammes`, `dame-puits`, `mere-rats`), les élites (`<ennemi>-elite`) et les familiers
  (`familier-<bête>`) sont des sprites de l'atlas, et `palettes-skins.ts` donne les 21 palettes de skins (fonction pure
  `appliquerPalette`, copie recolorée d'un sprite ou de l'atlas avec cache par `imageDuSkin`).
  **Branchement du rendu (jalon 3)** : un ennemi d'élite (`Ennemi.elite`) prend `<id>-elite` (retombe sur le sprite de base s'il
  manque ; les ennemis de la région 1 ont les leurs, `paysan-affame-elite`, `mendiant-elite`, `chien-errant-elite`) et sa barre de
  vie est dorée et toujours visible. L'Épouvantail dont `Ennemi.invulnerable` > 0 joue `mort` puis reste à terre, puis `releve` ;
  la Dame du Puits joue `plonge`, reste sous l'eau (ripple), puis `emerge` d'un bond, avec une gerbe (`effet-plongee`) à la
  plongée et à l'émergence ; la barre d'un ennemi intouchable est bleu pâle. `Unite.brulure` pose `effet-brulure`, `Unite.noyade`
  enfonce l'unité sous une surface qui monte (clip + ondulation) ; `Tour.desactivee` et `Tour.affamePas` posent `effet-tour-feu`
  et `effet-tour-affamee` ; une `ZoneDurable.degatsAllies` > 0 dessine `effet-nuage-toxique` (déploiement `impact` joué à
  l'événement `zone`, puis le nuage qui tourne) ; `soin_ennemi` pose `effet-soin` sur l'ennemi soigné ; `appel` fait sortir les
  appelés de la fumée ; `famine` trace un anneau gris du rayon de la zone.
  **Collection équipée** : `new Rendu(canvas, atlas, carte, visuel, { skins, familier })` ou `rendu.definirCollection({ skins, familier })`
  (type `OptionsCollection`, `src/render/suivi.ts`). `skins` est la table de `Collection.equipes.skins` : clé = famille de tours de
  base (`caserne`, `tir`, `magie`, `artillerie`) ou id d'un héros, valeur = id de skin ; le skin d'une famille habille sa tour de base
  et ses spécialisations (jamais la tour divine), seul le héros de la partie porte son skin. `familier` est l'id du familier du
  héros de la partie (`Collection.equipes.familiers[héros]`, par exemple `familier_rat`), `null` pour aucun : le sprite
  `familier-<bête>` trottine derrière le héros (suit d'une part de l'écart par pas, bondit s'il est loin, caché si le héros est
  à terre). Les skins passent par `AtlasRendu.habiller` : pixels de la planche lus une fois (à la première demande), zone du sprite
  recolorée par `imageDuSkin` (cache) puis copiée dans deux petits canvas (normal et retourné). Sans option, rien ne change.
- **Interface** (`src/ui/`) : `interaction.ts` (machine à états pure : menu d'une case de la grille, héros, sort,
  ralliement ; renvoie l'action à envoyer ou la raison d'un refus), `menu-cercle.ts` (éléments du menu
  d'après `validerAction`), `gestes.ts` (toucher, glisser, pincer), `clavier.ts` (touches), `hud.ts`,
  `ecrans.ts` (accueil, pause, fin avec son butin, « Tourne ton téléphone », avis discret), `refus.ts` (raison de refus
  vers texte). **Raccourcis clavier** : `1`–`5` tours, `Q` `W` sorts du dieu, `A` `Z` `R` les trois objets emportés
  (choix sans conflit avec `Q` `W` `E` `F` `P` ni `Espace`), `E` héros, `F` vitesse, `P` pause, `Échap` annule.
  Un objet ciblé (Fiole, Griffe) s'utilise en deux gestes comme un sort : toucher l'objet (ou sa touche), puis la carte ;
  un objet global (Sablier, Herbe de Sabbat) s'utilise d'un seul geste, sans viser (`Interaction.basculerObjet`, qui envoie
  tout de suite l'action au centre de la carte et affiche le refus du moteur, par exemple `vies_pleines`). Une fois
  utilisé il est grisé. Le menu en cercle d'une tour spécialisée montre ses deux
  compétences (rang `n/3` en pastille, prix de `coutCompetence`, grisé d'après `validerAction`, achat par
  `ameliorerCompetence`) avant « Vendre » et « Ralliement » ; la tour divine y prend le sprite du dieu de la partie.
- **Écrans de méta-progression** (depuis la carte du monde) : `fiche-choix.ts` (dans la fiche d'un niveau : le dieu en
  trois symboles, le héros parmi ses trois — disciples pas recrutés grisés avec cadenas et prix —, trois emplacements
  d'objets pris dans le stock ; chaque geste passe par `Session.choisirHeros` et `equiperObjets`, le dernier choix est
  mémorisé), `ecran-heros.ts` (par dieu ses trois héros, niveau et barre d'expérience, quatre compétences avec rangs,
  ultime verrouillée avant le niveau 6, placer un point, reprendre les points, recruter un disciple après
  confirmation), `boutique.ts` (onglet Arbre : 6 branches de 5 rangs, coût en étoiles, tout reprendre après
  confirmation ; onglet Objets : prix en arêtes, stock sur 10), `ecran-meta.ts` (ossature commune : barre du titre, monnaies,
  message de refus, focus gardé au redessin). `meta-vues.ts` (lectures pures de la sauvegarde pour ces écrans),
  `lancement.ts` (`configDuChoix` : la `ConfigPartie` d'après la sauvegarde via `configDepuisSauvegarde` et `DEFS_META`,
  `configDeRelance` pour « Rejouer », `debiterAuLancement` et `relancerAvecDebit` qui débitent les objets du stock au
  lancement d'une partie, y compris « Rejouer »), `raisons-meta.ts` (texte de chaque raison de refus d'une transaction ou d'un
  lancement ; un type `Record` oblige à les traduire toutes). La barre de la carte montre arêtes, braises et étoiles à
  dépenser. Un achat réussi (disciple, rang de l'arbre, objet) joue `jouerInterface('achat')`, un refus `'refus'`.
- **Point d'entrée d'un niveau** : `lancerNiveau(niveauCampagne, config, surFin, options)`. `surFin` reçoit
  une fois le `ResultatPartie` (statut, étoiles, vies, pas, journal) ; `options.surQuitter` ajoute le bouton
  « Quitter » des écrans de pause et de fin ; `options.surDemarrage` donne la `PartieEnCours` (utile aux outils
  de mesure). `options.surVague` reçoit l'état juste après le lancement de chaque vague (sauvegarde de la
  partie en cours) ; `options.reprise` relance une partie depuis un état désérialisé (elle démarre en pause,
  « Rejouer » repart d'une partie neuve) ; `options.vitesse` donne la vitesse du réglage par défaut ;
  `options.surContinuer` remplace « Quitter » par « Continuer » après une victoire. `surFin` peut rendre une promesse
  du butin (`RetourFin` : le `BilanPartie` de `Session.enregistrerFin`, ou la raison du refus des gains) que l'écran de
  fin affiche (arêtes, braises, expérience du héros, niveau gagné, objets consommés et rendus). `options.surQuitter(abandon)`
  reçoit, quand la partie n'était pas finie, un résultat de statut **`abandon`** (ni expérience ni récompense : seuls les
  objets non utilisés sont rendus) que `main.ts` enregistre ; null si la partie était déjà finie. Seule une défaite réelle
  (vies à 0) donne la moitié de l'expérience. `options.surObjet` reçoit l'état juste après chaque utilisation d'objet (la
  partie en cours est rangée aussitôt : sans cela, une reprise rendrait l'objet de nouveau disponible).
  `options.nouvelleConfig` (éventuellement asynchrone, `null` = lancement refusé, l'écran de fin reste) donne la config
  de « Rejouer » : même dieu, héros et objets (ceux que la partie a consommés ne sont plus emportés), niveau et
  compétences du héros d'aujourd'hui, objets débités du stock comme à tout lancement.
- **Carte du monde** (`src/ui/carte-monde.ts`, `src/render/carte-monde.ts`) : le fond de 512 × 288 est peint une
  fois avec `construireSol` et `peindreSol` (le tracé de `TRACE_REGION1`, seulement jusqu'au dernier niveau
  débloqué), le décor de `carte-monde-decor.ts`, un voile sombre et le pointillé de la suite du chemin. Les
  nœuds, leurs étoiles, le clignotement du prochain niveau et le chevron de sélection se redessinent à chaque
  image, avec la `Camera` de la partie (zoom entier : 2 pixels CSS par pixel du fond au départ, pincer ou
  molette pour tout voir). Ce que la carte montre (nœuds visibles, étoiles, tronçons, voisin d'une flèche,
  nœud touché) est calculé par des fonctions pures (`carte-monde-logique.ts`) d'après la sauvegarde. La fiche
  d'un niveau (nom, ambiance, étoiles par difficulté, difficulté, choix du dieu, du héros et des objets, Lancer)
  est en DOM, en deux colonnes en paysage. La barre du haut (arêtes, braises, étoiles) suit la sauvegarde de la session
  (`Session.surChangement` : autre onglet, écriture) et se remet à jour à la fermeture d'un dialogue, même sous une fiche
  ou une confirmation ouverte ; les nœuds sont lus à l'ouverture : pour voir une victoire ou un import, on rouvre la
  carte (les écrans des héros et de la boutique la ferment, puis la rouvrent).
- **Options** (`src/ui/options.ts`) : volume du son (lu par le moteur de son, voir « Son » ; le curseur de musique est
  masqué jusqu'au jalon 5, le réglage reste en sauvegarde), vitesse par défaut,
  export (code à copier) et import (un code refusé affiche sa raison via `import-refus.ts` et n'altère rien ;
  un code valide demande confirmation avant de remplacer la progression et abandonne la partie en cours).
- **Enchaînement des écrans** (`src/main.ts`) : accueil, carte du monde, héros, boutique, partie, options. Il ouvre
  le stockage et une `Session` (`src/save/session.ts`, avec `DEFS_META` de `src/data/heros.ts`) qui garde la
  sauvegarde courante et l'écrit à chaque changement :
  `lancerPartie` (objets emportés débités du stock sous verrou, refusé si le stock ne couvre plus le choix),
  `enregistrerFin` (victoire : meilleur résultat conservé, niveau suivant débloqué, arêtes et braises ; victoire ou
  défaite : expérience du héros joué ; abandon : rien de tout cela ; toujours : objets emportés non utilisés rendus au
  stock, partie en cours effacée, pour un abandon seulement si c'est la sienne ; rend le bilan), `rangerPartie` (début de
  chaque vague et après chaque objet utilisé), `effacerPartie`, `surChangement` (écouteurs de la sauvegarde),
  `partieAReprendre` (état relu pour « Reprendre à la vague N »), réglages, export et import. Les raccourcis de
  test « Niveau 10 » et « Niveau de test » de l'accueil n'existent qu'en développement (`import.meta.env.DEV`)
  et ne touchent pas à la sauvegarde.

## Méta-progression et sauvegarde v3 (`src/save/`, `src/data/meta.ts`)
**Format v3** (`format.ts`) : `{ version: 3, progression, reglages, meta, partie }`. `meta` contient :
- `monnaies` : `{ aretes, braises }`, entiers de 0 à 99 999 999 ;
- `heros` : les héros possédés, `{ [id]: { xp, competences: { [idCompetence]: rang 1 à 3 } } }`. Les trois avatars (`plume`,
  `charlie`, `pollen`) sont toujours présents ; un disciple acheté s'ajoute à 0 d'expérience ; `xp` plafonné à 1 000 000 ;
- `arbre` : les six branches (`caserne`, `tir`, `magie`, `artillerie`, `sorts`, `heros`), rang de 0 à 5 ;
- `objets` : le stock des quatre objets, de 0 à 10 ;
- `choix` : le dernier dieu, héros et objets emportés (3 au plus), proposés de nouveau au lancement suivant.

Les étoiles dépensées dans l'arbre ne sont pas stockées : on retient les rangs, et les étoiles disponibles se déduisent
(`etoilesGagnees` moins `etoilesDepensees`, le rang n ayant coûté 1 + 2 + … + n). La réinitialisation rend donc toutes les
étoiles, et la validation refuse un arbre plus cher que les étoiles gagnées. Le niveau d'un héros n'est pas stocké non plus :
il se déduit de `xp` avec les seuils de `src/data/heros.ts`.

**Définitions injectées** (`definitions.ts`) : la sauvegarde ne connaît pas les compétences ni les seuils d'expérience
(`heros.ts` appartient au moteur). Les fonctions qui en ont besoin reçoivent un `DefsMeta` (`{ heros: { [id]: { competences:
[{ id, rangMax, niveauRequis }] } }, seuilsXp }`) ; `Session.ouvrir(depot, canal, { defs })` le garde pour ses transactions
et pour valider les imports. Relire le stockage ne le passe volontairement pas : un rééquilibrage de `heros.ts` ne doit jamais
rendre une sauvegarde existante illisible. Sans `defs`, la validation vérifie la forme et un plafond de points (niveau 10) ; avec, elle
vérifie aussi que chaque compétence existe, que son rang est permis, que le niveau requis (6 pour l'ultime) est atteint et
que les points placés ne dépassent pas ceux du niveau (1 point par niveau de héros).

**Transactions** (`transactions.ts`) : `acheterRangArbre`, `reinitialiserArbre`, `acheterDisciple`, `acheterObjet`,
`equiperObjets`, `debiterObjetsDePartie`, `choisirHeros`, `repartirPoint`, `reinitialiserPoints`, `enregistrerFinDePartie`. Chacune est pure, vérifie
ses paramètres (chaînes quelconques venues de l'interface) et rend `{ ok: true, sauvegarde }` (une copie) ou
`{ ok: false, raison }` sans rien avoir changé ; les raisons sont des codes stables (`etoiles_insuffisantes`, `rang_max`,
`braises_insuffisantes`, `deja_possede`, `stock_plein`, `niveau_insuffisant`, `plus_de_points`…) que l'interface traduit.
`enregistrerFinDePartie` étend l'enregistrement d'une victoire : étoiles et niveau suivant, arêtes (30 + 6 × N + 15 par
étoile jamais obtenue sur ce niveau, toutes difficultés confondues ; sinon 10 + 2 × N), braises (5 à la première victoire
d'un niveau, 10 de plus pour un boss, 2 aux premières 3 étoiles d'un niveau ; 80 au plus pour la région 1), expérience du
héros joué (100 + 20 × N, la moitié en défaite, rien pour un abandon). **Objets** : `debiterObjetsDePartie` les retire du
stock au lancement de la partie (refus `objet_hors_stock` si le stock ne couvre plus le choix) ; en fin de partie
enregistrée (victoire, défaite, abandon) `enregistrerFinDePartie` recrédite ceux qui n'ont pas servi, dans la limite de
10. Elle rend aussi un `BilanPartie` pour l'écran de fin (dont `objetsConsommes` et `objetsRendus`). `configDepuisSauvegarde` compose la config
d'une partie (dieu, héros, niveau, compétences, rangs de l'arbre, objets) et refuse un héros ou un objet qu'on n'a pas.

**Règle multi-onglets** (`session.ts`) : le stockage fait foi et les opérations se rejouent dessus. Chaque changement est
une opération pure appliquée deux fois : tout de suite à la sauvegarde en mémoire (l'interface réagit, un refus évident est
rendu sur-le-champ), puis, au moment d'écrire et sous le verrou des onglets, au contenu relu du stockage, avant d'écrire le
résultat. On ne fusionne donc pas deux états (« la plus haute gagne » duplique ou détruit une monnaie qui se dépense) : un achat
fait depuis une vue périmée est revalidé contre la réalité. Si l'autre onglet a dépensé les braises ou acheté le même
disciple, l'achat est refusé et rien n'est débité deux fois ; si l'autre onglet a acheté autre chose, son achat est dans le
contenu relu et le nôtre s'y ajoute. Un rang d'arbre ou un point de compétence vise la valeur vue à l'écran : si elle a
changé, refus `modifie_ailleurs` (pas d'achat d'un rang de plus par surprise). Monnaie et achat sont dans le même document, écrit
d'un bloc : on ne paie jamais sans recevoir. Les opérations dont l'écriture a échoué restent en attente et sont rejouées avec
l'écriture suivante (une seule fois). Sans Web Locks, deux onglets qui écrivent à la milliseconde près peuvent s'écraser ;
l'écrasé perd son opération entière (rien n'est débité à tort) et sa vue se corrige au message suivant du canal.

**Migration v2 vers v3** : progression, réglages et partie en cours sont gardés tels quels, `meta` part de son état de départ
(écrit en dur dans la migration). Rien n'est perdu : les étoiles déjà gagnées sont toutes disponibles pour l'arbre. Les
victoires passées ne rapportent pas d'arêtes ni de braises rétroactives. Fixture figée : `src/save/fixtures/sauvegarde-v2.json`.

**Export et import** : le code porte `progression`, `reglages` et `meta` (pas la partie en cours). Un code d'avant la v3 est
migré (méta de départ). L'import valide tout (taille, somme, JSON, migration, validation stricte **sans** les `defs`, comme une
lecture du stockage) avant de toucher à quoi que ce soit, puis **normalise** avec les `defs` de la session au lieu de refuser
(`normalisation.ts`) : un héros dont les compétences ne tiennent plus (seuils d'expérience ou compétences changés) récupère
ses points, un héros choisi non possédé devient l'avatar du dieu choisi. Il remplace ensuite progression, réglages et méta
d'un bloc. `Session.file` ne se casse plus quand une écriture lève : le rejet va à l'appelant (les écrans le disent), pas aux
écritures suivantes.

**Config de partie étendue** : `validerConfig` (partie en cours) accepte, tous ensemble ou pas du tout, les champs que le moteur
ajoute au jalon 2 (`heros`, `competencesHeros`, `ameliorations`, `objets`) ; une fois `ConfigPartie` étendue côté moteur, les
rendre obligatoires dans `validation.ts`.

## Collection, caisses, défis et sauvegarde v4 (jalon 3 : `src/data/collection.ts`, `src/meta/`, `src/save/`)
**Catalogue** (`src/data/collection.ts`) : 21 skins (`skin_caserne_1..3`, `skin_tir_1..3`, `skin_magie_1..3`, `skin_artillerie_1..3`,
puis un par héros `skin_<id du héros>`) et 12 familiers (`familier_rat`…). Chacun a une rareté, une stat (tour : `degats`, `cadence`,
`portee`, `pvSoldats` ; héros : `pv`, `degats`, `cadence`, `regeneration`) et deux textes (`collection.<id>` et `.desc`, dans
`src/i18n/fr-collection.ts`). Chaque rareté existe dans chaque caisse (un test le vérifie : le tirage n'a jamais de rareté vide).
Les prix, chances, éclats, rangs et bonus sont dans `meta.ts`, qui fait foi : caisse 20 braises, chances 60 / 25 / 10 / 4 / 1,
éclats d'un doublon 5 / 10 / 25 / 60 / 150, rang r vers r + 1 = 20 × r éclats (5 rangs), achat précis 50 / 120 / 300 / 700 / 1 500.

**Tirage** (`src/meta/tirage.ts`) : pur, le hasard est injecté (`SourceAleatoire`, un nombre dans [0, 1)). Un tirage consomme
toujours deux jets : la rareté (jet comparé à des pourcentages entiers, donc sans arrondi flottant), puis l'objet de cette rareté
dans la caisse (équiprobable). Garantie : le compteur gardé **par type de caisse** (`meta.collection.garanties`, de 0 à 9) compte les
caisses sans Épique ou mieux ; à 9, la caisse suivante tire dans Épique, Légendaire, Mythique avec leurs proportions (10 / 4 / 1).
Un test joue 100 000 tirages sans garantie pour chaque graine essayée : chaque rareté sort à moins de 0,5 point de sa chance.

**Hasard et verrou.** Les transactions de session se rejouent sur le contenu frais du stockage (voir « Règle multi-onglets »).
Pour que la caisse ne change pas de résultat à chaque passage, `Session.ouvrirCaisse` tire **une seule fois** deux nombres dans
`crypto.getRandomValues` (`sourceCrypto`), les range dans une réserve (`sourceRejouable`) et rejoue ces mêmes nombres à chaque
passage : le résultat ne dépend que de l'état du joueur écrit (compteur, doublons, braises), et le tirage rendu à l'écran est celui
qui a été écrit. Sans `crypto` (plateforme sans), la caisse est refusée (`aleatoire_indisponible`), jamais tirée avec `Math.random`.

**Bonus** (`src/meta/bonus.ts`, `bonusDeCollection(collection, héros joué, défi)`) : pour chaque tour de base, le skin équipé ;
pour le héros joué, son skin et son familier. Bonus d'un objet = base de rareté (skin 1 / 2 / 3 / 4 / 5 %, familier 1 / 1,5 / 2 / 3 /
4 %) × (1 + 0,25 × (rang − 1)), calculé en entiers de 1/100 000. **Le total d'une tour ou du héros (toutes stats confondues) est
plafonné à +10 %** ; au-delà, chaque stat est réduite dans la même proportion. Le résultat a la forme exacte du champ `bonus` de la
config du moteur : `{ tours: { caserne|tir|magie|artillerie: { degats|cadence|portee|pvSoldats } }, heros: { pv|degats|cadence|
regeneration } }`, en fractions. Vide en défi Fer. Un objet équipé mais non possédé ou mal placé ne donne rien.

**Config de partie** (`config-partie.ts`) : `ConfigMeta` porte maintenant `defi: 'heroique' | 'fer' | null` et `bonus`.
`configDepuisSauvegarde(s, options)` accepte en plus `niveau` et `defi` (surcharge qui rend `ResultatConfigDefi`, avec les raisons
`defi_inconnu` et `defi_verrouille`, à part de `RaisonConfig` pour ne pas changer le code existant de l'interface). Un défi est
refusé tant que le niveau n'a pas ses 3 étoiles (meilleur résultat, toutes difficultés) ; il se joue en Matou et **sans objet
emporté** (la difficulté et les objets demandés sont ignorés, le stock n'est pas regardé). **Alignement avec le moteur** (fait
avec l'interface du jalon 3) : `ConfigMeta.defi` et `.bonus`, et l'extension de la config d'une partie en cours
(`ExtensionConfigV4`), utilisent `DefiPartie` et `BonusCollection` de `src/engine` ; `defi` et `bonus` restent **facultatifs, tous
deux ou aucun**, dans `validerConfig` (une partie enregistrée avant le jalon 3 reste lisible) ; `configDuChoix`
(`src/ui/lancement.ts`) les transmet.

**Format v4** (`format.ts`) : `meta` reçoit trois champs. `regionMax` (1 à 10) : plus haute région ouverte, toujours égale à
`regionOuverte(progression.niveauMax)` (la région r + 1 s'ouvre quand le boss, niveau 10 r, est battu) ; `defis` : par niveau en
chiffres, `{ heroique?: true, fer?: true }`, seulement sur un niveau à 3 étoiles ; `collection` : `possedes` (id vers rang 1 à 5),
`eclats`, `garanties: { skins, familiers }`, `equipes: { skins: { <tour de base ou héros> : skin }, familiers: { <héros> : familier } }`.
La validation est stricte (ids du catalogue en propriétés propres, rangs, garanties de 0 à 9, skin à son emplacement et possédé,
config de partie : `bonus` jamais au-dessus de +10 %, aucun bonus en Fer). Elle n'exige pas que le héros portant un skin ou un
familier soit recruté ; les transactions d'équipement le refusent (`heros_non_possede`) et l'import le corrige
(`normalisation.ts` déséquipe ce qui est porté par un héros absent, sans rien retirer de la collection).

**Migration v3 vers v4** (`migrations.ts`, fixture figée `fixtures/sauvegarde-v3.json`) : tout est gardé tel quel ; `regionMax` est
déduite de `niveauMax`, `defis` part vide, la collection part vide (écrite en dur). Les victoires passées ne rapportent ni éclats
ni défis rétroactifs.

**Transactions** (`transactions-collection.ts`, mêmes règles que `transactions.ts` : pures, copie ou refus sans rien changer) :
`ouvrirCaisse` (débit des braises, tirage, ajout au rang 1 ou éclats du doublon tronqués au plafond, compteur), `monterRang`,
`acheterObjetPrecis`, `equiperSkin` et `equiperFamilier` (`null` pour déséquiper ; un familier par héros, un même familier peut
être porté par deux héros). Refus : `braises_insuffisantes`, `eclats_insuffisants`, `rang_max`, `deja_possede`, `non_possede`,
`emplacement_invalide`, `heros_non_possede`, `type_inconnu`, `objet_inconnu`. `Session` expose `ouvrirCaisse(type)` (rend le
`OuvertureCaisse` : objet, rareté, nouveau ou doublon, éclats, garantie), `monterRang` (qui vise le rang vu : `modifie_ailleurs` si
un autre onglet l'a déjà monté), `acheterObjetPrecis`, `equiperSkin`, `equiperFamilier`.

**Fin de partie** (`enregistrerFinDePartie`, option `defi` de `FinDePartieMeta`, lue par défaut dans `config.defi`) :
- une **victoire en défi** exige un niveau à 3 étoiles (sinon `niveau_invalide`), marque `meta.defis[niveau][défi]` et rapporte
  `BRAISES_DEFI` = 4 braises **la première fois seulement** ; elle ne touche ni aux étoiles, ni au niveau suivant, ni aux arêtes, ni
  aux braises de première victoire, ni aux disciples ; le héros reçoit l'expérience d'une victoire. Défaite et abandon en défi : comme
  ailleurs, sans récompense (le défi n'est pas examiné) ;
- la **première victoire** sur le boss de la région 2 ou 4 (niveaux 20 et 40, `NIVEAUX_DISCIPLE_OFFERT`) offre le premier disciple
  non possédé dans l'ordre Suie, Mastoc, Rouage, Corbeau, Brise-Os, Lanterne (0 d'expérience) — rejouer le boss n'en offre pas de
  plus ;
- la région suivante s'ouvre (`meta.regionMax`) ; le `BilanPartie` porte `defiReussi`, `discipleOffert` et `regionDebloquee`,
  **facultatifs** (absents quand il n'y a rien à signaler), pour ne pas casser le code existant de l'interface.

**Pour l'interface (tâche 5)** : les raisons propres au jalon 3 ne sont pas dans `RaisonConfig`, `RaisonFin` ni `RaisonMeta` (les
types existants de l'interface restent compilables) : `RaisonDefi`, `RaisonCaisse`, `RaisonRang`, `RaisonAchatPrecis`,
`RaisonEquipementCollection`, plus `aleatoire_indisponible` et `modifie_ailleurs` ; leurs phrases sont dans `src/i18n/fr-collection.ts`
sous `collection.refus.*` (le préfixe `meta.refus.*` est réservé à `raisons-meta.ts`, dont un test exige que chaque phrase serve).
Elles sont maintenant dans `RaisonMeta` (`raisons-meta.ts`), les sept phrases `collection.refus.*` comprises.

**Écrans du jalon 3** (`src/ui/`, textes dans `src/i18n/fr-ecrans3.ts`) :
- **Régions** (`regions-monde.ts`) : `REGIONS_MONDE`, les cinq régions montrées, chacune avec son nom, son premier niveau de campagne
  et un `contenu` (10 niveaux, nœuds, tracé, décor et textes) qui vaut `null` tant que ses niveaux ne sont pas livrés. **Seule la
  région 1 est branchée** : pour les régions 2 à 5, remplacer `contenu: null` par les données de `src/data/niveaux/` (numéros de
  campagne dans `niveaux` et `textes`, numéros 1 à 10 dans `noeuds`) ; rien d'autre n'est à toucher. `niveauDeCampagne(numero)` et
  `textesDuNiveau(numero)` retrouvent un niveau dans les régions livrées (reprise d'une partie, bilan).
- **Carte du monde** (`carte-monde.ts`, `carte-monde-logique.ts`, `carte-monde-defis.ts`) : une rangée de flèches et de
  pastilles (un cadenas et le grisé pour une région pas ouverte, qui dit comment l'ouvrir ; PageHaut et PageBas au clavier) passe
  d'une région ouverte (`meta.regionMax`) à l'autre ; chaque changement refait le rendu de la carte pour la région
  (`RenduCarteMonde` est recréé) et se signale par `surRegion` (main.ts garde la dernière région vue). Une région ouverte sans
  contenu annonce que ses niveaux ne sont pas encore dans le jeu. Les numéros affichés et lus dans la sauvegarde sont ceux de la
  campagne (`vueNoeuds(s, noeuds, decalage)`). Les défis réussis sont marqués par `icone-defi-heroique` et `icone-defi-fer`
  posées par l'interface sur le canvas juste après le rendu de la carte (le rendu de la carte n'a pas à les connaître).
- **Fiche d'un niveau** : trois modes (`vueModes` de `meta-vues.ts`). Héroïque et Fer demandent les trois étoiles ; Fer demande en
  plus que le niveau porte `defiFer.familles` (sinon « Ce niveau n'a pas de défi Fer »). Un défi remplace la difficulté par ses règles
  (Matou imposé, aucun objet, familles imposées en Fer, prime de 4 braises la première fois seulement) et retire la section des
  objets (`ChoixFiche.definirDefi`). `surLancer(niveau, difficulte, choix, defi)` donne le défi ; `main.ts` le passe à `configDuChoix`
  et le numéro du niveau à « Rejouer » (`relancerAvecDebit(…, niveau)`), qui garde le défi et prend les bonus d'aujourd'hui.
- **Partie en Fer** : `elementsCaseVide` (menu en cercle) ne propose pas une famille que `validerAction` refuse par
  `famille_interdite` ; une touche d'une famille interdite affiche `refus.famille_interdite`.
- **Apparence** (`apparence.ts`) : `lancerNiveau` reçoit `options.equipes` (`meta.collection.equipes`) et donne au rendu
  (`new Rendu(…, apparenceDeLaPartie(equipes, héros joué))`) tous les skins équipés et le familier du héros joué. L'apparence ne
  dépend pas du défi : en Fer les skins restent visibles, seul le bonus est ignoré (`config.bonus` vide).
- **Caisses** (`caisses.ts`) : depuis la boutique (boutons « Caisses » et « Collection » ; « Fermer » des deux écrans revient à la
  boutique, `main.ts` les enchaîne). Les deux caisses, le prix (20 braises), les cinq chances lues dans `CHANCES_RARETE`, la
  garantie restante (`CAISSES_AVANT_GARANTIE` moins le compteur : « Épique garanti dans N caisses », « à la prochaine caisse » à 9) et
  l'ouverture par `Session.ouvrirCaisse` : une révélation en CSS (la caisse tremble 0,7 s, puis l'objet, sa rareté, « Nouveau » ou
  « Doublon » avec les éclats, « La garantie a joué »), « Continuer » ou Échap la ferme. Tant que la révélation est affichée ou
  qu'une ouverture est en cours, aucun second geste ne part (pas de double débit) ; un refus (braises, hasard indisponible,
  écriture impossible) est dit et rien n'est révélé.
- **Collection** (`collection.ts`, lectures pures dans `collection-vues.ts`) : trois onglets. *Skins* et *Familiers* : tout le
  catalogue, les objets possédés en couleur et les autres en silhouette, rareté, rang (pastilles), bonus actuel (ou au rang 1), monter
  d'un rang (20 × rang éclats), acheter un objet précis en éclats, équiper un skin sur sa tour de base ou son héros (un skin d'un
  même emplacement remplace l'autre), choisir le héros recruté qui porte un familier (un par héros, le même familier peut aller sur
  plusieurs). *Équipement* : les quatre tours et les héros recrutés, ce qu'ils portent, « Retirer », et le total de leur bonus
  lu dans `bonusDeCollection` (donc plafonné à +10 %, avec l'indication « plafond atteint » quand le brut le dépasse). Les skins
  s'affichent avec l'icône de la tour ou du héros qu'ils habillent (la silhouette sert aux objets pas possédés) : montrer le skin
  recoloré demanderait que `AtlasRendu` expose ses pixels.
- **Bilan de fin** (`lignesBilan`, `ecrans.ts`) : en plus du butin, « Défi Héroïque réussi : +4 braises », « <disciple> rejoint tes
  héros ! » et « Région ouverte : <nom> » quand le `BilanPartie` les porte.

## Grille de construction (pose libre des tours, `src/engine/grille.ts`)
Les socles fixes ont disparu (spec « Pose libre des tours », changement du 2026-10-28). La carte (32 × 18 tuiles) est découpée en
**cases de `REGLES.tailleCase` = 2 tuiles de côté, 16 × 9 cases** ; une tour se pose sur n'importe quelle case libre et **son centre
est le centre de la case** (`tour.x = (cx + 0,5) × 2`). Deux tours ne partagent jamais une case ; il n'y a pas d'autre règle d'écartement.
- **Données du niveau** : `Niveau.casesInterdites: CaseGrille[]` (`{ cx, cy }`, colonne et ligne depuis le coin nord-ouest). Le moteur
  ne lit pas l'habillage : `src/data/niveaux/grille-niveau.ts` les calcule à l'assemblage (`casesInterditesDuNiveau(carte, decor)`)
  depuis les chemins du niveau (tuile dont le centre est à 1 tuile ou moins de l'axe, la règle du sol dessiné de `render/sol.ts`, un test
  les garde identiques) et les **grands décors** visibles (`GRANDS_DECORS` de `habillage.ts` : tuile recouverte de plus de
  `RECOUVREMENT_MIN_DECOR` = 0,25 tuile par l'emprise du sprite). Une case est interdite si l'une de ses 4 tuiles est bloquée ; l'herbe,
  les fleurs, les petits cailloux et tout décor de 16×16 ne bloquent pas. `NIVEAU_TEST` (region1.ts) n'a pas de décor : seul le
  chemin interdit des cases. Les cartes dessinées (`CarteModele`) n'ont plus de socles ; les plans (`PlanNiveau`) n'ont plus de `socles`.
- **Actions** : `construire { cx, cy, tour }` ; `ameliorer`, `specialiser`, `ameliorerCompetence`, `vendre` et `deplacerRalliement`
  visent la tour posée sur la case `{ cx, cy }`. `Tour` porte `cx` et `cy` (et plus `socle`), les événements `construction`,
  `amelioration`, `vente` et `competence_tour` aussi. `VERSION_ETAT` 5 et `VERSION_DONNEES` 8 : une partie enregistrée avec des socles
  se relit en échec et est oubliée à la reprise (règle existante de `Session.reprendre`), un journal de l'ancien format est refusé.
- **Refus** (`RaisonRefus`), dans l'ordre où `validerAction` les rend pour `construire` : `action_invalide` (cases non entières ou
  absentes), `case_hors_carte` (hors de la grille), `case_interdite` (chemin, grand décor), `case_occupee`, puis les refus de famille et de
  prix existants (`une_seule_divine`, `famille_interdite` du défi Fer, `aretes_insuffisantes`), avec **`caserne_sans_chemin`** inséré
  avant le prix : une tour à soldats (la caserne, la tour divine de Plume) n'est constructible que là où le point du chemin le plus
  proche du centre de la case est à portée (`ralliementParDefaut(chemins, cx, cy, portee)`, portée 3,5 pour la caserne (tous ses niveaux),
  3,5 pour le Sanctuaire) ; ce point devient son ralliement par défaut. Les autres familles restent permises sur cette case. Pour les autres actions
  sur une case sans tour : `case_vide`. Conséquence de la géométrie : le centre d'une case est à 2 tuiles d'un axe de chemin impair
  (une ligne de cases interdite), à 3 tuiles d'un axe pair (deux lignes interdites) ; la caserne (portée 3,5) atteint donc un chemin depuis toute
  case voisine, quel que soit l'axe (avant, à 2,5, elle ne se posait qu'à côté des tronçons d'axe impair). `niveaux.test.ts` garde qu'aucun des
  50 niveaux n'est sans case de caserne et que chaque défi Fer a ses deux familles jouables. La puissance (`puissanceTour`) ne compte pas
  l'élargissement du ralliement (`EQUILIBRAGE.elargissementRalliement`, 1 tuile) : elle reste celle de la portée d'avant.
- **API pour l'interface** (exportée par `src/engine/index.ts`) :
  - `caseSousPoint(carte, x, y): CaseGrille | null` : la case qui contient un point en tuiles (le point du toucher converti par
    `rendu.enTuilesX/Y`), null hors de la carte ; `centreCase(cx, cy): Point` : où dessiner l'éclat, le menu, la portée ;
    `caseExiste(carte, cx, cy)`.
  - `estCaseInterdite(niveau, cx, cy)` et `tourSurCase(etat, cx, cy)` : de quoi dire « case interdite », « libre » ou « occupée » sans
    passer par une action ; `casesLibres(etat): CaseGrille[]` (ni interdites ni occupées, sans tenir compte du prix, de la famille ni de la
    caserne) ; `toutesLesCases(carte)`, `colonnes(carte)`, `lignes(carte)`.
  - **Le refus précis se demande à `validerAction(etat, { type: 'construire', cx, cy, tour })`** : `null` si permis, sinon la raison.
    `elementsMenu(etat, cx, cy)` (menu en cercle) l'utilise déjà : les familles refusées y sont grisées avec leur raison, et
    `src/ui/refus.ts` donne le texte de chaque raison (`refus.case_*`, `refus.caserne_sans_chemin`).
  - `Interaction.toucher` ouvre le menu de la case touchée (`Mode.menu { cx, cy }`) ou renvoie `refus: 'case_interdite'` sur une case
    interdite sans tour ; `Surbrillance` porte `cx`/`cy` (la case dont le menu est ouvert, -1 si aucune) et `portee`.
- **Visée à l'écran (`src/ui/interaction.ts`, `src/render/rendu.ts`)** : rien n'est dessiné tant qu'on ne vise pas. `Interaction.viser`
  (souris qui survole, ou doigt posé) mémorise la case sous le pointeur, `cesserDeViser` l'efface (doigt levé, glissé de caméra, pincement,
  souris sortie de la carte) ; `Surbrillance.viseeCx/viseeCy/viseeInterdite` la donnent au rendu, qui dessine un voile et quatre coins
  (clairs si la case est libre ou porte une tour, rouge sombre si elle est interdite sans tour : chemin, grand décor). Pendant la visée
  du héros, d'un sort, d'un objet ou d'un ralliement on désigne un point libre : aucune case n'est éclairée. Les touches 1 à 5
  (`construireSurSelection`) construisent sur la case survolée, sinon sur celle dont le menu est ouvert ; le moteur dit pourquoi si elle
  est interdite.
- **Aperçu au survol du menu** : chaque `ElementMenu` « construire » porte `apercu { portee, ralliement }` (portée de la tour de niveau 1,
  bonus compris ; pour la caserne, le point de ralliement que le moteur lui donnera). Le HUD signale le bouton survolé à la souris ou pris
  au clavier (`survolerElement`) ; le rendu trace cette portée depuis la case du menu et, pour la caserne, le ralliement par défaut. Au
  doigt il n'y a pas de survol : toucher un bouton construit tout de suite, la portée n'est donc pas prévisualisée.
- **Cases de 44 px au moins au doigt** : sur un écran tactile (`(pointer: coarse)`), `Rendu.definirCibleCase(44)` donne à la caméra un
  zoom plancher (`zoomPourCase(ratio, 44)` = plus petit zoom entier dont la case fait au moins 44 px CSS : 2 à 812×375 avec un ratio de 1
  ou de 1,25, 4 à 2,625, 5 à 3). La caméra ne dézoome pas en dessous, la carte défile : c'est la solution la plus simple (pas de mode
  « zoomer pour viser »). À la souris, aucun plancher : le zoom reste libre.
- **Tours centrées dans leur case** : le moteur pose le centre de la tour au centre de la case, et l'ancre des sprites est au pied du
  fût ; le rendu dessine donc une tour posée `DECALAGE_BASE_TOUR` = 6 pixels plus bas (`suivi.ts`), pour que l'empreinte au sol, qui
  s'étend sous le pied, soit centrée (tireur, projectiles et fumées suivent). Horizontalement les sprites sont déjà centrés à 2 pixels
  près (test sur l'atlas, `decalage-tour.test.ts`). Les tourelles des héros et des tours divines, posées n'importe où, ne sont pas
  décalées. Une tour posée ne dépasse pas 28 px de large (contour compris, tous cadres), pour garder un écart visible entre deux tours voisines : `largeur-tours.test.ts` le vérifie sur l’atlas, centrage à 2 px près. Ordre de dessin : clé de tri = ordonnée du centre de la case, donc une tour plus au
  sud recouvre le haut des tours qu'elle masque (les tours hautes de 48 px s'empilent en colonne sur des cases voisines).
- **Simulateur** : les bots jouent toutes les cases libres. Le naïf les classe par distance au chemin (avec un bruit). Le soigneux
  garde une recherche raisonnable : pour chaque famille et pour la tour divine, il classe une fois pour toutes les cases où la tour voit
  du chemin (longueur vue, pesée par la menace de chaque chemin ; la caserne seulement là où elle a un chemin à portée), n'examine à
  chaque achat que les `CASES_PAR_FAMILLE` = 30 meilleures qui sont libres, et compte la puissance qui couvre chaque point du chemin avec
  un **rendement décroissant** (`utilite(D) = D / (1 + D / SATURATION_DPS)`, 30 dégâts par seconde) : sans cela, le bot empile tout sur le
  meilleur virage, un joueur répartit sa défense.

## Niveaux de la campagne (`src/data/niveaux/`)
50 niveaux (régions 1 à 5), numérotés de 1 à 50 ; le numéro de campagne est le niveau L du budget b(L, w).
- `modele-carte.ts` : la structure d'une carte et ses constructeurs. Les cartes dessinées à la main (chemins, départ du héros,
  zones de sol, décor ; plus de socles depuis la pose libre des tours) sont dans `cartes.ts` (région 1, 4 cartes) et `cartes-region2.ts` à
  `cartes-region5.ts` (3 cartes par région : une à un chemin, deux à deux chemins) ; `cartes-toutes.ts` les rassemble (`CARTES`).
  Les cartes des régions 2 à 5 ont été produites par un script jetable (décor réparti, tuiles `r<N>-…` choisies par `region`),
  puis se retouchent à la main. Un niveau n'emprunte qu'un chemin ou les deux.
- `plan-niveau.ts` : le type `PlanNiveau`, les ennemis de chaque région (`ENNEMIS_REGIONS`), les boss (`BOSS_REGIONS`) et
  `ennemisDuNiveau` : ceux de la région, un de plus à chaque niveau (tous au niveau 3), puis dès le niveau 4 ceux des
  régions précédentes. `plan-region<N>.ts` : pour chacun des 10 niveaux, la carte, les chemins choisis, les
  ennemis, le nombre de vagues, la graine, les arêtes de départ et **`defiFer`** (les deux familles du défi Fer : elles
  savent toucher les volants et révéler les furtifs quand le niveau en compte, et varient d'un niveau à l'autre ; un test
  le vérifie). `assemblage.ts` en tire un `NiveauCampagne` (identifiant `r<région>-<nn>`), n'en garde que le décor qui ne
  recouvre pas un chemin utilisé, et calcule `Niveau.casesInterdites` (voir « Grille de construction » ci-dessous). `campagne.ts` assemble les 50 niveaux (`CAMPAGNE`, `REGIONS`, `niveauDeCampagne`).
- `vagues-region<N>.ts` : vagues **figées**, générées par `npm run niveaux` (`npm run niveaux -- 3` : une seule région) avec
  le générateur d'équilibrage (budget b(L, w)). Jamais de génération à l'exécution. Un niveau marqué `retouchees: true` dans
  le plan garde ses vagues retouchées à la main ; un test vérifie que les autres correspondent au générateur. Les essaims
  arrivent par groupes entiers. Le niveau 10 de chaque région ajoute son boss à la dernière vague. Les fichiers des
  régions 2 à 5 pèsent de 230 à 550 Ko de source : à charger à la demande si le poids du jeu devient un souci.
- Budget : la croissance par niveau est pleine jusqu'au niveau 10 (`croissanceNiveau` 0,15) puis plus lente
  (`croissanceNiveauSuite` 0,03), car les tours n'ont que quatre niveaux et un nombre de cases utiles borné : sans cela les
  régions 2 à 5 deviennent impossibles à tenir sans amélioration (voir `balance-report.md`).
- `carte-du-monde.ts` : positions des 10 nœuds et tracé de la route de chacune des 5 régions sur le fond de 512 × 288
  (`NOEUDS_REGIONS`, `TRACES_REGIONS`, `noeudsDeRegion`, `traceDeRegion`) ; `src/ui/regions-monde.ts` les branche.
- Le chemin est supposé dessiné sur 2 tuiles de large (`DEMI_LARGEUR_CHEMIN` dans `habillage.ts`) : le décor reste à au moins
  1,25 tuile de l'axe, et les cases du chemin sont interdites à la construction.
- Aperçus : `npm run niveaux:apercu -- carte <id>` (texte), `-- planche` (PNG des 12 cartes des régions 2 à 5, avec les vrais
  sprites : `docs/cartes/regions-2-a-5.png`) ou `-- planche <région>` (`art/apercu/`, non suivi).
- **Élites en Vieux Sage** : `Difficulte.vaguesElites` (0 en Chaton et Matou, 2 en Vieux Sage) : le moteur joue les groupes (hors
  boss) des dernières vagues en élite. `Niveau.sansElites` l'écarte : les niveaux de la région 1, dont les bandes de Vieux Sage
  (jalon 2) ne tiennent pas avec elles, en sont marqués ; le défi Héroïque garde ses élites partout. `VERSION_DONNEES` 7.

## Équilibrage de la région 1 (`npm run balance`)
Le simulateur de `src/equilibrage/` rejoue les 10 niveaux dans les 3 difficultés, pour **chacun des 3 dieux avec son avatar**
(sans amélioration ni objet), avec deux bots, et écrit `balance-report.md` (à relancer et commiter après tout changement de
`src/data/`). Les bandes cibles sont vérifiées par `src/equilibrage/bandes-*.test.ts` (un fichier par difficulté ; les trois
dieux se calculent chacun dans un fil à part, `bandes.travailleur.ts`, donc le temps d'un fichier est celui d'un dieu) et par
`npm run balance` (mêmes 10 graines et 2 graines d'entraînement : mêmes résultats, code de sortie 1 si une bande n'est pas
respectée, **tant que les bandes sont imposées : voir ci-dessous**). `npm run balance` joue en plus les vérifications supplémentaires du rapport : disciples comparés à leur avatar,
arbre au maximum et héros de niveau 10 en Vieux Sage, soigneux sans tour divine (profils de `profils.ts`). Pour la mise au point,
`npm run balance -- --dieux=plume --difficultes=matou --graines=5 --detail [--profils=disciples,progression,divine]` ne joue que
ce qui est demandé et affiche un résumé (sans écrire le rapport). Ce qui a été réglé, et pourquoi :
- Les défenses complètes arrêtent presque tout : la difficulté vient des premières vagues (défense encore maigre) et de la
  densité des colonnes. D'où `intervalleReference` à 0,3 s (colonnes serrées), `croissanceVague` à 1,2 (dernières vagues
  énormes, qui seules arrêtent le héros seul) et `budgetBase` 260, `croissanceNiveau` 0,15.
- `aretesDepart` de chaque niveau est le levier fin : il fixe la courbe de difficulté (vies restantes du bot naïf en Matou :
  de 3,8 à 15,9 aux niveaux 1 à 4, moins de 1 à partir du niveau 5, 0,2 au niveau 10). Il joue en falaise : sous un seuil propre à chaque carte (autour de 210 au
  niveau 4), le bot soigneux ne tient plus les premières vagues et passe de 100 % de victoires à 60 %.
- Chaton est nettement plus facile que Matou (ennemis à 60 % de leurs PV, 150 % des arêtes de départ, primes ×1,25) pour que
  le bot naïf y gagne tout alors qu'il perd souvent en Matou. Ses paramètres n'ont pas bougé au durcissement de Matou et du
  Vieux Sage ; comme les arêtes de départ par niveau sont communes aux trois difficultés, il a perdu environ un tiers de
  ses arêtes de départ aux niveaux 1 à 4, ce que la bande « le bot naïf gagne tout » supporte (24,2 vies en moyenne sur 25).
- Durcissement de Matou et du Vieux Sage (jalon « un joueur attentif ne doit pas tout gagner à 20/20 avec des centaines
  d'arêtes inutilisées ») : Matou passe à 108 % des PV, primes ×0,7 ; Vieux Sage à 127 % des PV, 85 % des arêtes de départ,
  primes ×0,7. Les primes sont le levier qui supprime les arêtes inutilisées : les dernières vagues, énormes, rapportent des
  primes qu'une défense déjà complète ne peut plus dépenser. Les PV créent les pertes de vies du bot soigneux. Le bot soigneux
  lit la composition des vagues futures (`poidsDesChemins` dans `geometrie.ts`), ce qu'un joueur ne voit pas : il est un peu
  optimiste, mais un joueur humain compétent se mesure à lui.
- Les mesures sont très sensibles : un réglage voisin change la variante que le bot soigneux retient à l'entraînement, donc
  son résultat (un niveau à 100 % peut passer à 90 % sur une modification sans rapport). Les tests et `npm run balance` jouent
  la même configuration (10 graines, 2 graines d'entraînement) ; pour juger la marge, rejouer aussi sur d'autres graines
  (`--graines=30`). Régler à la main plusieurs dieux et niveaux à la fois n'y arrive pas : les derniers réglages viennent
  d'une descente par coordonnées (un paramètre à la fois, jugé sur les bandes de tous les dieux).
- Quand les données changent : `npm run niveaux` (vagues figées), `VERSION_DONNEES` + 1, `npm run balance`, puis `npm run verifier`.
- **Bandes imposées et suspendues (après la pose libre des tours)** : `BANDES_IMPOSEES` (`bandes.ts`) est vrai. Sont imposées, par les
  tests `bandes-*.test.ts` et par le code de sortie de `npm run balance`, les bandes que les 50 niveaux tiennent : Chaton, le héros
  seul qui perd, les défis et la puissance des tours. Matou et Vieux Sage (courbe et écart entre dieux compris) sont **suspendues**
  (`FAMILLES_SUSPENDUES`) : `npm run balance` les liste et le rapport les marque, les tests ne les évaluent pas (seul le héros sans
  défense est joué, ce qui garde `npm run verifier` sous 3 minutes) ; `BANDES_SUSPENDUES_IMPOSEES=1 npm test` (ou `npm run balance`) les
  impose pour mesurer ce qui reste. Voir « Rééquilibrage du jalon 3 » ci-dessous pour l'état et les causes.

### Rééquilibrage du jalon 3 (régions 1 à 5 et défis)
Outils : `npm run balance` (rapport complet, environ 6 minutes avec 16 fils), `npm run balance -- --niveaux=11-20 --difficultes=matou,vieux_sage
--graines=10 --entrainement=2 --detail` (une région, un tableau par niveau), `node --import ./tools/niveaux/enregistrer.ts tools/balance/regler.ts
--niveaux=11-20 [--haut=0.6 --bas=0.25]` (cherche, pour chaque niveau, les arêtes de départ où le naïf gagne la part cible, dichotomie sur
ses seules parties ; `GRAINE=` essaie une autre graine de vagues). Le naïf est bien moins cher à jouer que le soigneux : les arêtes de départ
se règlent sur lui, puis le soigneux vérifie.

Ce qui a été trouvé (le soigneux de Charlie perdait presque tout dès la région 2) :
- **Bot soigneux : Guetteurs des Toits.** Il n'y pensait que si les furtifs pesaient 2 % de la menace du niveau ; or onze Délateurs d'une seule
  vague suffisent à vider les 20 vies. Il les prépare maintenant dès qu'un furtif figure au niveau (deux vagues avant la première), en attendant
  d'avoir de quoi les payer, et ne retient que les tours de tir de niveau 1 à 3 (une tour déjà spécialisée en B ne peut plus le devenir).
- **Bot naïf plus raisonnable** : il juge les cases par la longueur de chemin qu'elles voient (et non la distance au chemin), construit sur
  16 emplacements (`EMPLACEMENTS_DEBUTANT`) avant d'améliorer, et fait un Guetteurs des Toits par chemin s'il y a des furtifs au niveau (il lit
  les ennemis annoncés). Sans cela il perdait tout au-delà de la région 2 (invisibles) et n'utilisait jamais ses arêtes.
- **Charlie** n'avait aucun contre aux volants (Corbeau) ni aux furtifs (Délateur), que Plume (tir +60 %, Sanctuaire qui révèle, Voile de
  Nuit) et Pollen (héros à distance) ont : Totem du Colosse : `revele` et `volants` (l'onde touche les volants : `ondeDeChoc`), Chute du
  Colosse : touche les volants, recharge 40 s → 25 s.
- **Vagues** : dans un niveau qui compte un volant ou un furtif, les ennemis ordinaires sont tirés 5 fois plus souvent que lui
  (`EQUILIBRAGE.repetitionOrdinaires`, `genererVaguesNiveau`) : sinon un Corbeau faisait la moitié de la menace des niveaux 11 à 13.
  `croissanceNiveauSuite` 0,03 → 0,015.
- **Élites** : PV ×1,8 → ×1,4 et plus de vie en plus (`viesEnPlus` 1 → 0) : les deux dernières vagues du Vieux Sage ne pouvaient pas être
  tenues par Charlie ni Pollen (un Corbeau élite coûtait 2 vies).
- **Défis** : arêtes de départ ×3 en Héroïque, ×6 en Fer (nouveaux `facteurAretes`), effectifs du Fer ×1,5 → ×0,3 (la vague unique du Fer
  est celle de toutes les vagues ensemble : même avec des milliers d'arêtes, deux familles de tours ne la tiennent pas).
- **Arêtes de départ** des 50 niveaux recalculées avec `regler.ts` (graines de vagues des niveaux 12, 39 et 45 changées : leur mélange
  d'ennemis rendait le niveau injouable pour le naïf à toute arête).

Ce qui n'est pas tenu (suspendu, voir ci-dessus) : en Vieux Sage, Charlie reste loin derrière Plume aux régions 2 à 5 (Charlie 52, 34, 8,
10 % ; Plume 96, 90, 87, 70 %) et Pollen derrière aux régions 3 à 5 ; en Matou, le soigneux ne perd pas au moins une vie sur la moitié des
niveaux (il gagne presque parfaitement), le naïf sort de 30 à 70 % pour certains dieux, et la courbe de difficulté du naïf n'est pas
monotone (les niveaux de boss 10, 30, 40 et 50 n'y sont pas parmi les plus durs : leur seuil de victoire pour le soigneux est bien au-dessus
de celui du naïf). Causes identifiées : le soigneux est de 1,5 à 2 fois plus économe en arêtes que le naïf, donc aucun réglage des arêtes de
départ ne place ensemble le naïf à 30-70 % et le soigneux à la limite de la défaite ; et la puissance de Charlie, centrée sur les soldats,
subit les ennemis qui les tuent ou les contournent (Chasseur de Sorcières, Noyeur, Chien errant en nombre) sans que le Totem ou les sorts
y répondent. Pistes : travailler les héros et sorts de Charlie et de Pollen (et les mécaniques d'ennemis qui visent les soldats) plutôt
que les niveaux.

### Équilibrage du jalon 4 (régions 6 à 10, défis, mode infini)
Outils : `npm run balance` couvre maintenant les 100 niveaux, les défis des dix régions et l'infini (environ 12 minutes avec 16 fils ; le
rapport a une section « Régions 2 à 10 », « Défis, régions 1 à 10 » et « Mode infini »). Mise au point : `npm run balance -- --niveaux=51-100
--difficultes=heroique,fer` (une minute et demie, affiche la réussite du soigneux par défi et par région), `--infini[=chaumes,gue]` (infini seul,
avec `--dieux=` et `--graines=`). `node --import ./tools/niveaux/enregistrer.ts tools/balance/affiner.ts 61-70` règle le `facteurBudget`
des plans niveau par niveau (naïf : 35 à 80 % en Matou, 100 % en Chaton), `regler.ts --levier=budget` en donne une première estimation
(`--levier=aretes` cherche les arêtes de départ comme au jalon 3). Après un changement de plan : `npm run niveaux` (les fichiers des régions 1
à 5 ne changent pas), puis `npm run balance`. Tests : `bandes-chaton`, `bandes-defis` et `bandes-matou` couvrent les 10 régions ; `bandes-infini.test.ts`
mesure l'infini (24 fils, une trentaine de secondes) ; `infini.test.ts` (équilibrage) vérifie l'état sérialisé à la vague 100.

Ce qui a été trouvé et réglé :
- **Budget de menace et ennemis des régions 7 à 10.** À budget b(L, w) égal, le naïf perdait presque tout dès la région 7, même avec 6000 arêtes
  de départ : la menace de la spec ne chiffre ni l'armure de 60 à 90 % (la moyenne armure/résistance sous-estime un Garde Royal) ni les
  invocations. Plutôt que de toucher la formule (les vagues des régions 1 à 5 sont figées et doivent rester identiques), chaque plan des
  régions 6 à 10 a un `facteurBudget` (`plan-niveau.ts`, `generation.ts`) : facteurs de 0,4 à 1,0 (région 6), 0,22 à 0,40 (région 7), 0,27 à 0,67 (région 8),
  0,21 à 0,64 (région 9) et 0,04 à 0,30 (région 10). Il est affiné par niveau parce que la réponse du naïf à ce facteur est chaotique (la composition
  des vagues change à chaque valeur) ; les niveaux 64, 70, 82, 83, 90 et 98 ont changé de graine de vagues (injouables, ou sans leur premier ennemi).
- **Acolyte de Cendre** (avant → après) : 140 PV → 80 PV, 2 Creux toutes les 8 s → 1 Creux toutes les 12 s (un groupe d'Acolytes se multipliait plus
  vite que toute défense dès la vague 3 de la région 10). **Garde Royal** : 200 → 130 PV (la première vague du niveau 81 ne tenait pas dans son budget).
- **Arêtes de départ** (première estimation 1395 à 2795, croissante) : région 6 de 900 à 1530, région 7 de 1155 à 1910, région 8 de 1200 à 2010,
  région 9 de 1220 à 1920 (niveau 81 : 2035), région 10 de 1135 à 1710 (niveau 91 : 1350, niveau 100 : 2870). Elles fixent surtout les défis : Héroïque ×3 et
  Fer ×10 ; la réussite de ceux-ci tient à quelques niveaux qui basculent pour un dieu (Pollen), d'où des retouches de 3 à 25 % par région.
- `VERSION_DONNEES` 10 → 11.
- **Sorties du simulateur** : `ResultatPartie.vagueTerminee` (dernière vague terminée), option `infini` et `vagueMax` de `jouerPartie`.

Résultats (soigneux et naïf, 10 graines ; défis : soigneux, trois dieux ensemble) :

| Région | Chaton naïf | Matou soigneux (Plume / Charlie / Pollen) | Matou naïf | Vieux Sage soigneux | Héroïque | Fer |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | 100 % | 90 / 87 / 100 % | 72 / 14 / 69 % | 70 / 10 / 20 % | 55 % | 62 % |
| 7 | 100 % | 99 / 92 / 94 % | 64 / 27 / 82 % | 81 / 6 / 7 % | 50 % | 87 % |
| 8 | 100 % | 100 / 100 / 100 % | 65 / 28 / 84 % | 95 / 3 / 30 % | 68 % | 79 % |
| 9 | 100 % | 100 / 93 / 90 % | 51 / 21 / 63 % | 86 / 0 / 6 % | 53 % | 90 % |
| 10 | 100 % | 100 / 100 / 100 % | 48 / 23 / 63 % | 99 / 15 / 36 % | 67 % | 88 % |

(Régions 1 à 5, défis : Héroïque 73, 66, 72, 48, 51 % ; Fer 78, 69, 62, 70, 45 %.)

Mode infini : le budget de la vague n valait budget(1) × 1,08^(n−1) ; avec cette croissance le naïf (16 tours, toutes améliorées, 15 000 arêtes
inutilisées) atteignait la vague 100 et le soigneux ne s'arrêtait plus, et les vagues hautes faisaient des milliers d'ennemis. Réglé à
**×1,22 par vague** (mesures avant d'arrêter : 1,12 donne 43 au naïf, 1,15 donne 45 au soigneux, 1,18 donne 38, 1,20 donne 32 à 36 mais le naïf
touche 31), et plafonné à **200 ennemis par vague** (`ennemisMaxParVague`) : au-delà, le budget est rempli avec moins d'ennemis et le surplus devient
un facteur de PV et de prime de toute la vague (`remplirBudget` dans `engine/infini.ts`), si bien que l'état sérialisé reste sous `TAILLE_MAX_ETAT`
(test à la vague 100, trois régions) et que les ennemis vivants restent bornés. Le plafond joue dès la vague 17 environ sur la région 1. Résultats (Matou,
4 cartes de la région 1, 3 dieux, 10 graines) : **soigneux, médiane de la vague 27,5 à 33** ; **naïf, au plus la vague 28** (médiane 9 à 26 : il
meurt souvent au premier mini-boss, vague 10). Autres cartes (information) : médiane du soigneux de 9 à 29. Le soigneux ne cherche pas sa variante en
infini (une seule, équilibrée) et lit les 30 premières vagues. **Plafond des PV du mini-boss : aucun** (30 % + 15 points par mini-boss, linéaire, soit 1,65
des PV du boss à la vague 100) : le budget exponentiel dépasse tout bien avant la vague 80, le mini-boss n'y rend rien absurde.

Ce qui n'est pas tenu (suspendu) : voir la spec, « Équilibrage du jalon 4 ». Chiffres de Vieux Sage ci-dessus : Plume est dans la bande ou au-dessus (70 à 99 %),
Charlie et Pollen très en dessous (0 à 36 %) ; ce sont les dieux qu'il faut reprendre (comme au jalon 3), pas les niveaux. Matou : le soigneux gagne 87 à 100 %
(et non tout) aux régions 6, 7 et 9, il perd au moins une vie sur peu de niveaux, le naïf de Charlie sort de la bande par le bas (14 à 28 %) et celui de Pollen par le haut
(82 à 84 % aux régions 7 et 8) ; la courbe de difficulté n'est pas monotone et le niveau 10 n'est pas parmi les 3 plus durs.

### Équilibrage du jalon 5 (moins d'ennemis, plus solides, zone)
Spec : `docs/specs/2026-10-29-densite-ennemis.md`. Les tours de zone dominaient parce que la menace d'un ennemi est linéaire en PV et que les
colonnes étaient serrées (0,3 s entre deux ennemis) : dix ennemis de 50 PV valent un ennemi de 500 PV, et un coup de zone les touchait tous.

Mécanique (`src/data/equilibrage.ts`, `generation.ts`, `plan-niveau.ts`) :
- **Robustesse** : `EQUILIBRAGE.robustesseOrdinaires` = 2. Hors horde, chaque ennemi tiré coûte 2 fois sa menace au budget et son paquet porte
  `facteurPv: 2` (PV et prime ×2, déjà géré par le moteur pour le mini-boss de l'infini) : la menace totale d'une vague (nombre × PV) est
  inchangée, l'effectif est divisé par 2 (de 79 à 41 ennemis par vague en moyenne sur les 90 niveaux ordinaires, 44 à 51 % de moins selon la région).
  Quand le budget restant ne paie plus un ennemi renforcé entier, le facteur baisse (jamais sous 1) : sans cela les premières vagues des
  régions 7 à 10, au petit budget, n'auraient aucun ennemi cher. `menaceVague` compte le facteur. Les boss ne sont jamais renforcés.
- **Espacement** : `EQUILIBRAGE.ecartMinimalTuiles` = 1,3 (la spec demande au moins 0,8 ; un plan peut régler son `ecart`, 0,8 au plus bas). L'intervalle d'un paquet vaut `ceil(1,3 / vitesse)` au
  dixième de seconde supérieur (`intervallePaquet`), hors essaims, qui gardent leurs colonnes serrées (0,3 s). Avec 0,8 la zone sans caserne gagnait
  9 points de plus que sans zone dans les niveaux ordinaires, 7 avec 1,25, 2 avec 1,3 ; avec 1,4 ni la caserne ni la zone n'ont plus d'effet
  (mesures de `zone.ts`, voir plus bas).
- **Horde** : `PlanNiveau.vagues.horde` (et `Niveau.horde`, `NiveauCampagne.horde`) garde la densité d'avant (robustesse 1, colonnes à 0,3 s, essaims).
  Deux niveaux par région : les niveaux 3 et 7 de chaque région (3, 7, 13, 17, …, 93, 97), sur des cartes à virages serrés (le 3 : un seul chemin
  qui serpente) ou à long tronc commun (le 7 : deux entrées qui se rejoignent). Le boss n'est jamais une horde. La fiche du niveau montre
  « Horde » et une phrase d'aide (`src/i18n/fr-horde.ts`).
- **Estimation de puissance** (`dpsEfficace(def, ciblesParRayon, presenceChaine)`) : `ciblesParRayonDeZone` 1,5 → 1,2 (colonne espacée) ; 1,2 est
  la valeur la plus basse qui garde chaque tour à ±15 % de son palier (à 1, la catapulte sort à −17 % et le mortier à −22 %) sans toucher aux
  chiffres des tours. `ciblesParRayonDeZoneBloquees` 3,5 (ennemis arrêtés par des soldats, au contact) et `ciblesParRayonDeZoneHorde` 4,5 ne servent
  qu'au bot soigneux.
- **Format des vagues figées** : six nombres par groupe (le sixième est le facteur de PV, 1 = normal). `VERSION_DONNEES` 11 → 12.
- **Infini** : le moteur utilise le même générateur (robustesse 2 comprise) et multiplie le facteur du plafond par celui de la robustesse
  (`facteurPv × facteurVague`). Le plafond `ennemisMaxParVague` reste à 200 (la robustesse divise déjà l'effectif par deux) et la croissance à ×1,22 :
  soigneux, médiane de la vague 32 à 36 sur la région 1 (bande 25 à 45), naïf au plus la vague 29 (bande : 30).

Bot soigneux (« bloquer puis zone », `bot-soigneux.ts`) : il marque, pour chaque point du chemin, s'il est arrêté par des soldats (à 1,5 tuile du ralliement d'une
caserne) ; une tour de zone y est valorisée avec `ciblesParRayonDeZoneBloquees`, ailleurs avec `ciblesParRayonDeZone` ; une caserne vaut aussi ce
qu'elle apporte à la zone déjà posée (`utiliteBlocage`) et, pour la nouvelle variante « bloquer puis zone » (`VarianteSoigneux.blocage`), à une catapulte
attendue derrière elle. Les variantes passent de dix à douze (6 préférences × 2 diversités). En horde, il estime la zone avec `ciblesParRayonDeZoneHorde`.
`OptionsSoigneux.familles` restreint les familles permises (compositions des mesures).

Mesure de la zone (`src/equilibrage/zone.ts`, tests `zone-ordinaires.test.ts` et `zone-horde.test.ts`, section « La zone » de `balance-report.md`) : taux de
victoire du soigneux (sans tour divine, 45 % des arêtes de départ en Vieux Sage, trois dieux, six graines) avec quatre compositions : sans zone (tir, magie),
zone sans caserne (+ artillerie), caserne sans zone, caserne et zone. Tolérances (chaque taux porte sur 144 parties ordinaires ou 54 de horde) : « pas plus »
= au plus 6 points de plus ; « plus » = au moins 10 points ; horde = au moins 20 points. Résultat du rapport : niveaux ordinaires 59 % sans zone, 61 % zone seule
(+2 points), 58 % caserne seule, 73 % caserne et zone (+15) ; horde 17 %, 59 % (+42), 6 %, 63 %. Les mesures sont sensibles (un seuil de sort du bot, la graine d'un
niveau les déplacent de quelques points) : ne pas resserrer les tolérances sans agrandir l'échantillon.

Rééquilibrage (avant → après) :
- **Régions 6 à 10** : `facteurBudget` refait par `affiner.ts` (naïf entre 35 et 80 % en Matou, 100 % en Chaton) : par exemple niveau 78 : 0,477 → 1,001, niveau 80 : 0,393 → 1,055
  (les ennemis renforcés et espacés rendaient ces niveaux trop faciles), niveau 100 : 0,042 → 0,15 (le héros de Pollen seul le gagnait). Niveau 85 : graine 2085 → 2086
  (le Garde Royal n'y apparaissait plus). Arêtes de départ de la région 10 ×0,92 et de la région 9 ×0,92 puis ×0,9 : le Fer y dépassait 90 %.
- **Régions 1 à 5** : le héros de Pollen seul gagnait en Chaton les niveaux 2 et 4 de la région 1 (ses tirs à distance tuent un à un des ennemis espacés ; aucun ennemi de la
  région n'est volant ni blindé, ajouter le mendiant ou le chien errant au niveau 2 n'y change rien, ni plus de vagues, ni un autre chemin). Premier essai, écarté : un `facteurBudget`
  de 3,2 au niveau 2 (406 ennemis, menace de la vague 6 à 6679 contre 2360 au niveau 3 : un mur au deuxième niveau). Réglage retenu : `PlanVagues.ecart` (écart minimal par niveau,
  jamais sous 0,8) à 0,8 aux niveaux 2 et 4, et `facteurBudget` 1,25 au niveau 2 : niveau 2, 159 ennemis (avant 406) et menace de la vague 6 à 2580 (avant 6679) ; niveau 4, 241 ennemis
  (avant 364, facteur 1,5) et menace 2617 (avant 3958). Le test de croissance mesure la menace réelle (voir plus bas). Niveau 5 : 220 → 280 arêtes (le soigneux le perdait en Matou à la
  graine 8) ; niveau 13 (horde) : 975 → 1250 arêtes (le naïf de Charlie perdait en Chaton).
- **Niveau 100** : `facteurBudget` 0,042 → 0,09 avec `ecart` 0,8 (le héros de Pollen seul le gagnait à 0,042) : 102 ennemis (0,15 en donnait 147, menace de la vague 6 à 1010 ; maintenant 606).
- **Pic de menace** : `campagne.test.ts` vérifie que la vague 6 d'un niveau ordinaire ne dépasse pas 1,5 fois (régions 1 à 5) ou 2,2 fois (régions 6 à 10, dont le `facteurBudget` est réglé niveau par
  niveau sur le naïf, donc non monotone : écarts réels jusqu'à 2,03) celle du niveau ordinaire suivant ; hordes et boss exclus.
- Tests adaptés : les tests de budget de la région 1 tiennent compte du `facteurBudget` du niveau 2 ; le test de rejeu joue le niveau 3 (le plan de construction
  fixe de `bot.test-utils.ts` perd les autres niveaux, sans que le moteur soit en cause) ; les tests de sorts du bot jouent le niveau 10.

Résultats (10 graines, comme les bandes) : voir `balance-report.md`. **Bandes imposées : toutes tenues** (Chaton, le héros seul perd, défis, infini, puissance).
Défis (soigneux, trois dieux), Héroïque / Fer par région : R1 86 / 87 %, R2 77 / 87, R3 83 / 78, R4 85 / 84, R5 81 / 57, R6 80 / 75, R7 66 / 86, R8 89 / 80,
R9 55 / 87, R10 84 / 86 (jalon 4 : R1 73 / 78, R2 66 / 69, R3 72 / 62, R4 48 / 70, R5 51 / 45 pour les régions 1 à 5 ; R6 55 / 62, R7 50 / 87, R8 68 / 79, R9 53 / 90, R10 67 / 88).
Soigneux / naïf en Matou par région, Plume / Charlie / Pollen : région 1 100 / 100 / 100 et 75 / 51 / 98 % ; région 5 100 / 99 / 100 et 81 / 46 / 82 % ;
région 10 100 / 100 / 100 et 80 / 40 / 89 %. Toujours suspendues (Matou et Vieux Sage, comme aux jalons 3 et 4) : Charlie et Pollen très en dessous de Plume en Vieux Sage,
Pollen trop fort pour le naïf en Matou, courbe de difficulté non monotone.

Outils : `tools/cartes/avant-apres.ts` (planche avant/après des chemins). Les effectifs avec et sans robustesse sont comparés par `densite.test.ts`.

### Chemins sur la grille des cases (jalon 5)
Les chemins des 31 cartes (`cartes*.ts`) passent par le centre des cases : coordonnées de tuile impaires (la case `i` couvre les tuiles `2i` et `2i+1`), segments
horizontaux ou verticaux, entrée et sortie par le bord de la carte. Le chemin dessiné (2 tuiles de large) et les cases interdites par le chemin (`tuilesDeChemin`) sont
alors exactement les cases traversées par l'axe : plus aucune case à moitié chemin. `estCaseDeChemin` (engine/grille.ts) le dit ; l'interface n'ouvre ni menu ni
surbrillance de pose sur une case de chemin (le toucher referme seulement le menu ouvert ; une touche de construction, souris sur le chemin, ne construit nulle part). `estCaseDeChemin` repose sur les tuiles du chemin (`tuilesDeChemin`), pas sur l'axe. Conversion faite une fois (chaque coordonnée paire est passée
à l'impair voisin, en gardant l'ordre des coordonnées et sans fusionner deux files ; le script n'est pas conservé : la règle est gardée par les tests). Tests : `chemins-grille.test.ts` (règle sur les 31 cartes) et
`sol-chemin-grille.test.ts` (sol dessiné et cases interdites identiques). Planche : `docs/cartes/chemins-avant-apres.png`. La carte de test (`NIVEAU_TEST`) est alignée aussi (c'est le chemin 0 des Chaumes).

### Équilibrage des trois dieux (jalon 2, tâche 6)
- **Constat.** Le héros porte la difficulté. Les ennemis arrivent en colonnes serrées (0,3 s d'écart) et un héros ne bloque
  qu'un ennemi à la fois : seul le coup de zone de Charlie (il touche tout ce qui est dans un rayon d'une tuile autour de sa
  cible) arrête une colonne. Charlie sans zone ne gagne que 13 % de ses parties Matou, contre 100 % ; Plume et Pollen, sans
  équivalent, perdaient presque tout (Matou : soigneux 8 % et 4 %, naïf 0 %), quelle que soit la force de leurs tirs ou de leurs
  coups simples (huit fois plus de dégâts ne change rien). Les niveaux, réglés sur Charlie, sont restés à peu près tels quels :
  ce sont Plume, Pollen et les disciples qu'on a ramenés au niveau de Charlie, pas l'inverse.
- **Bot soigneux.** Il compte le bonus de famille du dieu (cadence, critique, PV des soldats) et sa remise de prix dans ses achats,
  joue chaque sort selon son effet (voir plus haut) et construit la tour divine des trois dieux, Totem de Charlie compris. Le
  rapport donne les lancers de chaque sort par partie : un sort jamais lancé est du pouvoir perdu.
- **Plume** : le héros frappe en zone (rayon 0,6, 50 % de chances de ralentir de moitié pendant 1,5 s), le bonus des tours de tir
  passe de +15 % à +60 % de cadence et +15 points de critique, Voile de Nuit : recharge 30 s, rayon 3, ennemis à 40 % de vitesse
  pendant 10 s, Griffes d'Ombre : recharge 40 s, rayon 1,6, Sanctuaire : 4 assassins de 110 PV (18 à 26 de dégâts).
- **Charlie** : seul le Totem change (activé dans le bot) : onde toutes les 7 s, étourdissement 1 s. Avec 6 s et 1,5 s, le soigneux
  gagnait 84 % des parties en Vieux Sage, juste sous la bande et 10 points au-dessus de Plume.
- **Pollen** : fronde toutes les 0,22 s (un tireur doit tuer autant de colonne qu'une zone de mêlée), tours d'artillerie à -10 % de
  prix et +15 % de cadence, Pièges à Ressort : 4 pièges, Ingéniosité : +130 arêtes (et non +40) et +80 % de cadence aux tours
  voisines pendant 10 s. L'Ingéniosité est le levier qui donne au soigneux ce que le naïf (qui ne lance aucun sort) n'a pas : plus
  elle rapporte, plus le soigneux monte sans faire monter le naïf, mais à +220 elle laisse des centaines d'arêtes inutilisées aux
  derniers niveaux.
- **Disciples** (écart de vies moyennes du soigneux en Matou, disciple moins avatar : de -1,7 à +0,0 ; bande 3) : Suie, Mastoc et
  Brise-Os frappent en zone (rayons 0,7, 0,8 et 0,7), Mastoc frappe plus fort (14 à 22 toutes les 1,5 s), Corbeau tire toutes les
  0,3 s, Rouage et Lanterne toutes les 0,2 s. Les cadences sont arrondies au pas de 1/30 s : 0,25 et 0,28 s donnent le même résultat.
- **Niveaux** : `aretesDepart` des niveaux 2, 3, 4, 5, 6 et 10 retouché (315, 200, 240, 530, 515, 610) pour tenir ensemble les
  bandes des trois dieux. Le niveau 10 est le plus délicat : le boss dévore les unités au contact, ce qui pèse sur un héros de
  mêlée et pas sur un tireur, si bien que le bot naïf de Pollen y réussit mieux que celui des deux autres.
- **Courbe de difficulté** : jugée sur la moyenne des trois dieux (corrélation de rang au plus -0,6 et niveau 10 parmi les 3 plus
  durs), et chaque dieu doit avoir une courbe décroissante (corrélation au plus -0,3). La courbe de Pollen seule (-0,4) ne tient
  pas la bande de Charlie et Plume (-0,6, niveau 10 parmi les 3 plus durs) : c'est un écart à la spec (« mêmes bandes pour
  chaque dieu »), assumé et documenté dans `bandes.ts`.
- **Progression** : à l'origine, le héros de niveau 10 faisait gagner 83 à 88 % des parties au bot naïf en Vieux Sage (7 à 14 % de
  base) et tout au maximum donnait 100 % au soigneux : trivial. `pvParNiveau` et `degatsParNiveau` des 9 héros sont maintenant
  divisés par 10, les rangs des compétences de héros par 2,5 (hors entiers : capacité, ouvrages, régénération) et ceux de l'arbre
  aussi. Résultat en Vieux Sage, tout au maximum : le soigneux gagne 89 % (Plume), 90 % (Charlie) et 98 % (Pollen), le naïf 33 à
  42 %. Un rang de compétence vaut maintenant peu (quelques points de pourcentage) : à revoir avec les testeurs si le gain paraît
  trop mince.
- **Tour divine** (rapport « Tours divines ») : la formule de puissance des tours communes ne chiffre ni l'étourdissement du Totem,
  ni les assassins non ciblables, ni l'immobilisation des pièges. Le vrai test est le même soigneux, mêmes graines, qui dépense
  ces 200 arêtes en tours communes : le Sanctuaire vaut +16 points de victoires en Vieux Sage (+0,5 vie en Matou), le Totem +4
  points, l'Atelier +10 points. Le Totem est le moins rentable : à surveiller.

## Invariants vérifiés automatiquement
`eslint.config.js` (bloc `reglesSimulationPure`, testé par `src/architecture.test.ts`) interdit à
`src/engine/**` et `src/data/**` :
- d'importer depuis `render`, `ui` ou `save` ;
- d'utiliser les globales du navigateur (`window`, `document`, `localStorage`, `requestAnimationFrame`…) ;
- d'appeler `Math.random`, `Date.now` ou `performance.now` (aléatoire à graine et temps par pas fixes seulement) ;
- d'utiliser les fonctions mathématiques dont le résultat n'est pas garanti identique d'un moteur JS à
  l'autre (`Math.hypot`, `sin`, `cos`, `tan`, `atan2`, `asin`, `acos`, `pow`, `exp`, `log`, `log2`, `log10`,
  `cbrt`, `expm1`, `log1p`) et l'opérateur `**` : seulement `Math.sqrt` et les opérations de base, exactement
  arrondies partout.

## Règles du moteur
- **Entrées non fiables** : les actions (interface, journal relu) sont validées par `validerAction` : forme
  (type connu, cases `cx`/`cy` et emplacements entiers, coordonnées finies, voie `A` ou `B`), puis règles de jeu. Une
  action refusée ne lève jamais d'exception et ne change rien à l'état. Les tables de données ne sont lues que
  par propriétés propres (`Object.hasOwn`).
- **Événements** : `etat.evenements` contient les événements d'un seul pas (actions appliquées à ce pas, puis
  simulation). Le rendu les lit après chaque `step` ou `avancer`. Partie finie : `fin` se lit une fois, puis
  l'appel suivant vide la liste.
- **Arêtes** : calculs en entiers via pourcentages (`src/engine/argent.ts`) : revente à `tauxRevente` %
  arrondie vers le bas, prix et primes ajustés par un facteur ramené à un pourcentage entier.
- **Versions** : `VERSION_ETAT` (format de l'état) et `VERSION_DONNEES` (équilibrage) sont rangées dans l'état ;
  `deserialiser` et `rejouer` refusent une version différente.
- **Fichiers d'aide aux tests** : suffixe `.test-utils.ts` (jamais importés par le jeu, donc absents du build).

## Dieux, héros, objets et arbre dans le moteur (jalon 2)
- **`ConfigPartie`** fixe tout ce qui entre dans une partie : `graine`, `difficulte`, `dieu`, `heros` (l'avatar du
  dieu ou l'un de ses disciples), `niveauHeros`, `competencesHeros` (id vers rang 0 à 3), `ameliorations` (branche
  vers rang 0 à 5), `objets` (0 à 3 ids ; un même objet peut occuper plusieurs emplacements, chacun ne sert qu'une fois), `versionDonnees`. `verifierConfig` (`engine/config.ts`) la
  valide sans lever d'exception (raison en français) ; `creerPartie` lève cette raison et range une copie propre
  (seuls les champs connus). Règles : héros du dieu, rang au plus égal au maximum, compétence de niveau requis atteint
  (l'ultime demande le niveau 6), somme des rangs au plus égale au niveau du héros, branches et objets connus.
- **Données** : `dieux.ts` (Plume, Charlie, Pollen : sorts, bonus de famille, tour divine), `heros.ts` (9 héros avec
  leurs 4 compétences de 3 rangs et `SEUILS_XP` ; `DEFS_META` pour la sauvegarde), `ameliorations.ts` (6 branches de
  5 rangs), `objets.ts` (effets en partie ; prix et stock dans `meta.ts`, qui fait foi), `competences-tours.ts` (les 16
  compétences des spécialisations), `capacites.ts` (valeurs neutres et constructeurs). Un rang donne l'effet total de
  la compétence ou de la branche à ce rang (le rang 2 remplace le rang 1) ; les compétences s'additionnent.
- **Résolution des stats** (`engine/modificateurs.ts`) : le héros est calculé une fois à la création (base, niveau,
  rangs de compétence, branche héros), une tour à chaque construction, amélioration ou achat de compétence (rangs de la
  spécialisation, branche de sa famille, puis bonus du dieu ; les PV des soldats de ces trois sources s'additionnent).
  Le moteur ne relit plus ces tables pendant les pas.
- **Pouvoirs génériques** : une unité alliée porte des `capacites` optionnelles (esquive, exécution, armure ignorée,
  critique, rage, régénération, soin de zone, ciblable ou non, voit les furtifs, attaque à distance, ouvrage). Un héros
  à distance ne bloque personne et reste à son point de garde ; un assassin non ciblable ne bloque personne, n'est visé
  par aucun ennemi et revient à son point. Les soldats peuvent recevoir ces pouvoirs par les compétences de tour.
- **Structures qui durent** (`engine/structures.ts`) : pièges (premier ennemi au sol non immobilisé qui s'approche ; au
  plus `REGLES.piegesMax`, le plus ancien disparaît), zones durables (Voile de Nuit : ralentit et ajoute des points de
  critique aux tirs sur un ennemi de la zone ; nappe de soufre), tourelles construites par une tour (Atelier) ou un
  héros (Rouage) avec durée de vie, ouvrage (construction à cadence fixe jusqu'à un maximum, pose d'un piège sur le
  point du chemin le plus proche à portée). Une tour qui révèle rend les furtifs de sa portée visibles de tous.
- **Sorts et objets** partagent `ZoneEffets` (rayon, sur chemin ou non, global ou non, liste d'effets) et la même
  fonction `lancerEffets` : dégâts, effet, invocation, exécution, zone durable, pièges, arêtes, boost de cadence des
  tours voisines, vies (sans dépasser les vies de départ). Un objet s'utilise par `utiliserObjet {emplacement, x, y}` ;
  l'emplacement ne sert qu'une fois (`etat.objetsUtilises`). L'Herbe de Sabbat (objet qui ne fait que rendre des vies) est
  refusée, donc non consommée, quand les vies sont pleines (`vies_pleines`). Un effet global (Sablier) touche tous les
  ennemis visés de la carte, furtifs non révélés compris. `etat.viePerdue` (VERSION_ETAT 3) devient vrai dès qu'une vie est
  perdue : `etoilesPour(vies, viesDepart, viePerdue)` ne donne 3 étoiles que sans perte, même si l'Herbe a rendu les vies.
  La branche « sorts » raccourcit les recharges.
- **Compétences de spécialisation** : `ameliorerCompetence {cx, cy, competence}` (id de la compétence) achète le rang
  suivant en arêtes (remise de famille du dieu comprise, prix ajouté à la valeur de revente).
- **Événements ajoutés pour le rendu et le son** : `tir_unite`, `esquive`, `soin`, `regain_vies`, `execution`, `zone`,
  `zone_fin`, `piege_pose`, `piege_declenche`, `structure`, `tir_structure`, `structure_fin`, `boost`, `objet`,
  `competence_tour`.
- **Bot soigneux** : joue correctement chacun des trois dieux (voir « Équilibrage des trois dieux » plus bas). Il compte le bonus et la remise de famille du dieu dans la valeur et le prix de ses achats, construit la tour divine (200 arêtes) à partir de la troisième tour pour les trois dieux, et joue chaque sort selon son effet : zones de dégâts sur les grappes, Renforts et Voile de Nuit devant la zone de feu, Pièges à Ressort deux tuiles avant, Griffes d'Ombre sur la plus grosse grappe (4 ennemis ou un boss), Ingéniosité sur le plus gros groupe de tours.

## Ennemis des régions 2 à 5, élites, défis et bonus de collection (jalon 3, moteur)
**Principe.** Aucun ennemi n'est connu du moteur par son nom : `DefEnnemi.pouvoirs` (optionnel, tout y est optionnel) décrit
des mécaniques génériques, copiées dans `Ennemi.pouvoirs` à l'apparition. Les 16 ennemis (12 ordinaires, 4 boss) sont dans
`src/data/ennemis.ts` (ids en `snake_case` ; les sprites suivent le même id en kebab-case, les élites `<id>-elite`), avec des
valeurs de départ cohérentes avec `menaceEnnemi` : l'équilibrage fin est celui de la tâche 6.

| Mécanique | Donnée (`pouvoirs`) | Où dans le moteur |
| --- | --- | --- |
| Tir à distance sur soldats et héros | `distance` (déjà là : Glaneur) | `ennemis.ts`, `attaquerADistance` |
| Volant (ni caserne, ni artillerie, jamais bloqué) | `volant` (déjà là : Corbeau Noir) | idem |
| Relèvement : tombe, intouchable `delai` s, repart avec une part de ses PV | `relevement { fois, pv, delai }` | `degats.ts` (`infligerDegats`) ; une exécution (`executer`) tue pour de bon |
| Brûlure : chaque coup au contact enflamme l'unité (purs/s, non cumulée) | `brulure { duree, degats }` | `ennemis.ts` (`enflammer`), `unites.ts` (`bruler`) |
| Noyade : l'unité qui le bloque (hors héros) ne frappe plus et meurt après `delai` s, sauf si lui meurt ou la lâche | `noyade { delai }` | `ennemis.ts` (`noyer`), `unites.ts` (`noyer`) |
| Drain : PV retirés à l'unité touchée (purs/s) et rendus à l'ennemi | `drain { degats, soin }` | `ennemis.ts` (`drainer`) |
| Essaim : n'arrive que par groupes de cette taille | `essaim` | `genererVague` (`equilibrage.ts`) : paquets en multiples de `essaim` ; rien ne change pour les autres |
| Nuage à la mort : zone qui blesse les unités alliées (purs/s) | `nuage { rayon, duree, degats }` | `pouvoirs-ennemis.ts` (`laisserNuagesDesMorts`, `mettreAJourNuages`) ; `ZoneDurable.degatsAllies` ; seulement s'il est tué, pas s'il s'échappe |
| Soin des ennemis proches (autres que lui) | `soin { rayon, quantite, cadence }` | `pouvoirs-ennemis.ts` (`soigner`) |
| Double dégâts contre le héros | `degatsHeros` | `ennemis.ts` (`degatsContre`), au contact comme à distance |
| Affamer les tours à portée (cadence −30 % pendant 5 s) | action `affamer { rayon, cadence, duree }` | `Tour.affamePas` / `affameCadence`, `tours.ts` (`periodeDeTir`) ; les casernes (cadence de leurs soldats) ne sont pas touchées |
| Désactiver la tour la plus proche | action `desactiver_tour { duree, rayon? }` (sans `rayon`, comme le Juge des Flammes : la première tour en cas d'égalité, l'action compte comme faite même sans tour ; avec, comme le Fagotier : seulement les tours à portée, retentée au pas suivant s'il n'y en a aucune) | `Tour.desactivee` : ni tir, ni onde, ni révélation, ni construction (ses soldats restent) |
| Plongée : intouchable, puis réapparaît plus loin sur son chemin | action `plonger { duree, saut }` | `Ennemi.invulnerable`, `Ennemi.saut`, `pouvoirs-ennemis.ts` (`emerger`) ; un saut qui dépasse la sortie l'y mène |
| Invocation : des ennemis apparaissent à sa hauteur | action `invoquer { ennemi, nombre, ecart }` | `pouvoirs-ennemis.ts` (`appeler`), `ajouterEnnemi` |

- **Paliers et cadences des boss.** `pouvoirs.paliers` (liste décroissante de `{ pv, actions }`, `pv` en fraction des PV maximaux)
  se déclenche une fois par palier franchi, dans l'ordre ; `pouvoirs.periodiques` (`{ cadence, actions }`) se déclenche toutes
  les `cadence` secondes, la première fois après un délai égal. Les deux sont lus par `mettreAJourPouvoirsEnnemis`, appelé au
  début du pas (après les vagues, avant les ennemis). Un ennemi appelé commence au pas suivant.
- **Intouchable** (`Ennemi.invulnerable` > 0, en pas) : à terre (relèvement) ou plongé. Il ne subit ni dégâts ni effets
  (`infligerDegats`, `appliquerEffet`, `executer`), n'est visé par aucune tour, tourelle, unité ni piège, ne bloque personne, ne
  bouge ni n'attaque, et reste compté pour la victoire. Le rendu lit ce champ pour dessiner l'état.
- **Furtif révélé par le Voile de Nuit** : `DefZoneDurable.revele` (vrai pour le Voile) rend visibles les furtifs de la zone.
- **Élites.** `Paquet.elite` marque un groupe de vague ; `ajouterEnnemi(..., elite)` applique `REGLES.elite` : PV ×`REGLES.elite.facteurPv` (1,4), un palier
  d'armure et de résistance de plus (`paliersProtection`, 90 % au plus), prime ×1,5 (arrondie après la difficulté), coût en vies
  `+ REGLES.elite.viesEnPlus` (0). Le type de l'ennemi reste son id : le rendu choisit `<id>-elite` d'après `Ennemi.elite`. **Un boss n'est jamais élite**
  (le drapeau est ignoré, `Ennemi.elite` reste faux).
- **Défis.** `ConfigPartie.defi` : `'heroique'`, `'fer'` ou null/absent. Un défi se joue avec la difficulté de `DIFFICULTE_DES_DEFIS`
  (Matou) quelle que soit celle de la config, et sans objet (`verifierConfig` refuse un défi avec des objets).
  - **Héroïque** : 1 vie (`REGLES.heroique`), tous les groupes hors boss en élite (`creerPartie` réécrit `etat.niveau.vagues`). Les deux défis
    multiplient les arêtes de départ (`REGLES.heroique.facteurAretes` 3, `REGLES.fer.facteurAretes` 6), en plus du facteur de Matou.
  - **Fer** : `creerPartie` fusionne toutes les vagues en une (les groupes gardent leurs délais), effectifs ×`REGLES.fer.facteurEffectifs` (0,3)
    arrondis au-dessus **sauf les boss** (qui restent à leur effectif). Le niveau doit porter `Niveau.defiFer.familles` (deux
    familles de `IdFamille`, différentes) : sinon `creerPartie` lève. Seules ces familles se construisent (`famille_interdite`
    sinon) ; la tour divine suit la famille de son dieu (`bonus.famille` : Plume tir, Charlie caserne, Pollen artillerie). Le bonus
    de collection est ignoré. Hors Fer, `defiFer` n'a aucun effet.
- **Bonus de collection.** `ConfigPartie.bonus` : `{ tours: { <famille>: { degats, cadence, portee, pvSoldats } }, heros: { pv, degats,
  cadence, regeneration } }`, des fractions (0,05 = +5 %). `verifierConfig` refuse une forme inconnue, une valeur négative ou non
  finie, et un total de plus de `REGLES.plafondBonus` (0,1, avec une tolérance de 1e-9 pour les flottants) par famille de tours ou
  pour le héros. Application (`bonus.ts`) : pour une famille, à sa tour de base et à ses spécialisations, **après** le bonus du dieu
  (les deux se multiplient) : dégâts, cadence et portée de la tour, et dégâts, cadence (et PV pour `pvSoldats`) de ses soldats ou
  spectres ; jamais à la tour divine. Pour le héros : PV, dégâts (mêlée et tir), cadence, et régénération (`regeneration` ×
  `REGLES.regenerationBonusHeros` PV/s). Ignoré en Fer.
- **Config d'avant le jalon 3.** `defi` et `bonus` sont optionnels dans `ConfigPartie` (absent = null / vide). `copierConfig` ne les
  range dans `etat.config` que s'ils servent : la config d'une partie ordinaire est inchangée, donc son état et sa sauvegarde aussi.
- **Versions.** `VERSION_ETAT` passe à 4 (champs d'ennemi, d'unité, de tour et de zone). `VERSION_DONNEES` reste à 6 : les ajouts
  ne changent le déroulement d'aucune partie de la région 1 (le test des vagues figées et `npm run balance` le confirment) ; la tâche
  d'équilibrage l'incrémentera.
- **Événements ajoutés** : `releve`, `plongee`, `emergence`, `brulure`, `noyade`, `soin_ennemi`, `famine`, `tour_desactivee`, `appel`
  (le nuage est un `zone` ordinaire, dont la zone d'état porte `degatsAllies`). Chacun a une entrée dans `src/audio/table.ts`
  (son réglé par la tâche du rendu : voir « Son ») ; `RaisonRefus` gagne `famille_interdite` (texte dans `fr.ts`, `refus.ts`).
- **Tests** : `ennemis-regions.test.ts` (12 ennemis), `boss-regions.test.ts` (4 boss), `elites.test.ts`, `defis.test.ts`,
  `bonus-collection.test.ts`, `src/data/ennemis-jalon3.test.ts` (données) et le bloc « essaims » de `src/data/equilibrage.test.ts`.

## Ennemis des régions 6 à 10 et mode infini (jalon 4, moteur)

Tout est piloté par les données (`src/data/ennemis.ts`, `src/data/infini.ts`) ; le moteur ne connaît aucun ennemi par son nom.

- **Pouvoirs ajoutés** (`PouvoirsEnnemi`, `definitions.ts`) : `enterrement` (un soldat tombé à portée met `facteur` fois plus de temps à
  réapparaître, `unites.ts`), `aura` (bonus de vitesse recalculé à chaque pas dans `pouvoirs-ennemis.ts`, le plus fort des bonus
  gagne, jamais la somme ; stocké dans `Ennemi.bonusVitesse`), `renversement` (le Cavalier étourdit une fois l'unité non héros qui
  le bloque, `Unite.etourdi`, et passe), `rage` (sous une part de PV : vitesse et dégâts, dérivée des PV, rien n'est stocké),
  `insensibleRalentissement`, et `Relevement.sauf` (le Creux ne se relève pas d'un coup mortel de ce type de dégâts).
- **Actions de boss ajoutées** (`ActionEnnemi`) : `figer_tour` (`Tour.gel`, même effet que `desactivee`), `aveugler` (`Tour.aveuglePas` et
  `aveugleFacteur`, portée de tir réduite), `bannir` (tue une invocation `spectre` ou `renfort` à portée, sinon étourdit le héros),
  `relever_morts` (relit `etat.morts`, les `REGLES.memoireMorts` derniers ennemis non boss morts), `charger` (`Ennemi.charge` : vitesse ×,
  ignore les soldats, qui ne peuvent plus l'engager), `invulnerabilite`. Une action périodique peut avoir une `phase` `[haut, bas]`
  (fractions de PV) ; hors phase son délai repart de zéro. Une action sans effet (personne à geler, à bannir, à relever) est retentée
  au pas suivant au lieu d'attendre toute la cadence.
- **Infini.** `ConfigPartie.infini = { region }` (1 à 10, `verifierConfig`) : le moteur ignore les vagues du niveau (`niveau.vagues`
  vaut `[]` dans l'état), génère la vague n à son lancement avec `genererVagueInfinie` (`engine/infini.ts`) et ne déclare jamais la
  victoire (seulement la défaite). Une vague ne dépend que de la graine de la config, de la région et de n : ni de l'état ni du
  générateur de la partie, donc le rejeu du journal reste exact et une vague peut se recalculer à volonté. Règles de Matou imposées
  (`difficulteDeConfig`, comme pour les défis), 20 vies, objets et bonus de collection permis, pas de défi. Les arêtes de départ sont
  celles du niveau passé à `creerPartie` ; la carte (chemins, cases interdites) est aussi celle de ce niveau.
- **Budget et tirage.** Budget de la vague n = `budgetVague(1, 1) × 1,08^(n−1)` (par produits successifs : `**` est interdit dans le
  moteur), rempli par `genererVague` (option `budget`) parmi les ennemis ordinaires des régions 1 à `region`. Élites : part
  `partElites(n)` (0 avant la vague 20, 10 %, +5 points toutes les 10 vagues, au plus 60 %), les groupes étant coupés en élites et
  ordinaires par arrondi au hasard (graine de la vague) ; un essaim se coupe par groupes entiers. Mini-boss : `pvMiniBoss(n)`, le boss
  de la région avec `Paquet.facteurPv` (PV et prime × la part), 5 s après le lancement de la vague, avec elle.
- **Vague atteinte et terminée.** `vagueAtteinte(etat)` = vagues lancées ; `derniereVagueTerminee(etat)` = la plus grande vague dont
  tous les groupes sont apparus et tous les ennemis ont disparu, les précédentes comprises. Chaque `Ennemi` porte son `vague`
  (index de 0) : un ennemi appelé ou relevé garde celui de sa source.
- **Versions.** `VERSION_ETAT` 6 (champs d'ennemi, d'unité, de tour, `etat.morts`, `PaquetActif.facteurPv`), `VERSION_DONNEES` 9. Les
  sauvegardes en cours d'une version précédente sont oubliées par la couche de sauvegarde, comme aux jalons précédents.
- **Événements ajoutés** : `enterre`, `renversement`, `tour_gelee`, `aveuglement`, `bannissement`, `resurrection`, `charge`,
  `invulnerabilite`. Sons réglés dans `src/audio/table.ts` avec les sons existants ; le rendu (`src/render/suivi.ts`) les ignore pour
  l'instant (tâches de sprites et d'interface).
- **Tests** : `ennemis-regions-6-10.test.ts` (14 ennemis), `boss-regions-6-10.test.ts` (5 boss), `infini.test.ts`,
  `src/data/ennemis-jalon4.test.ts` (données).

## Statues et inscriptions (jalon 5, « Les dieux sans visage »)

- **Données** : `src/data/niveaux/statues.ts` donne, pour chacune des 31 cartes, la position du pied de sa statue (tuiles) et son origine (colosse, ombre, trois pattes, Église ; sprite `statue-*` de `art/sprites/statues.txt`). L'assemblage (`assemblage.ts`) ajoute le sprite au décor visible et pose `visuel.statue`. La statue est un petit décor de 16×16 : il ne bloque rien. Elle est choisie sur une case que le décor interdit déjà à la construction dans tous les niveaux de la carte, hors chemin : elle ne retire aucune case constructible, donc l'équilibrage ne bouge pas. Test : `statues.test.ts`. Le texte est `inscription.<id de carte>` (`fr-lore.ts`, généré). `npm run niveaux:statues` écrit la planche `art/apercu/_statues.png`.
- **En partie** (`src/ui/statue.ts`, `inscription-partie.ts`, `partie.ts`) : toucher la case de la statue, quand aucune visée n'est en cours (ni héros, ni sort, ni objet, ni ralliement) et que le héros n'est pas sous le doigt, ouvre une fenêtre et met la simulation en pause ; la refermer la relance. Rien n'entre dans la file d'actions ni dans le journal du moteur (méta). `OptionsPartie.surInscription` range l'inscription dans la sauvegarde et dit si elle est nouvelle. Pas de raccourci clavier en partie pour l'instant (le recueil, lui, se parcourt au clavier).
- **Sauvegarde v6** : `meta.inscriptions` (ids de cartes, sans doublon, dans l'ordre de la campagne ; `validation-inscriptions.ts` refuse tout id inconnu). Migration v5 vers v6 : liste vide (fixture `fixtures/sauvegarde-v5.json`). `transactions-inscriptions.ts` : `trouverInscription` ne change rien la seconde fois ; `Session.trouverInscription` l'écrit ; la fusion de deux onglets réunit les listes ; l'export et l'import la transportent avec la méta.
- **Recueil** (`ecran-inscriptions.ts`, `inscriptions-vues.ts`) : bouton « Inscriptions » de la barre de la carte du monde, liste des 31 (trouvée : texte et lieu ; sinon « ??? » et la région), compteur « n / 31 », message d'état vide. Textes dans `src/i18n/fr-inscriptions.ts`.

## Tour divine unique et déblocage progressif des tours (2026-10-30)

Spec : [retours du 2026-10-30](specs/2026-10-30-retours-tour-divine-descriptions.md).
- **Tour divine** : 400 arêtes pour les trois dieux (`src/data/dieux.ts`), une seule posée à la fois par partie : `validerAction`
  rend `une_seule_divine` (ex-`tour_divine_unique`) tant qu'une tour divine est debout, quel que soit le dieu ; vendue, elle se repose.
- **Déblocage** : ce qu'on construit dépend du seul numéro du niveau joué (« rythme du niveau », défis compris). La table est
  `src/data/deblocage.ts` (`DEBLOCAGES` : niveau, famille, palier 1 à 4 ; `NIVEAU_TOUT_OUVERT` = 11). `Niveau.numero` (posé par
  `assemblerNiveau`) la relie au moteur ; un niveau sans numéro (essai) et le mode infini ont tout d'ouvert.
  `src/engine/deblocage.ts` : `niveauDeblocage(etat, action)` dit quel niveau ouvre ce qu'une action `construire`, `ameliorer` ou
  `specialiser` construirait (null si c'est ouvert). `validerAction` rend `non_debloque` après les refus de forme, de case, de tour
  divine unique et de famille du Fer, avant le prix. Les compétences d'une spécialisation viennent avec elle.
- **Interface** : le menu en cercle garde l'élément, grisé, avec un cadenas sur l'icône et, à la place du prix, le numéro du
  niveau de campagne qui l'ouvre dans une pastille aux couleurs d'un nœud de la carte du monde (`ElementMenu.deblocage`,
  `.pastille-niveau`). Choix : un « Niv. N » se lisait comme un niveau de tour (« Améliorer » d'une tour niveau 1 marqué
  « Niv. 2 ») et « Carte N » serait faux (31 cartes pour 100 niveaux) ; le libellé lu dit la phrase entière (« … (se débloque au
  niveau N) »). Le toucher et la bulle disent « Se débloque au niveau N. » (`texteRefus(raison, niveau)`). La fiche d'un niveau
  montre l'encadré « Nouvelles découvertes » (`src/ui/decouvertes.ts`, textes `fr-deblocage.ts`) : icône, nom, une phrase tirée
  des données (pour une spécialisation, son pouvoir : les caractéristiques de la bulle hors dégâts, cadence et portée,
  `pouvoirsTour`) ; éléments `.decouverte` avec `data-tour`, `data-palier`, `data-voie`, `data-niveau`. La tour divine y est celle
  du dieu choisi : l'encadré se refait quand il change (`ChoixFiche.surDieu`). Sur un écran bas (`max-height: 460px`, 740×360),
  l'encadré tient sur une rangée d'icônes (nom et apport dans la bulle et le libellé lu) pour que « Lancer » reste visible.
- **Reprise** : `reprendrePartie` refuse un état dont `niveau.numero` n'est pas le numéro de la partie rangée (il déciderait des
  tours débloquées).
- **Bots** : le naïf et le soigneux écartent ce que `niveauDeblocage` refuse (le soigneux n'économise pas pour une amélioration
  fermée ; les Guetteurs et la tour divine attendent leur niveau).
- **Versions** : `VERSION_DONNEES` 12 → 13 (coût de la tour divine, déblocage) ; une partie en cours enregistrée avant ne se reprend
  pas (règle existante), donc aucune partie sauvegardée ne garde deux tours divines. `VERSION_ETAT` inchangée (`numero` est un champ
  optionnel du niveau rangé dans l'état).

## Gimmicks des niveaux 101 à 150 : aiguillage, Vol de Corbeaux et Radeau (2026-11-08)

Spec : [après l'histoire](specs/2026-11-08-apres-histoire-gimmicks.md), jalon 1, tâches 2 et 3.
- **Format** : `Niveau.gimmick?: Gimmick`, union discriminée sur `type` (`definitions.ts`) : `GimmickCorbeaux`
  `{ type: 'corbeaux', couloirs: { cy }[], coutVies? }` (au moins un couloir, jamais deux sur la même ligne `cy`) et `GimmickRadeau` (plus bas). Un module par gimmick dans
  `src/engine/gimmicks/`, appelé par l'aiguillage `gimmicks/index.ts` : `verifierGimmick(niveau)` à la création de la partie,
  `mettreAJourGimmick(etat)` au début de chaque pas (après `ouvrirPas`, avant les vagues). Chaque `switch` finit sur une valeur
  `never` : un type de gimmick oublié ne compile pas.
- **Couloir** : la ligne `cy` de la grille (comme `CaseGrille.cy`), traversée à la hauteur `centreCase(0, cy).y` de x = 0 à
  x = largeur. `creerPartie` précalcule les couloirs en chemins droits dans `etat.couloirs` (vide sans Corbeaux).
- **Apparition** : `Paquet.couloir?: number` (indice dans `couloirs`) remplace le chemin du groupe (`chemin` vaut alors 0 et
  est ignoré). Seul un volant y est admis (`peutVolerEnCouloir`, vérifié à la création de la partie et par `ajouterEnnemi`).
  `PaquetActif.couloir` et `Ennemi.couloir` valent -1 hors couloir.
- **Mouvement** : `trajetEnnemi(etat, e)` (`chemins.ts`) rend le couloir ou le chemin ; déplacement, fuite, ciblage du plus
  avancé, anticipation des tirs, bouclier frontal et plongée passent par lui. Volant, l'ennemi n'est pas retenu par les soldats et
  seul ce qui vise les volants le touche (règles existantes). À la sortie, il coûte `gimmick.coutVies ?? REGLES.coutViesCouloir`
  (1) cœur, élite comprise.
- **Pouvoirs de chemin** : un ennemi en couloir n'appelle personne (`invoquer`), ne plonge pas (`plonger`), ne se divise pas à
  sa mort et n'entre pas dans `etat.morts` (on ne le relève pas sur un chemin). Le bond ne se déclenche jamais (il faut être retenu).
- **Vagues figées** : dans le format compact, un groupe en couloir k s'écrit avec le chemin −(k + 1). Le générateur
  (`PlanVagues.couloirs`, déduit de `PlanNiveau.gimmick` par `vaguesDuPlan`) envoie les groupes de volants dans les couloirs à
  tour de rôle, sans changer ses tirages ; `assemblerNiveau` copie `plan.gimmick` dans le niveau. Les vagues des régions 1 à 10
  sont inchangées.
- **Versions** : `VERSION_ETAT` 7 → 8 (`Ennemi.couloir`, `PaquetActif.couloir`, `etat.couloirs`). Une partie en cours enregistrée
  avant ne se reprend pas (`deserialiser` refuse, `reprendrePartie` rend null), comme aux hausses précédentes. `VERSION_DONNEES`
  inchangée : rien ne change pour les niveaux existants.

### Radeau (tâche 3, moteur)
- **Format** : `GimmickRadeau = { type: 'radeau', trajet: CaseGrille[], vitesse, places: { dx, dy }[] }`. `trajet` : au moins 2 cases
  de la grille, chacune voisine de la précédente (diagonale comprise) ou alignée avec elle sur une ligne ou une colonne ; `vitesse` en
  cases par seconde (0,5 dans les données, à régler) ; `places` : exactement `REGLES.placesRadeau` (3) décalages en tuiles autour du
  centre. `verifierRadeau` (gimmicks/radeau.ts) le contrôle à la création de la partie : trajet et vitesse valides, places à des décalages
  distincts, et chaque case du trajet (intermédiaires comprises, `casesDuTrajet`) déjà dans `niveau.casesInterdites`. L'assemblage
  (`assemblerNiveau`) les y ajoute pour un niveau à radeau : on ne bâtit pas sur l'eau où il passe.
- **Position = fonction pure du pas** : `positionRadeau(gimmick, pas)` replie la distance parcourue (`vitesse × pas / 30` cases) en
  aller-retour sur la longueur du trajet, puis interpole sur la ligne brisée des centres des cases ; `positionPlace(gimmick, pas, n)`
  y ajoute le décalage de la place. Rien n'est stocké pour le radeau. Le rendu devra appeler ces mêmes fonctions
  pour interpoler entre deux pas : ce sera fait par la tâche du rendu, rien ne le fait encore.
- **Tours du radeau** : `Tour.place` (0 à 2, -1 pour une tour posée sur une case ; une tour du radeau a `cx = cy = -1`). Au début de
  chaque pas, `mettreAJourGimmick` → `deplacerToursDuRadeau` recopie la position de chaque place dans `x`, `y` de sa tour : ciblage,
  portée, projectiles, ondes, révélation, ouvrage de l'atelier, pouvoirs des ennemis et sorts qui visent les tours lisent `t.x`,
  `t.y` et voient donc le radeau où il est. Les tourelles et pièges d'un atelier du radeau restent là où ils ont été posés.
- **Commandes** : les actions de tour prennent un `LieuTour` (`actions.ts`), soit la case `{ cx, cy }`, soit `{ place }` au lieu de
  la case (jamais les deux, sinon `action_invalide`), sérialisable tel quel dans le journal. `tourDuLieu` (grille.ts) trouve la tour ;
  `tourSurCase` ignore les tours du radeau. Refus : `place_inconnue` (pas de radeau, ou numéro hors des places), `case_occupee` et
  `case_vide` comme pour une case (`place_inconnue` est testée en premier, aussi pour vendre, améliorer, spécialiser et acheter une
  compétence), `radeau_sol_requis` pour toute tour qui pose quelque chose au sol (soldats et assassins : casernes, tour divine de Plume ;
  tourelles et pièges : tour divine de Pollen), à la construction comme à une amélioration ou spécialisation qui en donnerait.
  La tour divine de Charlie y est admise.
- **Événements** : `construction`, `amelioration`, `vente` et `competence_tour` portent la case (`cx`, `cy`, -1 sur le radeau), la `place`
  (-1 sur une case) et la position `x`, `y` de la tour à cet instant, pour que le rendu sache où dessiner fumée et éclats.
  `valeurRevente` et `coutCompetence` prennent un `LieuTour`. L'index du moteur exporte `tourDuLieu`, `tourSurPlace`, `positionRadeau`,
  `positionPlace`, `gimmickRadeau`, `casesDuTrajet` et le type `LieuTour`.
- **Versions** : `VERSION_ETAT` 8 → 9 (`Tour.place`). `VERSION_DONNEES` inchangée.

### Région 11 dans la campagne (tâche 5)
- **Plans** : `plan-region11.ts` (niveaux 101 à 110), vagues figées dans `vagues-region11.ts` ; `CARTES`, `PLANS_REGIONS`, `REGIONS` et
  `CAMPAGNE` comptent 11 régions et 110 niveaux. Le boss de la région est le dernier de `BOSS_REGIONS` (le Passeur) ; `ENNEMIS_REGIONS`
  s'arrête à la région 10 (après l'histoire, les plans choisissent parmi les ennemis existants).
- **Eau** : `SOLS_BLOQUANTS` (habillage.ts) dit par région quels sols interdisent la construction (région 11 : la « boue », recolorée en
  eau). `zonesBloquantes(carte)` les donne à `casesInterditesDuNiveau`, appelé par l'assemblage : le moteur ne connaît que les cases
  interdites, rien n'y code « région 11 ».
- **Infini** : `INFINI.regions` a une 11e région (aucun ennemi à elle, donc ceux des régions 1 à 10, et le Passeur en mini-boss) ;
  `NOMBRE_REGIONS_INFINI` (meta.ts, borne de la sauvegarde) en est dérivé, pour rester égal à la borne du moteur. Seules les cartes de
  `CARTES_INFINI_APRES_HISTOIRE` (la Grève, l'Eau Morte) s'ouvrent en infini (`carteInfiniDuNiveau`), et `creerPartie` retire le gimmick
  d'un niveau joué en infini.
- **Bandes** : la CI joue la région 11, mais `REGIONS_SUSPENDUES` (bandes.ts) rend ses écarts non bloquants tant que les bots ne
  savent pas jouer les gimmicks.

## Migration de sauvegarde v7 → v8 (150 niveaux, 15 régions)

Voir `v7versV8` dans `src/save/migrations.ts`. La campagne passe de 100 à 150 niveaux (régions 11 à 15) : `VERSION_SAUVEGARDE` 7 → 8.
- **Avant** : le niveau 100 gagné laissait `progression.niveauMax` à 100 et `meta.regionMax` à 10 (fin de l'histoire, rien après).
- **Règle** : une v7 dont `niveauMax` vaut 100 **et** dont le niveau 100 figure dans `etoiles` (donc gagné) reçoit le déblocage de l'après-histoire :
  `niveauMax` 101 et `regionMax` 11. Toute autre v7 (niveau 100 atteint mais pas gagné, ou plus bas) est gardée telle quelle, version 8 seulement.
  La partie en cours, les réglages et le reste de `meta` ne sont jamais touchés.
- **Validation** : la v8 accepte `niveauMax` jusqu'à 150 et `regionMax` jusqu'à 15 ; `regionMax` doit rester celui que donne `niveauMax` (région N dès le
  niveau 10 × (N − 1) + 1). Les clés de `etoiles` et de `defis` vont de « 1 » à « 150 » (`CLE_NIVEAU`).
- **Code d'export** : un joueur complet fait environ 18 400 caractères quand le navigateur ne sait pas compresser (mode `j`). `TAILLE_MAX_CODE` est donc
  de 32 Ko ; les 64 Ko de données décompressées restent la protection contre les codes démesurés.
- **Tests** : `migrations.test.ts` (fixture figée `sauvegarde-v7.json`, avec ou sans partie en cours), `code.test.ts` (import d'un code v7, export complet sans compression).
