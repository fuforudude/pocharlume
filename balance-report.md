# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau de la région 1 est rejoué sans
affichage dans les trois difficultés, avec chacun des trois dieux jouant son avatar (sans amélioration ni objet), par deux bots, sur 10 graines chacun (version des données 8).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (case de la grille, famille, niveau,
  spécialisation, bonus et remise de famille du dieu compris), après une petite recherche entre dix variantes (5 préférences × 2 diversités) jouées sur des graines d’entraînement ;
  place le héros dans la zone de feu de ses tours ; joue les sorts de son dieu selon leur effet (Chute du Colosse sur les grappes, Renforts et Voile de Nuit devant la zone de feu,
  Griffes d’Ombre sur la plus grosse grappe, Pièges à Ressort un peu avant la zone de feu, Ingéniosité au cœur de ses tours) ; construit la tour divine de son dieu dès la troisième tour ;
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter. Il lit la composition des vagues futures, ce qu’un joueur ne voit pas : il est un peu optimiste.
- **Naïf** : construit sur les cases de la grille proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans tour divine, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

**13 écart(s)** (bandes suspendues le temps de l’équilibrage qui suit la pose libre des tours : à titre d’information) :

- Chaton (Plume) : le bot naïf gagne 97 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 97 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 98 % des parties, il doit tout gagner
- Matou (Plume) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 4 laisse 254 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 10 laisse 258 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 27 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 2 laisse 347 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Vieux Sage (Pollen) : le bot soigneux gagne 94 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Pollen (94 %) et Charlie (78 %) sont à 16 points l'un de l'autre, il en faut au plus 10
- Matou : Pollen (19,7 vies) et Charlie (16,4 vies) sont à 3,4 vies l'un de l'autre, il en faut au plus 3

Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins 1 vie sur 50 % des niveaux et en laissant moins de 250 arêtes inutilisées par niveau, le naïf gagne 30 % à 70 % ;
Vieux Sage, le soigneux gagne 60 % à 85 % ; sans défense on perd. Entre dieux : en Vieux Sage, au plus 10,0 points d’écart de taux de victoire du soigneux ; en Matou, au plus 3 vies d’écart de vies moyennes du soigneux.

### Dieu × difficulté

Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins 1 vie.

| Difficulté | Dieu | Naïf : victoires | Soigneux : victoires | Bande du soigneux | Naïf : vies | Soigneux : vies | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 97 % | 100 % | — | 23,1 | 25,0 | 140 / 320 | 0/10 | 10 % |
| Chaton | Charlie | 97 % | 100 % | — | 22,7 | 24,9 | 168 / 305 | 0/10 | 3 % |
| Chaton | Pollen | 98 % | 100 % | — | 24,3 | 25,0 | 144 / 268 | 0/10 | 0 % |
| Matou | Plume | 36 % | 100 % | 100 % | 4,9 | 18,3 | 137 / 258 | 4/10 | 0 % |
| Matou | Charlie | 27 % | 90 % | 100 % | 3,6 | 16,4 | 116 / 347 | 5/10 | 0 % |
| Matou | Pollen | 37 % | 100 % | 100 % | 5,8 | 19,7 | 108 / 210 | 1/10 | 0 % |
| Vieux Sage | Plume | 9 % | 80 % | 60 % à 85 % | 0,3 | 9,9 | 109 / 197 | 5/10 | 0 % |
| Vieux Sage | Charlie | 4 % | 78 % | 60 % à 85 % | 0,3 | 10,0 | 115 / 292 | 6/10 | 0 % |
| Vieux Sage | Pollen | 11 % | 94 % | 60 % à 85 % | 0,8 | 12,4 | 102 / 164 | 4/10 | 0 % |

Bande du naïf : Chaton 100 %, Matou 30 % à 70 %. Matou : au moins 50 % des niveaux avec perte. Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

### Écarts entre dieux

| Mesure du soigneux | Plume | Charlie | Pollen | Écart maximal | Écart permis |
| --- | --- | --- | --- | --- | --- |
| Vieux Sage : taux de victoire | 80 % | 78 % | 94 % | 16,0 points | 10,0 points |
| Matou : vies moyennes | 18,3 | 16,4 | 19,7 | 3,4 vies | 3 vies |

## Plume

Héros : Plume, l’Ombre Première. Bonus de famille : Tir — PV des soldats +0 %, cadence +60 %, critique +15 points, prix +0 %. Sorts : Voile de Nuit (recharge 30 s), Griffes d’Ombre (recharge 40 s). Tour divine : Sanctuaire de l’Ombre (200 arêtes).

