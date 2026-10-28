# Architecture

Vue d'ensemble des dossiers et de leurs frontières. Les choix de fond sont expliqués dans
[l'ADR 0001](adr/0001-stack-et-moteur-deterministe.md), le contenu du jeu dans
[la spec](specs/2026-10-25-pocharlume.md).

## Dossiers

| Dossier | Rôle | Peut dépendre de |
| --- | --- | --- |
| `src/engine/` | Simulation déterministe : boucle à pas fixe (1/30 s), générateur pseudo-aléatoire à graine, chemins, ennemis, tours, projectiles, soldats, vagues, vies et or, journal d'actions rejouable. Aucune dépendance au DOM : tourne dans Node (simulateur, futur serveur). | `src/data/` |
| `src/data/` | Tables d'équilibrage : tours, ennemis, dieux, difficultés, règles, formules et générateur de vagues (`equilibrage.ts`), version des données (`version.ts`, à incrémenter à chaque changement d'équilibrage), méta-progression (`meta.ts` : ids des dieux, héros, branches de l'arbre et objets, prix, plafonds, formules de gain hors partie). Aucune valeur de jeu en dur ailleurs. Les niveaux figés vont dans `src/data/niveaux/` (un fichier par région). | `src/engine/` : types, et le générateur à graine (`aleatoire.ts`) pour le générateur de vagues |
| `src/render/` | Rendu Canvas 2D : caméra, zoom à pixels entiers sans lissage, sprites, animations, barres de vie, effets. Lit l'état du moteur, ne le modifie jamais. | `src/engine/`, `src/data/` |
| `src/ui/` | Écrans, HUD, menus, toucher, souris, clavier. Traduit les gestes en actions du moteur. | tout `src/` |
| `src/audio/` | Son : moteur Web Audio (`moteur.ts`), limiteur (`limiteur.ts`), données des sons et table événement vers son (`table.ts`), écouteurs du navigateur (`geste.ts`). Ne dépend que du type des événements du moteur et de `src/data/ennemis.ts`. | `src/engine/` (types), `src/data/` |
| `src/i18n/` | Textes affichés. `fr.ts` contient la table, `t('clé')` la lit avec une clé typée. | rien |
| `src/save/` | Sauvegarde. Fonctions pures : format versionné v3 (`format.ts`), validation stricte, migrations en chaîne vN vers vN+1, progression (étoiles, déblocage), méta-progression (`transactions.ts`, `config-partie.ts`, `definitions.ts`), partie en cours, export et import par code (`code.ts`). `Session` (`session.ts`) tient la sauvegarde courante en mémoire et l'écrit à chaque changement ; sa règle multi-onglets est décrite plus bas (« Méta-progression et sauvegarde v3 »). `verrou.ts` exclut les écritures entre onglets (Web Locks) ; `canal.ts` prévient les autres onglets par `BroadcastChannel`, qui se rafraîchissent. Accès au stockage : interface `Stockage` (IndexedDB, repli localStorage, mémoire ; Capacitor Preferences plus tard) et `Depot`, qui ne lève jamais et garde une copie de secours d'une sauvegarde illisible. | `src/engine/`, `src/data/` |
| `src/equilibrage/` | Simulateur d'équilibrage sans affichage : partie jouée par un bot (`simulation.ts`), bot naïf (`bot-naif.ts`) et bot soigneux avec sa petite recherche de variante (`bot-soigneux.ts`), géométrie des cartes, évaluation d'une région (`campagne.ts`), bandes cibles (`bandes.ts`), puissance des tours et des tours divines (`puissance.ts`), profils des vérifications supplémentaires (`profils.ts` : disciples, arbre au maximum, héros de niveau 10, sans tour divine), rédaction de `balance-report.md` (`rapport.ts`). Les bots ne passent que par l'API publique du moteur (`avancer` avec des actions). Réutilisé par `tools/balance/` et par les tests des bandes. | `src/engine/`, `src/data/`, `src/i18n/` |
| `tools/` | Scripts Node : `art` (grilles de pixels vers planches PNG et atlas JSON), `niveaux` (génère les vagues figées de la région 1, aperçu texte des cartes, bilan du joueur automatique ; `enregistrer.ts` permet à Node d'importer `src/` sans extension), `balance` (`npm run balance` : lance le simulateur de `src/equilibrage/` et écrit `balance-report.md` à la racine). | `src/engine/`, `src/data/` |
| `art/` | Sources graphiques : pack Minifolks d'origine (`art/minifolks/`), grilles de pixels en texte (`art/sprites/<nom>.txt`, format décrit en tête de `tools/art/format.ts`), palettes partagées (`art/palettes/`). `npm run art` écrit aussi des aperçus agrandis dans `art/apercu/` (ignoré par git). | — |
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
  d'un facteur entier sans lissage ; `camera.ts` (zoom entier, glisser, pincement, molette, bornes ; la vue peut dépasser la carte de la largeur des barres du HUD, mesurées dans le DOM par `src/ui/marges.ts`, pour que tout socle puisse sortir de dessous un bouton), `sol.ts`
  (sol précalculé depuis les chemins : herbe, chemin avec bords et coins, boue, pavés), `suivi.ts` (une
  représentation par entité du moteur, créée et retirée d'après les événements), `effets.ts` (effets en pool),
  `animations.ts` et `atlas.ts` (sprites). Rien ne s'alloue dans la boucle chaude. **Nouveautés du jalon 2** :
  ce qui dure se lit dans l'état (les zones du Voile de Nuit couvrent par `zones.ts` toutes les tuiles que le rayon
  touche, avec la tuile `effet-voile-nuit-tuile` ; les pièges armés ; les tours dont `boostPas` > 0 portent
  `effet-ingeniosite` ; la rage d'un héros blessé), les tourelles construites sont suivies comme des tours (`Suivi.structures` :
  apparition à la création, destruction par l'événement `structure_fin`), et les événements lancent les effets
  ponctuels (déclenchement d'un piège, exécution, soin, esquive, tir d'un héros à distance ou d'une tourelle, objets
  de `effetObjet`, assassin qui sort de l'ombre). L'assassin du Sanctuaire (non ciblable) est dessiné translucide.
- **Interface** (`src/ui/`) : `interaction.ts` (machine à états pure : menu d'un socle, héros, sort,
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

## Niveaux de la campagne (`src/data/niveaux/`)
- `cartes.ts` : cartes dessinées à la main (chemins, socles et ralliements, départ du héros, zones de sol, décor).
  Une carte propose plusieurs chemins et plus de socles que nécessaire.
- `plan-region1.ts` : pour chacun des 10 niveaux, la carte, les chemins et les socles choisis, les ennemis
  débloqués, le nombre de vagues, la graine. `assemblage.ts` en tire un `NiveauCampagne` et n'en garde que le
  décor qui ne recouvre ni un chemin ni un socle utilisés.
- `vagues-region1.ts` : vagues **figées**, générées par `npm run niveaux` avec le générateur d'équilibrage
  (budget b(L, w)). Jamais de génération à l'exécution. Un niveau marqué `retouchees: true` dans le plan garde ses
  vagues retouchées à la main ; un test vérifie que les autres correspondent au générateur.
- `carte-du-monde.ts` : positions des 10 nœuds et tracé du chemin sur le fond de la carte de région (512 × 288).
- Le chemin est supposé dessiné sur 2 tuiles de large (`DEMI_LARGEUR_CHEMIN` dans `habillage.ts`) : les socles
  sont à 2 tuiles de l'axe, le décor à au moins 1,25 tuile.

## Équilibrage de la région 1 (`npm run balance`)
Le simulateur de `src/equilibrage/` rejoue les 10 niveaux dans les 3 difficultés, pour **chacun des 3 dieux avec son avatar**
(sans amélioration ni objet), avec deux bots, et écrit `balance-report.md` (à relancer et commiter après tout changement de
`src/data/`). Les bandes cibles sont vérifiées par `src/equilibrage/bandes-*.test.ts` (un fichier par difficulté ; les trois
dieux se calculent chacun dans un fil à part, `bandes.travailleur.ts`, donc le temps d'un fichier est celui d'un dieu) et par
`npm run balance` (mêmes 10 graines et 2 graines d'entraînement : mêmes résultats, code de sortie 1 si une bande n'est pas
respectée). `npm run balance` joue en plus les vérifications supplémentaires du rapport : disciples comparés à leur avatar,
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
  (type connu, socles et emplacements entiers, coordonnées finies, voie `A` ou `B`), puis règles de jeu. Une
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
- **Compétences de spécialisation** : `ameliorerCompetence {socle, competence}` (id de la compétence) achète le rang
  suivant en arêtes (remise de famille du dieu comprise, prix ajouté à la valeur de revente).
- **Événements ajoutés pour le rendu et le son** : `tir_unite`, `esquive`, `soin`, `regain_vies`, `execution`, `zone`,
  `zone_fin`, `piege_pose`, `piege_declenche`, `structure`, `tir_structure`, `structure_fin`, `boost`, `objet`,
  `competence_tour`.
- **Bot soigneux** : joue correctement chacun des trois dieux (voir « Équilibrage des trois dieux » plus bas). Il compte le bonus et la remise de famille du dieu dans la valeur et le prix de ses achats, construit la tour divine (200 arêtes) à partir de la troisième tour pour les trois dieux, et joue chaque sort selon son effet : zones de dégâts sur les grappes, Renforts et Voile de Nuit devant la zone de feu, Pièges à Ressort deux tuiles avant, Griffes d'Ombre sur la plus grosse grappe (4 ennemis ou un boss), Ingéniosité sur le plus gros groupe de tours.
