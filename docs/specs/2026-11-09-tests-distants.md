# Tests lourds hors de la machine de dev : GitHub Actions, relais sur le VPS

Statut : validée le 2026-11-09
Date : 2026-11-09

## Besoin
La vérification complète (`npm run verifier`, environ 10 à 25 min) et les passes d'équilibrage (`npm run balance`, 45 min à 2 h 30)
tournent sur le PC de l'auteur et le rendent inutilisable, au point de faire échouer d'autres agents. Elles doivent tourner ailleurs.

## Décisions (2026-11-09)
- **GitHub Actions d'abord.** Un workflow sur chaque push d'une branche autre que `main` lance la vérification complète.
  La passe d'équilibrage complète, répartie par région (même découpage que `deploiement.yml`), ne part que si le message
  du commit poussé contient `[equilibrage]`. Le rapport (`balance-report.md` et journaux) est publié en artefact.
- **Relais sur le VPS quand il reste moins de 10 % du quota de minutes du mois** : un runner GitHub auto-hébergé sur le VPS
  exécute alors les mêmes jobs (sans consommer de quota). Un premier job léger lit le quota et choisit `runs-on`.
  Le runner tourne sous un utilisateur dédié sans sudo, en priorité basse (`nice`, `ionice`, nombre de fils limité), pour
  ce seul dépôt privé ; il ne doit pas ralentir les sites servis par le VPS.
- **Lecture du quota** : jeton GitHub « fine-grained », créé par l'auteur (Claude ne saisit jamais de jeton), droit de compte
  « Plan » en lecture, rangé en secret du dépôt (`QUOTA_GITHUB`). Sans secret ou si l'API échoue : GitHub par défaut, avec
  un avertissement dans le résumé du job.
- **Lecture des résultats par les agents** : l'outil `gh`, installé et connecté par l'auteur. Un script `npm run ci:attendre`
  (ou équivalent) attend la fin du dernier run de la branche courante, affiche le résultat et télécharge les artefacts.
- Le déploiement (`deploiement.yml`, push sur `main`) ne change pas.

## Critères d'acceptation
- [ ] Un push sur une branche autre que `main` lance la vérification complète sur GitHub ; échec si un test échoue.
- [ ] `[equilibrage]` dans le message du commit poussé lance aussi la passe complète répartie par région, et publie le
  rapport en artefact.
- [ ] Le job de choix du runner lit le quota avec `QUOTA_GITHUB` : sous 10 % restants, les jobs partent sur le runner
  `vps` ; sinon sur `ubuntu-latest`. Testé par un script pur (calcul du choix à partir de la réponse de l'API).
- [ ] Le runner du VPS s'installe par un script versionné `infra/vps/runner-github.sh` (utilisateur dédié, service systemd,
  priorité basse) ; l'enregistrement auprès de GitHub (jeton d'enregistrement) est une commande que l'auteur lance lui-même.
- [ ] `npm run ci:attendre` affiche le statut du dernier run de la branche et récupère les artefacts avec `gh`.
- [ ] Les consignes des agents (`CLAUDE.md` du projet) disent : vérification complète et passes d'équilibrage sur la CI,
  seulement des tests ciblés en local.
- [ ] README de `infra/vps/` et `CLAUDE.md` décrivent les étapes de l'auteur : installer et connecter `gh`, créer le jeton
  et le secret, enregistrer le runner.

## Hors périmètre
- Changer le déploiement sur `main`, migrer d'autres projets.

## Impacts
- `.github/workflows/` (nouveau workflow), `infra/vps/runner-github.sh`, `package.json` (script), `CLAUDE.md`, README.
