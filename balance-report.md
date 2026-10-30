# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau des régions 1 à 10 (la région 1 en détail dans cette partie, les régions 2 à 10, les défis et le mode infini plus bas) est rejoué sans
affichage dans les trois difficultés, avec chacun des trois dieux jouant son avatar (sans amélioration ni objet), par deux bots, sur 10 graines chacun (version des données 13).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (case de la grille, famille, niveau,
  spécialisation, bonus et remise de famille du dieu compris), après une petite recherche entre douze variantes (6 préférences × 2 diversités, dont « bloquer puis zone ») jouées sur des graines d’entraînement ;
  place le héros dans la zone de feu de ses tours ; joue les sorts de son dieu selon leur effet (Chute du Colosse sur les grappes, Renforts et Voile de Nuit devant la zone de feu,
  Griffes d’Ombre sur la plus grosse grappe, Pièges à Ressort un peu avant la zone de feu, Ingéniosité au cœur de ses tours) ; construit la tour divine de son dieu dès la troisième tour ;
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter. Il lit la composition des vagues futures, ce qu’un joueur ne voit pas : il est un peu optimiste.
- **Naïf** : construit sur les cases de la grille proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans tour divine, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

**15 écart(s)**, dont 15 aux bandes suspendues de Matou et de Vieux Sage (elles ne bloquent pas : voir bandes.ts) :

