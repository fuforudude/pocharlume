# DLC « Temps modernes » : premiers skins (tours et ennemis), en revue

Statut : livrée le 2026-11-11 (étape skins en pose fixe)
Date : 2026-11-11

## Besoin
Un futur gros patch, façon DLC, transpose le jeu à l'époque moderne : les chats représentent les étudiants, les humains les
forces de l'ordre (CRS, gendarmes, BRAV-M…). Première étape : dessiner tous les skins et pouvoir les voir et les commenter
avant d'aller plus loin. Aucune règle de jeu, aucun niveau, aucun équilibrage dans cette étape.

## Décisions (entretien du 2026-11-11)
- **Tours : les 23.** Les 4 familles × (niveaux 1, 2, 3 + spécialisations A et B) = 20, plus les 3 tours divines. Chaque skin
  garde la lecture de la tour d'origine (même rôle, même silhouette qui grandit d'un niveau à l'autre) dans un habillage
  étudiant moderne : caserne → barricade et occupation (tables, chaises, banderoles, étudiants qui tiennent la ligne) ;
  tir → lanceurs de fortune ; magie → fumigènes, mégaphones, sono, tags ; artillerie → catapulte et engins bricolés ;
  divines → les trois chats suprêmes en figures de la mobilisation (AG, banderole, cortège).
- **Ennemis : une liste propre au DLC** (pas de reskin des 60 ennemis existants), environ 15, chacun calé sur le rôle d'un
  ennemi existant pour que le DLC puisse réutiliser les mécaniques : CRS (base, bouclier), gendarme (base), gendarme mobile
  (plus solide), BRAV-M (binôme à moto, rapide), canon à eau (blindé lent), Centaure (blindé lourd), tireur de LBD (tire
  sur les tours), grenadier lacrymogène (nuage), BAC (en civil, furtif), drone (volant), cavalier de la police montée
  (charge), bouclier anti-émeute (bouclier frontal), commissaire (aura), hélicoptère (volant lourd), préfet (boss).
- **Finition : pose fixe d'abord**, un sprite par skin, dans le style 32×32 du jeu (64×64 pour les boss et les très gros
  engins comme les boss existants). Les animations viendront après validation, seulement pour ce qui est retenu.
- **Revue : une page privée sur claude.ai** avec chaque skin agrandi, la version médiévale d'origine à côté (pour les tours
  et pour l'ennemi dont le DLC reprend le rôle), et un champ de commentaire par skin ; les commentaires reviennent au chef
  de projet.
- **Ton** : satire en dessin, comme le reste du jeu ; ni insigne ni logo réel reproduit (uniformes génériques reconnaissables
  par les couleurs et l'équipement), ni violence réaliste.
- Les sources sont des fichiers texte comme les sprites du jeu, mais rangées à part (`art/dlc-moderne/`) : elles
  n'entrent ni dans l'atlas du jeu ni dans les tests de sprites tant qu'elles ne sont pas validées.

## Critères d'acceptation
- [x] 23 skins de tours et environ 15 ennemis DLC dessinés, sources dans `art/dlc-moderne/`, aperçus PNG générés.
- [x] Le jeu ne change pas : atlas, tests de sprites et `npm run verifier` inchangés.
- [x] Page de revue publiée : chaque skin agrandi, son original à côté, un champ de commentaire par skin, lisible sur téléphone.
- [x] Les commentaires de l'auteur sont relevés et traités dans une passe suivante.

## Livraison (2026-11-11)
- 41 skins validés par l'auteur en quatre passes de revue sur la page https://claude.ai/artifact/VWMGWvx8m6pycg5zHBPYcD
  (23 tours, 3 chats tireurs, 15 ennemis).
- Changements demandés en revue : artillerie devenue lanceur de pavés (caddie gardé, A trébuchet en cloche, B canon à pavés
  en tir tendu), vraies enceintes de sono (membranes prévues pour pulser à l'animation), mégaphone d'or tenu par l'étudiant,
  Charlie sur une voiture de tête avec enceintes, matraque dans la main gauche pour gendarme, gendarme mobile, CRS, bouclier,
  BAC, commissaire et cavalier, canon à eau et Centaure redessinés en 64×64 plus réalistes.
- Les identifiants `moderne-artillerie-bidon` et `moderne-artillerie-lance-pierre` ne correspondent plus aux dessins (gardés
  pour ne rien casser) : à renommer si on veut, avant de brancher les skins dans le jeu.
- Suite : animer les 41 skins (cinq animations du jeu), puis les règles du DLC.

## Hors périmètre
- Règles, niveaux, équilibrage, animations, vente ou déblocage du DLC.
