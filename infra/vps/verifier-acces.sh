#!/usr/bin/env bash
# Vérifie le mot de passe d'accès au site, depuis le VPS : ssh … 'bash -s' < infra/vps/verifier-acces.sh
# Mot de passe attendu en argument (par défaut celui du script) : bash -s -- 1234567890. Sort en erreur au premier écart.
set -uo pipefail
MOT_DE_PASSE=${1:-1234567890}
RACINE=/var/www/pocharlume
ECHECS=0
ASSET=$(ls "$RACINE/assets" 2>/dev/null | head -1)
[ -n "$ASSET" ] || { echo "Aucun fichier dans $RACINE/assets"; exit 2; }

# attendre <libellé> <code attendu> <présence "oui"/"non" du texte> <texte> <domaine> <chemin> [cookie]
verifier() {
  local libelle=$1 code=$2 present=$3 texte=$4 domaine=$5 chemin=$6 cookie=${7:-}
  local corps statut trouve=non
  local args=(-sk --resolve "$domaine:443:127.0.0.1" -o /tmp/acces-corps.$$ -w '%{http_code}')
  [ -n "$cookie" ] && args+=(-H "Cookie: $cookie")
  statut=$(curl "${args[@]}" "https://$domaine$chemin")
  grep -q -- "$texte" /tmp/acces-corps.$$ && trouve=oui
  if [ "$statut" = "$code" ] && [ "$trouve" = "$present" ]; then
    echo "OK   $domaine$chemin ${cookie:+[$cookie] }-> $statut, \"$texte\" $trouve ($libelle)"
  else
    echo "ECHEC $domaine$chemin ${cookie:+[$cookie] }-> $statut (attendu $code), \"$texte\" $trouve (attendu $present) ($libelle)"
    ECHECS=$((ECHECS + 1))
  fi
  rm -f /tmp/acces-corps.$$
}

for d in pocharlume.fr travail.pocharlume.fr; do
  # Le jeu : repère le point de montage de index.html, présent seulement dans le vrai jeu.
  MARQUE=$(grep -o '<title>[^<]*</title>' "$RACINE/index.html" | head -1)
  verifier 'sans cookie : page de connexion' 401 oui 'Mot de passe' "$d" /
  verifier 'sans cookie : le jeu n est pas servi' 401 non "$MARQUE" "$d" /
  verifier 'sans cookie : chemin quelconque' 401 oui 'Mot de passe' "$d" /nimporte/quoi
  verifier 'sans cookie : asset refusé' 401 non "$(head -c 20 "$RACINE/assets/$ASSET" | tr -d '\0\n' | head -c 8)" "$d" "/assets/$ASSET"
  verifier 'robots.txt public' 200 oui 'Disallow: /' "$d" /robots.txt
  verifier 'script de la page de connexion public' 200 oui 'pocharlume_acces' "$d" /__acces/acces.js
  verifier 'bon cookie : le jeu' 200 oui "$MARQUE" "$d" / "pocharlume_acces=$MOT_DE_PASSE"
  verifier 'bon cookie : asset servi' 200 non 'Mot de passe incorrect' "$d" "/assets/$ASSET" "pocharlume_acces=$MOT_DE_PASSE"
  verifier 'mauvais cookie' 401 oui 'Mot de passe' "$d" / 'pocharlume_acces=faux'
  verifier 'cookie vide' 401 oui 'Mot de passe' "$d" / 'pocharlume_acces='
done

# Les défis Let's Encrypt restent publics (en HTTP) : un 404 nginx, pas la page de connexion.
mkdir -p /var/www/acme/.well-known/acme-challenge 2>/dev/null
for d in pocharlume.fr travail.pocharlume.fr; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --resolve "$d:80:127.0.0.1" "http://$d/.well-known/acme-challenge/absent")
  if [ "$code" = 404 ]; then echo "OK   $d acme-challenge -> 404 (pas de mot de passe)"; else echo "ECHEC $d acme-challenge -> $code (attendu 404)"; ECHECS=$((ECHECS + 1)); fi
done
# Redirection HTTP -> HTTPS inchangée
for d in pocharlume.fr travail.pocharlume.fr; do
  loc=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --resolve "$d:80:127.0.0.1" "http://$d/x")
  echo "INFO $d http://$d/x -> $loc"
done
echo "== $ECHECS échec(s)"
[ "$ECHECS" = 0 ]
