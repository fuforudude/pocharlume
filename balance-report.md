# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau des régions 1 à 10 (la région 1 en détail dans cette partie, les régions 2 à 10, les défis et le mode infini plus bas) est rejoué sans
affichage dans les trois difficultés, avec chacun des trois dieux jouant son avatar (sans amélioration ni objet), par deux bots, sur 10 graines chacun (version des données 12).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (case de la grille, famille, niveau,
  spécialisation, bonus et remise de famille du dieu compris), après une petite recherche entre douze variantes (6 préférences × 2 diversités, dont « bloquer puis zone ») jouées sur des graines d’entraînement ;
  place le héros dans la zone de feu de ses tours ; joue les sorts de son dieu selon leur effet (Chute du Colosse sur les grappes, Renforts et Voile de Nuit devant la zone de feu,
  Griffes d’Ombre sur la plus grosse grappe, Pièges à Ressort un peu avant la zone de feu, Ingéniosité au cœur de ses tours) ; construit la tour divine de son dieu dès la troisième tour ;
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter. Il lit la composition des vagues futures, ce qu’un joueur ne voit pas : il est un peu optimiste.
- **Naïf** : construit sur les cases de la grille proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans tour divine, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

**13 écart(s)**, dont 13 aux bandes suspendues de Matou et de Vieux Sage (elles ne bloquent pas : voir bandes.ts) :