### Plume : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 105 / 218 | aucune / aucune | 159 / 139 | gagné 3/3 |
| 2 | 100 % (10/10) | 24,8 | 100 % (10/10) | 25,0 | 81 / 99 | 3 (0,2 vies) / aucune | 173 / 98 | perdu en 188 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 95 / 173 | aucune / aucune | 199 / 173 | perdu en 170 s |
| 4 | 100 % (10/10) | 24,9 | 100 % (10/10) | 25,0 | 84 / 62 | 3 (0,1 vies) / aucune | 227 / 131 | perdu en 175 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 91 / 137 | aucune / aucune | 223 / 182 | perdu en 99 s |
| 6 | 100 % (10/10) | 24,2 | 100 % (10/10) | 25,0 | 82 / 127 | 6 (0,3 vies) / aucune | 255 / 208 | perdu en 119 s |
| 7 | 100 % (10/10) | 23,8 | 100 % (10/10) | 25,0 | 63 / 107 | 1 (0,3 vies) / aucune | 295 / 199 | perdu en 115 s |
| 8 | 100 % (10/10) | 22,1 | 100 % (10/10) | 25,0 | 70 / 64 | 3 (2,6 vies) / aucune | 311 / 272 | perdu en 106 s |
| 9 | 80 % (8/10) | 19,0 | 100 % (10/10) | 25,0 | 97 / 98 | 3 (2,8 vies) / aucune | 311 / 279 | perdu en 98 s |
| 10 | 90 % (9/10) | 17,1 | 100 % (10/10) | 25,0 | 247 / 320 | 2 (2,8 vies) / aucune | 399 / 348 | perdu en 90 s |

### Plume : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 90 % (9/10) | 15,1 | 100 % (10/10) | 19,5 | 48 / 119 | 6 (1,5 vies) / 5 (0,5 vies) | 181 / 133 | perdu en 138 s |
| 2 | 10 % (1/10) | 1,5 | 100 % (10/10) | 20,0 | 67 / 179 | 3 (7,7 vies) / aucune | 147 / 118 | perdu en 115 s |
| 3 | 80 % (8/10) | 11,0 | 100 % (10/10) | 20,0 | 64 / 87 | 3 (3,3 vies) / aucune | 204 / 181 | perdu en 127 s |
| 4 | 80 % (8/10) | 11,0 | 100 % (10/10) | 18,8 | 57 / 254 | 3 (3,4 vies) / 3 (1,2 vies) | 216 / 214 | perdu en 100 s |
| 5 | 70 % (7/10) | 7,7 | 100 % (10/10) | 20,0 | 82 / 139 | 3 (3,7 vies) / aucune | 209 / 194 | perdu en 85 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 18,5 | 82 / 76 | 4 (9,4 vies) / 3 (1,4 vies) | 119 / 224 | perdu en 85 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 19,7 | 80 / 86 | 3 (5,5 vies) / 1 (0,3 vies) | 132 / 261 | perdu en 90 s |
| 8 | 10 % (1/10) | 1,1 | 100 % (10/10) | 19,8 | 50 / 92 | 3 (13,6 vies) / 3 (0,2 vies) | 127 / 298 | perdu en 93 s |
| 9 | 20 % (2/10) | 1,2 | 100 % (10/10) | 18,1 | 77 / 84 | 2 (6,8 vies) / 4 (1,9 vies) | 156 / 337 | perdu en 87 s |
| 10 | 0 % (0/10) | 0,0 | 100 % (10/10) | 9,0 | 54 / 258 | 2 (10,7 vies) / 6 (8,4 vies) | 89 / 405 | perdu en 72 s |

