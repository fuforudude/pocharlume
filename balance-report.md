# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau de la région 1 est rejoué sans
affichage dans les trois difficultés, avec chacun des trois dieux jouant son avatar (sans amélioration ni objet), par deux bots, sur 10 graines chacun (version des données 7).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (socle, famille, niveau,
  spécialisation, bonus et remise de famille du dieu compris), après une petite recherche entre dix variantes (5 préférences × 2 diversités) jouées sur des graines d’entraînement ;
  place le héros dans la zone de feu de ses tours ; joue les sorts de son dieu selon leur effet (Chute du Colosse sur les grappes, Renforts et Voile de Nuit devant la zone de feu,
  Griffes d’Ombre sur la plus grosse grappe, Pièges à Ressort un peu avant la zone de feu, Ingéniosité au cœur de ses tours) ; construit la tour divine de son dieu dès la troisième tour ;
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter. Il lit la composition des vagues futures, ce qu’un joueur ne voit pas : il est un peu optimiste.
- **Naïf** : construit sur les socles proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans tour divine, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

Toutes les bandes sont respectées.

Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins 1 vie sur 50 % des niveaux et en laissant moins de 250 arêtes inutilisées par niveau, le naïf gagne 30 % à 70 % ;
Vieux Sage, le soigneux gagne 60 % à 85 % ; sans défense on perd. Entre dieux : en Vieux Sage, au plus 10,0 points d’écart de taux de victoire du soigneux ; en Matou, au plus 3 vies d’écart de vies moyennes du soigneux.

### Dieu × difficulté

Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins 1 vie.

| Difficulté | Dieu | Naïf : victoires | Soigneux : victoires | Bande du soigneux | Naïf : vies | Soigneux : vies | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % | 100 % | — | 24,5 | 25,0 | 1451 / 5806 | 0/10 | 10 % |
| Chaton | Charlie | 100 % | 100 % | — | 24,2 | 24,9 | 1333 / 5781 | 0/10 | 3 % |
| Chaton | Pollen | 100 % | 100 % | — | 24,6 | 25,0 | 1603 / 6428 | 0/10 | 0 % |
| Matou | Plume | 53 % | 100 % | 100 % | 6,7 | 18,0 | 134 / 223 | 5/10 | 0 % |
| Matou | Charlie | 33 % | 100 % | 100 % | 4,4 | 18,0 | 161 / 245 | 5/10 | 0 % |
| Matou | Pollen | 44 % | 100 % | 100 % | 6,5 | 18,1 | 165 / 248 | 5/10 | 0 % |
| Vieux Sage | Plume | 14 % | 80 % | 60 % à 85 % | 0,9 | 9,3 | 117 / 237 | 7/10 | 0 % |
| Vieux Sage | Charlie | 7 % | 77 % | 60 % à 85 % | 0,6 | 9,0 | 150 / 296 | 6/10 | 0 % |
| Vieux Sage | Pollen | 9 % | 84 % | 60 % à 85 % | 1,0 | 9,8 | 148 / 581 | 6/10 | 0 % |

Bande du naïf : Chaton 100 %, Matou 30 % à 70 %. Matou : au moins 50 % des niveaux avec perte. Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

### Écarts entre dieux

| Mesure du soigneux | Plume | Charlie | Pollen | Écart maximal | Écart permis |
| --- | --- | --- | --- | --- | --- |
| Vieux Sage : taux de victoire | 80 % | 77 % | 84 % | 7,0 points | 10,0 points |
| Matou : vies moyennes | 18,0 | 18,0 | 18,1 | 0,1 vies | 3 vies |

## Plume

Héros : Plume, l’Ombre Première. Bonus de famille : Tir — PV des soldats +0 %, cadence +60 %, critique +15 points, prix +0 %. Sorts : Voile de Nuit (recharge 30 s), Griffes d’Ombre (recharge 40 s). Tour divine : Sanctuaire de l’Ombre (200 arêtes).

### Plume : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 137 / 275 | aucune / aucune | 158 / 105 | gagné 3/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 113 / 187 | aucune / aucune | 187 / 133 | perdu en 188 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 67 / 218 | aucune / aucune | 202 / 148 | perdu en 170 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 140 / 214 | aucune / aucune | 234 / 133 | perdu en 175 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 169 / 158 | aucune / aucune | 217 / 185 | perdu en 99 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 222 / 792 | aucune / aucune | 262 / 205 | perdu en 119 s |
| 7 | 100 % (10/10) | 24,3 | 100 % (10/10) | 25,0 | 434 / 1362 | 1 (0,4 vies) / aucune | 307 / 261 | perdu en 115 s |
| 8 | 100 % (10/10) | 24,0 | 100 % (10/10) | 25,0 | 852 / 1831 | 3 (0,9 vies) / aucune | 318 / 287 | perdu en 106 s |
| 9 | 100 % (10/10) | 23,0 | 100 % (10/10) | 25,0 | 2314 / 3667 | 4 (1,5 vies) / aucune | 369 / 341 | perdu en 98 s |
| 10 | 100 % (10/10) | 23,8 | 100 % (10/10) | 25,0 | 4430 / 5806 | 2 (0,9 vies) / aucune | 434 / 355 | perdu en 90 s |

