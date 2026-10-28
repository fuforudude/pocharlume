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
- Matou (Plume) : le bot soigneux gagne 98 % des parties, il doit tout gagner
- Matou (Plume) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot naïf gagne 26 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 2 laisse 263 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Vieux Sage (Pollen) : le bot soigneux gagne 92 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Pollen (92 %) et Charlie (74 %) sont à 18 points l'un de l'autre, il en faut au plus 10
- Défi Héroïque : le bot soigneux réussit 6 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 18 % des parties, la bande est 40 % à 90 %

Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins 1 vie sur 50 % des niveaux et en laissant moins de 250 arêtes inutilisées par niveau, le naïf gagne 30 % à 70 % ;
Vieux Sage, le soigneux gagne 60 % à 85 % ; sans défense on perd. Entre dieux : en Vieux Sage, au plus 10,0 points d’écart de taux de victoire du soigneux ; en Matou, au plus 3 vies d’écart de vies moyennes du soigneux.

### Dieu × difficulté

Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins 1 vie.

| Difficulté | Dieu | Naïf : victoires | Soigneux : victoires | Bande du soigneux | Naïf : vies | Soigneux : vies | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 97 % | 100 % | — | 23,1 | 25,0 | 158 / 228 | 0/10 | 10 % |
| Chaton | Charlie | 97 % | 100 % | — | 22,7 | 25,0 | 153 / 267 | 0/10 | 3 % |
| Chaton | Pollen | 98 % | 100 % | — | 24,2 | 25,0 | 137 / 262 | 0/10 | 0 % |
| Matou | Plume | 35 % | 98 % | 100 % | 4,7 | 18,2 | 132 / 222 | 4/10 | 0 % |
| Matou | Charlie | 26 % | 100 % | 100 % | 3,6 | 17,1 | 110 / 263 | 6/10 | 0 % |
| Matou | Pollen | 39 % | 99 % | 100 % | 5,9 | 19,5 | 129 / 200 | 2/10 | 0 % |
| Vieux Sage | Plume | 9 % | 81 % | 60 % à 85 % | 0,4 | 10,0 | 102 / 211 | 6/10 | 0 % |
| Vieux Sage | Charlie | 4 % | 74 % | 60 % à 85 % | 0,3 | 8,3 | 91 / 209 | 8/10 | 0 % |
| Vieux Sage | Pollen | 14 % | 92 % | 60 % à 85 % | 1,0 | 13,0 | 97 / 256 | 4/10 | 0 % |

Bande du naïf : Chaton 100 %, Matou 30 % à 70 %. Matou : au moins 50 % des niveaux avec perte. Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

### Écarts entre dieux

| Mesure du soigneux | Plume | Charlie | Pollen | Écart maximal | Écart permis |
| --- | --- | --- | --- | --- | --- |
| Vieux Sage : taux de victoire | 81 % | 74 % | 92 % | 18,0 points | 10,0 points |
| Matou : vies moyennes | 18,2 | 17,1 | 19,5 | 2,4 vies | 3 vies |

## Plume

Héros : Plume, l’Ombre Première. Bonus de famille : Tir — PV des soldats +0 %, cadence +60 %, critique +15 points, prix +0 %. Sorts : Voile de Nuit (recharge 30 s), Griffes d’Ombre (recharge 40 s). Tour divine : Sanctuaire de l’Ombre (200 arêtes).

### Plume : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 108 / 228 | aucune / aucune | 159 / 115 | gagné 3/3 |
| 2 | 100 % (10/10) | 24,8 | 100 % (10/10) | 25,0 | 77 / 113 | 3 (0,2 vies) / aucune | 174 / 112 | perdu en 188 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 111 / 206 | aucune / aucune | 201 / 122 | perdu en 170 s |
| 4 | 100 % (10/10) | 24,9 | 100 % (10/10) | 25,0 | 84 / 200 | 3 (0,1 vies) / aucune | 227 / 142 | perdu en 175 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 88 / 108 | aucune / aucune | 224 / 178 | perdu en 99 s |
| 6 | 100 % (10/10) | 24,2 | 100 % (10/10) | 25,0 | 105 / 162 | 6 (0,3 vies) / aucune | 255 / 219 | perdu en 119 s |
| 7 | 100 % (10/10) | 23,8 | 100 % (10/10) | 25,0 | 53 / 127 | 1 (0,3 vies) / aucune | 296 / 258 | perdu en 115 s |
| 8 | 100 % (10/10) | 22,1 | 100 % (10/10) | 25,0 | 83 / 105 | 3 (2,6 vies) / aucune | 311 / 271 | perdu en 106 s |
| 9 | 80 % (8/10) | 18,8 | 100 % (10/10) | 25,0 | 89 / 132 | 3 (2,7 vies) / aucune | 312 / 302 | perdu en 98 s |
| 10 | 90 % (9/10) | 17,1 | 100 % (10/10) | 25,0 | 238 / 199 | 2 (2,8 vies) / aucune | 396 / 373 | perdu en 90 s |

### Plume : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 90 % (9/10) | 15,1 | 100 % (10/10) | 20,0 | 48 / 199 | 6 (1,5 vies) / aucune | 181 / 140 | perdu en 138 s |
| 2 | 10 % (1/10) | 1,5 | 100 % (10/10) | 20,0 | 60 / 196 | 3 (7,7 vies) / aucune | 147 / 148 | perdu en 115 s |
| 3 | 70 % (7/10) | 9,9 | 100 % (10/10) | 20,0 | 64 / 181 | 3 (3,7 vies) / aucune | 195 / 181 | perdu en 127 s |
| 4 | 80 % (8/10) | 11,0 | 100 % (10/10) | 20,0 | 57 / 72 | 3 (3,4 vies) / aucune | 216 / 192 | perdu en 100 s |
| 5 | 70 % (7/10) | 7,7 | 100 % (10/10) | 20,0 | 84 / 128 | 3 (3,7 vies) / aucune | 209 / 193 | perdu en 85 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 19,4 | 82 / 88 | 4 (9,4 vies) / 4 (0,6 vies) | 119 / 235 | perdu en 85 s |
| 7 | 0 % (0/10) | 0,0 | 90 % (9/10) | 17,7 | 85 / 75 | 3 (6,7 vies) / 7 (1,4 vies) | 132 / 267 | perdu en 90 s |
| 8 | 10 % (1/10) | 1,1 | 90 % (9/10) | 16,8 | 50 / 108 | 3 (13,6 vies) / 3 (2,7 vies) | 127 / 274 | perdu en 93 s |
| 9 | 20 % (2/10) | 0,4 | 100 % (10/10) | 18,9 | 105 / 50 | 3 (7,3 vies) / 4 (0,8 vies) | 157 / 344 | perdu en 87 s |
| 10 | 0 % (0/10) | 0,0 | 100 % (10/10) | 8,8 | 54 / 222 | 2 (10,7 vies) / 6 (7,4 vies) | 89 / 387 | perdu en 72 s |

