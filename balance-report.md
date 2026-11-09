# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau des régions 1 à 11 (la région 1 en détail dans cette partie, les régions 2 à 11, les défis et le mode infini plus bas) est rejoué sans
affichage dans les trois difficultés, avec chacun des trois dieux jouant son avatar (sans amélioration ni objet), par deux bots, sur 10 graines chacun (version des données 16).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (case de la grille, famille, niveau,
  spécialisation, bonus et remise de famille du dieu compris), après une petite recherche entre douze variantes (6 préférences × 2 diversités, dont « bloquer puis zone ») jouées sur des graines d’entraînement ;
  place le héros dans la zone de feu de ses tours ; joue les sorts de son dieu selon leur effet (Chute du Colosse sur les grappes, Renforts et Voile de Nuit devant la zone de feu,
  Griffes d’Ombre sur la plus grosse grappe, Pièges à Ressort un peu avant la zone de feu, Ingéniosité au cœur de ses tours) ; construit la tour divine de son dieu dès la troisième tour ;
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter. Il lit la composition des vagues futures, ce qu’un joueur ne voit pas : il est un peu optimiste.
- **Naïf** : construit sur les cases de la grille proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans tour divine, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

**10 écart(s)**, dont 10 aux bandes suspendues de Matou et de Vieux Sage (elles ne bloquent pas : voir bandes.ts) :

- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot naïf gagne 29 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot naïf gagne 90 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,1, elle doit être d'au plus -0,6
- Matou : le niveau 10 (15,9 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 89 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 89 % des parties, la bande est 60 % à 85 %

Bandes, pour chaque dieu : Chaton, le naïf gagne tout ; Matou, le soigneux gagne tout en perdant au moins 1 vie sur 50 % des niveaux et en laissant moins de 250 arêtes inutilisées par niveau, le naïf gagne 30 % à 70 % ;
Vieux Sage, le soigneux gagne 60 % à 85 % ; sans défense on perd. Entre dieux : en Vieux Sage, au plus 10,0 points d’écart de taux de victoire du soigneux ; en Matou, au plus 3 vies d’écart de vies moyennes du soigneux.

### Dieu × difficulté

Victoires et vies sur toutes les parties de la difficulté (moyennes sur tous les niveaux et toutes les graines). Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau, on donne la moyenne et le pire niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins 1 vie.

| Difficulté | Dieu | Naïf : victoires | Soigneux : victoires | Bande du soigneux | Naïf : vies | Soigneux : vies | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % | 100 % | — | 25,0 | 25,0 | 101 / 175 | 0/10 | 0 % |
| Chaton | Charlie | 100 % | 100 % | — | 24,9 | 25,0 | 91 / 119 | 0/10 | 0 % |
| Chaton | Pollen | 100 % | 100 % | — | 25,0 | 25,0 | 107 / 181 | 0/10 | 10 % |
| Matou | Plume | 45 % | 100 % | 100 % | 7,1 | 19,5 | 89 / 225 | 2/10 | 0 % |
| Matou | Charlie | 29 % | 100 % | 100 % | 3,5 | 18,2 | 85 / 202 | 6/10 | 0 % |
| Matou | Pollen | 90 % | 100 % | 100 % | 16,6 | 20,0 | 87 / 145 | 0/10 | 0 % |
| Vieux Sage | Plume | 17 % | 89 % | 60 % à 85 % | 1,5 | 11,2 | 88 / 183 | 5/10 | 0 % |
| Vieux Sage | Charlie | 8 % | 80 % | 60 % à 85 % | 0,6 | 10,5 | 81 / 201 | 6/10 | 0 % |
| Vieux Sage | Pollen | 50 % | 89 % | 60 % à 85 % | 3,9 | 12,8 | 92 / 172 | 3/10 | 0 % |

Bande du naïf : Chaton 100 %, Matou 30 % à 70 %. Matou : au moins 50 % des niveaux avec perte. Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

### Écarts entre dieux

| Mesure du soigneux | Plume | Charlie | Pollen | Écart maximal | Écart permis |
| --- | --- | --- | --- | --- | --- |
| Vieux Sage : taux de victoire | 89 % | 80 % | 89 % | 9,0 points | 10,0 points |
| Matou : vies moyennes | 19,5 | 18,2 | 20,0 | 1,9 vies | 3 vies |

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
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 104 / 65 | aucune / aucune | 242 / 201 | perdu en 126 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 140 / 97 | aucune / aucune | 272 / 233 | perdu en 109 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 138 / 175 | aucune / aucune | 337 / 255 | perdu en 134 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 119 / 115 | aucune / aucune | 304 / 256 | perdu en 103 s |
| 8 | 100 % (10/10) | 24,5 | 100 % (10/10) | 25,0 | 130 / 105 | 1 (0,5 vies) / aucune | 436 / 385 | perdu en 121 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 108 / 113 | aucune / aucune | 546 / 503 | perdu en 125 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 3450 / 126 | aucune / aucune | 618 / 513 | perdu en 110 s |

### Plume : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 80 % (8/10) | 11,4 | 100 % (10/10) | 19,7 | 79 / 118 | 4 (2,9 vies) / 5 (0,2 vies) | 211 / 185 | perdu en 156 s |
| 2 | 50 % (5/10) | 4,9 | 100 % (10/10) | 20,0 | 54 / 114 | 4 (6,0 vies) / aucune | 203 / 184 | perdu en 119 s |
| 3 | 100 % (10/10) | 18,0 | 100 % (10/10) | 20,0 | 61 / 127 | 3 (1,1 vies) / aucune | 209 / 169 | perdu en 127 s |
| 4 | 10 % (1/10) | 1,1 | 100 % (10/10) | 20,0 | 48 / 28 | 3 (9,6 vies) / aucune | 144 / 219 | perdu en 102 s |
| 5 | 10 % (1/10) | 1,3 | 100 % (10/10) | 19,4 | 31 / 70 | 4 (5,8 vies) / 4 (0,4 vies) | 137 / 248 | perdu en 92 s |
| 6 | 10 % (1/10) | 0,9 | 100 % (10/10) | 19,7 | 68 / 27 | 4 (13,3 vies) / 4 (0,2 vies) | 188 / 316 | perdu en 126 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 18,6 | 53 / 63 | 3 (12,2 vies) / 6 (0,9 vies) | 114 / 272 | perdu en 102 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 17,8 | 55 / 42 | 3 (12,2 vies) / 1 (1,5 vies) | 137 / 397 | perdu en 106 s |
| 9 | 90 % (9/10) | 15,1 | 100 % (10/10) | 20,0 | 126 / 78 | 4 (1,7 vies) / aucune | 527 / 511 | perdu en 116 s |
| 10 | 100 % (10/10) | 18,7 | 100 % (10/10) | 20,0 | 149 / 225 | 4 (0,7 vies) / aucune | 630 / 625 | perdu en 98 s |

### Plume : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 56 / 119 | 4 (5,3 vies) / aucune | 183 / 177 | perdu en 131 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,7 | 63 / 40 | 3 (7,2 vies) / 4 (0,2 vies) | 134 / 189 | perdu en 116 s |
| 3 | 80 % (8/10) | 8,0 | 100 % (10/10) | 15,0 | 50 / 176 | 3 (3,2 vies) / aucune | 197 / 185 | perdu en 109 s |
| 4 | 0 % (0/10) | 0,0 | 100 % (10/10) | 9,3 | 10 / 61 | 3 (8,2 vies) / 4 (4,3 vies) | 105 / 221 | perdu en 100 s |
| 5 | 0 % (0/10) | 0,0 | 100 % (10/10) | 12,0 | 5 / 61 | 2 (7,8 vies) / 4 (2,6 vies) | 101 / 251 | perdu en 86 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 10,8 | 50 / 52 | 4 (8,1 vies) / 3 (1,7 vies) | 132 / 324 | perdu en 93 s |
| 7 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 14 / 75 | 3 (8,7 vies) / 6 (5,7 vies) | 105 / 126 | perdu en 89 s |
| 8 | 0 % (0/10) | 0,0 | 90 % (9/10) | 4,9 | 35 / 57 | 2 (5,9 vies) / 2 (3,1 vies) | 102 / 372 | perdu en 92 s |
| 9 | 30 % (3/10) | 1,9 | 100 % (10/10) | 15,0 | 39 / 53 | 3 (6,6 vies) / aucune | 285 / 513 | perdu en 96 s |
| 10 | 60 % (6/10) | 4,6 | 100 % (10/10) | 15,0 | 166 / 183 | 4 (4,2 vies) / aucune | 457 / 648 | perdu en 73 s |

Tours choisies par le soigneux en Matou avec Plume : la plus choisie, Clocher des Archers (construction) (1063 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | magie, diversité 0.4 | magie, diversité 1 | équilibrée, diversité 1 |
| 2 | tir, diversité 1 | tir, diversité 0.4 | caserne, diversité 1 |
| 3 | caserne, diversité 0.4 | bloquer puis zone, diversité 1 | magie, diversité 1 |
| 4 | équilibrée, diversité 0.4 | tir, diversité 0.4 | tir, diversité 0.4 |
| 5 | équilibrée, diversité 0.4 | magie, diversité 0.4 | tir, diversité 0.4 |
| 6 | artillerie, diversité 0.4 | bloquer puis zone, diversité 1 | bloquer puis zone, diversité 1 |
| 7 | artillerie, diversité 0.4 | équilibrée, diversité 0.4 | équilibrée, diversité 1 |
| 8 | magie, diversité 0.4 | tir, diversité 1 | tir, diversité 0.4 |
| 9 | bloquer puis zone, diversité 1 | magie, diversité 0.4 | artillerie, diversité 0.4 |
| 10 | artillerie, diversité 1 | tir, diversité 1 | caserne, diversité 1 |

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
| 4 | 100 % (10/10) | 24,6 | 100 % (10/10) | 25,0 | 94 / 94 | 1 (0,2 vies) / aucune | 243 / 205 | perdu en 126 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 140 / 99 | aucune / aucune | 272 / 235 | perdu en 103 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 138 / 88 | aucune / aucune | 337 / 278 | perdu en 134 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 24,8 | 96 / 87 | aucune / 6 (0,1 vies) | 304 / 249 | perdu en 104 s |
| 8 | 100 % (10/10) | 24,3 | 100 % (10/10) | 25,0 | 127 / 119 | 1 (0,4 vies) / aucune | 439 / 392 | perdu en 120 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 131 / 88 | aucune / aucune | 549 / 500 | perdu en 121 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 3450 / 119 | aucune / aucune | 622 / 556 | perdu en 114 s |

### Charlie : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 40 % (4/10) | 1,5 | 100 % (10/10) | 20,0 | 68 / 97 | 5 (5,3 vies) / aucune | 213 / 166 | perdu en 153 s |
| 2 | 10 % (1/10) | 0,9 | 100 % (10/10) | 19,4 | 42 / 81 | 4 (7,6 vies) / 6 (0,6 vies) | 167 / 191 | perdu en 118 s |
| 3 | 90 % (9/10) | 16,6 | 100 % (10/10) | 18,0 | 61 / 88 | 3 (1,8 vies) / 5 (2,0 vies) | 200 / 164 | perdu en 109 s |
| 4 | 0 % (0/10) | 0,0 | 100 % (10/10) | 19,5 | 17 / 55 | 3 (11,6 vies) / 5 (0,4 vies) | 111 / 229 | perdu en 101 s |
| 5 | 0 % (0/10) | 0,0 | 100 % (10/10) | 18,1 | 18 / 60 | 2 (6,9 vies) / 5 (1,3 vies) | 126 / 252 | perdu en 92 s |
| 6 | 10 % (1/10) | 0,2 | 100 % (10/10) | 19,0 | 53 / 50 | 4 (13,3 vies) / 4 (1,0 vies) | 165 / 309 | perdu en 110 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 10,0 | 42 / 67 | 3 (13,0 vies) / 3 (7,2 vies) | 112 / 262 | perdu en 102 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 19,0 | 42 / 62 | 3 (13,6 vies) / 3 (0,9 vies) | 114 / 415 | perdu en 105 s |
| 9 | 60 % (6/10) | 6,0 | 100 % (10/10) | 20,0 | 81 / 85 | 3 (5,4 vies) / aucune | 400 / 518 | perdu en 115 s |
| 10 | 80 % (8/10) | 9,7 | 100 % (10/10) | 18,5 | 195 / 202 | 5 (6,2 vies) / 5 (0,9 vies) | 594 / 662 | perdu en 75 s |

### Charlie : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 % (0/10) | 0,0 | 100 % (10/10) | 15,0 | 67 / 121 | 3 (6,2 vies) / aucune | 153 / 214 | perdu en 130 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,7 | 60 / 78 | 3 (7,7 vies) / 4 (1,2 vies) | 122 / 202 | perdu en 115 s |
| 3 | 70 % (7/10) | 4,8 | 100 % (10/10) | 15,0 | 66 / 88 | 3 (4,4 vies) / aucune | 187 / 178 | perdu en 108 s |
| 4 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,2 | 3 / 71 | 3 (6,0 vies) / 5 (0,5 vies) | 102 / 246 | perdu en 100 s |
| 5 | 0 % (0/10) | 0,0 | 30 % (3/10) | 1,1 | 21 / 35 | 2 (8,7 vies) / 4 (6,5 vies) | 94 / 204 | perdu en 86 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 12,9 | 40 / 74 | 3 (5,9 vies) / 4 (1,3 vies) | 130 / 313 | perdu en 92 s |
| 7 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 15 / 40 | 3 (8,5 vies) / 4 (6,1 vies) | 105 / 120 | perdu en 75 s |
| 8 | 0 % (0/10) | 0,0 | 80 % (8/10) | 9,7 | 41 / 64 | 2 (6,1 vies) / 3 (2,7 vies) | 98 / 360 | perdu en 90 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,1 | 44 / 40 | 3 (9,1 vies) / 4 (0,5 vies) | 126 / 530 | perdu en 93 s |
| 10 | 10 % (1/10) | 1,4 | 90 % (9/10) | 9,6 | 89 / 201 | 4 (8,2 vies) / 5 (2,3 vies) | 208 / 587 | perdu en 73 s |

Tours choisies par le soigneux en Matou avec Charlie : la plus choisie, Grenier des Griffes (construction) (959 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 | caserne, diversité 0.4 |
| 2 | équilibrée, diversité 0.4 | caserne, diversité 1 | magie, diversité 0.4 |
| 3 | bloquer puis zone, diversité 1 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 4 | bloquer puis zone, diversité 0.4 | bloquer puis zone, diversité 0.4 | bloquer puis zone, diversité 0.4 |
| 5 | tir, diversité 1 | équilibrée, diversité 0.4 | bloquer puis zone, diversité 0.4 |
| 6 | équilibrée, diversité 0.4 | équilibrée, diversité 1 | artillerie, diversité 0.4 |
| 7 | magie, diversité 1 | artillerie, diversité 0.4 | caserne, diversité 1 |
| 8 | caserne, diversité 0.4 | bloquer puis zone, diversité 1 | bloquer puis zone, diversité 1 |
| 9 | caserne, diversité 0.4 | artillerie, diversité 0.4 | bloquer puis zone, diversité 1 |
| 10 | magie, diversité 1 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 |

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
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 96 / 74 | aucune / aucune | 242 / 192 | perdu en 230 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 94 / 66 | aucune / aucune | 271 / 232 | perdu en 236 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 87 / 181 | aucune / aucune | 337 / 288 | perdu en 207 s |
| 7 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 113 / 93 | aucune / aucune | 303 / 251 | perdu en 107 s |
| 8 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 153 / 106 | aucune / aucune | 438 / 392 | perdu en 216 s |
| 9 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 121 / 111 | aucune / aucune | 548 / 491 | perdu en 129 s |
| 10 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 3812 / 155 | aucune / aucune | 623 / 565 | perdu en 169 s |

### Pollen : Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 19,9 | 100 % (10/10) | 20,0 | 48 / 86 | 6 (0,1 vies) / aucune | 206 / 164 | perdu en 218 s |
| 2 | 100 % (10/10) | 19,7 | 100 % (10/10) | 20,0 | 70 / 100 | 3 (0,2 vies) / aucune | 232 / 196 | perdu en 146 s |
| 3 | 100 % (10/10) | 18,3 | 100 % (10/10) | 20,0 | 65 / 54 | 5 (1,6 vies) / aucune | 214 / 164 | perdu en 144 s |
| 4 | 100 % (10/10) | 18,7 | 100 % (10/10) | 20,0 | 83 / 69 | 4 (1,3 vies) / aucune | 254 / 215 | perdu en 128 s |
| 5 | 100 % (10/10) | 18,5 | 100 % (10/10) | 20,0 | 89 / 116 | 7 (1,3 vies) / aucune | 275 / 245 | perdu en 132 s |
| 6 | 100 % (10/10) | 17,1 | 100 % (10/10) | 20,0 | 61 / 89 | 4 (2,9 vies) / aucune | 344 / 314 | perdu en 135 s |
| 7 | 0 % (0/10) | 0,0 | 100 % (10/10) | 20,0 | 72 / 61 | 3 (12,0 vies) / aucune | 134 / 265 | perdu en 106 s |
| 8 | 100 % (10/10) | 17,3 | 100 % (10/10) | 20,0 | 100 / 46 | 3 (1,5 vies) / aucune | 442 / 408 | perdu en 140 s |
| 9 | 100 % (10/10) | 17,1 | 100 % (10/10) | 20,0 | 95 / 106 | 3 (1,7 vies) / aucune | 558 / 514 | perdu en 123 s |
| 10 | 100 % (10/10) | 19,3 | 100 % (10/10) | 20,0 | 180 / 145 | 10 (0,5 vies) / aucune | 642 / 593 | perdu en 129 s |

### Pollen : Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 90 % (9/10) | 11,0 | 100 % (10/10) | 15,0 | 67 / 113 | 4 (1,7 vies) / aucune | 215 / 168 | perdu en 182 s |
| 2 | 60 % (6/10) | 3,2 | 100 % (10/10) | 15,0 | 70 / 82 | 4 (5,5 vies) / aucune | 212 / 192 | perdu en 121 s |
| 3 | 60 % (6/10) | 7,1 | 100 % (10/10) | 15,0 | 55 / 73 | 5 (4,1 vies) / aucune | 194 / 179 | perdu en 127 s |
| 4 | 60 % (6/10) | 3,9 | 100 % (10/10) | 13,2 | 85 / 61 | 3 (4,7 vies) / 4 (1,0 vies) | 217 / 228 | perdu en 106 s |
| 5 | 80 % (8/10) | 3,2 | 100 % (10/10) | 15,0 | 81 / 55 | 7 (9,3 vies) / aucune | 269 / 246 | perdu en 117 s |
| 6 | 40 % (4/10) | 2,4 | 100 % (10/10) | 15,0 | 51 / 92 | 4 (10,5 vies) / aucune | 242 / 317 | perdu en 131 s |
| 7 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 24 / 73 | 3 (14,3 vies) / 5 (6,0 vies) | 108 / 116 | perdu en 103 s |
| 8 | 20 % (2/10) | 0,4 | 90 % (9/10) | 9,8 | 27 / 77 | 3 (6,9 vies) / 2 (1,8 vies) | 231 / 379 | perdu en 110 s |
| 9 | 20 % (2/10) | 1,8 | 100 % (10/10) | 15,0 | 61 / 121 | 3 (8,0 vies) / aucune | 219 / 514 | perdu en 117 s |
| 10 | 70 % (7/10) | 6,4 | 100 % (10/10) | 15,0 | 201 / 172 | 5 (4,3 vies) / aucune | 565 / 607 | perdu en 113 s |

Tours choisies par le soigneux en Matou avec Pollen : la plus choisie, Grenier des Griffes (construction) (1057 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Niveau | Variante en Chaton | Variante en Matou | Variante en Vieux Sage |
| --- | --- | --- | --- |
| 1 | bloquer puis zone, diversité 1 | équilibrée, diversité 1 | magie, diversité 1 |
| 2 | magie, diversité 1 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 |
| 3 | caserne, diversité 0.4 | équilibrée, diversité 0.4 | artillerie, diversité 1 |
| 4 | équilibrée, diversité 1 | magie, diversité 0.4 | tir, diversité 0.4 |
| 5 | équilibrée, diversité 0.4 | bloquer puis zone, diversité 1 | artillerie, diversité 1 |
| 6 | équilibrée, diversité 0.4 | bloquer puis zone, diversité 1 | caserne, diversité 1 |
| 7 | équilibrée, diversité 1 | artillerie, diversité 0.4 | caserne, diversité 1 |
| 8 | magie, diversité 0.4 | équilibrée, diversité 0.4 | bloquer puis zone, diversité 0.4 |
| 9 | tir, diversité 0.4 | magie, diversité 1 | tir, diversité 1 |
| 10 | bloquer puis zone, diversité 0.4 | bloquer puis zone, diversité 1 | magie, diversité 1 |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau. La courbe des niveaux est jugée sur la moyenne des dieux : elle doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs. La courbe de chaque dieu doit aussi décroître (corrélation d’au plus -0,3) ; le boss du niveau 10 dévore les unités au contact, ce qui pèse plus sur un héros de mêlée que sur un tireur.

| Dieu | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Corrélation de rang | Niveau le plus dur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plume | 11,4 | 4,9 | 18,0 | 1,1 | 1,3 | 0,9 | 0,0 | 0,0 | 15,1 | 18,7 | 0,0 | 7 (0,0 vies) |
| Charlie | 1,5 | 0,9 | 16,6 | 0,0 | 0,0 | 0,2 | 0,0 | 0,0 | 6,0 | 9,7 | 0,0 | 4 (0,0 vies) |
| Pollen | 19,9 | 19,7 | 18,3 | 18,7 | 18,5 | 17,1 | 0,0 | 17,3 | 17,1 | 19,3 | -0,5 | 7 (0,0 vies) |
| **Moyenne des dieux** | 10,9 | 8,5 | 17,6 | 6,6 | 6,6 | 6,1 | 0,0 | 5,8 | 12,7 | 15,9 | -0,1 | 7 (0,0 vies) |

Corrélation de rang de Spearman entre le niveau et les vies restantes (−1 = décroissance parfaite).

## Usage des sorts par le soigneux

Lancers moyens par partie sur lancers possibles (un à la fin de la recharge initiale, puis un par recharge sur la durée de la partie), et part utilisée entre parenthèses. Un sort peu lancé est soit mal visé par le bot, soit sans cible (Griffes d’Ombre attend une grappe de 4 ennemis ou un boss).

| Dieu | Sort | Recharge | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- | --- | --- |
| Plume | Voile de Nuit | 30 s | 2,4 sur 9,4 (26 %) | 5,4 sur 10,3 (52 %) | 5,8 sur 9,9 (59 %) |
| Plume | Griffes d’Ombre | 40 s | 6,7 sur 7,1 (94 %) | 7,5 sur 7,9 (95 %) | 7,3 sur 7,5 (97 %) |
| Charlie | Chute du Colosse | 25 s | 11,4 sur 11,6 (98 %) | 12,6 sur 12,8 (98 %) | 11,8 sur 11,9 (99 %) |
| Charlie | Renforts | 20 s | 6,1 sur 14,8 (41 %) | 11,0 sur 16,3 (67 %) | 11,1 sur 15,2 (73 %) |
| Pollen | Pièges à Ressort | 30 s | 4,9 sur 9,8 (49 %) | 8,6 sur 10,5 (82 %) | 8,4 sur 10,0 (84 %) |
| Pollen | Ingéniosité | 50 s | 4,0 sur 5,9 (68 %) | 4,6 sur 6,0 (76 %) | 5,1 sur 5,9 (86 %) |

## Tours divines

Construite : part des parties du soigneux où la tour divine a été construite (elle l’est dès la troisième tour, si le bot a eu le temps de réunir ses 400 arêtes avant la fin du niveau ; une seule par partie, et pas avant le niveau 10 où elle se débloque).
Sans tour divine : le même soigneux, mêmes graines, dépense ces 400 arêtes en tours communes (tour commune de même coût). Le gain est la différence de taux de victoire et de vies restantes.

| Dieu | Tour divine | Difficulté | Construite | Avec : victoires / vies | Sans : victoires / vies | Gain de la tour divine |
| --- | --- | --- | --- | --- | --- | --- |
| Plume | Sanctuaire de l’Ombre | Matou | 10 % | 100 % / 19,5 | 100 % / 19,5 | +0 points / +0,0 vies |
| Plume | Sanctuaire de l’Ombre | Vieux Sage | 10 % | 89 % / 11,2 | 89 % / 11,2 | +0 points / +0,0 vies |
| Charlie | Totem du Colosse | Matou | 10 % | 100 % / 18,2 | 100 % / 18,3 | +0 points / −0,1 vies |
| Charlie | Totem du Colosse | Vieux Sage | 10 % | 80 % / 10,5 | 81 % / 10,8 | −1 points / −0,2 vies |
| Pollen | Atelier de la Boiteuse | Matou | 10 % | 100 % / 20,0 | 100 % / 20,0 | +0 points / +0,0 vies |
| Pollen | Atelier de la Boiteuse | Vieux Sage | 10 % | 89 % / 12,8 | 89 % / 12,6 | +0 points / +0,2 vies |

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
| Plume | Nielle, Souffle-Lampes (avatar) | Duelliste, esquive et critiques | 100 % | 19,5 | — | 45 % | 7,1 | — |
| Plume | Suie | Assassin, exécute les blessés | 93 % | 18,0 | −1,5 vies | 33 % | 4,8 | −2,4 vies |
| Plume | Corbeau | Tireur, perce l’armure | 100 % | 19,8 | +0,3 vies | 90 % | 16,5 | +9,3 vies |
| Charlie | Gond, le Portier (avatar) | Tank, frappe de zone qui étourdit | 100 % | 18,2 | — | 29 % | 3,5 | — |
| Charlie | Mastoc | Provocation, bloque trois ennemis | 94 % | 17,9 | −0,3 vies | 37 % | 4,9 | +1,4 vies |
| Charlie | Brise-Os | Berserker, plus fort blessé | 100 % | 18,9 | +0,7 vies | 32 % | 3,6 | +0,1 vies |
| Pollen | Clopin, le Tendeur (avatar) | Pose des pièges, tire à la fronde | 100 % | 20,0 | — | 90 % | 16,6 | — |
| Pollen | Rouage | Ingénieur, construit une tourelle | 100 % | 20,0 | −0,1 vies | 89 % | 16,4 | −0,2 vies |
| Pollen | Lanterne | Soigneur, magie à distance | 100 % | 20,0 | +0,0 vies | 90 % | 16,6 | +0,0 vies |

## Progression : arbre au rang maximal et héros de niveau 10 (Vieux Sage)

L’avatar de chaque dieu en Vieux Sage, sur les 10 niveaux : de base, avec l’arbre au rang maximal (6 branches de 5 rangs), avec le héros au niveau 10 (10 points de compétence : l’ultime, puis les compétences dans l’ordre de la fiche), et avec les deux. Victoires / vies restantes moyennes.
La progression doit aider sans trivialiser : le soigneux ne doit pas tout gagner (moins de 100 %) avec tout au maximum.

| Dieu | Bot | De base | Arbre au maximum | Héros niveau 10 | Tout au maximum |
| --- | --- | --- | --- | --- | --- |
| Plume | Soigneux | 89 % / 11,2 | 90 % / 12,3 | 96 % / 13,1 | 94 % / 13,4 |
| Plume | Naïf | 17 % / 1,5 | 23 % / 2,1 | 29 % / 3,3 | 35 % / 3,7 |
| Charlie | Soigneux | 80 % / 10,5 | 98 % / 12,5 | 91 % / 12,2 | 95 % / 13,3 |
| Charlie | Naïf | 8 % / 0,6 | 9 % / 0,8 | 10 % / 1,3 | 13 % / 1,5 |
| Pollen | Soigneux | 89 % / 12,8 | 93 % / 13,3 | 91 % / 13,1 | 96 % / 13,5 |
| Pollen | Naïf | 50 % / 3,9 | 67 % / 6,9 | 80 % / 9,3 | 82 % / 10,8 |

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

## Régions 2 à 11

Les bandes de la région 1 (plus haut) sont mesurées sur chacune des régions 2 à 11, pour les trois dieux : mêmes bots, mêmes graines, mêmes difficultés, courbe de difficulté jugée sur la moyenne des dieux, écart entre dieux comme au jalon 2. Les écarts de Chaton, d’absence de défense et des défis font échouer `npm run balance` ; ceux de Matou et de Vieux Sage (courbe et écart entre dieux compris) sont suspendus (voir bandes.ts) : listés, ils ne bloquent pas.

### Région 2 : les Champs Brûlés

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 141 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 133 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 154 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 70 % (70/100) | 19,8 | 116 | 0 % (0/30) |
| Matou | Charlie | 98 % (98/100) | 42 % (42/100) | 16,1 | 128 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 95 % (95/100) | 19,3 | 114 | 0 % (0/30) |
| Vieux Sage | Plume | 94 % (94/100) | 22 % (22/100) | 13,0 | 120 | 0 % (0/30) |
| Vieux Sage | Charlie | 83 % (83/100) | 11 % (11/100) | 8,7 | 115 | 0 % (0/30) |
| Vieux Sage | Pollen | 90 % (90/100) | 55 % (55/100) | 12,8 | 118 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 100 % (30/30) | 60 % (18/30) | 9,4 | 128 | 100 % (30/30) | 15,0 | 0 % (0/9) |
| 12 | 100 % (30/30) | 100 % (30/30) | 18,2 | 111 | 100 % (30/30) | 14,7 | 0 % (0/9) |
| 13 | 100 % (30/30) | 93 % (28/30) | 14,9 | 122 | 100 % (30/30) | 14,5 | 0 % (0/9) |
| 14 | 100 % (30/30) | 70 % (21/30) | 7,6 | 113 | 97 % (29/30) | 13,6 | 0 % (0/9) |
| 15 | 100 % (30/30) | 37 % (11/30) | 6,5 | 103 | 97 % (29/30) | 10,2 | 0 % (0/9) |
| 16 | 100 % (30/30) | 57 % (17/30) | 8,5 | 91 | 100 % (30/30) | 13,0 | 0 % (0/9) |
| 17 | 93 % (28/30) | 40 % (12/30) | 3,7 | 87 | 17 % (5/30) | 1,0 | 0 % (0/9) |
| 18 | 100 % (30/30) | 47 % (14/30) | 8,1 | 146 | 80 % (24/30) | 9,7 | 0 % (0/9) |
| 19 | 100 % (30/30) | 100 % (30/30) | 18,9 | 147 | 100 % (30/30) | 13,1 | 0 % (0/9) |
| 20 | 100 % (30/30) | 87 % (26/30) | 10,8 | 146 | 100 % (30/30) | 10,3 | 0 % (0/9) |

Écarts aux bandes : 14

- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 98 % des parties, il doit tout gagner
- Matou (Charlie) : le niveau 20 laisse 250 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 95 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou : le niveau 20 (10,8 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,1, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 94 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 90 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (94 %) et Charlie (83 %) sont à 11 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,8 vies) et Charlie (16,1 vies) sont à 3,7 vies l'un de l'autre, il en faut au plus 3

### Région 3 : le Bourg des Bûchers

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 144 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 169 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 168 | 0 % (0/30) |
| Matou | Plume | 90 % (90/100) | 71 % (71/100) | 17,6 | 136 | 0 % (0/30) |
| Matou | Charlie | 90 % (90/100) | 19 % (19/100) | 15,8 | 128 | 0 % (0/30) |
| Matou | Pollen | 90 % (90/100) | 82 % (82/100) | 16,4 | 134 | 0 % (0/30) |
| Vieux Sage | Plume | 76 % (76/100) | 13 % (13/100) | 10,1 | 129 | 0 % (0/30) |
| Vieux Sage | Charlie | 47 % (47/100) | 0 % (0/100) | 3,9 | 103 | 0 % (0/30) |
| Vieux Sage | Pollen | 75 % (75/100) | 13 % (13/100) | 9,7 | 124 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | 100 % (30/30) | 30 % (9/30) | 3,8 | 112 | 57 % (17/30) | 3,1 | 0 % (0/9) |
| 22 | 100 % (30/30) | 43 % (13/30) | 6,7 | 121 | 63 % (19/30) | 6,8 | 0 % (0/9) |
| 23 | 100 % (30/30) | 73 % (22/30) | 10,8 | 154 | 83 % (25/30) | 9,6 | 0 % (0/9) |
| 24 | 100 % (30/30) | 63 % (19/30) | 7,6 | 143 | 83 % (25/30) | 9,9 | 0 % (0/9) |
| 25 | 100 % (30/30) | 77 % (23/30) | 13,0 | 113 | 100 % (30/30) | 13,2 | 0 % (0/9) |
| 26 | 100 % (30/30) | 67 % (20/30) | 10,1 | 123 | 100 % (30/30) | 14,9 | 0 % (0/9) |
| 27 | 0 % (0/30) | 0 % (0/30) | 0,0 | 51 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 28 | 100 % (30/30) | 67 % (20/30) | 11,0 | 104 | 13 % (4/30) | 0,4 | 0 % (0/9) |
| 29 | 100 % (30/30) | 53 % (16/30) | 6,8 | 152 | 70 % (21/30) | 9,7 | 0 % (0/9) |
| 30 | 100 % (30/30) | 100 % (30/30) | 19,2 | 253 | 90 % (27/30) | 11,3 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Plume) : le bot naïf gagne 71 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 19 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 30 laisse 337 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 82 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 30 laisse 284 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,4, elle doit être d'au plus -0,6
- Matou : le niveau 30 (19,2 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,6, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 47 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (76 %) et Charlie (47 %) sont à 29 points l'un de l'autre, il en faut au plus 10

### Région 4 : les Marais de l’Ordalie

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 170 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,9 | 155 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 175 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 30 % (30/100) | 19,9 | 152 | 0 % (0/30) |
| Matou | Charlie | 80 % (80/100) | 10 % (10/100) | 9,5 | 131 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 79 % (79/100) | 18,3 | 138 | 0 % (0/30) |
| Vieux Sage | Plume | 100 % (100/100) | 0 % (0/100) | 13,2 | 132 | 0 % (0/30) |
| Vieux Sage | Charlie | 5 % (5/100) | 0 % (0/100) | 0,5 | 72 | 0 % (0/30) |
| Vieux Sage | Pollen | 62 % (62/100) | 3 % (3/100) | 5,8 | 118 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | 100 % (30/30) | 57 % (17/30) | 7,7 | 137 | 33 % (10/30) | 3,3 | 0 % (0/9) |
| 32 | 100 % (30/30) | 27 % (8/30) | 1,8 | 114 | 60 % (18/30) | 5,5 | 0 % (0/9) |
| 33 | 93 % (28/30) | 50 % (15/30) | 6,8 | 117 | 83 % (25/30) | 11,3 | 0 % (0/9) |
| 34 | 100 % (30/30) | 43 % (13/30) | 4,9 | 184 | 63 % (19/30) | 7,7 | 0 % (0/9) |
| 35 | 93 % (28/30) | 30 % (9/30) | 4,1 | 137 | 50 % (15/30) | 5,9 | 0 % (0/9) |
| 36 | 93 % (28/30) | 23 % (7/30) | 3,3 | 94 | 67 % (20/30) | 8,1 | 0 % (0/9) |
| 37 | 70 % (21/30) | 17 % (5/30) | 1,8 | 116 | 33 % (10/30) | 4,9 | 0 % (0/9) |
| 38 | 100 % (30/30) | 37 % (11/30) | 4,5 | 105 | 40 % (12/30) | 3,5 | 0 % (0/9) |
| 39 | 83 % (25/30) | 40 % (12/30) | 7,0 | 152 | 67 % (20/30) | 9,3 | 0 % (0/9) |
| 40 | 100 % (30/30) | 73 % (22/30) | 10,4 | 248 | 60 % (18/30) | 5,9 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 35 laisse 257 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 80 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 10 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 34 laisse 251 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le niveau 40 laisse 304 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot naïf gagne 79 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,2, elle doit être d'au plus -0,6
- Matou : le niveau 40 (10,4 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,3, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 100 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 5 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (100 %) et Charlie (5 %) sont à 95 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,9 vies) et Charlie (9,5 vies) sont à 10,5 vies l'un de l'autre, il en faut au plus 3

### Région 5 : la Ville Pestiférée

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 173 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 148 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 176 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 27 % (27/100) | 19,9 | 149 | 0 % (0/30) |
| Matou | Charlie | 63 % (63/100) | 6 % (6/100) | 10,1 | 115 | 0 % (0/30) |
| Matou | Pollen | 99 % (99/100) | 45 % (45/100) | 19,1 | 133 | 0 % (0/30) |
| Vieux Sage | Plume | 70 % (70/100) | 1 % (1/100) | 8,8 | 125 | 0 % (0/30) |
| Vieux Sage | Charlie | 2 % (2/100) | 0 % (0/100) | 0,2 | 66 | 0 % (0/30) |
| Vieux Sage | Pollen | 45 % (45/100) | 1 % (1/100) | 6,2 | 102 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | 100 % (30/30) | 13 % (4/30) | 1,8 | 91 | 27 % (8/30) | 1,8 | 0 % (0/9) |
| 42 | 100 % (30/30) | 57 % (17/30) | 7,6 | 82 | 73 % (22/30) | 10,6 | 0 % (0/9) |
| 43 | 100 % (30/30) | 37 % (11/30) | 5,9 | 137 | 57 % (17/30) | 7,7 | 0 % (0/9) |
| 44 | 93 % (28/30) | 40 % (12/30) | 6,0 | 144 | 53 % (16/30) | 6,9 | 0 % (0/9) |
| 45 | 67 % (20/30) | 0 % (0/30) | 0,0 | 115 | 13 % (4/30) | 1,1 | 0 % (0/9) |
| 46 | 63 % (19/30) | 0 % (0/30) | 0,0 | 103 | 23 % (7/30) | 3,3 | 0 % (0/9) |
| 47 | 83 % (25/30) | 0 % (0/30) | 0,0 | 85 | 0 % (0/30) | 0,0 | 0 % (0/9) |
| 48 | 67 % (20/30) | 10 % (3/30) | 1,1 | 112 | 33 % (10/30) | 4,7 | 0 % (0/9) |
| 49 | 100 % (30/30) | 50 % (15/30) | 5,7 | 147 | 43 % (13/30) | 4,9 | 0 % (0/9) |
| 50 | 100 % (30/30) | 53 % (16/30) | 6,9 | 304 | 67 % (20/30) | 9,6 | 0 % (0/9) |

Écarts aux bandes : 17

- Matou (Plume) : le bot naïf gagne 27 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 50 laisse 346 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 63 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 6 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 50 laisse 306 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 99 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 50 laisse 261 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,2, elle doit être d'au plus -0,6
- Matou : le niveau 50 (6,9 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Vieux Sage (Charlie) : le bot soigneux gagne 2 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 45 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (70 %) et Charlie (2 %) sont à 68 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,9 vies) et Charlie (10,1 vies) sont à 9,8 vies l'un de l'autre, il en faut au plus 3

### Région 6 : le Charnier

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 154 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 177 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 184 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 52 % (52/100) | 19,7 | 129 | 0 % (0/30) |
| Matou | Charlie | 90 % (90/100) | 19 % (19/100) | 14,6 | 88 | 0 % (0/30) |
| Matou | Pollen | 98 % (98/100) | 85 % (85/100) | 18,8 | 130 | 0 % (0/30) |
| Vieux Sage | Plume | 97 % (97/100) | 1 % (1/100) | 13,6 | 128 | 0 % (0/30) |
| Vieux Sage | Charlie | 3 % (3/100) | 0 % (0/100) | 0,2 | 52 | 0 % (0/30) |
| Vieux Sage | Pollen | 78 % (78/100) | 4 % (4/100) | 10,7 | 110 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 51 | 100 % (30/30) | 27 % (8/30) | 3,1 | 93 | 67 % (20/30) | 10,0 | 0 % (0/9) |
| 52 | 100 % (30/30) | 27 % (8/30) | 3,4 | 88 | 33 % (10/30) | 4,6 | 0 % (0/9) |
| 53 | 100 % (30/30) | 63 % (19/30) | 9,5 | 122 | 50 % (15/30) | 5,3 | 0 % (0/9) |
| 54 | 100 % (30/30) | 90 % (27/30) | 14,0 | 101 | 67 % (20/30) | 9,8 | 0 % (0/9) |
| 55 | 100 % (30/30) | 33 % (10/30) | 4,5 | 163 | 67 % (20/30) | 9,7 | 0 % (0/9) |
| 56 | 100 % (30/30) | 57 % (17/30) | 9,5 | 71 | 77 % (23/30) | 10,7 | 0 % (0/9) |
| 57 | 100 % (30/30) | 30 % (9/30) | 4,3 | 102 | 67 % (20/30) | 9,7 | 0 % (0/9) |
| 58 | 100 % (30/30) | 47 % (14/30) | 7,5 | 143 | 67 % (20/30) | 9,3 | 0 % (0/9) |
| 59 | 100 % (30/30) | 80 % (24/30) | 10,0 | 85 | 67 % (20/30) | 9,4 | 0 % (0/9) |
| 60 | 60 % (18/30) | 67 % (20/30) | 10,8 | 189 | 33 % (10/30) | 3,3 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 60 laisse 287 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 90 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 19 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux gagne 98 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 85 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,5, elle doit être d'au plus -0,6
- Matou : le niveau 60 (10,8 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,5, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,1, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,4, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 97 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 3 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (97 %) et Charlie (3 %) sont à 94 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,7 vies) et Charlie (14,6 vies) sont à 5,1 vies l'un de l'autre, il en faut au plus 3

### Région 7 : la Croisade

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 213 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 184 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 178 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 65 % (65/100) | 19,7 | 171 | 0 % (0/30) |
| Matou | Charlie | 94 % (94/100) | 34 % (34/100) | 13,3 | 84 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 83 % (83/100) | 18,5 | 112 | 0 % (0/30) |
| Vieux Sage | Plume | 89 % (89/100) | 0 % (0/100) | 9,7 | 105 | 0 % (0/30) |
| Vieux Sage | Charlie | 13 % (13/100) | 0 % (0/100) | 0,6 | 50 | 0 % (0/30) |
| Vieux Sage | Pollen | 28 % (28/100) | 1 % (1/100) | 1,0 | 79 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 61 | 100 % (30/30) | 77 % (23/30) | 9,4 | 78 | 50 % (15/30) | 5,2 | 0 % (0/9) |
| 62 | 100 % (30/30) | 83 % (25/30) | 10,8 | 139 | 83 % (25/30) | 6,9 | 0 % (0/9) |
| 63 | 100 % (30/30) | 60 % (18/30) | 6,1 | 74 | 30 % (9/30) | 3,1 | 0 % (0/9) |
| 64 | 100 % (30/30) | 77 % (23/30) | 6,8 | 202 | 30 % (9/30) | 2,6 | 0 % (0/9) |
| 65 | 100 % (30/30) | 50 % (15/30) | 5,1 | 193 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 66 | 100 % (30/30) | 70 % (21/30) | 5,9 | 86 | 40 % (12/30) | 3,8 | 0 % (0/9) |
| 67 | 100 % (30/30) | 20 % (6/30) | 1,4 | 88 | 27 % (8/30) | 1,0 | 0 % (0/9) |
| 68 | 100 % (30/30) | 90 % (27/30) | 8,8 | 130 | 67 % (20/30) | 6,9 | 0 % (0/9) |
| 69 | 80 % (24/30) | 10 % (3/30) | 0,6 | 89 | 33 % (10/30) | 2,3 | 0 % (0/9) |
| 70 | 100 % (30/30) | 70 % (21/30) | 4,9 | 144 | 40 % (12/30) | 0,9 | 0 % (0/9) |

Écarts aux bandes : 12

- Matou (Plume) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 62 laisse 262 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Plume) : le niveau 64 laisse 345 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 94 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 83 % des parties, la bande est 30 % à 70 %
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 89 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 13 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 28 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (89 %) et Charlie (13 %) sont à 76 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,7 vies) et Charlie (13,3 vies) sont à 6,4 vies l'un de l'autre, il en faut au plus 3

### Région 8 : le Monastère Noir

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 198 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 189 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 197 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 44 % (44/100) | 20,0 | 155 | 0 % (0/30) |
| Matou | Charlie | 74 % (74/100) | 16 % (16/100) | 11,1 | 123 | 0 % (0/30) |
| Matou | Pollen | 100 % (100/100) | 58 % (58/100) | 19,8 | 140 | 0 % (0/30) |
| Vieux Sage | Plume | 98 % (98/100) | 0 % (0/100) | 14,2 | 148 | 0 % (0/30) |
| Vieux Sage | Charlie | 8 % (8/100) | 0 % (0/100) | 0,4 | 62 | 0 % (0/30) |
| Vieux Sage | Pollen | 41 % (41/100) | 0 % (0/100) | 3,8 | 129 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 71 | 100 % (30/30) | 67 % (20/30) | 8,4 | 93 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 72 | 100 % (30/30) | 77 % (23/30) | 10,8 | 112 | 60 % (18/30) | 6,5 | 0 % (0/9) |
| 73 | 100 % (30/30) | 50 % (15/30) | 9,2 | 118 | 90 % (27/30) | 10,2 | 0 % (0/9) |
| 74 | 97 % (29/30) | 20 % (6/30) | 1,5 | 167 | 33 % (10/30) | 4,3 | 0 % (0/9) |
| 75 | 97 % (29/30) | 27 % (8/30) | 3,3 | 153 | 60 % (18/30) | 7,5 | 0 % (0/9) |
| 76 | 70 % (21/30) | 0 % (0/30) | 0,0 | 82 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 77 | 80 % (24/30) | 40 % (12/30) | 4,7 | 109 | 27 % (8/30) | 3,4 | 0 % (0/9) |
| 78 | 70 % (21/30) | 10 % (3/30) | 0,5 | 105 | 33 % (10/30) | 4,9 | 0 % (0/9) |
| 79 | 100 % (30/30) | 87 % (26/30) | 14,2 | 116 | 53 % (16/30) | 6,2 | 0 % (0/9) |
| 80 | 100 % (30/30) | 17 % (5/30) | 1,1 | 341 | 67 % (20/30) | 8,3 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot soigneux perd au moins une vie sur 0 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 80 laisse 340 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 74 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 16 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 80 laisse 318 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 1 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 80 laisse 366 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,3, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,2, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 98 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 8 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 41 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (98 %) et Charlie (8 %) sont à 90 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (20 vies) et Charlie (11,1 vies) sont à 8,9 vies l'un de l'autre, il en faut au plus 3

### Région 9 : la Cité du Roi

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 231 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 24,9 | 186 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 202 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 50 % (50/100) | 19,2 | 137 | 0 % (0/30) |
| Matou | Charlie | 79 % (79/100) | 32 % (32/100) | 9,9 | 96 | 0 % (0/30) |
| Matou | Pollen | 95 % (95/100) | 62 % (62/100) | 14,2 | 103 | 0 % (0/30) |
| Vieux Sage | Plume | 93 % (93/100) | 0 % (0/100) | 10,2 | 123 | 0 % (0/30) |
| Vieux Sage | Charlie | 0 % (0/100) | 0 % (0/100) | 0,0 | 68 | 0 % (0/30) |
| Vieux Sage | Pollen | 20 % (20/100) | 1 % (1/100) | 1,4 | 73 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 81 | 70 % (21/30) | 13 % (4/30) | 1,6 | 74 | 33 % (10/30) | 3,8 | 0 % (0/9) |
| 82 | 80 % (24/30) | 30 % (9/30) | 1,6 | 85 | 33 % (10/30) | 4,9 | 0 % (0/9) |
| 83 | 100 % (30/30) | 90 % (27/30) | 10,0 | 74 | 37 % (11/30) | 4,3 | 0 % (0/9) |
| 84 | 97 % (29/30) | 43 % (13/30) | 3,7 | 123 | 33 % (10/30) | 3,0 | 0 % (0/9) |
| 85 | 100 % (30/30) | 93 % (28/30) | 13,5 | 180 | 63 % (19/30) | 8,3 | 0 % (0/9) |
| 86 | 80 % (24/30) | 17 % (5/30) | 0,7 | 109 | 33 % (10/30) | 4,3 | 0 % (0/9) |
| 87 | 100 % (30/30) | 53 % (16/30) | 4,2 | 63 | 27 % (8/30) | 0,7 | 0 % (0/9) |
| 88 | 100 % (30/30) | 57 % (17/30) | 4,5 | 83 | 63 % (19/30) | 4,3 | 0 % (0/9) |
| 89 | 97 % (29/30) | 3 % (1/30) | 0,0 | 158 | 37 % (11/30) | 3,0 | 0 % (0/9) |
| 90 | 90 % (27/30) | 80 % (24/30) | 6,5 | 169 | 17 % (5/30) | 2,0 | 0 % (0/9) |

Écarts aux bandes : 13

- Matou (Plume) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Charlie) : le bot soigneux gagne 79 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux gagne 95 % des parties, il doit tout gagner
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0, elle doit être d'au plus -0,6
- Matou : le niveau 90 (6,5 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de -0,3, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 93 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 0 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 20 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (93 %) et Charlie (0 %) sont à 93 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,2 vies) et Charlie (9,9 vies) sont à 9,3 vies l'un de l'autre, il en faut au plus 3

### Région 10 : la Cathédrale du Soleil Blême

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 25,0 | 329 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 25,0 | 322 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 25,0 | 382 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 27 % (27/100) | 19,5 | 133 | 0 % (0/30) |
| Matou | Charlie | 87 % (87/100) | 10 % (10/100) | 12,7 | 119 | 0 % (0/30) |
| Matou | Pollen | 97 % (97/100) | 51 % (51/100) | 15,7 | 135 | 0 % (0/30) |
| Vieux Sage | Plume | 91 % (91/100) | 0 % (0/100) | 11,8 | 143 | 0 % (0/30) |
| Vieux Sage | Charlie | 9 % (9/100) | 0 % (0/100) | 1,1 | 67 | 0 % (0/30) |
| Vieux Sage | Pollen | 36 % (36/100) | 1 % (1/100) | 4,1 | 60 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 91 | 100 % (30/30) | 53 % (16/30) | 9,7 | 75 | 77 % (23/30) | 10,9 | 0 % (0/9) |
| 92 | 100 % (30/30) | 67 % (20/30) | 9,1 | 62 | 57 % (17/30) | 7,7 | 0 % (0/9) |
| 93 | 100 % (30/30) | 43 % (13/30) | 6,4 | 74 | 87 % (26/30) | 11,8 | 0 % (0/9) |
| 94 | 100 % (30/30) | 17 % (5/30) | 1,8 | 130 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 95 | 80 % (24/30) | 0 % (0/30) | 0,0 | 148 | 23 % (7/30) | 1,6 | 0 % (0/9) |
| 96 | 100 % (30/30) | 43 % (13/30) | 5,5 | 100 | 63 % (19/30) | 6,8 | 0 % (0/9) |
| 97 | 83 % (25/30) | 0 % (0/30) | 0,0 | 75 | 17 % (5/30) | 1,6 | 0 % (0/9) |
| 98 | 100 % (30/30) | 10 % (3/30) | 0,5 | 131 | 33 % (10/30) | 3,9 | 0 % (0/9) |
| 99 | 83 % (25/30) | 27 % (8/30) | 3,2 | 112 | 33 % (10/30) | 5,0 | 0 % (0/9) |
| 100 | 100 % (30/30) | 33 % (10/30) | 4,6 | 384 | 30 % (9/30) | 2,3 | 0 % (0/9) |

Écarts aux bandes : 16

- Matou (Plume) : le bot naïf gagne 27 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 2 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 100 laisse 368 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 87 % des parties, il doit tout gagner
- Matou (Charlie) : le bot naïf gagne 10 % des parties, la bande est 30 % à 70 %
- Matou (Charlie) : le niveau 100 laisse 389 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Pollen) : le bot soigneux gagne 97 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux perd au moins une vie sur 4 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Pollen) : le niveau 100 laisse 393 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de -0,6, elle doit être d'au plus -0,6
- Matou : le niveau 100 (4,6 vies restantes au bot naïf, moyenne des dieux) n'est pas parmi les 3 plus durs
- Vieux Sage (Plume) : le bot soigneux gagne 91 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 9 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 36 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (91 %) et Charlie (9 %) sont à 82 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (19,5 vies) et Charlie (12,7 vies) sont à 6,8 vies l'un de l'autre, il en faut au plus 3

