#!/usr/bin/env bash
# Runner GitHub Actions auto-hébergé pour le dépôt privé fuforudude/pocharlume (relais des tests distants quand le
# quota de minutes du mois passe sous 10 % : .github/workflows/tests.yml, labels self-hosted et vps).
# À lancer en root : ssh … 'sudo bash -s' < infra/vps/runner-github.sh. Rejouable : une installation interrompue est
# reprise au rejeu, et le service est relancé s'il tournait. FORCER=1 (ssh … 'sudo FORCER=1 bash -s' < …) réinstalle
# l'agent depuis l'archive vérifiée même s'il est déjà en place (avant un nouvel enregistrement, voir le README).
# Ce script N'ENREGISTRE PAS le runner auprès de GitHub : le jeton d'enregistrement est un secret valable une heure,
# l'auteur lance lui-même config.sh (commande exacte dans infra/vps/README.md), puis démarre le service.
#
# Le code des jobs (celui de la branche, et les paquets npm qu'elle installe) n'est pas maîtrisé. Règles :
# - les jobs tournent sous ghrunner (sans mot de passe, sans sudo, sans shell), dans un service systemd cloisonné :
#   pas d'accès à la boucle locale ni aux réseaux privés (telechargements et taches injoignables), dossiers des autres
#   services invisibles, aucune capacité, priorité CPU « idle », débit disque et mémoire bornés ;
# - root n'exécute, ne lit ni ne suit jamais un fichier que ghrunner peut écrire : l'agent est extrait dans un dossier
#   temporaire de root, copié dans un dossier de version, puis mis en service d'un coup par un lien que seul root
#   peut changer ; les fichiers d'enregistrement sont recopiés par ghrunner lui-même ;
# - Node n'est PAS installé sur le système : actions/setup-node le fournit à chaque job (dans _work/_tool) et l'agent
#   apporte le sien. Le Node du serveur (NodeSource 22, épinglé par notion-tool/infra/installer.sh) n'est pas touché.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
umask 022

# Version épinglée de l'agent et sa somme SHA-256, recopiée de la page de la version :
# https://github.com/actions/runner/releases/tag/v2.338.2 (publiée le 26 octobre 2026).
# L'agent se met ensuite à jour lui-même dans son dossier de version (GitHub refuse les runners trop anciens).
VERSION_RUNNER=2.338.2
SHA256_RUNNER=baebf204307bac6193480852732f0aba2ae97b6c5597c244f4d5558390147c40
UTILISATEUR=ghrunner
# RACINE et VERSIONS appartiennent à root : ghrunner ne peut y créer, y remplacer ni y effacer aucune entrée.
RACINE=/var/lib/ghrunner
MAISON=$RACINE/maison
VERSIONS=$RACINE/versions
DOSSIER=$RACINE/actions-runner
CROCHETS=/usr/local/lib/ghrunner
SERVICE=github-runner
# Bornes du service : 4 cœurs sur 6 au plus, mémoire plafonnée sans swap, débit disque borné. Les fils de la passe
# d'équilibrage suivent l'affinité (os.availableParallelism) : 4 fils, les 2 autres cœurs restent libres pour nginx.
COEURS=0-3
CPU_QUOTA=400%
MEMOIRE_HAUTE=3G
MEMOIRE_MAX=4G
DEBIT_LECTURE=80M
DEBIT_ECRITURE=40M
# Sous cet espace libre (Go) sur le disque de /var/lib, un job est refusé au démarrage (crochet de début de job).
SEUIL_LIBRE_GO=10
# Au-delà de ces tailles (Mo), les caches sont vidés en fin de job ; les journaux de l'agent sont gardés 7 jours.
MAX_CACHE_MO=2048
MAX_OUTILS_MO=3072
JOURS_DIAG=7
# Fichiers d'enregistrement de l'agent, gardés d'une version à l'autre.
FICHIERS_ENREGISTREMENT='.runner .credentials .credentials_rsaparams .env .path'