### Plume : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 70 % (7/10) | 10,0 | 100 % (10/10) | 19,7 | 86 / 141 | 3 (2,5 vies) / 3 (0,3 vies) | 167 / 101 | perdu en 138 s |
| 2 | 60 % (6/10) | 7,1 | 100 % (10/10) | 20,0 | 77 / 112 | 4 (4,8 vies) / aucune | 186 / 157 | perdu en 115 s |
| 3 | 90 % (9/10) | 14,2 | 100 % (10/10) | 19,7 | 97 / 132 | 5 (2,6 vies) / 5 (0,3 vies) | 211 / 147 | perdu en 127 s |
| 4 | 100 % (10/10) | 18,9 | 100 % (10/10) | 19,9 | 101 / 186 | 3 (0,7 vies) / 3 (0,1 vies) | 240 / 160 | perdu en 100 s |
| 5 | 80 % (8/10) | 6,9 | 100 % (10/10) | 16,4 | 107 / 44 | 4 (5,3 vies) / 3 (2,2 vies) | 216 / 194 | perdu en 85 s |
| 6 | 20 % (2/10) | 1,1 | 100 % (10/10) | 17,4 | 101 / 156 | 4 (7,2 vies) / 3 (2,2 vies) | 196 / 227 | perdu en 85 s |
| 7 | 30 % (3/10) | 3,3 | 100 % (10/10) | 15,0 | 89 / 83 | 5 (4,1 vies) / 5 (4,4 vies) | 197 / 291 | perdu en 90 s |
| 8 | 40 % (4/10) | 2,8 | 100 % (10/10) | 16,2 | 118 / 223 | 3 (13,7 vies) / 3 (3,8 vies) | 207 / 297 | perdu en 93 s |
| 9 | 30 % (3/10) | 2,3 | 100 % (10/10) | 20,0 | 106 / 77 | 2 (5,8 vies) / aucune | 186 / 355 | perdu en 87 s |
| 10 | 10 % (1/10) | 0,8 | 100 % (10/10) | 15,9 | 122 / 186 | 2 (7,5 vies) / 10 (1,5 vies) | 161 / 439 | perdu en 72 s |

