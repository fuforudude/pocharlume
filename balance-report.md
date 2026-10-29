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

**15 écart(s)** (bandes suspendues le temps de l’équilibrage qui suit la pose libre des tours : à titre d’information) :

- Matou (Charlie) : le bot naïf gagne 99 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le bot naïf gagne 71 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,3, elle doit être d'au plus -0,6
- Matou : le niveau 10 (17 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 90 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Charlie (90 %) et Plume (65 %) sont à 25 points l'un de l'autre, il en faut au plus 10
- Sans défense (Charlie) : le niveau 2 est gagné 3 fois sur 3 en chaton
- Sans défense (Charlie) : le niveau 3 est gagné 3 fois sur 3 en chaton
- Sans défense (Charlie) : le niveau 4 est gagné 3 fois sur 3 en chaton
- Défi Héroïque : le bot soigneux réussit 18.7 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 14.3 % des parties, la bande est 40 % à 90 %

Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins 1 vie sur 50 % des niveaux et en laissant moins de 250 arêtes inutilisées par niveau, le naïf gagne 30 % à 70 % ;
Vieux Sage, le soigneux gagne 60 % à 85 % ; sans défense on perd. Entre dieux : en Vieux Sage, au plus 10,0 points d’écart de taux de victoire du soigneux ; en Matou, au plus 3 vies d’écart de vies moyennes du soigneux.

### Dieu × difficulté

Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins 1 vie.

| Difficulté | Dieu | Naïf : victoires | Soigneux : victoires | Bande du soigneux | Naïf : vies | Soigneux : vies | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % | 100 % | — | 24,9 | 25,0 | 138 / 312 | 0/10 | 10 % |
| Chaton | Charlie | 100 % | 100 % | — | 25,0 | 24,9 | 126 / 256 | 1/10 | 40 % |
| Chaton | Pollen | 100 % | 100 % | — | 25,0 | 25,0 | 148 / 317 | 0/10 | 0 % |
| Matou | Plume | 68 % | 100 % | 100 % | 8,5 | 18,0 | 103 / 210 | 5/10 | 0 % |
| Matou | Charlie | 99 % | 100 % | 100 % | 16,0 | 19,5 | 119 / 218 | 1/10 | 0 % |
| Matou | Pollen | 71 % | 100 % | 100 % | 11,0 | 18,6 | 75 / 169 | 3/10 | 0 % |
| Vieux Sage | Plume | 9 % | 65 % | 60 % à 85 % | 0,7 | 8,0 | 84 / 175 | 6/10 | 0 % |
| Vieux Sage | Charlie | 59 % | 90 % | 60 % à 85 % | 6,3 | 12,9 | 108 / 178 | 2/10 | 0 % |
| Vieux Sage | Pollen | 23 % | 77 % | 60 % à 85 % | 2,0 | 9,6 | 78 / 219 | 7/10 | 0 % |

Bande du naïf : Chaton 100 %, Matou 30 % à 70 %. Matou : au moins 50 % des niveaux avec perte. Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

### Écarts entre dieux

| Mesure du soigneux | Plume | Charlie | Pollen | Écart maximal | Écart permis |
| --- | --- | --- | --- | --- | --- |
| Vieux Sage : taux de victoire | 65 % | 90 % | 77 % | 25,0 points | 10,0 points |
| Matou : vies moyennes | 18,0 | 19,5 | 18,6 | 1,5 vies | 3 vies |

## Plume

Héros : Plume, l’Ombre Première. Bonus de famille : Tir — PV des soldats +0 %, cadence +60 %, critique +15 points, prix +0 %. Sorts : Voile de Nuit (recharge 30 s), Griffes d’Ombre (recharge 40 s). Tour divine : Sanctuaire de l’Ombre (200 arêtes).

### Plume : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 59 / 195 | aucune / aucune | 159 / 100 | gagné 3/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 147 / 116 | aucune / aucune | 173 / 138 | perdu en 188 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 125 / 128 | aucune / aucune | 199 / 169 | perdu en 170 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 94 / 90 | aucune / aucune | 230 / 193 | perdu en 175 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 134 / 108 | aucune / aucune | 224 / 190 | perdu en 99 s |
| 6 | 100 % (10/10) | 24,8 | 100 % (10/10) | 25,0 | 137 / 142 | 4 (0,2 vies) / aucune | 261 / 223 | perdu en 119 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 186 / 89 | aucune / aucune | 307 / 237 | perdu en 115 s |
| 8 | 100 % (10/10) | 24,5 | 100 % (10/10) | 25,0 | 138 / 110 | 3 (0,5 vies) / aucune | 325 / 269 | perdu en 106 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 113 / 93 | aucune / aucune | 370 / 301 | perdu en 98 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 737 / 312 | aucune / aucune | 440 / 359 | perdu en 90 s |

### Plume : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 90 % (9/10) | 13,2 | 100 % (10/10) | 19,2 | 62 / 135 | 3 (2,7 vies) / 5 (0,8 vies) | 171 / 134 | perdu en 138 s |
| 2 | 50 % (5/10) | 6,9 | 100 % (10/10) | 20,0 | 50 / 191 | 4 (5,8 vies) / aucune | 171 / 146 | perdu en 115 s |
| 3 | 100 % (10/10) | 15,4 | 100 % (10/10) | 19,8 | 60 / 210 | 3 (2,0 vies) / 3 (0,2 vies) | 209 / 180 | perdu en 127 s |
| 4 | 80 % (8/10) | 10,6 | 100 % (10/10) | 15,7 | 108 / 44 | 3 (4,0 vies) / 7 (3,1 vies) | 213 / 188 | perdu en 100 s |
| 5 | 40 % (4/10) | 3,3 | 100 % (10/10) | 13,6 | 49 / 34 | 3 (7,2 vies) / 3 (3,8 vies) | 152 / 194 | perdu en 85 s |
| 6 | 40 % (4/10) | 3,8 | 100 % (10/10) | 19,5 | 104 / 94 | 4 (8,4 vies) / 4 (0,5 vies) | 195 / 234 | perdu en 85 s |
| 7 | 40 % (4/10) | 4,0 | 100 % (10/10) | 18,9 | 78 / 41 | 2 (5,0 vies) / 1 (1,1 vies) | 206 / 270 | perdu en 90 s |
| 8 | 70 % (7/10) | 4,7 | 100 % (10/10) | 16,8 | 112 / 39 | 3 (13,5 vies) / 3 (3,2 vies) | 260 / 300 | perdu en 93 s |
| 9 | 70 % (7/10) | 8,0 | 100 % (10/10) | 17,0 | 149 / 37 | 4 (6,2 vies) / 4 (1,8 vies) | 305 / 344 | perdu en 87 s |
| 10 | 100 % (10/10) | 15,3 | 100 % (10/10) | 19,5 | 183 / 200 | 12 (2,0 vies) / 3 (0,3 vies) | 491 / 408 | perdu en 72 s |

### Plume : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 43 / 175 | 3 (6,8 vies) / aucune | 148 / 135 | perdu en 120 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,8 | 65 / 148 | 3 (7,7 vies) / 3 (0,2 vies) | 124 / 143 | perdu en 113 s |
| 3 | 10 % (1/10) | 1,1 | 100 % (10/10) | 15,0 | 55 / 162 | 3 (6,4 vies) / aucune | 129 / 172 | perdu en 109 s |
| 4 | 10 % (1/10) | 0,3 | 100 % (10/10) | 15,0 | 59 / 41 | 1 (6,0 vies) / aucune | 119 / 202 | perdu en 97 s |
| 5 | 0 % (0/10) | 0,0 | 10 % (1/10) | 0,6 | 46 / 74 | 2 (6,5 vies) / 3 (5,4 vies) | 87 / 151 | perdu en 78 s |
| 6 | 0 % (0/10) | 0,0 | 60 % (6/10) | 4,2 | 55 / 71 | 2 (6,0 vies) / 6 (4,0 vies) | 114 / 196 | perdu en 80 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 8,7 | 42 / 57 | 2 (7,8 vies) / 1 (5,3 vies) | 95 / 287 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 80 % (8/10) | 7,1 | 59 / 55 | 3 (11,2 vies) / 3 (6,1 vies) | 93 / 267 | perdu en 92 s |
| 9 | 10 % (1/10) | 0,5 | 0 % (0/10) | 0,0 | 63 / 20 | 3 (6,3 vies) / 4 (10,8 vies) | 135 / 80 | perdu en 75 s |
| 10 | 60 % (6/10) | 4,6 | 0 % (0/10) | 0,0 | 162 / 39 | 8 (2,6 vies) / 6 (7,7 vies) | 391 / 146 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Plume : la plus choisie, Clocher des Archers (construction) (642 fois) ; la moins choisie, Nécromancien des Neuf Vies (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | équilibrée, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 2 | artillerie, diversité 1 | magie, diversité 0.4 | magie, diversité 1 |
| 3 | magie, diversité 0.4 | tir, diversité 0.4 | magie, diversité 1 |
| 4 | équilibrée, diversité 1 | magie, diversité 0.4 | artillerie, diversité 0.4 |
| 5 | magie, diversité 0.4 | artillerie, diversité 0.4 | magie, diversité 0.4 |
| 6 | artillerie, diversité 1 | caserne, diversité 0.4 | caserne, diversité 1 |
| 7 | magie, diversité 0.4 | artillerie, diversité 1 | tir, diversité 1 |
| 8 | tir, diversité 1 | tir, diversité 1 | équilibrée, diversité 1 |
| 9 | artillerie, diversité 0.4 | caserne, diversité 0.4 | équilibrée, diversité 1 |
| 10 | équilibrée, diversité 0.4 | équilibrée, diversité 0.4 | magie, diversité 0.4 |

## Charlie

Héros : Charlie, le Colosse. Bonus de famille : Caserne — PV des soldats +100 %, cadence +0 %, critique +0 points, prix −30 %. Sorts : Chute du Colosse (recharge 25 s), Renforts (recharge 20 s). Tour divine : Totem du Colosse (200 arêtes).

### Charlie : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 71 / 177 | aucune / aucune | 159 / 110 | gagné 3/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 86 / 62 | aucune / aucune | 173 / 117 | gagné 3/3 |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 73 / 153 | aucune / aucune | 199 / 161 | gagné 3/3 |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 106 / 50 | aucune / aucune | 232 / 175 | gagné 3/3 |
| 5 | 100 % (10/10) | 24,5 | 100 % (10/10) | 23,8 | 149 / 53 | 1 (0,5 vies) / 3 (1,2 vies) | 226 / 184 | perdu en 147 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 161 / 138 | aucune / aucune | 261 / 200 | perdu en 180 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 207 / 91 | aucune / aucune | 307 / 261 | perdu en 172 s |
| 8 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 125 / 96 | aucune / aucune | 324 / 279 | perdu en 175 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 181 / 188 | aucune / aucune | 370 / 324 | perdu en 98 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 1228 / 256 | aucune / aucune | 443 / 407 | perdu en 169 s |

### Charlie : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 79 / 201 | aucune / aucune | 163 / 115 | perdu en 182 s |
| 2 | 100 % (10/10) | 18,2 | 100 % (10/10) | 20,0 | 73 / 218 | 4 (0,6 vies) / aucune | 193 / 120 | perdu en 170 s |
| 3 | 100 % (10/10) | 19,8 | 100 % (10/10) | 20,0 | 39 / 76 | 2 (0,2 vies) / aucune | 204 / 170 | perdu en 202 s |
| 4 | 100 % (10/10) | 19,5 | 100 % (10/10) | 19,6 | 80 / 100 | 2 (0,5 vies) / 5 (0,4 vies) | 237 / 204 | perdu en 192 s |
| 5 | 100 % (10/10) | 13,0 | 100 % (10/10) | 19,8 | 68 / 71 | 1 (2,8 vies) / 3 (0,1 vies) | 229 / 199 | perdu en 98 s |
| 6 | 100 % (10/10) | 12,5 | 100 % (10/10) | 20,0 | 100 / 66 | 4 (3,2 vies) / aucune | 273 / 231 | perdu en 124 s |
| 7 | 100 % (10/10) | 13,4 | 100 % (10/10) | 19,8 | 126 / 53 | 2 (2,6 vies) / 7 (0,2 vies) | 315 / 279 | perdu en 112 s |
| 8 | 100 % (10/10) | 14,3 | 100 % (10/10) | 20,0 | 146 / 95 | 3 (4,4 vies) / aucune | 329 / 299 | perdu en 94 s |
| 9 | 90 % (9/10) | 11,9 | 100 % (10/10) | 15,7 | 106 / 97 | 3 (3,3 vies) / 4 (2,0 vies) | 349 / 349 | perdu en 93 s |
| 10 | 100 % (10/10) | 17,7 | 100 % (10/10) | 20,0 | 190 / 213 | 12 (2,0 vies) / aucune | 482 / 441 | perdu en 82 s |

### Charlie : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 14,9 | 100 % (10/10) | 10,8 | 63 / 166 | 1 (0,1 vies) / 5 (3,2 vies) | 165 / 126 | perdu en 160 s |
| 2 | 60 % (6/10) | 4,4 | 100 % (10/10) | 15,0 | 58 / 178 | 4 (4,1 vies) / aucune | 191 / 114 | perdu en 146 s |
| 3 | 100 % (10/10) | 13,0 | 100 % (10/10) | 15,0 | 58 / 84 | 1 (0,8 vies) / aucune | 206 / 161 | perdu en 143 s |
| 4 | 100 % (10/10) | 12,5 | 100 % (10/10) | 14,6 | 90 / 144 | 1 (1,3 vies) / 5 (0,4 vies) | 240 / 204 | perdu en 126 s |
| 5 | 40 % (4/10) | 2,5 | 100 % (10/10) | 14,7 | 62 / 28 | 3 (4,3 vies) / 4 (0,3 vies) | 149 / 208 | perdu en 78 s |
| 6 | 10 % (1/10) | 0,9 | 100 % (10/10) | 14,2 | 46 / 132 | 4 (5,8 vies) / 5 (0,8 vies) | 173 / 240 | perdu en 107 s |
| 7 | 10 % (1/10) | 1,2 | 100 % (10/10) | 15,0 | 47 / 45 | 2 (3,7 vies) / aucune | 153 / 283 | perdu en 80 s |
| 8 | 80 % (8/10) | 3,8 | 100 % (10/10) | 15,0 | 161 / 61 | 3 (9,2 vies) / aucune | 283 / 296 | perdu en 92 s |
| 9 | 20 % (2/10) | 1,6 | 0 % (0/10) | 0,0 | 42 / 73 | 3 (5,7 vies) / 5 (8,3 vies) | 166 / 127 | perdu en 75 s |
| 10 | 70 % (7/10) | 7,9 | 100 % (10/10) | 14,3 | 198 / 167 | 11 (3,3 vies) / 6 (0,7 vies) | 473 / 444 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Charlie : la plus choisie, Grenier des Griffes (construction) (1072 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | équilibrée, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 2 | caserne, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 1 |
| 3 | tir, diversité 1 | caserne, diversité 1 | artillerie, diversité 0.4 |
| 4 | tir, diversité 1 | caserne, diversité 1 | caserne, diversité 1 |
| 5 | tir, diversité 0.4 | caserne, diversité 1 | équilibrée, diversité 0.4 |
| 6 | équilibrée, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 7 | tir, diversité 1 | caserne, diversité 1 | caserne, diversité 0.4 |
| 8 | magie, diversité 1 | caserne, diversité 0.4 | équilibrée, diversité 0.4 |
| 9 | magie, diversité 1 | tir, diversité 0.4 | artillerie, diversité 0.4 |
| 10 | caserne, diversité 0.4 | magie, diversité 0.4 | artillerie, diversité 0.4 |

## Pollen

Héros : Pollen, Trois-Pattes. Bonus de famille : Artillerie — PV des soldats +0 %, cadence +15 %, critique +0 points, prix −10 %. Sorts : Pièges à Ressort (recharge 30 s), Ingéniosité (recharge 50 s). Tour divine : Atelier Boiteux (200 arêtes).

### Pollen : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 81 / 105 | aucune / aucune | 160 / 123 | perdu en 176 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 121 / 68 | aucune / aucune | 172 / 130 | perdu en 156 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 107 / 116 | aucune / aucune | 200 / 161 | perdu en 193 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 115 / 231 | aucune / aucune | 230 / 195 | perdu en 191 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 94 / 93 | aucune / aucune | 224 / 183 | perdu en 131 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 112 / 177 | aucune / aucune | 261 / 220 | perdu en 120 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 150 / 120 | aucune / aucune | 308 / 266 | perdu en 141 s |
| 8 | 100 % (10/10) | 25,0 | 100 % (10/10) | 24,8 | 169 / 104 | aucune / 3 (0,2 vies) | 324 / 272 | perdu en 124 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 96 / 146 | aucune / aucune | 370 / 315 | perdu en 98 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 1010 / 317 | aucune / aucune | 437 / 372 | perdu en 128 s |

### Pollen : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 40 % (4/10) | 4,8 | 100 % (10/10) | 20,0 | 46 / 64 | 4 (5,8 vies) / aucune | 167 / 148 | perdu en 139 s |
| 2 | 50 % (5/10) | 8,8 | 100 % (10/10) | 19,3 | 52 / 66 | 4 (6,6 vies) / 5 (0,7 vies) | 168 / 155 | perdu en 115 s |
| 3 | 100 % (10/10) | 17,8 | 100 % (10/10) | 20,0 | 48 / 100 | 5 (0,8 vies) / aucune | 213 / 197 | perdu en 137 s |
| 4 | 90 % (9/10) | 14,3 | 100 % (10/10) | 12,8 | 51 / 48 | 6 (1,9 vies) / 1 (7,2 vies) | 231 / 199 | perdu en 126 s |
| 5 | 90 % (9/10) | 13,1 | 100 % (10/10) | 16,5 | 73 / 63 | 4 (4,1 vies) / 4 (3,1 vies) | 218 / 196 | perdu en 111 s |
| 6 | 50 % (5/10) | 6,2 | 100 % (10/10) | 19,8 | 69 / 62 | 4 (8,2 vies) / 6 (0,2 vies) | 199 / 237 | perdu en 115 s |
| 7 | 80 % (8/10) | 12,6 | 100 % (10/10) | 20,0 | 70 / 69 | 5 (3,5 vies) / aucune | 285 / 274 | perdu en 111 s |
| 8 | 40 % (4/10) | 4,5 | 100 % (10/10) | 17,4 | 71 / 42 | 3 (14,6 vies) / 3 (2,6 vies) | 192 / 295 | perdu en 94 s |
| 9 | 70 % (7/10) | 9,7 | 100 % (10/10) | 19,8 | 94 / 71 | 4 (4,9 vies) / 4 (0,2 vies) | 318 / 342 | perdu en 97 s |
| 10 | 100 % (10/10) | 18,0 | 100 % (10/10) | 20,0 | 238 / 169 | 11 (1,0 vies) / aucune | 468 / 425 | perdu en 84 s |

### Pollen : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 % (1/10) | 0,6 | 100 % (10/10) | 14,1 | 65 / 120 | 3 (7,0 vies) / 6 (0,9 vies) | 144 / 150 | perdu en 121 s |
| 2 | 30 % (3/10) | 3,1 | 100 % (10/10) | 14,7 | 39 / 46 | 3 (7,4 vies) / 4 (0,3 vies) | 149 / 155 | perdu en 114 s |
| 3 | 40 % (4/10) | 3,6 | 90 % (9/10) | 12,0 | 50 / 40 | 3 (4,3 vies) / 5 (2,1 vies) | 172 / 175 | perdu en 127 s |
| 4 | 10 % (1/10) | 0,9 | 100 % (10/10) | 12,4 | 53 / 44 | 4 (4,5 vies) / 1 (2,6 vies) | 150 / 206 | perdu en 101 s |
| 5 | 20 % (2/10) | 1,5 | 0 % (0/10) | 0,0 | 85 / 27 | 3 (6,4 vies) / 4 (13,8 vies) | 157 / 104 | perdu en 86 s |
| 6 | 20 % (2/10) | 0,7 | 90 % (9/10) | 9,5 | 48 / 68 | 4 (10,7 vies) / 4 (2,6 vies) | 148 / 233 | perdu en 82 s |
| 7 | 20 % (2/10) | 2,1 | 10 % (1/10) | 0,4 | 77 / 89 | 5 (6,8 vies) / 5 (12,1 vies) | 171 / 142 | perdu en 100 s |
| 8 | 10 % (1/10) | 0,3 | 80 % (8/10) | 3,7 | 55 / 67 | 3 (14,6 vies) / 3 (9,2 vies) | 118 / 260 | perdu en 93 s |
| 9 | 20 % (2/10) | 2,1 | 100 % (10/10) | 15,0 | 71 / 59 | 4 (4,5 vies) / aucune | 164 / 341 | perdu en 75 s |
| 10 | 50 % (5/10) | 5,1 | 100 % (10/10) | 13,8 | 128 / 219 | 11 (3,2 vies) / 6 (1,2 vies) | 417 / 444 | perdu en 76 s |

Tours choisies par le soigneux en Matou avec Pollen : la plus choisie, Catapulte du Rempart (construction) (684 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | caserne, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 2 | tir, diversité 0.4 | équilibrée, diversité 0.4 | artillerie, diversité 1 |
| 3 | équilibrée, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 4 | caserne, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 5 | caserne, diversité 0.4 | artillerie, diversité 1 | équilibrée, diversité 0.4 |
| 6 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 |
| 7 | caserne, diversité 1 | artillerie, diversité 1 | artillerie, diversité 1 |
| 8 | équilibrée, diversité 1 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 9 | artillerie, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 10 | équilibrée, diversité 0.4 | caserne, diversité 0.4 | artillerie, diversité 0.4 |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus -0,3) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.

| Dieu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Corrélation de rang | Niveau le plus dur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | 13,2 | 6,9 | 15,4 | 10,6 | 3,3 | 3,8 | 4,0 | 4,7 | 8,0 | 15,3 | -0,2 | 5 (3,3 vies) |
| Charlie | 20,0 | 18,2 | 19,8 | 19,5 | 13,0 | 12,5 | 13,4 | 14,3 | 11,9 | 17,7 | -0,7 | 9 (11,9 vies) |
| Pollen | 4,8 | 8,8 | 17,8 | 14,3 | 13,1 | 6,2 | 12,6 | 4,5 | 9,7 | 18,0 | 0,2 | 8 (4,5 vies) |
| **Moyenne des dieux** | 12,7 | 11,3 | 17,7 | 14,8 | 9,8 | 7,5 | 10,0 | 7,8 | 9,9 | 17,0 | -0,3 | 6 (7,5 vies) |

Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).

## Usage des sorts par le soigneux

Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).

| Dieu | Sort | Recharge | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- | --- | --- |
| Plume | Voile de Nuit | 30 s | 3,6 sur 7,2 (49 %) | 6,0 sur 8,0 (75 %) | 4,7 sur 6,0 (78 %) |
| Plume | Griffes d’Ombre | 40 s | 5,5 sur 5,6 (99 %) | 6,1 sur 6,2 (99 %) | 4,4 sur 4,5 (99 %) |
| Charlie | Chute du Colosse | 25 s | 9,0 sur 9,1 (98 %) | 9,7 sur 9,7 (99 %) | 9,0 sur 9,1 (99 %) |
| Charlie | Renforts | 20 s | 7,2 sur 11,7 (61 %) | 9,6 sur 12,5 (77 %) | 9,1 sur 11,5 (79 %) |
| Pollen | Pièges à Ressort | 30 s | 6,0 sur 7,6 (79 %) | 6,9 sur 8,5 (82 %) | 6,2 sur 7,4 (83 %) |
| Pollen | Ingéniosité | 50 s | 3,3 sur 4,7 (70 %) | 4,3 sur 5,1 (85 %) | 3,8 sur 4,5 (84 %) |

## Tours divines

Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 200 arêtes avant la fin du niveau).
Sans tour divine : le même soigneux, mêmes graines, dépense ces 200 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.