# Écrit l'entrée standard dans un fichier de configuration de root, lisible par tous.
ecrire() { cat > "$1"; chmod 644 "$1"; chown root:root "$1"; }
# Un chemin de root ne doit jamais être un lien symbolique (planté à l'avance).
pas_un_lien() { if [ -L "$1" ]; then echo "$1 est un lien symbolique : refus (à examiner à la main)." >&2; exit 1; fi; }
# Le premier paquet de la liste qu'apt sait installer.
candidat() { apt-cache policy "$1" 2>/dev/null | awk '/Candidate:/ { print $2; exit }'; }
premier_disponible() {
  local paquet version
  for paquet in "$@"; do
    version="$(candidat "$paquet")"
    if [ -n "$version" ] && [ "$version" != '(none)' ]; then echo "$paquet"; return 0; fi
  done
  return 1
}

# En cas d'échec en cours de route : dossier temporaire supprimé, service relancé s'il tournait avant.
temporaire=''
etait_actif=non
if systemctl is-active --quiet "$SERVICE" 2>/dev/null; then etait_actif=oui; fi
nettoyer() {
  if [ -n "$temporaire" ]; then rm -rf -- "$temporaire"; fi
  if [ "$etait_actif" = oui ] && ! systemctl is-active --quiet "$SERVICE" && [ -e "$DOSSIER/.runner" ]; then
    systemctl start "$SERVICE" || echo "Le service $SERVICE n'a pas redémarré : systemctl status $SERVICE." >&2
  fi
}
trap nettoyer EXIT

echo '== Paquets (dont les bibliothèques de l’agent, sans exécuter son installdependencies.sh)'
apt-get update -q
apt-get -y -q install ca-certificates curl git tar coreutils util-linux
# Liste reprise de bin/installdependencies.sh de la version épinglée (branche Debian/Ubuntu), avec les mêmes replis :
# libkrb5-3, zlib1g, liblttng-ust, libssl, libicu.
lttng="$(premier_disponible liblttng-ust1t64 liblttng-ust1 liblttng-ust0)" || { echo 'Aucun paquet liblttng-ust disponible.' >&2; exit 1; }
ssl="$(premier_disponible libssl3t64 libssl3 libssl1.1)" || { echo 'Aucun paquet libssl disponible.' >&2; exit 1; }
icu="$(premier_disponible libicu80 libicu79 libicu78 libicu77 libicu76 libicu75 libicu74 libicu73 libicu72 libicu71 libicu70)" || { echo 'Aucun paquet libicu disponible.' >&2; exit 1; }
apt-get -y -q install libkrb5-3 zlib1g "$lttng" "$ssl" "$icu"

echo "== Utilisateur $UTILISATEUR : sans mot de passe, sans shell, sans sudo"
pas_un_lien "$RACINE"
install -d -m 755 -o root -g root "$RACINE"
chown root:root "$RACINE"; chmod 755 "$RACINE"
if id "$UTILISATEUR" >/dev/null 2>&1; then
  usermod --home "$MAISON" --shell /usr/sbin/nologin "$UTILISATEUR"
else
  useradd --system --home-dir "$MAISON" --no-create-home --shell /usr/sbin/nologin "$UTILISATEUR"
fi
passwd --lock "$UTILISATEUR" >/dev/null
# Aucun groupe d'administration, aucune règle sudo.
for groupe in sudo adm docker lxd; do
  if id -nG "$UTILISATEUR" | tr ' ' '\n' | grep -qx "$groupe"; then gpasswd -d "$UTILISATEUR" "$groupe"; fi
