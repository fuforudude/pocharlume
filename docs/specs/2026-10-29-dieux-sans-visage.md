# Les dieux sans visage

Statut : validée le 2026-10-29 (jalon 5)
Date : 2026-10-29

## Besoin
L'utilisateur veut un lore plus cryptique. Plume, Charlie et Pollen ne sont pas des héros : ce sont des entités
mystérieuses dont on n'entend parler que par allusions, dans les descriptions des objets, des tours et des héros, et
dans des inscriptions sur de vieilles statues cachées dans les cartes.

## Décisions (entretien du 2026-10-29)
- **Les trois héros-dieux** (« Plume, l'Ombre Première », « Charlie, le Colosse », « Pollen, Trois-Pattes ») sont
  remplacés par trois **fidèles** mortels, un par dieu, avec exactement les mêmes capacités, compétences et
  identifiants techniques (l'équilibrage et les sauvegardes ne bougent pas). Les dieux ne sont plus jamais incarnés ni
  dessinés.
- **Le choix du dieu avant un niveau** reste (tour divine et sorts), mais sans visage : un symbole, une épithète et
  une phrase cryptique, jamais de portrait.
- **Noms des dieux** : à l'écran, des épithètes qui changent selon l'endroit mais gardent le même ressenti. Les vrais
  noms Plume, Charlie et Pollen n'apparaissent que dans des récits anciens de leurs exploits, que les hommes ont voulu
  faire oublier (inscriptions martelées, fragments effacés) ; jamais ailleurs.
- **Fond de l'univers** (donné par l'utilisateur le 2026-10-29, voir `docs/lore.md`, section Univers) : une très
  ancienne guerre entre chats et hommes ; les trois élus ; Charlie a tenu « la porte » neuf jours, neuf semaines,
  neuf mois, peut-être neuf ans, et protégé la vie ; Plume a abandonné son ombre et terrifié les royaumes humains, la
  mort n'a pas su la trouver ; Pollen, doyenne et générale, n'a laissé que sa patte dans un piège après une embuscade,
  et les pièges ont suivi. La porte a séparé chats et hommes ; elle s'est rouverte, la guerre reprend : c'est le jeu.
  Charlie porte la vie des chats, Plume la mort des hommes, Pollen la guerre des chats contre les hommes.
- **Statues** : une vieille statue cachée dans le décor de chacune des 31 cartes. La toucher pendant une partie révèle
  son inscription une fois pour toutes, rangée dans un recueil « Inscriptions ». Pas de coût, aucun effet sur la
  partie. Inscriptions réparties entre les trois dieux et l'Église du Soleil Blême ; l'histoire se reconstitue en les
  lisant dans le désordre.
- **Réécriture** : un agent réécrit tout `docs/lore.md` en plus cryptique (y compris les 31 inscriptions, les
  épithètes et les trois fidèles) ; l'utilisateur relit et corrige avant le report dans le jeu.

## Périmètre
- Dedans : réécriture des textes ; trois fidèles (noms, textes, sprites redessinés pour ne plus ressembler aux dieux) ;
  écran de choix du dieu sans visage ; 31 statues (sprite de décor, position par carte, zone de toucher) ; recueil
  « Inscriptions » ; sauvegarde des inscriptions trouvées.
- Hors périmètre : effets de jeu des statues ; changement des capacités des dieux ou des héros (la décision sur
  Charlie et Pollen reste à part).

## Critères d'acceptation
- [ ] Les noms « Plume », « Charlie » et « Pollen » n'apparaissent que dans des clés `inscription.*` (test sur `fr`).
- [ ] Aucun écran n'affiche de portrait de dieu ; le choix avant un niveau montre symbole, épithète, phrase.
- [ ] Les trois fidèles ont les mêmes statistiques et compétences que les anciens héros-dieux (test sur les données).
- [ ] Chacune des 31 cartes a une statue sur une case de décor, hors chemin et hors case de tour (test).
- [ ] Toucher une statue en partie révèle son inscription (fenêtre courte, la partie se met en pause) ; une seconde
  fois, rien de nouveau n'est gagné.
- [ ] Les inscriptions trouvées survivent à un rechargement et à l'export/import de la sauvegarde (migration testée).
- [ ] Le recueil « Inscriptions » liste les trouvées (texte) et les autres (« ??? », avec la région).
- [ ] Le toucher d'une statue ne gêne pas la pose d'une tour sur une case voisine (QA au navigateur, 812×375).

## Tâches
1. Réécriture de `docs/lore.md` par un agent (lancée le 2026-10-29) ; relecture par l'utilisateur.
2. Report des textes relus dans `src/i18n/`, test des noms des dieux.
3. Fidèles : textes, sprites, illustrations ; choix du dieu sans visage.
4. Statues : sprite, positions des 31 cartes, toucher en partie, sauvegarde et migration, recueil.
5. Relecture, QA.

## Impacts
- Données / migrations : version de sauvegarde suivante (inscriptions trouvées).
- Écrans : choix du dieu, héros, partie (statue), nouveau recueil.

## Questions ouvertes
- Aucune. Le recueil s'ouvre depuis la carte du monde (bouton à côté de Héros et Boutique).
