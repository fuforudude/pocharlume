#!/usr/bin/env bash
# Sécurisation du VPS (OVH, Ubuntu 26.04 LTS). À lancer en root : ssh … 'sudo bash -s' < infra/vps/securiser.sh
# Rejouable sans risque : chaque étape écrit l'état voulu, elle ne l'ajoute pas.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# Écrit l'entrée standard dans un fichier de configuration lisible par tous.
ecrire() { cat > "$1"; chmod 644 "$1"; }

echo '== Paquets'
apt-get update -q
apt-get -y -q full-upgrade
apt-get -y -q install ufw fail2ban nginx certbot python3-certbot-nginx unattended-upgrades rsync

echo '== SSH : clés seulement, jamais root'
# Le préfixe 10- passe avant 50-cloud-init.conf : pour sshd, la première valeur lue l'emporte.
ecrire /etc/ssh/sshd_config.d/10-durcissement.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
AllowAgentForwarding no
AllowUsers ubuntu deploy
EOF
sshd -t
systemctl reload ssh 2>/dev/null || systemctl restart ssh

echo '== Pare-feu : SSH (limité en débit), HTTP, HTTPS'
ufw default deny incoming
ufw default allow outgoing
ufw limit OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo '== fail2ban : bannit les adresses qui insistent sur SSH'
ecrire /etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
bantime.increment = true
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo '== Mises à jour de sécurité automatiques, redémarrage la nuit si le noyau change'
ecrire /etc/apt/apt.conf.d/52-pocharlume <<'EOF'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF

echo '== nginx : ne pas annoncer sa version'
# nginx.conf d'Ubuntu déclare déjà server_tokens : on change sa valeur plutôt que de la redéclarer.
rm -f /etc/nginx/conf.d/10-securite.conf
sed -i -E 's/^(\s*)#?\s*server_tokens\s+[a-z]+;/\1server_tokens off;/' /etc/nginx/nginx.conf
nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo '== Fait'