### Plume : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 40 % (4/10) | 1,4 | 100 % (10/10) | 15,0 | 74 / 168 | 3 (4,1 vies) / aucune | 162 / 140 | perdu en 120 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 65 / 155 | 3 (7,9 vies) / aucune | 118 / 142 | perdu en 113 s |
| 3 | 10 % (1/10) | 0,6 | 100 % (10/10) | 15,0 | 58 / 211 | 3 (5,1 vies) / aucune | 144 / 180 | perdu en 109 s |
| 4 | 20 % (2/10) | 1,3 | 100 % (10/10) | 14,0 | 77 / 58 | 3 (6,1 vies) / 3 (1,0 vies) | 142 / 196 | perdu en 98 s |
| 5 | 20 % (2/10) | 0,3 | 100 % (10/10) | 15,0 | 48 / 121 | 3 (5,8 vies) / aucune | 139 / 187 | perdu en 78 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 6,0 | 70 / 109 | 2 (7,0 vies) / 5 (4,1 vies) | 102 / 238 | perdu en 80 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 11,4 | 60 / 55 | 2 (7,8 vies) / 5 (2,0 vies) | 93 / 283 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 7,9 | 91 / 66 | 3 (9,2 vies) / 3 (6,6 vies) | 93 / 300 | perdu en 91 s |
| 9 | 0 % (0/10) | 0,0 | 10 % (1/10) | 0,3 | 93 / 21 | 2 (8,6 vies) / 4 (11,7 vies) | 99 / 108 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 121 / 61 | 2 (10,0 vies) / 3 (10,0 vies) | 72 / 109 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Plume : la plus choisie, Clocher des Archers (construction) (667 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | caserne, diversité 1 | équilibrée, diversité 1 | équilibrée, diversité 1 |
| 2 | tir, diversité 1 | magie, diversité 0.4 | magie, diversité 1 |
| 3 | équilibrée, diversité 1 | tir, diversité 1 | caserne, diversité 1 |
| 4 | magie, diversité 0.4 | tir, diversité 1 | artillerie, diversité 0.4 |
| 5 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 | tir, diversité 0.4 |
| 6 | tir, diversité 0.4 | tir, diversité 1 | tir, diversité 0.4 |
| 7 | artillerie, diversité 0.4 | magie, diversité 0.4 | tir, diversité 0.4 |
| 8 | artillerie, diversité 1 | magie, diversité 1 | tir, diversité 1 |
| 9 | artillerie, diversité 0.4 | caserne, diversité 0.4 | magie, diversité 1 |
| 10 | équilibrée, diversité 1 | tir, diversité 0.4 | équilibrée, diversité 0.4 |

## Charlie

Héros : Charlie, le Colosse. Bonus de famille : Caserne — PV des soldats +25 %, cadence +0 %, critique +0 points, prix +0 %. Sorts : Chute du Colosse (recharge 40 s), Renforts (recharge 20 s). Tour divine : Totem du Colosse (200 arêtes).

### Charlie : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 93 / 225 | aucune / aucune | 160 / 131 | gagné 1/3 |
| 2 | 100 % (10/10) | 24,1 | 100 % (10/10) | 25,0 | 117 / 78 | 2 (0,4 vies) / aucune | 174 / 116 | perdu en 180 s |
| 3 | 100 % (10/10) | 24,9 | 100 % (10/10) | 25,0 | 120 / 249 | 3 (0,1 vies) / aucune | 201 / 157 | perdu en 217 s |
| 4 | 100 % (10/10) | 24,9 | 100 % (10/10) | 25,0 | 82 / 103 | 2 (0,1 vies) / aucune | 228 / 168 | perdu en 198 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 88 / 88 | aucune / aucune | 225 / 183 | perdu en 115 s |
| 6 | 100 % (10/10) | 23,8 | 100 % (10/10) | 25,0 | 89 / 117 | 6 (0,5 vies) / aucune | 256 / 218 | perdu en 131 s |
| 7 | 100 % (10/10) | 22,6 | 100 % (10/10) | 25,0 | 69 / 46 | 4 (0,8 vies) / aucune | 297 / 259 | perdu en 119 s |
| 8 | 100 % (10/10) | 21,9 | 100 % (10/10) | 25,0 | 78 / 188 | 3 (2,6 vies) / aucune | 313 / 284 | perdu en 128 s |
| 9 | 80 % (8/10) | 18,4 | 100 % (10/10) | 25,0 | 99 / 165 | 3 (2,6 vies) / aucune | 312 / 328 | perdu en 98 s |
| 10 | 90 % (9/10) | 16,2 | 100 % (10/10) | 24,7 | 262 / 267 | 2 (2,7 vies) / 6 (0,3 vies) | 399 / 382 | perdu en 90 s |

### Charlie : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 70 % (7/10) | 12,5 | 100 % (10/10) | 15,0 | 70 / 75 | 4 (2,4 vies) / 4 (5,0 vies) | 170 / 134 | perdu en 121 s |
| 2 | 10 % (1/10) | 1,4 | 100 % (10/10) | 20,0 | 66 / 263 | 3 (8,0 vies) / aucune | 136 / 121 | perdu en 113 s |
| 3 | 60 % (6/10) | 6,4 | 100 % (10/10) | 20,0 | 82 / 188 | 3 (4,0 vies) / aucune | 188 / 180 | perdu en 109 s |
| 4 | 50 % (5/10) | 6,3 | 100 % (10/10) | 20,0 | 85 / 119 | 3 (5,9 vies) / aucune | 192 / 208 | perdu en 98 s |
| 5 | 60 % (6/10) | 8,6 | 100 % (10/10) | 16,5 | 107 / 56 | 3 (3,5 vies) / 4 (2,8 vies) | 209 / 197 | perdu en 84 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 17,9 | 60 / 75 | 4 (7,1 vies) / 4 (2,0 vies) | 114 / 229 | perdu en 82 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,9 | 80 / 69 | 3 (6,1 vies) / 5 (3,3 vies) | 124 / 282 | perdu en 89 s |
| 8 | 10 % (1/10) | 0,9 | 100 % (10/10) | 19,7 | 63 / 48 | 3 (13,9 vies) / 3 (0,2 vies) | 128 / 298 | perdu en 92 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,4 | 117 / 59 | 2 (7,6 vies) / 4 (2,1 vies) | 111 / 345 | perdu en 87 s |
| 10 | 0 % (0/10) | 0,0 | 100 % (10/10) | 12,6 | 69 / 147 | 2 (11,3 vies) / 2 (2,7 vies) | 85 / 472 | perdu en 66 s |

### Charlie : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 % (1/10) | 1,1 | 100 % (10/10) | 12,1 | 95 / 55 | 3 (5,9 vies) / 4 (2,9 vies) | 143 / 140 | perdu en 119 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 75 / 209 | 2 (8,1 vies) / aucune | 116 / 129 | perdu en 107 s |
| 3 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 70 / 181 | 3 (6,1 vies) / aucune | 120 / 176 | perdu en 108 s |
| 4 | 10 % (1/10) | 0,4 | 90 % (9/10) | 8,1 | 71 / 46 | 3 (6,4 vies) / 6 (5,1 vies) | 130 / 207 | perdu en 97 s |
| 5 | 20 % (2/10) | 1,2 | 100 % (10/10) | 12,1 | 71 / 44 | 3 (5,5 vies) / 4 (2,0 vies) | 131 / 192 | perdu en 70 s |
| 6 | 0 % (0/10) | 0,0 | 40 % (4/10) | 3,8 | 85 / 84 | 2 (6,7 vies) / 7 (6,0 vies) | 101 / 208 | perdu en 79 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 5,5 | 44 / 49 | 2 (7,9 vies) / 7 (5,7 vies) | 87 / 281 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 10,8 | 86 / 57 | 3 (9,8 vies) / 3 (3,5 vies) | 93 / 297 | perdu en 91 s |
| 9 | 0 % (0/10) | 0,0 | 10 % (1/10) | 0,7 | 99 / 100 | 2 (8,4 vies) / 5 (7,9 vies) | 98 / 168 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 97 / 80 | 2 (9,6 vies) / 3 (6,0 vies) | 70 / 241 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Charlie : la plus choisie, Grenier des Griffes (construction) (536 fois) ; la moins choisie, Mortier de Soufre (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | magie, diversité 0.4 | équilibrée, diversité 0.4 | équilibrée, diversité 0.4 |
| 2 | caserne, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 1 |
| 3 | magie, diversité 1 | artillerie, diversité 0.4 | tir, diversité 0.4 |
| 4 | magie, diversité 0.4 | tir, diversité 0.4 | caserne, diversité 0.4 |
| 5 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 6 | caserne, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 7 | artillerie, diversité 1 | équilibrée, diversité 0.4 | caserne, diversité 0.4 |
| 8 | magie, diversité 1 | artillerie, diversité 1 | magie, diversité 0.4 |
| 9 | tir, diversité 0.4 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 |
| 10 | artillerie, diversité 1 | magie, diversité 0.4 | équilibrée, diversité 0.4 |

## Pollen

Héros : Pollen, Trois-Pattes. Bonus de famille : Artillerie — PV des soldats +0 %, cadence +15 %, critique +0 points, prix −10 %. Sorts : Pièges à Ressort (recharge 30 s), Ingéniosité (recharge 50 s). Tour divine : Atelier Boiteux (200 arêtes).

### Pollen : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 71 / 96 | aucune / aucune | 163 / 127 | perdu en 176 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 96 / 153 | aucune / aucune | 173 / 125 | perdu en 156 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 96 / 86 | aucune / aucune | 200 / 161 | perdu en 193 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 100 / 233 | aucune / aucune | 227 / 195 | perdu en 191 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 84 / 59 | aucune / aucune | 224 / 190 | perdu en 131 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 91 / 121 | aucune / aucune | 255 / 223 | perdu en 120 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 59 / 171 | aucune / aucune | 296 / 273 | perdu en 141 s |
| 8 | 100 % (10/10) | 24,2 | 100 % (10/10) | 25,0 | 50 / 87 | 3 (0,8 vies) / aucune | 311 / 284 | perdu en 124 s |
| 9 | 80 % (8/10) | 18,5 | 100 % (10/10) | 25,0 | 87 / 102 | 3 (2,9 vies) / aucune | 312 / 309 | perdu en 98 s |
| 10 | 100 % (10/10) | 24,6 | 100 % (10/10) | 25,0 | 243 / 262 | 2 (0,4 vies) / aucune | 430 / 361 | perdu en 128 s |

### Pollen : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 50 % (5/10) | 7,4 | 100 % (10/10) | 19,5 | 71 / 163 | 4 (4,2 vies) / 6 (0,5 vies) | 168 / 154 | perdu en 139 s |
| 2 | 30 % (3/10) | 5,0 | 100 % (10/10) | 18,7 | 78 / 75 | 4 (7,3 vies) / 5 (1,3 vies) | 157 / 165 | perdu en 115 s |
| 3 | 60 % (6/10) | 8,4 | 90 % (9/10) | 17,5 | 62 / 151 | 5 (5,5 vies) / 5 (1,5 vies) | 204 / 177 | perdu en 137 s |
| 4 | 70 % (7/10) | 13,8 | 100 % (10/10) | 20,0 | 70 / 74 | 4 (2,7 vies) / aucune | 216 / 208 | perdu en 126 s |
| 5 | 70 % (7/10) | 13,3 | 100 % (10/10) | 20,0 | 89 / 116 | 4 (3,3 vies) / aucune | 214 / 198 | perdu en 111 s |
| 6 | 20 % (2/10) | 2,2 | 100 % (10/10) | 20,0 | 83 / 146 | 4 (10,1 vies) / aucune | 153 / 234 | perdu en 115 s |
| 7 | 40 % (4/10) | 6,2 | 100 % (10/10) | 19,9 | 74 / 200 | 5 (6,7 vies) / 6 (0,1 vies) | 224 / 277 | perdu en 111 s |
| 8 | 20 % (2/10) | 0,3 | 100 % (10/10) | 19,7 | 58 / 86 | 3 (17,1 vies) / 3 (0,3 vies) | 162 / 297 | perdu en 94 s |
| 9 | 10 % (1/10) | 1,4 | 100 % (10/10) | 19,9 | 59 / 104 | 2 (6,2 vies) / 4 (0,1 vies) | 139 / 345 | perdu en 97 s |
| 10 | 20 % (2/10) | 1,0 | 100 % (10/10) | 19,4 | 36 / 175 | 4 (7,1 vies) / 8 (0,4 vies) | 219 / 416 | perdu en 84 s |

### Pollen : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 20 % (2/10) | 3,0 | 93 / 87 | 3 (6,0 vies) / 6 (10,9 vies) | 152 / 153 | perdu en 121 s |
| 2 | 10 % (1/10) | 0,3 | 100 % (10/10) | 15,0 | 71 / 71 | 3 (10,3 vies) / aucune | 129 / 152 | perdu en 114 s |
| 3 | 40 % (4/10) | 2,5 | 100 % (10/10) | 11,7 | 80 / 42 | 3 (4,2 vies) / 7 (1,9 vies) | 173 / 204 | perdu en 127 s |
| 4 | 50 % (5/10) | 4,4 | 100 % (10/10) | 15,0 | 75 / 63 | 3 (4,2 vies) / aucune | 187 / 215 | perdu en 101 s |
| 5 | 20 % (2/10) | 0,8 | 100 % (10/10) | 15,0 | 92 / 155 | 4 (5,5 vies) / aucune | 182 / 197 | perdu en 88 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,0 | 65 / 57 | 4 (9,3 vies) / 5 (0,7 vies) | 118 / 239 | perdu en 82 s |
| 7 | 20 % (2/10) | 2,1 | 100 % (10/10) | 15,0 | 71 / 56 | 4 (3,9 vies) / aucune | 174 / 272 | perdu en 100 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 11,6 | 87 / 85 | 3 (15,0 vies) / 3 (2,9 vies) | 94 / 295 | perdu en 93 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,6 | 109 / 103 | 2 (6,9 vies) / 4 (0,4 vies) | 107 / 341 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 71 / 256 | 2 (6,2 vies) / aucune | 101 / 448 | perdu en 77 s |

Tours choisies par le soigneux en Matou avec Pollen : la plus choisie, Catapulte du Rempart (construction) (633 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | équilibrée, diversité 0.4 | caserne, diversité 1 | tir, diversité 1 |
| 2 | caserne, diversité 0.4 | caserne, diversité 0.4 | artillerie, diversité 0.4 |
| 3 | équilibrée, diversité 1 | magie, diversité 1 | artillerie, diversité 1 |
| 4 | caserne, diversité 1 | magie, diversité 0.4 | tir, diversité 0.4 |
| 5 | magie, diversité 0.4 | équilibrée, diversité 0.4 | tir, diversité 0.4 |
| 6 | caserne, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 7 | tir, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 1 |
| 8 | tir, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 1 |
| 9 | tir, diversité 0.4 | magie, diversité 0.4 | artillerie, diversité 0.4 |
| 10 | magie, diversité 0.4 | magie, diversité 1 | artillerie, diversité 0.4 |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus -0,3) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.

| Dieu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Corrélation de rang | Niveau le plus dur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | 15,1 | 1,5 | 9,9 | 11,0 | 7,7 | 0,0 | 0,0 | 1,1 | 0,4 | 0,0 | -0,8 | 6 (0,0 vies) |
| Charlie | 12,5 | 1,4 | 6,4 | 6,3 | 8,6 | 0,0 | 0,0 | 0,9 | 0,0 | 0,0 | -0,8 | 6 (0,0 vies) |
| Pollen | 7,4 | 5,0 | 8,4 | 13,8 | 13,3 | 2,2 | 6,2 | 0,3 | 1,4 | 1,0 | -0,7 | 8 (0,3 vies) |
| **Moyenne des dieux** | 11,7 | 2,6 | 8,2 | 10,4 | 9,9 | 0,7 | 2,1 | 0,8 | 0,6 | 0,3 | -0,9 | 10 (0,3 vies) |

Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).

## Usage des sorts par le soigneux

Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).