### Plume : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 30 % (3/10) | 1,9 | 100 % (10/10) | 12,2 | 42 / 27 | 3 (5,1 vies) / 5 (2,8 vies) | 149 / 110 | perdu en 120 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 74 / 153 | 3 (5,4 vies) / aucune | 143 / 154 | perdu en 113 s |
| 3 | 30 % (3/10) | 2,2 | 100 % (10/10) | 10,4 | 67 / 94 | 3 (5,2 vies) / 1 (4,2 vies) | 169 / 170 | perdu en 109 s |
| 4 | 70 % (7/10) | 4,8 | 100 % (10/10) | 15,0 | 105 / 23 | 3 (4,8 vies) / aucune | 212 / 181 | perdu en 98 s |
| 5 | 10 % (1/10) | 0,2 | 20 % (2/10) | 0,7 | 86 / 118 | 3 (4,9 vies) / 3 (6,1 vies) | 124 / 152 | perdu en 78 s |
| 6 | 0 % (0/10) | 0,0 | 90 % (9/10) | 8,5 | 61 / 237 | 4 (5,7 vies) / 4 (2,6 vies) | 114 / 224 | perdu en 80 s |
| 7 | 0 % (0/10) | 0,0 | 60 % (6/10) | 3,8 | 77 / 49 | 2 (5,8 vies) / 5 (7,9 vies) | 113 / 219 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,2 | 93 / 211 | 3 (11,2 vies) / 3 (0,8 vies) | 93 / 294 | perdu en 91 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 12,6 | 86 / 72 | 2 (8,6 vies) / 3 (1,2 vies) | 112 / 357 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 30 % (3/10) | 1,0 | 57 / 186 | 2 (8,6 vies) / 3 (5,2 vies) | 77 / 288 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Plume : la plus choisie, Clocher des Archers (construction) (360 fois) ; la moins choisie, Mortier de Soufre (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | magie, diversité 0.4 | tir, diversité 1 | équilibrée, diversité 1 |
| 2 | magie, diversité 0.4 | équilibrée, diversité 1 | équilibrée, diversité 1 |
| 3 | caserne, diversité 1 | magie, diversité 0.4 | artillerie, diversité 0.4 |
| 4 | magie, diversité 0.4 | artillerie, diversité 0.4 | tir, diversité 1 |
| 5 | tir, diversité 1 | caserne, diversité 0.4 | artillerie, diversité 0.4 |
| 6 | caserne, diversité 0.4 | tir, diversité 0.4 | tir, diversité 1 |
| 7 | tir, diversité 0.4 | tir, diversité 0.4 | magie, diversité 1 |
| 8 | caserne, diversité 0.4 | caserne, diversité 1 | équilibrée, diversité 0.4 |
| 9 | tir, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 1 |
| 10 | équilibrée, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 0.4 |

## Charlie

Héros : Charlie, le Colosse. Bonus de famille : Caserne — PV des soldats +25 %, cadence +0 %, critique +0 points, prix +0 %. Sorts : Chute du Colosse (recharge 40 s), Renforts (recharge 20 s). Tour divine : Totem du Colosse (200 arêtes).

### Charlie : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 137 / 293 | aucune / aucune | 158 / 85 | gagné 1/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 83 / 305 | aucune / aucune | 189 / 139 | perdu en 180 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 67 / 189 | aucune / aucune | 202 / 136 | perdu en 217 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 140 / 288 | aucune / aucune | 235 / 188 | perdu en 198 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 24,5 | 169 / 263 | aucune / 4 (0,3 vies) | 217 / 183 | perdu en 115 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 222 / 540 | aucune / aucune | 264 / 244 | perdu en 131 s |
| 7 | 100 % (10/10) | 23,7 | 100 % (10/10) | 25,0 | 460 / 824 | 1 (0,8 vies) / aucune | 308 / 281 | perdu en 119 s |
| 8 | 100 % (10/10) | 24,6 | 100 % (10/10) | 25,0 | 857 / 1596 | 2 (0,2 vies) / aucune | 319 / 288 | perdu en 128 s |
| 9 | 100 % (10/10) | 20,1 | 100 % (10/10) | 25,0 | 2292 / 3252 | 4 (3,3 vies) / aucune | 370 / 342 | perdu en 98 s |
| 10 | 100 % (10/10) | 23,4 | 100 % (10/10) | 24,6 | 4427 / 5781 | 2 (0,8 vies) / 12 (0,4 vies) | 439 / 405 | perdu en 90 s |

### Charlie : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 70 % (7/10) | 9,4 | 100 % (10/10) | 20,0 | 88 / 165 | 3 (3,7 vies) / aucune | 162 / 116 | perdu en 121 s |
| 2 | 50 % (5/10) | 6,1 | 100 % (10/10) | 20,0 | 81 / 147 | 4 (4,7 vies) / aucune | 179 / 139 | perdu en 113 s |
| 3 | 60 % (6/10) | 8,3 | 100 % (10/10) | 20,0 | 138 / 150 | 5 (3,1 vies) / aucune | 190 / 161 | perdu en 109 s |
| 4 | 100 % (10/10) | 17,3 | 100 % (10/10) | 20,0 | 96 / 226 | 1 (0,8 vies) / aucune | 240 / 202 | perdu en 98 s |
| 5 | 20 % (2/10) | 1,3 | 100 % (10/10) | 17,9 | 75 / 123 | 4 (5,9 vies) / 8 (1,1 vies) | 191 / 189 | perdu en 84 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 18,7 | 68 / 245 | 4 (7,9 vies) / 8 (1,0 vies) | 156 / 246 | perdu en 82 s |
| 7 | 10 % (1/10) | 0,5 | 100 % (10/10) | 16,2 | 82 / 107 | 2 (4,5 vies) / 7 (2,1 vies) | 152 / 291 | perdu en 89 s |
| 8 | 10 % (1/10) | 0,3 | 100 % (10/10) | 15,9 | 88 / 177 | 3 (15,7 vies) / 8 (1,6 vies) | 138 / 300 | perdu en 92 s |
| 9 | 10 % (1/10) | 0,5 | 100 % (10/10) | 19,2 | 61 / 101 | 2 (8,3 vies) / 10 (0,8 vies) | 137 / 352 | perdu en 87 s |
| 10 | 0 % (0/10) | 0,0 | 100 % (10/10) | 12,2 | 65 / 172 | 2 (8,4 vies) / 11 (2,9 vies) | 106 / 472 | perdu en 66 s |

### Charlie : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 % (1/10) | 1,5 | 100 % (10/10) | 14,6 | 64 / 131 | 2 (6,1 vies) / 6 (0,4 vies) | 139 / 125 | perdu en 119 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,6 | 57 / 59 | 3 (6,5 vies) / 3 (0,4 vies) | 130 / 149 | perdu en 107 s |
| 3 | 10 % (1/10) | 1,1 | 100 % (10/10) | 15,0 | 55 / 296 | 3 (4,4 vies) / aucune | 146 / 160 | perdu en 108 s |
| 4 | 50 % (5/10) | 3,3 | 100 % (10/10) | 14,6 | 90 / 190 | 3 (5,4 vies) / 3 (0,4 vies) | 190 / 202 | perdu en 97 s |
| 5 | 0 % (0/10) | 0,0 | 60 % (6/10) | 4,1 | 70 / 69 | 3 (5,5 vies) / 8 (4,8 vies) | 106 / 188 | perdu en 70 s |
| 6 | 0 % (0/10) | 0,0 | 90 % (9/10) | 8,5 | 63 / 262 | 2 (6,6 vies) / 7 (2,9 vies) | 111 / 243 | perdu en 79 s |
| 7 | 0 % (0/10) | 0,0 | 30 % (3/10) | 0,7 | 61 / 138 | 2 (7,1 vies) / 7 (6,1 vies) | 99 / 230 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 6,8 | 85 / 243 | 3 (10,1 vies) / 3 (8,1 vies) | 93 / 296 | perdu en 91 s |
| 9 | 0 % (0/10) | 0,0 | 90 % (9/10) | 11,5 | 57 / 64 | 2 (10,4 vies) / 10 (2,2 vies) | 97 / 347 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 93 / 51 | 2 (9,3 vies) / 4 (4,4 vies) | 77 / 191 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Charlie : la plus choisie, Grenier des Griffes (construction) (170 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | caserne, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 2 | caserne, diversité 1 | équilibrée, diversité 1 | tir, diversité 1 |
| 3 | magie, diversité 1 | caserne, diversité 1 | équilibrée, diversité 0.4 |
| 4 | magie, diversité 0.4 | magie, diversité 0.4 | magie, diversité 0.4 |
| 5 | artillerie, diversité 1 | équilibrée, diversité 0.4 | équilibrée, diversité 0.4 |
| 6 | caserne, diversité 1 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 |
| 7 | caserne, diversité 0.4 | caserne, diversité 0.4 | caserne, diversité 0.4 |
| 8 | caserne, diversité 0.4 | équilibrée, diversité 1 | artillerie, diversité 0.4 |
| 9 | tir, diversité 0.4 | caserne, diversité 1 | caserne, diversité 1 |
| 10 | tir, diversité 0.4 | caserne, diversité 1 | caserne, diversité 1 |

## Pollen

Héros : Pollen, Trois-Pattes. Bonus de famille : Artillerie — PV des soldats +0 %, cadence +15 %, critique +0 points, prix −10 %. Sorts : Pièges à Ressort (recharge 30 s), Ingéniosité (recharge 50 s). Tour divine : Atelier Boiteux (200 arêtes).

### Pollen : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 96 / 165 | aucune / aucune | 161 / 95 | perdu en 176 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 76 / 227 | aucune / aucune | 187 / 147 | perdu en 156 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 78 / 236 | aucune / aucune | 199 / 101 | perdu en 193 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 129 / 255 | aucune / aucune | 234 / 207 | perdu en 191 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 109 / 235 | aucune / aucune | 217 / 176 | perdu en 131 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 210 / 970 | aucune / aucune | 262 / 237 | perdu en 120 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 582 / 1417 | aucune / aucune | 307 / 283 | perdu en 141 s |
| 8 | 100 % (10/10) | 24,7 | 100 % (10/10) | 25,0 | 1054 / 2087 | 3 (0,3 vies) / aucune | 319 / 296 | perdu en 124 s |
| 9 | 100 % (10/10) | 21,3 | 100 % (10/10) | 25,0 | 2546 / 4014 | 4 (2,2 vies) / aucune | 370 / 344 | perdu en 98 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 4685 / 6428 | aucune / aucune | 441 / 472 | perdu en 128 s |

### Pollen : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 30 % (3/10) | 5,0 | 100 % (10/10) | 20,0 | 65 / 193 | 4 (8,1 vies) / aucune | 154 / 115 | perdu en 139 s |
| 2 | 30 % (3/10) | 4,9 | 100 % (10/10) | 20,0 | 121 / 130 | 4 (9,4 vies) / aucune | 164 / 155 | perdu en 115 s |
| 3 | 50 % (5/10) | 9,4 | 100 % (10/10) | 17,9 | 75 / 158 | 5 (5,4 vies) / 3 (1,5 vies) | 208 / 160 | perdu en 137 s |
| 4 | 80 % (8/10) | 12,8 | 100 % (10/10) | 20,0 | 78 / 248 | 6 (3,4 vies) / aucune | 235 / 196 | perdu en 126 s |
| 5 | 50 % (5/10) | 8,4 | 100 % (10/10) | 20,0 | 81 / 152 | 7 (4,1 vies) / aucune | 216 / 185 | perdu en 111 s |
| 6 | 40 % (4/10) | 7,1 | 100 % (10/10) | 10,7 | 73 / 48 | 4 (7,5 vies) / 4 (6,1 vies) | 189 / 245 | perdu en 115 s |
| 7 | 40 % (4/10) | 3,6 | 100 % (10/10) | 17,8 | 93 / 131 | 5 (11,9 vies) / 5 (2,2 vies) | 213 / 281 | perdu en 111 s |
| 8 | 30 % (3/10) | 3,8 | 100 % (10/10) | 17,0 | 74 / 176 | 3 (15,1 vies) / 3 (2,3 vies) | 181 / 300 | perdu en 94 s |
| 9 | 40 % (4/10) | 3,6 | 100 % (10/10) | 19,2 | 80 / 218 | 2 (6,6 vies) / 5 (0,8 vies) | 213 / 346 | perdu en 97 s |
| 10 | 50 % (5/10) | 6,5 | 100 % (10/10) | 18,3 | 156 / 191 | 6 (3,2 vies) / 11 (1,0 vies) | 397 / 415 | perdu en 84 s |

### Pollen : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 48 / 174 | 3 (8,0 vies) / aucune | 141 / 117 | perdu en 121 s |
| 2 | 10 % (1/10) | 1,5 | 100 % (10/10) | 13,4 | 69 / 81 | 3 (7,2 vies) / 5 (1,6 vies) | 138 / 157 | perdu en 114 s |
| 3 | 20 % (2/10) | 1,8 | 100 % (10/10) | 6,8 | 60 / 64 | 5 (5,3 vies) / 3 (7,7 vies) | 168 / 159 | perdu en 127 s |
| 4 | 30 % (3/10) | 4,4 | 100 % (10/10) | 15,0 | 68 / 76 | 4 (3,8 vies) / aucune | 182 / 204 | perdu en 101 s |
| 5 | 20 % (2/10) | 1,6 | 100 % (10/10) | 14,2 | 98 / 175 | 4 (8,7 vies) / 4 (0,8 vies) | 160 / 187 | perdu en 88 s |
| 6 | 0 % (0/10) | 0,0 | 20 % (2/10) | 0,6 | 79 / 76 | 4 (10,8 vies) / 4 (8,2 vies) | 131 / 156 | perdu en 82 s |
| 7 | 0 % (0/10) | 0,0 | 90 % (9/10) | 4,6 | 76 / 98 | 3 (5,3 vies) / 5 (5,0 vies) | 127 / 280 | perdu en 100 s |
| 8 | 10 % (1/10) | 0,3 | 30 % (3/10) | 2,7 | 83 / 81 | 3 (14,7 vies) / 3 (12,1 vies) | 117 / 140 | perdu en 93 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,9 | 69 / 73 | 2 (8,4 vies) / 5 (0,1 vies) | 106 / 349 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 100 % (10/10) | 11,2 | 89 / 581 | 2 (4,5 vies) / 6 (1,9 vies) | 173 / 437 | perdu en 77 s |

Tours choisies par le soigneux en Matou avec Pollen : la plus choisie, Catapulte du Rempart (construction) (389 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 2 | artillerie, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 3 | caserne, diversité 1 | magie, diversité 1 | caserne, diversité 0.4 |
| 4 | caserne, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 5 | caserne, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 6 | caserne, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 1 |
| 7 | caserne, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 1 |
| 8 | caserne, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 9 | tir, diversité 1 | caserne, diversité 0.4 | artillerie, diversité 0.4 |
| 10 | tir, diversité 1 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus -0,3) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.

| Dieu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Corrélation de rang | Niveau le plus dur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | 10,0 | 7,1 | 14,2 | 18,9 | 6,9 | 1,1 | 3,3 | 2,8 | 2,3 | 0,8 | -0,8 | 10 (0,8 vies) |
| Charlie | 9,4 | 6,1 | 8,3 | 17,3 | 1,3 | 0,0 | 0,5 | 0,3 | 0,5 | 0,0 | -0,8 | 6 (0,0 vies) |
| Pollen | 5,0 | 4,9 | 9,4 | 12,8 | 8,4 | 7,1 | 3,6 | 3,8 | 3,6 | 6,5 | -0,4 | 7 (3,6 vies) |
| **Moyenne des dieux** | 8,1 | 6,0 | 10,6 | 16,3 | 5,5 | 2,7 | 2,5 | 2,3 | 2,1 | 2,4 | -0,9 | 9 (2,1 vies) |

Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).

## Usage des sorts par le soigneux

Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).

