# Pocharlume

Tower defense de chats dans un Moyen Âge sombre (campagne de 100 niveaux, mode infini, roguelike, trois dieux-chats
comme classes). Mobile d'abord, au doigt et à la souris, hors ligne. Site sur GitHub Pages, appli Android via
Capacitor plus tard.

## Commandes
- Lancer : `npm run dev`
- Compiler : `npm run build` (`tsc --noEmit` puis `vite build`, site statique dans `dist/`)
- Tester : `npm test` (Vitest)
- Linter : `npm run lint` (ESLint, typescript-eslint strict avec typage)
- Reporter le lore : `npm run lore` (reporte `docs/lore.md` dans `src/i18n/` ; `-- --verifier` compare sans écrire). `fr-lore.ts` est généré : corriger `lore.md`, jamais ce fichier.
- Retoucher les designs : `npm run editeur` (atelier local sur http://127.0.0.1:5199, `-- --port N` pour un autre port ; sprites, palette, décors des cartes ; écrit dans `art/` et les fichiers de cartes, jamais commite). Usage dans `tools/atelier/README.md`, adaptateur Pocharlume dans `tools/atelier-pocharlume/README.md`.
- Tout vérifier : `npm run verifier` (lint, types, tests, build). Doit être vert avant tout commit.
- **Tests lourds sur la CI, jamais en local** : la vérification complète (`npm run verifier`) et les passes d'équilibrage
  (`npm run balance`) rendent le PC de l'auteur inutilisable. On pousse sa branche (jamais `main`) : chaque push lance
  `.github/workflows/tests.yml` (vérification complète) ; avec `[equilibrage]` dans le message du commit, la passe
  complète part aussi, répartie par région, rapport en artefact. Puis `npm run ci:attendre` attend la fin du run de la
  branche, affiche le résultat par job et télécharge les artefacts dans `ci-artefacts/`. En local, seulement des tests
  ciblés (`npx vitest run <fichiers>`, `npx eslint <fichiers>`, `npx tsc --noEmit`). Le job décide seul s'il tourne sur
  GitHub ou sur le runner du VPS (quota de minutes sous 10 %). Si `ci:attendre` s'arrête avec le code 2 (aucune machine
  depuis 15 min, runner du VPS hors ligne, ou 6 h dépassées), suivre la commande affichée : `gh run cancel <run>` puis
  `gh workflow run tests.yml --ref <branche> -f machine=github`. Étapes de l'auteur (installer et connecter `gh`, jeton
  `QUOTA_GITHUB`, environnement `production`, enregistrement du runner) : `infra/vps/README.md`, section « Tests distants ».

## Architecture
Voir [docs/architecture.md](docs/architecture.md) (dossiers et frontières) et
[l'ADR 0001](docs/adr/0001-stack-et-moteur-deterministe.md) (stack et moteur déterministe). La spec du jeu est
[docs/specs/2026-10-25-pocharlume.md](docs/specs/2026-10-25-pocharlume.md).

En bref :
- `src/engine/` la simulation, `src/data/` les tables d'équilibrage, `src/render/` le rendu Canvas,
  `src/ui/` les écrans et contrôles, `src/i18n/` les textes, `src/save/` la sauvegarde.
- `tools/` les scripts Node (`art`, `balance`), `art/` les sources graphiques.

## Invariants
- **Moteur pur** : `src/engine/` et `src/data/` ne dépendent ni du DOM, ni du rendu, ni de l'interface, ni de la
  sauvegarde. Ils doivent tourner dans Node (simulateur, futur serveur). ESLint l'impose, un test le vérifie.
- **Déterministe** : la simulation avance par pas fixes de 1/30 s, jamais selon l'horloge. Le rendu interpole
  entre deux pas. Même graine et mêmes actions donnent le même état, octet pour octet.
- **Aléatoire à graine uniquement** : le générateur du moteur, jamais `Math.random`.
- **Toutes les valeurs de jeu dans `src/data/`** : aucun nombre d'équilibrage en dur ailleurs.
- **Tous les textes via `t('clé')`** (table `src/i18n/fr.ts`) : aucune chaîne affichée en dur.
- **Pixels nets** : zoom entier, `imageSmoothingEnabled = false`.
- Sauvegarde versionnée : un changement de format ajoute une migration, il ne casse jamais une sauvegarde existante.

## Conventions
- Tout en français : interface, commentaires, noms, messages de commit.
- TypeScript strict (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`), sans framework UI ni
  dépendance de jeu. Versions des dépendances épinglées.
- Dépendances minimales : **aucune dépendance d'exécution** (le jeu livré n'embarque que notre code). Une
  dépendance de développement ne s'ajoute que si l'écrire nous-mêmes serait déraisonnable ; l'agent la justifie
  dans son rendu (besoin, taille, maintenance, licence) et le chef de projet la valide avant la fusion. Sinon,
  on écrit le code.
- Tests Vitest à côté du code (`*.test.ts`), écrits avant le code pour le moteur.

## Git et déploiement
- Un push sur `main` lance `npm run verifier` puis déploie le site sur GitHub Pages
  (`.github/workflows/pages.yml`).
- En fin de session de dev, une fois la vérification complète verte (sur la CI de la branche, `npm run ci:attendre`) : commit puis
  `git pull --rebase` et push sur `main`.
  Ne jamais pousser un état qui ne compile pas ou dont les tests échouent.
- Dans un worktree, pousser sur sa branche, jamais sur `main`.

## Agents de l'équipe
Ce projet utilise le plugin `socle` du marketplace `equipe` (github.com/fuforudude/agents-equipe) :
- Le chef de projet tient la session : entretien, spec validée, puis agents `dev`, `reviewer`, `qa`.
- Toute nouvelle fonctionnalité a une spec dans `docs/specs/`, toute décision structurante un ADR dans `docs/adr/`.
- Pas de CI de fusion : on pousse directement sur `main` (`.claude/agents-equipe.json` l'autorise). Le workflow
  GitHub Pages refuse de déployer si `npm run verifier` échoue.