| Dieu | Sort | Recharge | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- | --- | --- |
| Plume | Voile de Nuit | 30 s | 3,1 sur 7,1 (44 %) | 5,7 sur 7,9 (72 %) | 4,9 sur 6,4 (77 %) |
| Plume | Griffes d’Ombre | 40 s | 5,1 sur 5,2 (98 %) | 6,0 sur 6,1 (98 %) | 4,9 sur 4,9 (100 %) |
| Charlie | Chute du Colosse | 40 s | 5,8 sur 5,9 (99 %) | 6,4 sur 6,4 (100 %) | 5,4 sur 5,4 (100 %) |
| Charlie | Renforts | 20 s | 7,5 sur 11,7 (64 %) | 10,3 sur 12,8 (80 %) | 9,1 sur 10,7 (85 %) |
| Pollen | Pièges à Ressort | 30 s | 6,0 sur 7,7 (78 %) | 7,3 sur 8,4 (87 %) | 7,3 sur 8,5 (86 %) |
| Pollen | Ingéniosité | 50 s | 3,1 sur 4,7 (66 %) | 4,2 sur 5,1 (83 %) | 4,2 sur 5,1 (82 %) |

## Tours divines

Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 200 arêtes avant la fin du niveau).
Sans tour divine : le même soigneux, mêmes graines, dépense ces 200 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.