### Région 11 : les Grèves Grises

Par difficulté et par dieu (tous les niveaux de la région) :

| Difficulté | Dieu | Soigneux : victoires | Naïf : victoires | Soigneux : vies restantes | Soigneux : arêtes en fin | Sans défense : victoires |
| --- | --- | --- | --- | --- | --- | --- |
| Chaton | Plume | 100 % (100/100) | 100 % (100/100) | 24,9 | 214 | 0 % (0/30) |
| Chaton | Charlie | 100 % (100/100) | 100 % (100/100) | 23,7 | 147 | 0 % (0/30) |
| Chaton | Pollen | 100 % (100/100) | 100 % (100/100) | 23,7 | 140 | 0 % (0/30) |
| Matou | Plume | 100 % (100/100) | 79 % (79/100) | 18,3 | 130 | 0 % (0/30) |
| Matou | Charlie | 94 % (94/100) | 57 % (57/100) | 14,9 | 84 | 0 % (0/30) |
| Matou | Pollen | 97 % (97/100) | 86 % (86/100) | 16,5 | 130 | 0 % (0/30) |
| Vieux Sage | Plume | 90 % (90/100) | 14 % (14/100) | 10,9 | 111 | 0 % (0/30) |
| Vieux Sage | Charlie | 23 % (23/100) | 0 % (0/100) | 0,9 | 70 | 0 % (0/30) |
| Vieux Sage | Pollen | 54 % (54/100) | 18 % (18/100) | 3,4 | 71 | 0 % (0/30) |

