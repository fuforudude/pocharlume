# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau de la région 1 est rejoué sans
affichage dans les trois difficultés, avec chacun des trois dieux jouant son avatar (sans amélioration ni objet), par deux bots, sur 10 graines chacun (version des données 6).

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
