# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau des régions 1 à 10 (la région 1 en détail dans cette partie, les régions 2 à 10, les défis et le mode infini plus bas) est rejoué sans
affichage dans les trois difficultés, avec chacun des trois dieux jouant son avatar (sans amélioration ni objet), par deux bots, sur 10 graines chacun (version des données 12).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (case de la grille, famille, niveau,
  spécialisation, bonus et remise de famille du dieu compris), après une petite recherche entre dix variantes (5 préférences × 2 diversités) jouées sur des graines d’entraînement ;
  place le héros dans la zone de feu de ses tours ; joue les sorts de son dieu selon leur effet (Chute du Colosse sur les grappes, Renforts et Voile de Nuit devant la zone de feu,
  Griffes d’Ombre sur la plus grosse grappe, Pièges à Ressort un peu avant la zone de feu, Ingéniosité au cœur de ses tours) ; construit la tour divine de son dieu dès la troisième tour ;
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter. Il lit la composition des vagues futures, ce qu’un joueur ne voit pas : il est un peu optimiste.
- **Naïf** : construit sur les cases de la grille proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans tour divine, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

**14 écart(s)**, dont 12 aux bandes suspendues de Matou et de Vieux Sage (elles ne bloquent pas : voir bandes.ts) :

- Matou (Plume) : le bot naïf gagne 72 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le bot naïf gagne 97 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,2, elle doit être d'au plus -0,6
- Matou : le niveau 10 (17,4 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 94 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 98 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Sans défense (Pollen) : le niveau 2 est gagné 3 fois sur 3 en chaton
- Sans défense (Pollen) : le niveau 4 est gagné 3 fois sur 3 en chaton

Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins 1 vie sur 50 % des niveaux et en laissant moins de 250 arêtes inutilisées par niveau, le naïf gagne 30 % à 70 % ;
Vieux Sage, le soigneux gagne 60 % à 85 % ; sans défense on perd. Entre dieux : en Vieux Sage, au plus 10,0 points d’écart de taux de victoire du soigneux ; en Matou, au plus 3 vies d’écart de vies moyennes du soigneux.

### Dieu × difficulté

Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins 1 vie.

| Difficulté | Dieu | Naïf : victoires | Soigneux : victoires | Bande du soigneux | Naïf : vies | Soigneux : vies | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % | 100 % | — | 25,0 | 25,0 | 127 / 189 | 0/10 | 0 % |
| Chaton | Charlie | 100 % | 100 % | — | 24,8 | 25,0 | 122 / 244 | 0/10 | 0 % |
| Chaton | Pollen | 100 % | 100 % | — | 25,0 | 25,0 | 121 / 198 | 0/10 | 30 % |
| Matou | Plume | 72 % | 100 % | 100 % | 9,7 | 19,8 | 115 / 218 | 1/10 | 0 % |
| Matou | Charlie | 47 % | 100 % | 100 % | 5,4 | 19,6 | 107 / 231 | 1/10 | 0 % |
| Matou | Pollen | 97 % | 100 % | 100 % | 17,2 | 20,0 | 118 / 247 | 0/10 | 0 % |
| Vieux Sage | Plume | 18 % | 94 % | 60 % à 85 % | 1,6 | 13,2 | 102 / 272 | 2/10 | 0 % |
| Vieux Sage | Charlie | 10 % | 98 % | 60 % à 85 % | 0,8 | 13,5 | 99 / 192 | 2/10 | 0 % |
| Vieux Sage | Pollen | 65 % | 100 % | 60 % à 85 % | 6,8 | 14,7 | 96 / 205 | 2/10 | 0 % |

Bande du naïf : Chaton 100 %, Matou 30 % à 70 %. Matou : au moins 50 % des niveaux avec perte. Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

### Écarts entre dieux

| Mesure du soigneux | Plume | Charlie | Pollen | Écart maximal | Écart permis |
| --- | --- | --- | --- | --- | --- |
| Vieux Sage : taux de victoire | 94 % | 98 % | 100 % | 6,0 points | 10,0 points |
| Matou : vies moyennes | 19,8 | 19,6 | 20,0 | 0,3 vies | 3 vies |

## Plume

Héros : Plume, l’Ombre Première. Bonus de famille : Tir — PV des soldats +0 %, cadence +60 %, critique +15 points, prix +0 %. Sorts : Voile de Nuit (recharge 30 s), Griffes d’Ombre (recharge 40 s). Tour divine : Sanctuaire de l’Ombre (200 arêtes).

### Plume : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 75 / 79 | aucune / aucune | 185 / 127 | perdu en 197 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 130 / 108 | aucune / aucune | 222 / 181 | perdu en 182 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 128 / 182 | aucune / aucune | 200 / 132 | perdu en 171 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 129 / 189 | aucune / aucune | 288 / 246 | perdu en 169 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 142 / 69 | aucune / aucune | 243 / 201 | perdu en 126 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 114 / 182 | aucune / aucune | 325 / 264 | perdu en 139 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 141 / 87 | aucune / aucune | 310 / 261 | perdu en 117 s |
| 8 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 200 / 153 | aucune / aucune | 419 / 362 | perdu en 129 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 144 / 123 | aucune / aucune | 499 / 419 | perdu en 123 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 611 / 94 | aucune / aucune | 530 / 455 | perdu en 99 s |

### Plume : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 80 % (8/10) | 9,2 | 100 % (10/10) | 20,0 | 59 / 85 | 4 (3,8 vies) / aucune | 206 / 168 | perdu en 153 s |
| 2 | 80 % (8/10) | 10,1 | 100 % (10/10) | 20,0 | 74 / 218 | 4 (2,8 vies) / aucune | 236 / 215 | perdu en 143 s |
| 3 | 90 % (9/10) | 17,4 | 100 % (10/10) | 20,0 | 62 / 196 | 3 (1,0 vies) / aucune | 203 / 181 | perdu en 127 s |
| 4 | 100 % (10/10) | 16,0 | 100 % (10/10) | 20,0 | 97 / 44 | 3 (2,3 vies) / aucune | 302 / 271 | perdu en 115 s |
| 5 | 10 % (1/10) | 0,5 | 100 % (10/10) | 18,2 | 50 / 83 | 4 (6,9 vies) / 4 (1,4 vies) | 153 / 224 | perdu en 111 s |
| 6 | 90 % (9/10) | 11,2 | 100 % (10/10) | 20,0 | 74 / 34 | 4 (3,5 vies) / aucune | 322 / 299 | perdu en 125 s |
| 7 | 60 % (6/10) | 2,9 | 100 % (10/10) | 19,8 | 127 / 67 | 2 (5,7 vies) / 5 (0,2 vies) | 242 / 275 | perdu en 92 s |
| 8 | 20 % (2/10) | 1,5 | 100 % (10/10) | 20,0 | 52 / 102 | 3 (13,0 vies) / aucune | 183 / 390 | perdu en 107 s |
| 9 | 90 % (9/10) | 9,7 | 100 % (10/10) | 20,0 | 111 / 138 | 4 (7,7 vies) / aucune | 488 / 468 | perdu en 115 s |
| 10 | 100 % (10/10) | 18,3 | 100 % (10/10) | 20,0 | 231 / 185 | 6 (1,4 vies) / aucune | 550 / 536 | perdu en 86 s |

### Plume : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 51 / 121 | 3 (6,0 vies) / aucune | 157 / 184 | perdu en 128 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,2 | 53 / 63 | 3 (5,1 vies) / 6 (0,8 vies) | 174 / 208 | perdu en 120 s |
| 3 | 80 % (8/10) | 8,0 | 100 % (10/10) | 15,0 | 47 / 156 | 3 (3,2 vies) / aucune | 197 / 188 | perdu en 109 s |
| 4 | 30 % (3/10) | 1,0 | 100 % (10/10) | 14,7 | 59 / 79 | 3 (7,5 vies) / 2 (0,3 vies) | 197 / 266 | perdu en 111 s |
| 5 | 0 % (0/10) | 0,0 | 40 % (4/10) | 1,8 | 65 / 66 | 2 (7,1 vies) / 4 (7,2 vies) | 103 / 174 | perdu en 89 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,9 | 74 / 53 | 3 (5,6 vies) / 3 (0,1 vies) | 143 / 293 | perdu en 92 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 12,1 | 47 / 55 | 2 (8,3 vies) / 1 (1,7 vies) | 100 / 282 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,2 | 56 / 72 | 3 (8,9 vies) / 2 (0,8 vies) | 110 / 383 | perdu en 103 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 47 / 81 | 4 (7,4 vies) / aucune | 129 / 469 | perdu en 94 s |
| 10 | 70 % (7/10) | 6,5 | 100 % (10/10) | 15,0 | 226 / 272 | 6 (4,0 vies) / aucune | 446 / 549 | perdu en 77 s |

Tours choisies par le soigneux en Matou avec Plume : la plus choisie, Clocher des Archers (construction) (721 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | artillerie, diversité 1 | magie, diversité 0.4 | équilibrée, diversité 1 |
| 2 | artillerie, diversité 0.4 | magie, diversité 1 | équilibrée, diversité 0.4 |
| 3 | magie, diversité 1 | artillerie, diversité 1 | magie, diversité 1 |
| 4 | bloquer puis zone, diversité 1 | caserne, diversité 0.4 | bloquer puis zone, diversité 1 |
| 5 | tir, diversité 0.4 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 |
| 6 | magie, diversité 0.4 | bloquer puis zone, diversité 0.4 | tir, diversité 0.4 |
| 7 | caserne, diversité 0.4 | équilibrée, diversité 1 | tir, diversité 0.4 |
| 8 | équilibrée, diversité 1 | bloquer puis zone, diversité 1 | magie, diversité 1 |
| 9 | artillerie, diversité 1 | tir, diversité 0.4 | tir, diversité 0.4 |
| 10 | équilibrée, diversité 0.4 | équilibrée, diversité 0.4 | artillerie, diversité 1 |

## Charlie

Héros : Charlie, le Colosse. Bonus de famille : Caserne — PV des soldats +25 %, cadence +0 %, critique +0 points, prix +0 %. Sorts : Chute du Colosse (recharge 25 s), Renforts (recharge 20 s). Tour divine : Totem du Colosse (200 arêtes).

### Charlie : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 82 / 122 | aucune / aucune | 189 / 145 | perdu en 181 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 141 / 127 | aucune / aucune | 225 / 185 | perdu en 181 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 128 / 52 | aucune / aucune | 201 / 143 | perdu en 229 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 129 / 121 | aucune / aucune | 290 / 238 | perdu en 152 s |
| 5 | 100 % (10/10) | 24,2 | 100 % (10/10) | 25,0 | 130 / 109 | 2 (0,7 vies) / aucune | 243 / 212 | perdu en 120 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 114 / 118 | aucune / aucune | 326 / 264 | perdu en 139 s |
| 7 | 100 % (10/10) | 24,9 | 100 % (10/10) | 25,0 | 140 / 75 | 1 (0,1 vies) / aucune | 310 / 260 | perdu en 119 s |
| 8 | 100 % (10/10) | 24,3 | 100 % (10/10) | 25,0 | 190 / 129 | 2 (0,7 vies) / aucune | 421 / 364 | perdu en 133 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 144 / 126 | aucune / aucune | 501 / 455 | perdu en 122 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 611 / 244 | aucune / aucune | 538 / 490 | perdu en 90 s |

### Charlie : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 % (1/10) | 0,4 | 100 % (10/10) | 19,9 | 46 / 67 | 4 (6,1 vies) / 6 (0,1 vies) | 189 / 164 | perdu en 150 s |
| 2 | 30 % (3/10) | 2,9 | 100 % (10/10) | 20,0 | 73 / 145 | 4 (5,4 vies) / aucune | 208 / 191 | perdu en 124 s |
| 3 | 90 % (9/10) | 16,6 | 100 % (10/10) | 20,0 | 67 / 146 | 3 (1,7 vies) / aucune | 200 / 185 | perdu en 109 s |
| 4 | 80 % (8/10) | 9,4 | 100 % (10/10) | 20,0 | 85 / 102 | 3 (5,5 vies) / aucune | 272 / 260 | perdu en 114 s |
| 5 | 0 % (0/10) | 0,0 | 100 % (10/10) | 17,7 | 50 / 36 | 2 (6,9 vies) / 8 (1,1 vies) | 118 / 226 | perdu en 94 s |
| 6 | 60 % (6/10) | 4,7 | 100 % (10/10) | 19,8 | 88 / 127 | 4 (6,8 vies) / 3 (0,1 vies) | 266 / 295 | perdu en 101 s |
| 7 | 20 % (2/10) | 1,3 | 100 % (10/10) | 19,2 | 104 / 69 | 2 (6,0 vies) / 2 (0,5 vies) | 171 / 278 | perdu en 89 s |
| 8 | 10 % (1/10) | 0,4 | 100 % (10/10) | 20,0 | 56 / 82 | 3 (13,8 vies) / aucune | 157 / 389 | perdu en 104 s |
| 9 | 70 % (7/10) | 3,8 | 100 % (10/10) | 19,6 | 71 / 65 | 4 (10,6 vies) / 4 (0,4 vies) | 396 / 468 | perdu en 113 s |
| 10 | 100 % (10/10) | 14,1 | 100 % (10/10) | 19,9 | 230 / 231 | 6 (4,0 vies) / 4 (0,1 vies) | 558 / 548 | perdu en 79 s |

### Charlie : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 71 / 191 | 3 (7,1 vies) / aucune | 148 / 183 | perdu en 127 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 63 / 54 | 3 (6,5 vies) / aucune | 146 / 206 | perdu en 120 s |
| 3 | 70 % (7/10) | 4,8 | 100 % (10/10) | 15,0 | 64 / 124 | 3 (4,4 vies) / aucune | 187 / 186 | perdu en 108 s |
| 4 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 48 / 192 | 3 (7,4 vies) / aucune | 126 / 271 | perdu en 109 s |
| 5 | 0 % (0/10) | 0,0 | 80 % (8/10) | 3,1 | 48 / 60 | 2 (7,3 vies) / 8 (5,4 vies) | 97 / 233 | perdu en 88 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,3 | 50 / 48 | 3 (6,6 vies) / 3 (0,7 vies) | 134 / 304 | perdu en 91 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,4 | 65 / 33 | 2 (9,1 vies) / 2 (1,0 vies) | 89 / 279 | perdu en 73 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 38 / 65 | 3 (7,4 vies) / aucune | 108 / 391 | perdu en 103 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,3 | 54 / 62 | 3 (9,2 vies) / 4 (0,4 vies) | 126 / 472 | perdu en 93 s |
| 10 | 30 % (3/10) | 3,1 | 100 % (10/10) | 15,0 | 131 / 165 | 6 (4,7 vies) / aucune | 296 / 548 | perdu en 75 s |

Tours choisies par le soigneux en Matou avec Charlie : la plus choisie, Grenier des Griffes (construction) (776 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | tir, diversité 1 | caserne, diversité 1 | bloquer puis zone, diversité 1 |
| 2 | artillerie, diversité 1 | caserne, diversité 1 | caserne, diversité 1 |
| 3 | équilibrée, diversité 0.4 | tir, diversité 1 | caserne, diversité 1 |
| 4 | magie, diversité 0.4 | caserne, diversité 1 | tir, diversité 1 |
| 5 | bloquer puis zone, diversité 1 | équilibrée, diversité 0.4 | bloquer puis zone, diversité 1 |
| 6 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 | caserne, diversité 1 |
| 7 | magie, diversité 0.4 | tir, diversité 0.4 | bloquer puis zone, diversité 0.4 |
| 8 | tir, diversité 1 | magie, diversité 0.4 | magie, diversité 0.4 |
| 9 | caserne, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 10 | caserne, diversité 0.4 | caserne, diversité 0.4 | artillerie, diversité 0.4 |

## Pollen

Héros : Pollen, Trois-Pattes. Bonus de famille : Artillerie — PV des soldats +0 %, cadence +15 %, critique +0 points, prix −10 %. Sorts : Pièges à Ressort (recharge 30 s), Ingéniosité (recharge 50 s). Tour divine : Atelier Boiteux (200 arêtes).

### Pollen : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 70 / 113 | aucune / aucune | 185 / 159 | gagné 3/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 99 / 198 | aucune / aucune | 223 / 185 | gagné 3/3 |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 101 / 104 | aucune / aucune | 197 / 159 | perdu en 193 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 142 / 150 | aucune / aucune | 289 / 239 | gagné 3/3 |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 160 / 82 | aucune / aucune | 242 / 205 | perdu en 238 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 157 / 91 | aucune / aucune | 324 / 250 | perdu en 235 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 188 / 95 | aucune / aucune | 310 / 258 | perdu en 142 s |
| 8 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 160 / 170 | aucune / aucune | 420 / 365 | perdu en 265 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 125 / 106 | aucune / aucune | 501 / 451 | perdu en 125 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 831 / 105 | aucune / aucune | 536 / 440 | perdu en 184 s |

### Pollen : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 19,9 | 100 % (10/10) | 20,0 | 54 / 169 | 4 (0,1 vies) / aucune | 200 / 152 | perdu en 207 s |
| 2 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 59 / 112 | aucune / aucune | 243 / 203 | perdu en 183 s |
| 3 | 100 % (10/10) | 18,8 | 100 % (10/10) | 19,9 | 64 / 120 | 5 (0,9 vies) / 5 (0,1 vies) | 213 / 180 | perdu en 144 s |
| 4 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 77 / 74 | aucune / aucune | 302 / 269 | perdu en 163 s |
| 5 | 100 % (10/10) | 17,0 | 100 % (10/10) | 20,0 | 88 / 45 | 2 (1,2 vies) / aucune | 247 / 218 | perdu en 125 s |
| 6 | 100 % (10/10) | 19,3 | 100 % (10/10) | 20,0 | 126 / 97 | 4 (0,4 vies) / aucune | 334 / 293 | perdu en 140 s |
| 7 | 80 % (8/10) | 9,9 | 100 % (10/10) | 19,9 | 77 / 61 | 5 (5,0 vies) / 6 (0,1 vies) | 284 / 273 | perdu en 109 s |
| 8 | 100 % (10/10) | 17,2 | 100 % (10/10) | 19,9 | 93 / 142 | 3 (2,7 vies) / 3 (0,1 vies) | 427 / 386 | perdu en 118 s |
| 9 | 90 % (9/10) | 9,7 | 100 % (10/10) | 20,0 | 107 / 114 | 4 (6,9 vies) / aucune | 469 / 463 | perdu en 122 s |
| 10 | 100 % (10/10) | 19,9 | 100 % (10/10) | 19,8 | 172 / 247 | 6 (0,1 vies) / 2 (0,2 vies) | 555 / 525 | perdu en 91 s |

### Pollen : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 11,7 | 100 % (10/10) | 15,0 | 53 / 101 | 4 (1,6 vies) / aucune | 209 / 170 | perdu en 175 s |
| 2 | 100 % (10/10) | 11,8 | 100 % (10/10) | 15,0 | 63 / 80 | 6 (1,5 vies) / aucune | 246 / 216 | perdu en 152 s |
| 3 | 60 % (6/10) | 7,1 | 100 % (10/10) | 15,0 | 56 / 108 | 5 (4,5 vies) / aucune | 194 / 195 | perdu en 127 s |
| 4 | 100 % (10/10) | 12,6 | 100 % (10/10) | 14,9 | 99 / 87 | 7 (0,9 vies) / 3 (0,1 vies) | 303 / 272 | perdu en 144 s |
| 5 | 40 % (4/10) | 1,1 | 100 % (10/10) | 13,2 | 71 / 66 | 6 (4,6 vies) / 4 (1,7 vies) | 212 / 219 | perdu en 115 s |
| 6 | 90 % (9/10) | 9,6 | 100 % (10/10) | 15,0 | 128 / 68 | 4 (3,2 vies) / aucune | 326 / 296 | perdu en 132 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 48 / 85 | 4 (6,4 vies) / aucune | 139 / 272 | perdu en 96 s |
| 8 | 20 % (2/10) | 1,1 | 100 % (10/10) | 13,9 | 60 / 46 | 3 (11,2 vies) / 3 (1,1 vies) | 205 / 393 | perdu en 112 s |
| 9 | 40 % (4/10) | 0,9 | 100 % (10/10) | 15,0 | 102 / 116 | 4 (7,2 vies) / aucune | 280 / 465 | perdu en 118 s |
| 10 | 100 % (10/10) | 12,4 | 100 % (10/10) | 15,0 | 208 / 205 | 6 (2,3 vies) / aucune | 565 / 506 | perdu en 88 s |

Tours choisies par le soigneux en Matou avec Pollen : la plus choisie, Catapulte du Rempart (construction) (650 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | tir, diversité 1 | tir, diversité 1 | tir, diversité 1 |
| 2 | bloquer puis zone, diversité 1 | magie, diversité 1 | bloquer puis zone, diversité 1 |
| 3 | tir, diversité 1 | équilibrée, diversité 1 | artillerie, diversité 1 |
| 4 | magie, diversité 1 | magie, diversité 1 | équilibrée, diversité 0.4 |
| 5 | bloquer puis zone, diversité 0.4 | caserne, diversité 1 | bloquer puis zone, diversité 1 |
| 6 | artillerie, diversité 0.4 | artillerie, diversité 1 | équilibrée, diversité 0.4 |
| 7 | équilibrée, diversité 1 | magie, diversité 0.4 | équilibrée, diversité 0.4 |
| 8 | magie, diversité 1 | artillerie, diversité 1 | tir, diversité 1 |
| 9 | bloquer puis zone, diversité 1 | magie, diversité 0.4 | caserne, diversité 0.4 |
| 10 | équilibrée, diversité 0.4 | tir, diversité 1 | artillerie, diversité 1 |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus -0,3) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.

| Dieu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Corrélation de rang | Niveau le plus dur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | 9,2 | 10,1 | 17,4 | 16,0 | 0,5 | 11,2 | 2,9 | 1,5 | 9,7 | 18,3 | 0,0 | 5 (0,5 vies) |
| Charlie | 0,4 | 2,9 | 16,6 | 9,4 | 0,0 | 4,7 | 1,3 | 0,4 | 3,8 | 14,1 | 0,1 | 5 (0,0 vies) |
| Pollen | 19,9 | 20,0 | 18,8 | 20,0 | 17,0 | 19,3 | 9,9 | 17,2 | 9,7 | 19,9 | -0,5 | 9 (9,7 vies) |
| **Moyenne des dieux** | 9,8 | 11,0 | 17,6 | 15,1 | 5,8 | 11,7 | 4,7 | 6,4 | 7,7 | 17,4 | -0,2 | 7 (4,7 vies) |

Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).

## Usage des sorts par le soigneux

Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).

| Dieu | Sort | Recharge | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- | --- | --- |
| Plume | Voile de Nuit | 30 s | 1,5 sur 8,8 (17 %) | 5,6 sur 10,1 (56 %) | 6,0 sur 10,0 (60 %) |
| Plume | Griffes d’Ombre | 40 s | 6,3 sur 6,6 (95 %) | 7,4 sur 7,7 (96 %) | 7,3 sur 7,6 (97 %) |
| Charlie | Chute du Colosse | 25 s | 11,0 sur 11,3 (98 %) | 12,1 sur 12,2 (99 %) | 12,3 sur 12,4 (99 %) |
| Charlie | Renforts | 20 s | 5,5 sur 14,4 (38 %) | 10,8 sur 15,5 (69 %) | 11,4 sur 15,9 (71 %) |
| Pollen | Pièges à Ressort | 30 s | 4,9 sur 9,2 (54 %) | 7,9 sur 10,0 (79 %) | 8,8 sur 10,1 (86 %) |
| Pollen | Ingéniosité | 50 s | 3,6 sur 5,4 (66 %) | 4,8 sur 6,1 (79 %) | 4,3 sur 6,1 (70 %) |

## Tours divines

Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 200 arêtes avant la fin du niveau).
Sans tour divine : le même soigneux, mêmes graines, dépense ces 200 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.