Par niveau (trois dieux ensemble) :

| Niveau | Matou, soigneux | Matou, naïf | Matou, naïf : vies restantes | Matou, soigneux : arêtes en fin | Vieux Sage, soigneux | Vieux Sage, soigneux : vies restantes | Matou, sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 101 | 70 % (21/30) | 10 % (3/30) | 0,2 | 97 | 33 % (10/30) | 2,5 | 0 % (0/9) |
| 102 | 100 % (30/30) | 100 % (30/30) | 14,1 | 93 | 97 % (29/30) | 10,0 | 0 % (0/9) |
| 103 | 100 % (30/30) | 100 % (30/30) | 10,3 | 72 | 67 % (20/30) | 3,6 | 0 % (0/9) |
| 104 | 100 % (30/30) | 50 % (15/30) | 3,9 | 93 | 37 % (11/30) | 2,5 | 0 % (0/9) |
| 105 | 100 % (30/30) | 100 % (30/30) | 16,5 | 116 | 63 % (19/30) | 5,2 | 0 % (0/9) |
| 106 | 100 % (30/30) | 70 % (21/30) | 5,7 | 95 | 33 % (10/30) | 4,4 | 0 % (0/9) |
| 107 | 100 % (30/30) | 100 % (30/30) | 17,9 | 190 | 87 % (26/30) | 7,9 | 0 % (0/9) |
| 108 | 100 % (30/30) | 83 % (25/30) | 13,7 | 140 | 80 % (24/30) | 8,7 | 0 % (0/9) |
| 109 | 100 % (30/30) | 80 % (24/30) | 10,2 | 133 | 60 % (18/30) | 5,8 | 0 % (0/9) |
| 110 | 100 % (30/30) | 47 % (14/30) | 1,9 | 120 | 0 % (0/30) | 0,0 | 0 % (0/9) |

