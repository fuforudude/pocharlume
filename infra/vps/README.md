# VPS de pocharlume.fr

VPS OVH sous Ubuntu 26.04 LTS : IPv4 `145.239.83.184`, IPv6 `2001:41d0:601:1100::8457`.
Domaine `pocharlume.fr` chez OVH : `@` A et AAAA vers le VPS, `www` en CNAME vers `pocharlume.fr.`
Second nom du même site : `travail.pocharlume.fr` (A et AAAA vers le VPS), pour les réseaux qui bloquent `pocharlume.fr`.

Le serveur ne se configure jamais à la main : tout passe par les scripts de ce dossier, rejouables sans risque.

| Script | Rôle |
|---|---|
| `securiser.sh` | SSH par clé seulement (pas de root), pare-feu (SSH limité, HTTP, HTTPS), fail2ban, mises à jour de sécurité automatiques avec redémarrage à 04:30, nginx et certbot. |
| `site-pocharlume.sh` | Utilisateur `deploy`, dossier `/var/www/pocharlume`, nginx (HTTPS, redirections vers `https://pocharlume.fr`, en-têtes de sécurité, cache), et le même site sous `travail.pocharlume.fr` (son propre certificat, redirection HTTP vers son propre HTTPS, jamais vers `pocharlume.fr`). Pose aussi le mot de passe d'accès (voir plus bas). |
| `verifier-acces.sh` | Contrôle, depuis le VPS, que le mot de passe protège bien les deux domaines (`bash -s` en SSH, voir plus bas). |

```bash
ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'sudo bash -s' < infra/vps/securiser.sh
ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'sudo bash -s' < infra/vps/site-pocharlume.sh
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

## Mot de passe d'accès
Des robots récupéraient la page du jeu : tout le site, sur `pocharlume.fr` comme sur `travail.pocharlume.fr`, est derrière
un mot de passe fixe, vérifié par nginx. Sans le bon cookie, nginx n'envoie que la page de connexion (statut 401) :
jamais `index.html`, ni `/assets/`, ni les sprites ou les sons. Restent publics : `/.well-known/acme-challenge/` (en HTTP,
pour Let's Encrypt), `/robots.txt` (`Disallow: /`) et `/__acces/` (les fichiers de la page de connexion).

- Le mot de passe est la variable `MOT_DE_PASSE` en tête de `site-pocharlume.sh`. Il n'existe que dans la configuration
  nginx (`/etc/nginx/conf.d/pocharlume-acces.conf`, une `map` sur le cookie `pocharlume_acces`), jamais dans du code envoyé au navigateur.
- La page de connexion est posée dans `/var/www/pocharlume-acces`, hors de `/var/www/pocharlume` : le déploiement rsync
  (qui efface ce qui n'est pas dans `dist/`) ne l'emporte donc pas. Elle pose le cookie avec la valeur tapée puis recharge ;
  si elle s'affiche alors que le cookie existe, elle écrit « Mot de passe incorrect. ». Le script est externe (`/__acces/acces.js`) :
  la politique de sécurité du site (`script-src 'self'`) est inchangée.

**Changer le mot de passe** : modifier `MOT_DE_PASSE` (lettres, chiffres, `-`, `_`, `.`), puis relancer le script. Les
navigateurs qui ont l'ancien cookie retombent sur la page de connexion.

```bash
ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'sudo bash -s' < infra/vps/site-pocharlume.sh
ssh -i ~/.ssh/vps_ovh ubuntu@145.239.83.184 'bash -s -- NOUVEAU_MOT_DE_PASSE' < infra/vps/verifier-acces.sh
```

**Enlever le mot de passe** : mettre `MOT_DE_PASSE=` (vide) et relancer le script : la `map` laisse alors tout passer et le site
redevient public (`robots.txt` et `/__acces/` restent servis, sans effet). `verifier-acces.sh` n'a plus de sens dans ce cas.

Le script sauvegarde `/etc/nginx/sites-available/pocharlume` en `.bak` horodaté avant d'écrire ; si `nginx -t` échoue, il
remet la sauvegarde, retire la `map` et s'arrête. Une seule connexion SSH par commande : fail2ban bannit les rafales.
