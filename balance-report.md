# Rapport d’équilibrage

Généré par `npm run balance` (tools/balance/) : ne pas modifier à la main. Chaque niveau de la région 1 est rejoué sans
affichage dans les trois difficultés par deux bots, sur 10 graines chacun (version des données 4).

- **Soigneux** : achète à chaque fois ce qui apporte le plus de puissance par arête dépensée (socle, famille, niveau,
  spécialisation), après une petite recherche entre dix variantes (5 préférences × 2 diversités) jouées sur des graines d’entraînement ; place le
  héros dans la zone de feu de ses tours, lance la Chute du Colosse sur les grappes d’ennemis et les Renforts devant ses tours,
  appelle les vagues en avance quand le terrain est vide et qu’il n’a plus rien à acheter. Il lit la composition des vagues futures, ce qu’un joueur ne voit pas : il est un peu optimiste.
- **Naïf** : construit sur les socles proches du chemin, famille au hasard, améliore et spécialise au hasard dès qu’il peut, sans
  sorts ni ordres au héros, sans appel de vague en avance.
- **Sans défense** : aucune action, seul le héros à son poste.

## Bandes cibles

Toutes les bandes sont respectées.

| Difficulté | Naïf | Bande naïf | Soigneux | Bande soigneux | Sans défense |
| --- | --- | --- | --- | --- | --- |
| Chaton | 100 % | 100 % | 100 % | — | 3 % |
| Matou | 35 % | 30 % à 70 % | 100 % | 100 % | 0 % |
| Vieux Sage | 7 % | — | 75 % | 60 % à 85 % | 0 % |

Bilan par difficulté, moyennes sur tous les niveaux et toutes les graines. Arêtes inutilisées : arêtes non dépensées en fin de partie
(bande en Matou pour le soigneux : moins de 250 dans chaque niveau). Niveaux avec perte : niveaux où le soigneux perd en moyenne au moins
1 vie (bande en Matou : au moins 50 % des niveaux).

| Difficulté | Naïf : vies | Soigneux : vies | Naïf : arêtes inutilisées | Soigneux : arêtes inutilisées (moyenne / pire niveau) | Soigneux : niveaux avec perte |
| --- | --- | --- | --- | --- | --- |
| Chaton | 24,2 | 25,0 | 889 | 1039 / 4812 | 0/10 |
| Matou | 4,1 | 17,3 | 86 | 141 / 223 | 6/10 |
| Vieux Sage | 0,6 | 8,5 | 64 | 106 / 196 | 7/10 |

Vies de départ : Chaton 25, Matou 20, Vieux Sage 15. Facteur sur les arêtes de départ des niveaux : Chaton ×1.5, Matou ×1, Vieux Sage ×0.85.

## Chaton

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 137 / 314 | aucune / aucune | 158 / 114 | gagné 1/3 |
| 2 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 117 / 267 | aucune / aucune | 188 / 142 | perdu en 180 s |
| 3 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 105 / 217 | aucune / aucune | 203 / 131 | perdu en 217 s |
| 4 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 134 / 248 | aucune / aucune | 235 / 196 | perdu en 198 s |
| 5 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 137 / 181 | aucune / aucune | 218 / 182 | perdu en 115 s |
| 6 | 100 % (10/10) | 25,0 | 100 % (10/10) | 25,0 | 184 / 277 | aucune / aucune | 263 / 237 | perdu en 131 s |
| 7 | 100 % (10/10) | 23,7 | 100 % (10/10) | 25,0 | 460 / 448 | 1 (0,8 vies) / aucune | 308 / 278 | perdu en 119 s |
| 8 | 100 % (10/10) | 24,6 | 100 % (10/10) | 25,0 | 857 / 978 | 2 (0,2 vies) / aucune | 319 / 288 | perdu en 128 s |
| 9 | 100 % (10/10) | 20,1 | 100 % (10/10) | 25,0 | 2292 / 2652 | 4 (3,3 vies) / aucune | 370 / 344 | perdu en 98 s |
| 10 | 100 % (10/10) | 23,6 | 100 % (10/10) | 24,8 | 4473 / 4812 | 2 (0,8 vies) / 2 (0,1 vies) | 439 / 467 | perdu en 90 s |

