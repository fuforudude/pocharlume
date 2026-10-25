# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau de la région 1 est rejoué sans
affichage dans les trois difficultés par deux bots, sur 10 graines chacun (version des données 1).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (socle, famille, niveau,
  spécialisation), après une petite recherche entre six préférences de famille jouées sur des graines d’entraînement ; place le
  héros dans la zone de feu de ses tours, lance la Chute du Colosse sur les grappes d’ennemis et les Renforts devant ses tours,
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter.
- **Naïf** : construit sur les socles proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

**5 écart(s)** :

- Chaton : le bot naïf gagne 99 % des parties, il doit tout gagner
- Matou : le bot naïf gagne 98 % des parties, la bande est 50 % à 90 %
- Sans défense : le niveau 2 est gagné 3 fois sur 3 en chaton
- Sans défense : le niveau 3 est gagné 3 fois sur 3 en chaton
- Sans défense : le niveau 4 est gagné 1 fois sur 3 en chaton

| Difficulté | Naïf | Bande naïf | Soigneux | Bande soigneux | Sans défense |
| --- | --- | --- | --- | --- | --- |
| Chaton | 99 % | 100 % | 100 % | — | 33 % |
| Matou | 98 % | 50 % à 90 % | 100 % | 100 % | 0 % |
| Vieux Sage | 77 % | — | 100 % | au moins 80 % | 0 % |

Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.15, Matou ×1, Vieux Sage ×0.9.

## Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 68 / 121 | aucune / aucune | 185 / 136 | gagné 3/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 72 / 283 | aucune / aucune | 222 / 167 | gagné 3/3 |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 86 / 105 | aucune / aucune | 230 / 172 | gagné 3/3 |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 131 / 217 | aucune / aucune | 276 / 235 | gagné 1/3 |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 83 / 280 | aucune / aucune | 226 / 187 | perdu en 169 s |
| 6 | 100 % (10/10) | 24,3 | 100 % (10/10) | 25,0 | 88 / 226 | 3 (0,4 vies) / aucune | 301 / 255 | perdu en 222 s |
| 7 | 100 % (10/10) | 24,4 | 100 % (10/10) | 25,0 | 98 / 269 | 2 (0,3 vies) / aucune | 342 / 307 | perdu en 182 s |
| 8 | 100 % (10/10) | 24,8 | 100 % (10/10) | 25,0 | 112 / 245 | 2 (0,2 vies) / aucune | 354 / 326 | perdu en 221 s |
| 9 | 90 % (9/10) | 16,8 | 100 % (10/10) | 25,0 | 135 / 283 | 4 (5,7 vies) / aucune | 415 / 395 | perdu en 125 s |
| 10 | 100 % (10/10) | 23,6 | 100 % (10/10) | 25,0 | 237 / 328 | 12 (1,0 vies) / aucune | 505 / 475 | perdu en 141 s |

## Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 69 / 198 | aucune / aucune | 187 / 142 | perdu en 190 s |
| 2 | 100 % (10/10) | 19,8 | 100 % (10/10) | 20,0 | 70 / 165 | 5 (0,2 vies) / aucune | 231 / 179 | perdu en 185 s |
| 3 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 112 / 250 | aucune / aucune | 233 / 177 | perdu en 201 s |
| 4 | 100 % (10/10) | 20,0 | 100 % (10/10) | 20,0 | 73 / 185 | aucune / aucune | 279 / 229 | perdu en 169 s |
| 5 | 100 % (10/10) | 19,2 | 100 % (10/10) | 20,0 | 82 / 227 | 2 (0,4 vies) / aucune | 230 / 186 | perdu en 140 s |
| 6 | 100 % (10/10) | 17,3 | 100 % (10/10) | 19,7 | 77 / 126 | 3 (0,9 vies) / 7 (0,2 vies) | 304 / 253 | perdu en 168 s |
| 7 | 100 % (10/10) | 19,0 | 100 % (10/10) | 20,0 | 72 / 215 | 1 (0,3 vies) / aucune | 345 / 309 | perdu en 157 s |
| 8 | 100 % (10/10) | 19,4 | 100 % (10/10) | 20,0 | 118 / 280 | 3 (0,4 vies) / aucune | 357 / 330 | perdu en 185 s |
| 9 | 80 % (8/10) | 6,6 | 100 % (10/10) | 20,0 | 109 / 190 | 4 (8,1 vies) / aucune | 368 / 398 | perdu en 122 s |
| 10 | 100 % (10/10) | 13,9 | 100 % (10/10) | 19,7 | 202 / 371 | 12 (4,0 vies) / 3 (0,3 vies) | 563 / 495 | perdu en 122 s |

## Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 14,3 | 100 % (10/10) | 15,0 | 46 / 97 | 2 (0,2 vies) / aucune | 193 / 142 | perdu en 162 s |
| 2 | 100 % (10/10) | 11,6 | 100 % (10/10) | 14,9 | 68 / 197 | 5 (1,6 vies) / 1 (0,1 vies) | 234 / 173 | perdu en 149 s |
| 3 | 100 % (10/10) | 14,9 | 100 % (10/10) | 15,0 | 67 / 137 | 3 (0,1 vies) / aucune | 236 / 173 | perdu en 170 s |
| 4 | 100 % (10/10) | 14,4 | 100 % (10/10) | 15,0 | 70 / 156 | 3 (0,3 vies) / aucune | 281 / 252 | perdu en 146 s |
| 5 | 70 % (7/10) | 6,6 | 100 % (10/10) | 14,9 | 58 / 146 | 8 (2,5 vies) / 7 (0,1 vies) | 223 / 185 | perdu en 111 s |
| 6 | 70 % (7/10) | 5,3 | 100 % (10/10) | 12,8 | 97 / 101 | 3 (3,0 vies) / 6 (2,2 vies) | 282 / 275 | perdu en 128 s |
| 7 | 90 % (9/10) | 11,0 | 100 % (10/10) | 15,0 | 84 / 211 | 5 (2,0 vies) / aucune | 330 / 308 | perdu en 133 s |
| 8 | 100 % (10/10) | 13,5 | 100 % (10/10) | 15,0 | 99 / 243 | 2 (0,5 vies) / aucune | 361 / 335 | perdu en 155 s |
| 9 | 20 % (2/10) | 1,6 | 100 % (10/10) | 15,0 | 91 / 43 | 3 (6,8 vies) / aucune | 187 / 402 | perdu en 119 s |
| 10 | 20 % (2/10) | 1,8 | 100 % (10/10) | 15,0 | 117 / 218 | 12 (6,0 vies) / aucune | 446 / 441 | perdu en 93 s |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau : elle doit globalement décroître, le niveau 10 étant le plus dur.

| Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Vies restantes | 20,0 | 19,8 | 20,0 | 20,0 | 19,2 | 17,3 | 19,0 | 19,4 | 6,6 | 13,9 |

Corrélation de rang (Spearman) entre le niveau et les vies restantes : -0,8 (−1 = décroissance parfaite). Niveau le plus dur : 9 (6,6 vies).

## Variante choisie par le bot soigneux

La recherche en amont garde, pour chaque niveau et chaque difficulté, la préférence de famille qui joue le mieux sur les graines d’entraînement.

| Niveau | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- |
| 1 | sans caserne | sans caserne | tir |
| 2 | sans caserne | tir | sans caserne |
| 3 | magie | équilibrée | tir |
| 4 | équilibrée | tir | sans caserne |
| 5 | sans caserne | équilibrée | tir |
| 6 | magie | tir | caserne |
| 7 | magie | artillerie | équilibrée |
| 8 | magie | sans caserne | artillerie |
| 9 | magie | tir | tir |
| 10 | artillerie | équilibrée | tir |

## Tours choisies par le bot soigneux

Constructions par famille et spécialisations par voie, sur toutes les parties du bot soigneux, de la plus à la moins choisie.

**Chaton** : la plus choisie, Autel des Cendres (construction) (330 fois) ; la moins choisie, Mortier de Soufre (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Autel des Cendres (construction) | 330 |
| Clocher des Archers (construction) | 180 |
| Catapulte du Rempart (construction) | 120 |
| Grenier des Griffes (construction) | 30 |
| Baliste à Chaînes (spécialisation B) | 30 |
| Arbalétriers du Beffroi (spécialisation B) | 10 |
| Nécromancien des Neuf Vies (spécialisation B) | 10 |
| Garde du Cloître (spécialisation A) | 0 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |
| Mortier de Soufre (spécialisation A) | 0 |

**Matou** : la plus choisie, Clocher des Archers (construction) (460 fois) ; la moins choisie, Mortier de Soufre (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Clocher des Archers (construction) | 460 |
| Catapulte du Rempart (construction) | 200 |
| Arbalétriers du Beffroi (spécialisation B) | 40 |
| Baliste à Chaînes (spécialisation B) | 30 |
| Autel des Cendres (construction) | 10 |
| Grenier des Griffes (construction) | 0 |
| Garde du Cloître (spécialisation A) | 0 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |
| Nécromancien des Neuf Vies (spécialisation B) | 0 |
| Mortier de Soufre (spécialisation A) | 0 |

**Vieux Sage** : la plus choisie, Clocher des Archers (construction) (470 fois) ; la moins choisie, Baliste à Chaînes (spécialisation B) (0 fois).

| Choix | Fois |
| --- | --- |
| Clocher des Archers (construction) | 470 |
| Catapulte du Rempart (construction) | 150 |
| Arbalétriers du Beffroi (spécialisation B) | 80 |
| Grenier des Griffes (construction) | 50 |
| Garde du Cloître (spécialisation A) | 10 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Autel des Cendres (construction) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |
| Nécromancien des Neuf Vies (spécialisation B) | 0 |
| Mortier de Soufre (spécialisation A) | 0 |
| Baliste à Chaînes (spécialisation B) | 0 |

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