### Plume : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 40 % (4/10) | 1,4 | 100 % (10/10) | 15,0 | 74 / 154 | 3 (4,1 vies) / aucune | 162 / 140 | perdu en 120 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 65 / 119 | 3 (7,9 vies) / aucune | 118 / 140 | perdu en 113 s |
| 3 | 10 % (1/10) | 0,4 | 100 % (10/10) | 15,0 | 62 / 151 | 3 (5,1 vies) / aucune | 148 / 180 | perdu en 109 s |
| 4 | 20 % (2/10) | 1,3 | 100 % (10/10) | 15,0 | 77 / 91 | 3 (6,1 vies) / aucune | 142 / 183 | perdu en 98 s |
| 5 | 20 % (2/10) | 0,3 | 100 % (10/10) | 15,0 | 55 / 197 | 3 (5,8 vies) / aucune | 139 / 191 | perdu en 78 s |
| 6 | 0 % (0/10) | 0,0 | 80 % (8/10) | 4,6 | 70 / 76 | 2 (7,0 vies) / 4 (5,8 vies) | 102 / 209 | perdu en 80 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 12,1 | 61 / 73 | 2 (7,3 vies) / 1 (0,9 vies) | 92 / 279 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 90 % (9/10) | 6,4 | 91 / 52 | 3 (9,2 vies) / 3 (8,3 vies) | 93 / 271 | perdu en 91 s |
| 9 | 0 % (0/10) | 0,0 | 30 % (3/10) | 0,4 | 107 / 115 | 2 (8,6 vies) / 4 (10,0 vies) | 99 / 182 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 121 / 63 | 2 (10,0 vies) / 3 (10,9 vies) | 72 / 93 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Plume : la plus choisie, Clocher des Archers (construction) (651 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | magie, diversité 0.4 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 |
| 2 | équilibrée, diversité 1 | magie, diversité 1 | équilibrée, diversité 0.4 |
| 3 | magie, diversité 1 | tir, diversité 0.4 | tir, diversité 0.4 |
| 4 | équilibrée, diversité 0.4 | magie, diversité 1 | tir, diversité 0.4 |
| 5 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 | tir, diversité 0.4 |
| 6 | artillerie, diversité 0.4 | tir, diversité 0.4 | tir, diversité 0.4 |
| 7 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 | tir, diversité 1 |
| 8 | équilibrée, diversité 0.4 | équilibrée, diversité 1 | équilibrée, diversité 0.4 |
| 9 | tir, diversité 0.4 | artillerie, diversité 0.4 | tir, diversité 0.4 |
| 10 | équilibrée, diversité 0.4 | équilibrée, diversité 0.4 | tir, diversité 0.4 |

## Charlie

Héros : Charlie, le Colosse. Bonus de famille : Caserne — PV des soldats +25 %, cadence +0 %, critique +0 points, prix +0 %. Sorts : Chute du Colosse (recharge 40 s), Renforts (recharge 20 s). Tour divine : Totem du Colosse (200 arêtes).

### Charlie : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 90 / 204 | aucune / aucune | 160 / 130 | gagné 1/3 |
| 2 | 100 % (10/10) | 24,1 | 100 % (10/10) | 25,0 | 113 / 197 | 2 (0,4 vies) / aucune | 174 / 119 | perdu en 180 s |
| 3 | 100 % (10/10) | 24,9 | 100 % (10/10) | 24,9 | 78 / 253 | 3 (0,1 vies) / 2 (0,1 vies) | 201 / 170 | perdu en 217 s |
| 4 | 100 % (10/10) | 24,9 | 100 % (10/10) | 25,0 | 82 / 86 | 2 (0,1 vies) / aucune | 228 / 183 | perdu en 198 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 91 / 134 | aucune / aucune | 225 / 188 | perdu en 115 s |
| 6 | 100 % (10/10) | 23,8 | 100 % (10/10) | 25,0 | 78 / 123 | 6 (0,5 vies) / aucune | 256 / 211 | perdu en 131 s |
| 7 | 100 % (10/10) | 22,6 | 100 % (10/10) | 25,0 | 75 / 97 | 4 (0,8 vies) / aucune | 297 / 261 | perdu en 119 s |
| 8 | 100 % (10/10) | 21,9 | 100 % (10/10) | 25,0 | 86 / 167 | 3 (2,6 vies) / aucune | 313 / 281 | perdu en 128 s |
| 9 | 80 % (8/10) | 18,6 | 100 % (10/10) | 25,0 | 110 / 119 | 3 (2,9 vies) / aucune | 311 / 325 | perdu en 98 s |
| 10 | 90 % (9/10) | 16,1 | 100 % (10/10) | 24,5 | 247 / 305 | 2 (2,7 vies) / 3 (0,4 vies) | 415 / 384 | perdu en 90 s |

### Charlie : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 70 % (7/10) | 12,5 | 100 % (10/10) | 20,0 | 70 / 155 | 4 (2,4 vies) / aucune | 170 / 140 | perdu en 121 s |
| 2 | 10 % (1/10) | 1,4 | 100 % (10/10) | 20,0 | 73 / 347 | 3 (8,0 vies) / aucune | 136 / 117 | perdu en 113 s |
| 3 | 70 % (7/10) | 6,2 | 100 % (10/10) | 20,0 | 71 / 85 | 3 (4,2 vies) / aucune | 192 / 170 | perdu en 109 s |
| 4 | 50 % (5/10) | 6,3 | 100 % (10/10) | 20,0 | 85 / 34 | 3 (5,9 vies) / aucune | 192 / 201 | perdu en 98 s |
| 5 | 60 % (6/10) | 8,6 | 100 % (10/10) | 19,0 | 105 / 63 | 3 (3,5 vies) / 7 (0,6 vies) | 209 / 202 | perdu en 84 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,0 | 60 / 51 | 4 (7,1 vies) / 4 (4,0 vies) | 114 / 227 | perdu en 82 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,8 | 72 / 112 | 3 (5,9 vies) / 6 (2,5 vies) | 121 / 277 | perdu en 89 s |
| 8 | 10 % (1/10) | 0,9 | 100 % (10/10) | 19,2 | 63 / 88 | 3 (13,9 vies) / 9 (0,8 vies) | 128 / 295 | perdu en 92 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 17,5 | 105 / 177 | 2 (7,7 vies) / 4 (2,5 vies) | 110 / 341 | perdu en 87 s |
| 10 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 69 / 50 | 2 (11,3 vies) / 6 (9,3 vies) | 85 / 204 | perdu en 66 s |

### Charlie : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 % (1/10) | 1,1 | 100 % (10/10) | 13,9 | 95 / 117 | 3 (5,9 vies) / 5 (0,5 vies) | 143 / 144 | perdu en 119 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,9 | 75 / 292 | 2 (8,1 vies) / 2 (0,1 vies) | 116 / 125 | perdu en 107 s |
| 3 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 65 / 123 | 3 (6,3 vies) / aucune | 122 / 172 | perdu en 108 s |
| 4 | 10 % (1/10) | 0,4 | 100 % (10/10) | 14,9 | 71 / 106 | 3 (6,4 vies) / 7 (0,1 vies) | 130 / 214 | perdu en 97 s |
| 5 | 20 % (2/10) | 1,2 | 100 % (10/10) | 12,4 | 71 / 54 | 3 (5,5 vies) / 6 (2,4 vies) | 131 / 198 | perdu en 70 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 10,5 | 85 / 104 | 2 (6,7 vies) / 3 (2,5 vies) | 101 / 229 | perdu en 79 s |
| 7 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 53 / 67 | 2 (7,8 vies) / 5 (6,7 vies) | 85 / 139 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,2 | 86 / 111 | 3 (9,8 vies) / 6 (0,6 vies) | 93 / 296 | perdu en 91 s |
| 9 | 0 % (0/10) | 0,0 | 80 % (8/10) | 3,9 | 106 / 79 | 2 (8,4 vies) / 4 (6,7 vies) | 98 / 311 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 97 / 94 | 2 (9,6 vies) / 3 (5,1 vies) | 70 / 111 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Charlie : la plus choisie, Catapulte du Rempart (construction) (432 fois) ; la moins choisie, Mortier de Soufre (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | caserne, diversité 1 | magie, diversité 0.4 | magie, diversité 0.4 |
| 2 | équilibrée, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 1 |
| 3 | magie, diversité 1 | équilibrée, diversité 1 | artillerie, diversité 0.4 |
| 4 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 | caserne, diversité 1 |
| 5 | caserne, diversité 1 | magie, diversité 0.4 | artillerie, diversité 0.4 |
| 6 | artillerie, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 7 | magie, diversité 1 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 8 | artillerie, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 9 | artillerie, diversité 1 | artillerie, diversité 0.4 | caserne, diversité 0.4 |
| 10 | magie, diversité 1 | magie, diversité 1 | magie, diversité 1 |

## Pollen

Héros : Pollen, Trois-Pattes. Bonus de famille : Artillerie — PV des soldats +0 %, cadence +15 %, critique +0 points, prix −10 %. Sorts : Pièges à Ressort (recharge 30 s), Ingéniosité (recharge 50 s). Tour divine : Atelier Boiteux (200 arêtes).

### Pollen : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 67 / 181 | aucune / aucune | 163 / 126 | perdu en 176 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 97 / 108 | aucune / aucune | 173 / 105 | perdu en 156 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 127 / 70 | aucune / aucune | 196 / 162 | perdu en 193 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 100 / 33 | aucune / aucune | 227 / 188 | perdu en 191 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 129 / 66 | aucune / aucune | 225 / 186 | perdu en 131 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 80 / 268 | aucune / aucune | 255 / 212 | perdu en 120 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 106 / 162 | aucune / aucune | 296 / 247 | perdu en 141 s |
| 8 | 100 % (10/10) | 24,2 | 100 % (10/10) | 25,0 | 75 / 157 | 3 (0,8 vies) / aucune | 311 / 287 | perdu en 124 s |
| 9 | 80 % (8/10) | 18,7 | 100 % (10/10) | 25,0 | 125 / 159 | 3 (3,0 vies) / aucune | 311 / 318 | perdu en 98 s |
| 10 | 100 % (10/10) | 24,6 | 100 % (10/10) | 25,0 | 242 / 237 | 2 (0,4 vies) / aucune | 436 / 369 | perdu en 128 s |

### Pollen : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 50 % (5/10) | 7,4 | 100 % (10/10) | 19,9 | 71 / 148 | 4 (4,2 vies) / 3 (0,1 vies) | 168 / 150 | perdu en 139 s |
| 2 | 30 % (3/10) | 5,0 | 100 % (10/10) | 20,0 | 73 / 90 | 4 (7,3 vies) / aucune | 157 / 127 | perdu en 115 s |
| 3 | 50 % (5/10) | 8,6 | 100 % (10/10) | 20,0 | 74 / 210 | 5 (4,9 vies) / aucune | 200 / 184 | perdu en 137 s |
| 4 | 70 % (7/10) | 13,8 | 100 % (10/10) | 20,0 | 70 / 45 | 4 (2,7 vies) / aucune | 216 / 199 | perdu en 126 s |
| 5 | 70 % (7/10) | 13,3 | 100 % (10/10) | 20,0 | 76 / 72 | 4 (3,3 vies) / aucune | 214 / 195 | perdu en 111 s |
| 6 | 20 % (2/10) | 2,2 | 100 % (10/10) | 19,5 | 83 / 78 | 4 (10,1 vies) / 4 (0,3 vies) | 153 / 233 | perdu en 115 s |
| 7 | 30 % (3/10) | 5,4 | 100 % (10/10) | 20,0 | 81 / 106 | 5 (6,3 vies) / aucune | 211 / 273 | perdu en 111 s |
| 8 | 20 % (2/10) | 0,3 | 100 % (10/10) | 19,5 | 58 / 78 | 3 (17,1 vies) / 3 (0,5 vies) | 162 / 294 | perdu en 94 s |
| 9 | 10 % (1/10) | 1,4 | 100 % (10/10) | 19,8 | 74 / 88 | 3 (6,3 vies) / 4 (0,2 vies) | 137 / 342 | perdu en 97 s |
| 10 | 20 % (2/10) | 1,0 | 100 % (10/10) | 18,4 | 45 / 168 | 4 (7,1 vies) / 6 (1,6 vies) | 219 / 433 | perdu en 84 s |

### Pollen : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 93 / 131 | 3 (6,0 vies) / aucune | 152 / 146 | perdu en 121 s |
| 2 | 10 % (1/10) | 0,3 | 100 % (10/10) | 15,0 | 78 / 45 | 3 (10,3 vies) / aucune | 129 / 154 | perdu en 114 s |
| 3 | 20 % (2/10) | 1,8 | 100 % (10/10) | 15,0 | 75 / 164 | 3 (4,3 vies) / aucune | 166 / 180 | perdu en 127 s |
| 4 | 50 % (5/10) | 4,4 | 100 % (10/10) | 13,7 | 75 / 93 | 3 (4,2 vies) / 1 (1,0 vies) | 187 / 207 | perdu en 101 s |
| 5 | 20 % (2/10) | 0,8 | 100 % (10/10) | 14,7 | 92 / 124 | 4 (5,5 vies) / 8 (0,3 vies) | 182 / 196 | perdu en 88 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,2 | 65 / 12 | 4 (9,3 vies) / 6 (0,4 vies) | 118 / 240 | perdu en 82 s |
| 7 | 10 % (1/10) | 1,1 | 90 % (9/10) | 10,0 | 65 / 62 | 5 (4,7 vies) / 5 (3,6 vies) | 156 / 263 | perdu en 100 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 9,4 | 87 / 115 | 3 (15,0 vies) / 3 (5,6 vies) | 94 / 295 | perdu en 93 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,8 | 103 / 141 | 2 (6,9 vies) / 4 (0,2 vies) | 108 / 343 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 50 % (5/10) | 2,1 | 71 / 129 | 2 (6,2 vies) / 6 (7,3 vies) | 101 / 334 | perdu en 77 s |

Tours choisies par le soigneux en Matou avec Pollen : la plus choisie, Catapulte du Rempart (construction) (688 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | magie, diversité 0.4 | magie, diversité 0.4 | artillerie, diversité 0.4 |
| 2 | artillerie, diversité 0.4 | artillerie, diversité 1 | caserne, diversité 0.4 |
| 3 | équilibrée, diversité 0.4 | tir, diversité 0.4 | artillerie, diversité 0.4 |
| 4 | tir, diversité 1 | équilibrée, diversité 0.4 | équilibrée, diversité 0.4 |
| 5 | magie, diversité 1 | magie, diversité 1 | tir, diversité 0.4 |
| 6 | magie, diversité 1 | caserne, diversité 0.4 | artillerie, diversité 1 |
| 7 | équilibrée, diversité 1 | magie, diversité 0.4 | caserne, diversité 1 |
| 8 | caserne, diversité 1 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 |
| 9 | équilibrée, diversité 1 | caserne, diversité 0.4 | magie, diversité 1 |
| 10 | équilibrée, diversité 1 | artillerie, diversité 1 | magie, diversité 1 |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus -0,3) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.

| Dieu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Corrélation de rang | Niveau le plus dur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | 15,1 | 1,5 | 11,0 | 11,0 | 7,7 | 0,0 | 0,0 | 1,1 | 1,2 | 0,0 | -0,8 | 6 (0,0 vies) |
| Charlie | 12,5 | 1,4 | 6,2 | 6,3 | 8,6 | 0,0 | 0,0 | 0,9 | 0,0 | 0,0 | -0,8 | 6 (0,0 vies) |
| Pollen | 7,4 | 5,0 | 8,6 | 13,8 | 13,3 | 2,2 | 5,4 | 0,3 | 1,4 | 1,0 | -0,7 | 8 (0,3 vies) |
| **Moyenne des dieux** | 11,7 | 2,6 | 8,6 | 10,4 | 9,9 | 0,7 | 1,8 | 0,8 | 0,9 | 0,3 | -0,8 | 10 (0,3 vies) |

Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).

## Usage des sorts par le soigneux

Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).