| Dieu | Sort | Recharge | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- | --- | --- |
| Plume | Voile de Nuit | 30 s | 5,4 sur 7,2 (74 %) | 6,4 sur 7,9 (81 %) | 6,2 sur 7,2 (86 %) |
| Plume | Griffes d’Ombre | 40 s | 5,4 sur 5,5 (99 %) | 6,0 sur 6,0 (100 %) | 5,4 sur 5,5 (99 %) |
| Charlie | Chute du Colosse | 40 s | 6,0 sur 6,0 (100 %) | 6,4 sur 6,4 (100 %) | 5,5 sur 5,6 (99 %) |
| Charlie | Renforts | 20 s | 8,5 sur 12,1 (70 %) | 10,8 sur 12,8 (84 %) | 9,6 sur 11,2 (86 %) |
| Pollen | Pièges à Ressort | 30 s | 6,7 sur 8,0 (83 %) | 7,5 sur 8,1 (92 %) | 7,0 sur 7,5 (94 %) |
| Pollen | Ingéniosité | 50 s | 3,9 sur 4,9 (81 %) | 4,7 sur 4,8 (97 %) | 4,3 sur 4,4 (98 %) |

## Tours divines

Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 200 arêtes avant la fin du niveau).
Sans tour divine : le même soigneux, mêmes graines, dépense ces 200 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.

