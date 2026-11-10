#!/usr/bin/env bash
# Site pocharlume.pocharlumetravail.fr sur le VPS : utilisateur de déploiement, dossier du site, configuration nginx.
# À lancer en root : ssh … 'sudo bash -s' < infra/vps/site-pocharlume.sh. Rejouable sans risque.
# Deux noms servent le même site : pocharlume.pocharlumetravail.fr et travail.pocharlumetravail.fr (pour les réseaux qui
# bloquent le premier), chacun avec son certificat. Tant qu'un nom n'a pas de certificat, il est servi en
# HTTP seul ; une fois le certificat obtenu (voir infra/vps/README.md), relancer ce script passe en HTTPS.
set -euo pipefail

DOMAINE=pocharlume.pocharlumetravail.fr
RACINE=/var/www/pocharlume
ACME=/var/www/acme
CERT=/etc/letsencrypt/live/$DOMAINE
# Second nom, jamais redirigé vers $DOMAINE : c'est justement lui qui peut être bloqué.
DOMAINE_TRAVAIL=travail.pocharlumetravail.fr
CERT_TRAVAIL=/etc/letsencrypt/live/$DOMAINE_TRAVAIL
# Mot de passe d'accès au site (des robots récupéraient la page). Il n'existe que dans la configuration nginx :
# jamais dans du code envoyé au navigateur. Pour le changer : modifier cette ligne et relancer le script.
# Chaîne vide = pas de mot de passe (le site redevient public). Caractères permis : lettres, chiffres, - _ .
MOT_DE_PASSE=1234567890
# La page de connexion vit HORS de $RACINE : chaque déploiement (rsync --delete) effacerait ce qu'on y poserait.
ACCES=/var/www/pocharlume-acces
# Clé publique du déploiement GitHub Actions : elle ne peut que synchroniser le dossier du site (rrsync).
CLE_DEPLOIEMENT='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBX5Ef/BWBLRfj1tXzPPGq5yltjVBDvd7s9xX81BOwQO github-actions pocharlume deploy'

# Écrit l'entrée standard dans un fichier de configuration lisible par tous.
ecrire() { cat > "$1"; chmod 644 "$1"; }

echo '== Utilisateur deploy : sans mot de passe, limité à l envoi des fichiers du site'
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
passwd --lock deploy >/dev/null
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
printf 'command="/usr/bin/rrsync %s",restrict %s\n' "$RACINE" "$CLE_DEPLOIEMENT" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

echo '== Dossiers du site et des défis Let'"'"'s Encrypt'
install -d -m 755 -o deploy -g deploy "$RACINE"
install -d -m 755 "$ACME"
[ -e "$RACINE/index.html" ] || echo '<!doctype html><meta charset="utf-8"><title>Pocharlume</title><p>Bientôt.</p>' > "$RACINE/index.html"
chown -R deploy:deploy "$RACINE"

echo '== Mot de passe : page de connexion (hors du dossier déployé) et contrôle du cookie'
case "$MOT_DE_PASSE" in *[!A-Za-z0-9._-]*) echo 'MOT_DE_PASSE : caractères non permis'; exit 1;; esac
install -d -m 755 "$ACCES" "$ACCES/__acces"
ecrire "$ACCES/robots.txt" <<'EOF'
User-agent: *
Disallow: /
EOF
ecrire "$ACCES/__acces/index.html" <<'EOF'
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Accès</title>
<link rel="stylesheet" href="/__acces/acces.css">
</head>
<body>
<form id="acces" autocomplete="off">
  <input id="mot" type="password" aria-label="Mot de passe" placeholder="Mot de passe" autofocus>
  <button type="submit">Entrer</button>
  <p id="erreur" role="alert" hidden>Mot de passe incorrect.</p>