- Matou (Plume) : le bot naïf gagne 75 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 10 laisse 294 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 98 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,1, elle doit être d'au plus -0,6
- Matou : le niveau 10 (18,7 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 99 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %

Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins 1 vie sur 50 % des niveaux et en laissant moins de 250 arêtes inutilisées par niveau, le naïf gagne 30 % à 70 % ;
Vieux Sage, le soigneux gagne 60 % à 85 % ; sans défense on perd. Entre dieux : en Vieux Sage, au plus 10,0 points d’écart de taux de victoire du soigneux ; en Matou, au plus 3 vies d’écart de vies moyennes du soigneux.

### Dieu × difficulté

Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins 1 vie.

| Difficulté | Dieu | Naïf : victoires | Soigneux : victoires | Bande du soigneux | Naïf : vies | Soigneux : vies | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % | 100 % | — | 25,0 | 25,0 | 134 / 205 | 0/10 | 0 % |
| Chaton | Charlie | 100 % | 100 % | — | 25,0 | 25,0 | 118 / 172 | 0/10 | 0 % |
| Chaton | Pollen | 100 % | 100 % | — | 25,0 | 25,0 | 126 / 195 | 0/10 | 10 % |
| Matou | Plume | 75 % | 100 % | 100 % | 10,8 | 19,6 | 108 / 196 | 2/10 | 0 % |
| Matou | Charlie | 51 % | 100 % | 100 % | 6,0 | 19,3 | 137 / 294 | 2/10 | 0 % |
| Matou | Pollen | 98 % | 100 % | 100 % | 17,9 | 19,9 | 117 / 202 | 0/10 | 0 % |
| Vieux Sage | Plume | 24 % | 100 % | 60 % à 85 % | 2,1 | 14,1 | 104 / 265 | 2/10 | 0 % |
| Vieux Sage | Charlie | 15 % | 99 % | 60 % à 85 % | 1,1 | 13,8 | 97 / 191 | 3/10 | 0 % |
| Vieux Sage | Pollen | 67 % | 100 % | 60 % à 85 % | 7,8 | 15,0 | 99 / 169 | 0/10 | 0 % |

Bande du naïf : Chaton 100 %, Matou 30 % à 70 %. Matou : au moins 50 % des niveaux avec perte. Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

### Écarts entre dieux

| Mesure du soigneux | Plume | Charlie | Pollen | Écart maximal | Écart permis |
| --- | --- | --- | --- | --- | --- |
| Vieux Sage : taux de victoire | 100 % | 99 % | 100 % | 1,0 points | 10,0 points |
| Matou : vies moyennes | 19,6 | 19,3 | 19,9 | 0,6 vies | 3 vies |

## Plume

Héros : Plume, l’Ombre Première. Bonus de famille : Tir — PV des soldats +0 %, cadence +60 %, critique +15 points, prix +0 %. Sorts : Voile de Nuit (recharge 30 s), Griffes d’Ombre (recharge 40 s). Tour divine : Sanctuaire de l’Ombre (200 arêtes).

### Plume : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 75 / 96 | aucune / aucune | 193 / 162 | perdu en 218 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 154 / 154 | aucune / aucune | 445 / 397 | perdu en 161 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 128 / 182 | aucune / aucune | 200 / 132 | perdu en 171 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 153 / 117 | aucune / aucune | 384 / 343 | perdu en 163 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 170 / 98 | aucune / aucune | 259 / 217 | perdu en 136 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 114 / 183 | aucune / aucune | 355 / 286 | perdu en 151 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 141 / 87 | aucune / aucune | 310 / 261 | perdu en 117 s |
| 8 | 100 % (10/10) | 24,6 | 100 % (10/10) | 25,0 | 194 / 85 | 2 (0,4 vies) / aucune | 463 / 412 | perdu en 150 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 114 / 134 | aucune / aucune | 553 / 459 | perdu en 129 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 558 / 205 | aucune / aucune | 592 / 490 | perdu en 114 s |

### Plume : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 70 % (7/10) | 10,2 | 100 % (10/10) | 18,2 | 67 / 91 | 4 (3,1 vies) / 5 (1,8 vies) | 216 / 201 | perdu en 156 s |
| 2 | 50 % (5/10) | 4,9 | 100 % (10/10) | 19,5 | 68 / 104 | 2 (8,6 vies) / 3 (0,5 vies) | 309 / 423 | perdu en 119 s |
| 3 | 90 % (9/10) | 17,4 | 100 % (10/10) | 20,0 | 62 / 196 | 3 (1,0 vies) / aucune | 203 / 181 | perdu en 127 s |
| 4 | 100 % (10/10) | 17,2 | 100 % (10/10) | 20,0 | 93 / 129 | 2 (1,4 vies) / aucune | 393 / 352 | perdu en 120 s |
| 5 | 60 % (6/10) | 6,0 | 100 % (10/10) | 19,0 | 87 / 62 | 2 (4,3 vies) / 4 (0,6 vies) | 227 / 234 | perdu en 116 s |
| 6 | 100 % (10/10) | 15,0 | 100 % (10/10) | 19,8 | 114 / 60 | 3 (2,5 vies) / 7 (0,2 vies) | 366 / 329 | perdu en 129 s |
| 7 | 60 % (6/10) | 2,9 | 100 % (10/10) | 19,8 | 127 / 67 | 2 (5,7 vies) / 5 (0,2 vies) | 242 / 275 | perdu en 92 s |
| 8 | 20 % (2/10) | 1,3 | 100 % (10/10) | 20,0 | 55 / 93 | 3 (11,1 vies) / aucune | 211 / 427 | perdu en 113 s |
| 9 | 100 % (10/10) | 13,6 | 100 % (10/10) | 20,0 | 109 / 101 | 4 (5,3 vies) / aucune | 562 / 519 | perdu en 117 s |
| 10 | 100 % (10/10) | 19,0 | 100 % (10/10) | 20,0 | 226 / 175 | 6 (0,9 vies) / aucune | 606 / 619 | perdu en 87 s |

### Plume : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,7 | 62 / 122 | 3 (4,5 vies) / 6 (0,3 vies) | 175 / 185 | perdu en 131 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,9 | 61 / 42 | 2 (10,0 vies) / 3 (0,1 vies) | 126 / 423 | perdu en 112 s |
| 3 | 80 % (8/10) | 8,0 | 100 % (10/10) | 15,0 | 47 / 156 | 3 (3,2 vies) / aucune | 197 / 188 | perdu en 109 s |
| 4 | 20 % (2/10) | 1,4 | 100 % (10/10) | 15,0 | 42 / 80 | 3 (6,8 vies) / aucune | 186 / 350 | perdu en 112 s |
| 5 | 0 % (0/10) | 0,0 | 100 % (10/10) | 10,1 | 69 / 33 | 2 (6,3 vies) / 6 (2,5 vies) | 123 / 232 | perdu en 94 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 61 / 73 | 4 (6,5 vies) / aucune | 168 / 331 | perdu en 95 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 12,1 | 47 / 55 | 2 (8,3 vies) / 1 (1,7 vies) | 100 / 282 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,4 | 55 / 68 | 3 (8,5 vies) / 2 (0,5 vies) | 114 / 428 | perdu en 108 s |
| 9 | 40 % (4/10) | 1,1 | 100 % (10/10) | 15,0 | 119 / 149 | 4 (8,2 vies) / aucune | 308 / 517 | perdu en 96 s |
| 10 | 100 % (10/10) | 10,9 | 100 % (10/10) | 14,9 | 216 / 265 | 6 (2,8 vies) / 5 (0,1 vies) | 614 / 611 | perdu en 78 s |

Tours choisies par le soigneux en Matou avec Plume : la plus choisie, Clocher des Archers (construction) (837 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | caserne, diversité 1 | caserne, diversité 0.4 | caserne, diversité 1 |
| 2 | caserne, diversité 0.4 | caserne, diversité 0.4 | bloquer puis zone, diversité 1 |
| 3 | magie, diversité 1 | artillerie, diversité 1 | magie, diversité 1 |
| 4 | bloquer puis zone, diversité 1 | artillerie, diversité 0.4 | tir, diversité 0.4 |
| 5 | artillerie, diversité 1 | tir, diversité 0.4 | magie, diversité 0.4 |
| 6 | magie, diversité 0.4 | caserne, diversité 1 | tir, diversité 0.4 |
| 7 | caserne, diversité 0.4 | équilibrée, diversité 1 | tir, diversité 0.4 |
| 8 | bloquer puis zone, diversité 1 | équilibrée, diversité 1 | tir, diversité 0.4 |
| 9 | artillerie, diversité 0.4 | caserne, diversité 0.4 | artillerie, diversité 0.4 |
| 10 | magie, diversité 0.4 | équilibrée, diversité 0.4 | artillerie, diversité 1 |

## Charlie

Héros : Charlie, le Colosse. Bonus de famille : Caserne — PV des soldats +25 %, cadence +0 %, critique +0 points, prix +0 %. Sorts : Chute du Colosse (recharge 25 s), Renforts (recharge 20 s). Tour divine : Totem du Colosse (200 arêtes).

### Charlie : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 75 / 125 | aucune / aucune | 196 / 150 | perdu en 185 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 131 / 172 | aucune / aucune | 447 / 394 | perdu en 156 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 128 / 52 | aucune / aucune | 201 / 143 | perdu en 229 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 153 / 116 | aucune / aucune | 385 / 314 | perdu en 151 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 170 / 109 | aucune / aucune | 260 / 229 | perdu en 124 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 114 / 124 | aucune / aucune | 357 / 300 | perdu en 148 s |
| 7 | 100 % (10/10) | 24,9 | 100 % (10/10) | 25,0 | 140 / 75 | 1 (0,1 vies) / aucune | 310 / 260 | perdu en 119 s |
| 8 | 100 % (10/10) | 24,6 | 100 % (10/10) | 25,0 | 194 / 162 | 2 (0,4 vies) / aucune | 464 / 403 | perdu en 150 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 114 / 103 | aucune / aucune | 556 / 491 | perdu en 127 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 581 / 138 | aucune / aucune | 596 / 521 | perdu en 115 s |

### Charlie : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 20 % (2/10) | 1,0 | 100 % (10/10) | 20,0 | 73 / 111 | 4 (5,3 vies) / aucune | 197 / 180 | perdu en 153 s |
| 2 | 10 % (1/10) | 0,8 | 100 % (10/10) | 20,0 | 46 / 134 | 2 (12,0 vies) / aucune | 184 / 421 | perdu en 117 s |
| 3 | 90 % (9/10) | 16,6 | 100 % (10/10) | 20,0 | 67 / 146 | 3 (1,7 vies) / aucune | 200 / 185 | perdu en 109 s |
| 4 | 70 % (7/10) | 5,4 | 100 % (10/10) | 20,0 | 76 / 114 | 3 (6,3 vies) / aucune | 324 / 358 | perdu en 118 s |
| 5 | 40 % (4/10) | 2,1 | 100 % (10/10) | 16,0 | 75 / 201 | 4 (4,9 vies) / 7 (3,2 vies) | 196 / 238 | perdu en 107 s |
| 6 | 80 % (8/10) | 9,0 | 100 % (10/10) | 20,0 | 78 / 96 | 4 (4,6 vies) / aucune | 331 / 325 | perdu en 102 s |
| 7 | 20 % (2/10) | 1,3 | 100 % (10/10) | 19,2 | 104 / 69 | 2 (6,0 vies) / 2 (0,5 vies) | 171 / 278 | perdu en 89 s |
| 8 | 10 % (1/10) | 0,6 | 100 % (10/10) | 19,1 | 49 / 92 | 3 (10,7 vies) / 3 (0,9 vies) | 176 / 428 | perdu en 110 s |
| 9 | 70 % (7/10) | 6,2 | 100 % (10/10) | 19,9 | 126 / 109 | 4 (9,4 vies) / 4 (0,1 vies) | 440 / 527 | perdu en 107 s |
| 10 | 100 % (10/10) | 17,2 | 100 % (10/10) | 18,5 | 239 / 294 | 6 (2,2 vies) / 3 (1,5 vies) | 613 / 582 | perdu en 81 s |

### Charlie : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 68 / 191 | 3 (6,5 vies) / aucune | 151 / 194 | perdu en 130 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,6 | 30 / 137 | 2 (9,0 vies) / 2 (1,4 vies) | 119 / 427 | perdu en 111 s |
| 3 | 70 % (7/10) | 4,8 | 100 % (10/10) | 15,0 | 64 / 124 | 3 (4,4 vies) / aucune | 187 / 186 | perdu en 108 s |
| 4 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 49 / 102 | 2 (10,3 vies) / aucune | 120 / 367 | perdu en 111 s |
| 5 | 0 % (0/10) | 0,0 | 90 % (9/10) | 7,2 | 34 / 60 | 2 (6,7 vies) / 7 (3,2 vies) | 110 / 244 | perdu en 91 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,8 | 68 / 43 | 3 (6,0 vies) / 7 (0,2 vies) | 145 / 328 | perdu en 94 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,4 | 65 / 33 | 2 (9,1 vies) / 2 (1,0 vies) | 89 / 279 | perdu en 73 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,3 | 43 / 44 | 3 (7,3 vies) / 3 (0,3 vies) | 112 / 435 | perdu en 106 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,7 | 56 / 69 | 3 (8,9 vies) / 5 (0,3 vies) | 133 / 525 | perdu en 94 s |
| 10 | 80 % (8/10) | 5,8 | 100 % (10/10) | 15,0 | 225 / 165 | 6 (4,5 vies) / aucune | 540 / 595 | perdu en 76 s |

Tours choisies par le soigneux en Matou avec Charlie : la plus choisie, Grenier des Griffes (construction) (724 fois) ; la moins choisie, Mortier de Soufre (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | tir, diversité 1 | magie, diversité 1 | bloquer puis zone, diversité 1 |
| 2 | magie, diversité 0.4 | magie, diversité 0.4 | magie, diversité 1 |
| 3 | équilibrée, diversité 0.4 | tir, diversité 1 | caserne, diversité 1 |
| 4 | artillerie, diversité 0.4 | tir, diversité 0.4 | bloquer puis zone, diversité 1 |
| 5 | magie, diversité 1 | équilibrée, diversité 1 | équilibrée, diversité 0.4 |
| 6 | équilibrée, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 7 | magie, diversité 0.4 | tir, diversité 0.4 | bloquer puis zone, diversité 0.4 |
| 8 | magie, diversité 0.4 | artillerie, diversité 1 | magie, diversité 0.4 |
| 9 | artillerie, diversité 1 | caserne, diversité 1 | équilibrée, diversité 0.4 |
| 10 | équilibrée, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 0.4 |

## Pollen

Héros : Pollen, Trois-Pattes. Bonus de famille : Artillerie — PV des soldats +0 %, cadence +15 %, critique +0 points, prix −10 %. Sorts : Pièges à Ressort (recharge 30 s), Ingéniosité (recharge 50 s). Tour divine : Atelier Boiteux (200 arêtes).

### Pollen : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 70 / 119 | aucune / aucune | 193 / 160 | gagné 3/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 150 / 195 | aucune / aucune | 444 / 387 | perdu en 368 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 101 / 104 | aucune / aucune | 197 / 159 | perdu en 193 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 118 / 183 | aucune / aucune | 384 / 341 | perdu en 402 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 123 / 49 | aucune / aucune | 259 / 217 | perdu en 260 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 157 / 106 | aucune / aucune | 354 / 303 | perdu en 318 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 188 / 95 | aucune / aucune | 310 / 258 | perdu en 142 s |
| 8 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 160 / 162 | aucune / aucune | 463 / 387 | perdu en 335 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 125 / 123 | aucune / aucune | 554 / 471 | perdu en 130 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 831 / 130 | aucune / aucune | 593 / 518 | perdu en 210 s |

### Pollen : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 55 / 182 | aucune / aucune | 206 / 157 | perdu en 218 s |
| 2 | 100 % (10/10) | 19,6 | 100 % (10/10) | 20,0 | 86 / 95 | 2 (0,3 vies) / aucune | 462 / 422 | perdu en 159 s |
| 3 | 100 % (10/10) | 18,8 | 100 % (10/10) | 19,9 | 64 / 120 | 5 (0,9 vies) / 5 (0,1 vies) | 213 / 180 | perdu en 144 s |
| 4 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 79 / 115 | aucune / aucune | 392 / 353 | perdu en 166 s |
| 5 | 100 % (10/10) | 19,5 | 100 % (10/10) | 19,6 | 85 / 100 | 2 (0,3 vies) / 2 (0,4 vies) | 264 / 236 | perdu en 143 s |
| 6 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 114 / 106 | aucune / aucune | 367 / 323 | perdu en 150 s |
| 7 | 80 % (8/10) | 9,9 | 100 % (10/10) | 19,9 | 77 / 61 | 5 (5,0 vies) / 6 (0,1 vies) | 284 / 273 | perdu en 109 s |
| 8 | 100 % (10/10) | 18,5 | 100 % (10/10) | 20,0 | 117 / 74 | 3 (1,2 vies) / aucune | 469 / 427 | perdu en 156 s |
| 9 | 100 % (10/10) | 12,3 | 100 % (10/10) | 20,0 | 139 / 118 | 4 (5,6 vies) / aucune | 560 / 522 | perdu en 127 s |
| 10 | 100 % (10/10) | 20,0 | 100 % (10/10) | 19,4 | 157 / 202 | aucune / 6 (0,4 vies) | 609 / 576 | perdu en 125 s |

### Pollen : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 13,5 | 100 % (10/10) | 15,0 | 60 / 151 | 4 (1,0 vies) / aucune | 212 / 161 | perdu en 182 s |
| 2 | 60 % (6/10) | 3,4 | 100 % (10/10) | 15,0 | 96 / 90 | 2 (6,3 vies) / aucune | 344 / 427 | perdu en 123 s |
| 3 | 60 % (6/10) | 7,1 | 100 % (10/10) | 15,0 | 56 / 108 | 5 (4,5 vies) / aucune | 194 / 195 | perdu en 127 s |
| 4 | 100 % (10/10) | 13,6 | 100 % (10/10) | 15,0 | 66 / 77 | 3 (1,3 vies) / aucune | 395 / 362 | perdu en 128 s |
| 5 | 90 % (9/10) | 10,0 | 100 % (10/10) | 15,0 | 95 / 65 | 2 (1,6 vies) / aucune | 268 / 237 | perdu en 120 s |
| 6 | 100 % (10/10) | 13,5 | 100 % (10/10) | 15,0 | 117 / 74 | 3 (0,7 vies) / aucune | 369 / 330 | perdu en 138 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 48 / 85 | 4 (6,4 vies) / aucune | 139 / 272 | perdu en 96 s |
| 8 | 20 % (2/10) | 0,9 | 100 % (10/10) | 15,0 | 73 / 75 | 3 (8,2 vies) / aucune | 227 / 434 | perdu en 118 s |
| 9 | 40 % (4/10) | 2,2 | 100 % (10/10) | 15,0 | 53 / 96 | 4 (7,1 vies) / aucune | 306 / 523 | perdu en 123 s |
| 10 | 100 % (10/10) | 14,2 | 100 % (10/10) | 14,6 | 181 / 169 | 6 (0,5 vies) / 6 (0,4 vies) | 615 / 566 | perdu en 91 s |

Tours choisies par le soigneux en Matou avec Pollen : la plus choisie, Grenier des Griffes (construction) (859 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | caserne, diversité 1 | tir, diversité 1 | tir, diversité 1 |
| 2 | magie, diversité 0.4 | équilibrée, diversité 0.4 | équilibrée, diversité 0.4 |
| 3 | tir, diversité 1 | équilibrée, diversité 1 | artillerie, diversité 1 |
| 4 | tir, diversité 1 | tir, diversité 0.4 | magie, diversité 1 |
| 5 | équilibrée, diversité 1 | bloquer puis zone, diversité 1 | caserne, diversité 1 |
| 6 | bloquer puis zone, diversité 1 | artillerie, diversité 1 | bloquer puis zone, diversité 0.4 |
| 7 | équilibrée, diversité 1 | magie, diversité 0.4 | équilibrée, diversité 0.4 |
| 8 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 | tir, diversité 1 |
| 9 | tir, diversité 1 | caserne, diversité 0.4 | équilibrée, diversité 0.4 |
| 10 | tir, diversité 0.4 | tir, diversité 1 | artillerie, diversité 0.4 |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus -0,3) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.

| Dieu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Corrélation de rang | Niveau le plus dur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | 10,2 | 4,9 | 17,4 | 17,2 | 6,0 | 15,0 | 2,9 | 1,3 | 13,6 | 19,0 | 0,1 | 8 (1,3 vies) |
| Charlie | 1,0 | 0,8 | 16,6 | 5,4 | 2,1 | 9,0 | 1,3 | 0,6 | 6,2 | 17,2 | 0,3 | 8 (0,6 vies) |
| Pollen | 20,0 | 19,6 | 18,8 | 20,0 | 19,5 | 20,0 | 9,9 | 18,5 | 12,3 | 20,0 | -0,3 | 7 (9,9 vies) |
| **Moyenne des dieux** | 10,4 | 8,4 | 17,6 | 14,2 | 9,2 | 14,7 | 4,7 | 6,8 | 10,7 | 18,7 | 0,1 | 7 (4,7 vies) |

Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).

## Usage des sorts par le soigneux

Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).

| Dieu | Sort | Recharge | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- | --- | --- |
| Plume | Voile de Nuit | 30 s | 1,5 sur 10,4 (15 %) | 6,0 sur 11,8 (51 %) | 6,0 sur 11,8 (51 %) |
| Plume | Griffes d’Ombre | 40 s | 7,5 sur 7,8 (96 %) | 8,8 sur 9,0 (97 %) | 8,7 sur 9,0 (96 %) |
| Charlie | Chute du Colosse | 25 s | 12,5 sur 12,9 (97 %) | 14,0 sur 14,1 (99 %) | 14,2 sur 14,4 (99 %) |
| Charlie | Renforts | 20 s | 5,4 sur 16,6 (33 %) | 11,2 sur 18,1 (62 %) | 12,2 sur 18,5 (66 %) |
| Pollen | Pièges à Ressort | 30 s | 5,8 sur 10,9 (53 %) | 8,8 sur 11,6 (76 %) | 10,0 sur 11,9 (84 %) |
| Pollen | Ingéniosité | 50 s | 3,7 sur 6,4 (57 %) | 5,4 sur 7,2 (75 %) | 5,4 sur 7,2 (76 %) |

## Tours divines

Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 200 arêtes avant la fin du niveau).
Sans tour divine : le même soigneux, mêmes graines, dépense ces 200 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.