| Dieu | Tour divine | Difficulté | Construite | Avec : victoires / vies | Sans : victoires / vies | Gain de la tour divine |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | Matou | 86 % | 98 % / 18,2 | 100 % / 18,3 | −2 points / −0,1 vies |
| Plume | Sanctuaire de l’Ombre | Vieux Sage | 57 % | 81 % / 10,0 | 79 % / 10,3 | +2 points / −0,3 vies |
| Charlie | Totem du Colosse | Matou | 70 % | 100 % / 17,1 | 100 % / 17,5 | +0 points / −0,4 vies |
| Charlie | Totem du Colosse | Vieux Sage | 66 % | 74 % / 8,3 | 86 % / 9,9 | −12 points / −1,6 vies |
| Pollen | Atelier Boiteux | Matou | 90 % | 99 % / 19,5 | 100 % / 19,4 | −1 points / +0,1 vies |
| Pollen | Atelier Boiteux | Vieux Sage | 88 % | 92 % / 13,0 | 97 % / 12,6 | −5 points / +0,3 vies |

Puissance par la formule des tours communes (DPS efficace moyen × portée ÷ coût), comptant en plus l’onde du Totem (cibles d’une zone d’une tuile de rayon) et les tourelles et pièges de l’Atelier ; elle ne chiffre ni l’étourdissement du Totem, ni les assassins non ciblables du Sanctuaire, ni l’immobilisation des pièges, ce qui explique que les tours divines ressortent en dessous des tours communes de coût voisin alors que le test de partie montre leur effet.