done
rm -f "/etc/sudoers.d/$UTILISATEUR"
pas_un_lien "$MAISON"; pas_un_lien "$VERSIONS"; pas_un_lien "$CROCHETS"
install -d -m 700 -o "$UTILISATEUR" -g "$UTILISATEUR" "$MAISON"
install -d -m 755 -o root -g root "$VERSIONS" "$CROCHETS"
chown root:root "$VERSIONS" "$CROCHETS"; chmod 755 "$VERSIONS" "$CROCHETS"

echo "== Agent actions/runner $VERSION_RUNNER"
# Témoin écrit par root, hors de portée de ghrunner, seulement après une installation complète (lien en place).
temoin="$RACINE/installe-$VERSION_RUNNER"
if [ -f "$temoin" ] && [ -L "$DOSSIER" ] && [ "${FORCER:-0}" != 1 ]; then
  echo "Déjà installé ($(cat "$temoin")). L'agent a pu se mettre à jour lui-même depuis : c'est voulu."
else
  archive="actions-runner-linux-x64-$VERSION_RUNNER.tar.gz"
  temporaire="$(mktemp -d)"   # dossier de root, 0700
  curl -fsSL -o "$temporaire/$archive" "https://github.com/actions/runner/releases/download/v$VERSION_RUNNER/$archive"
  echo "$SHA256_RUNNER  $temporaire/$archive" | sha256sum -c -
  install -d -m 700 "$temporaire/agent"
  tar -xzf "$temporaire/$archive" -C "$temporaire/agent" --no-same-owner
  if [ ! -x "$temporaire/agent/bin/Runner.Listener" ] || [ ! -x "$temporaire/agent/run.sh" ]; then echo 'Archive incomplète.' >&2; exit 1; fi

  nom="$VERSION_RUNNER-$(date +%Y%m%d%H%M%S)"
  nouveau="$VERSIONS/$nom"
  # Copie dans un dossier provisoire de VERSIONS (à root), puis remise à ghrunner : l'agent se met à jour lui-même
  # et écrit _work et _diag dans son dossier. chown -h : les liens de l'archive sont changés, jamais leur cible.
  cp -a -- "$temporaire/agent" "$nouveau.provisoire"
  chown -R -h -P "$UTILISATEUR:$UTILISATEUR" "$nouveau.provisoire"
  chmod 750 "$nouveau.provisoire"

  # Le service s'arrête le temps de basculer. Les fichiers d'enregistrement de la version en place sont recopiés
  # par ghrunner lui-même (root ne lit rien de son dossier) ; un lien symbolique n'est ni suivi ni copié.
  systemctl stop "$SERVICE" 2>/dev/null || true
  precedent=''
  if [ -L "$DOSSIER" ]; then
    precedent="$(basename "$(readlink "$DOSSIER")")"
    # shellcheck disable=SC2016 # $1, $2 et $f sont développés par le sh lancé sous ghrunner, pas ici.
    runuser -u "$UTILISATEUR" -- /bin/sh -c 'for f in '"$FICHIERS_ENREGISTREMENT"'; do if [ -f "$1/$f" ] && [ ! -L "$1/$f" ]; then cp -P -p -- "$1/$f" "$2/$f"; fi; done' sh "$VERSIONS/$precedent" "$nouveau.provisoire"
  elif [ -e "$DOSSIER" ]; then
    echo "$DOSSIER existe et n'est pas un lien (ancienne installation ?) : à retirer à la main avant de rejouer." >&2
    exit 1
  fi
  mv -T -- "$nouveau.provisoire" "$nouveau"
  # Bascule d'un coup : nouveau lien à côté, puis renommage par-dessus l'ancien.
  ln -sfn "versions/$nom" "$DOSSIER.nouveau"
  mv -T -- "$DOSSIER.nouveau" "$DOSSIER"
  echo "$nom" > "$temoin"; chmod 644 "$temoin"
  echo "Installé dans $nouveau."
  # Garde la version en place et la précédente ; efface les autres et les restes provisoires (rm ne suit pas les liens).
  find "$VERSIONS" -mindepth 1 -maxdepth 1 ! -name "$nom" ! -name "${precedent:-.}" -exec rm -rf --one-file-system -- {} +
  find "$RACINE" -maxdepth 1 -name 'installe-*' ! -name "installe-$VERSION_RUNNER" -delete
