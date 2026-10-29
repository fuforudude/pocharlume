# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau des régions 1 à 10 (la région 1 en détail dans cette partie, les régions 2 à 10, les défis et le mode infini plus bas) est rejoué sans
affichage dans les trois difficultés, avec chacun des trois dieux jouant son avatar (sans amélioration ni objet), par deux bots, sur 10 graines chacun (version des données 11).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (case de la grille, famille, niveau,
  spécialisation, bonus et remise de famille du dieu compris), après une petite recherche entre dix variantes (5 préférences × 2 diversités) jouées sur des graines d’entraînement ;
  place le héros dans la zone de feu de ses tours ; joue les sorts de son dieu selon leur effet (Chute du Colosse sur les grappes, Renforts et Voile de Nuit devant la zone de feu,
  Griffes d’Ombre sur la plus grosse grappe, Pièges à Ressort un peu avant la zone de feu, Ingéniosité au cœur de ses tours) ; construit la tour divine de son dieu dès la troisième tour ;
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter. Il lit la composition des vagues futures, ce qu’un joueur ne voit pas : il est un peu optimiste.
- **Naïf** : construit sur les cases de la grille proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans tour divine, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

**13 écart(s)**, dont 13 aux bandes suspendues de Matou et de Vieux Sage (elles ne bloquent pas : voir bandes.ts) :