Écarts aux bandes : 15

- Matou (Plume) : le bot naïf gagne 79 % des parties, la bande est 30 % à 70 %
- Matou (Plume) : le bot soigneux perd au moins une vie sur 3 niveaux seulement, il en faut au moins 5 sur 10
- Matou (Plume) : le niveau 107 laisse 265 arêtes inutilisées au bot soigneux, il en faut moins de 250
- Matou (Charlie) : le bot soigneux gagne 94 % des parties, il doit tout gagner
- Matou (Pollen) : le bot soigneux gagne 97 % des parties, il doit tout gagner
- Matou (Pollen) : le bot naïf gagne 86 % des parties, la bande est 30 % à 70 %
- Matou : la courbe de difficulté du bot naïf (moyenne des dieux) a une corrélation de rang de 0,1, elle doit être d'au plus -0,6
- Matou (Plume) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Matou (Charlie) : la courbe de difficulté du bot naïf a une corrélation de rang de 0, elle doit être d'au plus -0,3
- Matou (Pollen) : la courbe de difficulté du bot naïf a une corrélation de rang de 0,2, elle doit être d'au plus -0,3
- Vieux Sage (Plume) : le bot soigneux gagne 90 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Charlie) : le bot soigneux gagne 23 % des parties, la bande est 60 % à 85 %
- Vieux Sage (Pollen) : le bot soigneux gagne 54 % des parties, la bande est 60 % à 85 %
- Vieux Sage : Plume (90 %) et Charlie (23 %) sont à 67 points l'un de l'autre, il en faut au plus 10
- Matou : Plume (18,3 vies) et Charlie (14,9 vies) sont à 3,4 vies l'un de l'autre, il en faut au plus 3