| Dieu | Tour divine | Difficulté | Construite | Avec : victoires / vies | Sans : victoires / vies | Gain de la tour divine |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | Matou | 81 % | 100 % / 18,0 | 100 % / 17,5 | +0 points / +0,5 vies |
| Plume | Sanctuaire de l’Ombre | Vieux Sage | 66 % | 80 % / 9,3 | 64 % / 7,2 | +16 points / +2,2 vies |
| Charlie | Totem du Colosse | Matou | 90 % | 100 % / 18,0 | 99 % / 18,1 | +1 points / −0,1 vies |
| Charlie | Totem du Colosse | Vieux Sage | 84 % | 77 % / 9,0 | 73 % / 8,7 | +4 points / +0,3 vies |
| Pollen | Atelier Boiteux | Matou | 70 % | 100 % / 18,1 | 95 % / 17,7 | +5 points / +0,4 vies |
| Pollen | Atelier Boiteux | Vieux Sage | 58 % | 84 % / 9,8 | 74 % / 9,0 | +10 points / +0,9 vies |

Puissance par la formule des tours communes (DPS efficace moyen × portée ÷ coût), comptant en plus l’onde du Totem (cibles d’une zone d’une tuile de rayon) et les tourelles et pièges de l’Atelier ; elle ne chiffre ni l’étourdissement du Totem, ni les assassins non ciblables du Sanctuaire, ni l’immobilisation des pièges, ce qui explique que les tours divines ressortent en dessous des tours communes de coût voisin alors que le test de partie montre leur effet.

| Dieu | Tour divine | Coût | Puissance (formule) | Tours communes de coût voisin | Puissance moyenne de ces tours | Rapport |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | 200 | 1,3 | Grenier des Griffes (palier 2, coût cumulé 180), Clocher des Archers (palier 2, coût cumulé 180), Autel des Cendres (palier 2, coût cumulé 260) | 0,2 | ×8,4 |
| Charlie | Totem du Colosse | 200 | 0,1 | Grenier des Griffes (palier 2, coût cumulé 180), Clocher des Archers (palier 2, coût cumulé 180), Autel des Cendres (palier 2, coût cumulé 260) | 0,2 | ×0,4 |
| Pollen | Atelier Boiteux | 200 | 0,6 | Grenier des Griffes (palier 2, coût cumulé 180), Clocher des Archers (palier 2, coût cumulé 180), Autel des Cendres (palier 2, coût cumulé 260) | 0,2 | ×4,1 |

## Disciples comparés à leur avatar (Matou)

Chaque disciple est joué au niveau 1 avec son dieu (sans amélioration ni objet), dans les 10 niveaux de Matou. Écart : vies restantes moyennes du soigneux, disciple moins avatar (au plus 3 vies d’écart, en plus ou en moins).