- Matou (Plume) : le bot naïf gagne 71 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Charlie) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le niveau 2 laisse 258 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 77 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,4, elle doit être d'au plus -0,6
- Matou : le niveau 10 (16,6 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Vieux Sage (Pollen) : le bot soigneux gagne 88 % des parties, la bande est 60 % à 85 %

Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins 1 vie sur 50 % des niveaux et en laissant moins de 250 arêtes inutilisées par niveau, le naïf gagne 30 % à 70 % ;
Vieux Sage, le soigneux gagne 60 % à 85 % ; sans défense on perd. Entre dieux : en Vieux Sage, au plus 10,0 points d’écart de taux de victoire du soigneux ; en Matou, au plus 3 vies d’écart de vies moyennes du soigneux.

### Dieu × difficulté

Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins 1 vie.

| Difficulté | Dieu | Naïf : victoires | Soigneux : victoires | Bande du soigneux | Naïf : vies | Soigneux : vies | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % | 100 % | — | 24,9 | 25,0 | 160 / 312 | 0/10 | 10 % |
| Chaton | Charlie | 100 % | 100 % | — | 24,9 | 25,0 | 165 / 362 | 0/10 | 3 % |
| Chaton | Pollen | 100 % | 100 % | — | 25,0 | 25,0 | 144 / 317 | 0/10 | 0 % |
| Matou | Plume | 71 % | 100 % | 100 % | 10,4 | 18,5 | 109 / 200 | 4/10 | 0 % |
| Matou | Charlie | 65 % | 99 % | 100 % | 9,1 | 18,7 | 126 / 258 | 3/10 | 0 % |
| Matou | Pollen | 77 % | 99 % | 100 % | 12,5 | 19,0 | 93 / 169 | 3/10 | 0 % |
| Vieux Sage | Plume | 32 % | 78 % | 60 % à 85 % | 3,7 | 8,3 | 100 / 211 | 7/10 | 0 % |
| Vieux Sage | Charlie | 27 % | 85 % | 60 % à 85 % | 2,4 | 10,3 | 118 / 210 | 6/10 | 0 % |
| Vieux Sage | Pollen | 38 % | 88 % | 60 % à 85 % | 4,1 | 10,3 | 85 / 239 | 6/10 | 0 % |

Bande du naïf : Chaton 100 %, Matou 30 % à 70 %. Matou : au moins 50 % des niveaux avec perte. Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

### Écarts entre dieux

| Mesure du soigneux | Plume | Charlie | Pollen | Écart maximal | Écart permis |
| --- | --- | --- | --- | --- | --- |
| Vieux Sage : taux de victoire | 78 % | 85 % | 88 % | 10,0 points | 10,0 points |
| Matou : vies moyennes | 18,5 | 18,7 | 19,0 | 0,4 vies | 3 vies |

## Plume

Héros : Plume, l’Ombre Première. Bonus de famille : Tir — PV des soldats +0 %, cadence +60 %, critique +15 points, prix +0 %. Sorts : Voile de Nuit (recharge 30 s), Griffes d’Ombre (recharge 40 s). Tour divine : Sanctuaire de l’Ombre (200 arêtes).

### Plume : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 69 / 228 | aucune / aucune | 159 / 115 | gagné 3/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 147 / 116 | aucune / aucune | 173 / 138 | perdu en 188 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 72 / 206 | aucune / aucune | 199 / 122 | perdu en 170 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 158 / 200 | aucune / aucune | 228 / 142 | perdu en 175 s |
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
| 1 | 100 % (10/10) | 19,1 | 100 % (10/10) | 20,0 | 68 / 199 | 3 (0,9 vies) / aucune | 170 / 140 | perdu en 138 s |
| 2 | 50 % (5/10) | 6,9 | 100 % (10/10) | 20,0 | 50 / 191 | 4 (5,8 vies) / aucune | 171 / 146 | perdu en 115 s |
| 3 | 100 % (10/10) | 19,3 | 100 % (10/10) | 20,0 | 52 / 181 | 2 (0,4 vies) / aucune | 207 / 181 | perdu en 127 s |
| 4 | 100 % (10/10) | 19,5 | 100 % (10/10) | 20,0 | 79 / 72 | 3 (0,4 vies) / aucune | 238 / 192 | perdu en 100 s |
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
| 1 | 90 % (9/10) | 10,5 | 100 % (10/10) | 15,0 | 51 / 168 | 3 (2,5 vies) / aucune | 178 / 140 | perdu en 120 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 64 / 146 | 3 (8,2 vies) / aucune | 122 / 141 | perdu en 113 s |
| 3 | 90 % (9/10) | 10,6 | 100 % (10/10) | 15,0 | 41 / 211 | 4 (1,5 vies) / aucune | 203 / 180 | perdu en 109 s |
| 4 | 80 % (8/10) | 10,4 | 100 % (10/10) | 14,0 | 60 / 58 | 3 (2,2 vies) / 3 (1,0 vies) | 218 / 196 | perdu en 98 s |
| 5 | 0 % (0/10) | 0,0 | 20 % (2/10) | 0,5 | 33 / 102 | 2 (6,1 vies) / 5 (3,6 vies) | 91 / 169 | perdu en 78 s |
| 6 | 0 % (0/10) | 0,0 | 90 % (9/10) | 4,1 | 38 / 62 | 4 (5,5 vies) / 4 (5,5 vies) | 112 / 227 | perdu en 80 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 7,8 | 34 / 52 | 2 (7,6 vies) / 1 (5,0 vies) | 94 / 287 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 90 % (9/10) | 8,2 | 59 / 66 | 3 (11,0 vies) / 6 (2,5 vies) | 93 / 276 | perdu en 91 s |
| 9 | 20 % (2/10) | 1,2 | 60 % (6/10) | 2,4 | 81 / 61 | 4 (5,1 vies) / 4 (10,2 vies) | 161 / 247 | perdu en 75 s |
| 10 | 40 % (4/10) | 4,1 | 20 % (2/10) | 0,7 | 163 / 73 | 8 (2,3 vies) / 6 (9,2 vies) | 388 / 219 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Plume : la plus choisie, Clocher des Archers (construction) (648 fois) ; la moins choisie, Nécromancien des Neuf Vies (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | caserne, diversité 1 | équilibrée, diversité 1 | équilibrée, diversité 1 |
| 2 | artillerie, diversité 1 | magie, diversité 0.4 | magie, diversité 0.4 |
| 3 | équilibrée, diversité 1 | tir, diversité 1 | caserne, diversité 1 |
| 4 | magie, diversité 0.4 | tir, diversité 1 | artillerie, diversité 0.4 |
| 5 | magie, diversité 0.4 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 |
| 6 | artillerie, diversité 1 | caserne, diversité 0.4 | tir, diversité 0.4 |
| 7 | magie, diversité 0.4 | artillerie, diversité 1 | tir, diversité 1 |
| 8 | tir, diversité 1 | tir, diversité 1 | artillerie, diversité 1 |
| 9 | artillerie, diversité 0.4 | caserne, diversité 0.4 | tir, diversité 1 |
| 10 | équilibrée, diversité 0.4 | équilibrée, diversité 0.4 | magie, diversité 0.4 |

## Charlie

Héros : Charlie, le Colosse. Bonus de famille : Caserne — PV des soldats +25 %, cadence +0 %, critique +0 points, prix +0 %. Sorts : Chute du Colosse (recharge 25 s), Renforts (recharge 20 s). Tour divine : Totem du Colosse (200 arêtes).

### Charlie : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 71 / 130 | aucune / aucune | 159 / 112 | gagné 1/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 148 / 218 | aucune / aucune | 173 / 115 | perdu en 180 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 72 / 250 | aucune / aucune | 200 / 151 | perdu en 217 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 158 / 132 | aucune / aucune | 232 / 193 | perdu en 198 s |
| 5 | 100 % (10/10) | 24,5 | 100 % (10/10) | 25,0 | 130 / 111 | 1 (0,5 vies) / aucune | 226 / 186 | perdu en 115 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 116 / 120 | aucune / aucune | 263 / 207 | perdu en 131 s |
| 7 | 100 % (10/10) | 24,8 | 100 % (10/10) | 25,0 | 184 / 127 | 1 (0,1 vies) / aucune | 308 / 268 | perdu en 119 s |
| 8 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 142 / 103 | aucune / aucune | 325 / 279 | perdu en 128 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 113 / 94 | aucune / aucune | 371 / 337 | perdu en 98 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 737 / 362 | aucune / aucune | 442 / 393 | perdu en 90 s |

### Charlie : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 19,6 | 100 % (10/10) | 20,0 | 73 / 96 | 3 (0,3 vies) / aucune | 169 / 126 | perdu en 121 s |
| 2 | 60 % (6/10) | 5,6 | 100 % (10/10) | 20,0 | 55 / 258 | 3 (5,1 vies) / aucune | 171 / 120 | perdu en 113 s |
| 3 | 100 % (10/10) | 18,1 | 100 % (10/10) | 20,0 | 55 / 211 | 3 (0,8 vies) / aucune | 208 / 161 | perdu en 109 s |
| 4 | 100 % (10/10) | 18,9 | 100 % (10/10) | 19,7 | 77 / 99 | 3 (0,7 vies) / 6 (0,3 vies) | 239 / 199 | perdu en 98 s |
| 5 | 30 % (3/10) | 1,8 | 100 % (10/10) | 19,5 | 49 / 30 | 3 (7,0 vies) / 3 (0,4 vies) | 146 / 191 | perdu en 84 s |
| 6 | 20 % (2/10) | 1,0 | 100 % (10/10) | 18,0 | 68 / 160 | 4 (8,8 vies) / 6 (1,0 vies) | 160 / 232 | perdu en 82 s |
| 7 | 30 % (3/10) | 0,7 | 90 % (9/10) | 11,9 | 64 / 57 | 2 (4,8 vies) / 7 (2,5 vies) | 191 / 262 | perdu en 89 s |
| 8 | 60 % (6/10) | 3,1 | 100 % (10/10) | 19,5 | 85 / 36 | 3 (13,8 vies) / 3 (0,5 vies) | 244 / 294 | perdu en 92 s |
| 9 | 50 % (5/10) | 5,6 | 100 % (10/10) | 18,4 | 134 / 91 | 4 (6,2 vies) / 5 (0,9 vies) | 275 / 350 | perdu en 87 s |
| 10 | 100 % (10/10) | 16,6 | 100 % (10/10) | 20,0 | 194 / 219 | 11 (1,1 vies) / aucune | 493 / 423 | perdu en 66 s |

### Charlie : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 70 % (7/10) | 6,2 | 100 % (10/10) | 15,0 | 35 / 118 | 3 (3,6 vies) / aucune | 165 / 127 | perdu en 119 s |
| 2 | 10 % (1/10) | 0,1 | 100 % (10/10) | 15,0 | 45 / 204 | 2 (7,3 vies) / aucune | 125 / 129 | perdu en 107 s |
| 3 | 80 % (8/10) | 7,1 | 100 % (10/10) | 15,0 | 45 / 181 | 3 (3,0 vies) / aucune | 196 / 163 | perdu en 108 s |
| 4 | 80 % (8/10) | 7,3 | 100 % (10/10) | 15,0 | 65 / 171 | 3 (3,9 vies) / aucune | 220 / 202 | perdu en 97 s |
| 5 | 0 % (0/10) | 0,0 | 40 % (4/10) | 2,9 | 55 / 45 | 2 (6,1 vies) / 7 (3,4 vies) | 90 / 167 | perdu en 70 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 11,9 | 49 / 26 | 2 (5,9 vies) / 6 (1,9 vies) | 113 / 236 | perdu en 79 s |
| 7 | 0 % (0/10) | 0,0 | 40 % (4/10) | 2,0 | 75 / 71 | 2 (7,3 vies) / 6 (5,7 vies) | 98 / 219 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 11,0 | 41 / 98 | 3 (11,4 vies) / 3 (3,7 vies) | 93 / 296 | perdu en 91 s |
| 9 | 10 % (1/10) | 1,0 | 70 % (7/10) | 5,3 | 73 / 59 | 3 (6,5 vies) / 5 (3,7 vies) | 134 / 304 | perdu en 75 s |
| 10 | 20 % (2/10) | 2,0 | 100 % (10/10) | 10,3 | 107 / 210 | 11 (4,0 vies) / 6 (3,3 vies) | 349 / 454 | perdu en 66 s |

Tours choisies par le soigneux en Matou avec Charlie : la plus choisie, Grenier des Griffes (construction) (541 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | équilibrée, diversité 1 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 |
| 2 | tir, diversité 1 | artillerie, diversité 1 | artillerie, diversité 1 |
| 3 | magie, diversité 1 | tir, diversité 0.4 | tir, diversité 0.4 |
| 4 | tir, diversité 1 | magie, diversité 0.4 | tir, diversité 1 |
| 5 | artillerie, diversité 1 | caserne, diversité 1 | équilibrée, diversité 0.4 |
| 6 | équilibrée, diversité 1 | équilibrée, diversité 1 | magie, diversité 0.4 |
| 7 | caserne, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 8 | magie, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 9 | caserne, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 10 | artillerie, diversité 0.4 | caserne, diversité 0.4 | équilibrée, diversité 0.4 |

## Pollen

Héros : Pollen, Trois-Pattes. Bonus de famille : Artillerie — PV des soldats +0 %, cadence +15 %, critique +0 points, prix −10 %. Sorts : Pièges à Ressort (recharge 30 s), Ingéniosité (recharge 50 s). Tour divine : Atelier Boiteux (200 arêtes).

### Pollen : Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 90 / 96 | aucune / aucune | 160 / 127 | perdu en 176 s |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 121 / 68 | aucune / aucune | 172 / 130 | perdu en 156 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 103 / 86 | aucune / aucune | 199 / 161 | perdu en 193 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 116 / 233 | aucune / aucune | 230 / 195 | perdu en 191 s |
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
| 1 | 100 % (10/10) | 15,1 | 100 % (10/10) | 19,5 | 37 / 163 | 5 (2,3 vies) / 6 (0,5 vies) | 179 / 154 | perdu en 139 s |
| 2 | 50 % (5/10) | 8,8 | 100 % (10/10) | 19,3 | 52 / 66 | 4 (6,6 vies) / 5 (0,7 vies) | 168 / 155 | perdu en 115 s |
| 3 | 100 % (10/10) | 19,3 | 90 % (9/10) | 17,5 | 59 / 151 | 5 (0,7 vies) / 5 (1,5 vies) | 211 / 177 | perdu en 137 s |
| 4 | 90 % (9/10) | 18,0 | 100 % (10/10) | 20,0 | 89 / 74 | 5 (1,2 vies) / aucune | 232 / 208 | perdu en 126 s |
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
| 1 | 40 % (4/10) | 4,9 | 20 % (2/10) | 3,0 | 57 / 87 | 5 (4,1 vies) / 6 (10,9 vies) | 168 / 153 | perdu en 121 s |
| 2 | 30 % (3/10) | 3,7 | 100 % (10/10) | 15,0 | 44 / 60 | 3 (6,5 vies) / aucune | 148 / 150 | perdu en 114 s |
| 3 | 90 % (9/10) | 9,3 | 100 % (10/10) | 11,7 | 44 / 42 | 5 (3,7 vies) / 7 (1,9 vies) | 208 / 204 | perdu en 127 s |
| 4 | 80 % (8/10) | 8,1 | 100 % (10/10) | 15,0 | 70 / 63 | 5 (2,5 vies) / aucune | 224 / 215 | perdu en 101 s |
| 5 | 20 % (2/10) | 1,6 | 90 % (9/10) | 6,1 | 79 / 58 | 4 (6,2 vies) / 4 (5,7 vies) | 150 / 191 | perdu en 88 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,0 | 44 / 81 | 4 (10,7 vies) / 4 (2,0 vies) | 123 / 240 | perdu en 82 s |
| 7 | 20 % (2/10) | 2,0 | 70 % (7/10) | 4,7 | 66 / 62 | 5 (6,9 vies) / 5 (5,4 vies) | 174 / 240 | perdu en 100 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 5,1 | 54 / 62 | 3 (15,0 vies) / 3 (8,6 vies) | 94 / 297 | perdu en 93 s |
| 9 | 20 % (2/10) | 2,4 | 100 % (10/10) | 14,5 | 74 / 94 | 4 (4,7 vies) / 4 (0,4 vies) | 167 / 345 | perdu en 75 s |
| 10 | 80 % (8/10) | 8,6 | 100 % (10/10) | 14,6 | 161 / 239 | 12 (2,1 vies) / 6 (0,4 vies) | 463 / 421 | perdu en 77 s |

Tours choisies par le soigneux en Matou avec Pollen : la plus choisie, Catapulte du Rempart (construction) (642 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | équilibrée, diversité 0.4 | caserne, diversité 1 | tir, diversité 1 |
| 2 | tir, diversité 0.4 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 |
| 3 | équilibrée, diversité 1 | magie, diversité 1 | artillerie, diversité 1 |
| 4 | caserne, diversité 1 | magie, diversité 0.4 | tir, diversité 0.4 |
| 5 | caserne, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 1 |
| 6 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 7 | caserne, diversité 1 | artillerie, diversité 1 | caserne, diversité 0.4 |
| 8 | équilibrée, diversité 1 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 9 | artillerie, diversité 0.4 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 |
| 10 | équilibrée, diversité 0.4 | caserne, diversité 0.4 | magie, diversité 1 |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus -0,3) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.

| Dieu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Corrélation de rang | Niveau le plus dur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | 19,1 | 6,9 | 19,3 | 19,5 | 3,3 | 3,8 | 4,0 | 4,7 | 8,0 | 15,3 | -0,3 | 5 (3,3 vies) |
| Charlie | 19,6 | 5,6 | 18,1 | 18,9 | 1,8 | 1,0 | 0,7 | 3,1 | 5,6 | 16,6 | -0,4 | 7 (0,7 vies) |
| Pollen | 15,1 | 8,8 | 19,3 | 18,0 | 13,1 | 6,2 | 12,6 | 4,5 | 9,7 | 18,0 | -0,2 | 8 (4,5 vies) |
| **Moyenne des dieux** | 17,9 | 7,1 | 18,9 | 18,8 | 6,1 | 3,7 | 5,8 | 4,1 | 7,8 | 16,6 | -0,4 | 6 (3,7 vies) |

Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).

## Usage des sorts par le soigneux

Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).

| Dieu | Sort | Recharge | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- | --- | --- |
| Plume | Voile de Nuit | 30 s | 3,4 sur 7,0 (48 %) | 5,9 sur 8,1 (73 %) | 5,6 sur 7,0 (79 %) |
| Plume | Griffes d’Ombre | 40 s | 5,2 sur 5,3 (98 %) | 6,1 sur 6,2 (98 %) | 5,3 sur 5,3 (100 %) |
| Charlie | Chute du Colosse | 25 s | 9,1 sur 9,2 (98 %) | 9,5 sur 9,6 (100 %) | 9,2 sur 9,3 (99 %) |
| Charlie | Renforts | 20 s | 7,2 sur 11,7 (62 %) | 9,3 sur 12,3 (76 %) | 9,3 sur 12,0 (77 %) |
| Pollen | Pièges à Ressort | 30 s | 5,9 sur 7,7 (76 %) | 7,1 sur 8,4 (85 %) | 7,3 sur 8,3 (87 %) |
| Pollen | Ingéniosité | 50 s | 3,2 sur 4,7 (68 %) | 4,2 sur 5,0 (83 %) | 4,0 sur 5,0 (81 %) |

## Tours divines

Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 200 arêtes avant la fin du niveau).
Sans tour divine : le même soigneux, mêmes graines, dépense ces 200 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.