| Dieu | Tour divine | Difficulté | Construite | Avec : victoires / vies | Sans : victoires / vies | Gain de la tour divine |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | Matou | 42 % | 100 % / 19,6 | 100 % / 19,7 | +0 points / −0,1 vies |
| Plume | Sanctuaire de l’Ombre | Vieux Sage | 32 % | 100 % / 14,1 | 100 % / 14,2 | +0 points / −0,1 vies |
| Charlie | Totem du Colosse | Matou | 61 % | 100 % / 19,3 | 100 % / 19,2 | +0 points / +0,0 vies |
| Charlie | Totem du Colosse | Vieux Sage | 62 % | 99 % / 13,8 | 100 % / 13,6 | −1 points / +0,2 vies |
| Pollen | Atelier Boiteux | Matou | 90 % | 100 % / 19,9 | 100 % / 20,0 | +0 points / −0,1 vies |
| Pollen | Atelier Boiteux | Vieux Sage | 96 % | 100 % / 15,0 | 100 % / 14,8 | +0 points / +0,2 vies |

Puissance par la formule des tours communes (DPS efficace moyen × portée ÷ coût), comptant en plus l’onde du Totem (cibles d’une zone d’une tuile de rayon) et les tourelles et pièges de l’Atelier ; elle ne chiffre ni l’étourdissement du Totem, ni les assassins non ciblables du Sanctuaire, ni l’immobilisation des pièges, ce qui explique que les tours divines ressortent en dessous des tours communes de coût voisin alors que le test de partie montre leur effet.

| Dieu | Tour divine | Coût | Puissance (formule) | Tours communes de coût voisin | Puissance moyenne de ces tours | Rapport |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | 200 | 1,1 | Grenier des Griffes (palier 2, coût cumulé 180), Clocher des Archers (palier 2, coût cumulé 180), Autel des Cendres (palier 2, coût cumulé 260) | 0,2 | ×7,0 |
| Charlie | Totem du Colosse | 200 | 0,1 | Grenier des Griffes (palier 2, coût cumulé 180), Clocher des Archers (palier 2, coût cumulé 180), Autel des Cendres (palier 2, coût cumulé 260) | 0,2 | ×0,3 |
| Pollen | Atelier Boiteux | 200 | 0,6 | Grenier des Griffes (palier 2, coût cumulé 180), Clocher des Archers (palier 2, coût cumulé 180), Autel des Cendres (palier 2, coût cumulé 260) | 0,2 | ×4,1 |