| Dieu | Héros | Rôle | Soigneux : victoires | Soigneux : vies | Écart à l’avatar | Naïf : victoires | Naïf : vies | Écart à l’avatar (naïf) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | Plume, l’Ombre Première (avatar) | Duelliste, esquive et critiques | 100 % | 18,0 | — | 53 % | 6,7 | — |
| Plume | Suie | Assassin, exécute les blessés | 98 % | 16,3 | −1,7 vies | 22 % | 2,1 | −4,6 vies |
| Plume | Corbeau | Tireur, perce l’armure | 100 % | 17,4 | −0,7 vies | 52 % | 6,7 | +0,0 vies |
| Charlie | Charlie, le Colosse (avatar) | Tank, frappe de zone qui étourdit | 100 % | 18,0 | — | 33 % | 4,4 | — |
| Charlie | Mastoc | Provocation, bloque trois ennemis | 100 % | 17,4 | −0,6 vies | 27 % | 2,2 | −2,2 vies |
| Charlie | Brise-Os | Berserker, plus fort blessé | 99 % | 18,0 | −0,1 vies | 40 % | 4,0 | −0,4 vies |
| Pollen | Pollen, Trois-Pattes (avatar) | Pose des pièges, tire à la fronde | 100 % | 18,1 | — | 44 % | 6,5 | — |
| Pollen | Rouage | Ingénieur, construit une tourelle | 98 % | 18,1 | +0,0 vies | 49 % | 6,8 | +0,3 vies |
| Pollen | Lanterne | Soigneur, magie à distance | 96 % | 17,4 | −0,7 vies | 51 % | 7,0 | +0,5 vies |

## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)

L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.
La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.

| Dieu | Bot | De base | Arbre au maximum | Héros niveau 10 | Tout au maximum |
| --- | --- | --- | --- | --- | --- |
| Plume | Soigneux | 80 % / 9,3 | 84 % / 10,4 | 80 % / 10,6 | 89 % / 10,8 |
| Plume | Naïf | 14 % / 0,9 | 18 % / 1,7 | 38 % / 3,8 | 42 % / 4,6 |
| Charlie | Soigneux | 77 % / 9,0 | 82 % / 10,0 | 86 % / 10,8 | 90 % / 12,0 |
| Charlie | Naïf | 7 % / 0,6 | 10 % / 0,9 | 28 % / 2,6 | 33 % / 3,6 |
| Pollen | Soigneux | 84 % / 9,8 | 87 % / 10,4 | 98 % / 11,9 | 98 % / 12,3 |
| Pollen | Naïf | 9 % / 1,0 | 20 % / 2,0 | 24 % / 2,2 | 38 % / 3,9 |

## Puissance des tours par palier de coût

Puissance = DPS efficace moyen × portée ÷ coût cumulé. Chaque tour doit rester à ±15 % de la moyenne de son palier (palier 4 : les spécialisations).

| Palier | Tour | Coût cumulé | Puissance | Écart à la moyenne |
| --- | --- | --- | --- | --- |
| 1 | Grenier des Griffes | 70 | 0,2 | −1,1 % |
| 1 | Clocher des Archers | 70 | 0,2 | −0,3 % |
| 1 | Autel des Cendres | 100 | 0,2 | +2,1 % |
| 1 | Catapulte du Rempart | 125 | 0,2 | −0,8 % |
| 2 | Grenier des Griffes | 180 | 0,2 | +5,2 % |
| 2 | Clocher des Archers | 180 | 0,1 | −2,7 % |
| 2 | Autel des Cendres | 260 | 0,2 | +0,0 % |
| 2 | Catapulte du Rempart | 325 | 0,1 | −2,5 % |
| 3 | Grenier des Griffes | 340 | 0,1 | −2,4 % |
| 3 | Clocher des Archers | 340 | 0,1 | +2,1 % |
| 3 | Autel des Cendres | 500 | 0,1 | +1,4 % |
| 3 | Catapulte du Rempart | 625 | 0,1 | −1,1 % |
| 4 | Garde du Cloître | 570 | 0,2 | +4,5 % |
| 4 | Écorcheurs | 570 | 0,2 | −3,3 % |
| 4 | Guetteurs des Toits | 570 | 0,2 | −4,0 % |
| 4 | Arbalétriers du Beffroi | 570 | 0,2 | +9,4 % |
| 4 | Oracle de la Braise | 800 | 0,2 | −0,6 % |
| 4 | Nécromancien des Neuf Vies | 800 | 0,2 | −5,0 % |
| 4 | Mortier de Soufre | 985 | 0,2 | −0,4 % |
| 4 | Baliste à Chaînes | 985 | 0,2 | −0,6 % |

## Régions 2 à 5 : premier passage

Les bandes de la région 1 (plus haut) sont imposées. Celles des régions 2 à 5 ne le sont pas encore : c’est le premier passage du simulateur sur ces niveaux (arêtes de départ réglées grossièrement, rien d’absurde), l’équilibrage fin et l’ajout des bandes viennent à la tâche 6 du jalon 3. Chiffres de ce passage, mêmes dieux, mêmes bots et mêmes graines que pour la région 1.

### Région 2 : les Champs Brûlés

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 96 % (96/100) | 25,0 | 7466 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 66 % (66/100) | 20,3 | 6893 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 99 % (99/100) | 25,0 | 7589 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 23 % (23/100) | 20,0 | 2300 | 0 % (0/30) |
| Matou | Charlie | 57 % (57/100) | 3 % (3/100) | 5,6 | 1197 | 0 % (0/30) |
| Matou | Pollen | 98 % (98/100) | 34 % (34/100) | 16,0 | 2338 | 0 % (0/30) |
| Vieux Sage | Plume | 26 % (26/100) | 0 % (0/100) | 2,7 | 1358 | 0 % (0/30) |
| Vieux Sage | Charlie | 10 % (10/100) | 0 % (0/100) | 1,5 | 128 | 0 % (0/30) |
| Vieux Sage | Pollen | 10 % (10/100) | 1 % (1/100) | 1,5 | 621 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 100 % (30/30) | 20 % (6/30) | 3,1 | 258 | 100 % (30/30) | 14,5 | 0 % (0/9) |
| 12 | 67 % (20/30) | 10 % (3/30) | 1,1 | 987 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 13 | 67 % (20/30) | 30 % (9/30) | 4,2 | 1047 | 20 % (6/30) | 1,4 | 0 % (0/9) |
| 14 | 87 % (26/30) | 7 % (2/30) | 0,8 | 1309 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 15 | 70 % (21/30) | 17 % (5/30) | 2,2 | 2405 | 10 % (3/30) | 0,6 | 0 % (0/9) |
| 16 | 90 % (27/30) | 3 % (1/30) | 0,2 | 353 | 23 % (7/30) | 2,4 | 0 % (0/9) |
| 17 | 87 % (26/30) | 27 % (8/30) | 2,1 | 1881 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 18 | 90 % (27/30) | 30 % (9/30) | 2,2 | 2293 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 19 | 93 % (28/30) | 27 % (8/30) | 3,2 | 3846 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 20 | 100 % (30/30) | 30 % (9/30) | 3,8 | 5070 | 0 % (0/30) | 0,0 | 0 % (0/9) |