## Défis, régions 1 à 11

Le bot soigneux joue les défis avec les règles de Matou, sans objet ni amélioration : Héroïque (1 vie, groupes d’élite) et Fer (toutes les vagues en une, deux familles de tours). Il cherche sa variante sur les graines d’entraînement du défi lui-même, puis joue les dix graines d’évaluation. Bande : entre 40 et 90 % de réussites pour chaque défi de chaque région, trois dieux confondus.

### Région 1 : le Village Affamé

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 75 % (75/100) | 0,8 |
| Héroïque | Charlie | 64 % (64/100) | 0,6 |
| Héroïque | Pollen | 82 % (82/100) | 0,8 |
| Héroïque | les trois | 74 % (221/300) | 0,7 |
| Fer | Plume | 80 % (80/100) | 15,8 |
| Fer | Charlie | 71 % (71/100) | 13,8 |
| Fer | Pollen | 50 % (50/100) | 10,0 |
| Fer | les trois | 67 % (201/300) | 13,2 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 1 | 97 % (29/30) | 100 % (30/30) |
| 2 | 80 % (24/30) | 67 % (20/30) |
| 3 | 100 % (30/30) | 100 % (30/30) |
| 4 | 27 % (8/30) | 67 % (20/30) |
| 5 | 60 % (18/30) | 100 % (30/30) |
| 6 | 90 % (27/30) | 100 % (30/30) |
| 7 | 40 % (12/30) | 3 % (1/30) |
| 8 | 50 % (15/30) | 0 % (0/30) |
| 9 | 97 % (29/30) | 100 % (30/30) |
| 10 | 97 % (29/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 2 : les Champs Brûlés

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 90 % (90/100) | 0,9 |
| Héroïque | Charlie | 57 % (57/100) | 0,6 |
| Héroïque | Pollen | 85 % (85/100) | 0,9 |
| Héroïque | les trois | 77 % (232/300) | 0,8 |
| Fer | Plume | 100 % (100/100) | 19,0 |
| Fer | Charlie | 86 % (86/100) | 15,6 |
| Fer | Pollen | 60 % (60/100) | 10,7 |
| Fer | les trois | 82 % (246/300) | 15,1 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 11 | 100 % (30/30) | 100 % (30/30) |
| 12 | 100 % (30/30) | 100 % (30/30) |
| 13 | 90 % (27/30) | 67 % (20/30) |
| 14 | 87 % (26/30) | 100 % (30/30) |
| 15 | 67 % (20/30) | 47 % (14/30) |
| 16 | 83 % (25/30) | 100 % (30/30) |
| 17 | 3 % (1/30) | 100 % (30/30) |
| 18 | 63 % (19/30) | 67 % (20/30) |
| 19 | 100 % (30/30) | 100 % (30/30) |
| 20 | 80 % (24/30) | 40 % (12/30) |

Écarts aux bandes des défis : aucun.

### Région 3 : le Bourg des Bûchers

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 84 % (84/100) | 0,8 |
| Héroïque | Charlie | 50 % (50/100) | 0,5 |
| Héroïque | Pollen | 76 % (76/100) | 0,8 |
| Héroïque | les trois | 70 % (210/300) | 0,7 |
| Fer | Plume | 80 % (80/100) | 13,2 |
| Fer | Charlie | 46 % (46/100) | 8,5 |
| Fer | Pollen | 31 % (31/100) | 5,9 |
| Fer | les trois | 52 % (157/300) | 9,2 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 21 | 80 % (24/30) | 100 % (30/30) |
| 22 | 37 % (11/30) | 100 % (30/30) |
| 23 | 90 % (27/30) | 53 % (16/30) |
| 24 | 67 % (20/30) | 33 % (10/30) |
| 25 | 97 % (29/30) | 100 % (30/30) |
| 26 | 93 % (28/30) | 67 % (20/30) |
| 27 | 0 % (0/30) | 0 % (0/30) |
| 28 | 90 % (27/30) | 37 % (11/30) |
| 29 | 47 % (14/30) | 0 % (0/30) |
| 30 | 100 % (30/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 4 : les Marais de l’Ordalie

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 93 % (93/100) | 0,9 |
| Héroïque | Charlie | 14 % (14/100) | 0,1 |
| Héroïque | Pollen | 46 % (46/100) | 0,5 |
| Héroïque | les trois | 51 % (153/300) | 0,5 |
| Fer | Plume | 86 % (86/100) | 14,3 |
| Fer | Charlie | 48 % (48/100) | 8,5 |
| Fer | Pollen | 40 % (40/100) | 7,5 |
| Fer | les trois | 58 % (174/300) | 10,1 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 31 | 97 % (29/30) | 100 % (30/30) |
| 32 | 33 % (10/30) | 100 % (30/30) |
| 33 | 47 % (14/30) | 67 % (20/30) |
| 34 | 63 % (19/30) | 30 % (9/30) |
| 35 | 37 % (11/30) | 33 % (10/30) |
| 36 | 33 % (10/30) | 23 % (7/30) |
| 37 | 43 % (13/30) | 100 % (30/30) |
| 38 | 43 % (13/30) | 33 % (10/30) |
| 39 | 40 % (12/30) | 0 % (0/30) |
| 40 | 73 % (22/30) | 93 % (28/30) |

Écarts aux bandes des défis : aucun.

### Région 5 : la Ville Pestiférée

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 99 % (99/100) | 1,0 |
| Héroïque | Charlie | 36 % (36/100) | 0,4 |
| Héroïque | Pollen | 68 % (68/100) | 0,7 |
| Héroïque | les trois | 68 % (203/300) | 0,7 |
| Fer | Plume | 54 % (54/100) | 10,7 |
| Fer | Charlie | 37 % (37/100) | 7,2 |
| Fer | Pollen | 50 % (50/100) | 10,0 |
| Fer | les trois | 47 % (141/300) | 9,3 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 41 | 97 % (29/30) | 100 % (30/30) |
| 42 | 90 % (27/30) | 100 % (30/30) |
| 43 | 100 % (30/30) | 100 % (30/30) |
| 44 | 67 % (20/30) | 20 % (6/30) |
| 45 | 33 % (10/30) | 0 % (0/30) |
| 46 | 33 % (10/30) | 0 % (0/30) |
| 47 | 67 % (20/30) | 83 % (25/30) |
| 48 | 33 % (10/30) | 0 % (0/30) |
| 49 | 97 % (29/30) | 67 % (20/30) |
| 50 | 60 % (18/30) | 0 % (0/30) |

Écarts aux bandes des défis : aucun.

### Région 6 : le Charnier

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 91 % (91/100) | 0,9 |
| Héroïque | Charlie | 61 % (61/100) | 0,6 |
| Héroïque | Pollen | 85 % (85/100) | 0,9 |
| Héroïque | les trois | 79 % (237/300) | 0,8 |
| Fer | Plume | 99 % (99/100) | 19,7 |
| Fer | Charlie | 79 % (79/100) | 14,9 |
| Fer | Pollen | 50 % (50/100) | 9,9 |
| Fer | les trois | 76 % (228/300) | 14,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 51 | 93 % (28/30) | 100 % (30/30) |
| 52 | 90 % (27/30) | 100 % (30/30) |
| 53 | 70 % (21/30) | 63 % (19/30) |
| 54 | 93 % (28/30) | 100 % (30/30) |
| 55 | 73 % (22/30) | 33 % (10/30) |
| 56 | 97 % (29/30) | 67 % (20/30) |
| 57 | 80 % (24/30) | 100 % (30/30) |
| 58 | 97 % (29/30) | 33 % (10/30) |
| 59 | 77 % (23/30) | 67 % (20/30) |
| 60 | 20 % (6/30) | 97 % (29/30) |

Écarts aux bandes des défis : aucun.

### Région 7 : la Croisade

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 85 % (85/100) | 0,9 |
| Héroïque | Charlie | 31 % (31/100) | 0,3 |
| Héroïque | Pollen | 50 % (50/100) | 0,5 |
| Héroïque | les trois | 55 % (166/300) | 0,6 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 77 % (77/100) | 12,0 |
| Fer | Pollen | 50 % (50/100) | 10,0 |
| Fer | les trois | 76 % (227/300) | 14,0 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 61 | 27 % (8/30) | 100 % (30/30) |
| 62 | 57 % (17/30) | 100 % (30/30) |
| 63 | 10 % (3/30) | 100 % (30/30) |
| 64 | 73 % (22/30) | 67 % (20/30) |
| 65 | 73 % (22/30) | 67 % (20/30) |
| 66 | 97 % (29/30) | 100 % (30/30) |
| 67 | 43 % (13/30) | 57 % (17/30) |
| 68 | 100 % (30/30) | 100 % (30/30) |
| 69 | 17 % (5/30) | 33 % (10/30) |
| 70 | 57 % (17/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 8 : le Monastère Noir

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 96 % (96/100) | 1,0 |
| Héroïque | Charlie | 28 % (28/100) | 0,3 |
| Héroïque | Pollen | 64 % (64/100) | 0,6 |
| Héroïque | les trois | 63 % (188/300) | 0,6 |
| Fer | Plume | 98 % (98/100) | 18,4 |
| Fer | Charlie | 31 % (31/100) | 6,0 |
| Fer | Pollen | 40 % (40/100) | 8,0 |
| Fer | les trois | 56 % (169/300) | 10,8 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 71 | 97 % (29/30) | 100 % (30/30) |
| 72 | 97 % (29/30) | 100 % (30/30) |
| 73 | 100 % (30/30) | 100 % (30/30) |
| 74 | 60 % (18/30) | 33 % (10/30) |
| 75 | 43 % (13/30) | 33 % (10/30) |
| 76 | 33 % (10/30) | 33 % (10/30) |
| 77 | 43 % (13/30) | 33 % (10/30) |
| 78 | 33 % (10/30) | 70 % (21/30) |
| 79 | 53 % (16/30) | 27 % (8/30) |
| 80 | 67 % (20/30) | 33 % (10/30) |

Écarts aux bandes des défis : aucun.

### Région 9 : la Cité du Roi

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 84 % (84/100) | 0,8 |
| Héroïque | Charlie | 32 % (32/100) | 0,3 |
| Héroïque | Pollen | 24 % (24/100) | 0,2 |
| Héroïque | les trois | 47 % (140/300) | 0,5 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 83 % (83/100) | 14,5 |
| Fer | Pollen | 80 % (80/100) | 15,5 |
| Fer | les trois | 88 % (263/300) | 16,7 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 81 | 67 % (20/30) | 100 % (30/30) |
| 82 | 33 % (10/30) | 100 % (30/30) |
| 83 | 93 % (28/30) | 100 % (30/30) |
| 84 | 33 % (10/30) | 100 % (30/30) |
| 85 | 93 % (28/30) | 100 % (30/30) |
| 86 | 30 % (9/30) | 40 % (12/30) |
| 87 | 40 % (12/30) | 100 % (30/30) |
| 88 | 37 % (11/30) | 100 % (30/30) |
| 89 | 13 % (4/30) | 37 % (11/30) |
| 90 | 27 % (8/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 10 : la Cathédrale du Soleil Blême

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 86 % (86/100) | 0,9 |
| Héroïque | Charlie | 57 % (57/100) | 0,6 |
| Héroïque | Pollen | 46 % (46/100) | 0,5 |
| Héroïque | les trois | 63 % (189/300) | 0,6 |
| Fer | Plume | 100 % (100/100) | 20,0 |
| Fer | Charlie | 82 % (82/100) | 13,2 |
| Fer | Pollen | 58 % (58/100) | 10,1 |
| Fer | les trois | 80 % (240/300) | 14,4 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 91 | 100 % (30/30) | 90 % (27/30) |
| 92 | 100 % (30/30) | 100 % (30/30) |
| 93 | 67 % (20/30) | 67 % (20/30) |
| 94 | 97 % (29/30) | 50 % (15/30) |
| 95 | 0 % (0/30) | 33 % (10/30) |
| 96 | 47 % (14/30) | 100 % (30/30) |
| 97 | 43 % (13/30) | 63 % (19/30) |
| 98 | 63 % (19/30) | 100 % (30/30) |
| 99 | 33 % (10/30) | 97 % (29/30) |
| 100 | 80 % (24/30) | 100 % (30/30) |

Écarts aux bandes des défis : aucun.

### Région 11 : les Grèves Grises

| Défi | Dieu | Soigneux : réussites | Soigneux : vies restantes |
| --- | --- | --- | --- |
| Héroïque | Plume | 73 % (73/100) | 0,7 |
| Héroïque | Charlie | 29 % (29/100) | 0,3 |
| Héroïque | Pollen | 39 % (39/100) | 0,4 |
| Héroïque | les trois | 47 % (141/300) | 0,5 |
| Fer | Plume | 97 % (97/100) | 17,2 |
| Fer | Charlie | 78 % (78/100) | 9,8 |
| Fer | Pollen | 44 % (44/100) | 4,9 |
| Fer | les trois | 73 % (219/300) | 10,6 |

| Niveau | Héroïque, soigneux (trois dieux) | Fer, soigneux (trois dieux) |
| --- | --- | --- |
| 101 | 30 % (9/30) | 57 % (17/30) |
| 102 | 87 % (26/30) | 73 % (22/30) |
| 103 | 10 % (3/30) | 100 % (30/30) |
| 104 | 30 % (9/30) | 90 % (27/30) |
| 105 | 13 % (4/30) | 60 % (18/30) |
| 106 | 97 % (29/30) | 33 % (10/30) |
| 107 | 97 % (29/30) | 67 % (20/30) |
| 108 | 77 % (23/30) | 63 % (19/30) |
| 109 | 30 % (9/30) | 100 % (30/30) |
| 110 | 0 % (0/30) | 87 % (26/30) |

Écarts aux bandes des défis : aucun.

## Mode infini

Matou, 20 vies, sans amélioration ni objet, chaque dieu avec son avatar, 10 graines par ligne. Résultat d’une partie : la dernière vague terminée (le record). On arrête une partie à la vague 100. Bandes, sur les cartes de la région 1 : la médiane du soigneux est entre la vague 25 et la vague 45 ; le naïf ne passe pas la vague 30 (aucune de ses parties). Les autres cartes sont données à titre d’information. Le soigneux joue une seule variante (équilibrée, diversité 0,4) et lit les 30 premières vagues générées.

| Bot | Dieu | Carte | Médiane | Min à max | Vagues par graine |
| --- | --- | --- | --- | --- | --- |
| Naïf | plume | chaumes (région 1) | 11 | 4 à 29 | 4 6 6 7 11 11 12 28 29 29 |
| Soigneux | plume | chaumes (région 1) | 37 | 35 à 38 | 35 36 36 36 37 37 38 38 38 38 |
| Naïf | charlie | chaumes (région 1) | 6 | 3 à 6 | 3 4 5 5 6 6 6 6 6 6 |
| Soigneux | charlie | chaumes (région 1) | 35 | 11 à 36 | 11 12 13 34 35 35 35 36 36 36 |
| Naïf | pollen | chaumes (région 1) | 29 | 27 à 30 | 27 28 28 29 29 29 29 30 30 30 |
| Soigneux | pollen | chaumes (région 1) | 36 | 35 à 37 | 35 36 36 36 36 36 36 36 36 37 |
| Naïf | plume | gue (région 1) | 18.5 | 6 à 29 | 6 6 9 9 9 28 28 28 29 29 |
| Soigneux | plume | gue (région 1) | 34 | 34 à 35 | 34 34 34 34 34 34 35 35 35 35 |
| Naïf | charlie | gue (région 1) | 7 | 5 à 8 | 5 5 6 6 7 7 7 8 8 8 |
| Soigneux | charlie | gue (région 1) | 33 | 32 à 34 | 32 32 32 32 33 33 33 33 33 34 |
| Naïf | pollen | gue (région 1) | 29 | 28 à 30 | 28 28 28 28 29 29 29 29 30 30 |
| Soigneux | pollen | gue (région 1) | 33 | 33 à 34 | 33 33 33 33 33 33 33 34 34 34 |
| Naïf | plume | pendus (région 1) | 7 | 4 à 27 | 4 4 6 6 7 7 8 9 26 27 |
| Soigneux | plume | pendus (région 1) | 38 | 37 à 39 | 37 37 38 38 38 38 38 38 38 39 |
| Naïf | charlie | pendus (région 1) | 5 | 2 à 7 | 2 4 4 4 5 5 6 6 7 7 |
| Soigneux | charlie | pendus (région 1) | 35.5 | 34 à 36 | 34 35 35 35 35 36 36 36 36 36 |
| Naïf | pollen | pendus (région 1) | 28 | 26 à 29 | 26 26 28 28 28 28 29 29 29 29 |
| Soigneux | pollen | pendus (région 1) | 36 | 36 à 38 | 36 36 36 36 36 36 36 36 37 38 |
| Naïf | plume | carrefour (région 1) | 28.5 | 6 à 29 | 6 9 27 28 28 29 29 29 29 29 |
| Soigneux | plume | carrefour (région 1) | 35 | 35 à 36 | 35 35 35 35 35 35 35 35 35 36 |
| Naïf | charlie | carrefour (région 1) | 7 | 4 à 26 | 4 4 6 6 7 7 9 9 9 26 |
| Soigneux | charlie | carrefour (région 1) | 33.5 | 33 à 34 | 33 33 33 33 33 34 34 34 34 34 |
| Naïf | pollen | carrefour (région 1) | 28 | 27 à 29 | 27 27 28 28 28 28 29 29 29 29 |
| Soigneux | pollen | carrefour (région 1) | 34 | 33 à 35 | 33 33 33 33 34 34 34 34 34 35 |
| Naïf | plume | region3 (région 3) | 9 | 4 à 12 | 4 6 7 8 9 9 9 11 11 12 |
| Soigneux | plume | region3 (région 3) | 36 | 35 à 37 | 35 35 36 36 36 36 36 36 36 37 |
| Naïf | charlie | region3 (région 3) | 8 | 3 à 12 | 3 6 7 7 8 8 8 9 9 12 |
| Soigneux | charlie | region3 (région 3) | 22 | 8 à 32 | 8 9 14 16 18 26 28 28 31 32 |
| Naïf | pollen | region3 (région 3) | 20 | 9 à 28 | 9 9 10 12 14 26 27 27 28 28 |
| Soigneux | pollen | region3 (région 3) | 32.5 | 30 à 34 | 30 31 32 32 32 33 33 33 34 34 |
| Naïf | plume | region6 (région 6) | 9 | 7 à 27 | 7 9 9 9 9 9 13 14 17 27 |
| Soigneux | plume | region6 (région 6) | 37 | 36 à 38 | 36 37 37 37 37 37 38 38 38 38 |
| Naïf | charlie | region6 (région 6) | 9 | 7 à 15 | 7 7 7 9 9 9 9 13 14 15 |
| Soigneux | charlie | region6 (région 6) | 32 | 9 à 34 | 9 30 31 32 32 32 32 33 33 34 |
| Naïf | pollen | region6 (région 6) | 26 | 11 à 29 | 11 14 14 18 26 26 26 27 28 29 |
| Soigneux | pollen | region6 (région 6) | 30.5 | 29 à 34 | 29 30 30 30 30 31 32 32 32 34 |
| Naïf | plume | region10 (région 10) | 13 | 9 à 15 | 9 9 9 12 13 13 13 13 14 15 |
| Soigneux | plume | region10 (région 10) | 35 | 34 à 37 | 34 34 34 34 35 35 36 36 36 37 |
| Naïf | charlie | region10 (région 10) | 10.5 | 9 à 13 | 9 9 9 9 9 12 13 13 13 13 |
| Soigneux | charlie | region10 (région 10) | 13 | 9 à 29 | 9 9 9 9 13 13 13 13 18 29 |
| Naïf | pollen | region10 (région 10) | 13.5 | 9 à 26 | 9 9 12 13 13 14 15 15 16 26 |
| Soigneux | pollen | region10 (région 10) | 14 | 9 à 30 | 9 9 13 14 14 14 15 16 17 30 |

Écarts aux bandes de l’infini : aucun.

## La zone (jalon 5)

Taux de victoire du soigneux, trois dieux, sans tour divine, 45 % des arêtes de départ en Vieux Sage (sans quoi tout se gagne), avec quatre compositions de tours : sans zone (tir, magie), zone sans caserne (tir, magie, artillerie), caserne sans zone (caserne, tir, magie), caserne et zone. Niveaux ordinaires : 4, 6, 8, 14, 15, 18, 22, 25 ; niveaux de horde : 7, 13, 17.

| Niveaux | Sans zone | Zone, sans caserne | Caserne, sans zone | Caserne et zone |
| --- | --- | --- | --- | --- |
| Ordinaires | 37 % | 41 % | 37 % | 50 % |
| Horde | 9 % | 31 % | 0 % | 31 % |

Critères : ordinaires, la zone sans caserne ne gagne pas plus que sans zone (écart 4 points, au plus 6 tolérés) ; avec caserne, la zone gagne 13 points de plus (au moins 10) ; en horde, la zone gagne 22 points de plus (au moins 20).
