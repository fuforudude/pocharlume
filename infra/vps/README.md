# VPS de pocharlume.fr

VPS OVH sous Ubuntu 26.04 LTS : IPv4 `145.239.83.184`, IPv6 `2001:41d0:601:1100::8457`.
Domaine `pocharlume.fr` chez OVH : `@` A et AAAA vers le VPS, `www` en CNAME vers `pocharlume.fr.`
Second nom du même site : `travail.pocharlume.fr` (A et AAAA vers le VPS), pour les réseaux qui bloquent `pocharlume.fr`.

Le serveur ne se configure jamais à la main : tout passe par les scripts de ce dossier, rejouables sans risque.

| Script | Rôle |
|---|---|
| `securiser.sh` | SSH par clé seulement (pas de root), pare-feu (SSH limité, HTTP, HTTPS), fail2ban, mises à jour de sécurité automatiques avec redémarrage à 04:30, nginx et certbot. |
| `runner-github.sh` | Runner GitHub Actions auto-hébergé (relais des tests distants quand le quota de minutes passe sous 10 %) : utilisateur `ghrunner` sans sudo ni shell, agent `actions/runner` épinglé et vérifié (SHA-256), extrait par root hors de portée de `ghrunner`, sans Node système (`setup-node` le fournit). Service systemd `github-runner` cloisonné (ni boucle locale ni réseaux privés, dossiers des autres services invisibles, aucune capacité) et en priorité basse (`CPUWeight=idle`, débit disque borné, 4 cœurs, `MemoryMax=4G` sans swap, purge du disque en fin de job). N'enregistre pas le runner : voir « Tests distants ». |
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
rsync par le job `vps`, dans l'environnement GitHub `production` réservé à `main`, seul à porter le secret
`VPS_DEPLOY_KEY` (`--delay-updates` : le site n'est jamais à moitié à jour). L'empreinte du serveur est fixée dans le workflow
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
sur le runner du VPS (labels `self-hosted`, `vps`), sinon sur `ubuntu-latest`. Si ce premier job échoue, les jobs
partent quand même, sur GitHub.

**Choisir la machine à la main.** Le lancement à la main (onglet **Actions** → **Tests distants** → **Run workflow**, ou
`gh workflow run tests.yml --ref <branche> -f machine=github`) a une entrée `machine` : `auto` (le quota décide),
`github` ou `vps`. Les branches de Dependabot (`dependabot/…`) ne partent jamais sur le VPS, même avec `machine=vps`.

**Runner hors ligne.** Un job envoyé au runner du VPS éteint reste en file (GitHub l'annule au bout de 24 h).
`npm run ci:attendre` s'arrête de lui-même quand aucune machine n'a pris de job depuis 15 min, avec la commande pour
annuler le run et le relancer sur GitHub (`-f machine=github`), et dans tous les cas après 6 h (code de sortie 2).

**Lecture du quota.** `GET https://api.github.com/users/fuforudude/settings/billing/usage?year=AAAA&month=M` (rapport
d'usage de la facturation actuelle, doc : https://docs.github.com/en/rest/billing/usage), avec un jeton fine-grained
ayant le droit de compte « Plan » en lecture. La réponse donne les minutes consommées (`usageItems`, produit `actions`,
unité `Minutes`) mais pas le quota inclus : il vient de la variable de dépôt `MINUTES_INCLUSES` (2000 par défaut, le
forfait GitHub Free ; 3000 pour GitHub Pro ; `illimite` pour ne jamais basculer). Des minutes déjà facturées comptent
comme un quota épuisé. Sans secret, si l'API échoue ou répond autre chose : GitHub, avec un avertissement dans le résumé
du job. Le calcul est dans `tools/ci/quota.ts` (testé).
Limite connue : la réponse ne dit pas si un dépôt est public ou privé (seulement `repositoryName`), et les montants ne
les distinguent pas. Toutes les minutes du compte sont donc comptées, celles des dépôts publics (gratuites) comprises :
avec un dépôt public très actif, le relais partirait trop tôt, jamais trop tard. Aujourd'hui pocharlume est le seul
dépôt du compte qui consomme des minutes.

**Le runner ne sert que ce dépôt, qui doit rester privé** : sur un dépôt public, n'importe qui pourrait faire exécuter
du code sur le VPS. Le workflow ne se déclenche que sur `push` et `workflow_dispatch`, jamais sur une pull request.

### Ce que le runner peut et ne peut pas faire
Le code d'une branche, et les paquets npm qu'elle installe, tournent sur le serveur de production. Le service est donc
cloisonné (`infra/vps/runner-github.sh`) :
- **Réseau** : Internet seulement (GitHub, registre npm). La boucle locale, les adresses de lien local et les réseaux
  privés sont coupés, sauf le résolveur DNS lu dans `/etc/resolv.conf` (127.0.0.53 avec systemd-resolved).
  **Conséquence voulue : telechargements (127.0.0.1:3100) et taches (127.0.0.1:3200) ne sont plus joignables par les
  jobs**, ni aucun service local à venir (l'API Multiplay prévue). Un test qui aurait besoin de l'un d'eux doit passer
  par son adresse publique en HTTPS, derrière nginx et sa limitation des connexions.
- **Fichiers** : système en lecture seule ; `/home`, `/root`, `/etc/letsencrypt`, `/etc/notion-tool`, `/etc/ssh`,
  `/etc/nginx`, `/var/lib/telechargements`, `/var/lib/taches`, `/srv`, `/opt`, `/var/www` et `/var/backups` invisibles ;
  les processus des autres comptes aussi.
- **Root ne touche jamais aux fichiers de `ghrunner`** : l'agent est extrait par root dans un dossier temporaire à lui,
  copié dans `/var/lib/ghrunner/versions/<version>-<date>`, puis mis en service d'un coup par le lien
  `/var/lib/ghrunner/actions-runner` (dans un dossier de root). Un témoin `/var/lib/ghrunner/installe-<version>` n'est
  écrit qu'après la bascule : une installation interrompue est reprise au rejeu.
- **Arrêt** : `KillMode=mixed` : un processus laissé par un job ne survit pas à l'arrêt ni au redémarrage du service.
- **Ressources** : `CPUWeight=idle` (nginx passe toujours devant), 4 cœurs au plus, `MemoryMax=4G` sans swap, débit
  disque borné (80 Mo/s en lecture, 40 en écriture, sur le disque de `/var/lib`). Place sur le disque : en fin de job,
  les copies du dépôt, les caches trop gros et les journaux de l'agent de plus de 7 jours sont effacés ; un job est
  refusé s'il reste moins de 10 Go libres.
- **Ce qui reste** : un job malveillant peut lire les identifiants de l'agent (`.credentials`) et faire tourner un faux
  runner ailleurs, qui recevrait les jobs suivants de ce dépôt. C'est le risque propre aux runners non éphémères, accepté.
  Si un job a pu être compromis : retirer le runner sur GitHub, puis réinstaller avec `FORCER=1` et réenregistrer.
- **Si un job échoue sur le VPS pour une raison réseau inexpliquée** : un outil qui énumère les interfaces réseau a
  besoin de `AF_NETLINK`, retiré de `RestrictAddressFamilies`. Le rajouter dans le script plutôt que de lâcher le reste.

**Dependabot.** Il n'y a pas de `.github/dependabot.yml`. S'il est activé un jour (alertes ou mises à jour de sécurité
dans les réglages du dépôt), ses branches `dependabot/…` lancent `tests.yml` : elles partent toujours sur GitHub (job
`choisir`), et GitHub ne leur donne pas les secrets du dépôt. Ne jamais lever cette exception.

**Actions épinglées par SHA.** Les `uses:` des workflows portent le SHA du commit, avec l'étiquette en commentaire
(`tools/ci/workflows.test.ts` le vérifie). Pour monter de version : `git ls-remote --tags https://github.com/actions/<nom>`.

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
     **Plan** → **Access: Read-only**. Ne rien cocher d'autre (aucun droit sur les runners : le choix à la main suffit) ;
   - **Generate token**, puis copier le jeton affiché (`github_pat_…`) : il ne sera plus montré.

3. **Ranger le jeton en secret du dépôt** :
   - page du dépôt `fuforudude/pocharlume` → onglet **Settings** (en haut) ;
   - colonne de gauche → **Secrets and variables** → **Actions** ;
   - onglet **Secrets** → **New repository secret** ; **Name** : `QUOTA_GITHUB` ; **Secret** : coller le jeton →
     **Add secret** ;
   - facultatif, si ton forfait n'est pas GitHub Free : onglet **Variables** → **New repository variable** ;
     **Name** : `MINUTES_INCLUSES` ; **Value** : `3000` (GitHub Pro) → **Add variable**.

4. **Réserver la clé de déploiement à `main`** (environnement `production`). Tant que ce n'est pas fait, le déploiement
   marche quand même : GitHub crée l'environnement sans règle au premier déploiement, et le secret du dépôt reste lisible.
   Mais d'ici là, n'importe quel workflow de branche peut lire `VPS_DEPLOY_KEY` : à faire avant d'enregistrer le runner.
   - page du dépôt → **Settings** → colonne de gauche, section **Code and automation** → **Environments** ;
   - s'il existe déjà un environnement `production` (créé par un déploiement), cliquer dessus ; sinon **New environment**,
     **Name** : `production` → **Configure environment** ;
   - bloc **Deployment branches and tags** : menu **No restriction** → **Selected branches and tags** → **Add deployment
     branch or tag rule** → **Ref type** : **Branch**, **Name pattern** : `main` → **Add rule** ;
   - bloc **Environment secrets** → **Add environment secret** ; **Name** : `VPS_DEPLOY_KEY` ; **Value** : la clé privée
     de déploiement (tout le bloc `-----BEGIN OPENSSH PRIVATE KEY-----` … `-----END OPENSSH PRIVATE KEY-----`) →
     **Add secret**. GitHub ne permet pas de relire un secret : si tu n'as plus la clé privée, en créer une nouvelle
     (`ssh-keygen -t ed25519 -N "" -C "github-actions pocharlume deploy" -f deploiement`), mettre le contenu de
     `deploiement.pub` dans `CLE_DEPLOIEMENT` de `infra/vps/site-pocharlume.sh` (demander à un agent, puis relancer ce
     script), et coller ici le contenu de `deploiement` ; effacer ensuite les deux fichiers du PC ;
   - vérifier : onglet **Actions** → **Déploiement sur le VPS** → **Run workflow** sur `main` ; le job **VPS** doit
     passer et afficher l'environnement `production` ;
   - seulement alors, retirer l'ancien secret du dépôt : **Settings** → **Secrets and variables** → **Actions** → onglet
     **Secrets**, section **Repository secrets** → `VPS_DEPLOY_KEY` → icône corbeille → **Yes, remove this secret** ;
   - même chose pour la clé de déploiement de telechargements, dans son propre dépôt.

5. **Installer le runner sur le VPS** (après relecture du script) :
   ```bash
   ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'cat /etc/resolv.conf; free -h; nproc; cat /sys/block/*/queue/scheduler'
   ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'sudo bash -s' < infra/vps/runner-github.sh
   ```
   La première commande montre le résolveur DNS (le script autorise ceux de `/etc/resolv.conf`), la mémoire et les
   cœurs : ajuster `MEMOIRE_MAX`, `MEMOIRE_HAUTE` et `COEURS` en tête du script si le VPS a moins de mémoire ou un autre
   nombre de cœurs. Le script affiche le résolveur autorisé et le disque dont le débit est borné.

6. **Enregistrer le runner auprès de GitHub** (juste après l'installation, avant tout job : `config.sh` tourne hors du
   cloisonnement du service) :
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
   - le runner apparaît « Idle » dans **Settings** → **Actions** → **Runners** ;
   - essai : `gh workflow run tests.yml --ref <une branche> -f machine=vps`, puis `npm run ci:attendre` sur cette branche.

Pour réenregistrer le runner plus tard (après une compromission possible, ou s'il a été retiré) : relancer d'abord le
script avec `FORCER=1` (`ssh … 'sudo FORCER=1 bash -s' < infra/vps/runner-github.sh`) pour repartir de l'archive
vérifiée, puis l'étape 6 : ne jamais lancer `config.sh` depuis un dossier où des jobs ont tourné.

Pour retirer le runner : `sudo systemctl disable --now github-runner`, puis, avec un jeton de suppression (même page,
menu « … » du runner → **Remove**), `sudo -u ghrunner /var/lib/ghrunner/actions-runner/config.sh remove --token "$JETON"`.