| Dieu | Tour divine | Difficulté | Construite | Avec : victoires / vies | Sans : victoires / vies | Gain de la tour divine |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | Matou | 87 % | 100 % / 18,5 | 100 % / 18,6 | +0 points / −0,1 vies |
| Plume | Sanctuaire de l’Ombre | Vieux Sage | 51 % | 78 % / 8,3 | 70 % / 8,2 | +8 points / +0,0 vies |
| Charlie | Totem du Colosse | Matou | 75 % | 99 % / 18,7 | 100 % / 19,0 | −1 points / −0,3 vies |
| Charlie | Totem du Colosse | Vieux Sage | 78 % | 85 % / 10,3 | 83 % / 10,4 | +2 points / −0,1 vies |
| Pollen | Atelier Boiteux | Matou | 97 % | 99 % / 19,0 | 99 % / 18,2 | +0 points / +0,7 vies |
| Pollen | Atelier Boiteux | Vieux Sage | 83 % | 88 % / 10,3 | 92 % / 10,5 | −4 points / −0,2 vies |

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
| Plume | Plume, l’Ombre Première (avatar) | Duelliste, esquive et critiques | 100 % | 18,5 | — | 71 % | 10,4 | — |
| Plume | Suie | Assassin, exécute les blessés | 100 % | 18,3 | −0,2 vies | 54 % | 7,3 | −3,1 vies |
| Plume | Corbeau | Tireur, perce l’armure | 100 % | 19,0 | +0,5 vies | 77 % | 11,7 | +1,3 vies |
| Charlie | Charlie, le Colosse (avatar) | Tank, frappe de zone qui étourdit | 99 % | 18,7 | — | 65 % | 9,1 | — |
| Charlie | Mastoc | Provocation, bloque trois ennemis | 94 % | 17,7 | −1,0 vies | 60 % | 7,8 | −1,3 vies |
| Charlie | Brise-Os | Berserker, plus fort blessé | 99 % | 17,9 | −0,8 vies | 58 % | 8,3 | −0,8 vies |
| Pollen | Pollen, Trois-Pattes (avatar) | Pose des pièges, tire à la fronde | 99 % | 19,0 | — | 77 % | 12,5 | — |
| Pollen | Rouage | Ingénieur, construit une tourelle | 99 % | 18,8 | −0,2 vies | 78 % | 12,9 | +0,4 vies |
| Pollen | Lanterne | Soigneur, magie à distance | 93 % | 17,9 | −1,1 vies | 78 % | 13,0 | +0,5 vies |

## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)

L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.
La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.

| Dieu | Bot | De base | Arbre au maximum | Héros niveau 10 | Tout au maximum |
| --- | --- | --- | --- | --- | --- |
| Plume | Soigneux | 78 % / 8,3 | 90 % / 11,1 | 89 % / 10,5 | 96 % / 12,4 |
| Plume | Naïf | 32 % / 3,7 | 39 % / 4,5 | 45 % / 5,6 | 56 % / 6,5 |
| Charlie | Soigneux | 85 % / 10,3 | 89 % / 11,1 | 92 % / 11,8 | 92 % / 12,3 |
| Charlie | Naïf | 27 % / 2,4 | 37 % / 3,9 | 41 % / 4,9 | 49 % / 5,8 |
| Pollen | Soigneux | 88 % / 10,3 | 100 % / 13,3 | 99 % / 12,7 | 100 % / 13,5 |
| Pollen | Naïf | 38 % / 4,1 | 50 % / 5,6 | 55 % / 6,3 | 63 % / 7,6 |

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

## Régions 2 à 10

Les bandes de la région 1 (plus haut) sont mesurées sur chacune des régions 2 à 10, pour les trois dieux : mêmes bots, mêmes graines, mêmes difficultés, courbe de difficulté jugée sur la moyenne des dieux, écart entre dieux comme au jalon 2. Les écarts de Chaton, d’absence de défense et des défis font échouer `npm run balance` ; ceux de Matou et de Vieux Sage (courbe et écart entre dieux compris) sont suspendus (voir bandes.ts) : listés, ils ne bloquent pas.