## Matou

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 70 % (7/10) | 9,4 | 100 % (10/10) | 19,3 | 88 / 223 | 3 (3,7 vies) / 3 (0,7 vies) | 162 / 111 | perdu en 121 s |
| 2 | 40 % (4/10) | 3,8 | 100 % (10/10) | 20,0 | 71 / 173 | 4 (5,3 vies) / aucune | 179 / 141 | perdu en 113 s |
| 3 | 70 % (7/10) | 9,3 | 100 % (10/10) | 16,1 | 69 / 60 | 5 (3,6 vies) / 5 (1,9 vies) | 200 / 147 | perdu en 109 s |
| 4 | 100 % (10/10) | 15,9 | 100 % (10/10) | 20,0 | 133 / 187 | 3 (1,4 vies) / aucune | 241 / 196 | perdu en 98 s |
| 5 | 10 % (1/10) | 1,0 | 100 % (10/10) | 17,6 | 125 / 64 | 4 (7,9 vies) / 4 (1,2 vies) | 182 / 187 | perdu en 84 s |
| 6 | 20 % (2/10) | 0,3 | 100 % (10/10) | 19,9 | 58 / 170 | 4 (7,0 vies) / 6 (0,1 vies) | 183 / 249 | perdu en 82 s |
| 7 | 10 % (1/10) | 0,5 | 100 % (10/10) | 15,7 | 82 / 118 | 2 (4,5 vies) / 5 (3,7 vies) | 152 / 288 | perdu en 89 s |
| 8 | 10 % (1/10) | 0,3 | 100 % (10/10) | 15,5 | 88 / 186 | 3 (15,7 vies) / 3 (1,6 vies) | 138 / 302 | perdu en 92 s |
| 9 | 10 % (1/10) | 0,5 | 100 % (10/10) | 16,5 | 61 / 31 | 2 (8,3 vies) / 5 (3,2 vies) | 137 / 360 | perdu en 87 s |
| 10 | 10 % (1/10) | 0,2 | 100 % (10/10) | 11,9 | 82 / 198 | 2 (7,2 vies) / 3 (2,7 vies) | 141 / 430 | perdu en 66 s |

## Vieux Sage

Vies : vies restantes moyennes (0 pour une défaite). Arêtes inutilisées : arêtes non dépensées en fin de partie (moyenne).
Durée en secondes de jeu. Vague la plus meurtrière : celle où l’on perd le plus de vies en moyenne.

| Niveau | Naïf : victoires | Naïf : vies | Soigneux : victoires | Soigneux : vies | Arêtes inutilisées (naïf / soigneux) | Vague la plus meurtrière (naïf / soigneux) | Durée (naïf / soigneux) | Sans défense |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 % (1/10) | 1,5 | 100 % (10/10) | 14,6 | 64 / 131 | 2 (6,1 vies) / 6 (0,4 vies) | 139 / 125 | perdu en 119 s |
| 2 | 0 % (0/10) | 0,0 | 100 % (10/10) | 14,9 | 58 / 96 | 3 (6,8 vies) / 3 (0,1 vies) | 130 / 142 | perdu en 107 s |
| 3 | 20 % (2/10) | 1,2 | 100 % (10/10) | 13,8 | 46 / 43 | 3 (4,6 vies) / 4 (0,8 vies) | 154 / 156 | perdu en 108 s |
| 4 | 40 % (4/10) | 3,6 | 100 % (10/10) | 14,2 | 83 / 196 | 3 (5,0 vies) / 4 (0,8 vies) | 176 / 199 | perdu en 97 s |
| 5 | 0 % (0/10) | 0,0 | 80 % (8/10) | 4,6 | 70 / 113 | 3 (6,6 vies) / 4 (4,2 vies) | 102 / 189 | perdu en 70 s |
| 6 | 0 % (0/10) | 0,0 | 100 % (10/10) | 9,9 | 66 / 95 | 2 (6,6 vies) / 4 (2,8 vies) | 113 / 250 | perdu en 79 s |
| 7 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 61 / 140 | 2 (7,1 vies) / 5 (5,4 vies) | 99 / 143 | perdu en 74 s |
| 8 | 0 % (0/10) | 0,0 | 90 % (9/10) | 6,9 | 85 / 67 | 3 (10,1 vies) / 9 (4,8 vies) | 93 / 288 | perdu en 91 s |
| 9 | 0 % (0/10) | 0,0 | 80 % (8/10) | 6,0 | 57 / 57 | 2 (10,4 vies) / 5 (5,6 vies) | 97 / 327 | perdu en 75 s |
| 10 | 0 % (0/10) | 0,0 | 0 % (0/10) | 0,0 | 51 / 122 | 2 (9,1 vies) / 4 (4,5 vies) | 78 / 264 | perdu en 66 s |

