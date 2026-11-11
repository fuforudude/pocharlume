# DLC « Temps modernes » : premiers skins (tours et ennemis), en revue

Statut : validée le 2026-11-11
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
- [ ] 23 skins de tours et environ 15 ennemis DLC dessinés, sources dans `art/dlc-moderne/`, aperçus PNG générés.
- [ ] Le jeu ne change pas : atlas, tests de sprites et `npm run verifier` inchangés.
- [ ] Page de revue publiée : chaque skin agrandi, son original à côté, un champ de commentaire par skin, lisible sur téléphone.
- [ ] Les commentaires de l'auteur sont relevés et traités dans une passe suivante.

## Hors périmètre
- Règles, niveaux, équilibrage, animations, vente ou déblocage du DLC.