fi

echo '== Crochets de début et de fin de job (place sur le disque)'
# Dans un dossier de root : un job ne peut pas les neutraliser. Ils tournent sous ghrunner, dans le service.
ecrire "$CROCHETS/purger.sh" <<EOF
#!/bin/bash
# Vide ce que les jobs laissent : copies du dépôt (node_modules compris), caches trop gros, vieux journaux de l'agent.
# Lancé sous $UTILISATEUR par les crochets de job (installé par infra/vps/runner-github.sh).
set -u
travail=$DOSSIER/_work
taille_mo() { local t; t="\$(du -s -BM -- "\$1" 2>/dev/null | cut -f1 | tr -dc '0-9')"; echo "\${t:-0}"; }
if [ -d "\$travail" ]; then
  # Les dossiers sans « _ » en tête sont les copies des dépôts ; _tool (Node de setup-node) reste s'il est petit.
  find "\$travail" -mindepth 1 -maxdepth 1 -type d ! -name '_*' -exec rm -rf -- {} +
  if [ -d "\$travail/_tool" ] && [ "\$(taille_mo "\$travail/_tool")" -gt $MAX_OUTILS_MO ]; then rm -rf -- "\$travail/_tool"; fi
fi
for cache in $MAISON/.npm $MAISON/.cache; do
  if [ -d "\$cache" ] && [ "\$(taille_mo "\$cache")" -gt $MAX_CACHE_MO ]; then rm -rf -- "\$cache"; fi
done
if [ -d $DOSSIER/_diag ]; then find $DOSSIER/_diag -type f -mtime +$JOURS_DIAG -delete; fi
exit 0
EOF
ecrire "$CROCHETS/debut-job.sh" <<EOF
#!/bin/bash
# Crochet ACTIONS_RUNNER_HOOK_JOB_STARTED : refuse le job si le disque des sites est presque plein (un disque plein
# casse telechargements, les bases SQLite, les journaux nginx et le renouvellement des certificats).
set -u
libre_go() { local l; l="\$(df --output=avail -BG -- $RACINE | tail -n 1 | tr -dc '0-9')"; echo "\${l:-0}"; }
if [ "\$(libre_go)" -lt $SEUIL_LIBRE_GO ]; then bash $CROCHETS/purger.sh; fi
libre="\$(libre_go)"
if [ "\$libre" -lt $SEUIL_LIBRE_GO ]; then
  echo "::error title=Disque du VPS::\$libre Go libres, sous le seuil de $SEUIL_LIBRE_GO Go : job refusé pour protéger les sites. Relancer sur GitHub (entrée machine=github)."
  exit 1
fi
exit 0
EOF
ecrire "$CROCHETS/fin-job.sh" <<EOF
#!/bin/bash
# Crochet ACTIONS_RUNNER_HOOK_JOB_COMPLETED : purge, sans jamais faire échouer le job.
bash $CROCHETS/purger.sh || true
exit 0
EOF
chmod 755 "$CROCHETS"/*.sh

echo '== Résolveur DNS et disque de /var/lib'
# Dans la boucle locale, le runner n'a droit qu'au résolveur DNS (systemd-resolved : 127.0.0.53 en général).
resolveurs="$(awk '$1 == "nameserver" { sub(/%.*/, "", $2); print $2 }' /etc/resolv.conf | grep -E '^[0-9A-Fa-f:.]+$' | sort -u | tr '\n' ' ' | sed 's/ $//' || true)"
if [ -z "$resolveurs" ]; then echo 'Aucun résolveur dans /etc/resolv.conf : le DNS des jobs ne marcherait pas.' >&2; exit 1; fi
echo "Résolveurs autorisés : $resolveurs"
# Disque entier qui porte /var/lib (io.max se règle sur le disque) ; à défaut, systemd retrouve le disque du chemin.
source_fs="$(findmnt -n -o SOURCE --target /var/lib 2>/dev/null | sed 's/\[.*\]$//' || true)"
disque="$(lsblk -nrso NAME,TYPE "$source_fs" 2>/dev/null | awk '$2 == "disk" { print $1 }' | tail -n 1 || true)"
if [ -n "$disque" ] && [ -b "/dev/$disque" ]; then peripherique="/dev/$disque"; else peripherique=/var/lib; fi
echo "Débit disque borné sur : $peripherique"