| Dieu | Tour divine | Difficulté | Construite | Avec : victoires / vies | Sans : victoires / vies | Gain de la tour divine |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | Matou | 60 % | 100 % / 19,8 | 100 % / 19,8 | +0 points / +0,0 vies |
| Plume | Sanctuaire de l’Ombre | Vieux Sage | 41 % | 94 % / 13,2 | 94 % / 13,1 | +0 points / +0,1 vies |
| Charlie | Totem du Colosse | Matou | 53 % | 100 % / 19,6 | 100 % / 18,9 | +0 points / +0,7 vies |
| Charlie | Totem du Colosse | Vieux Sage | 76 % | 98 % / 13,5 | 100 % / 13,7 | −2 points / −0,2 vies |
| Pollen | Atelier Boiteux | Matou | 81 % | 100 % / 20,0 | 100 % / 20,0 | +0 points / +0,0 vies |
| Pollen | Atelier Boiteux | Vieux Sage | 86 % | 100 % / 14,7 | 100 % / 14,8 | +0 points / −0,1 vies |

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
| Plume | Plume, l’Ombre Première (avatar) | Duelliste, esquive et critiques | 100 % | 19,8 | — | 72 % | 9,7 | — |
| Plume | Suie | Assassin, exécute les blessés | 99 % | 18,8 | −1,0 vies | 51 % | 6,6 | −3,1 vies |
| Plume | Corbeau | Tireur, perce l’armure | 100 % | 20,0 | +0,2 vies | 96 % | 16,6 | +6,9 vies |
| Charlie | Charlie, le Colosse (avatar) | Tank, frappe de zone qui étourdit | 100 % | 19,6 | — | 47 % | 5,4 | — |
| Charlie | Mastoc | Provocation, bloque trois ennemis | 100 % | 19,2 | −0,4 vies | 64 % | 7,4 | +2,0 vies |
| Charlie | Brise-Os | Berserker, plus fort blessé | 100 % | 19,6 | +0,0 vies | 56 % | 5,7 | +0,3 vies |
| Pollen | Pollen, Trois-Pattes (avatar) | Pose des pièges, tire à la fronde | 100 % | 20,0 | — | 97 % | 17,2 | — |
| Pollen | Rouage | Ingénieur, construit une tourelle | 100 % | 20,0 | +0,0 vies | 97 % | 17,1 | −0,1 vies |
| Pollen | Lanterne | Soigneur, magie à distance | 100 % | 20,0 | +0,0 vies | 96 % | 17,0 | −0,1 vies |

## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)

L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.
La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.

| Dieu | Bot | De base | Arbre au maximum | Héros niveau 10 | Tout au maximum |
| --- | --- | --- | --- | --- | --- |
| Plume | Soigneux | 94 % / 13,2 | 98 % / 12,9 | 97 % / 14,0 | 98 % / 13,9 |
| Plume | Naïf | 18 % / 1,6 | 27 % / 2,5 | 43 % / 4,4 | 51 % / 5,6 |
| Charlie | Soigneux | 98 % / 13,5 | 99 % / 13,5 | 99 % / 13,7 | 98 % / 13,9 |
| Charlie | Naïf | 10 % / 0,8 | 11 % / 1,1 | 19 % / 1,9 | 26 % / 2,3 |
| Pollen | Soigneux | 100 % / 14,7 | 100 % / 15,0 | 100 % / 14,5 | 100 % / 14,6 |
| Pollen | Naïf | 65 % / 6,8 | 73 % / 8,5 | 86 % / 11,0 | 90 % / 11,6 |

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
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 118 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 99 % (99/100) | 24,9 | 155 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 167 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 61 % (61/100) | 19,8 | 162 | 0 % (0/30) |
| Matou | Charlie | 90 % (90/100) | 37 % (37/100) | 15,5 | 118 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 98 % (98/100) | 19,2 | 140 | 0 % (0/30) |
| Vieux Sage | Plume | 95 % (95/100) | 13 % (13/100) | 12,8 | 123 | 0 % (0/30) |
| Vieux Sage | Charlie | 79 % (79/100) | 4 % (4/100) | 7,1 | 138 | 0 % (0/30) |
| Vieux Sage | Pollen | 99 % (99/100) | 55 % (55/100) | 13,5 | 128 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 100 % (30/30) | 47 % (14/30) | 7,7 | 144 | 100 % (30/30) | 15,0 | 0 % (0/9) |
| 12 | 100 % (30/30) | 97 % (29/30) | 17,6 | 196 | 100 % (30/30) | 14,9 | 0 % (0/9) |
| 13 | 100 % (30/30) | 67 % (20/30) | 8,6 | 108 | 97 % (29/30) | 8,7 | 0 % (0/9) |
| 14 | 100 % (30/30) | 63 % (19/30) | 4,7 | 129 | 93 % (28/30) | 10,7 | 0 % (0/9) |
| 15 | 100 % (30/30) | 47 % (14/30) | 7,8 | 121 | 100 % (30/30) | 10,7 | 0 % (0/9) |
| 16 | 100 % (30/30) | 50 % (15/30) | 8,0 | 155 | 100 % (30/30) | 14,5 | 0 % (0/9) |
| 17 | 67 % (20/30) | 77 % (23/30) | 9,4 | 80 | 47 % (14/30) | 4,3 | 0 % (0/9) |
| 18 | 100 % (30/30) | 37 % (11/30) | 4,3 | 118 | 73 % (22/30) | 9,1 | 0 % (0/9) |
| 19 | 100 % (30/30) | 87 % (26/30) | 12,9 | 123 | 100 % (30/30) | 12,4 | 0 % (0/9) |
| 20 | 100 % (30/30) | 83 % (25/30) | 13,2 | 226 | 100 % (30/30) | 10,9 | 0 % (0/9) |