| Dieu | Sort | Recharge | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- | --- | --- |
| Plume | Voile de Nuit | 30 s | 3,3 sur 6,8 (48 %) | 5,6 sur 7,9 (71 %) | 5,0 sur 6,3 (80 %) |
| Plume | Griffes d’Ombre | 40 s | 5,0 sur 5,1 (99 %) | 5,8 sur 6,0 (98 %) | 4,8 sur 4,8 (99 %) |
| Charlie | Chute du Colosse | 40 s | 6,0 sur 6,0 (100 %) | 5,7 sur 5,7 (100 %) | 5,1 sur 5,2 (99 %) |
| Charlie | Renforts | 20 s | 6,6 sur 11,8 (56 %) | 8,9 sur 11,3 (78 %) | 8,5 sur 10,1 (84 %) |
| Pollen | Pièges à Ressort | 30 s | 5,8 sur 7,5 (78 %) | 7,4 sur 8,3 (89 %) | 7,3 sur 8,0 (92 %) |
| Pollen | Ingéniosité | 50 s | 2,5 sur 4,5 (57 %) | 4,0 sur 5,1 (78 %) | 3,9 sur 4,9 (81 %) |

## Tours divines

Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 200 arêtes avant la fin du niveau).
Sans tour divine : le même soigneux, mêmes graines, dépense ces 200 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.

