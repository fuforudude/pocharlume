# Atelier : éditeur local de sprites, palettes et cartes

Un outil qui tourne sur votre machine, dans le navigateur, pour retoucher à la main les ressources d'un projet (pixels,
animations, couleurs, objets placés sur une grille) et réécrire directement les fichiers sources. Ce dossier est le
**cœur générique** : il ne connaît aucun projet et n'importe rien hors de lui-même (un test le vérifie). Tout ce qui
est propre à un projet vit dans un **adaptateur** que le projet fournit.

Prérequis : Node 22.13 ou plus (il exécute le TypeScript tel quel) et `vite` (le cœur s'en sert comme serveur local ;
c'est sa seule dépendance, avec `vitest` pour les tests).

## Lancer

```
node tools/atelier/lancer.ts --config atelier.config.ts [--port 5199]
```

Le serveur n'écoute que sur `127.0.0.1`, sur le port demandé : si ce port est pris, il s'arrête au lieu d'en choisir un
autre. Chaque requête de l'API est refusée (403) si son `Host` ou son `Origin` n'est pas local, et un POST doit avoir exactement l'`Origin` du serveur et un corps JSON de 8 Mo au plus (415, 413). Il ne commite ni ne pousse rien.

## Interface (clavier et souris)

| Action | Raccourci |
| --- | --- |
| Pinceau / gomme / pipette | `B` / `E` / `I` (clic droit : pipette) |
| Annuler / rétablir | `Ctrl+Z` / `Ctrl+Y` |
| Enregistrer | `Ctrl+S` |
| Zoom, grille, fond rendu | `+` `-`, `G`, `F` |
| Carte : déplacer l'objet choisi | flèches (`Maj` : une case entière) |

Liens directs : `http://127.0.0.1:5199/#sprites/<id>` et `#cartes/<id>`.

## Configurer un projet

À la racine du projet, `atelier.config.ts` désigne l'adaptateur et le port :

```ts
import { definirConfig } from './tools/atelier/types.ts';
import { monAdaptateur } from './mon-adaptateur.ts';

export default definirConfig({
  adaptateur: () => monAdaptateur(import.meta.dirname),
  port: 5199,
});
```

## Écrire un adaptateur

L'adaptateur implémente `Adaptateur` (voir `types.ts`, entièrement commenté). Tout est optionnel sauf `nom`, `racine` et
`ecriturePermise` ; l'interface n'affiche que les onglets dont le module existe.

- `racine` : dossier du projet (absolu).
- `ecriturePermise` : où l'atelier a le droit d'écrire, chemins relatifs avec `/` : un dossier (`art/`), un fichier
  ou un motif avec `*` dans le dernier segment (`donnees/cartes*.json`). **C'est le cœur qui écrit** : l'adaptateur
  rend des `Ecriture { chemin, contenu }` ; le cœur normalise chaque chemin, refuse `..`, les chemins absolus, les
  liens symboliques et tout ce qui est hors des motifs, et n'écrit rien si un seul chemin est refusé.
- `sprites` (`ModuleSprites`) : `lister`, `ouvrir(id)` (calques éditables en lettres, palette, aperçu des animations,
  sprites dérivés), `apercu(id, calques)` (rendu avec des calques modifiés, appelé à chaque coup de pinceau),
  `enregistrer(id, calques)` (les fichiers à écrire).
- `palette` (`ModulePalette`) : couleurs par lettre, nombre de sprites concernés, aperçu des sprites touchés,
  `enregistrer`.
- `cartes` (`ModuleCartes`) : des objets (`ObjetCarte` : position d'ancre, emprise, genre) à déplacer sur une grille ;
  `verifier(id, positions)` applique **vos** règles (erreurs, cases bloquées, bilan avant/après) et `enregistrer`
  refuse une disposition invalide.
- `apresEcriture(chemins)` : commande lancée après un enregistrement (reconstruire un atlas, un cache…).

- **Écritures concurrentes** : `ouvrir` rend une `empreinte` des fichiers que l'enregistrement réécrira ; le client la renvoie avec les lignes d'origine des calques (ou la position d'origine des seuls objets déplacés). L'adaptateur lève `ErreurConflit` (HTTP 409, rien n'est écrit) si le fichier a changé depuis ; après un enregistrement le client recharge le document, ses clés ayant pu changer. `ErreurRequete` donne un 400, `ErreurIntrouvable` un 404. Les écritures d'un enregistrement passent par des fichiers temporaires puis des renommages (retour en arrière si l'un échoue).

Aides fournies : `ecriture-texte.ts` (`remplacerGrilles` ne réécrit que les lignes de grille qui changent, fins de ligne
et commentaires conservés à l'octet près) et `chemins.ts` (`estPermis`, `verifierChemin`).

Un adaptateur minimal et complet est dans `exemple/` : des sprites au format texte `.pix`, avec un test qui passe par la
même API (`exemple/exemple.test.ts`). Brancher un autre projet, c'est copier ce dossier `tools/atelier/` (ou le publier
comme dépôt à part), écrire son adaptateur sur ce modèle et son `atelier.config.ts`.

## API (JSON, locale)

`GET /api/info`, `GET /api/sprites`, `GET /api/sprites/doc?id=`, `POST /api/sprites/apercu`,
`POST /api/sprites/enregistrer`, mêmes routes sous `/api/palette` et `/api/cartes` (`verifier` pour les cartes).
La logique est dans `api.ts` (`traiter`), testable sans HTTP.

## Tests

`npx vitest run tools/atelier` : chemins d'écriture, édition ciblée, modèle de pixels, API et second adaptateur,
et `isolation.test.ts` (aucun import hors du dossier, aucun chemin du projet hôte cité).