### Région 2 : les Champs Brûlés

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 166 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 142 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 157 | 0 % (0/30) |
| Matou | Plume | 99 % (99/100) | 54 % (54/100) | 19,5 | 162 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 30 % (30/100) | 16,7 | 132 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 73 % (73/100) | 18,8 | 151 | 0 % (0/30) |
| Vieux Sage | Plume | 96 % (96/100) | 6 % (6/100) | 12,7 | 123 | 0 % (0/30) |
| Vieux Sage | Charlie | 52 % (52/100) | 4 % (4/100) | 5,0 | 92 | 0 % (0/30) |
| Vieux Sage | Pollen | 77 % (77/100) | 17 % (17/100) | 8,4 | 136 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 100 % (30/30) | 63 % (19/30) | 12,0 | 138 | 100 % (30/30) | 13,8 | 0 % (0/9) |
| 12 | 100 % (30/30) | 57 % (17/30) | 8,2 | 208 | 97 % (29/30) | 12,0 | 0 % (0/9) |
| 13 | 100 % (30/30) | 47 % (14/30) | 5,1 | 139 | 87 % (26/30) | 8,0 | 0 % (0/9) |
| 14 | 100 % (30/30) | 73 % (22/30) | 8,9 | 105 | 33 % (10/30) | 4,2 | 0 % (0/9) |
| 15 | 97 % (29/30) | 37 % (11/30) | 4,2 | 93 | 70 % (21/30) | 4,1 | 0 % (0/9) |
| 16 | 100 % (30/30) | 47 % (14/30) | 6,9 | 129 | 100 % (30/30) | 14,1 | 0 % (0/9) |
| 17 | 100 % (30/30) | 27 % (8/30) | 3,2 | 175 | 53 % (16/30) | 4,5 | 0 % (0/9) |
| 18 | 100 % (30/30) | 50 % (15/30) | 4,7 | 132 | 43 % (13/30) | 4,6 | 0 % (0/9) |
| 19 | 100 % (30/30) | 83 % (25/30) | 9,5 | 176 | 100 % (30/30) | 13,4 | 0 % (0/9) |
| 20 | 100 % (30/30) | 40 % (12/30) | 4,6 | 187 | 67 % (20/30) | 8,4 | 0 % (0/9) |

Écarts aux bandes : 12

- Matou (Plume) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 19 laisse 274 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 12 laisse 265 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 73 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,4, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 96 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 52 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (96 %) et Charlie (52 %) sont à 44 points l'un de l'autre, il en faut au plus 10

### Région 3 : le Bourg des Bûchers

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 812 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 603 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 868 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 80 % (80/100) | 19,7 | 167 | 0 % (0/30) |
| Matou | Charlie | 98 % (98/100) | 35 % (35/100) | 15,7 | 125 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 42 % (42/100) | 18,6 | 130 | 0 % (0/30) |
| Vieux Sage | Plume | 90 % (90/100) | 7 % (7/100) | 11,8 | 103 | 0 % (0/30) |
| Vieux Sage | Charlie | 34 % (34/100) | 1 % (1/100) | 2,4 | 103 | 0 % (0/30) |
| Vieux Sage | Pollen | 59 % (59/100) | 1 % (1/100) | 7,0 | 102 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 100 % (30/30) | 57 % (17/30) | 7,3 | 133 | 47 % (14/30) | 6,1 | 0 % (0/9) |
| 22 | 93 % (28/30) | 57 % (17/30) | 6,8 | 85 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 23 | 100 % (30/30) | 50 % (15/30) | 7,1 | 121 | 60 % (18/30) | 7,6 | 0 % (0/9) |
| 24 | 100 % (30/30) | 60 % (18/30) | 5,6 | 119 | 90 % (27/30) | 11,0 | 0 % (0/9) |
| 25 | 100 % (30/30) | 37 % (11/30) | 5,1 | 149 | 87 % (26/30) | 8,9 | 0 % (0/9) |
| 26 | 100 % (30/30) | 43 % (13/30) | 4,7 | 158 | 97 % (29/30) | 8,9 | 0 % (0/9) |
| 27 | 100 % (30/30) | 63 % (19/30) | 8,4 | 93 | 70 % (21/30) | 10,0 | 0 % (0/9) |
| 28 | 100 % (30/30) | 37 % (11/30) | 4,0 | 154 | 33 % (10/30) | 3,3 | 0 % (0/9) |
| 29 | 100 % (30/30) | 27 % (8/30) | 4,5 | 121 | 67 % (20/30) | 7,8 | 0 % (0/9) |
| 30 | 100 % (30/30) | 93 % (28/30) | 17,5 | 271 | 27 % (8/30) | 1,9 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot naïf gagne 80 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 30 laisse 294 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 98 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 30 laisse 289 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,2, elle doit être d'au plus -0,6
- Matou : le niveau 30 (17,5 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,9, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 90 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 34 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 59 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (90 %) et Charlie (34 %) sont à 56 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,7 vies) et Charlie (15,7 vies) sont à 4 vies l'un de l'autre, il en faut au plus 3

### Région 4 : les Marais de l’Ordalie

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 618 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 420 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 595 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 77 % (77/100) | 19,8 | 181 | 0 % (0/30) |
| Matou | Charlie | 95 % (95/100) | 28 % (28/100) | 16,1 | 108 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 43 % (43/100) | 18,4 | 143 | 0 % (0/30) |
| Vieux Sage | Plume | 87 % (87/100) | 1 % (1/100) | 11,2 | 120 | 0 % (0/30) |
| Vieux Sage | Charlie | 8 % (8/100) | 0 % (0/100) | 0,4 | 91 | 0 % (0/30) |
| Vieux Sage | Pollen | 53 % (53/100) | 3 % (3/100) | 5,4 | 113 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 100 % (30/30) | 63 % (19/30) | 10,8 | 150 | 33 % (10/30) | 4,2 | 0 % (0/9) |
| 32 | 100 % (30/30) | 57 % (17/30) | 9,1 | 88 | 73 % (22/30) | 6,7 | 0 % (0/9) |
| 33 | 100 % (30/30) | 47 % (14/30) | 6,5 | 135 | 63 % (19/30) | 8,2 | 0 % (0/9) |
| 34 | 100 % (30/30) | 43 % (13/30) | 5,8 | 220 | 73 % (22/30) | 8,9 | 0 % (0/9) |
| 35 | 100 % (30/30) | 40 % (12/30) | 5,0 | 150 | 37 % (11/30) | 2,8 | 0 % (0/9) |
| 36 | 100 % (30/30) | 47 % (14/30) | 5,0 | 121 | 67 % (20/30) | 9,2 | 0 % (0/9) |
| 37 | 100 % (30/30) | 40 % (12/30) | 6,8 | 116 | 3 % (1/30) | 0,0 | 0 % (0/9) |
| 38 | 97 % (29/30) | 70 % (21/30) | 8,8 | 109 | 33 % (10/30) | 4,9 | 0 % (0/9) |
| 39 | 100 % (30/30) | 30 % (9/30) | 3,8 | 143 | 70 % (21/30) | 9,0 | 0 % (0/9) |
| 40 | 87 % (26/30) | 57 % (17/30) | 7,0 | 208 | 40 % (12/30) | 2,4 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot naïf gagne 77 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 34 laisse 329 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 40 laisse 252 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 95 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 28 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,4, elle doit être d'au plus -0,6
- Matou : le niveau 40 (7 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 87 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 8 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 53 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (87 %) et Charlie (8 %) sont à 79 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,8 vies) et Charlie (16,1 vies) sont à 3,6 vies l'un de l'autre, il en faut au plus 3