| Dieu | Tour divine | Difficulté | Construite | Avec : victoires / vies | Sans : victoires / vies | Gain de la tour divine |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | Matou | 77 % | 100 % / 18,0 | 100 % / 18,2 | +0 points / −0,2 vies |
| Plume | Sanctuaire de l’Ombre | Vieux Sage | 44 % | 65 % / 8,0 | 73 % / 8,1 | −8 points / −0,1 vies |
| Charlie | Totem du Colosse | Matou | 82 % | 100 % / 19,5 | 100 % / 19,3 | +0 points / +0,2 vies |
| Charlie | Totem du Colosse | Vieux Sage | 76 % | 90 % / 12,9 | 99 % / 14,0 | −9 points / −1,1 vies |
| Pollen | Atelier Boiteux | Matou | 86 % | 100 % / 18,6 | 99 % / 17,5 | +1 points / +1,1 vies |
| Pollen | Atelier Boiteux | Vieux Sage | 87 % | 77 % / 9,6 | 81 % / 8,4 | −4 points / +1,2 vies |

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
| Plume | Plume, l’Ombre Première (avatar) | Duelliste, esquive et critiques | 100 % | 18,0 | — | 68 % | 8,5 | — |
| Plume | Suie | Assassin, exécute les blessés | 100 % | 18,2 | +0,2 vies | 29 % | 2,9 | −5,6 vies |
| Plume | Corbeau | Tireur, perce l’armure | 100 % | 18,9 | +0,9 vies | 72 % | 9,9 | +1,4 vies |
| Charlie | Charlie, le Colosse (avatar) | Tank, frappe de zone qui étourdit | 100 % | 19,5 | — | 99 % | 16,0 | — |
| Charlie | Mastoc | Provocation, bloque trois ennemis | 100 % | 19,2 | −0,3 vies | 54 % | 5,6 | −10,5 vies |
| Charlie | Brise-Os | Berserker, plus fort blessé | 100 % | 19,4 | −0,1 vies | 61 % | 6,6 | −9,4 vies |
| Pollen | Pollen, Trois-Pattes (avatar) | Pose des pièges, tire à la fronde | 100 % | 18,6 | — | 71 % | 11,0 | — |
| Pollen | Rouage | Ingénieur, construit une tourelle | 99 % | 18,3 | −0,2 vies | 74 % | 11,4 | +0,4 vies |
| Pollen | Lanterne | Soigneur, magie à distance | 93 % | 17,3 | −1,2 vies | 73 % | 11,5 | +0,5 vies |

## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)

L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.
La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.

| Dieu | Bot | De base | Arbre au maximum | Héros niveau 10 | Tout au maximum |
| --- | --- | --- | --- | --- | --- |
| Plume | Soigneux | 65 % / 8,0 | 89 % / 10,0 | 83 % / 9,6 | 97 % / 11,9 |
| Plume | Naïf | 9 % / 0,7 | 20 % / 1,6 | 43 % / 4,3 | 48 % / 4,9 |
| Charlie | Soigneux | 90 % / 12,9 | 97 % / 13,7 | 92 % / 12,8 | 95 % / 13,9 |
| Charlie | Naïf | 59 % / 6,3 | 70 % / 7,7 | 79 % / 9,0 | 86 % / 10,1 |
| Pollen | Soigneux | 77 % / 9,6 | 97 % / 12,5 | 97 % / 12,1 | 100 % / 14,1 |
| Pollen | Naïf | 23 % / 2,0 | 36 % / 3,5 | 45 % / 4,5 | 56 % / 6,1 |

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
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 166 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,6 | 192 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 157 | 0 % (0/30) |
| Matou | Plume | 99 % (99/100) | 54 % (54/100) | 19,5 | 162 | 0 % (0/30) |
| Matou | Charlie | 97 % (97/100) | 66 % (66/100) | 15,8 | 116 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 73 % (73/100) | 18,8 | 151 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 5 % (5/100) | 13,3 | 120 | 0 % (0/30) |
| Vieux Sage | Charlie | 44 % (44/100) | 6 % (6/100) | 4,9 | 77 | 0 % (0/30) |
| Vieux Sage | Pollen | 73 % (73/100) | 16 % (16/100) | 7,7 | 124 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 100 % (30/30) | 77 % (23/30) | 14,4 | 121 | 100 % (30/30) | 13,9 | 0 % (0/9) |
| 12 | 100 % (30/30) | 60 % (18/30) | 9,0 | 140 | 67 % (20/30) | 10,0 | 0 % (0/9) |
| 13 | 100 % (30/30) | 57 % (17/30) | 5,9 | 137 | 77 % (23/30) | 7,5 | 0 % (0/9) |
| 14 | 100 % (30/30) | 87 % (26/30) | 10,3 | 98 | 43 % (13/30) | 5,1 | 0 % (0/9) |
| 15 | 97 % (29/30) | 63 % (19/30) | 6,6 | 107 | 73 % (22/30) | 7,3 | 0 % (0/9) |
| 16 | 100 % (30/30) | 57 % (17/30) | 7,1 | 129 | 100 % (30/30) | 13,3 | 0 % (0/9) |
| 17 | 100 % (30/30) | 40 % (12/30) | 4,6 | 194 | 60 % (18/30) | 5,2 | 0 % (0/9) |
| 18 | 90 % (27/30) | 70 % (21/30) | 6,4 | 123 | 60 % (18/30) | 5,8 | 0 % (0/9) |
| 19 | 100 % (30/30) | 90 % (27/30) | 10,8 | 170 | 77 % (23/30) | 10,2 | 0 % (0/9) |
| 20 | 100 % (30/30) | 43 % (13/30) | 5,0 | 209 | 67 % (20/30) | 8,1 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 19 laisse 274 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 97 % des parties, il doit tout gagner
- Matou (Charlie) : le niveau 20 laisse 251 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 73 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,4, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 44 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (44 %) sont à 56 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,5 vies) et Charlie (15,8 vies) sont à 3,8 vies l'un de l'autre, il en faut au plus 3
- Défi Héroïque : le bot soigneux réussit 21.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 16.3 % des parties, la bande est 40 % à 90 %