echo "== Service systemd $SERVICE : priorité basse, ressources bornées, cloisonné"
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
Environment=ACTIONS_RUNNER_HOOK_JOB_STARTED=$CROCHETS/debut-job.sh
Environment=ACTIONS_RUNNER_HOOK_JOB_COMPLETED=$CROCHETS/fin-job.sh
Restart=on-failure
RestartSec=30
# L'agent reçoit SIGTERM et finit proprement ; tout autre processus du service (un processus détaché par un job)
# reçoit SIGKILL : rien ne survit à un arrêt ou un redémarrage.
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=5min

# Priorité basse : les sites passent toujours devant. CPUWeight=idle joue entre services (cgroup v2), Nice seulement
# à l'intérieur du service ; IOSchedulingClass n'agit qu'avec l'ordonnanceur BFQ, d'où les débits bornés (io.max).
CPUWeight=idle
Nice=15
CPUSchedulingPolicy=batch
IOSchedulingClass=idle
IOReadBandwidthMax=$peripherique $DEBIT_LECTURE
IOWriteBandwidthMax=$peripherique $DEBIT_ECRITURE
CPUAffinity=$COEURS
CPUQuota=$CPU_QUOTA
MemoryHigh=$MEMOIRE_HAUTE
MemoryMax=$MEMOIRE_MAX
# Pas de swap : à MemoryHigh, le noyau enverrait des pages dans le swap et ralentirait toute la machine.
MemorySwapMax=0
TasksMax=2048
# Tué en premier si la mémoire du VPS vient à manquer.
OOMScoreAdjust=500

# Réseau : Internet seulement (GitHub, npm). Ni la boucle locale (telechargements 127.0.0.1:3100, taches :3200, API à
# venir), ni les adresses de lien local (169.254.169.254), ni les réseaux privés ; seul le résolveur DNS local passe
# (IPAddressAllow l'emporte sur IPAddressDeny).
IPAddressDeny=localhost link-local multicast 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 100.64.0.0/10 fc00::/7
IPAddressAllow=$resolveurs
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX

# Fichiers : système en lecture seule sauf son dossier, /tmp privé, dossiers des autres services invisibles
# (« - » : pas d'erreur si le chemin n'existe pas), processus des autres comptes invisibles.
ProtectSystem=strict
ReadWritePaths=$RACINE
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
InaccessiblePaths=-/etc/letsencrypt -/etc/notion-tool -/var/lib/telechargements -/var/lib/taches -/srv -/opt -/var/backups -/etc/ssh -/etc/nginx -/var/www
ProtectProc=invisible
UMask=0077

# Noyau et privilèges : aucune capacité, pas d'élévation, pas d'espace de noms. Pas de ProcSubset=pid (os.cpus()
# rendrait une liste vide et casserait le calcul des fils), pas de MemoryDenyWriteExecute (le JIT de Node en a besoin).
NoNewPrivileges=yes
CapabilityBoundingSet=
RestrictSUIDSGID=yes
RestrictNamespaces=yes
RestrictRealtime=yes
LockPersonality=yes
SystemCallArchitectures=native
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes
ProtectControlGroups=yes
ProtectClock=yes
ProtectHostname=yes

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
