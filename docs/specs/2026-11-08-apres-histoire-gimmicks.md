# Après l'histoire : 50 niveaux à gimmicks (régions 11 à 15)

Statut : validée le 2026-11-08
Date : 2026-11-08

## Besoin
Une fois l'histoire finie (niveau 100), gagner des braises est très long : il ne reste que les défis et les paliers de l'infini.
L'auteur veut 50 niveaux de plus, où chaque bloc de 5 niveaux a une particularité (un « gimmick ») qui change la façon de jouer, et qui
rapportent nettement plus de braises.

## Décisions (entretien du 2026-11-08)

### Structure
- 50 niveaux, numéros **101 à 150**, en **5 régions de 10** (régions 11 à 15), après la Cathédrale du Soleil Blême. Chaque région a
  son décor, son lore, **2 gimmicks** (un par bloc de 5 niveaux) et un **boss inédit** au niveau 10 de la région.
- La région 11 s'ouvre à la victoire du niveau 100. La fin de l'histoire reste le niveau 100 (`NIVEAU_FIN_CAMPAGNE`).
- **50 cartes neuves** (aucune reprise).
- Dans un bloc, la difficulté monte ; le 5e niveau du bloc est le plus dur (au niveau 10 de la région : le boss, avec le gimmick du bloc).
- Modes : comme la campagne (Chaton, Matou, Vieux Sage, puis défis Héroïque et Fer à 3 étoiles). Tout est débloqué (rythme des
  niveaux 11+).
- Ennemis : les 59 existants, en mélanges plus durs pensés pour le gimmick, plus un boss inédit par région. Pas d'ennemi ordinaire nouveau.
- Lore : les agents proposent noms, ambiances et phrases dans `docs/lore.md`, dans le ton de l'histoire ; l'auteur retouche.
- Infini : 1 ou 2 cartes neuves par région rejoignent la liste de l'infini, **sans** gimmick.

### Les 10 gimmicks, dans l'ordre (du plus simple au plus dur)
| Niveaux | Région | Gimmick | Règle |
| --- | --- | --- | --- |
| 101–105 | 11 | **Vol de Corbeaux** | Des volants traversent la carte de gauche à droite dans des couloirs horizontaux, sans suivre le chemin ; chacun qui atteint le bord droit coûte 1 cœur. Couloirs fixés par carte (2 ou 3), annoncés avant la vague par un panneau au bord gauche. Seuls ce qui vise les volants (tours, sorts, héros tireurs) les touche. |
| 106–110 | 11 | **Radeau** | Une plateforme à 3 places va et vient sans arrêt le long d'un trajet tracé sur l'eau. On y construit toute tour sauf les casernes ; ses tours tirent depuis la position courante du radeau. |
| 111–115 | 12 | **Pont-Levis** | Deux chemins ; toutes les 2 vagues une herse bascule et les ennemis prennent l'autre. |
| 116–120 | 12 | **Crue** | À certaines vagues, l'eau monte et noie une partie des emplacements : leurs tours sont hors service jusqu'à la décrue. |
| 121–125 | 13 | **Nuit sans Lune** | Carte noire : on ne voit et ne touche que les ennemis éclairés (tours à feu, braseros posés, sorts de lumière). |
| 126–130 | 13 | **Dîme** | Toutes les 2 manches, toutes les tours sont vendues d'office, **au prix total dépensé** (tour et améliorations). |
| 131–135 | 14 | **Convoi** | Un chariot de réfugiés remonte le chemin à contre-sens, visé en priorité ; détruit = **défaite immédiate**. |
| 136–140 | 14 | **Marché Noir** | Avant chaque vague, on choisit 1 tour parmi 3 tirées au hasard (déterministe) ; seules les tours choisies se construisent. |
| 141–145 | 15 | **Contagion** | Une tour près du chemin peut attraper la peste et la passer à ses voisines ; malade, elle ne tire plus tant qu'on ne paie pas son soin. |
| 146–150 | 15 | **Colosse** | Un géant traverse lentement la carte toute la partie, en plus des vagues ; s'il atteint la porte : **défaite immédiate**. |

Les détails chiffrés des gimmicks 3 à 10 (cadences, coûts, nombres) se décident à l'entretien de début de leur jalon.

### Braises (niveaux 101 à 150 seulement ; 1 à 100 inchangés)
- 15 à la première victoire d'un niveau (au lieu de 5), **+30** à la première victoire du 5e niveau de chaque bloc (105, 110, … 150),
  +6 la première fois qu'un niveau atteint 3 étoiles (au lieu de 2), défi réussi : 12 (au lieu de 4).
- Ordre de grandeur pour tout finir : 50 × 15 + 10 × 30 + 50 × 6 + 100 × 12 ≈ 2550 braises (≈ 125 caisses).

### Décisions techniques (2026-11-08)
1. **Format du gimmick** : champ `gimmick` du `Niveau`, union discriminée (`{ type: 'corbeaux', couloirs }`, `{ type: 'radeau', trajet,
   vitesse, places }`, …) ; un module par gimmick dans `src/engine/gimmicks/`, appelé à chaque pas par un aiguillage unique ; TypeScript
   vérifie qu'aucun type n'est oublié (`switch` exhaustif). Même style que `PouvoirsEnnemi`.
2. **Radeau** : sa position est une **fonction pure du numéro de pas** (`positionRadeau(gimmick, pas)`), rien n'est stocké ; une tour du
   radeau garde seulement « radeau, place n ». Rejeu et sauvegarde en pleine partie restent justes sans migration de l'état du radeau.