</form>
<script src="/__acces/acces.js"></script>
</body>
</html>
EOF
ecrire "$ACCES/__acces/acces.css" <<'EOF'
html, body { height: 100%; margin: 0; }
body { display: flex; align-items: center; justify-content: center; background: #0e0f12; color: #d8dae0; font: 16px system-ui, sans-serif; }
form { display: flex; flex-direction: column; gap: 12px; width: min(260px, 80vw); }
input, button { font: inherit; padding: 10px 12px; border-radius: 6px; border: 1px solid #2c2f38; background: #171920; color: inherit; }
input:focus-visible, button:focus-visible { outline: 2px solid #6d8cff; outline-offset: 1px; }
button { cursor: pointer; background: #232738; }
button:hover { background: #2c3148; }
#erreur { margin: 0; color: #ff7b7b; font-size: 14px; text-align: center; }
EOF
ecrire "$ACCES/__acces/acces.js" <<'EOF'
// Pose le cookie « pocharlume_acces » avec la valeur tapée, puis recharge : c'est nginx qui compare au mot de passe.
(function () {
  var NOM = 'pocharlume_acces';
  var formulaire = document.getElementById('acces');
  var champ = document.getElementById('mot');
  var erreur = document.getElementById('erreur');
  // Cette page ne s'affiche avec un cookie présent que si nginx l'a refusé : le mot de passe était faux.
  if (document.cookie.split('; ').some(function (c) { return c.indexOf(NOM + '=') === 0 && c.length > NOM.length + 1; })) {
    erreur.hidden = false;
  }
  formulaire.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!champ.value) return;
    document.cookie = NOM + '=' + champ.value + '; Path=/; Max-Age=31536000; Secure; SameSite=Lax';
    location.reload();
  });
})();
EOF
chmod -R a+rX "$ACCES"
# Hors de tout serveur : la map est lue dans le contexte http (conf.d). 1 si le cookie égale le mot de passe.
if [ -n "$MOT_DE_PASSE" ]; then
  ecrire /etc/nginx/conf.d/pocharlume-acces.conf <<EOF
map \$cookie_pocharlume_acces \$pocharlume_acces_ok {
    default 0;
    "$MOT_DE_PASSE" 1;
}
EOF
else
  ecrire /etc/nginx/conf.d/pocharlume-acces.conf <<'EOF'
map $cookie_pocharlume_acces $pocharlume_acces_ok {
    default 1;
}
EOF
fi

echo '== En-têtes de sécurité et de cache'
ecrire /etc/nginx/snippets/pocharlume-securite.conf <<'EOF'
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
# Ignoré par les navigateurs tant que le site est en HTTP ; en HTTPS, impose HTTPS pendant un an.
add_header Strict-Transport-Security "max-age=31536000" always;
EOF
# TLS 1.2 et 1.3 seulement (recommandation « intermediate » de Mozilla) ; les suites par défaut d'OpenSSL suffisent.
ecrire /etc/nginx/snippets/pocharlume-tls.conf <<'EOF'
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:pocharlume:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
EOF
ecrire /etc/nginx/snippets/pocharlume-acme.conf <<EOF
location /.well-known/acme-challenge/ {
    root $ACME;
    default_type text/plain;
}
EOF

# Le site lui-même : les fichiers de assets/ portent une empreinte dans leur nom, on les garde un an ;
# le reste (index.html, sprites, sons) est revalidé à chaque visite pour qu'une mise à jour se voie aussitôt.
SITE=$(cat <<EOF
    root $RACINE;
    index index.html;
    charset utf-8;
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    include snippets/pocharlume-securite.conf;

    # Sans le bon cookie : la page de connexion (statut 401) à la place de tout le reste. Elle vit hors de \$RACINE.
    error_page 401 /__acces/index.html;
    location /__acces/ {
        root $ACCES;
        include snippets/pocharlume-securite.conf;
        add_header Cache-Control "no-store" always;
        try_files \$uri =404;
    }
    location = /robots.txt {
        root $ACCES;
        default_type text/plain;
        include snippets/pocharlume-securite.conf;
        add_header Cache-Control "no-cache" always;
    }
    location /assets/ {
        if (\$pocharlume_acces_ok = 0) { return 401; }
        include snippets/pocharlume-securite.conf;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files \$uri =404;
    }
    location / {
        if (\$pocharlume_acces_ok = 0) { return 401; }
        include snippets/pocharlume-securite.conf;
        add_header Cache-Control "no-cache" always;
        try_files \$uri \$uri/ =404;
    }
EOF
)

echo '== nginx'
SAUVEGARDE=/etc/nginx/sites-available/pocharlume.$(date +%Y%m%d-%H%M%S).bak
if [ -e /etc/nginx/sites-available/pocharlume ]; then cp -p /etc/nginx/sites-available/pocharlume "$SAUVEGARDE"; echo "   sauvegarde : $SAUVEGARDE"; fi
CONF=/tmp/pocharlume.conf.$$
: > "$CONF"
if [ -e "$CERT/fullchain.pem" ]; then
  echo "   $DOMAINE : certificat présent, HTTPS"
  cat >> "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAINE;
    include snippets/pocharlume-acme.conf;
    location / { return 301 https://$DOMAINE\$request_uri; }
}
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name $DOMAINE;
    ssl_certificate $CERT/fullchain.pem;
    ssl_certificate_key $CERT/privkey.pem;
    include snippets/pocharlume-tls.conf;
$SITE
}
EOF
else
  echo "   $DOMAINE : pas encore de certificat, HTTP seul"
  cat >> "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAINE;
    include snippets/pocharlume-acme.conf;
$SITE
}
EOF
fi
if [ -e "$CERT_TRAVAIL/fullchain.pem" ]; then
  echo "   $DOMAINE_TRAVAIL : certificat présent, HTTPS"
  cat >> "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAINE_TRAVAIL;
    include snippets/pocharlume-acme.conf;
    location / { return 301 https://$DOMAINE_TRAVAIL\$request_uri; }
}
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name $DOMAINE_TRAVAIL;
    ssl_certificate $CERT_TRAVAIL/fullchain.pem;
    ssl_certificate_key $CERT_TRAVAIL/privkey.pem;
    include snippets/pocharlume-tls.conf;
$SITE
}
EOF
else
  echo "   $DOMAINE_TRAVAIL : pas encore de certificat, HTTP seul"
  cat >> "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAINE_TRAVAIL;
    include snippets/pocharlume-acme.conf;
$SITE
}
EOF
fi
# Tout nom que personne ne revendique (apex, ancien domaine non redirigé) est coupé net, au lieu de tomber sur le premier site.
cat >> "$CONF" <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 444;
}
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;
}
EOF
ecrire /etc/nginx/sites-available/pocharlume < "$CONF"
rm -f "$CONF"
ln -sf /etc/nginx/sites-available/pocharlume /etc/nginx/sites-enabled/pocharlume
rm -f /etc/nginx/sites-enabled/default
if ! nginx -t; then
  echo 'nginx -t a échoué : retour à la configuration précédente'
  if [ -e "$SAUVEGARDE" ]; then cp -p "$SAUVEGARDE" /etc/nginx/sites-available/pocharlume; fi
  rm -f /etc/nginx/conf.d/pocharlume-acces.conf
  nginx -t || true
  exit 1
fi
systemctl reload nginx

echo '== Fait'