- Matou (Plume) : le bot naïf gagne 77 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 10 laisse 271 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 6 laisse 267 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 98 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou : le niveau 10 (18,7 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 99 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %

Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins 1 vie sur 50 % des niveaux et en laissant moins de 250 arêtes inutilisées par niveau, le naïf gagne 30 % à 70 % ;
Vieux Sage, le soigneux gagne 60 % à 85 % ; sans défense on perd. Entre dieux : en Vieux Sage, au plus 10,0 points d’écart de taux de victoire du soigneux ; en Matou, au plus 3 vies d’écart de vies moyennes du soigneux.

### Dieu × difficulté

Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins 1 vie.

| Difficulté | Dieu | Naïf : victoires | Soigneux : victoires | Bande du soigneux | Naïf : vies | Soigneux : vies | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % | 100 % | — | 25,0 | 25,0 | 102 / 160 | 0/10 | 0 % |
| Chaton | Charlie | 100 % | 100 % | — | 25,0 | 25,0 | 100 / 185 | 0/10 | 0 % |
| Chaton | Pollen | 100 % | 100 % | — | 25,0 | 25,0 | 96 / 132 | 0/10 | 10 % |
| Matou | Plume | 77 % | 100 % | 100 % | 10,7 | 19,8 | 119 / 271 | 1/10 | 0 % |
| Matou | Charlie | 52 % | 100 % | 100 % | 6,1 | 19,1 | 111 / 267 | 3/10 | 0 % |
| Matou | Pollen | 98 % | 100 % | 100 % | 17,8 | 20,0 | 90 / 212 | 0/10 | 0 % |
| Vieux Sage | Plume | 24 % | 99 % | 60 % à 85 % | 2,1 | 13,7 | 86 / 176 | 3/10 | 0 % |
| Vieux Sage | Charlie | 15 % | 100 % | 60 % à 85 % | 1,1 | 14,1 | 99 / 198 | 4/10 | 0 % |
| Vieux Sage | Pollen | 66 % | 100 % | 60 % à 85 % | 7,4 | 14,9 | 99 / 200 | 0/10 | 0 % |

Bande du naïf : Chaton 100 %, Matou 30 % à 70 %. Matou : au moins 50 % des niveaux avec perte. Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

### Écarts entre dieux

| Mesure du soigneux | Plume | Charlie | Pollen | Écart maximal | Écart permis |
| --- | --- | --- | --- | --- | --- |
| Vieux Sage : taux de victoire | 99 % | 100 % | 100 % | 1,0 points | 10,0 points |
| Matou : vies moyennes | 19,8 | 19,1 | 20,0 | 0,9 vies | 3 vies |

## Plume

Héros : Nielle, Souffle-Lampes. Bonus de famille : Tir — PV des soldats +0 %, cadence +60 %, critique +15 points, prix +0 %. Sorts : Voile de Nuit (recharge 30 s), Griffes d’Ombre (recharge 40 s). Tour divine : Sanctuaire de l’Ombre (400 arêtes).

### Plume : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 76 / 74 | aucune / aucune | 193 / 146 | perdu en 218 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 524 / 86 | aucune / aucune | 214 / 162 | perdu en 147 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 113 / 51 | aucune / aucune | 198 / 156 | perdu en 171 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 91 / 99 | aucune / aucune | 247 / 182 | perdu en 146 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 115 / 56 | aucune / aucune | 259 / 215 | perdu en 136 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 134 / 138 | aucune / aucune | 356 / 280 | perdu en 151 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 110 / 160 | aucune / aucune | 309 / 262 | perdu en 117 s |
| 8 | 100 % (10/10) | 24,6 | 100 % (10/10) | 25,0 | 124 / 114 | 2 (0,4 vies) / aucune | 463 / 417 | perdu en 150 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 114 / 138 | aucune / aucune | 553 / 480 | perdu en 129 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 558 / 102 | aucune / aucune | 592 / 468 | perdu en 114 s |

### Plume : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 80 % (8/10) | 11,4 | 100 % (10/10) | 19,7 | 79 / 118 | 4 (2,9 vies) / 5 (0,2 vies) | 211 / 185 | perdu en 156 s |
| 2 | 50 % (5/10) | 4,9 | 100 % (10/10) | 20,0 | 54 / 114 | 4 (6,0 vies) / aucune | 203 / 184 | perdu en 119 s |
| 3 | 100 % (10/10) | 18,0 | 100 % (10/10) | 20,0 | 61 / 127 | 3 (1,1 vies) / aucune | 209 / 169 | perdu en 127 s |
| 4 | 100 % (10/10) | 14,4 | 100 % (10/10) | 20,0 | 81 / 98 | 3 (2,8 vies) / aucune | 264 / 237 | perdu en 108 s |
| 5 | 60 % (6/10) | 6,0 | 100 % (10/10) | 19,0 | 87 / 63 | 2 (4,3 vies) / 4 (0,6 vies) | 227 / 234 | perdu en 116 s |
| 6 | 100 % (10/10) | 15,0 | 100 % (10/10) | 19,8 | 96 / 93 | 3 (2,5 vies) / 7 (0,2 vies) | 367 / 322 | perdu en 129 s |
| 7 | 60 % (6/10) | 2,9 | 100 % (10/10) | 19,8 | 122 / 72 | 2 (5,7 vies) / 1 (0,2 vies) | 242 / 280 | perdu en 92 s |
| 8 | 20 % (2/10) | 1,3 | 100 % (10/10) | 20,0 | 60 / 93 | 3 (11,1 vies) / aucune | 211 / 427 | perdu en 113 s |
| 9 | 100 % (10/10) | 13,6 | 100 % (10/10) | 20,0 | 109 / 144 | 4 (5,3 vies) / aucune | 562 / 524 | perdu en 117 s |
| 10 | 100 % (10/10) | 19,0 | 100 % (10/10) | 20,0 | 226 / 271 | 6 (0,9 vies) / aucune | 606 / 545 | perdu en 87 s |

### Plume : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 56 / 119 | 4 (5,3 vies) / aucune | 183 / 177 | perdu en 131 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,7 | 63 / 40 | 3 (7,2 vies) / 4 (0,2 vies) | 134 / 189 | perdu en 116 s |
| 3 | 80 % (8/10) | 8,0 | 100 % (10/10) | 15,0 | 50 / 176 | 3 (3,2 vies) / aucune | 197 / 185 | perdu en 109 s |
| 4 | 20 % (2/10) | 0,7 | 90 % (9/10) | 9,5 | 43 / 69 | 3 (8,7 vies) / 4 (4,8 vies) | 149 / 230 | perdu en 104 s |
| 5 | 0 % (0/10) | 0,0 | 100 % (10/10) | 10,1 | 69 / 33 | 2 (6,3 vies) / 6 (2,5 vies) | 123 / 232 | perdu en 94 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 61 / 64 | 4 (6,5 vies) / aucune | 168 / 329 | perdu en 95 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,3 | 47 / 35 | 2 (8,3 vies) / 1 (1,7 vies) | 100 / 281 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,4 | 55 / 70 | 3 (8,5 vies) / 2 (0,5 vies) | 114 / 428 | perdu en 108 s |
| 9 | 40 % (4/10) | 1,1 | 100 % (10/10) | 15,0 | 119 / 123 | 4 (8,2 vies) / aucune | 308 / 532 | perdu en 96 s |
| 10 | 100 % (10/10) | 10,9 | 100 % (10/10) | 15,0 | 216 / 129 | 6 (2,8 vies) / aucune | 614 / 589 | perdu en 78 s |

Tours choisies par le soigneux en Matou avec Plume : la plus choisie, Clocher des Archers (construction) (904 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | magie, diversité 0.4 | magie, diversité 1 | équilibrée, diversité 1 |
| 2 | tir, diversité 1 | tir, diversité 0.4 | caserne, diversité 1 |
| 3 | caserne, diversité 0.4 | bloquer puis zone, diversité 1 | magie, diversité 1 |
| 4 | tir, diversité 0.4 | bloquer puis zone, diversité 0.4 | bloquer puis zone, diversité 0.4 |
| 5 | équilibrée, diversité 1 | tir, diversité 0.4 | magie, diversité 0.4 |
| 6 | artillerie, diversité 0.4 | artillerie, diversité 0.4 | tir, diversité 0.4 |
| 7 | caserne, diversité 0.4 | tir, diversité 0.4 | tir, diversité 0.4 |
| 8 | bloquer puis zone, diversité 1 | équilibrée, diversité 1 | tir, diversité 0.4 |
| 9 | équilibrée, diversité 0.4 | bloquer puis zone, diversité 1 | bloquer puis zone, diversité 0.4 |
| 10 | équilibrée, diversité 1 | artillerie, diversité 1 | magie, diversité 0.4 |

## Charlie

Héros : Gond, le Portier. Bonus de famille : Caserne — PV des soldats +25 %, cadence +0 %, critique +0 points, prix +0 %. Sorts : Chute du Colosse (recharge 25 s), Renforts (recharge 20 s). Tour divine : Totem du Colosse (400 arêtes).

### Charlie : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 76 / 84 | aucune / aucune | 196 / 152 | perdu en 185 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 524 / 84 | aucune / aucune | 218 / 145 | perdu en 146 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 113 / 51 | aucune / aucune | 199 / 145 | perdu en 229 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 80 / 100 | aucune / aucune | 248 / 191 | perdu en 140 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 126 / 79 | aucune / aucune | 260 / 226 | perdu en 124 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 134 / 125 | aucune / aucune | 356 / 306 | perdu en 148 s |
| 7 | 100 % (10/10) | 24,9 | 100 % (10/10) | 25,0 | 133 / 68 | 1 (0,1 vies) / aucune | 309 / 256 | perdu en 119 s |
| 8 | 100 % (10/10) | 24,6 | 100 % (10/10) | 25,0 | 124 / 128 | 2 (0,4 vies) / aucune | 464 / 399 | perdu en 150 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 114 / 99 | aucune / aucune | 556 / 490 | perdu en 127 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 581 / 185 | aucune / aucune | 596 / 523 | perdu en 115 s |

### Charlie : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 40 % (4/10) | 1,5 | 100 % (10/10) | 20,0 | 68 / 97 | 5 (5,3 vies) / aucune | 213 / 166 | perdu en 153 s |
| 2 | 10 % (1/10) | 0,9 | 100 % (10/10) | 19,4 | 42 / 81 | 4 (7,6 vies) / 6 (0,6 vies) | 167 / 191 | perdu en 118 s |
| 3 | 90 % (9/10) | 16,6 | 100 % (10/10) | 18,0 | 61 / 88 | 3 (1,8 vies) / 5 (2,0 vies) | 200 / 164 | perdu en 109 s |
| 4 | 60 % (6/10) | 5,3 | 100 % (10/10) | 20,0 | 62 / 72 | 3 (6,9 vies) / aucune | 213 / 232 | perdu en 107 s |
| 5 | 40 % (4/10) | 2,1 | 100 % (10/10) | 19,6 | 75 / 52 | 4 (4,9 vies) / 8 (0,3 vies) | 196 / 238 | perdu en 107 s |
| 6 | 80 % (8/10) | 9,0 | 100 % (10/10) | 20,0 | 106 / 267 | 4 (4,6 vies) / aucune | 332 / 323 | perdu en 102 s |
| 7 | 20 % (2/10) | 1,3 | 100 % (10/10) | 15,3 | 74 / 64 | 2 (6,0 vies) / 5 (2,9 vies) | 171 / 277 | perdu en 89 s |
| 8 | 10 % (1/10) | 0,6 | 100 % (10/10) | 18,4 | 49 / 76 | 3 (10,7 vies) / 3 (1,6 vies) | 176 / 439 | perdu en 110 s |
| 9 | 70 % (7/10) | 6,2 | 100 % (10/10) | 20,0 | 126 / 99 | 4 (9,4 vies) / aucune | 440 / 523 | perdu en 107 s |
| 10 | 100 % (10/10) | 17,2 | 100 % (10/10) | 20,0 | 239 / 214 | 6 (2,2 vies) / aucune | 613 / 565 | perdu en 81 s |

### Charlie : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 67 / 121 | 3 (6,2 vies) / aucune | 153 / 214 | perdu en 130 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,7 | 60 / 78 | 3 (7,7 vies) / 4 (1,2 vies) | 122 / 202 | perdu en 115 s |
| 3 | 70 % (7/10) | 4,8 | 100 % (10/10) | 15,0 | 66 / 88 | 3 (4,4 vies) / aucune | 187 / 178 | perdu en 108 s |
| 4 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 57 / 101 | 3 (7,9 vies) / aucune | 113 / 239 | perdu en 103 s |
| 5 | 0 % (0/10) | 0,0 | 100 % (10/10) | 11,0 | 34 / 60 | 2 (6,7 vies) / 4 (1,7 vies) | 110 / 241 | perdu en 91 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,9 | 68 / 198 | 3 (6,0 vies) / 7 (0,1 vies) | 145 / 325 | perdu en 94 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,1 | 65 / 29 | 2 (9,1 vies) / 2 (1,0 vies) | 89 / 271 | perdu en 73 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,3 | 43 / 46 | 3 (7,3 vies) / 3 (0,3 vies) | 112 / 434 | perdu en 106 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,9 | 56 / 79 | 3 (8,9 vies) / 4 (0,1 vies) | 133 / 531 | perdu en 94 s |
| 10 | 80 % (8/10) | 5,8 | 100 % (10/10) | 14,0 | 225 / 189 | 6 (4,5 vies) / 4 (0,4 vies) | 540 / 618 | perdu en 76 s |

Tours choisies par le soigneux en Matou avec Charlie : la plus choisie, Grenier des Griffes (construction) (845 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 | caserne, diversité 0.4 |
| 2 | équilibrée, diversité 0.4 | caserne, diversité 1 | magie, diversité 0.4 |
| 3 | bloquer puis zone, diversité 1 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 4 | équilibrée, diversité 0.4 | bloquer puis zone, diversité 1 | bloquer puis zone, diversité 0.4 |
| 5 | équilibrée, diversité 1 | équilibrée, diversité 0.4 | caserne, diversité 1 |
| 6 | magie, diversité 1 | artillerie, diversité 1 | artillerie, diversité 1 |
| 7 | artillerie, diversité 1 | tir, diversité 0.4 | bloquer puis zone, diversité 0.4 |
| 8 | magie, diversité 0.4 | bloquer puis zone, diversité 0.4 | magie, diversité 0.4 |
| 9 | tir, diversité 1 | artillerie, diversité 0.4 | caserne, diversité 1 |
| 10 | magie, diversité 1 | tir, diversité 0.4 | caserne, diversité 1 |

## Pollen

Héros : Clopin, le Tendeur. Bonus de famille : Artillerie — PV des soldats +0 %, cadence +15 %, critique +0 points, prix −10 %. Sorts : Pièges à Ressort (recharge 30 s), Ingéniosité (recharge 50 s). Tour divine : Atelier de la Boiteuse (400 arêtes).

### Pollen : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 101 / 127 | aucune / aucune | 193 / 157 | gagné 3/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 582 / 83 | aucune / aucune | 216 / 177 | perdu en 207 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 62 / 75 | aucune / aucune | 196 / 156 | perdu en 193 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 95 / 79 | aucune / aucune | 247 / 214 | perdu en 241 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 97 / 81 | aucune / aucune | 259 / 223 | perdu en 260 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 72 / 132 | aucune / aucune | 355 / 302 | perdu en 318 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 148 / 87 | aucune / aucune | 308 / 257 | perdu en 142 s |
| 8 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 136 / 88 | aucune / aucune | 464 / 420 | perdu en 335 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 125 / 91 | aucune / aucune | 554 / 483 | perdu en 130 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 831 / 113 | aucune / aucune | 593 / 526 | perdu en 210 s |

### Pollen : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 19,9 | 100 % (10/10) | 20,0 | 48 / 86 | 6 (0,1 vies) / aucune | 206 / 164 | perdu en 218 s |
| 2 | 100 % (10/10) | 19,7 | 100 % (10/10) | 20,0 | 70 / 100 | 3 (0,2 vies) / aucune | 232 / 196 | perdu en 146 s |
| 3 | 100 % (10/10) | 18,3 | 100 % (10/10) | 20,0 | 65 / 54 | 5 (1,6 vies) / aucune | 214 / 164 | perdu en 144 s |
| 4 | 100 % (10/10) | 19,7 | 100 % (10/10) | 20,0 | 80 / 70 | 4 (0,2 vies) / aucune | 262 / 224 | perdu en 144 s |
| 5 | 100 % (10/10) | 19,5 | 100 % (10/10) | 20,0 | 85 / 53 | 2 (0,3 vies) / aucune | 264 / 235 | perdu en 143 s |
| 6 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 78 / 88 | aucune / aucune | 367 / 323 | perdu en 150 s |
| 7 | 80 % (8/10) | 9,9 | 100 % (10/10) | 20,0 | 74 / 71 | 5 (5,0 vies) / aucune | 284 / 274 | perdu en 109 s |
| 8 | 100 % (10/10) | 18,5 | 100 % (10/10) | 20,0 | 117 / 60 | 3 (1,2 vies) / aucune | 469 / 428 | perdu en 156 s |
| 9 | 100 % (10/10) | 12,3 | 100 % (10/10) | 20,0 | 139 / 107 | 4 (5,6 vies) / aucune | 560 / 520 | perdu en 127 s |
| 10 | 100 % (10/10) | 20,0 | 100 % (10/10) | 19,9 | 157 / 212 | aucune / 6 (0,1 vies) | 609 / 599 | perdu en 125 s |

### Pollen : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 90 % (9/10) | 11,0 | 100 % (10/10) | 15,0 | 67 / 113 | 4 (1,7 vies) / aucune | 215 / 168 | perdu en 182 s |
| 2 | 60 % (6/10) | 3,2 | 100 % (10/10) | 15,0 | 70 / 82 | 4 (5,5 vies) / aucune | 212 / 192 | perdu en 121 s |
| 3 | 60 % (6/10) | 7,1 | 100 % (10/10) | 15,0 | 55 / 73 | 5 (4,1 vies) / aucune | 194 / 179 | perdu en 127 s |
| 4 | 100 % (10/10) | 11,6 | 100 % (10/10) | 15,0 | 84 / 49 | 6 (1,1 vies) / aucune | 262 / 216 | perdu en 119 s |
| 5 | 90 % (9/10) | 10,0 | 100 % (10/10) | 15,0 | 95 / 131 | 2 (1,6 vies) / aucune | 268 / 242 | perdu en 120 s |
| 6 | 100 % (10/10) | 13,5 | 100 % (10/10) | 15,0 | 81 / 88 | 3 (0,7 vies) / aucune | 370 / 324 | perdu en 138 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 48 / 71 | 4 (6,4 vies) / aucune | 139 / 277 | perdu en 96 s |
| 8 | 20 % (2/10) | 0,9 | 100 % (10/10) | 15,0 | 60 / 91 | 3 (8,2 vies) / aucune | 227 / 433 | perdu en 118 s |
| 9 | 40 % (4/10) | 2,2 | 100 % (10/10) | 15,0 | 53 / 88 | 4 (7,1 vies) / aucune | 306 / 519 | perdu en 123 s |
| 10 | 100 % (10/10) | 14,2 | 100 % (10/10) | 14,3 | 181 / 200 | 6 (0,5 vies) / 6 (0,7 vies) | 615 / 568 | perdu en 91 s |

Tours choisies par le soigneux en Matou avec Pollen : la plus choisie, Grenier des Griffes (construction) (1063 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | bloquer puis zone, diversité 1 | équilibrée, diversité 1 | magie, diversité 1 |
| 2 | magie, diversité 1 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 |
| 3 | caserne, diversité 0.4 | équilibrée, diversité 0.4 | artillerie, diversité 1 |
| 4 | tir, diversité 0.4 | magie, diversité 0.4 | artillerie, diversité 0.4 |
| 5 | caserne, diversité 1 | caserne, diversité 0.4 | bloquer puis zone, diversité 1 |
| 6 | équilibrée, diversité 1 | magie, diversité 0.4 | artillerie, diversité 0.4 |
| 7 | artillerie, diversité 0.4 | artillerie, diversité 1 | équilibrée, diversité 0.4 |
| 8 | bloquer puis zone, diversité 0.4 | tir, diversité 0.4 | équilibrée, diversité 0.4 |
| 9 | tir, diversité 0.4 | bloquer puis zone, diversité 0.4 | équilibrée, diversité 0.4 |
| 10 | équilibrée, diversité 0.4 | bloquer puis zone, diversité 0.4 | artillerie, diversité 0.4 |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus -0,3) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.

| Dieu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Corrélation de rang | Niveau le plus dur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | 11,4 | 4,9 | 18,0 | 14,4 | 6,0 | 15,0 | 2,9 | 1,3 | 13,6 | 19,0 | 0,1 | 8 (1,3 vies) |
| Charlie | 1,5 | 0,9 | 16,6 | 5,3 | 2,1 | 9,0 | 1,3 | 0,6 | 6,2 | 17,2 | 0,3 | 8 (0,6 vies) |
| Pollen | 19,9 | 19,7 | 18,3 | 19,7 | 19,5 | 20,0 | 9,9 | 18,5 | 12,3 | 20,0 | -0,2 | 7 (9,9 vies) |
| **Moyenne des dieux** | 10,9 | 8,5 | 17,6 | 13,1 | 9,2 | 14,7 | 4,7 | 6,8 | 10,7 | 18,7 | 0,0 | 7 (4,7 vies) |

Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).

## Usage des sorts par le soigneux

Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).

| Dieu | Sort | Recharge | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- | --- | --- |
| Plume | Voile de Nuit | 30 s | 2,0 sur 9,2 (22 %) | 6,3 sur 10,4 (61 %) | 6,3 sur 10,6 (59 %) |
| Plume | Griffes d’Ombre | 40 s | 6,6 sur 7,0 (94 %) | 7,5 sur 7,9 (96 %) | 7,8 sur 8,0 (98 %) |
| Charlie | Chute du Colosse | 25 s | 11,2 sur 11,4 (98 %) | 12,4 sur 12,7 (98 %) | 12,9 sur 13,1 (98 %) |
| Charlie | Renforts | 20 s | 5,1 sur 14,6 (34 %) | 11,1 sur 16,1 (69 %) | 11,7 sur 16,8 (70 %) |
| Pollen | Pièges à Ressort | 30 s | 5,3 sur 9,8 (54 %) | 8,0 sur 10,6 (76 %) | 8,9 sur 10,6 (85 %) |
| Pollen | Ingéniosité | 50 s | 3,5 sur 5,9 (60 %) | 4,4 sur 6,4 (69 %) | 5,1 sur 6,4 (79 %) |

## Tours divines

Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 400 arêtes avant la fin du niveau ; une seule par partie, et pas avant le niveau 10 où elle se débloque).
Sans tour divine : le même soigneux, mêmes graines, dépense ces 400 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.

