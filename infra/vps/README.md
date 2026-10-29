# VPS de pocharlume.fr

VPS OVH sous Ubuntu 26.04 LTS : IPv4 `145.239.83.184`, IPv6 `2001:41d0:601:1100::8457`.
Domaine `pocharlume.fr` chez OVH : `@` A et AAAA vers le VPS, `www` en CNAME vers `pocharlume.fr.`

Le serveur ne se configure jamais à la main : tout passe par les scripts de ce dossier, rejouables sans risque.

| Script | Rôle |
|---|---|
| `securiser.sh` | SSH par clé seulement (pas de root), pare-feu (SSH limité, HTTP, HTTPS), fail2ban, mises à jour de sécurité automatiques avec redémarrage à 04:30, nginx et certbot. |
| `site-pocharlume.sh` | Utilisateur `deploy`, dossier `/var/www/pocharlume`, nginx (HTTPS, redirections vers `https://pocharlume.fr`, en-têtes de sécurité, cache). |

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