Écarts aux bandes (à titre d’information) : 43

- Chaton (Plume) : le bot naïf gagne 96 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 66 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 99 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 23 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 12 laisse 1407 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 13 laisse 1554 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 14 laisse 1598 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 15 laisse 3362 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 16 laisse 726 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 17 laisse 2240 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 18 laisse 2896 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 19 laisse 3842 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 20 laisse 5190 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 57 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 3 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 11 laisse 337 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 14 laisse 564 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 15 laisse 521 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 17 laisse 1127 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 18 laisse 1393 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 19 laisse 3328 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 20 laisse 4505 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 98 % des parties, il doit tout gagner
- Matou (Pollen) : le niveau 11 laisse 253 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 12 laisse 1491 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 13 laisse 1525 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 14 laisse 1766 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 15 laisse 3332 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 16 laisse 263 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 17 laisse 2277 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 18 laisse 2591 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 19 laisse 4369 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 20 laisse 5515 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,2, elle doit être d'au plus -0,6
- Matou : le niveau 20 (3,8 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 26 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 10 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 10 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (26 %) et Charlie (10 %) sont à 16 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (20 vies) et Charlie (5,6 vies) sont à 14,4 vies l'un de l'autre, il en faut au plus 3

### Région 3 : le Bourg des Bûchers

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 54 % (54/100) | 25,0 | 8732 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 48 % (48/100) | 23,9 | 8266 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 56 % (56/100) | 25,0 | 9254 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 6 % (6/100) | 17,1 | 2646 | 0 % (0/30) |
| Matou | Charlie | 56 % (56/100) | 1 % (1/100) | 5,9 | 1167 | 0 % (0/30) |
| Matou | Pollen | 96 % (96/100) | 9 % (9/100) | 14,8 | 2735 | 0 % (0/30) |
| Vieux Sage | Plume | 22 % (22/100) | 0 % (0/100) | 2,3 | 1637 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 188 | 0 % (0/30) |
| Vieux Sage | Pollen | 0 % (0/100) | 0 % (0/100) | 0,0 | 768 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 97 % (29/30) | 10 % (3/30) | 1,8 | 195 | 33 % (10/30) | 2,7 | 0 % (0/9) |
| 22 | 97 % (29/30) | 0 % (0/30) | 0,0 | 112 | 3 % (1/30) | 0,1 | 0 % (0/9) |
| 23 | 100 % (30/30) | 0 % (0/30) | 0,0 | 1614 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 24 | 83 % (25/30) | 7 % (2/30) | 0,9 | 2404 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 25 | 60 % (18/30) | 3 % (1/30) | 0,2 | 3891 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 26 | 77 % (23/30) | 20 % (6/30) | 2,3 | 2754 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 27 | 73 % (22/30) | 0 % (0/30) | 0,0 | 1724 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 28 | 87 % (26/30) | 0 % (0/30) | 0,0 | 1607 | 3 % (1/30) | 0,0 | 0 % (0/9) |
| 29 | 100 % (30/30) | 0 % (0/30) | 0,0 | 3409 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 30 | 67 % (20/30) | 13 % (4/30) | 1,6 | 4117 | 0 % (0/30) | 0,0 | 0 % (0/9) |

Écarts aux bandes (à titre d’information) : 41

- Chaton (Plume) : le bot naïf gagne 54 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 48 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 56 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 6 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le niveau 23 laisse 2358 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 24 laisse 2261 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 25 laisse 4501 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 26 laisse 3020 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 27 laisse 2170 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 28 laisse 1912 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 29 laisse 3804 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 30 laisse 6094 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 56 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 1 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 21 laisse 284 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 23 laisse 861 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 24 laisse 1975 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 25 laisse 2799 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 26 laisse 1401 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 27 laisse 314 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 28 laisse 697 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 29 laisse 3108 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 96 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 9 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le niveau 23 laisse 1624 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 24 laisse 2975 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 25 laisse 4372 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 26 laisse 3840 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 27 laisse 2687 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 28 laisse 2214 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 29 laisse 3314 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 30 laisse 6135 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,1, elle doit être d'au plus -0,6
- Matou : le niveau 30 (1,6 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 22 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (22 %) et Charlie (0 %) sont à 22 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (17,1 vies) et Charlie (5,9 vies) sont à 11,3 vies l'un de l'autre, il en faut au plus 3

### Région 4 : les Marais de l’Ordalie

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 54 % (54/100) | 25,0 | 10757 | 0 % (0/30) |
| Chaton | Charlie | 96 % (96/100) | 48 % (48/100) | 22,5 | 9975 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 58 % (58/100) | 24,4 | 10929 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 7 % (7/100) | 19,9 | 3860 | 0 % (0/30) |
| Matou | Charlie | 70 % (70/100) | 6 % (6/100) | 7,8 | 1949 | 0 % (0/30) |
| Matou | Pollen | 69 % (69/100) | 9 % (9/100) | 10,9 | 2396 | 0 % (0/30) |
| Vieux Sage | Plume | 6 % (6/100) | 0 % (0/100) | 0,4 | 2543 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 139 | 0 % (0/30) |
| Vieux Sage | Pollen | 0 % (0/100) | 0 % (0/100) | 0,0 | 662 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 87 % (26/30) | 20 % (6/30) | 3,9 | 191 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 32 | 100 % (30/30) | 7 % (2/30) | 0,9 | 1005 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 33 | 100 % (30/30) | 3 % (1/30) | 0,6 | 1080 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 34 | 90 % (27/30) | 0 % (0/30) | 0,0 | 3559 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 35 | 90 % (27/30) | 13 % (4/30) | 1,3 | 4818 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 36 | 37 % (11/30) | 30 % (9/30) | 4,5 | 2053 | 20 % (6/30) | 1,4 | 0 % (0/9) |
| 37 | 100 % (30/30) | 0 % (0/30) | 0,0 | 3374 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 38 | 63 % (19/30) | 0 % (0/30) | 0,0 | 3426 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 39 | 97 % (29/30) | 0 % (0/30) | 0,0 | 5161 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 40 | 33 % (10/30) | 0 % (0/30) | 0,0 | 2682 | 0 % (0/30) | 0,0 | 0 % (0/9) |

Écarts aux bandes (à titre d’information) : 39

- Chaton (Plume) : le bot naïf gagne 54 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 48 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 58 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 7 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 31 laisse 428 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 32 laisse 1285 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 33 laisse 1710 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 34 laisse 4126 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 35 laisse 5092 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 36 laisse 4721 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 37 laisse 3511 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 38 laisse 5250 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 39 laisse 5257 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 40 laisse 7219 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 70 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 6 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 32 laisse 798 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 33 laisse 780 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 34 laisse 2830 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 35 laisse 4181 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 37 laisse 2573 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 38 laisse 2651 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 39 laisse 4723 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 40 laisse 734 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 69 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 9 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le niveau 32 laisse 934 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 33 laisse 749 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 34 laisse 3721 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 35 laisse 5182 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 36 laisse 1311 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 37 laisse 4038 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 38 laisse 2377 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 39 laisse 5503 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Vieux Sage (Plume) : le bot soigneux gagne 6 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Matou : Plume (19,9 vies) et Charlie (7,8 vies) sont à 12,1 vies l'un de l'autre, il en faut au plus 3

### Région 5 : la Ville Pestiférée

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 58 % (58/100) | 25,0 | 13985 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 44 % (44/100) | 23,8 | 13330 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 61 % (61/100) | 25,0 | 14411 | 0 % (0/30) |
| Matou | Plume | 98 % (98/100) | 5 % (5/100) | 17,7 | 5335 | 0 % (0/30) |
| Matou | Charlie | 45 % (45/100) | 2 % (2/100) | 5,1 | 2604 | 0 % (0/30) |
| Matou | Pollen | 61 % (61/100) | 12 % (12/100) | 8,4 | 4245 | 0 % (0/30) |
| Vieux Sage | Plume | 0 % (0/100) | 0 % (0/100) | 0,0 | 2729 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 201 | 0 % (0/30) |
| Vieux Sage | Pollen | 0 % (0/100) | 0 % (0/100) | 0,0 | 972 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | 100 % (30/30) | 3 % (1/30) | 0,3 | 78 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 42 | 100 % (30/30) | 20 % (6/30) | 2,8 | 2130 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 43 | 30 % (9/30) | 0 % (0/30) | 0,0 | 1629 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 44 | 63 % (19/30) | 13 % (4/30) | 1,7 | 4871 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 45 | 33 % (10/30) | 10 % (3/30) | 1,1 | 3408 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 46 | 87 % (26/30) | 3 % (1/30) | 0,7 | 4243 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 47 | 87 % (26/30) | 0 % (0/30) | 0,0 | 4060 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 48 | 73 % (22/30) | 7 % (2/30) | 1,0 | 6175 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 49 | 60 % (18/30) | 0 % (0/30) | 0,0 | 4382 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 50 | 47 % (14/30) | 7 % (2/30) | 0,7 | 9637 | 0 % (0/30) | 0,0 | 0 % (0/9) |

Écarts aux bandes (à titre d’information) : 43

- Chaton (Plume) : le bot naïf gagne 58 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 44 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 61 % des parties, il doit tout gagner
- Matou (Plume) : le bot soigneux gagne 98 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 5 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 42 laisse 1847 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 43 laisse 4667 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 44 laisse 5912 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 45 laisse 6570 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 46 laisse 4875 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 47 laisse 5103 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 48 laisse 6769 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 49 laisse 6279 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 50 laisse 11243 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 45 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 2 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 42 laisse 1611 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 44 laisse 2555 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 45 laisse 2131 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 46 laisse 2913 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 47 laisse 2209 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 48 laisse 5709 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 49 laisse 276 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 50 laisse 8511 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 61 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 12 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le niveau 42 laisse 2931 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 44 laisse 6146 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 45 laisse 1525 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 46 laisse 4940 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 47 laisse 4867 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 48 laisse 6048 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 49 laisse 6591 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 50 laisse 9157 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,2, elle doit être d'au plus -0,6
- Matou : le niveau 50 (0,7 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Matou : Plume (17,7 vies) et Charlie (5,1 vies) sont à 12,6 vies l'un de l'autre, il en faut au plus 3