| Dieu | Tour divine | Difficulté | Construite | Avec : victoires / vies | Sans : victoires / vies | Gain de la tour divine |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | Matou | 93 % | 100 % / 18,3 | 100 % / 18,5 | +0 points / −0,1 vies |
| Plume | Sanctuaire de l’Ombre | Vieux Sage | 55 % | 80 % / 9,9 | 80 % / 9,3 | +0 points / +0,5 vies |
| Charlie | Totem du Colosse | Matou | 85 % | 90 % / 16,4 | 91 % / 17,1 | −1 points / −0,7 vies |
| Charlie | Totem du Colosse | Vieux Sage | 89 % | 78 % / 10,0 | 70 % / 9,1 | +8 points / +0,8 vies |
| Pollen | Atelier Boiteux | Matou | 87 % | 100 % / 19,7 | 100 % / 19,5 | +0 points / +0,2 vies |
| Pollen | Atelier Boiteux | Vieux Sage | 89 % | 94 % / 12,4 | 98 % / 12,8 | −4 points / −0,4 vies |

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
| Plume | Plume, l’Ombre Première (avatar) | Duelliste, esquive et critiques | 100 % | 18,3 | — | 36 % | 4,9 | — |
| Plume | Suie | Assassin, exécute les blessés | 99 % | 17,9 | −0,5 vies | 16 % | 1,5 | −3,4 vies |
| Plume | Corbeau | Tireur, perce l’armure | 100 % | 19,6 | +1,2 vies | 35 % | 4,3 | −0,5 vies |
| Charlie | Charlie, le Colosse (avatar) | Tank, frappe de zone qui étourdit | 90 % | 16,4 | — | 27 % | 3,6 | — |
| Charlie | Mastoc | Provocation, bloque trois ennemis | 100 % | 17,6 | +1,2 vies | 18 % | 2,3 | −1,3 vies |
| Charlie | Brise-Os | Berserker, plus fort blessé | 94 % | 16,3 | −0,1 vies | 25 % | 3,3 | −0,3 vies |
| Pollen | Pollen, Trois-Pattes (avatar) | Pose des pièges, tire à la fronde | 100 % | 19,7 | — | 37 % | 5,8 | — |
| Pollen | Rouage | Ingénieur, construit une tourelle | 100 % | 19,9 | +0,2 vies | 40 % | 6,0 | +0,1 vies |
| Pollen | Lanterne | Soigneur, magie à distance | 100 % | 19,9 | +0,2 vies | 41 % | 6,1 | +0,3 vies |

## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)

L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.
La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.

| Dieu | Bot | De base | Arbre au maximum | Héros niveau 10 | Tout au maximum |
| --- | --- | --- | --- | --- | --- |
| Plume | Soigneux | 80 % / 9,9 | 97 % / 12,0 | 85 % / 11,0 | 97 % / 12,9 |
| Plume | Naïf | 9 % / 0,3 | 14 % / 1,2 | 29 % / 3,1 | 33 % / 3,9 |
| Charlie | Soigneux | 78 % / 10,0 | 79 % / 10,8 | 89 % / 11,6 | 82 % / 11,6 |
| Charlie | Naïf | 4 % / 0,3 | 10 % / 0,7 | 19 % / 1,5 | 26 % / 2,4 |
| Pollen | Soigneux | 94 % / 12,4 | 97 % / 13,9 | 100 % / 14,0 | 100 % / 14,4 |
| Pollen | Naïf | 11 % / 0,8 | 21 % / 2,0 | 25 % / 2,8 | 30 % / 3,7 |

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

Les bandes de la région 1 (plus haut) sont suspendues le temps de l’équilibrage qui suit la pose libre des tours (elles sont affichées, pas imposées). Celles des régions 2 à 5 ne le sont pas encore : c’est le premier passage du simulateur sur ces niveaux (arêtes de départ réglées grossièrement, rien d’absurde), l’équilibrage fin et l’ajout des bandes viennent à la tâche 6 du jalon 3. Chiffres de ce passage, mêmes dieux, mêmes bots et mêmes graines que pour la région 1.