3. **Corbeaux** : c'est l'**apparition dans la vague** qui dit « couloir k » au lieu de « chemin k » ; tout ennemi volant peut traverser.
   L'ennemi porte son couloir dans l'état (`VERSION_ETAT` + 1).
4. **Bots** : chaque gimmick vient avec sa stratégie de bot (utiliser le radeau, couvrir les couloirs annoncés…), pour que les bandes
   imposées aient un sens sur ces régions.

### Livraison
Région par région : **5 jalons**, chacun mis en ligne. Le jalon 1 = base commune + région 11. Cette spec détaille le jalon 1 ; les
jalons 2 à 5 y ajouteront leur section après leur entretien.

## Jalon 1 : base commune et région 11 « Les Grèves Grises » (nom proposé, à retoucher)

### Critères d'acceptation
- [ ] Le niveau 100 gagné ouvre la région 11 ; la carte du monde montre les régions 11 à 15 (onglets), 12 à 15 verrouillées tant que
  la précédente n'est pas finie ; la sauvegarde accepte les niveaux jusqu'à 150 et les régions jusqu'à 15 (tests de validation et de
  migration si le format change).
- [ ] Braises : un niveau ≥ 101 rapporte 15 / +30 (5e du bloc) / +6 (3 étoiles) / 12 (défi) ; les niveaux 1 à 100 rapportent comme avant
  (tests de `meta.ts` et des transactions).
- [ ] Moteur, Corbeaux : un ennemi apparu dans un couloir avance en ligne droite du bord gauche au bord droit, ignore le chemin, les
  soldats et ce qui ne vise pas les volants, et retire 1 cœur en sortant à droite ; déterministe au rejeu (tests du moteur).
- [ ] Moteur, Radeau : 3 places dont la position suit le trajet aller-retour en fonction du seul pas ; construire, améliorer,
  vendre y marche ; une caserne y est refusée (raison dédiée) ; une tour du radeau vise depuis la position courante ; une sauvegarde en
  pleine partie puis reprise redonne le même état (tests du moteur).
- [ ] Rendu : les couloirs et le panneau d'annonce au bord gauche avant chaque vague (icônes, nombre, couloir) ; le radeau et ses tours
  se déplacent de façon fluide (interpolés entre deux pas) ; bulle sur le panneau et sur le radeau.
- [ ] Le gimmick est présenté : sur la fiche du niveau (« Particularité : … », une ligne tirée des données) et par une fiche en partie
  la première fois qu'on le rencontre (comme « Nouvel ennemi », même option pour la couper) ; il figure dans le Bestiaire (onglet ou
  section « Particularités »).
- [ ] 10 cartes neuves de la région 11 (eau et rivages pour le radeau, bandes dégagées pour les couloirs), décor et ambiance de région,
  lore (nom de région, nom et phrase de chaque niveau) dans `docs/lore.md`, boss inédit au niveau 110 (sprite, capacités pensées pour le
  radeau, phrase de lore, conseils du Bestiaire).
- [ ] 1 ou 2 cartes de la région 11 dans l'infini, sans gimmick.
- [ ] Bots : stratégies Corbeaux et Radeau ; `npm run balance` sans écart aux bandes imposées sur la région 11 (Chaton, défis 40–90 %,
  infini) et toujours 0 écart ailleurs ; la CI teste les bandes de la région 11 (matrice du déploiement).
- [ ] QA navigateur 1280×720 et 740×360 : tout tient, 0 erreur en console.

### Tâches
1. **Base commune** (données, sauvegarde, carte du monde) : régions 11–15 dans `meta.ts` en distinguant fin de l'histoire (100) et dernier
   niveau (150), ouverture, braises, validation et migration de sauvegarde, onglets 11–15 de la carte (en 740×360 aussi), `VERSION_DONNEES`.
2. **Aiguillage des gimmicks + Corbeaux** (moteur) : type `Gimmick`, `src/engine/gimmicks/index.ts`, couloirs dans le format des vagues
   et du générateur, mouvement en couloir, cœur perdu, `VERSION_ETAT` + 1, tests.
3. **Radeau** (moteur, après la tâche 2) : places mobiles, commandes de construction, refus des casernes, ciblage, tests.
4. **Rendu et présentation** (après 2 et 3) : couloirs, panneau, radeau, interpolation, fiche du niveau, fiche « Nouvelle particularité »,
   Bestiaire, textes.
5. **Contenu de la région 11** (en parallèle de 2–4) : 10 cartes, décor, lore, boss, plans de vagues (`plan-region11.ts`), cartes de l'infini.
6. **Bots et équilibrage** (après 2–5) : stratégies, `npm run balance`, CI à 11 régions, rapport.
7. Relecture, intégration, QA, mise en ligne.

## Impacts
- Données : `meta.ts` (régions, braises), `Niveau.gimmick`, format des vagues (couloir), ennemis (boss de région), `VERSION_DONNEES`, `VERSION_ETAT`.
- Sauvegarde : bornes de validation (niveau 150, région 15) ; migration seulement si le format change.
- Écrans : carte du monde, fiche du niveau, partie (panneau des couloirs, radeau), Bestiaire.
- CI : matrice des bandes étendue à chaque nouvelle région.

## Questions ouvertes
- Aucune pour le jalon 1. (Carte du monde en 740×360, région entière débloquée : on garde le glissement, vue centrée sur le niveau à
  jouer, décision du 2026-11-08.)
