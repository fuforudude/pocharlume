# VPS de pocharlume.fr

VPS OVH sous Ubuntu 26.04 LTS : IPv4 `145.239.83.184`, IPv6 `2001:41d0:601:1100::8457`.
Domaine `pocharlume.fr` chez OVH : `@` A et AAAA vers le VPS, `www` en CNAME vers `pocharlume.fr.`
Second nom du même site : `travail.pocharlume.fr` (A et AAAA vers le VPS), pour les réseaux qui bloquent `pocharlume.fr`.

Le serveur ne se configure jamais à la main : tout passe par les scripts de ce dossier, rejouables sans risque.

| Script | Rôle |
|---|---|
| `securiser.sh` | SSH par clé seulement (pas de root), pare-feu (SSH limité, HTTP, HTTPS), fail2ban, mises à jour de sécurité automatiques avec redémarrage à 04:30, nginx et certbot. |
| `runner-github.sh` | Runner GitHub Actions auto-hébergé (relais des tests distants quand le quota de minutes passe sous 10 %) : utilisateur `ghrunner` sans sudo ni shell, agent `actions/runner` épinglé et vérifié (SHA-256), Node 24, service systemd `github-runner` en priorité basse (`Nice=15`, `IOSchedulingClass=idle`, 4 cœurs, `CPUQuota=400%`, `MemoryMax=4G`, `ProtectSystem=strict`, `PrivateTmp`). N'enregistre pas le runner : voir « Tests distants ». |
| `site-pocharlume.sh` | Utilisateur `deploy`, dossier `/var/www/pocharlume`, nginx (HTTPS, redirections vers `https://pocharlume.fr`, en-têtes de sécurité, cache), et le même site sous `travail.pocharlume.fr` (son propre certificat, redirection HTTP vers son propre HTTPS, jamais vers `pocharlume.fr`). |

```bash
ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'sudo bash -s' < infra/vps/securiser.sh
ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'sudo bash -s' < infra/vps/site-pocharlume.sh
ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'sudo bash -s' < infra/vps/runner-github.sh
```

