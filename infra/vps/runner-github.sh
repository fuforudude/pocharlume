#!/usr/bin/env bash
# Runner GitHub Actions auto-hébergé pour le dépôt privé fuforudude/pocharlume (relais des tests distants quand le
# quota de minutes du mois passe sous 10 % : .github/workflows/tests.yml, labels self-hosted et vps).
# À lancer en root : ssh … 'sudo bash -s' < infra/vps/runner-github.sh. Rejouable sans risque.
# Ce script N'ENREGISTRE PAS le runner auprès de GitHub : le jeton d'enregistrement est un secret valable une heure,
# l'auteur lance lui-même config.sh (commande exacte dans infra/vps/README.md), puis démarre le service.
# Le runner tourne sous l'utilisateur ghrunner (sans mot de passe, sans sudo, sans shell), en priorité basse (nice,
# ionice, CPU et mémoire bornés) : il ne doit pas ralentir les sites servis par le VPS.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# Version épinglée de l'agent et sa somme SHA-256, recopiée de la page de la version :
# https://github.com/actions/runner/releases/tag/v2.338.2 (publiée le 26 octobre 2026).
# Le runner se met ensuite à jour lui-même (GitHub refuse les runners trop anciens) ; ce script ne le rétrograde jamais.
VERSION_RUNNER=2.338.2
SHA256_RUNNER=baebf204307bac6193480852732f0aba2ae97b6c5597c244f4d5558390147c40
UTILISATEUR=ghrunner
MAISON=/var/lib/ghrunner
DOSSIER=$MAISON/actions-runner
SERVICE=github-runner
# Bornes du service : 4 cœurs sur 6 au plus, mémoire plafonnée. Les fils de la passe d'équilibrage suivent
# l'affinité (os.availableParallelism) : 4 fils, les 2 autres cœurs restent libres pour nginx.
COEURS=0-3
CPU_QUOTA=400%
MEMOIRE_HAUTE=3G
MEMOIRE_MAX=4G

# Écrit l'entrée standard dans un fichier de configuration lisible par tous.
ecrire() { cat > "$1"; chmod 644 "$1"; }

echo '== Paquets'
apt-get update -q
apt-get -y -q install ca-certificates curl gnupg git tar

echo '== Node 24 (dépôt apt de NodeSource, clé vérifiée par apt)'
install -d -m 755 /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
chmod 644 /etc/apt/keyrings/nodesource.gpg
ecrire /etc/apt/sources.list.d/nodesource.list <<'EOF'
deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main
EOF
# Le paquet de NodeSource passe devant celui d'Ubuntu, quelle que soit sa version.
ecrire /etc/apt/preferences.d/nodesource <<'EOF'
Package: nodejs
Pin: origin deb.nodesource.com
Pin-Priority: 600
EOF
apt-get update -q
apt-get -y -q install nodejs
case "$(node --version)" in
  v24.*) echo "Node $(node --version)" ;;
  *) echo "Node 24 attendu, trouvé $(node --version)" >&2; exit 1 ;;
esac

echo "== Utilisateur $UTILISATEUR : sans mot de passe, sans shell, sans sudo"
id "$UTILISATEUR" >/dev/null 2>&1 || useradd --system --home-dir "$MAISON" --create-home --shell /usr/sbin/nologin "$UTILISATEUR"
usermod --shell /usr/sbin/nologin "$UTILISATEUR"
passwd --lock "$UTILISATEUR" >/dev/null
# Aucun groupe d'administration, aucune règle sudo.
for groupe in sudo adm docker lxd; do
  if id -nG "$UTILISATEUR" | tr ' ' '\n' | grep -qx "$groupe"; then gpasswd -d "$UTILISATEUR" "$groupe"; fi
done
rm -f "/etc/sudoers.d/$UTILISATEUR"
install -d -m 750 -o "$UTILISATEUR" -g "$UTILISATEUR" "$MAISON" "$DOSSIER"

echo "== Agent actions/runner $VERSION_RUNNER"
installee=''
if [ -x "$DOSSIER/bin/Runner.Listener" ]; then
  installee="$(sudo -u "$UTILISATEUR" "$DOSSIER/bin/Runner.Listener" --version 2>/dev/null || true)"
fi
if [ -n "$installee" ] && [ "$(printf '%s\n%s\n' "$VERSION_RUNNER" "$installee" | sort -V | tail -n 1)" = "$installee" ]; then
  echo "Déjà installé : $installee (pas de rétrogradation)."
else
  archive="actions-runner-linux-x64-$VERSION_RUNNER.tar.gz"
  temporaire="$(mktemp -d)"
  trap 'rm -rf "$temporaire"' EXIT
  curl -fsSL -o "$temporaire/$archive" "https://github.com/actions/runner/releases/download/v$VERSION_RUNNER/$archive"
  echo "$SHA256_RUNNER  $temporaire/$archive" | sha256sum -c -
  # Le service s'arrête le temps de remplacer les fichiers ; .runner et .credentials (enregistrement) sont gardés.
  systemctl stop "$SERVICE" 2>/dev/null || true
  tar -xzf "$temporaire/$archive" -C "$DOSSIER"
  chown -R "$UTILISATEUR:$UTILISATEUR" "$DOSSIER"
fi
# Bibliothèques dont l'agent a besoin (libicu, etc.), par le script fourni avec lui.
"$DOSSIER/bin/installdependencies.sh" || echo 'Avertissement : installdependencies.sh a échoué, vérifier que libicu est installé (apt-get install libicu-dev).' >&2

echo "== Service systemd $SERVICE : priorité basse, ressources bornées"
ecrire "/etc/systemd/system/$SERVICE.service" <<EOF
[Unit]
Description=Runner GitHub Actions (fuforudude/pocharlume, labels self-hosted et vps)
After=network-online.target
Wants=network-online.target
# Ne démarre qu'une fois le runner enregistré par config.sh (voir infra/vps/README.md).
ConditionPathExists=$DOSSIER/.runner

[Service]
User=$UTILISATEUR
Group=$UTILISATEUR
WorkingDirectory=$DOSSIER
ExecStart=$DOSSIER/run.sh
Environment=HOME=$MAISON
Restart=on-failure
RestartSec=30
KillMode=process
KillSignal=SIGTERM
TimeoutStopSec=5min

# Priorité basse : les sites passent toujours devant.
Nice=15
CPUSchedulingPolicy=batch
IOSchedulingClass=idle
CPUAffinity=$COEURS
CPUQuota=$CPU_QUOTA
MemoryHigh=$MEMOIRE_HAUTE
MemoryMax=$MEMOIRE_MAX
TasksMax=2048
# Tué en premier si la mémoire du VPS vient à manquer.
OOMScoreAdjust=500

# Cloisonnement : système en lecture seule sauf son dossier, /tmp privé, pas d'élévation de privilèges.
ProtectSystem=strict
ReadWritePaths=$MAISON
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
NoNewPrivileges=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictSUIDSGID=yes

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null
if [ -e "$DOSSIER/.runner" ]; then
  systemctl restart "$SERVICE"
  echo "Runner enregistré : service redémarré."
else
  echo "Runner pas encore enregistré : lancer config.sh (infra/vps/README.md), puis systemctl start $SERVICE."
fi

echo '== Fait'