| Dieu | Tour divine | Coût | Puissance (formule) | Tours communes de coût voisin | Puissance moyenne de ces tours | Rapport |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | 200 | 1,1 | Grenier des Griffes (palier 2, coût cumulé 180), Clocher des Archers (palier 2, coût cumulé 180), Autel des Cendres (palier 2, coût cumulé 260) | 0,2 | ×7,0 |
| Charlie | Totem du Colosse | 200 | 0,1 | Grenier des Griffes (palier 2, coût cumulé 180), Clocher des Archers (palier 2, coût cumulé 180), Autel des Cendres (palier 2, coût cumulé 260) | 0,2 | ×0,4 |
| Pollen | Atelier Boiteux | 200 | 0,6 | Grenier des Griffes (palier 2, coût cumulé 180), Clocher des Archers (palier 2, coût cumulé 180), Autel des Cendres (palier 2, coût cumulé 260) | 0,2 | ×4,1 |

## Disciples comparés à leur avatar (Matou)

Chaque disciple est joué au niveau 1 avec son dieu (sans amélioration ni objet), dans les 10 niveaux de Matou. Écart : vies restantes moyennes du soigneux, disciple moins avatar (au plus 3 vies d’écart, en plus ou en moins).

| Dieu | Héros | Rôle | Soigneux : victoires | Soigneux : vies | Écart à l’avatar | Naïf : victoires | Naïf : vies | Écart à l’avatar (naïf) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | Plume, l’Ombre Première (avatar) | Duelliste, esquive et critiques | 98 % | 18,2 | — | 35 % | 4,7 | — |
| Plume | Suie | Assassin, exécute les blessés | 98 % | 17,9 | −0,2 vies | 17 % | 1,5 | −3,1 vies |
| Plume | Corbeau | Tireur, perce l’armure | 100 % | 19,8 | +1,7 vies | 33 % | 4,3 | −0,4 vies |
| Charlie | Charlie, le Colosse (avatar) | Tank, frappe de zone qui étourdit | 100 % | 17,1 | — | 26 % | 3,6 | — |
| Charlie | Mastoc | Provocation, bloque trois ennemis | 98 % | 16,7 | −0,4 vies | 19 % | 2,4 | −1,3 vies |
| Charlie | Brise-Os | Berserker, plus fort blessé | 99 % | 16,7 | −0,4 vies | 24 % | 3,2 | −0,4 vies |
| Pollen | Pollen, Trois-Pattes (avatar) | Pose des pièges, tire à la fronde | 99 % | 19,5 | — | 39 % | 5,9 | — |
| Pollen | Rouage | Ingénieur, construit une tourelle | 100 % | 19,9 | +0,5 vies | 39 % | 6,1 | +0,1 vies |
| Pollen | Lanterne | Soigneur, magie à distance | 100 % | 19,7 | +0,2 vies | 45 % | 6,4 | +0,5 vies |

## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)

L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.
La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.

| Dieu | Bot | De base | Arbre au maximum | Héros niveau 10 | Tout au maximum |
| --- | --- | --- | --- | --- | --- |
| Plume | Soigneux | 81 % / 10,0 | 92 % / 11,6 | 86 % / 11,3 | 97 % / 12,9 |
| Plume | Naïf | 9 % / 0,4 | 14 % / 1,2 | 28 % / 3,1 | 32 % / 3,8 |
| Charlie | Soigneux | 74 % / 8,3 | 88 % / 10,9 | 83 % / 10,6 | 93 % / 12,4 |
| Charlie | Naïf | 4 % / 0,3 | 11 % / 0,8 | 20 % / 1,6 | 26 % / 2,3 |
| Pollen | Soigneux | 92 % / 13,0 | 100 % / 13,7 | 99 % / 14,2 | 99 % / 14,3 |
| Pollen | Naïf | 14 % / 1,0 | 21 % / 2,0 | 26 % / 3,0 | 32 % / 3,7 |

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

## Régions 2 à 5