### Région 2 : les Champs Brûlés

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 93 % (93/100) | 25,0 | 189 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 86 % (86/100) | 25,0 | 149 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 24,9 | 153 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 17 % (17/100) | 19,9 | 121 | 0 % (0/30) |
| Matou | Charlie | 69 % (69/100) | 4 % (4/100) | 8,4 | 130 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 52 % (52/100) | 19,3 | 160 | 0 % (0/30) |
| Vieux Sage | Plume | 71 % (71/100) | 0 % (0/100) | 9,6 | 111 | 0 % (0/30) |
| Vieux Sage | Charlie | 10 % (10/100) | 0 % (0/100) | 1,5 | 103 | 0 % (0/30) |
| Vieux Sage | Pollen | 27 % (27/100) | 2 % (2/100) | 2,7 | 92 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 100 % (30/30) | 30 % (9/30) | 4,6 | 111 | 100 % (30/30) | 15,0 | 0 % (0/9) |
| 12 | 67 % (20/30) | 7 % (2/30) | 0,7 | 77 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 13 | 97 % (29/30) | 37 % (11/30) | 5,4 | 120 | 43 % (13/30) | 4,8 | 0 % (0/9) |
| 14 | 67 % (20/30) | 10 % (3/30) | 1,2 | 156 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 15 | 100 % (30/30) | 33 % (10/30) | 4,3 | 129 | 23 % (7/30) | 3,4 | 0 % (0/9) |
| 16 | 100 % (30/30) | 10 % (3/30) | 0,8 | 78 | 33 % (10/30) | 4,8 | 0 % (0/9) |
| 17 | 80 % (24/30) | 23 % (7/30) | 2,3 | 124 | 30 % (9/30) | 3,2 | 0 % (0/9) |
| 18 | 100 % (30/30) | 40 % (12/30) | 6,3 | 214 | 60 % (18/30) | 6,3 | 0 % (0/9) |
| 19 | 87 % (26/30) | 33 % (10/30) | 3,7 | 134 | 37 % (11/30) | 3,4 | 0 % (0/9) |
| 20 | 100 % (30/30) | 20 % (6/30) | 3,0 | 224 | 33 % (10/30) | 4,9 | 0 % (0/9) |

Écarts aux bandes (à titre d’information) : 18

- Chaton (Plume) : le bot naïf gagne 93 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 86 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 17 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 18 laisse 252 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 69 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 4 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 20 laisse 265 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,1, elle doit être d'au plus -0,6
- Matou : le niveau 20 (3 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 10 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 27 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (71 %) et Charlie (10 %) sont à 61 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,9 vies) et Charlie (8,4 vies) sont à 11,5 vies l'un de l'autre, il en faut au plus 3

### Région 3 : le Bourg des Bûchers

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 25 % (25/100) | 25,0 | 1251 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 25 % (25/100) | 24,7 | 922 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 30 % (30/100) | 25,0 | 1178 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 1 % (1/100) | 19,9 | 157 | 0 % (0/30) |
| Matou | Charlie | 70 % (70/100) | 0 % (0/100) | 8,4 | 117 | 0 % (0/30) |
| Matou | Pollen | 99 % (99/100) | 3 % (3/100) | 16,3 | 126 | 0 % (0/30) |
| Vieux Sage | Plume | 63 % (63/100) | 0 % (0/100) | 7,7 | 133 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 91 | 0 % (0/30) |
| Vieux Sage | Pollen | 35 % (35/100) | 0 % (0/100) | 2,7 | 107 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 100 % (30/30) | 3 % (1/30) | 0,2 | 121 | 40 % (12/30) | 3,9 | 0 % (0/9) |
| 22 | 87 % (26/30) | 0 % (0/30) | 0,0 | 93 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 23 | 100 % (30/30) | 0 % (0/30) | 0,0 | 139 | 23 % (7/30) | 2,0 | 0 % (0/9) |
| 24 | 100 % (30/30) | 0 % (0/30) | 0,0 | 133 | 13 % (4/30) | 1,2 | 0 % (0/9) |
| 25 | 100 % (30/30) | 7 % (2/30) | 0,3 | 189 | 63 % (19/30) | 4,7 | 0 % (0/9) |
| 26 | 63 % (19/30) | 0 % (0/30) | 0,0 | 84 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 27 | 100 % (30/30) | 0 % (0/30) | 0,0 | 98 | 60 % (18/30) | 6,8 | 0 % (0/9) |
| 28 | 70 % (21/30) | 0 % (0/30) | 0,0 | 117 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 29 | 100 % (30/30) | 3 % (1/30) | 0,4 | 129 | 67 % (20/30) | 7,1 | 0 % (0/9) |
| 30 | 77 % (23/30) | 0 % (0/30) | 0,0 | 229 | 27 % (8/30) | 3,9 | 0 % (0/9) |

Écarts aux bandes (à titre d’information) : 19

- Chaton (Plume) : le bot naïf gagne 25 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 25 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 30 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 1 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 30 laisse 283 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 70 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 0 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 3 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le niveau 30 laisse 278 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 35 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (63 %) et Charlie (0 %) sont à 63 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,9 vies) et Charlie (8,4 vies) sont à 11,5 vies l'un de l'autre, il en faut au plus 3

