# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau de la région 1 est rejoué sans
affichage dans les trois difficultés par deux bots, sur 10 graines chacun (version des données 2).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (socle, famille, niveau,
  spécialisation), après une petite recherche entre six préférences de famille jouées sur des graines d’entraînement ; place le
  héros dans la zone de feu de ses tours, lance la Chute du Colosse sur les grappes d’ennemis et les Renforts devant ses tours,
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter.
- **Naïf** : construit sur les socles proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

Toutes les bandes sont respectées.

| Difficulté | Naïf | Bande naïf | Soigneux | Bande soigneux | Sans défense |
| --- | --- | --- | --- | --- | --- |
| Chaton | 100 % | 100 % | 100 % | — | 3 % |
| Matou | 84 % | 50 % à 90 % | 100 % | 100 % | 0 % |
| Vieux Sage | 28 % | — | 91 % | au moins 80 % | 0 % |

Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.9.

## Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 160 / 271 | aucune / aucune | 158 / 74 | gagné 1/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 134 / 189 | aucune / aucune | 188 / 124 | perdu en 180 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 147 / 250 | aucune / aucune | 202 / 153 | perdu en 217 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 122 / 363 | aucune / aucune | 235 / 188 | perdu en 198 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 155 / 117 | aucune / aucune | 217 / 180 | perdu en 115 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 327 / 1314 | aucune / aucune | 262 / 216 | perdu en 131 s |
| 7 | 100 % (10/10) | 24,9 | 100 % (10/10) | 25,0 | 604 / 1673 | 1 (0,1 vies) / aucune | 308 / 277 | perdu en 119 s |
| 8 | 100 % (10/10) | 24,4 | 100 % (10/10) | 25,0 | 990 / 2178 | 3 (0,6 vies) / aucune | 319 / 281 | perdu en 128 s |
| 9 | 100 % (10/10) | 22,1 | 100 % (10/10) | 25,0 | 2607 / 4242 | 4 (1,7 vies) / aucune | 371 / 350 | perdu en 98 s |
| 10 | 100 % (10/10) | 24,9 | 100 % (10/10) | 24,5 | 4724 / 6344 | 1 (0,1 vies) / 2 (0,4 vies) | 439 / 394 | perdu en 90 s |

## Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 19,0 | 100 % (10/10) | 20,0 | 99 / 135 | 5 (0,4 vies) / aucune | 166 / 113 | perdu en 132 s |
| 2 | 100 % (10/10) | 18,1 | 100 % (10/10) | 20,0 | 106 / 197 | 3 (1,2 vies) / aucune | 196 / 146 | perdu en 114 s |
| 3 | 100 % (10/10) | 17,8 | 100 % (10/10) | 20,0 | 109 / 308 | 5 (1,2 vies) / aucune | 208 / 171 | perdu en 109 s |
| 4 | 100 % (10/10) | 19,2 | 100 % (10/10) | 20,0 | 166 / 168 | 1 (0,6 vies) / aucune | 239 / 196 | perdu en 98 s |
| 5 | 90 % (9/10) | 13,7 | 100 % (10/10) | 19,7 | 164 / 294 | 8 (1,8 vies) / 4 (0,2 vies) | 220 / 194 | perdu en 84 s |
| 6 | 100 % (10/10) | 12,0 | 100 % (10/10) | 19,9 | 170 / 78 | 6 (2,3 vies) / 3 (0,1 vies) | 270 / 238 | perdu en 83 s |
| 7 | 90 % (9/10) | 10,0 | 100 % (10/10) | 17,9 | 169 / 174 | 2 (2,5 vies) / 5 (1,4 vies) | 292 / 294 | perdu en 89 s |
| 8 | 60 % (6/10) | 6,8 | 100 % (10/10) | 20,0 | 98 / 374 | 3 (10,2 vies) / aucune | 239 / 294 | perdu en 92 s |
| 9 | 40 % (4/10) | 5,3 | 100 % (10/10) | 20,0 | 84 / 930 | 4 (6,3 vies) / aucune | 214 / 353 | perdu en 87 s |
| 10 | 60 % (6/10) | 4,5 | 100 % (10/10) | 16,3 | 1202 / 1432 | 2 (5,0 vies) / 2 (1,8 vies) | 359 / 425 | perdu en 69 s |

## Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 40 % (4/10) | 4,7 | 100 % (10/10) | 15,0 | 130 / 165 | 3 (4,4 vies) / aucune | 150 / 98 | perdu en 119 s |
| 2 | 40 % (4/10) | 2,7 | 100 % (10/10) | 15,0 | 83 / 333 | 3 (4,3 vies) / aucune | 174 / 139 | perdu en 107 s |
| 3 | 80 % (8/10) | 6,9 | 100 % (10/10) | 15,0 | 126 / 88 | 5 (2,4 vies) / aucune | 202 / 160 | perdu en 108 s |
| 4 | 90 % (9/10) | 8,5 | 100 % (10/10) | 14,6 | 113 / 311 | 3 (2,2 vies) / 3 (0,4 vies) | 230 / 200 | perdu en 97 s |
| 5 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,5 | 62 / 64 | 4 (7,1 vies) / 2 (0,3 vies) | 138 / 196 | perdu en 70 s |
| 6 | 20 % (2/10) | 1,3 | 100 % (10/10) | 13,2 | 113 / 338 | 4 (5,9 vies) / 3 (1,0 vies) | 163 / 251 | perdu en 79 s |
| 7 | 10 % (1/10) | 1,2 | 80 % (8/10) | 7,5 | 115 / 162 | 2 (4,7 vies) / 5 (4,5 vies) | 136 / 253 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,7 | 69 / 186 | 3 (10,8 vies) / 3 (1,3 vies) | 102 / 292 | perdu en 91 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,7 | 70 / 61 | 2 (7,5 vies) / 4 (0,2 vies) | 111 / 356 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 30 % (3/10) | 1,3 | 61 / 195 | 2 (7,6 vies) / 2 (3,9 vies) | 89 / 339 | perdu en 66 s |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau : elle doit globalement décroître, le niveau 10 étant le plus dur.

| Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Vies restantes | 19,0 | 18,1 | 17,8 | 19,2 | 13,7 | 12,0 | 10,0 | 6,8 | 5,3 | 4,5 |

Corrélation de rang (Spearman) entre le niveau et les vies restantes : -0,9 (−1 = décroissance parfaite). Niveau le plus dur : 10 (4,5 vies).

## Variante choisie par le bot soigneux

La recherche en amont garde, pour chaque niveau et chaque difficulté, la préférence de famille qui joue le mieux sur les graines d’entraînement.

| Niveau | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- |
| 1 | artillerie | caserne | artillerie |
| 2 | sans caserne | caserne | artillerie |
| 3 | artillerie | caserne | équilibrée |
| 4 | artillerie | sans caserne | sans caserne |
| 5 | magie | équilibrée | caserne |
| 6 | tir | artillerie | équilibrée |
| 7 | tir | caserne | équilibrée |
| 8 | tir | caserne | artillerie |
| 9 | tir | caserne | caserne |
| 10 | tir | équilibrée | équilibrée |

## Tours choisies par le bot soigneux

Constructions par famille et spécialisations par voie, sur toutes les parties du bot soigneux, de la plus à la moins choisie.

**Chaton** : la plus choisie, Clocher des Archers (construction) (470 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Clocher des Archers (construction) | 470 |
| Arbalétriers du Beffroi (spécialisation B) | 469 |
| Catapulte du Rempart (construction) | 270 |
| Autel des Cendres (construction) | 80 |
| Nécromancien des Neuf Vies (spécialisation B) | 40 |
| Baliste à Chaînes (spécialisation B) | 35 |
| Mortier de Soufre (spécialisation A) | 10 |
| Grenier des Griffes (construction) | 0 |
| Garde du Cloître (spécialisation A) | 0 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |

**Matou** : la plus choisie, Grenier des Griffes (construction) (427 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Grenier des Griffes (construction) | 427 |
| Garde du Cloître (spécialisation A) | 230 |
| Catapulte du Rempart (construction) | 218 |
| Clocher des Archers (construction) | 142 |
| Baliste à Chaînes (spécialisation B) | 106 |
| Arbalétriers du Beffroi (spécialisation B) | 94 |
| Mortier de Soufre (spécialisation A) | 20 |
| Autel des Cendres (construction) | 10 |
| Nécromancien des Neuf Vies (spécialisation B) | 10 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |

**Vieux Sage** : la plus choisie, Catapulte du Rempart (construction) (416 fois) ; la moins choisie, Nécromancien des Neuf Vies (spécialisation B) (0 fois).

| Choix | Fois |
| --- | --- |
| Catapulte du Rempart (construction) | 416 |
| Clocher des Archers (construction) | 249 |
| Baliste à Chaînes (spécialisation B) | 113 |
| Grenier des Griffes (construction) | 109 |
| Arbalétriers du Beffroi (spécialisation B) | 95 |
| Garde du Cloître (spécialisation A) | 94 |
| Mortier de Soufre (spécialisation A) | 28 |
| Autel des Cendres (construction) | 10 |
| Oracle de la Braise (spécialisation A) | 10 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Nécromancien des Neuf Vies (spécialisation B) | 0 |

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