Les bandes de la région 1 (plus haut) s’appliquent à chacune des régions 2 à 5, pour les trois dieux : mêmes bots, mêmes graines, mêmes difficultés, courbe de difficulté jugée sur la moyenne des dieux, écart entre dieux comme au jalon 2. Un écart fait échouer `npm run balance` comme ceux de la région 1.

### Région 2 : les Champs Brûlés

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 92 % (92/100) | 24,9 | 178 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 84 % (84/100) | 23,6 | 143 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 24,8 | 149 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 15 % (15/100) | 20,0 | 170 | 0 % (0/30) |
| Matou | Charlie | 40 % (40/100) | 3 % (3/100) | 5,8 | 115 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 53 % (53/100) | 18,1 | 150 | 0 % (0/30) |
| Vieux Sage | Plume | 69 % (69/100) | 0 % (0/100) | 8,5 | 127 | 0 % (0/30) |
| Vieux Sage | Charlie | 10 % (10/100) | 0 % (0/100) | 1,5 | 72 | 0 % (0/30) |
| Vieux Sage | Pollen | 20 % (20/100) | 2 % (2/100) | 2,4 | 120 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 100 % (30/30) | 30 % (9/30) | 4,6 | 76 | 93 % (28/30) | 14,0 | 0 % (0/9) |
| 12 | 67 % (20/30) | 3 % (1/30) | 0,5 | 148 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 13 | 100 % (30/30) | 40 % (12/30) | 5,2 | 194 | 20 % (6/30) | 1,7 | 0 % (0/9) |
| 14 | 67 % (20/30) | 17 % (5/30) | 1,3 | 94 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 15 | 67 % (20/30) | 30 % (9/30) | 4,5 | 203 | 30 % (9/30) | 3,6 | 0 % (0/9) |
| 16 | 67 % (20/30) | 10 % (3/30) | 0,8 | 69 | 20 % (6/30) | 1,0 | 0 % (0/9) |
| 17 | 67 % (20/30) | 23 % (7/30) | 2,3 | 122 | 33 % (10/30) | 4,6 | 0 % (0/9) |
| 18 | 100 % (30/30) | 33 % (10/30) | 4,7 | 171 | 67 % (20/30) | 6,5 | 0 % (0/9) |
| 19 | 67 % (20/30) | 33 % (10/30) | 4,0 | 114 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 20 | 100 % (30/30) | 17 % (5/30) | 1,9 | 260 | 33 % (10/30) | 5,0 | 0 % (0/9) |

Écarts aux bandes : 22

- Chaton (Plume) : le bot naïf gagne 92 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 84 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 15 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 20 laisse 261 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 40 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 3 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 13 laisse 273 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 20 laisse 264 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 15 laisse 257 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 20 laisse 254 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou : le niveau 20 (1,9 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 10 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 20 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (69 %) et Charlie (10 %) sont à 59 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (20 vies) et Charlie (5,8 vies) sont à 14,2 vies l'un de l'autre, il en faut au plus 3
- Défi Héroïque : le bot soigneux réussit 5.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 8.7 % des parties, la bande est 40 % à 90 %

### Région 3 : le Bourg des Bûchers

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 28 % (28/100) | 25,0 | 1324 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 28 % (28/100) | 25,0 | 1140 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 33 % (33/100) | 24,8 | 1407 | 0 % (0/30) |
| Matou | Plume | 99 % (99/100) | 1 % (1/100) | 19,1 | 177 | 0 % (0/30) |
| Matou | Charlie | 62 % (62/100) | 0 % (0/100) | 7,3 | 118 | 0 % (0/30) |
| Matou | Pollen | 97 % (97/100) | 2 % (2/100) | 16,3 | 136 | 0 % (0/30) |
| Vieux Sage | Plume | 77 % (77/100) | 0 % (0/100) | 9,5 | 131 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 87 | 0 % (0/30) |
| Vieux Sage | Pollen | 2 % (2/100) | 0 % (0/100) | 0,1 | 108 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 97 % (29/30) | 3 % (1/30) | 0,4 | 88 | 27 % (8/30) | 4,0 | 0 % (0/9) |
| 22 | 80 % (24/30) | 0 % (0/30) | 0,0 | 87 | 20 % (6/30) | 2,1 | 0 % (0/9) |
| 23 | 100 % (30/30) | 0 % (0/30) | 0,0 | 146 | 30 % (9/30) | 4,0 | 0 % (0/9) |
| 24 | 100 % (30/30) | 0 % (0/30) | 0,0 | 177 | 33 % (10/30) | 3,6 | 0 % (0/9) |
| 25 | 100 % (30/30) | 7 % (2/30) | 0,3 | 218 | 40 % (12/30) | 5,0 | 0 % (0/9) |
| 26 | 57 % (17/30) | 0 % (0/30) | 0,0 | 156 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 27 | 97 % (29/30) | 0 % (0/30) | 0,0 | 124 | 27 % (8/30) | 3,2 | 0 % (0/9) |
| 28 | 67 % (20/30) | 0 % (0/30) | 0,0 | 109 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 29 | 97 % (29/30) | 0 % (0/30) | 0,0 | 129 | 27 % (8/30) | 2,3 | 0 % (0/9) |
| 30 | 67 % (20/30) | 0 % (0/30) | 0,0 | 203 | 27 % (8/30) | 2,7 | 0 % (0/9) |

Écarts aux bandes : 22

- Chaton (Plume) : le bot naïf gagne 28 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 28 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 33 % des parties, il doit tout gagner
- Matou (Plume) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 1 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 25 laisse 273 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 26 laisse 259 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 30 laisse 302 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 62 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 0 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux gagne 97 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 2 % des parties, la bande est 30 % à 70 %
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,5, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 2 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (77 %) et Charlie (0 %) sont à 77 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,1 vies) et Charlie (7,3 vies) sont à 11,8 vies l'un de l'autre, il en faut au plus 3
- Défi Héroïque : le bot soigneux réussit 0 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 13.7 % des parties, la bande est 40 % à 90 %