### Région 4 : les Marais de l’Ordalie

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 35 % (35/100) | 25,0 | 1102 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 35 % (35/100) | 25,0 | 675 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 39 % (39/100) | 25,0 | 1218 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 6 % (6/100) | 17,8 | 165 | 0 % (0/30) |
| Matou | Charlie | 82 % (82/100) | 4 % (4/100) | 11,6 | 142 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 11 % (11/100) | 19,0 | 149 | 0 % (0/30) |
| Vieux Sage | Plume | 42 % (42/100) | 0 % (0/100) | 4,0 | 114 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 102 | 0 % (0/30) |
| Vieux Sage | Pollen | 31 % (31/100) | 0 % (0/100) | 2,6 | 115 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 100 % (30/30) | 23 % (7/30) | 2,5 | 226 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 32 | 100 % (30/30) | 20 % (6/30) | 2,7 | 101 | 20 % (6/30) | 2,2 | 0 % (0/9) |
| 33 | 90 % (27/30) | 7 % (2/30) | 1,1 | 103 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 34 | 100 % (30/30) | 0 % (0/30) | 0,0 | 141 | 30 % (9/30) | 2,2 | 0 % (0/9) |
| 35 | 100 % (30/30) | 3 % (1/30) | 0,5 | 243 | 63 % (19/30) | 9,0 | 0 % (0/9) |
| 36 | 100 % (30/30) | 17 % (5/30) | 1,4 | 103 | 27 % (8/30) | 1,7 | 0 % (0/9) |
| 37 | 100 % (30/30) | 0 % (0/30) | 0,0 | 123 | 33 % (10/30) | 2,3 | 0 % (0/9) |
| 38 | 83 % (25/30) | 0 % (0/30) | 0,0 | 126 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 39 | 100 % (30/30) | 0 % (0/30) | 0,0 | 150 | 63 % (19/30) | 4,4 | 0 % (0/9) |
| 40 | 67 % (20/30) | 0 % (0/30) | 0,0 | 201 | 7 % (2/30) | 0,1 | 0 % (0/9) |

Écarts aux bandes (à titre d’information) : 17

- Chaton (Plume) : le bot naïf gagne 35 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 35 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 39 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 6 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 31 laisse 269 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 40 laisse 274 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 82 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 4 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 35 laisse 279 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 11 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Vieux Sage (Plume) : le bot soigneux gagne 42 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 31 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (42 %) et Charlie (0 %) sont à 42 points l'un de l'autre, il en faut au plus 10
- Matou : Pollen (19 vies) et Charlie (11,6 vies) sont à 7,4 vies l'un de l'autre, il en faut au plus 3

### Région 5 : la Ville Pestiférée

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 35 % (35/100) | 25,0 | 2768 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 33 % (33/100) | 24,5 | 2302 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 54 % (54/100) | 25,0 | 2938 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 5 % (5/100) | 19,9 | 138 | 0 % (0/30) |
| Matou | Charlie | 57 % (57/100) | 3 % (3/100) | 9,1 | 143 | 0 % (0/30) |
| Matou | Pollen | 96 % (96/100) | 14 % (14/100) | 16,7 | 178 | 0 % (0/30) |
| Vieux Sage | Plume | 36 % (36/100) | 0 % (0/100) | 4,6 | 124 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 86 | 0 % (0/30) |
| Vieux Sage | Pollen | 10 % (10/100) | 0 % (0/100) | 0,9 | 239 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | 100 % (30/30) | 3 % (1/30) | 0,7 | 108 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 42 | 100 % (30/30) | 53 % (16/30) | 9,3 | 164 | 63 % (19/30) | 7,1 | 0 % (0/9) |
| 43 | 67 % (20/30) | 3 % (1/30) | 0,1 | 146 | 7 % (2/30) | 0,7 | 0 % (0/9) |
| 44 | 100 % (30/30) | 0 % (0/30) | 0,0 | 114 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 45 | 73 % (22/30) | 7 % (2/30) | 1,1 | 153 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 46 | 83 % (25/30) | 0 % (0/30) | 0,0 | 107 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 47 | 53 % (16/30) | 0 % (0/30) | 0,0 | 67 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 48 | 100 % (30/30) | 7 % (2/30) | 0,4 | 164 | 30 % (9/30) | 4,0 | 0 % (0/9) |
| 49 | 67 % (20/30) | 0 % (0/30) | 0,0 | 120 | 27 % (8/30) | 3,1 | 0 % (0/9) |
| 50 | 100 % (30/30) | 0 % (0/30) | 0,0 | 384 | 27 % (8/30) | 3,4 | 0 % (0/9) |

Écarts aux bandes (à titre d’information) : 18

- Chaton (Plume) : le bot naïf gagne 35 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 33 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 54 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 5 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 50 laisse 283 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 57 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 3 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 50 laisse 338 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 96 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 14 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le niveau 50 laisse 532 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 36 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 10 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (36 %) et Charlie (0 %) sont à 36 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,9 vies) et Charlie (9,1 vies) sont à 10,8 vies l'un de l'autre, il en faut au plus 3
