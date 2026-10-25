# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau de la région 1 est rejoué sans
affichage dans les trois difficultés par deux bots, sur 10 graines chacun (version des données 2).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (socle, famille, niveau,
  spécialisation), après une petite recherche entre dix variantes (5 préférences × 2 diversités) jouées sur des graines d’entraînement ; place le
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
| Matou | 77 % | 50 % à 90 % | 100 % | 100 % | 0 % |
| Vieux Sage | 26 % | — | 97 % | au moins 80 % | 0 % |

Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.9.

## Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 160 / 217 | aucune / aucune | 158 / 101 | gagné 1/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 134 / 159 | aucune / aucune | 188 / 137 | perdu en 180 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 147 / 271 | aucune / aucune | 202 / 130 | perdu en 217 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 122 / 315 | aucune / aucune | 235 / 192 | perdu en 198 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 166 / 272 | aucune / aucune | 218 / 182 | perdu en 115 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 230 / 477 | aucune / aucune | 262 / 236 | perdu en 131 s |
| 7 | 100 % (10/10) | 24,5 | 100 % (10/10) | 25,0 | 526 / 405 | 1 (0,5 vies) / aucune | 308 / 276 | perdu en 119 s |
| 8 | 100 % (10/10) | 24,5 | 100 % (10/10) | 25,0 | 961 / 1083 | 3 (0,5 vies) / aucune | 319 / 286 | perdu en 128 s |
| 9 | 100 % (10/10) | 22,1 | 100 % (10/10) | 25,0 | 2607 / 3076 | 4 (1,7 vies) / aucune | 371 / 345 | perdu en 98 s |
| 10 | 100 % (10/10) | 24,4 | 100 % (10/10) | 25,0 | 4570 / 4903 | 2 (0,3 vies) / aucune | 440 / 418 | perdu en 90 s |

## Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 19,0 | 100 % (10/10) | 20,0 | 99 / 245 | 5 (0,4 vies) / aucune | 166 / 97 | perdu en 132 s |
| 2 | 100 % (10/10) | 19,3 | 100 % (10/10) | 20,0 | 113 / 211 | 3 (0,5 vies) / aucune | 197 / 142 | perdu en 114 s |
| 3 | 100 % (10/10) | 17,8 | 100 % (10/10) | 20,0 | 109 / 118 | 5 (1,2 vies) / aucune | 208 / 159 | perdu en 109 s |
| 4 | 100 % (10/10) | 19,2 | 100 % (10/10) | 20,0 | 166 / 116 | 1 (0,6 vies) / aucune | 239 / 197 | perdu en 98 s |
| 5 | 90 % (9/10) | 10,1 | 100 % (10/10) | 19,8 | 111 / 265 | 8 (2,9 vies) / 3 (0,2 vies) | 222 / 186 | perdu en 84 s |
| 6 | 90 % (9/10) | 10,0 | 100 % (10/10) | 19,8 | 182 / 211 | 6 (3,3 vies) / 8 (0,2 vies) | 263 / 239 | perdu en 83 s |
| 7 | 70 % (7/10) | 7,7 | 100 % (10/10) | 18,0 | 113 / 155 | 5 (3,3 vies) / 5 (2,0 vies) | 255 / 287 | perdu en 89 s |
| 8 | 50 % (5/10) | 6,7 | 100 % (10/10) | 19,5 | 109 / 276 | 3 (9,9 vies) / 6 (0,5 vies) | 230 / 292 | perdu en 92 s |
| 9 | 40 % (4/10) | 5,3 | 100 % (10/10) | 20,0 | 84 / 470 | 4 (6,3 vies) / aucune | 214 / 349 | perdu en 87 s |
| 10 | 30 % (3/10) | 2,5 | 100 % (10/10) | 18,2 | 547 / 1710 | 3 (5,3 vies) / 11 (0,5 vies) | 277 / 459 | perdu en 69 s |

## Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 40 % (4/10) | 4,7 | 100 % (10/10) | 15,0 | 130 / 223 | 3 (4,4 vies) / aucune | 150 / 116 | perdu en 119 s |
| 2 | 40 % (4/10) | 2,8 | 100 % (10/10) | 14,3 | 77 / 55 | 3 (4,5 vies) / 7 (0,4 vies) | 179 / 155 | perdu en 107 s |
| 3 | 80 % (8/10) | 6,9 | 100 % (10/10) | 15,0 | 126 / 213 | 5 (2,4 vies) / aucune | 202 / 158 | perdu en 108 s |
| 4 | 90 % (9/10) | 8,5 | 100 % (10/10) | 15,0 | 113 / 64 | 3 (2,2 vies) / aucune | 230 / 204 | perdu en 97 s |
| 5 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,5 | 62 / 212 | 4 (5,6 vies) / 3 (0,5 vies) | 120 / 187 | perdu en 70 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 11,5 | 64 / 127 | 4 (7,5 vies) / 6 (3,3 vies) | 133 / 250 | perdu en 79 s |
| 7 | 10 % (1/10) | 0,7 | 100 % (10/10) | 8,0 | 85 / 102 | 2 (5,4 vies) / 5 (5,0 vies) | 136 / 285 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 100 % (10/10) | 11,1 | 44 / 248 | 3 (10,8 vies) / 3 (3,4 vies) | 97 / 293 | perdu en 91 s |
| 9 | 0 % (0/10) | 0,0 | 100 % (10/10) | 13,4 | 70 / 129 | 2 (7,5 vies) / 5 (1,2 vies) | 111 / 352 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 70 % (7/10) | 5,5 | 61 / 323 | 2 (8,3 vies) / 3 (4,4 vies) | 80 / 321 | perdu en 66 s |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau : elle doit globalement décroître, le niveau 10 étant le plus dur.

| Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Vies restantes | 19,0 | 19,3 | 17,8 | 19,2 | 10,1 | 10,0 | 7,7 | 6,7 | 5,3 | 2,5 |

Corrélation de rang (Spearman) entre le niveau et les vies restantes : -0,9 (−1 = décroissance parfaite). Niveau le plus dur : 10 (2,5 vies).

## Variante choisie par le bot soigneux

La recherche en amont garde, pour chaque niveau et chaque difficulté, la préférence de famille qui joue le mieux sur les graines d’entraînement.

| Niveau | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- |
| 1 | magie, diversité 0.4 | caserne, diversité 1 | artillerie, diversité 1 |
| 2 | équilibrée, diversité 0.4 | équilibrée, diversité 0.4 | tir, diversité 0.4 |
| 3 | magie, diversité 1 | équilibrée, diversité 0.4 | équilibrée, diversité 1 |
| 4 | magie, diversité 0.4 | caserne, diversité 1 | équilibrée, diversité 0.4 |
| 5 | magie, diversité 1 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 6 | caserne, diversité 0.4 | tir, diversité 1 | caserne, diversité 1 |
| 7 | caserne, diversité 1 | caserne, diversité 0.4 | caserne, diversité 0.4 |
| 8 | caserne, diversité 0.4 | artillerie, diversité 1 | artillerie, diversité 0.4 |
| 9 | caserne, diversité 0.4 | caserne, diversité 0.4 | caserne, diversité 0.4 |
| 10 | caserne, diversité 1 | équilibrée, diversité 1 | artillerie, diversité 1 |

## Tours choisies par le bot soigneux

Constructions par famille et spécialisations par voie, sur toutes les parties du bot soigneux, de la plus à la moins choisie.

**Chaton** : la plus choisie, Grenier des Griffes (construction) (237 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Grenier des Griffes (construction) | 237 |
| Garde du Cloître (spécialisation A) | 207 |
| Clocher des Archers (construction) | 194 |
| Autel des Cendres (construction) | 190 |
| Catapulte du Rempart (construction) | 157 |
| Arbalétriers du Beffroi (spécialisation B) | 156 |
| Nécromancien des Neuf Vies (spécialisation B) | 121 |
| Baliste à Chaînes (spécialisation B) | 77 |
| Mortier de Soufre (spécialisation A) | 30 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |

**Matou** : la plus choisie, Clocher des Archers (construction) (209 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Clocher des Archers (construction) | 209 |
| Catapulte du Rempart (construction) | 201 |
| Grenier des Griffes (construction) | 193 |
| Autel des Cendres (construction) | 152 |
| Arbalétriers du Beffroi (spécialisation B) | 145 |
| Garde du Cloître (spécialisation A) | 140 |
| Nécromancien des Neuf Vies (spécialisation B) | 76 |
| Baliste à Chaînes (spécialisation B) | 71 |
| Mortier de Soufre (spécialisation A) | 30 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |

**Vieux Sage** : la plus choisie, Catapulte du Rempart (construction) (189 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Catapulte du Rempart (construction) | 189 |
| Clocher des Archers (construction) | 181 |
| Grenier des Griffes (construction) | 164 |
| Autel des Cendres (construction) | 130 |
| Arbalétriers du Beffroi (spécialisation B) | 116 |
| Garde du Cloître (spécialisation A) | 93 |
| Baliste à Chaînes (spécialisation B) | 93 |
| Nécromancien des Neuf Vies (spécialisation B) | 37 |
| Mortier de Soufre (spécialisation A) | 30 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |

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