| Dieu | Tour divine | Difficulté | Construite | Avec : victoires / vies | Sans : victoires / vies | Gain de la tour divine |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | Matou | 10 % | 100 % / 19,8 | 100 % / 19,8 | +0 points / +0,0 vies |
| Plume | Sanctuaire de l’Ombre | Vieux Sage | 10 % | 99 % / 13,7 | 99 % / 13,5 | +0 points / +0,2 vies |
| Charlie | Totem du Colosse | Matou | 10 % | 100 % / 19,1 | 100 % / 19,1 | +0 points / +0,0 vies |
| Charlie | Totem du Colosse | Vieux Sage | 10 % | 100 % / 14,1 | 100 % / 14,2 | +0 points / −0,1 vies |
| Pollen | Atelier de la Boiteuse | Matou | 10 % | 100 % / 20,0 | 100 % / 20,0 | +0 points / +0,0 vies |
| Pollen | Atelier de la Boiteuse | Vieux Sage | 10 % | 100 % / 14,9 | 100 % / 14,8 | +0 points / +0,1 vies |

Puissance par la formule des tours communes (DPS efficace moyen × portée ÷ coût), comptant en plus l’onde du Totem (cibles d’une zone d’une tuile de rayon) et les tourelles et pièges de l’Atelier ; elle ne chiffre ni l’étourdissement du Totem, ni les assassins non ciblables du Sanctuaire, ni l’immobilisation des pièges, ce qui explique que les tours divines ressortent en dessous des tours communes de coût voisin alors que le test de partie montre leur effet.

| Dieu | Tour divine | Coût | Puissance (formule) | Tours communes de coût voisin | Puissance moyenne de ces tours | Rapport |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | 400 | 0,5 | Grenier des Griffes (palier 3, coût cumulé 340), Clocher des Archers (palier 3, coût cumulé 340), Autel des Cendres (palier 3, coût cumulé 500), Catapulte du Rempart (palier 2, coût cumulé 325) | 0,1 | ×4,0 |
| Charlie | Totem du Colosse | 400 | 0,0 | Grenier des Griffes (palier 3, coût cumulé 340), Clocher des Archers (palier 3, coût cumulé 340), Autel des Cendres (palier 3, coût cumulé 500), Catapulte du Rempart (palier 2, coût cumulé 325) | 0,1 | ×0,2 |
| Pollen | Atelier de la Boiteuse | 400 | 0,3 | Grenier des Griffes (palier 3, coût cumulé 340), Clocher des Archers (palier 3, coût cumulé 340), Autel des Cendres (palier 3, coût cumulé 500), Catapulte du Rempart (palier 2, coût cumulé 325) | 0,1 | ×2,4 |

## Déblocage progressif des tours

Ce qu’on peut construire dépend du seul numéro du niveau joué, défis compris (src/data/deblocage.ts) : les niveaux 1 à 10 se jouent avec moins d’outils, et les bots s’y plient comme le joueur (le soigneux n’économise pas pour un achat encore fermé). Tout est ouvert à partir du niveau 11 et en mode infini. La tour divine coûte 400 arêtes et une seule se dresse à la fois.

| Niveau | Débloque |
| --- | --- |
| 1 | Caserne (niveau 1), Tir (niveau 1), Magie (niveau 1), Artillerie (niveau 1) |
| 2 | Caserne (niveau 2), Tir (niveau 2) |
| 3 | Magie (niveau 2), Artillerie (niveau 2) |
| 4 | Caserne (niveau 3), Tir (niveau 3) |
| 5 | Magie (niveau 3), Artillerie (niveau 3) |
| 6 | Caserne (spécialisations A et B) |
| 7 | Tir (spécialisations A et B) |
| 8 | Magie (spécialisations A et B) |
| 9 | Artillerie (spécialisations A et B) |
| 10 | Tour divine |