Écarts aux bandes : 16

- Chaton (Charlie) : le bot naïf gagne 99 % des parties, il doit tout gagner
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 12 laisse 262 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 98 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 20 laisse 263 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,2, elle doit être d'au plus -0,6
- Matou : le niveau 20 (13,2 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 95 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 99 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Pollen (99 %) et Charlie (79 %) sont à 20 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,8 vies) et Charlie (15,5 vies) sont à 4,2 vies l'un de l'autre, il en faut au plus 3

### Région 3 : le Bourg des Bûchers

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 192 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 155 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 190 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 80 % (80/100) | 19,7 | 144 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 37 % (37/100) | 18,3 | 171 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 78 % (78/100) | 19,4 | 157 | 0 % (0/30) |
| Vieux Sage | Plume | 99 % (99/100) | 28 % (28/100) | 14,1 | 138 | 0 % (0/30) |
| Vieux Sage | Charlie | 69 % (69/100) | 4 % (4/100) | 5,3 | 120 | 0 % (0/30) |
| Vieux Sage | Pollen | 96 % (96/100) | 9 % (9/100) | 12,2 | 133 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 100 % (30/30) | 13 % (4/30) | 1,5 | 94 | 77 % (23/30) | 8,4 | 0 % (0/9) |
| 22 | 100 % (30/30) | 37 % (11/30) | 4,2 | 148 | 63 % (19/30) | 6,1 | 0 % (0/9) |
| 23 | 100 % (30/30) | 73 % (22/30) | 10,8 | 159 | 93 % (28/30) | 11,5 | 0 % (0/9) |
| 24 | 100 % (30/30) | 83 % (25/30) | 12,8 | 187 | 100 % (30/30) | 12,4 | 0 % (0/9) |
| 25 | 100 % (30/30) | 97 % (29/30) | 14,9 | 220 | 73 % (22/30) | 10,2 | 0 % (0/9) |
| 26 | 100 % (30/30) | 53 % (16/30) | 4,1 | 170 | 97 % (29/30) | 10,1 | 0 % (0/9) |
| 27 | 100 % (30/30) | 47 % (14/30) | 5,3 | 150 | 80 % (24/30) | 9,4 | 0 % (0/9) |
| 28 | 100 % (30/30) | 80 % (24/30) | 12,2 | 160 | 100 % (30/30) | 12,3 | 0 % (0/9) |
| 29 | 100 % (30/30) | 67 % (20/30) | 12,5 | 110 | 97 % (29/30) | 12,0 | 0 % (0/9) |
| 30 | 100 % (30/30) | 100 % (30/30) | 18,3 | 177 | 100 % (30/30) | 12,9 | 0 % (0/9) |

Écarts aux bandes : 14