## Disciples comparés à leur avatar (Matou)

Chaque disciple est joué au niveau 1 avec son dieu (sans amélioration ni objet), dans les 10 niveaux de Matou. Écart : vies restantes moyennes du soigneux, disciple moins avatar (au plus 3 vies d’écart, en plus ou en moins).

| Dieu | Héros | Rôle | Soigneux : victoires | Soigneux : vies | Écart à l’avatar | Naïf : victoires | Naïf : vies | Écart à l’avatar (naïf) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | Plume, l’Ombre Première (avatar) | Duelliste, esquive et critiques | 100 % | 19,6 | — | 75 % | 10,8 | — |
| Plume | Suie | Assassin, exécute les blessés | 99 % | 19,1 | −0,6 vies | 54 % | 7,4 | −3,3 vies |
| Plume | Corbeau | Tireur, perce l’armure | 100 % | 19,8 | +0,2 vies | 97 % | 17,4 | +6,6 vies |
| Charlie | Charlie, le Colosse (avatar) | Tank, frappe de zone qui étourdit | 100 % | 19,3 | — | 51 % | 6,0 | — |
| Charlie | Mastoc | Provocation, bloque trois ennemis | 100 % | 19,8 | +0,5 vies | 78 % | 10,2 | +4,2 vies |
| Charlie | Brise-Os | Berserker, plus fort blessé | 100 % | 19,7 | +0,4 vies | 61 % | 6,8 | +0,8 vies |
| Pollen | Pollen, Trois-Pattes (avatar) | Pose des pièges, tire à la fronde | 100 % | 19,9 | — | 98 % | 17,9 | — |
| Pollen | Rouage | Ingénieur, construit une tourelle | 100 % | 19,9 | +0,0 vies | 98 % | 18,0 | +0,1 vies |
| Pollen | Lanterne | Soigneur, magie à distance | 100 % | 19,9 | +0,0 vies | 97 % | 17,7 | −0,1 vies |

## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)

L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.
La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.