## Disciples comparés à leur avatar (Matou)

Chaque disciple est joué au niveau 1 avec son dieu (sans amélioration ni objet), dans les 10 niveaux de Matou. Écart : vies restantes moyennes du soigneux, disciple moins avatar (au plus 3 vies d’écart, en plus ou en moins).

| Dieu | Héros | Rôle | Soigneux : victoires | Soigneux : vies | Écart à l’avatar | Naïf : victoires | Naïf : vies | Écart à l’avatar (naïf) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | Nielle, Souffle-Lampes (avatar) | Duelliste, esquive et critiques | 100 % | 19,8 | — | 77 % | 10,7 | — |
| Plume | Suie | Assassin, exécute les blessés | 100 % | 19,8 | −0,1 vies | 53 % | 7,3 | −3,4 vies |
| Plume | Corbeau | Tireur, perce l’armure | 100 % | 19,9 | +0,1 vies | 97 % | 17,5 | +6,8 vies |
| Charlie | Gond, le Portier (avatar) | Tank, frappe de zone qui étourdit | 100 % | 19,1 | — | 52 % | 6,1 | — |
| Charlie | Mastoc | Provocation, bloque trois ennemis | 100 % | 19,6 | +0,5 vies | 73 % | 9,6 | +3,5 vies |
| Charlie | Brise-Os | Berserker, plus fort blessé | 100 % | 19,8 | +0,7 vies | 62 % | 6,7 | +0,7 vies |
| Pollen | Clopin, le Tendeur (avatar) | Pose des pièges, tire à la fronde | 100 % | 20,0 | — | 98 % | 17,8 | — |
| Pollen | Rouage | Ingénieur, construit une tourelle | 100 % | 20,0 | +0,0 vies | 98 % | 17,9 | +0,2 vies |
| Pollen | Lanterne | Soigneur, magie à distance | 100 % | 19,7 | −0,3 vies | 97 % | 17,8 | +0,0 vies |

## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)

L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.
La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.

| Dieu | Bot | De base | Arbre au maximum | Héros niveau 10 | Tout au maximum |
| --- | --- | --- | --- | --- | --- |
| Plume | Soigneux | 99 % / 13,7 | 100 % / 14,2 | 100 % / 14,7 | 100 % / 14,2 |
| Plume | Naïf | 24 % / 2,1 | 38 % / 3,2 | 55 % / 5,2 | 56 % / 6,0 |
| Charlie | Soigneux | 100 % / 14,1 | 100 % / 14,8 | 100 % / 14,7 | 100 % / 14,9 |
| Charlie | Naïf | 15 % / 1,1 | 17 % / 1,3 | 22 % / 2,0 | 25 % / 2,5 |
| Pollen | Soigneux | 100 % / 14,9 | 100 % / 14,9 | 100 % / 14,9 | 100 % / 14,7 |
| Pollen | Naïf | 66 % / 7,4 | 78 % / 9,2 | 86 % / 11,2 | 90 % / 12,1 |

## Puissance des tours par palier de coût

Puissance = DPS efficace moyen × portée ÷ coût cumulé. Chaque tour doit rester à ±15 % de la moyenne de son palier (palier 4 : les spécialisations).

| Palier | Tour | Coût cumulé | Puissance | Écart à la moyenne |
| --- | --- | --- | --- | --- |
| 1 | Grenier des Griffes | 70 | 0,2 | +1,9 % |
| 1 | Clocher des Archers | 70 | 0,2 | +2,8 % |
| 1 | Autel des Cendres | 100 | 0,2 | +5,3 % |
| 1 | Catapulte du Rempart | 125 | 0,2 | −10,0 % |
| 2 | Grenier des Griffes | 180 | 0,2 | +8,3 % |
| 2 | Clocher des Archers | 180 | 0,1 | +0,3 % |
| 2 | Autel des Cendres | 260 | 0,2 | +3,0 % |
| 2 | Catapulte du Rempart | 325 | 0,1 | −11,6 % |
| 3 | Grenier des Griffes | 340 | 0,1 | +0,7 % |
| 3 | Clocher des Archers | 340 | 0,1 | +5,3 % |
| 3 | Autel des Cendres | 500 | 0,1 | +4,6 % |
| 3 | Catapulte du Rempart | 625 | 0,1 | −10,7 % |
| 4 | Garde du Cloître | 570 | 0,2 | +6,4 % |
| 4 | Écorcheurs | 570 | 0,2 | −1,6 % |
| 4 | Guetteurs des Toits | 570 | 0,2 | −2,3 % |
| 4 | Arbalétriers du Beffroi | 570 | 0,2 | +11,3 % |
| 4 | Oracle de la Braise | 800 | 0,2 | +1,2 % |
| 4 | Nécromancien des Neuf Vies | 800 | 0,2 | −3,3 % |
| 4 | Mortier de Soufre | 985 | 0,1 | −12,9 % |
| 4 | Baliste à Chaînes | 985 | 0,2 | +1,2 % |

## Régions 2 à 10

Les bandes de la région 1 (plus haut) sont mesurées sur chacune des régions 2 à 10, pour les trois dieux : mêmes bots, mêmes graines, mêmes difficultés, courbe de difficulté jugée sur la moyenne des dieux, écart entre dieux comme au jalon 2. Les écarts de Chaton, d’absence de défense et des défis font échouer `npm run balance` ; ceux de Matou et de Vieux Sage (courbe et écart entre dieux compris) sont suspendus (voir bandes.ts) : listés, ils ne bloquent pas.