### Région 5 : la Ville Pestiférée

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 1303 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,9 | 1183 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 24,9 | 1571 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 49 % (49/100) | 19,7 | 167 | 0 % (0/30) |
| Matou | Charlie | 95 % (95/100) | 11 % (11/100) | 15,0 | 130 | 0 % (0/30) |
| Matou | Pollen | 99 % (99/100) | 33 % (33/100) | 18,8 | 138 | 0 % (0/30) |
| Vieux Sage | Plume | 70 % (70/100) | 0 % (0/100) | 8,3 | 112 | 0 % (0/30) |
| Vieux Sage | Charlie | 10 % (10/100) | 0 % (0/100) | 1,4 | 76 | 0 % (0/30) |
| Vieux Sage | Pollen | 35 % (35/100) | 3 % (3/100) | 3,7 | 103 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | 100 % (30/30) | 53 % (16/30) | 8,6 | 78 | 100 % (30/30) | 12,6 | 0 % (0/9) |
| 42 | 100 % (30/30) | 50 % (15/30) | 8,8 | 165 | 33 % (10/30) | 4,2 | 0 % (0/9) |
| 43 | 87 % (26/30) | 7 % (2/30) | 1,3 | 156 | 50 % (15/30) | 7,0 | 0 % (0/9) |
| 44 | 93 % (28/30) | 33 % (10/30) | 4,4 | 146 | 23 % (7/30) | 2,6 | 0 % (0/9) |
| 45 | 100 % (30/30) | 23 % (7/30) | 2,0 | 111 | 30 % (9/30) | 2,6 | 0 % (0/9) |
| 46 | 100 % (30/30) | 10 % (3/30) | 1,6 | 140 | 30 % (9/30) | 4,0 | 0 % (0/9) |
| 47 | 100 % (30/30) | 30 % (9/30) | 1,9 | 86 | 13 % (4/30) | 0,7 | 0 % (0/9) |
| 48 | 100 % (30/30) | 23 % (7/30) | 2,1 | 170 | 37 % (11/30) | 2,6 | 0 % (0/9) |
| 49 | 100 % (30/30) | 47 % (14/30) | 7,6 | 116 | 67 % (20/30) | 8,4 | 0 % (0/9) |
| 50 | 100 % (30/30) | 33 % (10/30) | 4,6 | 282 | 0 % (0/30) | 0,0 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 48 laisse 253 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 50 laisse 281 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 95 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 11 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 50 laisse 305 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 50 laisse 261 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,1, elle doit être d'au plus -0,6
- Matou : le niveau 50 (4,6 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 10 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 35 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (70 %) et Charlie (10 %) sont à 60 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,7 vies) et Charlie (15 vies) sont à 4,7 vies l'un de l'autre, il en faut au plus 3

### Région 6 : le Charnier

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 335 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 271 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 411 | 0 % (0/30) |
| Matou | Plume | 90 % (90/100) | 72 % (72/100) | 17,9 | 120 | 0 % (0/30) |
| Matou | Charlie | 87 % (87/100) | 14 % (14/100) | 13,0 | 112 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 69 % (69/100) | 19,1 | 133 | 0 % (0/30) |
| Vieux Sage | Plume | 70 % (70/100) | 2 % (2/100) | 8,4 | 99 | 0 % (0/30) |
| Vieux Sage | Charlie | 10 % (10/100) | 1 % (1/100) | 1,5 | 82 | 0 % (0/30) |
| Vieux Sage | Pollen | 20 % (20/100) | 5 % (5/100) | 2,9 | 101 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 51 | 100 % (30/30) | 70 % (21/30) | 12,7 | 100 | 100 % (30/30) | 14,4 | 0 % (0/9) |
| 52 | 100 % (30/30) | 37 % (11/30) | 5,0 | 92 | 30 % (9/30) | 2,4 | 0 % (0/9) |
| 53 | 93 % (28/30) | 40 % (12/30) | 5,6 | 129 | 3 % (1/30) | 0,2 | 0 % (0/9) |
| 54 | 100 % (30/30) | 53 % (16/30) | 7,6 | 131 | 27 % (8/30) | 2,7 | 0 % (0/9) |
| 55 | 80 % (24/30) | 70 % (21/30) | 9,8 | 158 | 27 % (8/30) | 3,9 | 0 % (0/9) |
| 56 | 100 % (30/30) | 43 % (13/30) | 5,3 | 104 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 57 | 100 % (30/30) | 40 % (12/30) | 5,6 | 72 | 33 % (10/30) | 3,8 | 0 % (0/9) |
| 58 | 93 % (28/30) | 63 % (19/30) | 10,4 | 144 | 13 % (4/30) | 0,5 | 0 % (0/9) |
| 59 | 100 % (30/30) | 43 % (13/30) | 3,2 | 71 | 67 % (20/30) | 9,9 | 0 % (0/9) |
| 60 | 57 % (17/30) | 57 % (17/30) | 7,7 | 217 | 0 % (0/30) | 0,0 | 0 % (0/9) |

Écarts aux bandes : 14

