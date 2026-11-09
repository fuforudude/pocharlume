#!/usr/bin/env bash
# Site pocharlume.fr sur le VPS : utilisateur de déploiement, dossier du site, configuration nginx.
# À lancer en root : ssh … 'sudo bash -s' < infra/vps/site-pocharlume.sh. Rejouable sans risque.
# Deux noms servent le même site : pocharlume.fr (avec www) et travail.pocharlume.fr (pour les réseaux qui
# bloquent pocharlume.fr), chacun avec son certificat. Tant qu'un nom n'a pas de certificat, il est servi en
# HTTP seul ; une fois le certificat obtenu (voir infra/vps/README.md), relancer ce script passe en HTTPS.
set -euo pipefail

DOMAINE=pocharlume.fr
RACINE=/var/www/pocharlume
ACME=/var/www/acme
CERT=/etc/letsencrypt/live/$DOMAINE
# Second nom, jamais redirigé vers $DOMAINE : c'est justement lui qui peut être bloqué.
DOMAINE_TRAVAIL=travail.pocharlume.fr
CERT_TRAVAIL=/etc/letsencrypt/live/$DOMAINE_TRAVAIL
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

    location /assets/ {
        include snippets/pocharlume-securite.conf;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files \$uri =404;
    }
    location / {
        include snippets/pocharlume-securite.conf;
        add_header Cache-Control "no-cache" always;
        try_files \$uri \$uri/ =404;
    }
EOF
)

echo '== nginx'
CONF=/tmp/pocharlume.conf.$$
: > "$CONF"
if [ -e "$CERT/fullchain.pem" ]; then
  echo "   $DOMAINE : certificat présent, HTTPS"
  cat >> "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAINE www.$DOMAINE;
    include snippets/pocharlume-acme.conf;
    location / { return 301 https://$DOMAINE\$request_uri; }
}
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name www.$DOMAINE;
    ssl_certificate $CERT/fullchain.pem;
    ssl_certificate_key $CERT/privkey.pem;
    include snippets/pocharlume-tls.conf;
    return 301 https://$DOMAINE\$request_uri;
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
    server_name $DOMAINE www.$DOMAINE;
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
ecrire /etc/nginx/sites-available/pocharlume < "$CONF"
rm -f "$CONF"
ln -sf /etc/nginx/sites-available/pocharlume /etc/nginx/sites-enabled/pocharlume
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo '== Fait'