| Dieu | Bot | De base | Arbre au maximum | Héros niveau 10 | Tout au maximum |
| --- | --- | --- | --- | --- | --- |
| Plume | Soigneux | 100 % / 14,1 | 100 % / 13,6 | 100 % / 14,6 | 100 % / 14,5 |
| Plume | Naïf | 24 % / 2,1 | 38 % / 3,2 | 52 % / 5,2 | 57 % / 5,9 |
| Charlie | Soigneux | 99 % / 13,8 | 100 % / 14,3 | 100 % / 14,3 | 100 % / 14,8 |
| Charlie | Naïf | 15 % / 1,1 | 17 % / 1,3 | 22 % / 2,1 | 27 % / 2,8 |
| Pollen | Soigneux | 100 % / 15,0 | 100 % / 14,9 | 100 % / 14,9 | 100 % / 14,4 |
| Pollen | Naïf | 67 % / 7,8 | 79 % / 9,6 | 87 % / 11,5 | 90 % / 12,2 |

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
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 144 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,9 | 151 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 178 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 75 % (75/100) | 20,0 | 152 | 0 % (0/30) |
| Matou | Charlie | 90 % (90/100) | 56 % (56/100) | 16,9 | 114 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 98 % (98/100) | 20,0 | 122 | 0 % (0/30) |
| Vieux Sage | Plume | 95 % (95/100) | 20 % (20/100) | 13,2 | 128 | 0 % (0/30) |
| Vieux Sage | Charlie | 88 % (88/100) | 6 % (6/100) | 9,8 | 136 | 0 % (0/30) |
| Vieux Sage | Pollen | 99 % (99/100) | 65 % (65/100) | 14,0 | 151 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 100 % (30/30) | 60 % (18/30) | 9,4 | 177 | 100 % (30/30) | 14,8 | 0 % (0/9) |
| 12 | 100 % (30/30) | 100 % (30/30) | 18,2 | 162 | 100 % (30/30) | 14,9 | 0 % (0/9) |
| 13 | 100 % (30/30) | 77 % (23/30) | 10,3 | 126 | 93 % (28/30) | 11,6 | 0 % (0/9) |
| 14 | 100 % (30/30) | 77 % (23/30) | 8,3 | 115 | 100 % (30/30) | 13,3 | 0 % (0/9) |
| 15 | 100 % (30/30) | 63 % (19/30) | 8,8 | 76 | 100 % (30/30) | 11,1 | 0 % (0/9) |
| 16 | 100 % (30/30) | 73 % (22/30) | 9,3 | 120 | 100 % (30/30) | 14,9 | 0 % (0/9) |
| 17 | 67 % (20/30) | 77 % (23/30) | 9,4 | 80 | 47 % (14/30) | 4,3 | 0 % (0/9) |
| 18 | 100 % (30/30) | 50 % (15/30) | 6,9 | 140 | 100 % (30/30) | 11,8 | 0 % (0/9) |
| 19 | 100 % (30/30) | 90 % (27/30) | 14,0 | 116 | 100 % (30/30) | 13,1 | 0 % (0/9) |
| 20 | 100 % (30/30) | 97 % (29/30) | 15,0 | 178 | 100 % (30/30) | 13,4 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot naïf gagne 75 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le bot naïf gagne 98 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou : le niveau 20 (15 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 95 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 88 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 99 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Pollen (99 %) et Charlie (88 %) sont à 11 points l'un de l'autre, il en faut au plus 10
- Matou : Pollen (20 vies) et Charlie (16,9 vies) sont à 3,1 vies l'un de l'autre, il en faut au plus 3

### Région 3 : le Bourg des Bûchers

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 198 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 155 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 186 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 83 % (83/100) | 19,8 | 171 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 51 % (51/100) | 18,9 | 169 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 85 % (85/100) | 19,7 | 130 | 0 % (0/30) |
| Vieux Sage | Plume | 94 % (94/100) | 41 % (41/100) | 13,5 | 144 | 0 % (0/30) |
| Vieux Sage | Charlie | 79 % (79/100) | 7 % (7/100) | 8,2 | 132 | 0 % (0/30) |
| Vieux Sage | Pollen | 98 % (98/100) | 31 % (31/100) | 14,3 | 143 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 100 % (30/30) | 30 % (9/30) | 3,8 | 83 | 67 % (20/30) | 7,3 | 0 % (0/9) |
| 22 | 100 % (30/30) | 43 % (13/30) | 6,7 | 122 | 67 % (20/30) | 9,9 | 0 % (0/9) |
| 23 | 100 % (30/30) | 73 % (22/30) | 10,8 | 159 | 93 % (28/30) | 11,5 | 0 % (0/9) |
| 24 | 100 % (30/30) | 100 % (30/30) | 15,1 | 134 | 100 % (30/30) | 14,4 | 0 % (0/9) |
| 25 | 100 % (30/30) | 100 % (30/30) | 17,4 | 212 | 100 % (30/30) | 14,0 | 0 % (0/9) |
| 26 | 100 % (30/30) | 63 % (19/30) | 6,1 | 206 | 100 % (30/30) | 13,0 | 0 % (0/9) |
| 27 | 100 % (30/30) | 47 % (14/30) | 5,3 | 150 | 80 % (24/30) | 9,4 | 0 % (0/9) |
| 28 | 100 % (30/30) | 87 % (26/30) | 12,8 | 168 | 100 % (30/30) | 12,8 | 0 % (0/9) |
| 29 | 100 % (30/30) | 87 % (26/30) | 14,6 | 149 | 100 % (30/30) | 13,7 | 0 % (0/9) |
| 30 | 100 % (30/30) | 100 % (30/30) | 19,6 | 185 | 97 % (29/30) | 14,0 | 0 % (0/9) |

Écarts aux bandes : 14

- Matou (Plume) : le bot naïf gagne 83 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 26 laisse 276 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 85 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,5, elle doit être d'au plus -0,6
- Matou : le niveau 30 (19,6 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,8, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,5, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 94 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 98 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Pollen (98 %) et Charlie (79 %) sont à 19 points l'un de l'autre, il en faut au plus 10

### Région 4 : les Marais de l’Ordalie

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 179 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 170 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 173 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 82 % (82/100) | 19,8 | 157 | 0 % (0/30) |
| Matou | Charlie | 92 % (92/100) | 58 % (58/100) | 17,4 | 133 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 84 % (84/100) | 19,7 | 156 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 30 % (30/100) | 14,8 | 147 | 0 % (0/30) |
| Vieux Sage | Charlie | 52 % (52/100) | 0 % (0/100) | 3,8 | 134 | 0 % (0/30) |
| Vieux Sage | Pollen | 88 % (88/100) | 17 % (17/100) | 11,8 | 153 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 100 % (30/30) | 57 % (17/30) | 7,7 | 169 | 33 % (10/30) | 4,9 | 0 % (0/9) |
| 32 | 73 % (22/30) | 27 % (8/30) | 1,8 | 87 | 67 % (20/30) | 9,9 | 0 % (0/9) |
| 33 | 100 % (30/30) | 50 % (15/30) | 6,8 | 200 | 90 % (27/30) | 10,1 | 0 % (0/9) |
| 34 | 100 % (30/30) | 93 % (28/30) | 14,2 | 137 | 93 % (28/30) | 11,0 | 0 % (0/9) |
| 35 | 100 % (30/30) | 83 % (25/30) | 13,6 | 189 | 87 % (26/30) | 11,3 | 0 % (0/9) |
| 36 | 100 % (30/30) | 70 % (21/30) | 9,5 | 116 | 100 % (30/30) | 13,9 | 0 % (0/9) |
| 37 | 100 % (30/30) | 70 % (21/30) | 11,3 | 146 | 93 % (28/30) | 9,4 | 0 % (0/9) |
| 38 | 100 % (30/30) | 97 % (29/30) | 17,5 | 127 | 70 % (21/30) | 10,0 | 0 % (0/9) |
| 39 | 100 % (30/30) | 100 % (30/30) | 19,5 | 129 | 100 % (30/30) | 12,5 | 0 % (0/9) |
| 40 | 100 % (30/30) | 100 % (30/30) | 18,1 | 188 | 67 % (20/30) | 8,5 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot naïf gagne 82 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 33 laisse 313 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 92 % des parties, il doit tout gagner
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 40 laisse 253 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 84 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,8, elle doit être d'au plus -0,6
- Matou : le niveau 40 (18,1 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,9, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,8, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 52 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 88 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (52 %) sont à 48 points l'un de l'autre, il en faut au plus 10

### Région 5 : la Ville Pestiférée

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 160 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 162 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 24,4 | 171 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 81 % (81/100) | 20,0 | 157 | 0 % (0/30) |
| Matou | Charlie | 99 % (99/100) | 46 % (46/100) | 18,3 | 140 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 82 % (82/100) | 19,5 | 150 | 0 % (0/30) |
| Vieux Sage | Plume | 97 % (97/100) | 30 % (30/100) | 13,8 | 148 | 0 % (0/30) |
| Vieux Sage | Charlie | 55 % (55/100) | 4 % (4/100) | 5,8 | 113 | 0 % (0/30) |
| Vieux Sage | Pollen | 94 % (94/100) | 18 % (18/100) | 12,8 | 161 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | 100 % (30/30) | 13 % (4/30) | 1,8 | 81 | 80 % (24/30) | 9,8 | 0 % (0/9) |
| 42 | 100 % (30/30) | 57 % (17/30) | 7,6 | 125 | 100 % (30/30) | 14,1 | 0 % (0/9) |
| 43 | 97 % (29/30) | 37 % (11/30) | 5,9 | 123 | 57 % (17/30) | 8,5 | 0 % (0/9) |
| 44 | 100 % (30/30) | 93 % (28/30) | 15,7 | 129 | 57 % (17/30) | 6,9 | 0 % (0/9) |
| 45 | 100 % (30/30) | 67 % (20/30) | 9,9 | 167 | 90 % (27/30) | 11,8 | 0 % (0/9) |
| 46 | 100 % (30/30) | 70 % (21/30) | 9,9 | 125 | 83 % (25/30) | 10,9 | 0 % (0/9) |
| 47 | 100 % (30/30) | 60 % (18/30) | 10,1 | 126 | 57 % (17/30) | 4,8 | 0 % (0/9) |
| 48 | 100 % (30/30) | 100 % (30/30) | 16,9 | 170 | 100 % (30/30) | 13,8 | 0 % (0/9) |
| 49 | 100 % (30/30) | 100 % (30/30) | 20,0 | 152 | 97 % (29/30) | 13,4 | 0 % (0/9) |
| 50 | 100 % (30/30) | 100 % (30/30) | 17,6 | 292 | 100 % (30/30) | 13,9 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot naïf gagne 81 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 50 laisse 365 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 82 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 50 laisse 289 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,9, elle doit être d'au plus -0,6
- Matou : le niveau 50 (17,6 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,9, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 97 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 55 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 94 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (97 %) et Charlie (55 %) sont à 42 points l'un de l'autre, il en faut au plus 10

### Région 6 : le Charnier

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 178 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 157 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 133 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 69 % (69/100) | 20,0 | 161 | 0 % (0/30) |
| Matou | Charlie | 90 % (90/100) | 37 % (37/100) | 17,2 | 105 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 85 % (85/100) | 19,2 | 120 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 25 % (25/100) | 14,4 | 117 | 0 % (0/30) |
| Vieux Sage | Charlie | 40 % (40/100) | 1 % (1/100) | 2,9 | 75 | 0 % (0/30) |
| Vieux Sage | Pollen | 74 % (74/100) | 14 % (14/100) | 9,8 | 108 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 51 | 100 % (30/30) | 27 % (8/30) | 3,1 | 68 | 70 % (21/30) | 9,9 | 0 % (0/9) |
| 52 | 100 % (30/30) | 27 % (8/30) | 3,6 | 116 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 53 | 100 % (30/30) | 63 % (19/30) | 9,3 | 126 | 83 % (25/30) | 8,8 | 0 % (0/9) |
| 54 | 100 % (30/30) | 100 % (30/30) | 18,8 | 112 | 100 % (30/30) | 12,6 | 0 % (0/9) |
| 55 | 100 % (30/30) | 60 % (18/30) | 8,8 | 175 | 100 % (30/30) | 12,2 | 0 % (0/9) |
| 56 | 100 % (30/30) | 43 % (13/30) | 5,8 | 99 | 87 % (26/30) | 11,0 | 0 % (0/9) |
| 57 | 100 % (30/30) | 47 % (14/30) | 6,9 | 98 | 67 % (20/30) | 9,4 | 0 % (0/9) |
| 58 | 100 % (30/30) | 70 % (21/30) | 7,5 | 138 | 33 % (10/30) | 3,7 | 0 % (0/9) |
| 59 | 100 % (30/30) | 100 % (30/30) | 19,3 | 122 | 93 % (28/30) | 12,6 | 0 % (0/9) |
| 60 | 67 % (20/30) | 100 % (30/30) | 16,3 | 236 | 47 % (14/30) | 5,3 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 60 laisse 301 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le bot naïf gagne 85 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 60 laisse 300 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,6, elle doit être d'au plus -0,6
- Matou : le niveau 60 (16,3 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,7, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,5, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 40 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (40 %) sont à 60 points l'un de l'autre, il en faut au plus 10

### Région 7 : la Croisade

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 219 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 182 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 209 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 91 % (91/100) | 19,5 | 169 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 61 % (61/100) | 16,7 | 109 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 97 % (97/100) | 18,8 | 107 | 0 % (0/30) |
| Vieux Sage | Plume | 98 % (98/100) | 2 % (2/100) | 12,7 | 128 | 0 % (0/30) |
| Vieux Sage | Charlie | 24 % (24/100) | 0 % (0/100) | 0,9 | 69 | 0 % (0/30) |
| Vieux Sage | Pollen | 59 % (59/100) | 5 % (5/100) | 3,9 | 109 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 61 | 100 % (30/30) | 77 % (23/30) | 9,4 | 122 | 50 % (15/30) | 5,3 | 0 % (0/9) |
| 62 | 100 % (30/30) | 83 % (25/30) | 10,8 | 140 | 90 % (27/30) | 7,2 | 0 % (0/9) |
| 63 | 100 % (30/30) | 60 % (18/30) | 6,1 | 72 | 33 % (10/30) | 3,1 | 0 % (0/9) |
| 64 | 100 % (30/30) | 83 % (25/30) | 12,1 | 138 | 83 % (25/30) | 8,7 | 0 % (0/9) |
| 65 | 100 % (30/30) | 93 % (28/30) | 14,2 | 189 | 60 % (18/30) | 6,5 | 0 % (0/9) |
| 66 | 100 % (30/30) | 93 % (28/30) | 9,3 | 141 | 73 % (22/30) | 7,9 | 0 % (0/9) |
| 67 | 100 % (30/30) | 67 % (20/30) | 7,0 | 57 | 50 % (15/30) | 5,0 | 0 % (0/9) |
| 68 | 100 % (30/30) | 93 % (28/30) | 13,5 | 107 | 50 % (15/30) | 5,4 | 0 % (0/9) |
| 69 | 100 % (30/30) | 93 % (28/30) | 14,3 | 136 | 87 % (26/30) | 8,8 | 0 % (0/9) |
| 70 | 100 % (30/30) | 87 % (26/30) | 5,1 | 182 | 27 % (8/30) | 0,7 | 0 % (0/9) |

Écarts aux bandes : 14

- Matou (Plume) : le bot naïf gagne 91 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 61 laisse 272 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 62 laisse 280 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 97 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 98 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 24 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 59 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (98 %) et Charlie (24 %) sont à 74 points l'un de l'autre, il en faut au plus 10

### Région 8 : le Monastère Noir

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 193 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 181 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 197 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 88 % (88/100) | 20,0 | 145 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 38 % (38/100) | 18,9 | 154 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 95 % (95/100) | 20,0 | 166 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 7 % (7/100) | 14,9 | 159 | 0 % (0/30) |
| Vieux Sage | Charlie | 43 % (43/100) | 0 % (0/100) | 3,5 | 107 | 0 % (0/30) |
| Vieux Sage | Pollen | 95 % (95/100) | 1 % (1/100) | 11,2 | 153 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 71 | 100 % (30/30) | 67 % (20/30) | 8,4 | 80 | 57 % (17/30) | 5,6 | 0 % (0/9) |
| 72 | 100 % (30/30) | 77 % (23/30) | 10,8 | 184 | 73 % (22/30) | 9,3 | 0 % (0/9) |
| 73 | 100 % (30/30) | 50 % (15/30) | 9,2 | 120 | 93 % (28/30) | 11,0 | 0 % (0/9) |
| 74 | 100 % (30/30) | 90 % (27/30) | 9,8 | 144 | 100 % (30/30) | 14,4 | 0 % (0/9) |
| 75 | 100 % (30/30) | 67 % (20/30) | 9,8 | 130 | 60 % (18/30) | 6,4 | 0 % (0/9) |
| 76 | 100 % (30/30) | 90 % (27/30) | 12,3 | 107 | 93 % (28/30) | 11,3 | 0 % (0/9) |
| 77 | 100 % (30/30) | 80 % (24/30) | 11,6 | 178 | 67 % (20/30) | 9,5 | 0 % (0/9) |
| 78 | 100 % (30/30) | 70 % (21/30) | 10,3 | 127 | 93 % (28/30) | 11,0 | 0 % (0/9) |
| 79 | 100 % (30/30) | 73 % (22/30) | 9,9 | 139 | 70 % (21/30) | 8,4 | 0 % (0/9) |
| 80 | 100 % (30/30) | 73 % (22/30) | 8,5 | 338 | 87 % (26/30) | 12,0 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot naïf gagne 88 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 80 laisse 335 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 77 laisse 265 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 80 laisse 327 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 95 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 80 laisse 351 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,2, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 43 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 95 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (43 %) sont à 57 points l'un de l'autre, il en faut au plus 10

### Région 9 : la Cité du Roi

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 196 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,9 | 185 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 165 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 72 % (72/100) | 19,5 | 125 | 0 % (0/30) |
| Matou | Charlie | 87 % (87/100) | 31 % (31/100) | 12,2 | 102 | 0 % (0/30) |
| Matou | Pollen | 91 % (91/100) | 86 % (86/100) | 16,3 | 106 | 0 % (0/30) |
| Vieux Sage | Plume | 92 % (92/100) | 1 % (1/100) | 12,2 | 162 | 0 % (0/30) |
| Vieux Sage | Charlie | 12 % (12/100) | 1 % (1/100) | 0,7 | 73 | 0 % (0/30) |
| Vieux Sage | Pollen | 29 % (29/100) | 0 % (0/100) | 2,2 | 82 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 81 | 100 % (30/30) | 63 % (19/30) | 5,9 | 103 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 82 | 100 % (30/30) | 63 % (19/30) | 5,4 | 73 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 83 | 100 % (30/30) | 47 % (14/30) | 2,9 | 77 | 33 % (10/30) | 3,1 | 0 % (0/9) |
| 84 | 100 % (30/30) | 73 % (22/30) | 11,2 | 120 | 40 % (12/30) | 5,2 | 0 % (0/9) |
| 85 | 90 % (27/30) | 40 % (12/30) | 3,5 | 103 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 86 | 100 % (30/30) | 77 % (23/30) | 12,2 | 146 | 90 % (27/30) | 9,8 | 0 % (0/9) |
| 87 | 67 % (20/30) | 50 % (15/30) | 2,8 | 67 | 13 % (4/30) | 0,2 | 0 % (0/9) |
| 88 | 100 % (30/30) | 70 % (21/30) | 7,9 | 72 | 67 % (20/30) | 4,7 | 0 % (0/9) |
| 89 | 100 % (30/30) | 67 % (20/30) | 8,2 | 127 | 67 % (20/30) | 8,3 | 0 % (0/9) |
| 90 | 70 % (21/30) | 80 % (24/30) | 8,0 | 224 | 33 % (10/30) | 4,3 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot naïf gagne 72 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 90 laisse 289 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 87 % des parties, il doit tout gagner
- Matou (Charlie) : le niveau 90 laisse 276 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 91 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 86 % des parties, la bande est 30 % à 70 %
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,3, elle doit être d'au plus -0,6
- Matou : le niveau 90 (8 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 92 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 12 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 29 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (92 %) et Charlie (12 %) sont à 80 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,5 vies) et Charlie (12,2 vies) sont à 7,2 vies l'un de l'autre, il en faut au plus 3

### Région 10 : la Cathédrale du Soleil Blême

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 250 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 213 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 243 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 80 % (80/100) | 20,0 | 126 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 40 % (40/100) | 19,5 | 121 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 89 % (89/100) | 20,0 | 123 | 0 % (0/30) |
| Vieux Sage | Plume | 98 % (98/100) | 6 % (6/100) | 14,4 | 187 | 0 % (0/30) |
| Vieux Sage | Charlie | 43 % (43/100) | 1 % (1/100) | 3,8 | 66 | 0 % (0/30) |
| Vieux Sage | Pollen | 79 % (79/100) | 7 % (7/100) | 10,0 | 103 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 91 | 100 % (30/30) | 63 % (19/30) | 10,9 | 65 | 77 % (23/30) | 10,5 | 0 % (0/9) |
| 92 | 100 % (30/30) | 63 % (19/30) | 9,7 | 84 | 77 % (23/30) | 9,8 | 0 % (0/9) |
| 93 | 100 % (30/30) | 53 % (16/30) | 7,6 | 60 | 87 % (26/30) | 10,6 | 0 % (0/9) |
| 94 | 100 % (30/30) | 70 % (21/30) | 10,3 | 90 | 90 % (27/30) | 10,9 | 0 % (0/9) |
| 95 | 100 % (30/30) | 73 % (22/30) | 9,4 | 164 | 60 % (18/30) | 6,3 | 0 % (0/9) |
| 96 | 100 % (30/30) | 87 % (26/30) | 12,3 | 84 | 97 % (29/30) | 13,3 | 0 % (0/9) |
| 97 | 100 % (30/30) | 67 % (20/30) | 8,3 | 57 | 67 % (20/30) | 10,0 | 0 % (0/9) |
| 98 | 100 % (30/30) | 67 % (20/30) | 7,8 | 124 | 47 % (14/30) | 5,4 | 0 % (0/9) |
| 99 | 100 % (30/30) | 70 % (21/30) | 8,9 | 110 | 100 % (30/30) | 13,5 | 0 % (0/9) |
| 100 | 100 % (30/30) | 83 % (25/30) | 11,8 | 397 | 33 % (10/30) | 3,6 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot naïf gagne 80 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 100 laisse 373 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 100 laisse 403 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 89 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 100 laisse 415 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou : le niveau 100 (11,8 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 98 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 43 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (98 %) et Charlie (43 %) sont à 55 points l'un de l'autre, il en faut au plus 10

## Défis, régions 1 à 10

Le bot soigneux joue les défis avec les règles de Matou, sans objet ni amélioration : Héroïque (1 vie, groupes d’élite) et Fer (toutes les vagues en une, deux familles de tours). Il cherche sa variante sur les graines d’entraînement du défi lui-même, puis joue les dix graines d’évaluation. Bande : entre 40 et 90 % de réussites pour chaque défi de chaque région, trois dieux confondus.

### Région 1 : le Village Affamé

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 100 % (100/100) | 1,0 |
| Héroïque | Charlie | 71 % (71/100) | 0,7 |
| Héroïque | Pollen | 90 % (90/100) | 0,9 |
| Héroïque | les trois | 87 % (261/300) | 0,9 |
| Fer | Plume | 94 % (94/100) | 18,3 |
| Fer | Charlie | 100 % (100/100) | 19,8 |
| Fer | Pollen | 60 % (60/100) | 11,8 |
| Fer | les trois | 85 % (254/300) | 16,6 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 1 | 70 % (21/30) | 100 % (30/30) |
| 2 | 100 % (30/30) | 67 % (20/30) |
| 3 | 100 % (30/30) | 100 % (30/30) |
| 4 | 93 % (28/30) | 67 % (20/30) |
| 5 | 73 % (22/30) | 100 % (30/30) |
| 6 | 83 % (25/30) | 100 % (30/30) |
| 7 | 67 % (20/30) | 67 % (20/30) |
| 8 | 83 % (25/30) | 47 % (14/30) |
| 9 | 100 % (30/30) | 100 % (30/30) |
| 10 | 100 % (30/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 2 : les Champs Brûlés

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 93 % (93/100) | 0,9 |
| Héroïque | Charlie | 58 % (58/100) | 0,6 |
| Héroïque | Pollen | 72 % (72/100) | 0,7 |
| Héroïque | les trois | 74 % (223/300) | 0,7 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 98 % (98/100) | 19,1 |
| Fer | Pollen | 60 % (60/100) | 11,9 |
| Fer | les trois | 86 % (258/300) | 17,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 11 | 100 % (30/30) | 100 % (30/30) |
| 12 | 100 % (30/30) | 100 % (30/30) |
| 13 | 93 % (28/30) | 67 % (20/30) |
| 14 | 73 % (22/30) | 100 % (30/30) |
| 15 | 53 % (16/30) | 67 % (20/30) |
| 16 | 83 % (25/30) | 100 % (30/30) |
| 17 | 27 % (8/30) | 100 % (30/30) |
| 18 | 30 % (9/30) | 67 % (20/30) |
| 19 | 97 % (29/30) | 100 % (30/30) |
| 20 | 87 % (26/30) | 60 % (18/30) |

Écarts aux bandes des défis : aucun.

### Région 3 : le Bourg des Bûchers

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 98 % (98/100) | 1,0 |
| Héroïque | Charlie | 62 % (62/100) | 0,6 |
| Héroïque | Pollen | 89 % (89/100) | 0,9 |
| Héroïque | les trois | 83 % (249/300) | 0,8 |
| Fer | Plume | 90 % (90/100) | 18,0 |
| Fer | Charlie | 93 % (93/100) | 15,9 |
| Fer | Pollen | 49 % (49/100) | 8,8 |
| Fer | les trois | 77 % (232/300) | 14,2 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 21 | 73 % (22/30) | 100 % (30/30) |
| 22 | 67 % (20/30) | 100 % (30/30) |
| 23 | 93 % (28/30) | 63 % (19/30) |
| 24 | 100 % (30/30) | 67 % (20/30) |
| 25 | 100 % (30/30) | 100 % (30/30) |
| 26 | 100 % (30/30) | 97 % (29/30) |
| 27 | 60 % (18/30) | 17 % (5/30) |
| 28 | 90 % (27/30) | 100 % (30/30) |
| 29 | 50 % (15/30) | 67 % (20/30) |
| 30 | 97 % (29/30) | 63 % (19/30) |

Écarts aux bandes des défis : aucun.

### Région 4 : les Marais de l’Ordalie

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 100 % (100/100) | 1,0 |
| Héroïque | Charlie | 65 % (65/100) | 0,7 |
| Héroïque | Pollen | 88 % (88/100) | 0,9 |
| Héroïque | les trois | 84 % (253/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 19,7 |
| Fer | Charlie | 91 % (91/100) | 17,4 |
| Fer | Pollen | 60 % (60/100) | 12,0 |
| Fer | les trois | 84 % (251/300) | 16,4 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 31 | 87 % (26/30) | 100 % (30/30) |
| 32 | 33 % (10/30) | 100 % (30/30) |
| 33 | 100 % (30/30) | 67 % (20/30) |
| 34 | 90 % (27/30) | 100 % (30/30) |
| 35 | 100 % (30/30) | 67 % (20/30) |
| 36 | 100 % (30/30) | 67 % (20/30) |
| 37 | 97 % (29/30) | 100 % (30/30) |
| 38 | 100 % (30/30) | 100 % (30/30) |
| 39 | 60 % (18/30) | 37 % (11/30) |
| 40 | 77 % (23/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 5 : la Ville Pestiférée

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 99 % (99/100) | 1,0 |
| Héroïque | Charlie | 53 % (53/100) | 0,5 |
| Héroïque | Pollen | 97 % (97/100) | 1,0 |
| Héroïque | les trois | 83 % (249/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 19,9 |
| Fer | Charlie | 33 % (33/100) | 6,1 |
| Fer | Pollen | 40 % (40/100) | 7,9 |
| Fer | les trois | 58 % (173/300) | 11,3 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 41 | 97 % (29/30) | 100 % (30/30) |
| 42 | 100 % (30/30) | 100 % (30/30) |
| 43 | 100 % (30/30) | 33 % (10/30) |
| 44 | 100 % (30/30) | 33 % (10/30) |
| 45 | 70 % (21/30) | 33 % (10/30) |
| 46 | 77 % (23/30) | 77 % (23/30) |
| 47 | 67 % (20/30) | 33 % (10/30) |
| 48 | 63 % (19/30) | 33 % (10/30) |
| 49 | 83 % (25/30) | 100 % (30/30) |
| 50 | 73 % (22/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 6 : le Charnier

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 100 % (100/100) | 1,0 |
| Héroïque | Charlie | 61 % (61/100) | 0,6 |
| Héroïque | Pollen | 77 % (77/100) | 0,8 |
| Héroïque | les trois | 79 % (238/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 76 % (76/100) | 13,0 |
| Fer | Pollen | 51 % (51/100) | 10,1 |
| Fer | les trois | 76 % (227/300) | 14,4 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 51 | 100 % (30/30) | 100 % (30/30) |
| 52 | 87 % (26/30) | 100 % (30/30) |
| 53 | 90 % (27/30) | 67 % (20/30) |
| 54 | 100 % (30/30) | 100 % (30/30) |
| 55 | 87 % (26/30) | 33 % (10/30) |
| 56 | 73 % (22/30) | 57 % (17/30) |
| 57 | 63 % (19/30) | 100 % (30/30) |
| 58 | 60 % (18/30) | 63 % (19/30) |
| 59 | 100 % (30/30) | 67 % (20/30) |
| 60 | 33 % (10/30) | 70 % (21/30) |

Écarts aux bandes des défis : aucun.

### Région 7 : la Croisade

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 94 % (94/100) | 0,9 |
| Héroïque | Charlie | 44 % (44/100) | 0,4 |
| Héroïque | Pollen | 51 % (51/100) | 0,5 |
| Héroïque | les trois | 63 % (189/300) | 0,6 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 83 % (83/100) | 14,3 |
| Fer | Pollen | 76 % (76/100) | 13,6 |
| Fer | les trois | 86 % (259/300) | 16,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 61 | 33 % (10/30) | 100 % (30/30) |
| 62 | 70 % (21/30) | 100 % (30/30) |
| 63 | 27 % (8/30) | 100 % (30/30) |
| 64 | 100 % (30/30) | 87 % (26/30) |
| 65 | 97 % (29/30) | 43 % (13/30) |
| 66 | 90 % (27/30) | 100 % (30/30) |
| 67 | 33 % (10/30) | 100 % (30/30) |
| 68 | 93 % (28/30) | 100 % (30/30) |
| 69 | 33 % (10/30) | 100 % (30/30) |
| 70 | 53 % (16/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 8 : le Monastère Noir

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 99 % (99/100) | 1,0 |
| Héroïque | Charlie | 64 % (64/100) | 0,6 |
| Héroïque | Pollen | 92 % (92/100) | 0,9 |
| Héroïque | les trois | 85 % (255/300) | 0,9 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 80 % (80/100) | 13,9 |
| Fer | Pollen | 60 % (60/100) | 11,2 |
| Fer | les trois | 80 % (240/300) | 15,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 71 | 100 % (30/30) | 100 % (30/30) |
| 72 | 100 % (30/30) | 100 % (30/30) |
| 73 | 100 % (30/30) | 100 % (30/30) |
| 74 | 100 % (30/30) | 100 % (30/30) |
| 75 | 70 % (21/30) | 100 % (30/30) |
| 76 | 100 % (30/30) | 67 % (20/30) |
| 77 | 67 % (20/30) | 67 % (20/30) |
| 78 | 53 % (16/30) | 100 % (30/30) |
| 79 | 63 % (19/30) | 33 % (10/30) |
| 80 | 97 % (29/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 9 : la Cité du Roi

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 81 % (81/100) | 0,8 |
| Héroïque | Charlie | 49 % (49/100) | 0,5 |
| Héroïque | Pollen | 35 % (35/100) | 0,4 |
| Héroïque | les trois | 55 % (165/300) | 0,6 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 91 % (91/100) | 15,1 |
| Fer | Pollen | 72 % (72/100) | 13,0 |
| Fer | les trois | 88 % (263/300) | 16,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 81 | 90 % (27/30) | 100 % (30/30) |
| 82 | 70 % (21/30) | 100 % (30/30) |
| 83 | 30 % (9/30) | 100 % (30/30) |
| 84 | 83 % (25/30) | 100 % (30/30) |
| 85 | 37 % (11/30) | 70 % (21/30) |
| 86 | 100 % (30/30) | 70 % (21/30) |
| 87 | 10 % (3/30) | 100 % (30/30) |
| 88 | 53 % (16/30) | 100 % (30/30) |
| 89 | 67 % (20/30) | 37 % (11/30) |
| 90 | 10 % (3/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 10 : la Cathédrale du Soleil Blême

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 94 % (94/100) | 0,9 |
| Héroïque | Charlie | 67 % (67/100) | 0,7 |
| Héroïque | Pollen | 87 % (87/100) | 0,9 |
| Héroïque | les trois | 83 % (248/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 81 % (81/100) | 15,5 |
| Fer | Pollen | 76 % (76/100) | 12,3 |
| Fer | les trois | 86 % (257/300) | 15,9 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 91 | 100 % (30/30) | 100 % (30/30) |
| 92 | 100 % (30/30) | 100 % (30/30) |
| 93 | 53 % (16/30) | 67 % (20/30) |
| 94 | 97 % (29/30) | 100 % (30/30) |
| 95 | 37 % (11/30) | 33 % (10/30) |
| 96 | 77 % (23/30) | 100 % (30/30) |
| 97 | 80 % (24/30) | 57 % (17/30) |
| 98 | 93 % (28/30) | 100 % (30/30) |
| 99 | 97 % (29/30) | 100 % (30/30) |
| 100 | 93 % (28/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

## Mode infini

Matou, 20 vies, sans amélioration ni objet, chaque dieu avec son avatar, 10 graines par ligne. Résultat d’une partie : la dernière vague terminée (le record). On arrête une partie à la vague 100. Bandes, sur les cartes de la région 1 : la médiane du soigneux est entre la vague 25 et la vague 45 ; le naïf ne passe pas la vague 30 (aucune de ses parties). Les autres cartes sont données à titre d’information. Le soigneux joue une seule variante (équilibrée, diversité 0,4) et lit les 30 premières vagues générées.

| Bot | Dieu | Carte | Médiane | Min à max | Vagues par graine |
| --- | --- | --- | --- | --- | --- |
| Naïf | plume | chaumes (région 1) | 20 | 7 à 29 | 7 7 9 9 12 28 28 28 28 29 |
| Soigneux | plume | chaumes (région 1) | 36 | 35 à 37 | 35 35 36 36 36 36 36 36 36 37 |
| Naïf | charlie | chaumes (région 1) | 8.5 | 5 à 27 | 5 5 7 7 8 9 9 12 26 27 |
| Soigneux | charlie | chaumes (région 1) | 35 | 33 à 35 | 33 34 34 34 35 35 35 35 35 35 |
| Naïf | pollen | chaumes (région 1) | 28 | 26 à 29 | 26 28 28 28 28 28 28 29 29 29 |
| Soigneux | pollen | chaumes (région 1) | 35 | 34 à 36 | 34 35 35 35 35 35 35 35 36 36 |
| Naïf | plume | gue (région 1) | 28 | 11 à 29 | 11 26 28 28 28 28 28 29 29 29 |
| Soigneux | plume | gue (région 1) | 34 | 33 à 34 | 33 33 33 33 34 34 34 34 34 34 |
| Naïf | charlie | gue (région 1) | 26 | 9 à 28 | 9 9 9 9 26 26 27 27 28 28 |
| Soigneux | charlie | gue (région 1) | 32 | 32 à 33 | 32 32 32 32 32 32 32 32 33 33 |
| Naïf | pollen | gue (région 1) | 28 | 27 à 29 | 27 27 28 28 28 28 28 29 29 29 |
| Soigneux | pollen | gue (région 1) | 33 | 32 à 33 | 32 32 33 33 33 33 33 33 33 33 |
| Naïf | plume | pendus (région 1) | 10.5 | 8 à 29 | 8 9 9 9 9 12 25 27 28 29 |
| Soigneux | plume | pendus (région 1) | 36 | 36 à 37 | 36 36 36 36 36 36 36 37 37 37 |
| Naïf | charlie | pendus (région 1) | 7.5 | 6 à 26 | 6 6 7 7 7 8 8 8 9 26 |
| Soigneux | charlie | pendus (région 1) | 35 | 34 à 36 | 34 35 35 35 35 35 35 35 35 36 |
| Naïf | pollen | pendus (région 1) | 27.5 | 25 à 29 | 25 26 27 27 27 28 28 28 28 29 |
| Soigneux | pollen | pendus (région 1) | 35 | 34 à 36 | 34 34 35 35 35 35 35 36 36 36 |
| Naïf | plume | carrefour (région 1) | 28 | 7 à 29 | 7 27 27 28 28 28 28 29 29 29 |
| Soigneux | plume | carrefour (région 1) | 34 | 34 à 35 | 34 34 34 34 34 34 35 35 35 35 |
| Naïf | charlie | carrefour (région 1) | 14 | 7 à 26 | 7 12 12 12 12 16 25 26 26 26 |
| Soigneux | charlie | carrefour (région 1) | 33 | 32 à 34 | 32 32 32 33 33 33 33 33 34 34 |
| Naïf | pollen | carrefour (région 1) | 27.5 | 27 à 28 | 27 27 27 27 27 28 28 28 28 28 |
| Soigneux | pollen | carrefour (région 1) | 33.5 | 32 à 34 | 32 32 33 33 33 34 34 34 34 34 |
| Naïf | plume | region3 (région 3) | 9 | 6 à 12 | 6 8 8 8 9 9 9 9 12 12 |
| Soigneux | plume | region3 (région 3) | 36 | 34 à 37 | 34 35 35 35 36 36 36 36 37 37 |
| Naïf | charlie | region3 (région 3) | 8.5 | 5 à 12 | 5 7 7 8 8 9 9 9 9 12 |
| Soigneux | charlie | region3 (région 3) | 28.5 | 11 à 33 | 11 14 19 26 26 31 31 32 32 33 |
| Naïf | pollen | region3 (région 3) | 13.5 | 9 à 17 | 9 11 12 13 13 14 14 14 16 17 |
| Soigneux | pollen | region3 (région 3) | 33 | 31 à 35 | 31 32 32 33 33 33 33 33 34 35 |
| Naïf | plume | region6 (région 6) | 9 | 9 à 14 | 9 9 9 9 9 9 9 13 13 14 |
| Soigneux | plume | region6 (région 6) | 36.5 | 35 à 38 | 35 35 36 36 36 37 37 37 37 38 |
| Naïf | charlie | region6 (région 6) | 9 | 7 à 13 | 7 7 9 9 9 9 9 9 9 13 |
| Soigneux | charlie | region6 (région 6) | 32 | 30 à 33 | 30 31 32 32 32 32 33 33 33 33 |
| Naïf | pollen | region6 (région 6) | 17.5 | 13 à 29 | 13 13 14 15 17 18 18 27 28 29 |
| Soigneux | pollen | region6 (région 6) | 29 | 26 à 33 | 26 27 28 28 28 30 31 31 32 33 |
| Naïf | plume | region10 (région 10) | 13.5 | 9 à 16 | 9 9 9 13 13 14 14 14 16 16 |
| Soigneux | plume | region10 (région 10) | 35 | 34 à 37 | 34 34 34 35 35 35 35 35 36 37 |
| Naïf | charlie | region10 (région 10) | 9 | 4 à 14 | 4 9 9 9 9 9 11 13 13 14 |
| Soigneux | charlie | region10 (région 10) | 13 | 9 à 25 | 9 9 9 9 12 14 15 15 18 25 |
| Naïf | pollen | region10 (région 10) | 14.5 | 9 à 16 | 9 12 14 14 14 15 15 15 16 16 |
| Soigneux | pollen | region10 (région 10) | 14.5 | 7 à 29 | 7 9 9 10 14 15 15 15 16 29 |

Écarts aux bandes de l’infini : aucun.

## La zone (jalon 5)

Taux de victoire du soigneux, trois dieux, sans tour divine, 45 % des arêtes de départ en Vieux Sage (sans quoi tout se gagne), avec quatre compositions de tours : sans zone (tir, magie), zone sans caserne (tir, magie, artillerie), caserne sans zone (caserne, tir, magie), caserne et zone. Niveaux ordinaires : 4, 6, 8, 14, 15, 18, 22, 25 ; niveaux de horde : 7, 13, 17.

| Niveaux | Sans zone | Zone, sans caserne | Caserne, sans zone | Caserne et zone |
| --- | --- | --- | --- | --- |
| Ordinaires | 60 % | 58 % | 57 % | 69 % |
| Horde | 17 % | 59 % | 6 % | 63 % |

Critères : ordinaires, la zone sans caserne ne gagne pas plus que sans zone (écart -1 points, au plus 6 tolérés) ; avec caserne, la zone gagne 12 points de plus (au moins 10) ; en horde, la zone gagne 43 points de plus (au moins 20).