- Matou (Plume) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 72 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 87 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 14 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 60 laisse 273 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,1, elle doit être d'au plus -0,6
- Matou : le niveau 60 (7,7 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,5, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 10 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 20 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (70 %) et Charlie (10 %) sont à 60 points l'un de l'autre, il en faut au plus 10
- Matou : Pollen (19,1 vies) et Charlie (13 vies) sont à 6,1 vies l'un de l'autre, il en faut au plus 3

### Région 7 : la Croisade

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 233 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 192 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 190 | 0 % (0/30) |
| Matou | Plume | 99 % (99/100) | 64 % (64/100) | 18,6 | 179 | 0 % (0/30) |
| Matou | Charlie | 92 % (92/100) | 27 % (27/100) | 14,8 | 91 | 0 % (0/30) |
| Matou | Pollen | 94 % (94/100) | 82 % (82/100) | 17,5 | 93 | 0 % (0/30) |
| Vieux Sage | Plume | 81 % (81/100) | 0 % (0/100) | 9,4 | 112 | 0 % (0/30) |
| Vieux Sage | Charlie | 6 % (6/100) | 0 % (0/100) | 0,2 | 72 | 0 % (0/30) |
| Vieux Sage | Pollen | 7 % (7/100) | 0 % (0/100) | 0,3 | 117 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 61 | 100 % (30/30) | 60 % (18/30) | 5,9 | 133 | 33 % (10/30) | 4,9 | 0 % (0/9) |
| 62 | 100 % (30/30) | 50 % (15/30) | 5,7 | 103 | 30 % (9/30) | 2,3 | 0 % (0/9) |
| 63 | 100 % (30/30) | 43 % (13/30) | 4,4 | 70 | 33 % (10/30) | 2,6 | 0 % (0/9) |
| 64 | 100 % (30/30) | 50 % (15/30) | 5,0 | 153 | 3 % (1/30) | 0,1 | 0 % (0/9) |
| 65 | 100 % (30/30) | 80 % (24/30) | 11,6 | 98 | 33 % (10/30) | 3,2 | 0 % (0/9) |
| 66 | 100 % (30/30) | 77 % (23/30) | 10,1 | 87 | 57 % (17/30) | 5,8 | 0 % (0/9) |
| 67 | 100 % (30/30) | 70 % (21/30) | 7,9 | 185 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 68 | 100 % (30/30) | 40 % (12/30) | 4,6 | 99 | 33 % (10/30) | 3,4 | 0 % (0/9) |
| 69 | 100 % (30/30) | 63 % (19/30) | 5,0 | 175 | 53 % (16/30) | 5,6 | 0 % (0/9) |
| 70 | 50 % (15/30) | 43 % (13/30) | 2,4 | 103 | 3 % (1/30) | 0,1 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 64 laisse 292 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 67 laisse 262 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 92 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 27 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux gagne 94 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 82 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,3, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 6 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 7 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (81 %) et Charlie (6 %) sont à 75 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (18,6 vies) et Charlie (14,8 vies) sont à 3,8 vies l'un de l'autre, il en faut au plus 3

### Région 8 : le Monastère Noir

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 203 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 163 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 184 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 65 % (65/100) | 20,0 | 165 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 28 % (28/100) | 17,6 | 120 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 84 % (84/100) | 19,0 | 140 | 0 % (0/30) |
| Vieux Sage | Plume | 95 % (95/100) | 0 % (0/100) | 11,6 | 132 | 0 % (0/30) |
| Vieux Sage | Charlie | 3 % (3/100) | 0 % (0/100) | 0,1 | 74 | 0 % (0/30) |
| Vieux Sage | Pollen | 30 % (30/100) | 2 % (2/100) | 3,0 | 99 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 71 | 100 % (30/30) | 40 % (12/30) | 5,8 | 88 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 72 | 100 % (30/30) | 80 % (24/30) | 12,5 | 124 | 50 % (15/30) | 5,3 | 0 % (0/9) |
| 73 | 100 % (30/30) | 73 % (22/30) | 12,8 | 181 | 70 % (21/30) | 9,9 | 0 % (0/9) |
| 74 | 100 % (30/30) | 60 % (18/30) | 6,8 | 119 | 27 % (8/30) | 1,6 | 0 % (0/9) |
| 75 | 100 % (30/30) | 77 % (23/30) | 11,0 | 124 | 63 % (19/30) | 7,5 | 0 % (0/9) |
| 76 | 100 % (30/30) | 43 % (13/30) | 5,4 | 89 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 77 | 100 % (30/30) | 50 % (15/30) | 6,6 | 115 | 33 % (10/30) | 2,3 | 0 % (0/9) |
| 78 | 100 % (30/30) | 80 % (24/30) | 12,5 | 142 | 57 % (17/30) | 6,7 | 0 % (0/9) |
| 79 | 100 % (30/30) | 37 % (11/30) | 4,2 | 128 | 27 % (8/30) | 0,5 | 0 % (0/9) |
| 80 | 100 % (30/30) | 50 % (15/30) | 6,8 | 307 | 33 % (10/30) | 5,0 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 73 laisse 364 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 80 laisse 292 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot naïf gagne 28 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 80 laisse 329 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 84 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 80 laisse 299 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,3, elle doit être d'au plus -0,6
- Matou : le niveau 80 (6,8 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 95 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 3 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 30 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (95 %) et Charlie (3 %) sont à 92 points l'un de l'autre, il en faut au plus 10

### Région 9 : la Cité du Roi

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 213 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,9 | 189 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 180 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 51 % (51/100) | 18,3 | 148 | 0 % (0/30) |
| Matou | Charlie | 93 % (93/100) | 21 % (21/100) | 13,0 | 89 | 0 % (0/30) |
| Matou | Pollen | 90 % (90/100) | 63 % (63/100) | 15,6 | 100 | 0 % (0/30) |
| Vieux Sage | Plume | 86 % (86/100) | 0 % (0/100) | 8,9 | 102 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 77 | 0 % (0/30) |
| Vieux Sage | Pollen | 6 % (6/100) | 0 % (0/100) | 0,2 | 74 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 81 | 100 % (30/30) | 40 % (12/30) | 3,5 | 76 | 33 % (10/30) | 4,6 | 0 % (0/9) |
| 82 | 100 % (30/30) | 27 % (8/30) | 1,2 | 140 | 33 % (10/30) | 4,2 | 0 % (0/9) |
| 83 | 100 % (30/30) | 33 % (10/30) | 2,0 | 71 | 33 % (10/30) | 3,6 | 0 % (0/9) |
| 84 | 100 % (30/30) | 30 % (9/30) | 3,2 | 108 | 33 % (10/30) | 4,4 | 0 % (0/9) |
| 85 | 100 % (30/30) | 67 % (20/30) | 7,0 | 161 | 33 % (10/30) | 3,5 | 0 % (0/9) |
| 86 | 100 % (30/30) | 70 % (21/30) | 9,2 | 152 | 17 % (5/30) | 1,8 | 0 % (0/9) |
| 87 | 100 % (30/30) | 53 % (16/30) | 3,5 | 107 | 53 % (16/30) | 4,1 | 0 % (0/9) |
| 88 | 100 % (30/30) | 43 % (13/30) | 2,9 | 67 | 33 % (10/30) | 1,3 | 0 % (0/9) |
| 89 | 100 % (30/30) | 40 % (12/30) | 2,9 | 129 | 33 % (10/30) | 2,6 | 0 % (0/9) |
| 90 | 43 % (13/30) | 47 % (14/30) | 1,5 | 114 | 3 % (1/30) | 0,1 | 0 % (0/9) |

Écarts aux bandes : 13

- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 93 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 21 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,1, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 86 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 6 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (86 %) et Charlie (0 %) sont à 86 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (18,3 vies) et Charlie (13 vies) sont à 5,3 vies l'un de l'autre, il en faut au plus 3

### Région 10 : la Cathédrale du Soleil Blême

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 24,8 | 218 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,8 | 185 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 174 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 48 % (48/100) | 19,8 | 173 | 0 % (0/30) |
| Matou | Charlie | 100 % (100/100) | 23 % (23/100) | 17,9 | 146 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 63 % (63/100) | 19,6 | 161 | 0 % (0/30) |
| Vieux Sage | Plume | 99 % (99/100) | 0 % (0/100) | 13,0 | 146 | 0 % (0/30) |
| Vieux Sage | Charlie | 15 % (15/100) | 0 % (0/100) | 1,1 | 115 | 0 % (0/30) |
| Vieux Sage | Pollen | 36 % (36/100) | 5 % (5/100) | 3,1 | 89 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 91 | 100 % (30/30) | 63 % (19/30) | 10,1 | 68 | 53 % (16/30) | 6,5 | 0 % (0/9) |
| 92 | 100 % (30/30) | 37 % (11/30) | 5,9 | 163 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 93 | 100 % (30/30) | 43 % (13/30) | 6,8 | 130 | 80 % (24/30) | 10,7 | 0 % (0/9) |
| 94 | 100 % (30/30) | 77 % (23/30) | 11,0 | 89 | 57 % (17/30) | 4,9 | 0 % (0/9) |
| 95 | 100 % (30/30) | 17 % (5/30) | 1,5 | 231 | 67 % (20/30) | 8,3 | 0 % (0/9) |
| 96 | 100 % (30/30) | 27 % (8/30) | 3,1 | 163 | 33 % (10/30) | 4,9 | 0 % (0/9) |
| 97 | 100 % (30/30) | 50 % (15/30) | 6,1 | 91 | 33 % (10/30) | 3,9 | 0 % (0/9) |
| 98 | 100 % (30/30) | 50 % (15/30) | 4,8 | 165 | 30 % (9/30) | 2,0 | 0 % (0/9) |
| 99 | 100 % (30/30) | 37 % (11/30) | 3,6 | 124 | 60 % (18/30) | 6,1 | 0 % (0/9) |
| 100 | 100 % (30/30) | 47 % (14/30) | 4,3 | 380 | 53 % (16/30) | 4,6 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 92 laisse 292 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 100 laisse 359 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot naïf gagne 23 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 95 laisse 318 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 100 laisse 420 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 96 laisse 256 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le niveau 100 laisse 361 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,5, elle doit être d'au plus -0,6
- Matou : le niveau 100 (4,3 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Vieux Sage (Plume) : le bot soigneux gagne 99 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 15 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 36 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (99 %) et Charlie (15 %) sont à 84 points l'un de l'autre, il en faut au plus 10

## Défis, régions 1 à 10

Le bot soigneux joue les défis avec les règles de Matou, sans objet ni amélioration : Héroïque (1 vie, groupes d’élite) et Fer (toutes les vagues en une, deux familles de tours). Il cherche sa variante sur les graines d’entraînement du défi lui-même, puis joue les dix graines d’évaluation. Bande : entre 40 et 90 % de réussites pour chaque défi de chaque région, trois dieux confondus.

### Région 1 : le Village Affamé

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 99 % (99/100) | 1,0 |
| Héroïque | Charlie | 47 % (47/100) | 0,5 |
| Héroïque | Pollen | 73 % (73/100) | 0,7 |
| Héroïque | les trois | 73 % (219/300) | 0,7 |
| Fer | Plume | 91 % (91/100) | 17,9 |
| Fer | Charlie | 89 % (89/100) | 16,9 |
| Fer | Pollen | 54 % (54/100) | 8,6 |
| Fer | les trois | 78 % (234/300) | 14,5 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 1 | 77 % (23/30) | 100 % (30/30) |
| 2 | 90 % (27/30) | 80 % (24/30) |
| 3 | 87 % (26/30) | 100 % (30/30) |
| 4 | 97 % (29/30) | 67 % (20/30) |
| 5 | 50 % (15/30) | 100 % (30/30) |
| 6 | 77 % (23/30) | 100 % (30/30) |
| 7 | 33 % (10/30) | 67 % (20/30) |
| 8 | 40 % (12/30) | 33 % (10/30) |
| 9 | 83 % (25/30) | 100 % (30/30) |
| 10 | 97 % (29/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 2 : les Champs Brûlés

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 100 % (100/100) | 1,0 |
| Héroïque | Charlie | 34 % (34/100) | 0,3 |
| Héroïque | Pollen | 64 % (64/100) | 0,6 |
| Héroïque | les trois | 66 % (198/300) | 0,7 |
| Fer | Plume | 82 % (82/100) | 16,1 |
| Fer | Charlie | 86 % (86/100) | 16,7 |
| Fer | Pollen | 40 % (40/100) | 8,0 |
| Fer | les trois | 69 % (208/300) | 13,6 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 11 | 100 % (30/30) | 100 % (30/30) |
| 12 | 90 % (27/30) | 100 % (30/30) |
| 13 | 63 % (19/30) | 67 % (20/30) |
| 14 | 63 % (19/30) | 67 % (20/30) |
| 15 | 33 % (10/30) | 63 % (19/30) |
| 16 | 93 % (28/30) | 100 % (30/30) |
| 17 | 43 % (13/30) | 100 % (30/30) |
| 18 | 33 % (10/30) | 57 % (17/30) |
| 19 | 73 % (22/30) | 33 % (10/30) |
| 20 | 67 % (20/30) | 7 % (2/30) |

Écarts aux bandes des défis : aucun.

### Région 3 : le Bourg des Bûchers

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 86 % (86/100) | 0,9 |
| Héroïque | Charlie | 56 % (56/100) | 0,6 |
| Héroïque | Pollen | 73 % (73/100) | 0,7 |
| Héroïque | les trois | 72 % (215/300) | 0,7 |
| Fer | Plume | 88 % (88/100) | 16,2 |
| Fer | Charlie | 58 % (58/100) | 10,4 |
| Fer | Pollen | 40 % (40/100) | 8,0 |
| Fer | les trois | 62 % (186/300) | 11,5 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 21 | 83 % (25/30) | 100 % (30/30) |
| 22 | 93 % (28/30) | 100 % (30/30) |
| 23 | 63 % (19/30) | 47 % (14/30) |
| 24 | 63 % (19/30) | 47 % (14/30) |
| 25 | 77 % (23/30) | 100 % (30/30) |
| 26 | 87 % (26/30) | 67 % (20/30) |
| 27 | 67 % (20/30) | 33 % (10/30) |
| 28 | 47 % (14/30) | 100 % (30/30) |
| 29 | 37 % (11/30) | 0 % (0/30) |
| 30 | 100 % (30/30) | 27 % (8/30) |

Écarts aux bandes des défis : aucun.

### Région 4 : les Marais de l’Ordalie

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 89 % (89/100) | 0,9 |
| Héroïque | Charlie | 19 % (19/100) | 0,2 |
| Héroïque | Pollen | 35 % (35/100) | 0,4 |
| Héroïque | les trois | 48 % (143/300) | 0,5 |
| Fer | Plume | 96 % (96/100) | 17,0 |
| Fer | Charlie | 65 % (65/100) | 12,1 |
| Fer | Pollen | 50 % (50/100) | 10,0 |
| Fer | les trois | 70 % (211/300) | 13,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 31 | 100 % (30/30) | 100 % (30/30) |
| 32 | 33 % (10/30) | 100 % (30/30) |
| 33 | 43 % (13/30) | 40 % (12/30) |
| 34 | 67 % (20/30) | 100 % (30/30) |
| 35 | 43 % (13/30) | 33 % (10/30) |
| 36 | 33 % (10/30) | 67 % (20/30) |
| 37 | 37 % (11/30) | 100 % (30/30) |
| 38 | 53 % (16/30) | 43 % (13/30) |
| 39 | 7 % (2/30) | 20 % (6/30) |
| 40 | 60 % (18/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 5 : la Ville Pestiférée

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 93 % (93/100) | 0,9 |
| Héroïque | Charlie | 26 % (26/100) | 0,3 |
| Héroïque | Pollen | 35 % (35/100) | 0,4 |
| Héroïque | les trois | 51 % (154/300) | 0,5 |
| Fer | Plume | 58 % (58/100) | 10,2 |
| Fer | Charlie | 40 % (40/100) | 8,0 |
| Fer | Pollen | 36 % (36/100) | 7,2 |
| Fer | les trois | 45 % (134/300) | 8,4 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 41 | 100 % (30/30) | 100 % (30/30) |
| 42 | 83 % (25/30) | 100 % (30/30) |
| 43 | 83 % (25/30) | 0 % (0/30) |
| 44 | 33 % (10/30) | 30 % (9/30) |
| 45 | 23 % (7/30) | 13 % (4/30) |
| 46 | 33 % (10/30) | 87 % (26/30) |
| 47 | 27 % (8/30) | 17 % (5/30) |
| 48 | 50 % (15/30) | 0 % (0/30) |
| 49 | 50 % (15/30) | 100 % (30/30) |
| 50 | 30 % (9/30) | 0 % (0/30) |

Écarts aux bandes des défis : aucun.

### Région 6 : le Charnier

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 90 % (90/100) | 0,9 |
| Héroïque | Charlie | 13 % (13/100) | 0,1 |
| Héroïque | Pollen | 62 % (62/100) | 0,6 |
| Héroïque | les trois | 55 % (165/300) | 0,6 |
| Fer | Plume | 91 % (91/100) | 16,9 |
| Fer | Charlie | 53 % (53/100) | 10,3 |
| Fer | Pollen | 41 % (41/100) | 8,0 |
| Fer | les trois | 62 % (185/300) | 11,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 51 | 100 % (30/30) | 100 % (30/30) |
| 52 | 53 % (16/30) | 100 % (30/30) |
| 53 | 53 % (16/30) | 67 % (20/30) |
| 54 | 73 % (22/30) | 100 % (30/30) |
| 55 | 33 % (10/30) | 13 % (4/30) |
| 56 | 33 % (10/30) | 43 % (13/30) |
| 57 | 63 % (19/30) | 100 % (30/30) |
| 58 | 67 % (20/30) | 23 % (7/30) |
| 59 | 67 % (20/30) | 33 % (10/30) |
| 60 | 7 % (2/30) | 37 % (11/30) |

Écarts aux bandes des défis : aucun.

### Région 7 : la Croisade

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 87 % (87/100) | 0,9 |
| Héroïque | Charlie | 9 % (9/100) | 0,1 |
| Héroïque | Pollen | 55 % (55/100) | 0,6 |
| Héroïque | les trois | 50 % (151/300) | 0,5 |
| Fer | Plume | 100 % (100/100) | 19,9 |
| Fer | Charlie | 97 % (97/100) | 16,4 |
| Fer | Pollen | 63 % (63/100) | 11,3 |
| Fer | les trois | 87 % (260/300) | 15,9 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 61 | 23 % (7/30) | 100 % (30/30) |
| 62 | 37 % (11/30) | 100 % (30/30) |
| 63 | 10 % (3/30) | 100 % (30/30) |
| 64 | 50 % (15/30) | 57 % (17/30) |
| 65 | 70 % (21/30) | 67 % (20/30) |
| 66 | 77 % (23/30) | 100 % (30/30) |
| 67 | 47 % (14/30) | 100 % (30/30) |
| 68 | 63 % (19/30) | 77 % (23/30) |
| 69 | 67 % (20/30) | 100 % (30/30) |
| 70 | 60 % (18/30) | 67 % (20/30) |

Écarts aux bandes des défis : aucun.

### Région 8 : le Monastère Noir

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 87 % (87/100) | 0,9 |
| Héroïque | Charlie | 57 % (57/100) | 0,6 |
| Héroïque | Pollen | 61 % (61/100) | 0,6 |
| Héroïque | les trois | 68 % (205/300) | 0,7 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 78 % (78/100) | 14,7 |
| Fer | Pollen | 60 % (60/100) | 10,5 |
| Fer | les trois | 79 % (238/300) | 15,1 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 71 | 97 % (29/30) | 100 % (30/30) |
| 72 | 87 % (26/30) | 100 % (30/30) |
| 73 | 100 % (30/30) | 100 % (30/30) |
| 74 | 97 % (29/30) | 100 % (30/30) |
| 75 | 100 % (30/30) | 100 % (30/30) |
| 76 | 57 % (17/30) | 67 % (20/30) |
| 77 | 30 % (9/30) | 57 % (17/30) |
| 78 | 53 % (16/30) | 100 % (30/30) |
| 79 | 20 % (6/30) | 33 % (10/30) |
| 80 | 43 % (13/30) | 37 % (11/30) |

Écarts aux bandes des défis : aucun.

### Région 9 : la Cité du Roi

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 91 % (91/100) | 0,9 |
| Héroïque | Charlie | 13 % (13/100) | 0,1 |
| Héroïque | Pollen | 54 % (54/100) | 0,5 |
| Héroïque | les trois | 53 % (158/300) | 0,5 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 89 % (89/100) | 14,9 |
| Fer | Pollen | 80 % (80/100) | 14,2 |
| Fer | les trois | 90 % (269/300) | 16,4 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 81 | 100 % (30/30) | 100 % (30/30) |
| 82 | 67 % (20/30) | 100 % (30/30) |
| 83 | 33 % (10/30) | 100 % (30/30) |
| 84 | 53 % (16/30) | 100 % (30/30) |
| 85 | 30 % (9/30) | 50 % (15/30) |
| 86 | 67 % (20/30) | 47 % (14/30) |
| 87 | 27 % (8/30) | 100 % (30/30) |
| 88 | 53 % (16/30) | 100 % (30/30) |
| 89 | 67 % (20/30) | 100 % (30/30) |
| 90 | 30 % (9/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 10 : la Cathédrale du Soleil Blême

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 80 % (80/100) | 0,8 |
| Héroïque | Charlie | 46 % (46/100) | 0,5 |
| Héroïque | Pollen | 75 % (75/100) | 0,8 |
| Héroïque | les trois | 67 % (201/300) | 0,7 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 95 % (95/100) | 18,2 |
| Fer | Pollen | 70 % (70/100) | 12,6 |
| Fer | les trois | 88 % (265/300) | 16,9 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 91 | 100 % (30/30) | 100 % (30/30) |
| 92 | 80 % (24/30) | 100 % (30/30) |
| 93 | 63 % (19/30) | 67 % (20/30) |
| 94 | 43 % (13/30) | 67 % (20/30) |
| 95 | 100 % (30/30) | 100 % (30/30) |
| 96 | 57 % (17/30) | 100 % (30/30) |
| 97 | 30 % (9/30) | 50 % (15/30) |
| 98 | 93 % (28/30) | 100 % (30/30) |
| 99 | 73 % (22/30) | 100 % (30/30) |
| 100 | 30 % (9/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

## Mode infini

Matou, 20 vies, sans amélioration ni objet, chaque dieu avec son avatar, 10 graines par ligne. Résultat d’une partie : la dernière vague terminée (le record). On arrête une partie à la vague 100. Bandes, sur les cartes de la région 1 : la médiane du soigneux est entre la vague 25 et la vague 45 ; le naïf ne passe pas la vague 30 (aucune de ses parties). Les autres cartes sont données à titre d’information. Le soigneux joue une seule variante (équilibrée, diversité 0,4) et lit les 30 premières vagues générées.

| Bot | Dieu | Carte | Médiane | Min à max | Vagues par graine |
| --- | --- | --- | --- | --- | --- |
| Naïf | plume | chaumes (région 1) | 26 | 5 à 27 | 5 9 24 25 26 26 26 27 27 27 |
| Soigneux | plume | chaumes (région 1) | 32 | 31 à 34 | 31 32 32 32 32 32 32 33 33 34 |
| Naïf | charlie | chaumes (région 1) | 25 | 6 à 27 | 6 8 9 19 25 25 25 26 26 27 |
| Soigneux | charlie | chaumes (région 1) | 31 | 9 à 32 | 9 31 31 31 31 31 31 31 32 32 |
| Naïf | pollen | chaumes (région 1) | 26 | 9 à 27 | 9 25 26 26 26 26 27 27 27 27 |
| Soigneux | pollen | chaumes (région 1) | 32 | 32 à 33 | 32 32 32 32 32 32 32 33 33 33 |
| Naïf | plume | gue (région 1) | 13 | 8 à 27 | 8 9 9 9 13 13 25 25 27 27 |
| Soigneux | plume | gue (région 1) | 29.5 | 28 à 30 | 28 29 29 29 29 30 30 30 30 30 |
| Naïf | charlie | gue (région 1) | 9 | 6 à 27 | 6 7 8 8 9 9 13 15 26 27 |
| Soigneux | charlie | gue (région 1) | 29 | 28 à 30 | 28 28 28 28 29 29 29 29 29 30 |
| Naïf | pollen | gue (région 1) | 25.5 | 23 à 27 | 23 25 25 25 25 26 26 26 27 27 |
| Soigneux | pollen | gue (région 1) | 29.5 | 28 à 31 | 28 28 28 29 29 30 30 30 30 31 |
| Naïf | plume | pendus (région 1) | 25 | 9 à 28 | 9 9 13 14 24 26 26 26 27 28 |
| Soigneux | plume | pendus (région 1) | 33 | 31 à 34 | 31 32 33 33 33 33 33 33 33 34 |
| Naïf | charlie | pendus (région 1) | 22 | 8 à 27 | 8 9 9 14 19 25 25 26 26 27 |
| Soigneux | charlie | pendus (région 1) | 32 | 31 à 33 | 31 31 32 32 32 32 32 32 32 33 |
| Naïf | pollen | pendus (région 1) | 25 | 13 à 28 | 13 18 24 25 25 25 26 26 27 28 |
| Soigneux | pollen | pendus (région 1) | 33 | 33 à 34 | 33 33 33 33 33 33 33 34 34 34 |
| Naïf | plume | carrefour (région 1) | 25 | 9 à 26 | 9 9 13 20 25 25 25 25 26 26 |
| Soigneux | plume | carrefour (région 1) | 29 | 28 à 30 | 28 29 29 29 29 29 30 30 30 30 |
| Naïf | charlie | carrefour (région 1) | 21.5 | 8 à 27 | 8 9 14 18 19 24 25 26 26 27 |
| Soigneux | charlie | carrefour (région 1) | 27.5 | 27 à 28 | 27 27 27 27 27 28 28 28 28 28 |
| Naïf | pollen | carrefour (région 1) | 25 | 19 à 27 | 19 24 24 25 25 25 26 26 26 27 |
| Soigneux | pollen | carrefour (région 1) | 28 | 27 à 29 | 27 28 28 28 28 28 29 29 29 29 |
| Naïf | plume | region3 (région 3) | 8 | 6 à 9 | 6 6 7 7 8 8 9 9 9 9 |
| Soigneux | plume | region3 (région 3) | 29 | 16 à 29 | 16 27 27 28 29 29 29 29 29 29 |
| Naïf | charlie | region3 (région 3) | 7 | 6 à 9 | 6 6 6 6 7 7 8 8 9 9 |
| Soigneux | charlie | region3 (région 3) | 9 | 8 à 19 | 8 9 9 9 9 9 16 19 19 19 |
| Naïf | pollen | region3 (région 3) | 9 | 9 à 17 | 9 9 9 9 9 9 13 13 14 17 |
| Soigneux | pollen | region3 (région 3) | 22.5 | 9 à 28 | 9 15 17 19 19 26 27 27 27 28 |
| Naïf | plume | region6 (région 6) | 9 | 9 à 9 | 9 9 9 9 9 9 9 9 9 9 |
| Soigneux | plume | region6 (région 6) | 28 | 25 à 29 | 25 26 26 28 28 28 28 28 29 29 |
| Naïf | charlie | region6 (région 6) | 9 | 8 à 9 | 8 9 9 9 9 9 9 9 9 9 |
| Soigneux | charlie | region6 (région 6) | 19 | 9 à 24 | 9 15 19 19 19 19 19 19 22 24 |
| Naïf | pollen | region6 (région 6) | 12 | 9 à 24 | 9 9 9 9 9 15 16 16 24 24 |
| Soigneux | pollen | region6 (région 6) | 23 | 19 à 25 | 19 19 19 22 23 23 24 24 24 25 |
| Naïf | plume | region10 (région 10) | 9 | 8 à 9 | 8 8 9 9 9 9 9 9 9 9 |
| Soigneux | plume | region10 (région 10) | 22.5 | 9 à 29 | 9 16 17 19 19 26 26 26 28 29 |
| Naïf | charlie | region10 (région 10) | 9 | 6 à 9 | 6 8 8 9 9 9 9 9 9 9 |
| Soigneux | charlie | region10 (région 10) | 9 | 4 à 14 | 4 6 8 9 9 9 9 9 9 14 |
| Naïf | pollen | region10 (région 10) | 9 | 4 à 16 | 4 9 9 9 9 9 9 13 16 16 |
| Soigneux | pollen | region10 (région 10) | 9 | 9 à 19 | 9 9 9 9 9 9 9 16 16 19 |

Écarts aux bandes de l’infini : aucun.