### Région 3 : le Bourg des Bûchers

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 807 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 1401 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 868 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 85 % (85/100) | 20,0 | 169 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 83 % (83/100) | 17,6 | 121 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 42 % (42/100) | 18,6 | 130 | 0 % (0/30) |
| Vieux Sage | Plume | 89 % (89/100) | 9 % (9/100) | 11,0 | 129 | 0 % (0/30) |
| Vieux Sage | Charlie | 75 % (75/100) | 5 % (5/100) | 7,1 | 117 | 0 % (0/30) |
| Vieux Sage | Pollen | 58 % (58/100) | 1 % (1/100) | 6,6 | 115 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 100 % (30/30) | 67 % (20/30) | 12,1 | 119 | 80 % (24/30) | 10,1 | 0 % (0/9) |
| 22 | 100 % (30/30) | 70 % (21/30) | 10,1 | 84 | 27 % (8/30) | 4,0 | 0 % (0/9) |
| 23 | 100 % (30/30) | 77 % (23/30) | 10,3 | 149 | 97 % (29/30) | 12,0 | 0 % (0/9) |
| 24 | 100 % (30/30) | 80 % (24/30) | 10,4 | 99 | 93 % (28/30) | 11,3 | 0 % (0/9) |
| 25 | 100 % (30/30) | 53 % (16/30) | 6,5 | 179 | 90 % (27/30) | 10,7 | 0 % (0/9) |
| 26 | 100 % (30/30) | 70 % (21/30) | 8,1 | 166 | 83 % (25/30) | 8,2 | 0 % (0/9) |
| 27 | 100 % (30/30) | 73 % (22/30) | 10,1 | 80 | 87 % (26/30) | 10,2 | 0 % (0/9) |
| 28 | 100 % (30/30) | 60 % (18/30) | 5,9 | 173 | 67 % (20/30) | 6,1 | 0 % (0/9) |
| 29 | 100 % (30/30) | 57 % (17/30) | 8,0 | 103 | 97 % (29/30) | 8,3 | 0 % (0/9) |
| 30 | 100 % (30/30) | 93 % (28/30) | 17,2 | 250 | 20 % (6/30) | 1,3 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot naïf gagne 85 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 26 laisse 271 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 28 laisse 268 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 30 laisse 294 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot naïf gagne 83 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 30 laisse 289 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,2, elle doit être d'au plus -0,6
- Matou : le niveau 30 (17,2 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,9, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 89 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 58 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (89 %) et Pollen (58 %) sont à 31 points l'un de l'autre, il en faut au plus 10
- Défi Héroïque : le bot soigneux réussit 12.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 18 % des parties, la bande est 40 % à 90 %

### Région 4 : les Marais de l’Ordalie

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 636 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,8 | 1091 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 608 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 75 % (75/100) | 19,7 | 180 | 0 % (0/30) |
| Matou | Charlie | 99 % (99/100) | 80 % (80/100) | 18,3 | 120 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 44 % (44/100) | 18,2 | 126 | 0 % (0/30) |
| Vieux Sage | Plume | 89 % (89/100) | 2 % (2/100) | 11,9 | 147 | 0 % (0/30) |
| Vieux Sage | Charlie | 53 % (53/100) | 3 % (3/100) | 3,9 | 101 | 0 % (0/30) |
| Vieux Sage | Pollen | 49 % (49/100) | 3 % (3/100) | 4,5 | 118 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 100 % (30/30) | 77 % (23/30) | 12,9 | 173 | 30 % (9/30) | 3,4 | 0 % (0/9) |
| 32 | 100 % (30/30) | 67 % (20/30) | 11,6 | 96 | 67 % (20/30) | 6,1 | 0 % (0/9) |
| 33 | 100 % (30/30) | 77 % (23/30) | 10,2 | 75 | 83 % (25/30) | 9,5 | 0 % (0/9) |
| 34 | 100 % (30/30) | 60 % (18/30) | 9,7 | 198 | 93 % (28/30) | 10,0 | 0 % (0/9) |
| 35 | 97 % (29/30) | 60 % (18/30) | 7,7 | 142 | 50 % (15/30) | 6,1 | 0 % (0/9) |
| 36 | 100 % (30/30) | 57 % (17/30) | 5,6 | 142 | 100 % (30/30) | 12,4 | 0 % (0/9) |
| 37 | 100 % (30/30) | 63 % (19/30) | 12,0 | 130 | 27 % (8/30) | 1,1 | 0 % (0/9) |
| 38 | 100 % (30/30) | 83 % (25/30) | 12,8 | 120 | 47 % (14/30) | 4,8 | 0 % (0/9) |
| 39 | 100 % (30/30) | 57 % (17/30) | 7,1 | 104 | 97 % (29/30) | 10,4 | 0 % (0/9) |
| 40 | 100 % (30/30) | 63 % (19/30) | 9,4 | 241 | 43 % (13/30) | 4,0 | 0 % (0/9) |

Écarts aux bandes : 18

- Matou (Plume) : le bot naïf gagne 75 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 34 laisse 313 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 40 laisse 289 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 80 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,4, elle doit être d'au plus -0,6
- Matou : le niveau 40 (9,4 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 89 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 53 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 49 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (89 %) et Pollen (49 %) sont à 40 points l'un de l'autre, il en faut au plus 10
- Défi Héroïque : le bot soigneux réussit 10.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 20 % des parties, la bande est 40 % à 90 %

### Région 5 : la Ville Pestiférée

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 1526 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,1 | 2508 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 24,3 | 1840 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 72 % (72/100) | 19,8 | 166 | 0 % (0/30) |
| Matou | Charlie | 95 % (95/100) | 59 % (59/100) | 17,5 | 253 | 0 % (0/30) |
| Matou | Pollen | 98 % (98/100) | 50 % (50/100) | 19,2 | 132 | 0 % (0/30) |
| Vieux Sage | Plume | 90 % (90/100) | 4 % (4/100) | 12,7 | 139 | 0 % (0/30) |
| Vieux Sage | Charlie | 45 % (45/100) | 0 % (0/100) | 5,3 | 122 | 0 % (0/30) |
| Vieux Sage | Pollen | 63 % (63/100) | 8 % (8/100) | 6,3 | 147 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | 100 % (30/30) | 57 % (17/30) | 9,6 | 146 | 97 % (29/30) | 12,0 | 0 % (0/9) |
| 42 | 100 % (30/30) | 57 % (17/30) | 10,7 | 144 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 43 | 100 % (30/30) | 57 % (17/30) | 10,5 | 527 | 100 % (30/30) | 15,0 | 0 % (0/9) |
| 44 | 93 % (28/30) | 90 % (27/30) | 16,8 | 102 | 93 % (28/30) | 11,5 | 0 % (0/9) |
| 45 | 100 % (30/30) | 63 % (19/30) | 8,2 | 124 | 43 % (13/30) | 5,0 | 0 % (0/9) |
| 46 | 100 % (30/30) | 50 % (15/30) | 6,3 | 122 | 87 % (26/30) | 9,5 | 0 % (0/9) |
| 47 | 100 % (30/30) | 70 % (21/30) | 10,5 | 77 | 67 % (20/30) | 6,7 | 0 % (0/9) |
| 48 | 100 % (30/30) | 47 % (14/30) | 6,7 | 160 | 67 % (20/30) | 6,7 | 0 % (0/9) |
| 49 | 100 % (30/30) | 70 % (21/30) | 12,7 | 120 | 73 % (22/30) | 9,6 | 0 % (0/9) |
| 50 | 83 % (25/30) | 43 % (13/30) | 5,0 | 314 | 0 % (0/30) | 0,0 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot naïf gagne 72 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 50 laisse 361 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 95 % des parties, il doit tout gagner
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 41 laisse 251 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 43 laisse 1205 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 98 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 50 laisse 336 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,4, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,5, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 90 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 45 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (90 %) et Charlie (45 %) sont à 45 points l'un de l'autre, il en faut au plus 10
- Défi Héroïque : le bot soigneux réussit 20.7 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 14.7 % des parties, la bande est 40 % à 90 %

## Défis, régions 1 à 5

Le bot soigneux joue les défis avec les règles de Matou, sans objet ni amélioration : Héroïque (1 vie, groupes d’élite) et Fer (toutes les vagues en une, deux familles de tours). Il cherche sa variante sur les graines d’entraînement du défi lui-même, puis joue les dix graines d’évaluation. Bande : entre 40 et 90 % de réussites pour chaque défi de chaque région, trois dieux confondus.

### Région 1 : le Village Affamé

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 18 % (18/100) | 0,2 |
| Héroïque | Charlie | 29 % (29/100) | 0,3 |
| Héroïque | Pollen | 9 % (9/100) | 0,1 |
| Héroïque | les trois | 19 % (56/300) | 0,2 |
| Fer | Plume | 13 % (13/100) | 2,3 |
| Fer | Charlie | 30 % (30/100) | 6,0 |
| Fer | Pollen | 0 % (0/100) | 0,0 |
| Fer | les trois | 14 % (43/300) | 2,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 1 | 27 % (8/30) | 33 % (10/30) |
| 2 | 90 % (27/30) | 43 % (13/30) |
| 3 | 40 % (12/30) | 67 % (20/30) |
| 4 | 0 % (0/30) | 0 % (0/30) |
| 5 | 0 % (0/30) | 0 % (0/30) |
| 6 | 0 % (0/30) | 0 % (0/30) |
| 7 | 30 % (9/30) | 0 % (0/30) |
| 8 | 0 % (0/30) | 0 % (0/30) |
| 9 | 0 % (0/30) | 0 % (0/30) |
| 10 | 0 % (0/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 18.7 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 14.3 % des parties, la bande est 40 % à 90 %

### Région 2 : les Champs Brûlés

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 44 % (44/100) | 0,4 |
| Héroïque | Charlie | 10 % (10/100) | 0,1 |
| Héroïque | Pollen | 10 % (10/100) | 0,1 |
| Héroïque | les trois | 21 % (64/300) | 0,2 |
| Fer | Plume | 20 % (20/100) | 3,2 |
| Fer | Charlie | 20 % (20/100) | 3,7 |
| Fer | Pollen | 9 % (9/100) | 1,7 |
| Fer | les trois | 16 % (49/300) | 2,9 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 11 | 97 % (29/30) | 97 % (29/30) |
| 12 | 33 % (10/30) | 0 % (0/30) |
| 13 | 23 % (7/30) | 0 % (0/30) |
| 14 | 0 % (0/30) | 0 % (0/30) |
| 15 | 0 % (0/30) | 0 % (0/30) |
| 16 | 10 % (3/30) | 67 % (20/30) |
| 17 | 0 % (0/30) | 0 % (0/30) |
| 18 | 0 % (0/30) | 0 % (0/30) |
| 19 | 33 % (10/30) | 0 % (0/30) |
| 20 | 17 % (5/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 21.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 16.3 % des parties, la bande est 40 % à 90 %

### Région 3 : le Bourg des Bûchers

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 19 % (19/100) | 0,2 |
| Héroïque | Charlie | 18 % (18/100) | 0,2 |
| Héroïque | Pollen | 0 % (0/100) | 0,0 |
| Héroïque | les trois | 12 % (37/300) | 0,1 |
| Fer | Plume | 20 % (20/100) | 4,0 |
| Fer | Charlie | 20 % (20/100) | 4,0 |
| Fer | Pollen | 14 % (14/100) | 2,8 |
| Fer | les trois | 18 % (54/300) | 3,6 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 21 | 17 % (5/30) | 100 % (30/30) |
| 22 | 0 % (0/30) | 80 % (24/30) |
| 23 | 23 % (7/30) | 0 % (0/30) |
| 24 | 27 % (8/30) | 0 % (0/30) |
| 25 | 0 % (0/30) | 0 % (0/30) |
| 26 | 20 % (6/30) | 0 % (0/30) |
| 27 | 33 % (10/30) | 0 % (0/30) |
| 28 | 0 % (0/30) | 0 % (0/30) |
| 29 | 0 % (0/30) | 0 % (0/30) |
| 30 | 3 % (1/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 12.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 18 % des parties, la bande est 40 % à 90 %

### Région 4 : les Marais de l’Ordalie

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 31 % (31/100) | 0,3 |
| Héroïque | Charlie | 0 % (0/100) | 0,0 |
| Héroïque | Pollen | 0 % (0/100) | 0,0 |
| Héroïque | les trois | 10 % (31/300) | 0,1 |
| Fer | Plume | 20 % (20/100) | 4,0 |
| Fer | Charlie | 20 % (20/100) | 4,0 |
| Fer | Pollen | 20 % (20/100) | 4,0 |
| Fer | les trois | 20 % (60/300) | 4,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 31 | 27 % (8/30) | 100 % (30/30) |
| 32 | 3 % (1/30) | 100 % (30/30) |
| 33 | 33 % (10/30) | 0 % (0/30) |
| 34 | 0 % (0/30) | 0 % (0/30) |
| 35 | 0 % (0/30) | 0 % (0/30) |
| 36 | 23 % (7/30) | 0 % (0/30) |
| 37 | 17 % (5/30) | 0 % (0/30) |
| 38 | 0 % (0/30) | 0 % (0/30) |
| 39 | 0 % (0/30) | 0 % (0/30) |
| 40 | 0 % (0/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 10.3 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 20 % des parties, la bande est 40 % à 90 %

### Région 5 : la Ville Pestiférée

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 37 % (37/100) | 0,4 |
| Héroïque | Charlie | 15 % (15/100) | 0,2 |
| Héroïque | Pollen | 10 % (10/100) | 0,1 |
| Héroïque | les trois | 21 % (62/300) | 0,2 |
| Fer | Plume | 19 % (19/100) | 2,6 |
| Fer | Charlie | 13 % (13/100) | 2,4 |
| Fer | Pollen | 12 % (12/100) | 2,1 |
| Fer | les trois | 15 % (44/300) | 2,4 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 41 | 37 % (11/30) | 100 % (30/30) |
| 42 | 10 % (3/30) | 17 % (5/30) |
| 43 | 63 % (19/30) | 0 % (0/30) |
| 44 | 43 % (13/30) | 0 % (0/30) |
| 45 | 10 % (3/30) | 0 % (0/30) |
| 46 | 13 % (4/30) | 30 % (9/30) |
| 47 | 3 % (1/30) | 0 % (0/30) |
| 48 | 0 % (0/30) | 0 % (0/30) |
| 49 | 27 % (8/30) | 0 % (0/30) |
| 50 | 0 % (0/30) | 0 % (0/30) |

Écarts aux bandes des défis : 2

- Défi Héroïque : le bot soigneux réussit 20.7 % des parties, la bande est 40 % à 90 %
- Défi Fer : le bot soigneux réussit 14.7 % des parties, la bande est 40 % à 90 %