### Région 4 : les Marais de l’Ordalie

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 34 % (34/100) | 25,0 | 1293 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 34 % (34/100) | 24,9 | 952 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 39 % (39/100) | 25,0 | 1603 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 4 % (4/100) | 19,9 | 146 | 0 % (0/30) |
| Matou | Charlie | 94 % (94/100) | 4 % (4/100) | 10,9 | 120 | 0 % (0/30) |
| Matou | Pollen | 90 % (90/100) | 9 % (9/100) | 16,1 | 124 | 0 % (0/30) |
| Vieux Sage | Plume | 68 % (68/100) | 0 % (0/100) | 8,1 | 137 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 98 | 0 % (0/30) |
| Vieux Sage | Pollen | 10 % (10/100) | 0 % (0/100) | 0,7 | 102 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 100 % (30/30) | 20 % (6/30) | 2,3 | 69 | 10 % (3/30) | 1,2 | 0 % (0/9) |
| 32 | 100 % (30/30) | 23 % (7/30) | 2,8 | 124 | 27 % (8/30) | 2,9 | 0 % (0/9) |
| 33 | 100 % (30/30) | 7 % (2/30) | 1,1 | 128 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 34 | 100 % (30/30) | 0 % (0/30) | 0,0 | 163 | 23 % (7/30) | 1,6 | 0 % (0/9) |
| 35 | 100 % (30/30) | 7 % (2/30) | 0,5 | 177 | 50 % (15/30) | 5,7 | 0 % (0/9) |
| 36 | 100 % (30/30) | 0 % (0/30) | 0,0 | 104 | 33 % (10/30) | 4,8 | 0 % (0/9) |
| 37 | 100 % (30/30) | 0 % (0/30) | 0,0 | 108 | 43 % (13/30) | 5,8 | 0 % (0/9) |
| 38 | 60 % (18/30) | 0 % (0/30) | 0,0 | 81 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 39 | 90 % (27/30) | 0 % (0/30) | 0,0 | 136 | 40 % (12/30) | 3,3 | 0 % (0/9) |
| 40 | 97 % (29/30) | 0 % (0/30) | 0,0 | 212 | 33 % (10/30) | 4,2 | 0 % (0/9) |

Écarts aux bandes : 16

- Chaton (Plume) : le bot naïf gagne 34 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 34 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 39 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 4 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 94 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 4 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 9 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le niveau 40 laisse 270 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 10 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (68 %) et Charlie (0 %) sont à 68 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,9 vies) et Charlie (10,9 vies) sont à 9 vies l'un de l'autre, il en faut au plus 3
- Défi Héroïque : le bot soigneux réussit 2.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 19.3 % des parties, la bande est 40 % à 90 %

### Région 5 : la Ville Pestiférée

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 32 % (32/100) | 25,0 | 3080 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 29 % (29/100) | 24,8 | 2761 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 53 % (53/100) | 25,0 | 3321 | 0 % (0/30) |
| Matou | Plume | 99 % (99/100) | 6 % (6/100) | 19,6 | 190 | 0 % (0/30) |
| Matou | Charlie | 60 % (60/100) | 3 % (3/100) | 9,9 | 99 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 14 % (14/100) | 18,2 | 255 | 0 % (0/30) |
| Vieux Sage | Plume | 36 % (36/100) | 0 % (0/100) | 4,5 | 243 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 88 | 0 % (0/30) |
| Vieux Sage | Pollen | 9 % (9/100) | 0 % (0/100) | 1,1 | 317 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | 100 % (30/30) | 3 % (1/30) | 0,7 | 93 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 42 | 100 % (30/30) | 57 % (17/30) | 9,6 | 118 | 23 % (7/30) | 2,8 | 0 % (0/9) |
| 43 | 67 % (20/30) | 0 % (0/30) | 0,0 | 174 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 44 | 100 % (30/30) | 0 % (0/30) | 0,0 | 148 | 7 % (2/30) | 0,3 | 0 % (0/9) |
| 45 | 67 % (20/30) | 7 % (2/30) | 0,9 | 171 | 3 % (1/30) | 0,4 | 0 % (0/9) |
| 46 | 100 % (30/30) | 0 % (0/30) | 0,0 | 106 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 47 | 63 % (19/30) | 0 % (0/30) | 0,0 | 82 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 48 | 100 % (30/30) | 3 % (1/30) | 0,2 | 135 | 23 % (7/30) | 3,3 | 0 % (0/9) |
| 49 | 67 % (20/30) | 0 % (0/30) | 0,0 | 155 | 33 % (10/30) | 3,9 | 0 % (0/9) |
| 50 | 100 % (30/30) | 7 % (2/30) | 0,9 | 633 | 60 % (18/30) | 7,8 | 0 % (0/9) |

Écarts aux bandes : 24

- Chaton (Plume) : le bot naïf gagne 32 % des parties, il doit tout gagner
- Chaton (Charlie) : le bot naïf gagne 29 % des parties, il doit tout gagner
- Chaton (Pollen) : le bot naïf gagne 53 % des parties, il doit tout gagner
- Matou (Plume) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 6 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 45 laisse 293 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 50 laisse 323 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 60 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 3 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 50 laisse 332 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 14 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 50 laisse 1244 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,2, elle doit être d'au plus -0,6
- Matou : le niveau 50 (0,9 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 36 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 9 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (36 %) et Charlie (0 %) sont à 36 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,6 vies) et Charlie (9,9 vies) sont à 9,7 vies l'un de l'autre, il en faut au plus 3
- Défi Héroïque : le bot soigneux réussit 0 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 13.7 % des parties, la bande est 40 % à 90 %

## Défis, régions 1 à 5

Le bot soigneux joue les défis avec les règles de Matou, sans objet ni amélioration : Héroïque (1 vie, groupes d’élite) et Fer (toutes les vagues en une, deux familles de tours). Il cherche sa variante sur les graines d’entraînement du défi lui-même, puis joue les dix graines d’évaluation. Bande : entre 40 et 90 % de réussites pour chaque défi de chaque région, trois dieux confondus.