### Région 2 : les Champs Brûlés

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 138 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,8 | 123 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 24,9 | 132 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 75 % (75/100) | 19,8 | 159 | 0 % (0/30) |
| Matou | Charlie | 94 % (94/100) | 56 % (56/100) | 16,7 | 124 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 98 % (98/100) | 19,8 | 115 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 20 % (20/100) | 12,8 | 123 | 0 % (0/30) |
| Vieux Sage | Charlie | 82 % (82/100) | 6 % (6/100) | 8,2 | 115 | 0 % (0/30) |
| Vieux Sage | Pollen | 90 % (90/100) | 65 % (65/100) | 12,4 | 120 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 100 % (30/30) | 60 % (18/30) | 9,4 | 128 | 100 % (30/30) | 15,0 | 0 % (0/9) |
| 12 | 100 % (30/30) | 100 % (30/30) | 18,2 | 111 | 100 % (30/30) | 14,7 | 0 % (0/9) |
| 13 | 100 % (30/30) | 77 % (23/30) | 10,3 | 120 | 90 % (27/30) | 8,2 | 0 % (0/9) |
| 14 | 100 % (30/30) | 77 % (23/30) | 8,3 | 104 | 90 % (27/30) | 11,4 | 0 % (0/9) |
| 15 | 100 % (30/30) | 63 % (19/30) | 8,8 | 145 | 100 % (30/30) | 10,6 | 0 % (0/9) |
| 16 | 100 % (30/30) | 73 % (22/30) | 9,3 | 157 | 100 % (30/30) | 14,7 | 0 % (0/9) |
| 17 | 80 % (24/30) | 77 % (23/30) | 9,4 | 84 | 43 % (13/30) | 4,2 | 0 % (0/9) |
| 18 | 100 % (30/30) | 50 % (15/30) | 6,9 | 179 | 90 % (27/30) | 9,1 | 0 % (0/9) |
| 19 | 100 % (30/30) | 90 % (27/30) | 14,0 | 126 | 93 % (28/30) | 11,2 | 0 % (0/9) |
| 20 | 100 % (30/30) | 97 % (29/30) | 15,0 | 171 | 100 % (30/30) | 12,2 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot naïf gagne 75 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 16 laisse 251 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 18 laisse 331 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 94 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 98 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou : le niveau 20 (15 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 90 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (82 %) sont à 18 points l'un de l'autre, il en faut au plus 10
- Matou : Pollen (19,8 vies) et Charlie (16,7 vies) sont à 3,1 vies l'un de l'autre, il en faut au plus 3

### Région 3 : le Bourg des Bûchers

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 218 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 165 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 170 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 83 % (83/100) | 19,9 | 138 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 51 % (51/100) | 17,6 | 159 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 85 % (85/100) | 19,7 | 128 | 0 % (0/30) |
| Vieux Sage | Plume | 90 % (90/100) | 41 % (41/100) | 11,8 | 124 | 0 % (0/30) |
| Vieux Sage | Charlie | 75 % (75/100) | 7 % (7/100) | 7,7 | 134 | 0 % (0/30) |
| Vieux Sage | Pollen | 92 % (92/100) | 31 % (31/100) | 11,1 | 130 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 100 % (30/30) | 30 % (9/30) | 3,8 | 112 | 57 % (17/30) | 3,1 | 0 % (0/9) |
| 22 | 100 % (30/30) | 43 % (13/30) | 6,7 | 121 | 63 % (19/30) | 6,8 | 0 % (0/9) |
| 23 | 100 % (30/30) | 73 % (22/30) | 10,8 | 154 | 83 % (25/30) | 9,6 | 0 % (0/9) |
| 24 | 100 % (30/30) | 100 % (30/30) | 15,1 | 144 | 100 % (30/30) | 14,9 | 0 % (0/9) |
| 25 | 100 % (30/30) | 100 % (30/30) | 17,4 | 173 | 97 % (29/30) | 13,5 | 0 % (0/9) |
| 26 | 100 % (30/30) | 63 % (19/30) | 6,1 | 98 | 100 % (30/30) | 12,4 | 0 % (0/9) |
| 27 | 100 % (30/30) | 47 % (14/30) | 5,3 | 110 | 57 % (17/30) | 1,7 | 0 % (0/9) |
| 28 | 100 % (30/30) | 87 % (26/30) | 12,8 | 147 | 100 % (30/30) | 10,8 | 0 % (0/9) |
| 29 | 100 % (30/30) | 87 % (26/30) | 14,6 | 175 | 100 % (30/30) | 14,2 | 0 % (0/9) |
| 30 | 100 % (30/30) | 100 % (30/30) | 19,6 | 187 | 100 % (30/30) | 15,0 | 0 % (0/9) |

Écarts aux bandes : 13

- Matou (Plume) : le bot naïf gagne 83 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 29 laisse 268 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 85 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,5, elle doit être d'au plus -0,6
- Matou : le niveau 30 (19,6 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,8, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,5, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 90 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 92 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Pollen (92 %) et Charlie (75 %) sont à 17 points l'un de l'autre, il en faut au plus 10

### Région 4 : les Marais de l’Ordalie

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 188 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 143 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 173 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 82 % (82/100) | 20,0 | 164 | 0 % (0/30) |
| Matou | Charlie | 98 % (98/100) | 58 % (58/100) | 17,0 | 106 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 84 % (84/100) | 20,0 | 151 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 30 % (30/100) | 13,8 | 142 | 0 % (0/30) |
| Vieux Sage | Charlie | 52 % (52/100) | 0 % (0/100) | 4,1 | 131 | 0 % (0/30) |
| Vieux Sage | Pollen | 87 % (87/100) | 17 % (17/100) | 10,0 | 119 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 100 % (30/30) | 57 % (17/30) | 7,7 | 137 | 33 % (10/30) | 3,3 | 0 % (0/9) |
| 32 | 100 % (30/30) | 27 % (8/30) | 1,8 | 114 | 60 % (18/30) | 5,5 | 0 % (0/9) |
| 33 | 93 % (28/30) | 50 % (15/30) | 6,8 | 117 | 83 % (25/30) | 11,3 | 0 % (0/9) |
| 34 | 100 % (30/30) | 93 % (28/30) | 14,2 | 170 | 97 % (29/30) | 11,3 | 0 % (0/9) |
| 35 | 100 % (30/30) | 83 % (25/30) | 13,6 | 184 | 100 % (30/30) | 13,5 | 0 % (0/9) |
| 36 | 100 % (30/30) | 70 % (21/30) | 9,5 | 128 | 100 % (30/30) | 12,5 | 0 % (0/9) |
| 37 | 100 % (30/30) | 70 % (21/30) | 11,3 | 121 | 73 % (22/30) | 6,4 | 0 % (0/9) |
| 38 | 100 % (30/30) | 97 % (29/30) | 17,5 | 124 | 67 % (20/30) | 7,6 | 0 % (0/9) |
| 39 | 100 % (30/30) | 100 % (30/30) | 19,5 | 112 | 97 % (29/30) | 12,0 | 0 % (0/9) |
| 40 | 100 % (30/30) | 100 % (30/30) | 18,1 | 197 | 87 % (26/30) | 9,6 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot naïf gagne 82 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 98 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 84 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 40 laisse 323 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,8, elle doit être d'au plus -0,6
- Matou : le niveau 40 (18,1 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,9, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,8, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 52 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 87 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (52 %) sont à 48 points l'un de l'autre, il en faut au plus 10

### Région 5 : la Ville Pestiférée

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 182 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,6 | 165 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 169 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 81 % (81/100) | 20,0 | 135 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 46 % (46/100) | 18,6 | 157 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 82 % (82/100) | 19,8 | 139 | 0 % (0/30) |
| Vieux Sage | Plume | 96 % (96/100) | 30 % (30/100) | 12,5 | 152 | 0 % (0/30) |
| Vieux Sage | Charlie | 40 % (40/100) | 4 % (4/100) | 3,3 | 111 | 0 % (0/30) |
| Vieux Sage | Pollen | 86 % (86/100) | 18 % (18/100) | 12,2 | 131 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | 100 % (30/30) | 13 % (4/30) | 1,8 | 91 | 27 % (8/30) | 1,8 | 0 % (0/9) |
| 42 | 100 % (30/30) | 57 % (17/30) | 7,6 | 82 | 73 % (22/30) | 10,6 | 0 % (0/9) |
| 43 | 100 % (30/30) | 37 % (11/30) | 5,9 | 137 | 57 % (17/30) | 7,7 | 0 % (0/9) |
| 44 | 100 % (30/30) | 93 % (28/30) | 15,7 | 125 | 67 % (20/30) | 9,5 | 0 % (0/9) |
| 45 | 100 % (30/30) | 67 % (20/30) | 9,9 | 200 | 83 % (25/30) | 9,1 | 0 % (0/9) |
| 46 | 100 % (30/30) | 70 % (21/30) | 9,9 | 116 | 77 % (23/30) | 10,7 | 0 % (0/9) |
| 47 | 100 % (30/30) | 60 % (18/30) | 10,1 | 103 | 57 % (17/30) | 5,8 | 0 % (0/9) |
| 48 | 100 % (30/30) | 100 % (30/30) | 16,9 | 170 | 100 % (30/30) | 12,8 | 0 % (0/9) |
| 49 | 100 % (30/30) | 100 % (30/30) | 20,0 | 170 | 100 % (30/30) | 13,2 | 0 % (0/9) |
| 50 | 100 % (30/30) | 100 % (30/30) | 17,6 | 243 | 100 % (30/30) | 12,5 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot naïf gagne 81 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 50 laisse 300 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 82 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,9, elle doit être d'au plus -0,6
- Matou : le niveau 50 (17,6 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,9, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 96 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 40 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 86 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (96 %) et Charlie (40 %) sont à 56 points l'un de l'autre, il en faut au plus 10

### Région 6 : le Charnier

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 183 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 172 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 136 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 69 % (69/100) | 20,0 | 145 | 0 % (0/30) |
| Matou | Charlie | 91 % (91/100) | 37 % (37/100) | 15,1 | 103 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 85 % (85/100) | 18,6 | 132 | 0 % (0/30) |
| Vieux Sage | Plume | 97 % (97/100) | 25 % (25/100) | 14,0 | 125 | 0 % (0/30) |
| Vieux Sage | Charlie | 23 % (23/100) | 1 % (1/100) | 2,1 | 56 | 0 % (0/30) |
| Vieux Sage | Pollen | 65 % (65/100) | 14 % (14/100) | 8,1 | 109 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 51 | 100 % (30/30) | 27 % (8/30) | 3,1 | 93 | 67 % (20/30) | 10,0 | 0 % (0/9) |
| 52 | 100 % (30/30) | 27 % (8/30) | 3,6 | 133 | 33 % (10/30) | 4,7 | 0 % (0/9) |
| 53 | 100 % (30/30) | 63 % (19/30) | 9,3 | 130 | 57 % (17/30) | 5,3 | 0 % (0/9) |
| 54 | 100 % (30/30) | 100 % (30/30) | 18,8 | 98 | 90 % (27/30) | 11,3 | 0 % (0/9) |
| 55 | 100 % (30/30) | 60 % (18/30) | 8,8 | 150 | 90 % (27/30) | 11,5 | 0 % (0/9) |
| 56 | 100 % (30/30) | 43 % (13/30) | 5,8 | 92 | 67 % (20/30) | 9,9 | 0 % (0/9) |
| 57 | 100 % (30/30) | 47 % (14/30) | 6,9 | 96 | 50 % (15/30) | 5,7 | 0 % (0/9) |
| 58 | 100 % (30/30) | 70 % (21/30) | 7,5 | 149 | 33 % (10/30) | 3,7 | 0 % (0/9) |
| 59 | 100 % (30/30) | 100 % (30/30) | 19,3 | 127 | 97 % (29/30) | 13,3 | 0 % (0/9) |
| 60 | 70 % (21/30) | 100 % (30/30) | 16,3 | 197 | 33 % (10/30) | 5,0 | 0 % (0/9) |

Écarts aux bandes : 14

- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 60 laisse 252 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 91 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 85 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,6, elle doit être d'au plus -0,6
- Matou : le niveau 60 (16,3 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,7, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,5, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 97 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 23 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (97 %) et Charlie (23 %) sont à 74 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (20 vies) et Charlie (15,1 vies) sont à 4,9 vies l'un de l'autre, il en faut au plus 3

### Région 7 : la Croisade

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 237 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 183 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 169 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 91 % (91/100) | 18,9 | 140 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 61 % (61/100) | 15,6 | 81 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 97 % (97/100) | 18,6 | 113 | 0 % (0/30) |
| Vieux Sage | Plume | 91 % (91/100) | 2 % (2/100) | 11,4 | 111 | 0 % (0/30) |
| Vieux Sage | Charlie | 12 % (12/100) | 0 % (0/100) | 0,7 | 70 | 0 % (0/30) |
| Vieux Sage | Pollen | 47 % (47/100) | 5 % (5/100) | 3,6 | 91 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 61 | 100 % (30/30) | 77 % (23/30) | 9,4 | 78 | 50 % (15/30) | 5,2 | 0 % (0/9) |
| 62 | 100 % (30/30) | 83 % (25/30) | 10,8 | 139 | 83 % (25/30) | 6,9 | 0 % (0/9) |
| 63 | 100 % (30/30) | 60 % (18/30) | 6,1 | 74 | 30 % (9/30) | 3,1 | 0 % (0/9) |
| 64 | 100 % (30/30) | 83 % (25/30) | 12,1 | 106 | 67 % (20/30) | 7,3 | 0 % (0/9) |
| 65 | 100 % (30/30) | 93 % (28/30) | 14,2 | 160 | 53 % (16/30) | 6,2 | 0 % (0/9) |
| 66 | 100 % (30/30) | 93 % (28/30) | 9,3 | 132 | 50 % (15/30) | 5,6 | 0 % (0/9) |
| 67 | 100 % (30/30) | 67 % (20/30) | 7,0 | 65 | 23 % (7/30) | 1,9 | 0 % (0/9) |
| 68 | 100 % (30/30) | 93 % (28/30) | 13,5 | 109 | 43 % (13/30) | 4,7 | 0 % (0/9) |
| 69 | 100 % (30/30) | 93 % (28/30) | 14,3 | 170 | 83 % (25/30) | 11,1 | 0 % (0/9) |
| 70 | 100 % (30/30) | 87 % (26/30) | 5,1 | 84 | 17 % (5/30) | 0,3 | 0 % (0/9) |

Écarts aux bandes : 14

- Matou (Plume) : le bot naïf gagne 91 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 62 laisse 262 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 97 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 91 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 12 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 47 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (91 %) et Charlie (12 %) sont à 79 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (18,9 vies) et Charlie (15,6 vies) sont à 3,3 vies l'un de l'autre, il en faut au plus 3

### Région 8 : le Monastère Noir

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 180 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 163 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 197 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 88 % (88/100) | 20,0 | 149 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 38 % (38/100) | 18,2 | 118 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 95 % (95/100) | 19,8 | 152 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 7 % (7/100) | 14,8 | 155 | 0 % (0/30) |
| Vieux Sage | Charlie | 34 % (34/100) | 0 % (0/100) | 2,5 | 96 | 0 % (0/30) |
| Vieux Sage | Pollen | 81 % (81/100) | 1 % (1/100) | 9,3 | 145 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 71 | 100 % (30/30) | 67 % (20/30) | 8,4 | 93 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 72 | 100 % (30/30) | 77 % (23/30) | 10,8 | 112 | 60 % (18/30) | 6,5 | 0 % (0/9) |
| 73 | 100 % (30/30) | 50 % (15/30) | 9,2 | 118 | 90 % (27/30) | 10,2 | 0 % (0/9) |
| 74 | 100 % (30/30) | 90 % (27/30) | 9,8 | 147 | 100 % (30/30) | 13,2 | 0 % (0/9) |
| 75 | 100 % (30/30) | 67 % (20/30) | 9,8 | 132 | 57 % (17/30) | 6,7 | 0 % (0/9) |
| 76 | 100 % (30/30) | 90 % (27/30) | 12,3 | 104 | 93 % (28/30) | 10,4 | 0 % (0/9) |
| 77 | 100 % (30/30) | 80 % (24/30) | 11,6 | 107 | 67 % (20/30) | 9,2 | 0 % (0/9) |
| 78 | 100 % (30/30) | 70 % (21/30) | 10,3 | 121 | 57 % (17/30) | 6,9 | 0 % (0/9) |
| 79 | 100 % (30/30) | 73 % (22/30) | 9,9 | 135 | 67 % (20/30) | 9,1 | 0 % (0/9) |
| 80 | 100 % (30/30) | 73 % (22/30) | 8,5 | 330 | 93 % (28/30) | 11,8 | 0 % (0/9) |

Écarts aux bandes : 13

- Matou (Plume) : le bot naïf gagne 88 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 80 laisse 308 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 80 laisse 356 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 95 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 80 laisse 326 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,2, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 34 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (34 %) sont à 66 points l'un de l'autre, il en faut au plus 10

### Région 9 : la Cité du Roi

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 188 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,9 | 206 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 194 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 72 % (72/100) | 19,6 | 129 | 0 % (0/30) |
| Matou | Charlie | 85 % (85/100) | 31 % (31/100) | 10,8 | 76 | 0 % (0/30) |
| Matou | Pollen | 93 % (93/100) | 86 % (86/100) | 15,5 | 93 | 0 % (0/30) |
| Vieux Sage | Plume | 88 % (88/100) | 1 % (1/100) | 10,7 | 112 | 0 % (0/30) |
| Vieux Sage | Charlie | 7 % (7/100) | 1 % (1/100) | 0,2 | 68 | 0 % (0/30) |
| Vieux Sage | Pollen | 13 % (13/100) | 0 % (0/100) | 0,8 | 74 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 81 | 97 % (29/30) | 63 % (19/30) | 5,9 | 94 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 82 | 93 % (28/30) | 63 % (19/30) | 5,4 | 76 | 37 % (11/30) | 4,8 | 0 % (0/9) |
| 83 | 100 % (30/30) | 47 % (14/30) | 2,9 | 68 | 33 % (10/30) | 2,7 | 0 % (0/9) |
| 84 | 100 % (30/30) | 73 % (22/30) | 11,2 | 124 | 33 % (10/30) | 4,9 | 0 % (0/9) |
| 85 | 93 % (28/30) | 40 % (12/30) | 3,5 | 112 | 33 % (10/30) | 4,8 | 0 % (0/9) |
| 86 | 100 % (30/30) | 77 % (23/30) | 12,2 | 150 | 70 % (21/30) | 6,1 | 0 % (0/9) |
| 87 | 93 % (28/30) | 50 % (15/30) | 2,8 | 48 | 10 % (3/30) | 0,4 | 0 % (0/9) |
| 88 | 100 % (30/30) | 70 % (21/30) | 7,9 | 88 | 40 % (12/30) | 2,9 | 0 % (0/9) |
| 89 | 100 % (30/30) | 67 % (20/30) | 8,2 | 117 | 53 % (16/30) | 6,2 | 0 % (0/9) |
| 90 | 50 % (15/30) | 80 % (24/30) | 8,0 | 116 | 17 % (5/30) | 1,1 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot naïf gagne 72 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 85 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux gagne 93 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 86 % des parties, la bande est 30 % à 70 %
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,3, elle doit être d'au plus -0,6
- Matou : le niveau 90 (8 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 88 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 7 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 13 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (88 %) et Charlie (7 %) sont à 81 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,6 vies) et Charlie (10,8 vies) sont à 8,8 vies l'un de l'autre, il en faut au plus 3

### Région 10 : la Cathédrale du Soleil Blême

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 213 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 175 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 218 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 79 % (79/100) | 19,9 | 149 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 40 % (40/100) | 18,3 | 98 | 0 % (0/30) |
| Matou | Pollen | 98 % (98/100) | 89 % (89/100) | 18,7 | 104 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 4 % (4/100) | 14,3 | 144 | 0 % (0/30) |
| Vieux Sage | Charlie | 26 % (26/100) | 4 % (4/100) | 2,3 | 66 | 0 % (0/30) |
| Vieux Sage | Pollen | 71 % (71/100) | 6 % (6/100) | 8,7 | 85 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 91 | 100 % (30/30) | 63 % (19/30) | 10,9 | 82 | 80 % (24/30) | 12,0 | 0 % (0/9) |
| 92 | 100 % (30/30) | 63 % (19/30) | 9,7 | 53 | 57 % (17/30) | 7,3 | 0 % (0/9) |
| 93 | 100 % (30/30) | 53 % (16/30) | 7,6 | 74 | 77 % (23/30) | 10,6 | 0 % (0/9) |
| 94 | 100 % (30/30) | 70 % (21/30) | 10,3 | 104 | 73 % (22/30) | 10,0 | 0 % (0/9) |
| 95 | 100 % (30/30) | 73 % (22/30) | 9,4 | 105 | 43 % (13/30) | 4,4 | 0 % (0/9) |
| 96 | 100 % (30/30) | 87 % (26/30) | 12,3 | 120 | 90 % (27/30) | 11,7 | 0 % (0/9) |
| 97 | 100 % (30/30) | 67 % (20/30) | 8,3 | 142 | 50 % (15/30) | 6,4 | 0 % (0/9) |
| 98 | 100 % (30/30) | 67 % (20/30) | 7,8 | 113 | 60 % (18/30) | 5,7 | 0 % (0/9) |
| 99 | 100 % (30/30) | 70 % (21/30) | 8,9 | 93 | 90 % (27/30) | 12,1 | 0 % (0/9) |
| 100 | 93 % (28/30) | 80 % (24/30) | 11,3 | 285 | 37 % (11/30) | 3,8 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot naïf gagne 79 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 97 laisse 287 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 100 laisse 371 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 100 laisse 331 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 98 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 89 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou : le niveau 100 (11,3 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 26 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (26 %) sont à 74 points l'un de l'autre, il en faut au plus 10

## Défis, régions 1 à 10

Le bot soigneux joue les défis avec les règles de Matou, sans objet ni amélioration : Héroïque (1 vie, groupes d’élite) et Fer (toutes les vagues en une, deux familles de tours). Il cherche sa variante sur les graines d’entraînement du défi lui-même, puis joue les dix graines d’évaluation. Bande : entre 40 et 90 % de réussites pour chaque défi de chaque région, trois dieux confondus.

### Région 1 : le Village Affamé

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 91 % (91/100) | 0,9 |
| Héroïque | Charlie | 73 % (73/100) | 0,7 |
| Héroïque | Pollen | 83 % (83/100) | 0,8 |
| Héroïque | les trois | 82 % (247/300) | 0,8 |
| Fer | Plume | 94 % (94/100) | 18,3 |
| Fer | Charlie | 98 % (98/100) | 17,5 |
| Fer | Pollen | 69 % (69/100) | 12,1 |
| Fer | les trois | 87 % (261/300) | 16,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 1 | 97 % (29/30) | 100 % (30/30) |
| 2 | 80 % (24/30) | 97 % (29/30) |
| 3 | 100 % (30/30) | 100 % (30/30) |
| 4 | 67 % (20/30) | 67 % (20/30) |
| 5 | 87 % (26/30) | 100 % (30/30) |
| 6 | 100 % (30/30) | 100 % (30/30) |
| 7 | 30 % (9/30) | 67 % (20/30) |
| 8 | 70 % (21/30) | 40 % (12/30) |
| 9 | 100 % (30/30) | 100 % (30/30) |
| 10 | 93 % (28/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 2 : les Champs Brûlés

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 93 % (93/100) | 0,9 |
| Héroïque | Charlie | 56 % (56/100) | 0,6 |
| Héroïque | Pollen | 69 % (69/100) | 0,7 |
| Héroïque | les trois | 73 % (218/300) | 0,7 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 100 % (100/100) | 19,8 |
| Fer | Pollen | 60 % (60/100) | 12,0 |
| Fer | les trois | 87 % (260/300) | 17,3 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 11 | 100 % (30/30) | 100 % (30/30) |
| 12 | 100 % (30/30) | 100 % (30/30) |
| 13 | 97 % (29/30) | 67 % (20/30) |
| 14 | 67 % (20/30) | 100 % (30/30) |
| 15 | 63 % (19/30) | 67 % (20/30) |
| 16 | 97 % (29/30) | 100 % (30/30) |
| 17 | 30 % (9/30) | 100 % (30/30) |
| 18 | 30 % (9/30) | 67 % (20/30) |
| 19 | 83 % (25/30) | 100 % (30/30) |
| 20 | 60 % (18/30) | 67 % (20/30) |

Écarts aux bandes des défis : aucun.

### Région 3 : le Bourg des Bûchers

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 97 % (97/100) | 1,0 |
| Héroïque | Charlie | 65 % (65/100) | 0,7 |
| Héroïque | Pollen | 85 % (85/100) | 0,9 |
| Héroïque | les trois | 82 % (247/300) | 0,8 |
| Fer | Plume | 90 % (90/100) | 18,0 |
| Fer | Charlie | 95 % (95/100) | 17,1 |
| Fer | Pollen | 49 % (49/100) | 8,9 |
| Fer | les trois | 78 % (234/300) | 14,7 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 21 | 80 % (24/30) | 100 % (30/30) |
| 22 | 37 % (11/30) | 100 % (30/30) |
| 23 | 90 % (27/30) | 67 % (20/30) |
| 24 | 100 % (30/30) | 67 % (20/30) |
| 25 | 100 % (30/30) | 100 % (30/30) |
| 26 | 100 % (30/30) | 97 % (29/30) |
| 27 | 63 % (19/30) | 17 % (5/30) |
| 28 | 87 % (26/30) | 100 % (30/30) |
| 29 | 67 % (20/30) | 67 % (20/30) |
| 30 | 100 % (30/30) | 67 % (20/30) |

Écarts aux bandes des défis : aucun.

### Région 4 : les Marais de l’Ordalie

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 90 % (90/100) | 0,9 |
| Héroïque | Charlie | 37 % (37/100) | 0,4 |
| Héroïque | Pollen | 74 % (74/100) | 0,7 |
| Héroïque | les trois | 67 % (201/300) | 0,7 |
| Fer | Plume | 100 % (100/100) | 19,7 |
| Fer | Charlie | 93 % (93/100) | 17,6 |
| Fer | Pollen | 60 % (60/100) | 12,0 |
| Fer | les trois | 84 % (253/300) | 16,4 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 31 | 97 % (29/30) | 100 % (30/30) |
| 32 | 33 % (10/30) | 100 % (30/30) |
| 33 | 47 % (14/30) | 67 % (20/30) |
| 34 | 73 % (22/30) | 100 % (30/30) |
| 35 | 57 % (17/30) | 67 % (20/30) |
| 36 | 57 % (17/30) | 67 % (20/30) |
| 37 | 60 % (18/30) | 100 % (30/30) |
| 38 | 93 % (28/30) | 100 % (30/30) |
| 39 | 63 % (19/30) | 43 % (13/30) |
| 40 | 90 % (27/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 5 : la Ville Pestiférée

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 99 % (99/100) | 1,0 |
| Héroïque | Charlie | 53 % (53/100) | 0,5 |
| Héroïque | Pollen | 89 % (89/100) | 0,9 |
| Héroïque | les trois | 80 % (241/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 19,6 |
| Fer | Charlie | 32 % (32/100) | 6,1 |
| Fer | Pollen | 40 % (40/100) | 7,8 |
| Fer | les trois | 57 % (172/300) | 11,2 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 41 | 97 % (29/30) | 100 % (30/30) |
| 42 | 90 % (27/30) | 100 % (30/30) |
| 43 | 100 % (30/30) | 33 % (10/30) |
| 44 | 97 % (29/30) | 33 % (10/30) |
| 45 | 67 % (20/30) | 33 % (10/30) |
| 46 | 37 % (11/30) | 73 % (22/30) |
| 47 | 67 % (20/30) | 33 % (10/30) |
| 48 | 67 % (20/30) | 33 % (10/30) |
| 49 | 83 % (25/30) | 100 % (30/30) |
| 50 | 100 % (30/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 6 : le Charnier

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 99 % (99/100) | 1,0 |
| Héroïque | Charlie | 49 % (49/100) | 0,5 |
| Héroïque | Pollen | 84 % (84/100) | 0,8 |
| Héroïque | les trois | 77 % (232/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 19,6 |
| Fer | Charlie | 76 % (76/100) | 13,2 |
| Fer | Pollen | 51 % (51/100) | 10,1 |
| Fer | les trois | 76 % (227/300) | 14,3 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 51 | 93 % (28/30) | 100 % (30/30) |
| 52 | 93 % (28/30) | 100 % (30/30) |
| 53 | 73 % (22/30) | 67 % (20/30) |
| 54 | 100 % (30/30) | 100 % (30/30) |
| 55 | 77 % (23/30) | 33 % (10/30) |
| 56 | 80 % (24/30) | 53 % (16/30) |
| 57 | 53 % (16/30) | 100 % (30/30) |
| 58 | 80 % (24/30) | 43 % (13/30) |
| 59 | 80 % (24/30) | 67 % (20/30) |
| 60 | 43 % (13/30) | 93 % (28/30) |

Écarts aux bandes des défis : aucun.

### Région 7 : la Croisade

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 86 % (86/100) | 0,9 |
| Héroïque | Charlie | 26 % (26/100) | 0,3 |
| Héroïque | Pollen | 58 % (58/100) | 0,6 |
| Héroïque | les trois | 57 % (170/300) | 0,6 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 85 % (85/100) | 14,7 |
| Fer | Pollen | 76 % (76/100) | 13,6 |
| Fer | les trois | 87 % (261/300) | 16,1 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 61 | 27 % (8/30) | 100 % (30/30) |
| 62 | 57 % (17/30) | 100 % (30/30) |
| 63 | 10 % (3/30) | 100 % (30/30) |
| 64 | 73 % (22/30) | 87 % (26/30) |
| 65 | 100 % (30/30) | 50 % (15/30) |
| 66 | 70 % (21/30) | 100 % (30/30) |
| 67 | 33 % (10/30) | 100 % (30/30) |
| 68 | 97 % (29/30) | 100 % (30/30) |
| 69 | 53 % (16/30) | 100 % (30/30) |
| 70 | 47 % (14/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 8 : le Monastère Noir

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 100 % (100/100) | 1,0 |
| Héroïque | Charlie | 60 % (60/100) | 0,6 |
| Héroïque | Pollen | 96 % (96/100) | 1,0 |
| Héroïque | les trois | 85 % (256/300) | 0,9 |
| Fer | Plume | 100 % (100/100) | 19,9 |
| Fer | Charlie | 80 % (80/100) | 14,2 |
| Fer | Pollen | 60 % (60/100) | 11,2 |
| Fer | les trois | 80 % (240/300) | 15,1 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 71 | 97 % (29/30) | 100 % (30/30) |
| 72 | 97 % (29/30) | 100 % (30/30) |
| 73 | 100 % (30/30) | 100 % (30/30) |
| 74 | 93 % (28/30) | 100 % (30/30) |
| 75 | 57 % (17/30) | 100 % (30/30) |
| 76 | 100 % (30/30) | 67 % (20/30) |
| 77 | 77 % (23/30) | 67 % (20/30) |
| 78 | 70 % (21/30) | 100 % (30/30) |
| 79 | 70 % (21/30) | 33 % (10/30) |
| 80 | 93 % (28/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 9 : la Cité du Roi

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 81 % (81/100) | 0,8 |
| Héroïque | Charlie | 35 % (35/100) | 0,4 |
| Héroïque | Pollen | 31 % (31/100) | 0,3 |
| Héroïque | les trois | 49 % (147/300) | 0,5 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 90 % (90/100) | 15,2 |
| Fer | Pollen | 71 % (71/100) | 12,7 |
| Fer | les trois | 87 % (261/300) | 15,9 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 81 | 77 % (23/30) | 100 % (30/30) |
| 82 | 70 % (21/30) | 100 % (30/30) |
| 83 | 13 % (4/30) | 100 % (30/30) |
| 84 | 67 % (20/30) | 100 % (30/30) |
| 85 | 43 % (13/30) | 70 % (21/30) |
| 86 | 90 % (27/30) | 67 % (20/30) |
| 87 | 10 % (3/30) | 100 % (30/30) |
| 88 | 53 % (16/30) | 100 % (30/30) |
| 89 | 53 % (16/30) | 33 % (10/30) |
| 90 | 13 % (4/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 10 : la Cathédrale du Soleil Blême

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 100 % (100/100) | 1,0 |
| Héroïque | Charlie | 62 % (62/100) | 0,6 |
| Héroïque | Pollen | 85 % (85/100) | 0,9 |
| Héroïque | les trois | 82 % (247/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 81 % (81/100) | 15,9 |
| Fer | Pollen | 76 % (76/100) | 13,0 |
| Fer | les trois | 86 % (257/300) | 16,3 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 91 | 100 % (30/30) | 100 % (30/30) |
| 92 | 100 % (30/30) | 100 % (30/30) |
| 93 | 67 % (20/30) | 67 % (20/30) |
| 94 | 97 % (29/30) | 100 % (30/30) |
| 95 | 33 % (10/30) | 33 % (10/30) |
| 96 | 80 % (24/30) | 100 % (30/30) |
| 97 | 77 % (23/30) | 57 % (17/30) |
| 98 | 97 % (29/30) | 100 % (30/30) |
| 99 | 73 % (22/30) | 100 % (30/30) |
| 100 | 100 % (30/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

## Mode infini

Matou, 20 vies, sans amélioration ni objet, chaque dieu avec son avatar, 10 graines par ligne. Résultat d’une partie : la dernière vague terminée (le record). On arrête une partie à la vague 100. Bandes, sur les cartes de la région 1 : la médiane du soigneux est entre la vague 25 et la vague 45 ; le naïf ne passe pas la vague 30 (aucune de ses parties). Les autres cartes sont données à titre d’information. Le soigneux joue une seule variante (équilibrée, diversité 0,4) et lit les 30 premières vagues générées.

| Bot | Dieu | Carte | Médiane | Min à max | Vagues par graine |
| --- | --- | --- | --- | --- | --- |
| Naïf | plume | chaumes (région 1) | 20 | 7 à 29 | 7 7 9 9 12 28 28 28 28 29 |
| Soigneux | plume | chaumes (région 1) | 36 | 35 à 36 | 35 35 36 36 36 36 36 36 36 36 |
| Naïf | charlie | chaumes (région 1) | 8.5 | 5 à 27 | 5 5 7 7 8 9 9 12 26 27 |
| Soigneux | charlie | chaumes (région 1) | 35 | 34 à 36 | 34 34 34 35 35 35 35 35 35 36 |
| Naïf | pollen | chaumes (région 1) | 28 | 26 à 29 | 26 28 28 28 28 28 28 29 29 29 |
| Soigneux | pollen | chaumes (région 1) | 35 | 34 à 36 | 34 35 35 35 35 35 35 35 36 36 |
| Naïf | plume | gue (région 1) | 28 | 11 à 29 | 11 26 28 28 28 28 28 29 29 29 |
| Soigneux | plume | gue (région 1) | 34 | 33 à 35 | 33 33 34 34 34 34 34 34 34 35 |
| Naïf | charlie | gue (région 1) | 26 | 9 à 28 | 9 9 9 9 26 26 27 27 28 28 |
| Soigneux | charlie | gue (région 1) | 32.5 | 31 à 33 | 31 32 32 32 32 33 33 33 33 33 |
| Naïf | pollen | gue (région 1) | 28 | 27 à 29 | 27 27 28 28 28 28 28 29 29 29 |
| Soigneux | pollen | gue (région 1) | 33 | 32 à 33 | 32 32 32 33 33 33 33 33 33 33 |
| Naïf | plume | pendus (région 1) | 10.5 | 8 à 29 | 8 9 9 9 9 12 25 27 28 29 |
| Soigneux | plume | pendus (région 1) | 36 | 36 à 37 | 36 36 36 36 36 36 36 36 37 37 |
| Naïf | charlie | pendus (région 1) | 7.5 | 6 à 26 | 6 6 7 7 7 8 8 8 9 26 |
| Soigneux | charlie | pendus (région 1) | 35 | 34 à 36 | 34 34 35 35 35 35 35 35 36 36 |
| Naïf | pollen | pendus (région 1) | 27.5 | 25 à 29 | 25 26 27 27 27 28 28 28 28 29 |
| Soigneux | pollen | pendus (région 1) | 35 | 35 à 36 | 35 35 35 35 35 35 35 36 36 36 |
| Naïf | plume | carrefour (région 1) | 28 | 7 à 29 | 7 27 27 28 28 28 28 29 29 29 |
| Soigneux | plume | carrefour (région 1) | 34 | 34 à 35 | 34 34 34 34 34 34 35 35 35 35 |
| Naïf | charlie | carrefour (région 1) | 14 | 7 à 26 | 7 12 12 12 12 16 25 26 26 26 |
| Soigneux | charlie | carrefour (région 1) | 33 | 32 à 34 | 32 33 33 33 33 33 33 33 34 34 |
| Naïf | pollen | carrefour (région 1) | 27.5 | 27 à 28 | 27 27 27 27 27 28 28 28 28 28 |
| Soigneux | pollen | carrefour (région 1) | 33 | 32 à 34 | 32 32 33 33 33 33 33 33 33 34 |
| Naïf | plume | region3 (région 3) | 9 | 6 à 12 | 6 8 8 8 9 9 9 9 12 12 |
| Soigneux | plume | region3 (région 3) | 35.5 | 34 à 37 | 34 34 35 35 35 36 36 36 36 37 |
| Naïf | charlie | region3 (région 3) | 8.5 | 5 à 12 | 5 7 7 8 8 9 9 9 9 12 |
| Soigneux | charlie | region3 (région 3) | 30.5 | 11 à 32 | 11 15 19 27 30 31 32 32 32 32 |
| Naïf | pollen | region3 (région 3) | 13.5 | 9 à 17 | 9 11 12 13 13 14 14 14 16 17 |
| Soigneux | pollen | region3 (région 3) | 31.5 | 29 à 34 | 29 30 31 31 31 32 32 32 33 34 |
| Naïf | plume | region6 (région 6) | 9 | 9 à 14 | 9 9 9 9 9 9 9 13 13 14 |
| Soigneux | plume | region6 (région 6) | 37 | 35 à 38 | 35 36 36 36 37 37 37 37 37 38 |
| Naïf | charlie | region6 (région 6) | 9 | 7 à 13 | 7 7 9 9 9 9 9 9 9 13 |
| Soigneux | charlie | region6 (région 6) | 32 | 30 à 34 | 30 31 31 31 32 32 33 33 33 34 |
| Naïf | pollen | region6 (région 6) | 17.5 | 13 à 29 | 13 13 14 15 17 18 18 27 28 29 |
| Soigneux | pollen | region6 (région 6) | 29 | 27 à 33 | 27 27 28 28 29 29 31 31 32 33 |
| Naïf | plume | region10 (région 10) | 13.5 | 9 à 16 | 9 9 9 13 13 14 14 14 16 16 |
| Soigneux | plume | region10 (région 10) | 34 | 32 à 36 | 32 34 34 34 34 34 34 35 35 36 |
| Naïf | charlie | region10 (région 10) | 9 | 4 à 14 | 4 9 9 9 9 9 11 13 13 14 |
| Soigneux | charlie | region10 (région 10) | 14 | 9 à 28 | 9 9 10 13 14 14 15 16 18 28 |
| Naïf | pollen | region10 (région 10) | 14.5 | 9 à 16 | 9 12 14 14 14 15 15 15 16 16 |
| Soigneux | pollen | region10 (région 10) | 14.5 | 7 à 34 | 7 9 9 9 14 15 15 18 29 34 |

Écarts aux bandes de l’infini : aucun.

## La zone (jalon 5)

Taux de victoire du soigneux, trois dieux, sans tour divine, 45 % des arêtes de départ en Vieux Sage (sans quoi tout se gagne), avec quatre compositions de tours : sans zone (tir, magie), zone sans caserne (tir, magie, artillerie), caserne sans zone (caserne, tir, magie), caserne et zone. Niveaux ordinaires : 4, 6, 8, 14, 15, 18, 22, 25 ; niveaux de horde : 7, 13, 17.

| Niveaux | Sans zone | Zone, sans caserne | Caserne, sans zone | Caserne et zone |
| --- | --- | --- | --- | --- |
| Ordinaires | 59 % | 61 % | 58 % | 73 % |
| Horde | 17 % | 59 % | 6 % | 63 % |

Critères : ordinaires, la zone sans caserne ne gagne pas plus que sans zone (écart 2 points, au plus 6 tolérés) ; avec caserne, la zone gagne 15 points de plus (au moins 10) ; en horde, la zone gagne 43 points de plus (au moins 20).