- Matou (Plume) : le bot naïf gagne 80 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 24 laisse 274 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 26 laisse 274 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 78 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,6, elle doit être d'au plus -0,6
- Matou : le niveau 30 (18,3 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,8, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 99 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 96 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (99 %) et Charlie (69 %) sont à 30 points l'un de l'autre, il en faut au plus 10

### Région 4 : les Marais de l’Ordalie

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 168 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 181 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 173 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 75 % (75/100) | 20,0 | 187 | 0 % (0/30) |
| Matou | Charlie | 96 % (96/100) | 45 % (45/100) | 16,2 | 125 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 76 % (76/100) | 19,7 | 146 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 16 % (16/100) | 13,8 | 144 | 0 % (0/30) |
| Vieux Sage | Charlie | 35 % (35/100) | 0 % (0/100) | 2,5 | 116 | 0 % (0/30) |
| Vieux Sage | Pollen | 88 % (88/100) | 7 % (7/100) | 11,6 | 163 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 100 % (30/30) | 37 % (11/30) | 3,9 | 151 | 33 % (10/30) | 3,6 | 0 % (0/9) |
| 32 | 87 % (26/30) | 3 % (1/30) | 0,2 | 119 | 67 % (20/30) | 9,6 | 0 % (0/9) |
| 33 | 100 % (30/30) | 50 % (15/30) | 6,8 | 200 | 90 % (27/30) | 10,1 | 0 % (0/9) |
| 34 | 100 % (30/30) | 83 % (25/30) | 11,8 | 151 | 83 % (25/30) | 10,3 | 0 % (0/9) |
| 35 | 100 % (30/30) | 73 % (22/30) | 12,5 | 192 | 73 % (22/30) | 10,1 | 0 % (0/9) |
| 36 | 100 % (30/30) | 57 % (17/30) | 6,9 | 93 | 100 % (30/30) | 13,5 | 0 % (0/9) |
| 37 | 100 % (30/30) | 70 % (21/30) | 11,3 | 146 | 93 % (28/30) | 9,4 | 0 % (0/9) |
| 38 | 100 % (30/30) | 90 % (27/30) | 15,4 | 119 | 67 % (20/30) | 9,6 | 0 % (0/9) |
| 39 | 100 % (30/30) | 90 % (27/30) | 12,4 | 157 | 67 % (20/30) | 10,0 | 0 % (0/9) |
| 40 | 100 % (30/30) | 100 % (30/30) | 17,0 | 198 | 70 % (21/30) | 6,8 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot naïf gagne 75 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 33 laisse 313 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 96 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 76 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,8, elle doit être d'au plus -0,6
- Matou : le niveau 40 (17 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,9, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,7, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 35 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 88 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (35 %) sont à 65 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (20 vies) et Charlie (16,2 vies) sont à 3,8 vies l'un de l'autre, il en faut au plus 3

### Région 5 : la Ville Pestiférée

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 168 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,9 | 162 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 24,9 | 167 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 78 % (78/100) | 20,0 | 139 | 0 % (0/30) |
| Matou | Charlie | 99 % (99/100) | 30 % (30/100) | 18,2 | 128 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 78 % (78/100) | 19,5 | 134 | 0 % (0/30) |
| Vieux Sage | Plume | 97 % (97/100) | 22 % (22/100) | 13,9 | 136 | 0 % (0/30) |
| Vieux Sage | Charlie | 38 % (38/100) | 2 % (2/100) | 4,4 | 119 | 0 % (0/30) |
| Vieux Sage | Pollen | 93 % (93/100) | 10 % (10/100) | 12,4 | 152 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | 100 % (30/30) | 13 % (4/30) | 1,8 | 81 | 80 % (24/30) | 9,8 | 0 % (0/9) |
| 42 | 100 % (30/30) | 40 % (12/30) | 5,3 | 90 | 83 % (25/30) | 10,7 | 0 % (0/9) |
| 43 | 97 % (29/30) | 37 % (11/30) | 5,9 | 123 | 57 % (17/30) | 8,5 | 0 % (0/9) |
| 44 | 100 % (30/30) | 70 % (21/30) | 12,2 | 126 | 53 % (16/30) | 7,0 | 0 % (0/9) |
| 45 | 100 % (30/30) | 67 % (20/30) | 8,5 | 138 | 67 % (20/30) | 8,4 | 0 % (0/9) |
| 46 | 100 % (30/30) | 57 % (17/30) | 7,3 | 113 | 67 % (20/30) | 10,0 | 0 % (0/9) |
| 47 | 100 % (30/30) | 60 % (18/30) | 10,1 | 126 | 57 % (17/30) | 4,8 | 0 % (0/9) |
| 48 | 100 % (30/30) | 90 % (27/30) | 13,8 | 142 | 97 % (29/30) | 13,8 | 0 % (0/9) |
| 49 | 100 % (30/30) | 100 % (30/30) | 19,8 | 121 | 100 % (30/30) | 14,2 | 0 % (0/9) |
| 50 | 100 % (30/30) | 87 % (26/30) | 13,9 | 278 | 100 % (30/30) | 14,8 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot naïf gagne 78 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 50 laisse 266 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 50 laisse 336 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 78 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,9, elle doit être d'au plus -0,6
- Matou : le niveau 50 (13,9 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,9, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 97 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 38 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 93 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (97 %) et Charlie (38 %) sont à 59 points l'un de l'autre, il en faut au plus 10

### Région 6 : le Charnier

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 157 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 159 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 164 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 61 % (61/100) | 19,8 | 117 | 0 % (0/30) |
| Matou | Charlie | 90 % (90/100) | 32 % (32/100) | 15,3 | 100 | 0 % (0/30) |
| Matou | Pollen | 96 % (96/100) | 77 % (77/100) | 18,0 | 106 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 13 % (13/100) | 14,2 | 129 | 0 % (0/30) |
| Vieux Sage | Charlie | 24 % (24/100) | 0 % (0/100) | 1,4 | 70 | 0 % (0/30) |
| Vieux Sage | Pollen | 70 % (70/100) | 2 % (2/100) | 8,6 | 89 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 51 | 100 % (30/30) | 20 % (6/30) | 2,1 | 79 | 67 % (20/30) | 6,8 | 0 % (0/9) |
| 52 | 100 % (30/30) | 17 % (5/30) | 1,9 | 101 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 53 | 100 % (30/30) | 63 % (19/30) | 9,3 | 126 | 83 % (25/30) | 8,8 | 0 % (0/9) |
| 54 | 100 % (30/30) | 100 % (30/30) | 18,2 | 98 | 100 % (30/30) | 10,6 | 0 % (0/9) |
| 55 | 100 % (30/30) | 50 % (15/30) | 5,3 | 128 | 67 % (20/30) | 9,8 | 0 % (0/9) |
| 56 | 100 % (30/30) | 30 % (9/30) | 2,7 | 89 | 67 % (20/30) | 9,5 | 0 % (0/9) |
| 57 | 100 % (30/30) | 47 % (14/30) | 6,9 | 98 | 67 % (20/30) | 9,4 | 0 % (0/9) |
| 58 | 100 % (30/30) | 53 % (16/30) | 5,6 | 107 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 59 | 100 % (30/30) | 100 % (30/30) | 18,6 | 94 | 97 % (29/30) | 11,4 | 0 % (0/9) |
| 60 | 53 % (16/30) | 87 % (26/30) | 12,4 | 157 | 33 % (10/30) | 4,3 | 0 % (0/9) |

Écarts aux bandes : 14

- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux gagne 96 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 77 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,6, elle doit être d'au plus -0,6
- Matou : le niveau 60 (12,4 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 24 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (24 %) sont à 76 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,8 vies) et Charlie (15,3 vies) sont à 4,5 vies l'un de l'autre, il en faut au plus 3

### Région 7 : la Croisade

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 185 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 168 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 202 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 89 % (89/100) | 19,1 | 150 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 67 % (67/100) | 17,8 | 111 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 99 % (99/100) | 18,7 | 116 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 8 % (8/100) | 12,9 | 112 | 0 % (0/30) |
| Vieux Sage | Charlie | 33 % (33/100) | 1 % (1/100) | 2,4 | 61 | 0 % (0/30) |
| Vieux Sage | Pollen | 59 % (59/100) | 11 % (11/100) | 4,3 | 81 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 61 | 100 % (30/30) | 77 % (23/30) | 9,6 | 137 | 53 % (16/30) | 5,3 | 0 % (0/9) |
| 62 | 100 % (30/30) | 77 % (23/30) | 8,9 | 64 | 93 % (28/30) | 7,9 | 0 % (0/9) |
| 63 | 100 % (30/30) | 60 % (18/30) | 6,1 | 72 | 33 % (10/30) | 3,1 | 0 % (0/9) |
| 64 | 100 % (30/30) | 73 % (22/30) | 11,0 | 158 | 47 % (14/30) | 5,8 | 0 % (0/9) |
| 65 | 100 % (30/30) | 100 % (30/30) | 18,4 | 179 | 77 % (23/30) | 6,8 | 0 % (0/9) |
| 66 | 100 % (30/30) | 100 % (30/30) | 19,2 | 145 | 100 % (30/30) | 13,2 | 0 % (0/9) |
| 67 | 100 % (30/30) | 83 % (25/30) | 11,4 | 72 | 37 % (11/30) | 4,8 | 0 % (0/9) |
| 68 | 100 % (30/30) | 80 % (24/30) | 10,9 | 99 | 50 % (15/30) | 5,4 | 0 % (0/9) |
| 69 | 100 % (30/30) | 100 % (30/30) | 16,8 | 211 | 100 % (30/30) | 11,9 | 0 % (0/9) |
| 70 | 100 % (30/30) | 100 % (30/30) | 8,0 | 120 | 50 % (15/30) | 1,2 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot naïf gagne 89 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 61 laisse 272 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 69 laisse 263 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le bot naïf gagne 99 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,2, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 33 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 59 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (33 %) sont à 67 points l'un de l'autre, il en faut au plus 10
- Défi Fer : le bot soigneux réussit 92.7 % des parties, la bande est 40 % à 90 %

### Région 8 : le Monastère Noir

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 197 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 199 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 185 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 87 % (87/100) | 20,0 | 155 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 64 % (64/100) | 19,3 | 161 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 93 % (93/100) | 19,9 | 132 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 2 % (2/100) | 15,0 | 154 | 0 % (0/30) |
| Vieux Sage | Charlie | 58 % (58/100) | 0 % (0/100) | 6,0 | 116 | 0 % (0/30) |
| Vieux Sage | Pollen | 88 % (88/100) | 10 % (10/100) | 10,6 | 136 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 71 | 100 % (30/30) | 60 % (18/30) | 6,9 | 79 | 37 % (11/30) | 5,0 | 0 % (0/9) |
| 72 | 100 % (30/30) | 57 % (17/30) | 8,1 | 129 | 67 % (20/30) | 8,5 | 0 % (0/9) |
| 73 | 100 % (30/30) | 27 % (8/30) | 3,9 | 133 | 93 % (28/30) | 11,7 | 0 % (0/9) |
| 74 | 100 % (30/30) | 100 % (30/30) | 16,5 | 186 | 100 % (30/30) | 12,7 | 0 % (0/9) |
| 75 | 100 % (30/30) | 100 % (30/30) | 18,8 | 117 | 100 % (30/30) | 14,5 | 0 % (0/9) |
| 76 | 100 % (30/30) | 90 % (27/30) | 12,5 | 90 | 100 % (30/30) | 11,4 | 0 % (0/9) |
| 77 | 100 % (30/30) | 80 % (24/30) | 11,6 | 178 | 67 % (20/30) | 9,5 | 0 % (0/9) |
| 78 | 100 % (30/30) | 100 % (30/30) | 17,4 | 100 | 100 % (30/30) | 15,0 | 0 % (0/9) |
| 79 | 100 % (30/30) | 100 % (30/30) | 16,4 | 156 | 67 % (20/30) | 8,0 | 0 % (0/9) |
| 80 | 100 % (30/30) | 100 % (30/30) | 17,6 | 327 | 90 % (27/30) | 8,8 | 0 % (0/9) |

Écarts aux bandes : 20

- Matou (Plume) : le bot naïf gagne 87 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 80 laisse 320 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 77 laisse 265 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 80 laisse 367 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 93 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 80 laisse 295 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,6, elle doit être d'au plus -0,6
- Matou : le niveau 80 (17,6 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,7, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 58 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 88 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (58 %) sont à 42 points l'un de l'autre, il en faut au plus 10
- Défi Héroïque : le bot soigneux réussit 92 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 92 % des parties, la bande est 40 % à 90 %

### Région 9 : la Cité du Roi

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 197 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 182 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 178 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 92 % (92/100) | 19,7 | 146 | 0 % (0/30) |
| Matou | Charlie | 97 % (97/100) | 80 % (80/100) | 17,4 | 96 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 96 % (96/100) | 17,4 | 126 | 0 % (0/30) |
| Vieux Sage | Plume | 95 % (95/100) | 15 % (15/100) | 13,2 | 154 | 0 % (0/30) |
| Vieux Sage | Charlie | 47 % (47/100) | 6 % (6/100) | 2,4 | 80 | 0 % (0/30) |
| Vieux Sage | Pollen | 71 % (71/100) | 10 % (10/100) | 6,1 | 85 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 81 | 100 % (30/30) | 90 % (27/30) | 13,0 | 107 | 100 % (30/30) | 8,5 | 0 % (0/9) |
| 82 | 100 % (30/30) | 90 % (27/30) | 7,2 | 90 | 57 % (17/30) | 5,6 | 0 % (0/9) |
| 83 | 100 % (30/30) | 70 % (21/30) | 5,0 | 96 | 33 % (10/30) | 4,7 | 0 % (0/9) |
| 84 | 100 % (30/30) | 97 % (29/30) | 16,6 | 136 | 67 % (20/30) | 8,0 | 0 % (0/9) |
| 85 | 100 % (30/30) | 100 % (30/30) | 18,2 | 236 | 70 % (21/30) | 9,7 | 0 % (0/9) |
| 86 | 100 % (30/30) | 77 % (23/30) | 12,3 | 133 | 100 % (30/30) | 10,4 | 0 % (0/9) |
| 87 | 100 % (30/30) | 93 % (28/30) | 10,3 | 91 | 87 % (26/30) | 6,6 | 0 % (0/9) |
| 88 | 100 % (30/30) | 93 % (28/30) | 14,2 | 77 | 100 % (30/30) | 8,6 | 0 % (0/9) |
| 89 | 100 % (30/30) | 100 % (30/30) | 17,4 | 89 | 80 % (24/30) | 9,2 | 0 % (0/9) |
| 90 | 90 % (27/30) | 83 % (25/30) | 7,5 | 170 | 17 % (5/30) | 1,0 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot naïf gagne 92 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 85 laisse 347 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 90 laisse 251 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 97 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 80 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot naïf gagne 96 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,2, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 95 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 47 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (95 %) et Charlie (47 %) sont à 48 points l'un de l'autre, il en faut au plus 10
- Défi Fer : le bot soigneux réussit 97.7 % des parties, la bande est 40 % à 90 %

### Région 10 : la Cathédrale du Soleil Blême

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 24,9 | 199 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,9 | 208 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 197 | 17 % (5/30) |
| Matou | Plume | 100 % (100/100) | 77 % (77/100) | 19,9 | 167 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 50 % (50/100) | 18,9 | 146 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 84 % (84/100) | 20,0 | 128 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 26 % (26/100) | 14,7 | 163 | 0 % (0/30) |
| Vieux Sage | Charlie | 73 % (73/100) | 17 % (17/100) | 7,9 | 105 | 0 % (0/30) |
| Vieux Sage | Pollen | 93 % (93/100) | 30 % (30/100) | 11,9 | 127 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 91 | 100 % (30/30) | 63 % (19/30) | 10,3 | 154 | 97 % (29/30) | 12,2 | 0 % (0/9) |
| 92 | 100 % (30/30) | 70 % (21/30) | 10,4 | 95 | 70 % (21/30) | 9,6 | 0 % (0/9) |
| 93 | 100 % (30/30) | 60 % (18/30) | 8,6 | 79 | 70 % (21/30) | 9,3 | 0 % (0/9) |
| 94 | 100 % (30/30) | 50 % (15/30) | 8,0 | 82 | 93 % (28/30) | 11,1 | 0 % (0/9) |
| 95 | 100 % (30/30) | 100 % (30/30) | 19,3 | 203 | 97 % (29/30) | 11,0 | 0 % (0/9) |
| 96 | 100 % (30/30) | 100 % (30/30) | 17,9 | 127 | 100 % (30/30) | 14,2 | 0 % (0/9) |
| 97 | 100 % (30/30) | 23 % (7/30) | 3,1 | 92 | 60 % (18/30) | 7,8 | 0 % (0/9) |
| 98 | 100 % (30/30) | 100 % (30/30) | 19,9 | 162 | 100 % (30/30) | 11,9 | 0 % (0/9) |
| 99 | 100 % (30/30) | 60 % (18/30) | 7,4 | 89 | 100 % (30/30) | 13,4 | 0 % (0/9) |
| 100 | 100 % (30/30) | 77 % (23/30) | 8,1 | 388 | 100 % (30/30) | 14,3 | 0 % (0/9) |

Écarts aux bandes : 20

- Matou (Plume) : le bot naïf gagne 77 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 91 laisse 280 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 100 laisse 413 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 95 laisse 309 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 100 laisse 387 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 84 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 100 laisse 363 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,2, elle doit être d'au plus -0,6
- Matou : le niveau 100 (8,1 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 93 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (73 %) sont à 27 points l'un de l'autre, il en faut au plus 10
- Sans défense (Pollen) : le niveau 98 est gagné 2 fois sur 3 en chaton
- Sans défense (Pollen) : le niveau 100 est gagné 3 fois sur 3 en chaton
- Défi Fer : le bot soigneux réussit 92.7 % des parties, la bande est 40 % à 90 %

## Défis, régions 1 à 10

Le bot soigneux joue les défis avec les règles de Matou, sans objet ni amélioration : Héroïque (1 vie, groupes d’élite) et Fer (toutes les vagues en une, deux familles de tours). Il cherche sa variante sur les graines d’entraînement du défi lui-même, puis joue les dix graines d’évaluation. Bande : entre 40 et 90 % de réussites pour chaque défi de chaque région, trois dieux confondus.

### Région 1 : le Village Affamé

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 100 % (100/100) | 1,0 |
| Héroïque | Charlie | 79 % (79/100) | 0,8 |
| Héroïque | Pollen | 86 % (86/100) | 0,9 |
| Héroïque | les trois | 88 % (265/300) | 0,9 |
| Fer | Plume | 92 % (92/100) | 18,0 |
| Fer | Charlie | 100 % (100/100) | 18,4 |
| Fer | Pollen | 71 % (71/100) | 12,2 |
| Fer | les trois | 88 % (263/300) | 16,2 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 1 | 97 % (29/30) | 100 % (30/30) |
| 2 | 77 % (23/30) | 100 % (30/30) |
| 3 | 100 % (30/30) | 100 % (30/30) |
| 4 | 100 % (30/30) | 70 % (21/30) |
| 5 | 60 % (18/30) | 100 % (30/30) |
| 6 | 97 % (29/30) | 100 % (30/30) |
| 7 | 67 % (20/30) | 67 % (20/30) |
| 8 | 100 % (30/30) | 40 % (12/30) |
| 9 | 87 % (26/30) | 100 % (30/30) |
| 10 | 100 % (30/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 2 : les Champs Brûlés

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 96 % (96/100) | 1,0 |
| Héroïque | Charlie | 34 % (34/100) | 0,3 |
| Héroïque | Pollen | 78 % (78/100) | 0,8 |
| Héroïque | les trois | 69 % (208/300) | 0,7 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 97 % (97/100) | 18,6 |
| Fer | Pollen | 60 % (60/100) | 11,9 |
| Fer | les trois | 86 % (257/300) | 16,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 11 | 100 % (30/30) | 100 % (30/30) |
| 12 | 100 % (30/30) | 100 % (30/30) |
| 13 | 73 % (22/30) | 67 % (20/30) |
| 14 | 67 % (20/30) | 100 % (30/30) |
| 15 | 67 % (20/30) | 67 % (20/30) |
| 16 | 90 % (27/30) | 100 % (30/30) |
| 17 | 27 % (8/30) | 100 % (30/30) |
| 18 | 33 % (10/30) | 67 % (20/30) |
| 19 | 73 % (22/30) | 100 % (30/30) |
| 20 | 63 % (19/30) | 57 % (17/30) |

Écarts aux bandes des défis : aucun.

### Région 3 : le Bourg des Bûchers

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 98 % (98/100) | 1,0 |
| Héroïque | Charlie | 54 % (54/100) | 0,5 |
| Héroïque | Pollen | 84 % (84/100) | 0,8 |
| Héroïque | les trois | 79 % (236/300) | 0,8 |
| Fer | Plume | 90 % (90/100) | 18,0 |
| Fer | Charlie | 87 % (87/100) | 15,2 |
| Fer | Pollen | 45 % (45/100) | 8,3 |
| Fer | les trois | 74 % (222/300) | 13,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 21 | 67 % (20/30) | 100 % (30/30) |
| 22 | 57 % (17/30) | 100 % (30/30) |
| 23 | 93 % (28/30) | 63 % (19/30) |
| 24 | 100 % (30/30) | 67 % (20/30) |
| 25 | 100 % (30/30) | 100 % (30/30) |
| 26 | 100 % (30/30) | 83 % (25/30) |
| 27 | 60 % (18/30) | 17 % (5/30) |
| 28 | 83 % (25/30) | 100 % (30/30) |
| 29 | 63 % (19/30) | 67 % (20/30) |
| 30 | 63 % (19/30) | 43 % (13/30) |

Écarts aux bandes des défis : aucun.

### Région 4 : les Marais de l’Ordalie

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 99 % (99/100) | 1,0 |
| Héroïque | Charlie | 50 % (50/100) | 0,5 |
| Héroïque | Pollen | 82 % (82/100) | 0,8 |
| Héroïque | les trois | 77 % (231/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 19,7 |
| Fer | Charlie | 90 % (90/100) | 17,4 |
| Fer | Pollen | 60 % (60/100) | 11,0 |
| Fer | les trois | 83 % (250/300) | 16,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 31 | 97 % (29/30) | 100 % (30/30) |
| 32 | 33 % (10/30) | 100 % (30/30) |
| 33 | 100 % (30/30) | 67 % (20/30) |
| 34 | 77 % (23/30) | 100 % (30/30) |
| 35 | 100 % (30/30) | 67 % (20/30) |
| 36 | 67 % (20/30) | 67 % (20/30) |
| 37 | 97 % (29/30) | 100 % (30/30) |
| 38 | 93 % (28/30) | 100 % (30/30) |
| 39 | 63 % (19/30) | 33 % (10/30) |
| 40 | 43 % (13/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 5 : la Ville Pestiférée

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 99 % (99/100) | 1,0 |
| Héroïque | Charlie | 52 % (52/100) | 0,5 |
| Héroïque | Pollen | 94 % (94/100) | 0,9 |
| Héroïque | les trois | 82 % (245/300) | 0,8 |
| Fer | Plume | 99 % (99/100) | 18,9 |
| Fer | Charlie | 30 % (30/100) | 6,0 |
| Fer | Pollen | 40 % (40/100) | 7,6 |
| Fer | les trois | 56 % (169/300) | 10,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 41 | 97 % (29/30) | 100 % (30/30) |
| 42 | 100 % (30/30) | 100 % (30/30) |
| 43 | 100 % (30/30) | 33 % (10/30) |
| 44 | 77 % (23/30) | 33 % (10/30) |
| 45 | 60 % (18/30) | 33 % (10/30) |
| 46 | 67 % (20/30) | 67 % (20/30) |
| 47 | 67 % (20/30) | 33 % (10/30) |
| 48 | 67 % (20/30) | 33 % (10/30) |
| 49 | 87 % (26/30) | 100 % (30/30) |
| 50 | 97 % (29/30) | 30 % (9/30) |

Écarts aux bandes des défis : aucun.

### Région 6 : le Charnier

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 98 % (98/100) | 1,0 |
| Héroïque | Charlie | 36 % (36/100) | 0,4 |
| Héroïque | Pollen | 81 % (81/100) | 0,8 |
| Héroïque | les trois | 72 % (215/300) | 0,7 |
| Fer | Plume | 100 % (100/100) | 19,8 |
| Fer | Charlie | 60 % (60/100) | 11,7 |
| Fer | Pollen | 50 % (50/100) | 10,0 |
| Fer | les trois | 70 % (210/300) | 13,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 51 | 97 % (29/30) | 100 % (30/30) |
| 52 | 80 % (24/30) | 100 % (30/30) |
| 53 | 90 % (27/30) | 67 % (20/30) |
| 54 | 100 % (30/30) | 100 % (30/30) |
| 55 | 60 % (18/30) | 33 % (10/30) |
| 56 | 67 % (20/30) | 33 % (10/30) |
| 57 | 63 % (19/30) | 100 % (30/30) |
| 58 | 40 % (12/30) | 33 % (10/30) |
| 59 | 87 % (26/30) | 67 % (20/30) |
| 60 | 33 % (10/30) | 67 % (20/30) |

Écarts aux bandes des défis : aucun.

### Région 7 : la Croisade

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 93 % (93/100) | 0,9 |
| Héroïque | Charlie | 53 % (53/100) | 0,5 |
| Héroïque | Pollen | 69 % (69/100) | 0,7 |
| Héroïque | les trois | 72 % (215/300) | 0,7 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 95 % (95/100) | 16,7 |
| Fer | Pollen | 83 % (83/100) | 16,0 |
| Fer | les trois | 93 % (278/300) | 17,5 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 61 | 33 % (10/30) | 100 % (30/30) |
| 62 | 60 % (18/30) | 100 % (30/30) |
| 63 | 27 % (8/30) | 100 % (30/30) |
| 64 | 83 % (25/30) | 60 % (18/30) |
| 65 | 97 % (29/30) | 100 % (30/30) |
| 66 | 100 % (30/30) | 100 % (30/30) |
| 67 | 73 % (22/30) | 100 % (30/30) |
| 68 | 87 % (26/30) | 100 % (30/30) |
| 69 | 97 % (29/30) | 100 % (30/30) |
| 70 | 60 % (18/30) | 67 % (20/30) |

Écarts aux bandes des défis : 1

- Défi Fer : le bot soigneux réussit 92.7 % des parties, la bande est 40 % à 90 %

### Région 8 : le Monastère Noir

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 99 % (99/100) | 1,0 |
| Héroïque | Charlie | 78 % (78/100) | 0,8 |
| Héroïque | Pollen | 99 % (99/100) | 1,0 |
| Héroïque | les trois | 92 % (276/300) | 0,9 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 95 % (95/100) | 17,5 |
| Fer | Pollen | 81 % (81/100) | 15,9 |
| Fer | les trois | 92 % (276/300) | 17,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 71 | 97 % (29/30) | 100 % (30/30) |
| 72 | 100 % (30/30) | 100 % (30/30) |
| 73 | 100 % (30/30) | 100 % (30/30) |
| 74 | 77 % (23/30) | 100 % (30/30) |
| 75 | 100 % (30/30) | 100 % (30/30) |
| 76 | 97 % (29/30) | 100 % (30/30) |
| 77 | 67 % (20/30) | 67 % (20/30) |
| 78 | 100 % (30/30) | 100 % (30/30) |
| 79 | 83 % (25/30) | 53 % (16/30) |
| 80 | 100 % (30/30) | 100 % (30/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 92 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 92 % des parties, la bande est 40 % à 90 %

### Région 9 : la Cité du Roi

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 82 % (82/100) | 0,8 |
| Héroïque | Charlie | 67 % (67/100) | 0,7 |
| Héroïque | Pollen | 69 % (69/100) | 0,7 |
| Héroïque | les trois | 73 % (218/300) | 0,7 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 100 % (100/100) | 19,0 |
| Fer | Pollen | 93 % (93/100) | 17,9 |
| Fer | les trois | 98 % (293/300) | 19,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 81 | 100 % (30/30) | 100 % (30/30) |
| 82 | 77 % (23/30) | 100 % (30/30) |
| 83 | 3 % (1/30) | 100 % (30/30) |
| 84 | 93 % (28/30) | 100 % (30/30) |
| 85 | 93 % (28/30) | 100 % (30/30) |
| 86 | 100 % (30/30) | 77 % (23/30) |
| 87 | 23 % (7/30) | 100 % (30/30) |
| 88 | 97 % (29/30) | 100 % (30/30) |
| 89 | 100 % (30/30) | 100 % (30/30) |
| 90 | 40 % (12/30) | 100 % (30/30) |

Écarts aux bandes des défis : 1

- Défi Fer : le bot soigneux réussit 97.7 % des parties, la bande est 40 % à 90 %

### Région 10 : la Cathédrale du Soleil Blême

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 90 % (90/100) | 0,9 |
| Héroïque | Charlie | 75 % (75/100) | 0,8 |
| Héroïque | Pollen | 86 % (86/100) | 0,9 |
| Héroïque | les trois | 84 % (251/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 19,9 |
| Fer | Charlie | 98 % (98/100) | 18,7 |
| Fer | Pollen | 80 % (80/100) | 15,7 |
| Fer | les trois | 93 % (278/300) | 18,1 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 91 | 100 % (30/30) | 100 % (30/30) |
| 92 | 100 % (30/30) | 100 % (30/30) |
| 93 | 67 % (20/30) | 67 % (20/30) |
| 94 | 100 % (30/30) | 100 % (30/30) |
| 95 | 90 % (27/30) | 100 % (30/30) |
| 96 | 67 % (20/30) | 100 % (30/30) |
| 97 | 87 % (26/30) | 60 % (18/30) |
| 98 | 100 % (30/30) | 100 % (30/30) |
| 99 | 93 % (28/30) | 100 % (30/30) |
| 100 | 33 % (10/30) | 100 % (30/30) |

Écarts aux bandes des défis : 1

- Défi Fer : le bot soigneux réussit 92.7 % des parties, la bande est 40 % à 90 %

## Mode infini

Matou, 20 vies, sans amélioration ni objet, chaque dieu avec son avatar, 10 graines par ligne. Résultat d’une partie : la dernière vague terminée (le record). On arrête une partie à la vague 100. Bandes, sur les cartes de la région 1 : la médiane du soigneux est entre la vague 25 et la vague 45 ; le naïf ne passe pas la vague 30 (aucune de ses parties). Les autres cartes sont données à titre d’information. Le soigneux joue une seule variante (équilibrée, diversité 0,4) et lit les 30 premières vagues générées.

| Bot | Dieu | Carte | Médiane | Min à max | Vagues par graine |
| --- | --- | --- | --- | --- | --- |
| Naïf | plume | chaumes (région 1) | 17.5 | 7 à 29 | 7 9 9 9 9 26 27 27 28 29 |
| Soigneux | plume | chaumes (région 1) | 35 | 34 à 36 | 34 34 35 35 35 35 35 35 35 36 |
| Naïf | charlie | chaumes (région 1) | 8 | 5 à 12 | 5 5 7 8 8 8 9 9 9 12 |
| Soigneux | charlie | chaumes (région 1) | 34 | 33 à 34 | 33 34 34 34 34 34 34 34 34 34 |
| Naïf | pollen | chaumes (région 1) | 27 | 26 à 29 | 26 27 27 27 27 27 29 29 29 29 |
| Soigneux | pollen | chaumes (région 1) | 34 | 33 à 35 | 33 34 34 34 34 34 35 35 35 35 |
| Naïf | plume | gue (région 1) | 27 | 12 à 28 | 12 13 26 26 27 27 27 28 28 28 |
| Soigneux | plume | gue (région 1) | 33 | 31 à 33 | 31 32 32 33 33 33 33 33 33 33 |
| Naïf | charlie | gue (région 1) | 9 | 8 à 27 | 8 9 9 9 9 9 9 9 26 27 |
| Soigneux | charlie | gue (région 1) | 31 | 31 à 32 | 31 31 31 31 31 31 31 31 32 32 |
| Naïf | pollen | gue (région 1) | 28 | 25 à 28 | 25 27 27 28 28 28 28 28 28 28 |
| Soigneux | pollen | gue (région 1) | 32 | 31 à 33 | 31 32 32 32 32 32 33 33 33 33 |
| Naïf | plume | pendus (région 1) | 11 | 8 à 28 | 8 9 9 9 9 13 24 26 27 28 |
| Soigneux | plume | pendus (région 1) | 36 | 36 à 37 | 36 36 36 36 36 36 36 36 37 37 |
| Naïf | charlie | pendus (région 1) | 7 | 6 à 12 | 6 7 7 7 7 7 8 8 9 12 |
| Soigneux | charlie | pendus (région 1) | 34 | 33 à 35 | 33 34 34 34 34 34 34 35 35 35 |
| Naïf | pollen | pendus (région 1) | 27 | 24 à 29 | 24 25 26 26 26 28 28 28 28 29 |
| Soigneux | pollen | pendus (région 1) | 34 | 34 à 36 | 34 34 34 34 34 34 35 35 36 36 |
| Naïf | plume | carrefour (région 1) | 27 | 8 à 28 | 8 27 27 27 27 27 27 27 28 28 |
| Soigneux | plume | carrefour (région 1) | 34 | 33 à 35 | 33 33 34 34 34 34 34 34 35 35 |
| Naïf | charlie | carrefour (région 1) | 12 | 7 à 26 | 7 8 9 11 12 12 13 25 26 26 |
| Soigneux | charlie | carrefour (région 1) | 32.5 | 32 à 33 | 32 32 32 32 32 33 33 33 33 33 |
| Naïf | pollen | carrefour (région 1) | 27 | 25 à 28 | 25 26 26 27 27 27 27 27 27 28 |
| Soigneux | pollen | carrefour (région 1) | 33 | 31 à 33 | 31 32 32 33 33 33 33 33 33 33 |
| Naïf | plume | region3 (région 3) | 8.5 | 7 à 12 | 7 8 8 8 8 9 9 9 9 12 |
| Soigneux | plume | region3 (région 3) | 35 | 34 à 36 | 34 35 35 35 35 35 35 35 35 36 |
| Naïf | charlie | region3 (région 3) | 8 | 5 à 9 | 5 6 7 7 8 8 8 9 9 9 |
| Soigneux | charlie | region3 (région 3) | 27.5 | 9 à 32 | 9 9 15 16 25 30 31 31 32 32 |
| Naïf | pollen | region3 (région 3) | 13 | 9 à 17 | 9 12 12 12 13 13 13 14 15 17 |
| Soigneux | pollen | region3 (région 3) | 32 | 31 à 33 | 31 31 31 31 32 32 33 33 33 33 |
| Naïf | plume | region6 (région 6) | 9 | 9 à 28 | 9 9 9 9 9 9 9 9 13 28 |
| Soigneux | plume | region6 (région 6) | 36 | 34 à 38 | 34 34 34 35 36 36 36 36 37 38 |
| Naïf | charlie | region6 (région 6) | 9 | 5 à 9 | 5 7 7 8 9 9 9 9 9 9 |
| Soigneux | charlie | region6 (région 6) | 31 | 29 à 33 | 29 29 30 31 31 31 32 32 33 33 |
| Naïf | pollen | region6 (région 6) | 18 | 13 à 28 | 13 13 13 15 18 18 19 27 28 28 |
| Soigneux | pollen | region6 (région 6) | 28 | 25 à 32 | 25 26 26 27 27 29 30 30 31 32 |
| Naïf | plume | region10 (région 10) | 12.5 | 9 à 15 | 9 9 9 9 12 13 14 14 14 15 |
| Soigneux | plume | region10 (région 10) | 35 | 34 à 35 | 34 34 34 34 35 35 35 35 35 35 |
| Naïf | charlie | region10 (région 10) | 9 | 6 à 13 | 6 9 9 9 9 9 9 13 13 13 |
| Soigneux | charlie | region10 (région 10) | 12.5 | 9 à 16 | 9 9 9 9 12 13 14 15 16 16 |
| Naïf | pollen | region10 (région 10) | 14.5 | 12 à 17 | 12 13 14 14 14 15 15 15 16 17 |
| Soigneux | pollen | region10 (région 10) | 15.5 | 9 à 28 | 9 9 9 14 15 16 16 16 25 28 |

Écarts aux bandes de l’infini : aucun.