## Courbe de difficulté

Vies restantes moyennes du bot naïf en Matou, niveau par niveau : la courbe doit décroître (corrélation de rang d’au plus -0,6) et le niveau 10 figurer parmi les 3 plus durs.

| Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Vies restantes | 9,4 | 3,8 | 9,3 | 15,9 | 1,0 | 0,3 | 0,5 | 0,3 | 0,5 | 0,2 |

Corrélation de rang (Spearman) entre le niveau et les vies restantes : -0,8 (−1 = décroissance parfaite). Niveau le plus dur : 10 (0,2 vies).

## Variante choisie par le bot soigneux

La recherche en amont garde, pour chaque niveau et chaque difficulté, la préférence de famille qui joue le mieux sur les graines d’entraînement.

| Niveau | Chaton | Matou | Vieux Sage |
| --- | --- | --- | --- |
| 1 | tir, diversité 1 | équilibrée, diversité 0.4 | artillerie, diversité 0.4 |
| 2 | caserne, diversité 0.4 | équilibrée, diversité 1 | tir, diversité 1 |
| 3 | magie, diversité 0.4 | artillerie, diversité 1 | équilibrée, diversité 1 |
| 4 | caserne, diversité 0.4 | caserne, diversité 0.4 | caserne, diversité 0.4 |
| 5 | magie, diversité 0.4 | artillerie, diversité 0.4 | artillerie, diversité 0.4 |
| 6 | caserne, diversité 1 | caserne, diversité 1 | artillerie, diversité 0.4 |
| 7 | tir, diversité 0.4 | caserne, diversité 0.4 | caserne, diversité 0.4 |
| 8 | tir, diversité 0.4 | caserne, diversité 1 | tir, diversité 0.4 |
| 9 | tir, diversité 0.4 | caserne, diversité 0.4 | caserne, diversité 0.4 |
| 10 | caserne, diversité 1 | artillerie, diversité 1 | caserne, diversité 1 |

## Tours choisies par le bot soigneux

Constructions par famille et spécialisations par voie, sur toutes les parties du bot soigneux, de la plus à la moins choisie.

**Chaton** : la plus choisie, Clocher des Archers (construction) (270 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Clocher des Archers (construction) | 270 |
| Arbalétriers du Beffroi (spécialisation B) | 240 |
| Grenier des Griffes (construction) | 186 |
| Autel des Cendres (construction) | 170 |
| Catapulte du Rempart (construction) | 154 |
| Garde du Cloître (spécialisation A) | 144 |
| Nécromancien des Neuf Vies (spécialisation B) | 90 |
| Baliste à Chaînes (spécialisation B) | 90 |
| Mortier de Soufre (spécialisation A) | 10 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |

**Matou** : la plus choisie, Grenier des Griffes (construction) (190 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Grenier des Griffes (construction) | 190 |
| Catapulte du Rempart (construction) | 177 |
| Clocher des Archers (construction) | 159 |
| Autel des Cendres (construction) | 124 |
| Garde du Cloître (spécialisation A) | 98 |
| Arbalétriers du Beffroi (spécialisation B) | 90 |
| Baliste à Chaînes (spécialisation B) | 59 |
| Nécromancien des Neuf Vies (spécialisation B) | 30 |
| Mortier de Soufre (spécialisation A) | 30 |
| Écorcheurs (spécialisation B) | 0 |
| Guetteurs des Toits (spécialisation A) | 0 |
| Oracle de la Braise (spécialisation A) | 0 |

**Vieux Sage** : la plus choisie, Clocher des Archers (construction) (180 fois) ; la moins choisie, Oracle de la Braise (spécialisation A) (0 fois).

| Choix | Fois |
| --- | --- |
| Clocher des Archers (construction) | 180 |
| Catapulte du Rempart (construction) | 160 |
| Grenier des Griffes (construction) | 158 |
| Arbalétriers du Beffroi (spécialisation B) | 109 |
| Autel des Cendres (construction) | 89 |
| Garde du Cloître (spécialisation A) | 50 |
| Baliste à Chaînes (spécialisation B) | 37 |
| Mortier de Soufre (spécialisation A) | 20 |
| Nécromancien des Neuf Vies (spécialisation B) | 14 |
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