### Région 1 : le Village Affamé

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 18 % (18/100) | 0,2 |
| Héroïque | Charlie | 0 % (0/100) | 0,0 |
| Héroïque | Pollen | 0 % (0/100) | 0,0 |
| Héroïque | les trois | 6 % (18/300) | 0,1 |
| Fer | Plume | 22 % (22/100) | 2,9 |
| Fer | Charlie | 28 % (28/100) | 5,5 |
| Fer | Pollen | 4 % (4/100) | 0,5 |
| Fer | les trois | 18 % (54/300) | 3,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 1 | 20 % (6/30) | 63 % (19/30) |
| 2 | 17 % (5/30) | 43 % (13/30) |
| 3 | 0 % (0/30) | 73 % (22/30) |
| 4 | 0 % (0/30) | 0 % (0/30) |
| 5 | 23 % (7/30) | 0 % (0/30) |
| 6 | 0 % (0/30) | 0 % (0/30) |
| 7 | 0 % (0/30) | 0 % (0/30) |
| 8 | 0 % (0/30) | 0 % (0/30) |
| 9 | 0 % (0/30) | 0 % (0/30) |
| 10 | 0 % (0/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 6 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 18 % des parties, la bande est 40 % à 90 %

### Région 2 : les Champs Brûlés

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 11 % (11/100) | 0,1 |
| Héroïque | Charlie | 0 % (0/100) | 0,0 |
| Héroïque | Pollen | 5 % (5/100) | 0,1 |
| Héroïque | les trois | 5 % (16/300) | 0,1 |
| Fer | Plume | 10 % (10/100) | 2,0 |
| Fer | Charlie | 10 % (10/100) | 2,0 |
| Fer | Pollen | 6 % (6/100) | 1,2 |
| Fer | les trois | 9 % (26/300) | 1,7 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 11 | 43 % (13/30) | 87 % (26/30) |
| 12 | 3 % (1/30) | 0 % (0/30) |
| 13 | 0 % (0/30) | 0 % (0/30) |
| 14 | 0 % (0/30) | 0 % (0/30) |
| 15 | 0 % (0/30) | 0 % (0/30) |
| 16 | 0 % (0/30) | 0 % (0/30) |
| 17 | 0 % (0/30) | 0 % (0/30) |
| 18 | 0 % (0/30) | 0 % (0/30) |
| 19 | 0 % (0/30) | 0 % (0/30) |
| 20 | 7 % (2/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 5.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 8.7 % des parties, la bande est 40 % à 90 %

### Région 3 : le Bourg des Bûchers

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 0 % (0/100) | 0,0 |
| Héroïque | Charlie | 0 % (0/100) | 0,0 |
| Héroïque | Pollen | 0 % (0/100) | 0,0 |
| Héroïque | les trois | 0 % (0/300) | 0,0 |
| Fer | Plume | 19 % (19/100) | 3,8 |
| Fer | Charlie | 12 % (12/100) | 2,3 |
| Fer | Pollen | 10 % (10/100) | 2,0 |
| Fer | les trois | 14 % (41/300) | 2,7 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 21 | 0 % (0/30) | 100 % (30/30) |
| 22 | 0 % (0/30) | 37 % (11/30) |
| 23 | 0 % (0/30) | 0 % (0/30) |
| 24 | 0 % (0/30) | 0 % (0/30) |
| 25 | 0 % (0/30) | 0 % (0/30) |
| 26 | 0 % (0/30) | 0 % (0/30) |
| 27 | 0 % (0/30) | 0 % (0/30) |
| 28 | 0 % (0/30) | 0 % (0/30) |
| 29 | 0 % (0/30) | 0 % (0/30) |
| 30 | 0 % (0/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 0 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 13.7 % des parties, la bande est 40 % à 90 %

### Région 4 : les Marais de l’Ordalie

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 7 % (7/100) | 0,1 |
| Héroïque | Charlie | 0 % (0/100) | 0,0 |
| Héroïque | Pollen | 0 % (0/100) | 0,0 |
| Héroïque | les trois | 2 % (7/300) | 0,0 |
| Fer | Plume | 20 % (20/100) | 3,9 |
| Fer | Charlie | 20 % (20/100) | 4,0 |
| Fer | Pollen | 18 % (18/100) | 3,6 |
| Fer | les trois | 19 % (58/300) | 3,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 31 | 0 % (0/30) | 93 % (28/30) |
| 32 | 0 % (0/30) | 100 % (30/30) |
| 33 | 0 % (0/30) | 0 % (0/30) |
| 34 | 0 % (0/30) | 0 % (0/30) |
| 35 | 23 % (7/30) | 0 % (0/30) |
| 36 | 0 % (0/30) | 0 % (0/30) |
| 37 | 0 % (0/30) | 0 % (0/30) |
| 38 | 0 % (0/30) | 0 % (0/30) |
| 39 | 0 % (0/30) | 0 % (0/30) |
| 40 | 0 % (0/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 2.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 19.3 % des parties, la bande est 40 % à 90 %

### Région 5 : la Ville Pestiférée

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 0 % (0/100) | 0,0 |
| Héroïque | Charlie | 0 % (0/100) | 0,0 |
| Héroïque | Pollen | 0 % (0/100) | 0,0 |
| Héroïque | les trois | 0 % (0/300) | 0,0 |
| Fer | Plume | 7 % (7/100) | 1,2 |
| Fer | Charlie | 17 % (17/100) | 3,1 |
| Fer | Pollen | 17 % (17/100) | 3,2 |
| Fer | les trois | 14 % (41/300) | 2,5 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 41 | 0 % (0/30) | 70 % (21/30) |
| 42 | 0 % (0/30) | 67 % (20/30) |
| 43 | 0 % (0/30) | 0 % (0/30) |
| 44 | 0 % (0/30) | 0 % (0/30) |
| 45 | 0 % (0/30) | 0 % (0/30) |
| 46 | 0 % (0/30) | 0 % (0/30) |
| 47 | 0 % (0/30) | 0 % (0/30) |
| 48 | 0 % (0/30) | 0 % (0/30) |
| 49 | 0 % (0/30) | 0 % (0/30) |
| 50 | 0 % (0/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 0 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 13.7 % des parties, la bande est 40 % à 90 %
