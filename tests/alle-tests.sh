#!/usr/bin/env bash
# Führt alle Prüfungen aus: erst die seitenübergreifenden, dann die fachlichen
# Einzelprüfungen unter themen/.
#
# Aufruf:  bash tests/alle-tests.sh            (alles)
#          bash tests/alle-tests.sh trigono    (nur passende Dateinamen)
set -u

HIER="$(cd "$(dirname "$0")" && pwd)"
WURZEL="$(dirname "$HIER")"
PORT="${UPLANT_PORT:-8936}"
NODE="${UPLANT_NODE:-/opt/node22/bin/node}"
export NODE_PATH="${NODE_PATH:-/opt/node22/lib/node_modules}"
export UPLANT_PORT="$PORT"
FILTER="${1:-}"

# Prüfserver starten, falls noch keiner läuft.
EIGENER=""
if ! curl -sf -o /dev/null "http://127.0.0.1:$PORT/index.html"; then
  python3 "$HIER/server.py" >/dev/null 2>&1 &
  EIGENER=$!
  for _ in $(seq 1 40); do
    curl -sf -o /dev/null "http://127.0.0.1:$PORT/index.html" && break
    sleep 0.25
  done
fi
aufraeumen() { [ -n "$EIGENER" ] && kill "$EIGENER" 2>/dev/null; }
trap aufraeumen EXIT

DATEIEN=$(find "$HIER" -name "test-*.js" | sort)
GRUEN=0
ROT=0
ROTE_DATEIEN=""

for datei in $DATEIEN; do
  name="${datei#$HIER/}"
  [ -n "$FILTER" ] && case "$name" in *"$FILTER"*) ;; *) continue ;; esac
  echo "── $name"
  if AUSGABE=$("$NODE" "$datei" 2>&1); then
    echo "$AUSGABE" | tail -1
    GRUEN=$((GRUEN + 1))
  else
    echo "$AUSGABE"
    ROT=$((ROT + 1))
    ROTE_DATEIEN="$ROTE_DATEIEN $name"
  fi
done

echo
echo "════ $GRUEN grün, $ROT rot"
[ "$ROT" -gt 0 ] && { echo "rot:$ROTE_DATEIEN"; exit 1; }
exit 0