## Accès
- Administration : `ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184` (clé sur le PC de l'utilisateur ; `ubuntu` a sudo sans
  mot de passe, réglage d'OVH). Le mot de passe d'`ubuntu` ne sert qu'à la console de secours d'OVH.
- Déploiement : l'utilisateur `deploy`, avec la clé du secret GitHub `VPS_DEPLOY_KEY`. Côté serveur, cette clé est
  bridée par `rrsync` : elle ne peut que synchroniser `/var/www/pocharlume`.

## Déploiement
Chaque push sur `main` lance `.github/workflows/deploiement.yml` : `npm run verifier`, puis envoi de `dist/` par
rsync (`--delay-updates` : le site n'est jamais à moitié à jour). L'empreinte du serveur est fixée dans le workflow
(ED25519 `SHA256:DEhyO4iAM8SlJmhaCr7iFgVBoeGeXuVHsNzz9gy8Pts`) ; si le serveur est réinstallé, la mettre à jour.

## Certificat HTTPS
Let's Encrypt, sans e-mail, obtenu par la méthode webroot (`/var/www/acme`) : certbot ne modifie jamais la
configuration nginx. Renouvellement automatique par `certbot.timer`, qui recharge nginx. Première demande :

```bash
sudo certbot certonly --webroot -w /var/www/acme -d pocharlume.fr -d www.pocharlume.fr \
  --non-interactive --agree-tos --register-unsafely-without-email --deploy-hook "systemctl reload nginx"
```

puis relancer `site-pocharlume.sh`, qui passe alors en HTTPS.

Le nom `travail.pocharlume.fr` a son propre certificat (`/etc/letsencrypt/live/travail.pocharlume.fr`), demandé de la même
façon, sans toucher à celui de `pocharlume.fr` :

```bash
sudo certbot certonly --webroot -w /var/www/acme -d travail.pocharlume.fr   --non-interactive --agree-tos --register-unsafely-without-email --deploy-hook "systemctl reload nginx"
```

Le script sert chaque nom indépendamment : sans certificat, `travail.pocharlume.fr` est en HTTP seul (qui sert le défi
ACME) ; une fois le certificat obtenu, relancer `site-pocharlume.sh` passe en HTTPS. Les sauvegardes (`localStorage`,
IndexedDB) sont propres à chaque origine : une partie commencée sur `pocharlume.fr` n'apparaît pas sur `travail.pocharlume.fr`.

## Tests distants (GitHub Actions, relais sur le VPS)
Spec : `docs/specs/2026-11-09-tests-distants.md`. Chaque push d'une branche autre que `main` lance
`.github/workflows/tests.yml` : `npm run verifier`, et la passe d'équilibrage répartie par région si le message du commit
contient `[equilibrage]`. Un premier job lit le quota de minutes Actions du compte ; sous 10 % restants, les jobs partent
sur le runner du VPS (labels `self-hosted`, `vps`), sinon sur `ubuntu-latest`.

**Lecture du quota.** `GET https://api.github.com/users/fuforudude/settings/billing/usage?year=AAAA&month=M` (rapport
d'usage de la facturation actuelle, doc : https://docs.github.com/en/rest/billing/usage), avec un jeton fine-grained
ayant le droit de compte « Plan » en lecture. La réponse donne les minutes consommées (`usageItems`, produit `actions`,
unité `Minutes`) mais pas le quota inclus : il vient de la variable de dépôt `MINUTES_INCLUSES` (2000 par défaut, le
forfait GitHub Free ; 3000 pour GitHub Pro ; `illimite` pour ne jamais basculer). Des minutes déjà facturées comptent
comme un quota épuisé. Sans secret, si l'API échoue ou répond autre chose : GitHub, avec un avertissement dans le résumé
du job. Le calcul est dans `tools/ci/quota.ts` (testé).

**Le runner ne sert que ce dépôt, qui doit rester privé** : sur un dépôt public, n'importe qui pourrait faire exécuter
du code sur le VPS. Le workflow ne se déclenche que sur `push` et `workflow_dispatch`, jamais sur une pull request.

### Étapes de l'auteur, dans l'ordre
Claude ne saisit jamais de jeton : ces étapes sont les tiennes.

1. **Installer `gh` et le connecter** (sur le PC, pour que les agents lisent les résultats avec `npm run ci:attendre`) :
   ```bash
   winget install --id GitHub.cli
   gh auth login
   ```
   Réponses à `gh auth login` : `GitHub.com`, `HTTPS`, `Yes` (authentifier git), `Login with a web browser` ; copier le
   code à 8 caractères affiché, appuyer sur Entrée, le coller dans la page ouverte, puis « Authorize github ».
   Vérifier avec `gh auth status`.

2. **Créer le jeton fine-grained qui lit le quota** :
   - sur github.com, cliquer sur ton avatar (en haut à droite) → **Settings** ;
   - tout en bas de la colonne de gauche → **Developer settings** ;
   - **Personal access tokens** → **Fine-grained tokens** → bouton **Generate new token** ;
   - **Token name** : `quota-actions-pocharlume` ; **Resource owner** : `fuforudude` ; **Expiration** : 1 an (noter la date
     pour le renouveler) ;
   - **Repository access** : **Public repositories** (le jeton n'a besoin d'aucun dépôt) ;
   - **Permissions** → section **Account permissions** (ou bouton **Add permissions** → onglet **Account**) → ligne
     **Plan** → **Access: Read-only**. Ne rien cocher d'autre ;
   - **Generate token**, puis copier le jeton affiché (`github_pat_…`) : il ne sera plus montré.

3. **Ranger le jeton en secret du dépôt** :
   - page du dépôt `fuforudude/pocharlume` → onglet **Settings** (en haut) ;
   - colonne de gauche → **Secrets and variables** → **Actions** ;
   - onglet **Secrets** → **New repository secret** ; **Name** : `QUOTA_GITHUB` ; **Secret** : coller le jeton →
     **Add secret** ;
   - facultatif, si ton forfait n'est pas GitHub Free : onglet **Variables** → **New repository variable** ;
     **Name** : `MINUTES_INCLUSES` ; **Value** : `3000` (GitHub Pro) → **Add variable**.

4. **Installer le runner sur le VPS** (après relecture du script) :
   ```bash
   ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'sudo bash -s' < infra/vps/runner-github.sh
   ```
   `MemoryMax=4G` et 4 cœurs sur 6 : ajuster `MEMOIRE_MAX`, `MEMOIRE_HAUTE` et `COEURS` en tête du script si le VPS
   a moins de mémoire (`free -h`) ou un autre nombre de cœurs (`nproc`).

5. **Enregistrer le runner auprès de GitHub** :
   - page du dépôt → **Settings** → colonne de gauche **Actions** → **Runners** → bouton **New self-hosted runner** ;
   - choisir **Linux**, architecture **x64** ; dans le bloc **Configure**, la commande `./config.sh --url … --token …`
     contient le jeton d'enregistrement (valable une heure) : copier seulement la valeur après `--token` ;
   - sur le VPS (le jeton est lu sans écho, il ne reste ni à l'écran ni dans l'historique) :
     ```bash
     ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184
     read -rs JETON   # coller le jeton puis Entrée
     sudo -u ghrunner /var/lib/ghrunner/actions-runner/config.sh --unattended --url https://github.com/fuforudude/pocharlume --token "$JETON" --name vps-ovh --labels self-hosted,vps --work _work --replace
     unset JETON
     sudo systemctl start github-runner
     systemctl status github-runner --no-pager
     ```
   - le runner apparaît « Idle » dans **Settings** → **Actions** → **Runners**.

Pour retirer le runner : `sudo systemctl disable --now github-runner`, puis, avec un jeton de suppression (même page,
menu « … » du runner → **Remove**), `sudo -u ghrunner /var/lib/ghrunner/actions-runner/config.sh remove --token "$JETON"`.
